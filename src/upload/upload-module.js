import { CONFIG } from "../config/config.js";
import { AppState } from "../core/app-state.js";
import { DOM } from "../core/dom.js";
import { Logger } from "../core/logger.js";
import { ErrorHandler } from "../core/error-handler.js";
import { Utils } from "../utils/utils.js";
import { requireAuth } from "../auth/auth-helpers.js";
import { toast } from "../ui/toast.js"; 

export const UploadModule = (() => {
  let uploadInProgress = false;

  function validateText(value, maxLength, field) {
    const sanitized = Utils.sanitizeText(value);

    if (!sanitized) {
      throw new Error(`${field} is required`);
    }

    if (sanitized.length > maxLength) {
      throw new Error(
        `${field} exceeds ${maxLength} characters`
      );
    }

    return sanitized;
  }

  function validateFile(file, type) {
    if (!file) {
      throw new Error(`${type} file is required`);
    }

    if (file.size <= 0) {
      throw new Error(`Invalid ${type} file`);
    }

    const extension = Utils.getFileExtension(file.name);

    if (type === "audio") {
      if (
        !CONFIG.AUDIO_TYPES.includes(file.type)
      ) {
        throw new Error("Unsupported audio type");
      }

      if (
        !CONFIG.AUDIO_EXTENSIONS.includes(extension)
      ) {
        throw new Error("Invalid audio extension");
      }

      if (file.size > CONFIG.MAX_AUDIO_SIZE) {
        throw new Error("Audio file too large");
      }
    }

    if (type === "image") {
      if (
        !CONFIG.IMAGE_TYPES.includes(file.type)
      ) {
        throw new Error("Unsupported image type");
      }

      if (
        !CONFIG.IMAGE_EXTENSIONS.includes(extension)
      ) {
        throw new Error("Invalid image extension");
      }

      if (file.size > CONFIG.MAX_IMAGE_SIZE) {
        throw new Error("Image file too large");
      }
    }

    return true;
  }

  async function cleanupUploads(paths = []) {
    for (const item of paths) {
      try {
        await supabaseClient.storage
          .from(item.bucket)
          .remove([item.path]);

        Logger.info("storage_cleanup_success", item);
      } catch (error) {
        Logger.error("storage_cleanup_failed", {
          item,
          error,
        });
      }
    }
  }

  async function uploadSong() {
    if (uploadInProgress) {
      toast("Upload already in progress");
      return;
    }

    requireAuth(async () => {
      uploadInProgress = true;

      AppState.patch("loading", {
        upload: true,
      });

      const cleanupQueue = [];

      try {
        const title = validateText(
          document.getElementById("song-title")?.value,
          CONFIG.TITLE_MAX_LENGTH,
          "Title"
        );

        const creatorState =
  AppState.get("creator");

const creatorProfile =
  creatorState?.profile || null;

if (
  creatorProfile &&
  creatorProfile.approval_status !==
    "approved"
) {
  throw new Error(
    "Your creator profile is not approved yet"
  );
}

const artist =
  creatorProfile?.artist_name;

if (!artist) {
  throw new Error(
    "Creator artist profile is incomplete"
  );
}

        const audioFile =
          document.getElementById("audio-file")
            ?.files?.[0];

        const coverFile =
          document.getElementById("cover-file")
            ?.files?.[0];

        validateFile(audioFile, "audio");
        validateFile(coverFile, "image");

        Utils.setButtonLoading(
          DOM.uploadBtn,
          true,
          "Uploading..."
        );

        const audioExtension =
          Utils.getFileExtension(audioFile.name);

        const coverExtension =
          Utils.getFileExtension(coverFile.name);

        const audioPath = `${crypto.randomUUID()}.${audioExtension}`;

        const coverPath = `${crypto.randomUUID()}.${coverExtension}`;

        const audioUpload =
          await supabaseClient.storage
            .from("songs")
            .upload(audioPath, audioFile, {
              upsert: false,
            });

        if (audioUpload.error) {
          throw audioUpload.error;
        }

        cleanupQueue.push({
          bucket: "songs",
          path: audioPath,
        });

        const coverUpload =
          await supabaseClient.storage
            .from("covers")
            .upload(coverPath, coverFile, {
              upsert: false,
            });

        if (coverUpload.error) {
          throw coverUpload.error;
        }

        cleanupQueue.push({
          bucket: "covers",
          path: coverPath,
        });

        const audioUrl =
          supabaseClient.storage
            .from("songs")
            .getPublicUrl(audioPath)
            .data.publicUrl;

        const coverUrl =
          supabaseClient.storage
            .from("covers")
            .getPublicUrl(coverPath)
            .data.publicUrl;
        
        const authState = AppState.get("auth");
const legacyUser = AppState.get("user");

const user =
  authState?.user || legacyUser;

if (!user?.id) {
  throw new Error(
    "You must be logged in to upload songs."
  );
}
        
        const insertResult =
          await supabaseClient
            .from("songs")
            .insert([
              {
  title,
  artist_name: artist,
  audio_url: audioUrl,
  cover_image: coverUrl,
  status: "pending",

  user_id: user.id,

  creator_id:
    creatorProfile?.id || null,
},
            ]);

        if (insertResult.error) {
          throw insertResult.error;
        }

        toast("Upload submitted for review");

        Logger.info("upload_success", {
  title,
  artist,
  user_id: user.id,
  creator_id:
    creatorProfile?.id || null,
});
      } catch (error) {
        await cleanupUploads(cleanupQueue);

        ErrorHandler.handle(error, "Upload failed", {
          module: "UploadModule",
        });
      } finally {
        uploadInProgress = false;

        AppState.patch("loading", {
          upload: false,
        });

        Utils.setButtonLoading(
          DOM.uploadBtn,
          false
        );
      }
    });
  }

  return {
    uploadSong,
  };
})();