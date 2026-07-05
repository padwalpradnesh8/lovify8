import { EventBus } from "../core/event-bus.js";

import { DOM } from "../core/dom.js";

import { AppState } from "../core/app-state.js";

import { toast } from "./toast.js";

import {
  openCreatorAuth,
} from "../auth/auth-helpers.js";

import { AuthModule } from "../auth/auth-module.js";

import {
  openCreatorOnboardingModal,
} from "../auth/auth-helpers.js";

function closeCreatorOnboarding() {
  DOM.creatorOnboardingModal?.classList.add(
    "hidden"
  );

  DOM.creatorOnboardingModal?.setAttribute(
    "aria-hidden",
    "true"
  );
}

function showPage(page) {
  if (page === "dashboard") {
    DOM.homePage?.classList.add("hidden");

    DOM.dashboardPage?.classList.remove("hidden");
  } else {
    DOM.homePage?.classList.remove("hidden");

    DOM.dashboardPage?.classList.add("hidden");
  }
}

function closeMenu() {
  DOM.appMenu?.classList.add("hidden");

  DOM.appMenu?.setAttribute(
    "aria-hidden",
    "true"
  );

  DOM.menuToggleBtn?.setAttribute(
    "aria-expanded",
    "false"
  );
}

function toggleMenu() {
  const isHidden =
    DOM.appMenu?.classList.contains("hidden");

  if (isHidden) {
    DOM.appMenu?.classList.remove("hidden");

    DOM.appMenu?.setAttribute(
      "aria-hidden",
      "false"
    );

    DOM.menuToggleBtn?.setAttribute(
      "aria-expanded",
      "true"
    );

    return;
  }

  closeMenu();
}

function syncNavbar() {
    /*
  |--------------------------------------------------------------------------
  | Transitional State Resolution
  |--------------------------------------------------------------------------
  */

  const authState =
    AppState.get("auth");

  const creatorState =
    AppState.get("creator");

  const legacyUser =
    AppState.get("user");

  /*
  |--------------------------------------------------------------------------
  | Auth Domain
  |--------------------------------------------------------------------------
  */

  const authenticated =
    authState?.authenticated ||
    !!legacyUser;

  const user =
    authState?.user || legacyUser;

  /*
  |--------------------------------------------------------------------------
  | Creator Domain
  |--------------------------------------------------------------------------
  */

  const creatorProfile =
    creatorState?.profile;

  const isApprovedCreator =
    creatorState?.approved === true ||

    (
      legacyUser?.role === "creator" &&
      legacyUser?.approved === true
    );

  const isPendingCreator =
    creatorProfile?.approval_status ===
    "pending";

  if (isApprovedCreator) {
    DOM.dashboardNavBtn?.classList.remove(
      "hidden"
    );

    document.body.classList.add(
      "creator-navbar-active"
    );
  } else {
    DOM.dashboardNavBtn?.classList.add(
      "hidden"
    );

    document.body.classList.remove(
      "creator-navbar-active"
    );

    if (
      DOM.dashboardPage &&
      !DOM.dashboardPage.classList.contains(
        "hidden"
      )
    ) {
      showPage("home");
    }
  }

if (authenticated) {
    DOM.openAuthBtn?.classList.add("hidden");

    DOM.logoutBtn?.classList.remove("hidden");

    DOM.menuLogoutBtn?.classList.remove(
      "hidden"
    );
  } else {
    DOM.openAuthBtn?.classList.remove("hidden");

    DOM.logoutBtn?.classList.add("hidden");

    DOM.menuLogoutBtn?.classList.add(
      "hidden"
    );
  }

  if (!isApprovedCreator) {
    DOM.menuBecomeArtistBtn?.classList.remove(
      "hidden"
    );
  } else {
    DOM.menuBecomeArtistBtn?.classList.add(
      "hidden"
    );
  }

if (isPendingCreator) {
  DOM.creatorPendingState?.classList.remove(
    "hidden"
  );

  if (
    !sessionStorage.getItem(
      "creator_pending_toast"
    )
  ) {
    toast(
      "Your artist profile is under review"
    );

    sessionStorage.setItem(
      "creator_pending_toast",
      "true"
    );
  }
} else {
  DOM.creatorPendingState?.classList.add(
    "hidden"
  );
}
}

function initBottomNavbar() {
  DOM.navButtons?.forEach((button) => {
    button.addEventListener("click", () => {
      const page = button.dataset.page;

      if (
        page === "dashboard" &&
        DOM.dashboardNavBtn?.classList.contains(
          "hidden"
        )
      ) {
        return;
      }

      showPage(page);

      closeMenu();
    });
  });
}

function initMenu() {
  DOM.menuToggleBtn?.addEventListener(
    "click",
    toggleMenu
  );

  DOM.menuBecomeArtistBtn?.addEventListener(
    "click",
    () => {
      closeMenu();

      openCreatorAuth();
    }
  );

  DOM.menuLogoutBtn?.addEventListener(
    "click",
    async () => {
      closeMenu();

      await AuthModule.logout();
    }
  );
}

initBottomNavbar();

initMenu();

EventBus.on("state:user", () => {
  syncNavbar();
});

EventBus.on("state:auth", () => {
  syncNavbar();
});

EventBus.on("state:creator", () => {
  syncNavbar();
});

/*
|--------------------------------------------------------------------------
| Creator Lifecycle Events
|--------------------------------------------------------------------------
*/

EventBus.on(
  "creator:missing-profile",
  () => {
    openCreatorOnboardingModal();
  }
);

EventBus.on(
  "creator:profile-loaded",
  () => {
    closeCreatorOnboarding();
  }
);

DOM.closeCreatorOnboardingBtn?.addEventListener(
  "click",
  closeCreatorOnboarding
);