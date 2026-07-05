import { AppState } from "../core/app-state.js";

import { EventBus } from "../core/event-bus.js";

import { Logger } from "../core/logger.js";

import { ErrorHandler } from "../core/error-handler.js";

import { Utils } from "../utils/utils.js";

import { optimizeProfileImage } from "../utils/image-optimizer.js";

import { DOM } from "../core/dom.js";

import { toast } from "../ui/toast.js";

import {
  closeCreatorOnboardingModal,
} from "../auth/auth-helpers.js";

export const CreatorModule = (() => {
  let loadingProfile = false;

  async function loadCreatorProfile() {
    if (loadingProfile) return null;

    loadingProfile = true;

    AppState.patch("loading", {
      creator: true,
    });

    try {
      /*
      |--------------------------------------------------------------------------
      | Resolve Auth User
      |--------------------------------------------------------------------------
      */

      const authState =
        AppState.get("auth");

      const legacyUser =
        AppState.get("user");

      const user =
        authState?.user || legacyUser;

      if (!user?.id) {
        clearCreatorState();
        return null;
      }

      /*
      |--------------------------------------------------------------------------
      | Load Creator Profile
      |--------------------------------------------------------------------------
      */

      const result =
        await Utils.withTimeout(
          supabaseClient
            .from("creators")
            .select("*")
            .eq("user_id", user.id)
            .maybeSingle()
        );

      if (result.error) {
        throw result.error;
      }

      const profile = result.data;

      /*
      |--------------------------------------------------------------------------
      | No Creator Profile Yet
      |--------------------------------------------------------------------------
      */

      if (!profile) {
        clearCreatorState();

        EventBus.emit(
          "creator:missing-profile"
        );

        return null;
      }

      /*
      |--------------------------------------------------------------------------
      | Creator State
      |--------------------------------------------------------------------------
      */

      const approved =
        profile.approval_status ===
        "approved";

      AppState.patch("creator", {
        profile,
        approved,
        onboardingComplete: true,
      });

      /*
      |--------------------------------------------------------------------------
      | Domain Events
      |--------------------------------------------------------------------------
      */

      EventBus.emit(
        "creator:profile-loaded",
        profile
      );

      if (approved) {
        EventBus.emit(
          "creator:approved",
          profile
        );
      } else {
        EventBus.emit(
          "creator:pending",
          profile
        );
      }

      Logger.info(
        "creator_profile_loaded",
        {
          creator_id: profile.id,
          user_id: profile.user_id,
          approval_status:
            profile.approval_status,
        }
      );

      return profile;
    } 
    catch (error) {
      ErrorHandler.handle(
        error,
        "Failed to load creator profile",
        {
          module: "CreatorModule",
          action: "loadCreatorProfile",
        }
      );
      clearCreatorState();
      return null;
    } finally {
      loadingProfile = false;

      AppState.patch("loading", {
        creator: false,
      });
    }
  }

  function clearCreatorState() {
    AppState.patch("creator", {
      profile: null,
      approved: false,
      onboardingComplete: false,
    });
  }

  async function submitCreatorProfile() {
    const authState =
      AppState.get("auth");

    const legacyUser =
      AppState.get("user");

    const user =
      authState?.user || legacyUser;

    /*
    |--------------------------------------------------------------------------
    | Auth Guard
    |--------------------------------------------------------------------------
    */

    if (!user?.id) {
      toast(
        "You must be signed in"
      );

      return;
    }

    /*
    |--------------------------------------------------------------------------
    | Prevent Duplicate Creator Profiles
    |--------------------------------------------------------------------------
    */

    const existingProfile =
      AppState.get("creator")
        ?.profile;

    if (existingProfile?.id) {
      toast(
        "Creator profile already exists"
      );

      return;
    }

AppState.patch("loading", {
  creator: true,
});

let uploadedImagePath = null;

try {
      /*
      |--------------------------------------------------------------------------
      | Form Values
      |--------------------------------------------------------------------------
      */

      const artistName =
        Utils.sanitizeText(
          DOM.creatorArtistName?.value
        );

      const bio =
        Utils.sanitizeText(
          DOM.creatorBio?.value
        );

      const instagram =
        Utils.sanitizeText(
          DOM.creatorInstagram?.value
        );

      const profileImage =
        DOM.creatorProfileImage
          ?.files?.[0];

      /*
      |--------------------------------------------------------------------------
      | Validation
      |--------------------------------------------------------------------------
      */

      if (!artistName) {
        throw new Error(
          "Artist name is required"
        );
      }

      if (!bio) {
        throw new Error(
          "Artist bio is required"
        );
      }

      /*
      |--------------------------------------------------------------------------
      | Profile Image Upload
      |--------------------------------------------------------------------------
      */
let profileImageUrl = null;
      if (profileImage) {
        if (
          !profileImage.type.startsWith(
            "image/"
          )
        ) {
          throw new Error(
            "Invalid profile image"
          );
        }

if (
  profileImage.size >
  20 * 1024 * 1024
) {
          throw new Error(
            "Profile image too large"
          );
        }
const optimizedImage =
  await optimizeProfileImage(
    profileImage,
    artistName
  );

console.log(
  "optimizedImage",
  optimizedImage
);

console.log(
  "optimizedImage.size",
  optimizedImage.size
);
const imagePath =
  `${crypto.randomUUID()}.webp`;

uploadedImagePath =
  imagePath;

const uploadResult =
  await supabaseClient.storage
    .from("artist-profiles")
    .upload(
      imagePath,
      optimizedImage,
      {
        upsert: false,
      }
    );
console.log(
  "UPLOAD RESULT",
  uploadResult
);
    if (uploadResult.error) {
     throw uploadResult.error;
     }

        profileImageUrl =
          supabaseClient.storage
            .from("artist-profiles")
            .getPublicUrl(imagePath)
            .data.publicUrl;
      }
console.log(
  "PROFILE IMAGE URL",
  profileImageUrl
);
      /*
      |--------------------------------------------------------------------------
      | Insert Creator Profile
      |--------------------------------------------------------------------------
      */
console.log(
  "CREATOR INSERT DEBUG",
  {
    authUser:
      (
        await supabaseClient.auth.getUser()
      ).data.user,

    insertingUserId: user.id,
  }
);
      const insertResult =
        await supabaseClient
          .from("creators")
          .insert([
            {
              user_id: user.id,
              artist_name: artistName,
              bio,
              instagram,
              profile_image_url:
                profileImageUrl,
              approval_status:
                "pending",
            },
          ])
          .select()
          .single();

      if (insertResult.error) {
        throw insertResult.error;
      }

      /*
      |--------------------------------------------------------------------------
      | Refresh Lifecycle
      |--------------------------------------------------------------------------
      */

      await loadCreatorProfile();

      toast(
        "Artist profile submitted for review"
      );

      Logger.info(
        "creator_profile_created",
        {
          creator_id:
            insertResult.data.id,
          user_id: user.id,
        }
      );
    } 
    
    catch (error) {
            if (uploadedImagePath) {
        try {
          await supabaseClient.storage
            .from("artist-profiles")
            .remove([
              uploadedImagePath,
            ]);
        } catch (cleanupError) {
          Logger.error(
            "creator_image_cleanup_failed",
            {
              cleanupError,
            }
          );
        }
      }
      ErrorHandler.handle(
        error,
        "Failed to create creator profile",
        {
          module: "CreatorModule",
          action:
            "submitCreatorProfile",
        }
      );
    } finally {
      AppState.patch("loading", {
        creator: false,
      });
    }
  }
return {
  loadCreatorProfile,
  clearCreatorState,
  submitCreatorProfile,
};
})();