import { DOM } from "../core/dom.js";
import { EventBus } from "../core/event-bus.js";
import { Utils } from "../utils/utils.js";
import { PlayerModule } from "./player-module.js";

let isSeeking = false;
let isSeekingNp = false;

function renderUpNext() {
  if (!DOM.npQueueList) return;

  const upNext = PlayerModule.getUpNext();

  DOM.npQueueList.replaceChildren();

  if (!upNext.length) {
    DOM.npQueueList.appendChild(
      Utils.createElementSafe("p", {
        text: "You're at the end of the queue",
        attrs: { style: "color:rgba(255,255,255,.5);font-size:13px" },
      })
    );

    return;
  }

  const fragment = document.createDocumentFragment();

  upNext.forEach((song) => {
    const row = Utils.createElementSafe("div", {
      className: "np-queue-row",
      attrs: {
        tabindex: "0",
        role: "button",
        "aria-label": `Play ${song.title} by ${song.artist_name}`,
      },
    });

    const coverWrap = Utils.createElementSafe("div", {
      className: "np-queue-cover-wrap",
    });

    coverWrap.appendChild(
      Utils.createElementSafe("img", {
        attrs: {
          src: song.cover_image,
          alt: `${song.title} cover`,
          loading: "lazy",
        },
      })
    );

    const meta = Utils.createElementSafe("div", {
      className: "np-queue-meta",
    });

    meta.appendChild(
      Utils.createElementSafe("div", {
        className: "np-queue-title",
        text: song.title,
      })
    );

    meta.appendChild(
      Utils.createElementSafe("div", {
        className: "np-queue-artist",
        text: song.artist_name,
      })
    );


    const menuBtn = Utils.createElementSafe("button", {
      className: "np-queue-menu",
      text: "⋮",
      attrs: {
        type: "button",
        "aria-label": `More options for ${song.title}`,
      },
    });

    const play = (event) => {
      event?.stopPropagation();
      EventBus.emit("player:play", song);
    };

    row.addEventListener("click", play);

    row.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        play();
      }
    });

    menuBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      EventBus.emit("song:menu", song);
    });

    row.appendChild(coverWrap);
    row.appendChild(meta);
    row.appendChild(menuBtn);

    fragment.appendChild(row);
  });

  DOM.npQueueList.appendChild(fragment);
}

function openNowPlaying() {
  if (!DOM.nowPlayingView) return;

  DOM.nowPlayingView.classList.remove("hidden");
  DOM.nowPlayingView.setAttribute("aria-hidden", "false");
  document.body.classList.add("np-open");

  renderUpNext();
}

function closeNowPlaying() {
  if (!DOM.nowPlayingView) return;

  DOM.nowPlayingView.classList.add("hidden");
  DOM.nowPlayingView.setAttribute("aria-hidden", "true");
  document.body.classList.remove("np-open");
}

/* Tapping the mini player's cover/title area expands to full screen —
   buttons inside it stop propagation so they don't also trigger this. */
DOM.player
  ?.querySelector(".player-track")
  ?.addEventListener("click", openNowPlaying);

DOM.npCollapseBtn?.addEventListener("click", closeNowPlaying);

document.addEventListener("keydown", (event) => {
  if (
    event.key === "Escape" &&
    !DOM.nowPlayingView?.classList.contains("hidden")
  ) {
    closeNowPlaying();
  }
});

[DOM.prevBtn, DOM.playBtn, DOM.nextBtn].forEach((btn) => {
  btn?.addEventListener("click", (event) => {
    event.stopPropagation();
  });
});

DOM.npPlayBtn?.addEventListener("click", () => {
  EventBus.emit("player:toggle");
});

DOM.npPrevBtn?.addEventListener("click", () => {
  EventBus.emit("player:prev");
});

DOM.npNextBtn?.addEventListener("click", () => {
  EventBus.emit("player:next");
});

/* Like button is currently cosmetic only — there is no likes feature/table
   in the backend yet. This just gives visual feedback; nothing is saved. */
DOM.npLikeBtn?.addEventListener("click", () => {
  DOM.npLikeBtn.classList.toggle("liked");
});

EventBus.on("player:songChanged", (song) => {
  if (!song) return;

  DOM.player?.classList.remove("hidden");

  if (DOM.playerTitle) {
    DOM.playerTitle.textContent =
      Utils.sanitizeText(song.title);
  }

  if (DOM.playerArtist) {
    DOM.playerArtist.textContent =
      Utils.sanitizeText(song.artist_name);
  }

  if (DOM.playerCover) {
    Utils.safeSetAttribute(
      DOM.playerCover,
      "src",
      song.cover_image
    );

    Utils.safeSetAttribute(
      DOM.playerCover,
      "alt",
      `${song.title} cover`
    );
  }

  if (DOM.npTitle) {
    DOM.npTitle.textContent =
      Utils.sanitizeText(song.title);
  }

  if (DOM.npArtist) {
    DOM.npArtist.textContent =
      Utils.sanitizeText(song.artist_name);
  }

  if (DOM.npCover) {
    Utils.safeSetAttribute(
      DOM.npCover,
      "src",
      song.cover_image
    );

    Utils.safeSetAttribute(
      DOM.npCover,
      "alt",
      `${song.title} cover`
    );
  }

  renderUpNext();
});

EventBus.on("player:update", (state) => {
  if (!state) return;

  /* PLAY/PAUSE BUTTON (mini player) */

 if (DOM.playBtn) {
  DOM.playBtn.innerHTML = state.isPlaying
    ? `
      <svg viewBox="0 0 24 24" class="icon">
        <path d="M6 5h4v14H6zm8 0h4v14h-4z"></path>
      </svg>
    `
    : `
      <svg viewBox="0 0 24 24" class="icon">
        <path d="M8 5v14l11-7z"></path>
      </svg>
    `;
    
    
    DOM.playBtn.setAttribute(
      "aria-label",
      state.isPlaying
        ? "Pause playback"
        : "Play playback"
    );
  }

  /* PLAY/PAUSE BUTTON (now playing) */

  if (DOM.npPlayBtn) {
    DOM.npPlayBtn.innerHTML = state.isPlaying
      ? `
        <svg viewBox="0 0 24 24" class="icon">
          <path d="M6 5h4v14H6zm8 0h4v14h-4z"></path>
        </svg>
      `
      : `
        <svg viewBox="0 0 24 24" class="icon">
          <path d="M8 5v14l11-7z"></path>
        </svg>
      `;

    DOM.npPlayBtn.setAttribute(
      "aria-label",
      state.isPlaying
        ? "Pause playback"
        : "Play playback"
    );
  }

  /* PROGRESS (mini player) */

  const percent = state.duration
    ? (state.progress / state.duration) * 100
    : 0;

  if (DOM.progress && !isSeeking) {
    DOM.progress.value = percent;

    DOM.progress.style.setProperty(
      "--progress-percent",
      `${percent}%`
    );
  }

  /* PROGRESS (now playing) */

  if (DOM.npProgress && !isSeekingNp) {
    DOM.npProgress.value = percent;
  }

  /* TIMERS */

  if (DOM.currentTime) {
    DOM.currentTime.textContent =
      Utils.formatTime(state.progress);
  }

  if (DOM.duration) {
    DOM.duration.textContent =
      Utils.formatTime(state.duration);
  }

  if (DOM.npCurrentTime) {
    DOM.npCurrentTime.textContent =
      Utils.formatTime(state.progress);
  }

  if (DOM.npDuration) {
    DOM.npDuration.textContent =
      Utils.formatTime(state.duration);
  }
});

/* ------------------------------ */
/* SEEK BAR — mini player         */
/* ------------------------------ */

DOM.progress?.addEventListener("pointerdown", () => {
  isSeeking = true;
});

DOM.progress?.addEventListener("input", (event) => {
  const value = Number(event.target.value);

  DOM.progress.style.setProperty(
    "--progress-percent",
    `${value}%`
  );
});

DOM.progress?.addEventListener("change", (event) => {
  isSeeking = false;

  PlayerModule.seek(event.target.value);
});

DOM.progress?.addEventListener("pointerup", (event) => {
  isSeeking = false;

  PlayerModule.seek(event.target.value);
});

/* ------------------------------ */
/* SEEK BAR — now playing         */
/* ------------------------------ */

DOM.npProgress?.addEventListener("pointerdown", () => {
  isSeekingNp = true;
});

DOM.npProgress?.addEventListener("change", (event) => {
  isSeekingNp = false;

  PlayerModule.seek(event.target.value);
});

DOM.npProgress?.addEventListener("pointerup", (event) => {
  isSeekingNp = false;

  PlayerModule.seek(event.target.value);
});