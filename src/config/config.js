import {
  optimizeProfileImage,
} from "../utils/image-optimizer.js";
export const CONFIG = {
  PAGINATION_LIMIT: 100,
  MAX_AUDIO_SIZE: 25 * 1024 * 1024,
  MAX_IMAGE_SIZE: 5 * 1024 * 1024,
  AUDIO_TYPES: ["audio/mpeg", "audio/mp3", "audio/wav"],
  IMAGE_TYPES: [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif"
],
  AUDIO_EXTENSIONS: ["mp3", "mpeg", "wav"],
IMAGE_EXTENSIONS: [
  "jpg",
  "jpeg",
  "png",
  "webp",
  "heic",
  "heif"
],
  TITLE_MAX_LENGTH: 120,
  ARTIST_MAX_LENGTH: 80,
  REQUEST_TIMEOUT: 15000,
  TOAST_DURATION: 3000,
};