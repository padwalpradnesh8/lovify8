import { CONFIG } from "../config/config.js";
import { AppState } from "../core/app-state.js";
import { Cache } from "../core/cache.js";
import { DOM } from "../core/dom.js";
import { EventBus } from "../core/event-bus.js";
import { ErrorHandler } from "../core/error-handler.js";
import { UIComponents } from "../ui/ui-components.js";
import { SupabaseHelpers } from "../services/supabase-helpers.js";
import { Utils } from "../utils/utils.js";

export const SongsModule = (() => {
  async function loadSongs(reset = false) {
    const pagination = AppState.get("pagination");

    if (pagination.fetching) return;

    if (!pagination.hasMore && !reset) return;

    AppState.patch("pagination", {
      fetching: true,
    });

    AppState.patch("loading", {
      songs: true,
    });

    renderSkeletons();

    try {
      const offset = reset ? 0 : pagination.offset;

      const cacheKey = `songs_${offset}`;

      const cached = Cache.get(cacheKey);

      let songs;

      if (cached?.value) {
        songs = cached.value;
      } else {
        console.log("LOADING SONGS");

        const { data, error } =
          await SupabaseHelpers.execute(
            cacheKey,
            () =>
              supabaseClient
                .from("songs")
                .select("*")
                .eq("status", "approved")
                .order("created_at", {
                  ascending: false,
                })
                .range(
                  offset,
                  offset + CONFIG.PAGINATION_LIMIT - 1
                )
          );

        console.log("SONGS RESULT", data, error);

        if (error) {
          throw error;
        }

        songs = data || [];

        Cache.set(cacheKey, songs);
      }

      const existingSongs = reset
        ? []
        : AppState.get("songs");

      const mergedSongs = [
        ...existingSongs,
        ...songs.filter(
          (song) =>
            !existingSongs.some(
              (existing) => existing.id === song.id
            )
        ),
      ];

      AppState.set("songs", mergedSongs);

      AppState.patch("pagination", {
        offset: offset + songs.length,
        hasMore: songs.length === CONFIG.PAGINATION_LIMIT,
      });

      EventBus.emit("songs:loaded", mergedSongs);

      EventBus.emit("player:setQueue", mergedSongs);
    } catch (error) {
      ErrorHandler.handle(error, "Failed to load songs", {
        module: "SongsModule",
      });
    } finally {
      AppState.patch("pagination", {
        fetching: false,
      });

      AppState.patch("loading", {
        songs: false,
      });
    }
  }

  function renderSongs(container, songs) {
    if (!container) return;

    container.replaceChildren();

    if (!songs?.length) {
      container.appendChild(
        UIComponents.createEmptyState("No songs found")
      );

      return;
    }

    const fragment = document.createDocumentFragment();

    songs.forEach((song) => {
      fragment.appendChild(
        UIComponents.createSongCard(song)
      );
    });

    container.appendChild(fragment);
  }
  async function loadArtistProfile(artist, options = {}) {
    if (!artist?.id) return;

    AppState.set("currentArtistProfile", artist);

    const artistProfileView =
      document.getElementById("artist-profile-view");

    const homeView =
      document.getElementById("home-view");

    const siteHero =
      document.getElementById("site-hero");

    if (homeView) {
      homeView.classList.add("hidden");
    }

    if (siteHero) {
      siteHero.classList.add("hidden");
    }

    if (artistProfileView) {
      artistProfileView.classList.remove("hidden");
    }

    window.scrollTo({
      top: 0,
      behavior: "instant",
    });

    if (
      !options.fromPopState &&
      history.state?.artistId !== artist.id
    ) {
      history.pushState(
        { artistId: artist.id },
        "",
        `#artist-${artist.id}`
      );
    }

    artistProfileView?.replaceChildren();

    const loader = document.createDocumentFragment();

    for (let i = 0; i < 4; i += 1) {
      loader.appendChild(
        UIComponents.createLoader()
      );
    }

    artistProfileView?.appendChild(loader);

    try {
      const cacheKey =
        `artist_profile_${artist.id}`;

      const cached =
        Cache.get(cacheKey);

      let songs = [];

      if (cached?.value) {
        songs = cached.value;
      } else {
        const { data, error } =
          await SupabaseHelpers.execute(
            cacheKey,
            () =>
              supabaseClient
                .from("songs")
                .select("*")
                .eq("creator_id", artist.id)
                .eq("status", "approved")
                .order("created_at", {
                  ascending: false,
                })
          );

        if (error) {
          throw error;
        }

        songs = data || [];

        Cache.set(cacheKey, songs);
      }

      renderArtistProfile(
        artistProfileView,
        artist,
        songs
      );
    } catch (error) {
      ErrorHandler.handle(
        error,
        "Failed to load artist profile",
        {
          module: "SongsModule",
        }
      );
    }
  }
function closeArtistProfile(options = {}) {
  const artistProfileView =
    document.getElementById(
      "artist-profile-view"
    );

  const homeView =
    document.getElementById(
      "home-view"
    );

  const siteHero =
    document.getElementById(
      "site-hero"
    );

  if (artistProfileView) {
    artistProfileView.classList.add(
      "hidden"
    );
  }

  if (homeView) {
    homeView.classList.remove(
      "hidden"
    );
  }

  if (siteHero) {
    siteHero.classList.remove(
      "hidden"
    );
  }

  window.scrollTo({
    top: 0,
    behavior: "instant",
  });

  if (
    !options.fromPopState &&
    history.state?.artistId
  ) {
    history.back();
  }
}

window.addEventListener("popstate", (event) => {
  if (!event.state?.artistId) {
    closeArtistProfile({ fromPopState: true });
  }
});
function renderArtistProfile(container, artist, songs) {
  if (!container) return;

  container.replaceChildren();

  // 1. Back Button
  const backButton = document.createElement("button");
  backButton.id = "artist-profile-back-btn";
  backButton.className = "artist-profile-back-btn";
  backButton.innerHTML = "← <span>Back</span>"; // Added span for better styling
  backButton.addEventListener("click", closeArtistProfile);
  container.appendChild(backButton);

  // 2. Hero Section (Replacement for old header)
  const hero = document.createElement("div");
  hero.className = "artist-profile-hero";

  const image = document.createElement("img");
  image.className = "artist-profile-image";
  image.src = artist.profile_image_url || "";
  image.alt = artist.artist_name || "Artist";

  const meta = document.createElement("div");
  meta.className = "artist-profile-meta";

  const name = document.createElement("h1");
  name.className = "artist-profile-name";
  name.textContent = artist.artist_name || "Artist";

  const bio = document.createElement("p");
  bio.className = "artist-profile-bio";
  bio.textContent = artist.bio || "";

  meta.appendChild(name);

  hero.appendChild(image);
  hero.appendChild(meta);
  container.appendChild(hero);

// 3. Songs Section Title
const songsTitle = document.createElement("h2");
songsTitle.className =
  "artist-profile-section-title";
songsTitle.textContent =
  "Popular Covers";

const songsSection =
  document.createElement("div");

songsSection.className =
  "artist-songs-section";
  // 4. Songs Grid
  const songsGrid = document.createElement("div");
  songsGrid.className = "songs-grid artist-songs-layout"; // Added specific class for spacing

songsGrid.className =
  "artist-song-list";

if (!songs?.length) {
  songsGrid.appendChild(
    UIComponents.createEmptyState(
      "No approved songs found"
    )
  );
}
else {

  songs.forEach((song, index) => {

    const row =
      document.createElement("div");

    row.className =
      "artist-song-row";

    row.addEventListener(
      "click",
      () => {
        EventBus.emit(
          "player:play",
          song
        );
      }
    );

    row.innerHTML = `
      <div class="artist-song-index">
        ${index + 1}
      </div>

      <img
        class="artist-song-cover"
        src="${song.cover_image}"
        alt="${song.title}"
      />

      <div class="artist-song-meta">
        <div class="artist-song-title">
          ${song.title}
        </div>

        <div class="artist-song-artist">
          ${song.artist_name}
        </div>
      </div>
    `;

    songsGrid.appendChild(row);

  });

  EventBus.emit(
    "player:setQueue",
    songs
  );
}

songsSection.appendChild(
  songsTitle
);

songsSection.appendChild(
  songsGrid
);

container.appendChild(
  songsSection
);
  const aboutSection =
  document.createElement("div");

aboutSection.className =
  "artist-about-section";

const aboutTitle =
  document.createElement("h2");

aboutTitle.className =
  "artist-profile-section-title";

aboutTitle.textContent = "About";

aboutSection.appendChild(
  aboutTitle
);

if (artist.bio) {
  const bio =
    document.createElement("p");

  bio.className =
    "artist-about-bio";

  bio.textContent =
    artist.bio;

  aboutSection.appendChild(
    bio
  );
}

if (artist.instagram) {
  const instagram =
    document.createElement("a");

  instagram.className =
    "artist-about-instagram";

  instagram.href =
    `https://instagram.com/${artist.instagram.replace("@", "")}`;

  instagram.target =
    "_blank";

  instagram.rel =
    "noopener noreferrer";

  instagram.textContent =
    `Instagram ↗`;

  aboutSection.appendChild(
    instagram
  );
}

container.appendChild(
  aboutSection
);
}
  function renderSongRows(container, songs) {
    if (!container) return;

    container.replaceChildren();

    if (!songs?.length) {
      container.appendChild(
        UIComponents.createEmptyState("No new releases yet")
      );

      return;
    }

    const fragment = document.createDocumentFragment();

    songs.forEach((song) => {
      const row = Utils.createElementSafe("div", {
        className: "release-row",
        attrs: {
          tabindex: "0",
          role: "button",
          "aria-label": `Play ${song.title} by ${song.artist_name}`,
        },
      });

      const coverWrap = Utils.createElementSafe("div", {
        className: "release-cover-wrap",
      });

      const cover = Utils.createElementSafe("img", {
        className: "release-cover",
        attrs: {
          src: song.cover_image,
          alt: `${song.title} cover`,
          loading: "lazy",
        },
      });

      coverWrap.appendChild(cover);

      const meta = Utils.createElementSafe("div", {
        className: "release-meta",
      });

      const title = Utils.createElementSafe("h3", {
        className: "release-title",
        text: song.title,
      });

      const artist = Utils.createElementSafe("p", {
        className: "release-artist",
        text: song.artist_name,
      });

      meta.appendChild(title);
      meta.appendChild(artist);

      const duration = song.duration
        ? Utils.createElementSafe("span", {
            className: "release-duration",
            text: Utils.formatTime(song.duration),
          })
        : null;

      const playBtn = Utils.createElementSafe("button", {
        className: "release-play-btn",
        text: "▶",
        attrs: {
          type: "button",
          "aria-label": `Play ${song.title}`,
        },
      });

      const menuBtn = Utils.createElementSafe("button", {
        className: "release-menu-btn",
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

      playBtn.addEventListener("click", play);

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
      if (duration) row.appendChild(duration);
      row.appendChild(playBtn);
      row.appendChild(menuBtn);

      fragment.appendChild(row);
    });

    container.appendChild(fragment);
  }

  function renderSkeletons() {
    if (!DOM.featuredSongs) return;

    DOM.featuredSongs.replaceChildren();

    const fragment = document.createDocumentFragment();

    for (let i = 0; i < 4; i += 1) {
      fragment.appendChild(
        UIComponents.createLoader()
      );
    }

    DOM.featuredSongs.appendChild(fragment);
  }

return {
  loadSongs,
  renderSongs,
  renderSongRows,
  loadArtistProfile,
  closeArtistProfile,
};
})();