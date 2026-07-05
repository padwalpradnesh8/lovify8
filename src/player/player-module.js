import { EventBus } from "../core/event-bus.js";
import { AppState } from "../core/app-state.js";
import { Logger } from "../core/logger.js";
import { ErrorHandler } from "../core/error-handler.js";
import { toast } from "../ui/toast.js";
import { AnalyticsModule } from "../analytics/analytics-module.js";
export const PlayerModule = (() => {
  const audio = new Audio();

let queue = [];
let currentIndex = -1;
let isPlaying = false;

/*
|--------------------------------------------------------------------------
| Analytics
|--------------------------------------------------------------------------
*/

let playTracked = false;

/*
|--------------------------------------------------------------------------
| Prevent duplicate play counts
| One play per song per browser tab session
|--------------------------------------------------------------------------
*/

const trackedSongs = new Set();

function updateMediaSession(song) {
  if (!("mediaSession" in navigator)) {
    return;
  }

  navigator.mediaSession.metadata =
    new MediaMetadata({
      title: song?.title || "Unknown Title",
      artist:
        song?.artist_name || "Unknown Artist",

      album: "Lovify",

      artwork:[],
    });
  navigator.mediaSession.setActionHandler(
    "play",
    async () => {
      try {
        await audio.play();
      } catch {}
    }
  );

  navigator.mediaSession.setActionHandler(
    "pause",
    () => {
      audio.pause();
    }
  );

  navigator.mediaSession.setActionHandler(
    "previoustrack",
    () => {
      previousSong();
    }
  );

  navigator.mediaSession.setActionHandler(
    "nexttrack",
    () => {
      nextSong();
    }
  );

  navigator.mediaSession.playbackState =
    audio.paused
      ? "paused"
      : "playing";
}
function emitState() {
  EventBus.emit(
    "player:update",
    {
      progress:
        audio.currentTime || 0,

      duration:
        audio.duration || 0,

      isPlaying,
    }
  );

  if (
    "mediaSession" in navigator &&
    audio.duration
  ) {
    try {
      navigator.mediaSession.setPositionState(
        {
          duration:
            audio.duration,

          playbackRate:
            audio.playbackRate,

          position:
            audio.currentTime,
        }
      );
    } catch {}
  }
}


function syncPlaybackState() {
  isPlaying =
    !audio.paused &&
    !audio.ended;

  if ("mediaSession" in navigator) {
    navigator.mediaSession.playbackState =
      isPlaying
        ? "playing"
        : "paused";
  }

  emitState();
}

  function init() {
    audio.preload = "metadata";

    // Better mobile/browser playback reliability
    audio.playsInline = true;

    /* ------------------------------ */
    /* NATIVE AUDIO EVENTS            */
    /* ------------------------------ */

    audio.addEventListener("play", syncPlaybackState);

    audio.addEventListener("pause", syncPlaybackState);

    audio.addEventListener("ended", () => {
      isPlaying = false;
      emitState();

      // Spotify-like behavior:
      // stop at end instead of looping forever
      if (currentIndex >= queue.length - 1) {
        return;
      }

      nextSong();
    });

   audio.addEventListener(
    "timeupdate",
    () => {

        emitState();

        if (
            playTracked ||
            audio.currentTime < 30
        ) {
            return;
        }
const song =
    AppState.get(
        "currentSong"
    );

if (!song) {
    return;
}

/*
|--------------------------------------------------------------------------
| Already counted this song during this browser tab
|--------------------------------------------------------------------------
*/

if (
    trackedSongs.has(
        String(song.id)
    )
) {
    playTracked = true;
    return;
}

/*
|--------------------------------------------------------------------------
| Count play
|--------------------------------------------------------------------------
*/

trackedSongs.add(
    String(song.id)
);

playTracked = true;

AnalyticsModule.trackSongPlay(
    song
);

    }
);

    audio.addEventListener("loadedmetadata", emitState);

    audio.addEventListener("seeking", emitState);

    audio.addEventListener("seeked", emitState);

    audio.addEventListener("waiting", () => {
      Logger.info("audio_buffering");
    });

    audio.addEventListener("stalled", () => {
      Logger.warn("audio_stalled");
    });

    audio.addEventListener("error", () => {
      Logger.error("playback_error", {
        src: audio.src,
      });

      toast("Playback failed");
    });

    /* ------------------------------ */
    /* EVENT BUS                      */
    /* ------------------------------ */

    EventBus.on("player:setQueue", (songs) => {
      queue = Array.isArray(songs) ? songs : [];
    });

    EventBus.on("player:play", playSong);

    EventBus.on("player:toggle", togglePlayback);

    EventBus.on("player:next", nextSong);

    EventBus.on("player:prev", previousSong);
  }

async function playSong(song) {
  if (!song?.audio_url) return;

  try {
    const foundIndex = queue.findIndex(
      (s) => String(s.id) === String(song.id)
    );

    currentIndex =
      foundIndex >= 0 ? foundIndex : 0;

    if (audio.src !== song.audio_url) {
      audio.src = song.audio_url;
    }
AppState.set(
  "currentSong",
  song
);

updateMediaSession(song);

EventBus.emit(
  "player:songChanged",
  song
);
    await audio.play();

playTracked = false;
Logger.info("playback_started", {
  songId: song.id,
});

  } catch (error) {
    if (error?.name === "AbortError") {
      // Benign: this play() was interrupted by a subsequent
      // pause()/play() call (e.g. rapid clicking or switching
      // tracks quickly). Not a real failure — ignore.
      return;
    }

    ErrorHandler.handle(
      error,
      "Playback failed",
      {
        module: "PlayerModule",
      }
    );
  }
}

  async function togglePlayback() {
  if (!audio.src) return;

  try {
    if (!audio.paused) {
      audio.pause();
    } else {
      await audio.play();
    }
  } catch (error) {
    if (error?.name === "AbortError") {
      return;
    }

    ErrorHandler.handle(error, "Playback failed", {
      module: "PlayerModule",
    });
  }
}

  function nextSong() {
    if (!queue.length) return;

    // Stop at queue end
    if (currentIndex >= queue.length - 1) {
      return;
    }

    currentIndex += 1;

    playSong(queue[currentIndex]);
  }

  function previousSong() {
    if (!queue.length) return;

    // Restart current song if >3s in
    if (audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }

    // Stay at first track
    if (currentIndex <= 0) {
      audio.currentTime = 0;
      return;
    }

    currentIndex -= 1;

    playSong(queue[currentIndex]);
  }

  function seek(percent) {
    if (!audio.duration) return;

    const safePercent = Math.max(
      0,
      Math.min(100, Number(percent))
    );

    audio.currentTime =
      (safePercent / 100) * audio.duration;
       emitState();
  }

  function getUpNext() {
    if (!queue.length || currentIndex < 0) return [];

    return queue.slice(currentIndex + 1);
  }

  return {
    init,
    seek,
    getUpNext,
  };
})();