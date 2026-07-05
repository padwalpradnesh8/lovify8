import { Utils } from "../utils/utils.js";
import { EventBus } from "../core/event-bus.js";

export const UIComponents = {
  createToast(message, type = "info") {
    const toast = Utils.createElementSafe("div", {
      className: `toast toast-${type}`,
      text: message,
      attrs: {
        role: "status",
        "aria-live": "polite",
      },
    });

    return toast;
  },

  createLoader() {
    return Utils.createElementSafe("div", {
      className: "skeleton-card",
      attrs: {
        "aria-hidden": "true",
      },
    });
  },

  createEmptyState(text) {
    return Utils.createElementSafe("div", {
      className: "empty-state",
      text,
    });
  },
createArtistCard(artist) {
  const card = Utils.createElementSafe("div", {
    className: "artist-card",
    attrs: {
      tabindex: "0",
      role: "button",
      "aria-label": `Open ${artist.artist_name} profile`,
    },
  });

  const imageWrap = Utils.createElementSafe("div", {
    className: "artist-card-image-wrap",
  });

  const image = Utils.createElementSafe("img", {
    className: "artist-card-image",
    attrs: {
      src:
        artist.profile_image_url || "",
      alt:
        artist.artist_name || "Artist",
      loading: "lazy",
    },
  });

  imageWrap.appendChild(image);

  const info = Utils.createElementSafe("div", {
    className: "artist-card-info",
  });

  const name = Utils.createElementSafe("h3", {
    text:
      artist.artist_name || "Artist",
  });

  info.appendChild(name);

  if (artist.followers_count) {
    const followers = Utils.createElementSafe("p", {
      className: "artist-card-followers",
      text: `${Utils.formatCount(artist.followers_count)} Followers`,
    });

    info.appendChild(followers);
  }

  card.appendChild(imageWrap);

  card.appendChild(info);

  const openArtistProfile = () => {
    EventBus.emit(
      "artist:open",
      artist
    );
  };

  card.addEventListener(
    "click",
    openArtistProfile
  );

  card.addEventListener(
    "keydown",
    (event) => {
      if (
        event.key === "Enter" ||
        event.key === " "
      ) {
        event.preventDefault();

        openArtistProfile();
      }
    }
  );

  return card;
},
  createSongCard(song) {
    const card = Utils.createElementSafe("div", {
      className: "song-card",
      attrs: {
        tabindex: "0",
        role: "button",
        "aria-label": `Play ${song.title} by ${song.artist_name}`,
      },
    });

    const wrapper = Utils.createElementSafe("div", {
      className: "song-image-wrapper",
    });

    const image = Utils.createElementSafe("img", {
      attrs: {
        src: song.cover_image,
        alt: `${song.title} cover`,
        loading: "lazy",
      },
    });

    const overlay = Utils.createElementSafe("button", {
      className: "play-overlay",
      text: "▶",
      attrs: {
        type: "button",
        "aria-label": `Play ${song.title}`,
      },
    });

    const info = Utils.createElementSafe("div", {
      className: "song-info",
    });

    const titleRow = Utils.createElementSafe("div", {
      className: "song-info-row",
    });

    const title = Utils.createElementSafe("h3", {
      text: song.title,
    });

    const menuBtn = Utils.createElementSafe("button", {
      className: "song-menu-btn",
      text: "⋮",
      attrs: {
        type: "button",
        "aria-label": `More options for ${song.title}`,
      },
    });

    const artist = Utils.createElementSafe("p", {
      text: song.artist_name,
    });

    overlay.addEventListener("click", (event) => {
      event.stopPropagation();
      EventBus.emit("player:play", song);
    });

    menuBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      EventBus.emit("song:menu", song);
    });

    card.addEventListener("click", () => {
      EventBus.emit("player:play", song);
    });

    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        EventBus.emit("player:play", song);
      }
    });

    if (song.play_count) {
      const badge = Utils.createElementSafe("div", {
        className: "play-count-badge",
        text: `▶ ${Utils.formatCount(song.play_count)}`,
      });

      wrapper.appendChild(badge);
    }

    titleRow.appendChild(title);
    titleRow.appendChild(menuBtn);

    info.appendChild(titleRow);
    info.appendChild(artist);

    wrapper.appendChild(image);
    wrapper.appendChild(overlay);

    card.appendChild(wrapper);
    card.appendChild(info);

    return card;
  },
};