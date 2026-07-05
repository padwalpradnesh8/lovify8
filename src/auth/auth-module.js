import { AppState } from "../core/app-state.js";
import { Cache } from "../core/cache.js";
import { Logger } from "../core/logger.js";
import { ErrorHandler } from "../core/error-handler.js";
import { EventBus } from "../core/event-bus.js";
import { Utils } from "../utils/utils.js";
import { DOM } from "../core/dom.js";
import {
  closeAuthModal,
} from "./auth-helpers.js";
import { toast } from "../ui/toast.js";
import { CreatorModule } from "../creator/creator-module.js";

export const AuthModule = (() => {
  let authInitialized = false;
  let checkingUser = false;
  let checkUserPromise = null;
  
 async function authenticateCreator() {
  if (AppState.get("loading").auth) {
    return;
  }

  const email = Utils.sanitizeText(
    DOM.authEmail?.value
  );

  const password = Utils.sanitizeText(
    DOM.authPassword?.value
  );

  if (!email || !password) {
    toast("Enter email and password");
    return;
  }

  if (!Utils.isValidEmail(email)) {
    toast("Enter a valid email");
    return;
  }

  if (password.length < 6) {
    toast(
      "Password must be at least 6 characters"
    );

    return;
  }

  AppState.patch("loading", {
    auth: true,
  });

  Utils.setButtonLoading(
    DOM.continueAuthBtn,
    true,
    "Continuing..."
  );

  try {
    /*
    |--------------------------------------------------------------------------
    | Attempt Existing Login First
    |--------------------------------------------------------------------------
    */

    let authResult =
      await Utils.withTimeout(
        supabaseClient.auth.signInWithPassword({
          email,
          password,
        })
      );

    /*
    |--------------------------------------------------------------------------
    | Auto Signup Fallback
    |--------------------------------------------------------------------------
    */

    if (authResult.error) {
      const message =
        authResult.error.message?.toLowerCase?.() ||
        "";

      const shouldSignup =
        message.includes(
          "invalid login credentials"
        ) ||
        message.includes("user not found");

      if (!shouldSignup) {
        throw authResult.error;
      }

      authResult =
        await Utils.withTimeout(
          supabaseClient.auth.signUp({
            email,
            password,
          })
        );

      if (authResult.error) {
        throw authResult.error;
      }

      if (!authResult.data?.user) {
        throw new Error(
          "Account creation failed"
        );
      }

      await ensureProfile(
        authResult.data.user
      );

      toast(
        "Check your email to verify account"
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Session Restore
    |--------------------------------------------------------------------------
    */
await checkUser();

const profile =
  await CreatorModule.loadCreatorProfile();

closeAuthModal();

/*
|--------------------------------------------------------------------------
| Continue Creator Journey Immediately
|--------------------------------------------------------------------------
*/

if (!profile) {
  /*
  |--------------------------------------------------------------------------
  | No creator profile yet
  | Open onboarding immediately
  |--------------------------------------------------------------------------
  */

  EventBus.emit(
    "creator:onboarding-required"
  );
} else if (
  profile.approval_status ===
  "approved"
) {
  /*
  |--------------------------------------------------------------------------
  | Approved creator
  |--------------------------------------------------------------------------
  */

  EventBus.emit(
    "creator:approved",
    profile
  );
} else {
  /*
  |--------------------------------------------------------------------------
  | Pending creator
  |--------------------------------------------------------------------------
  */

  EventBus.emit(
    "creator:pending",
    profile
  );
}

toast("Welcome to Lovify");
  } catch (error) {
    ErrorHandler.handle(
      error,
      "Authentication failed",
      {
        module: "AuthModule",
        action: "authenticateCreator",
      }
    );
  } finally {
    AppState.patch("loading", {
      auth: false,
    });

    Utils.setButtonLoading(
      DOM.continueAuthBtn,
      false
    );
  }
}

  async function login() {
    if (AppState.get("loading").auth) return;

    const email = Utils.sanitizeText(DOM.authEmail?.value);
    const password = Utils.sanitizeText(DOM.authPassword?.value);

    if (!email || !password) {
      toast("Enter email and password");
      return;
    }

    if (!Utils.isValidEmail(email)) {
      toast("Enter a valid email");
      return;
    }

    AppState.patch("loading", {
      auth: true,
    });

    Utils.setButtonLoading(DOM.loginBtn, true, "Signing In...");

    try {
      const { data, error } =
        await Utils.withTimeout(
          supabaseClient.auth.signInWithPassword({
            email,
            password,
          })
        );

      if (error) {
        throw error;
      }

      if (!data?.user) {
        throw new Error("Invalid authentication response");
      }

      if (
        data.user.email_confirmed_at === null
      ) {
        toast("Verify your email before continuing");
      }

      await checkUser();

      closeAuthModal();

      toast("Welcome back");
    } catch (error) {
      ErrorHandler.handle(error, "Authentication failed", {
  module: "AuthModule",
  action: "login",
});

throw error;
    } finally {
      AppState.patch("loading", {
        auth: false,
      });

      Utils.setButtonLoading(DOM.loginBtn, false);
    }
  }

  async function signup() {
    if (AppState.get("loading").auth) return;

    const email = Utils.sanitizeText(DOM.authEmail?.value);
    const password = Utils.sanitizeText(DOM.authPassword?.value);

    if (!email || !password) {
      toast("Enter email and password");
      return;
    }

    if (!Utils.isValidEmail(email)) {
      toast("Enter a valid email");
      return;
    }

    if (password.length < 6) {
      toast("Password must be at least 6 characters");
      return;
    }

    AppState.patch("loading", {
      auth: true,
    });

    Utils.setButtonLoading(DOM.signupBtn, true, "Creating...");

    try {
      const { data, error } =
        await Utils.withTimeout(
          supabaseClient.auth.signUp({
            email,
            password,
          })
        );

      if (error) {
        throw error;
      }

      if (!data?.user) {
        throw new Error("Signup failed");
      }

      console.log("SIGNED UP", data);

      await ensureProfile(data.user);

      toast("Check your email to verify account");

      closeAuthModal();
    } catch (error) {
      ErrorHandler.handle(error, "Signup failed", {
        module: "AuthModule",
        action: "signup",
      });
      throw error;
    } finally {
      AppState.patch("loading", {
        auth: false,
      });

      Utils.setButtonLoading(DOM.signupBtn, false);
    }
  }

  async function ensureProfile(user) {
    if (!user?.email) {
      throw new Error("Invalid user profile");
    }

    const existing = await Utils.withTimeout(
  supabaseClient
    .from("users")
    .select("*")
    .eq("id", user.id)
    .maybeSingle()
);

    if (existing.error) {
      throw existing.error;
    }

    if (existing.data) {
      return existing.data;
    }

    const insertResult = await supabaseClient
      .from("users")
      .insert([
        {
          id: user.id,
          email: user.email,
          role: "creator",
          approved: false,
        },
      ])
      .select()
      .single();

    if (insertResult.error) {
      throw insertResult.error;
    }

    return insertResult.data;
  }

  async function checkUser() {
if (checkingUser) {
  return checkUserPromise;
}

checkingUser = true;

checkUserPromise = (async () => {

    try {
      console.log("CHECK USER");

      const cache = Cache.get("auth_user");

      if (cache?.value) {
        AppState.set("user", cache.value);
      }

      const {
        data: { user },
        error,
      } = await Utils.withTimeout(
        supabaseClient.auth.getUser()
      );

     if (error || !user) {
  AppState.set("user", null);

  AppState.patch("auth", {
    user: null,
    authenticated: false,
  });

  Cache.remove("auth_user");

  return;
}

      const result = await Utils.withTimeout(
  supabaseClient
    .from("users")
    .select("*")
    .eq("id", user.id)
    .maybeSingle()
);

      if (result.error) {
        throw result.error;
      }

      let profile = result.data;

      if (!profile) {
        profile = await ensureProfile(user);
      }

      AppState.set("user", profile);

AppState.patch("auth", {
  user: profile,
  authenticated: true,
});

Cache.set("auth_user", profile);
    } catch (error) {
      ErrorHandler.handle(error, "Session validation failed", {
        module: "AuthModule",
        action: "checkUser",
      });
} finally {
  checkingUser = false;
  checkUserPromise = null;
}
})();
return checkUserPromise;
  }

  function initListener() {
    if (authInitialized) return;

    authInitialized = true;

    supabaseClient.auth.onAuthStateChange((event) => {
      Logger.info("auth_state_change", { event });

      if (
        event === "SIGNED_IN" ||
        event === "TOKEN_REFRESHED" ||
        event === "USER_UPDATED"
      ) {
        checkUser();
      }

      if (event === "SIGNED_OUT") {
        Cache.remove("auth_user");

AppState.set("user", null);

AppState.patch("auth", {
  user: null,
  authenticated: false,
});
      }
    });
  }

  async function logout() {
    try {
      await supabaseClient.auth.signOut();

      Cache.clear();

      AppState.set("user", null);

AppState.patch("auth", {
  user: null,
  authenticated: false,
});

toast("Logged out successfully");
    } catch (error) {
      ErrorHandler.handle(error, "Logout failed", {
        module: "AuthModule",
      });
    }
  }

  return {
  authenticateCreator,
  login,
  signup,
  checkUser,
  logout,
  initListener,
};
})();