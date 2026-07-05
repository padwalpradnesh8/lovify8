import { AnalyticsModule } from "../analytics/analytics-module.js";
import { DOM } from "../core/dom.js";
import { Logger } from "../core/logger.js";
import { ErrorHandler } from "../core/error-handler.js";
import { EventBus } from "../core/event-bus.js";
import { PlayerModule } from "../player/player-module.js";
import { AuthModule } from "../auth/auth-module.js";
import { CreatorModule } from "../creator/creator-module.js";
import { SongsModule } from "../songs/songs-module.js";
import { ArtistModule } from "../artist/artist-module.js";
import { UploadModule } from "../upload/upload-module.js";
import { AppState } from "../core/app-state.js";
import {
  openAuthModal,
  closeAuthModal,
  openCreatorAuth,
  openCreatorOnboardingModal,
  closeCreatorOnboardingModal,
} from "../auth/auth-helpers.js";
import { initializeAccessibility } from "../ui/accessibility.js";

document.addEventListener(
  "DOMContentLoaded",
  async () => {
  try {
    PlayerModule.init();
    ArtistModule.init();
    AuthModule.initListener();

    initializeAccessibility();
    await AnalyticsModule.trackVisit();
    DOM.artistProfileBackBtn?.addEventListener(
  "click",
  () => {
    SongsModule.closeArtistProfile();
  }
);

    const openAllView = async (viewType = "songs") => {
      const songs = AppState.get("songs") || [];

      document
        .getElementById("home-view")
        ?.classList.add("hidden");

      document
        .getElementById("site-hero")
        ?.classList.add("hidden");

      document
        .getElementById("artist-profile-view")
        ?.classList.add("hidden");

      DOM.allSongsView?.classList.remove("hidden");

      DOM.allSongsTitle &&
        (DOM.allSongsTitle.textContent =
          viewType === "artists"
            ? "All Artists"
            : "All Songs");

      DOM.allSongsList?.classList.toggle(
        "hidden",
        viewType === "artists"
      );

      DOM.allArtistsList?.classList.toggle(
        "hidden",
        viewType !== "artists"
      );

      if (viewType === "artists") {
        await ArtistModule.loadArtistsInto(
          DOM.allArtistsList
        );
      } else {
        SongsModule.renderSongRows(
          DOM.allSongsList,
          songs
        );
      }

      window.scrollTo({
        top: 0,
        behavior: "instant",
      });
    };

    const closeAllSongsView = () => {
      DOM.allSongsView?.classList.add("hidden");

      DOM.allSongsList?.classList.remove("hidden");
      DOM.allArtistsList?.classList.add("hidden");

      document
        .getElementById("home-view")
        ?.classList.remove("hidden");

      document
        .getElementById("site-hero")
        ?.classList.remove("hidden");

      window.scrollTo({
        top: 0,
        behavior: "instant",
      });
    };

    document
      .querySelectorAll(".view-all")
      .forEach((link) => {
        link.addEventListener("click", (event) => {
          event.preventDefault();
          openAllView(link.dataset.view || "songs");
        });
      });

    DOM.allSongsBackBtn?.addEventListener(
      "click",
      () => {
        closeAllSongsView();
      }
    );

    const closeAllOverlays = () => {
      DOM.allSongsView?.classList.add("hidden");
      DOM.allSongsList?.classList.remove("hidden");
      DOM.allArtistsList?.classList.add("hidden");

      document
        .getElementById("artist-profile-view")
        ?.classList.add("hidden");

      document
        .getElementById("home-view")
        ?.classList.remove("hidden");

      document
        .getElementById("site-hero")
        ?.classList.remove("hidden");
    };

    const scrollToSection = (id) => {
      closeAllOverlays();

      requestAnimationFrame(() => {
        document
          .getElementById(id)
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    };

    document
      .querySelectorAll(".nav-scroll-link")
      .forEach((link) => {
        link.addEventListener("click", (event) => {
          event.preventDefault();

          if (link.dataset.target) {
            scrollToSection(link.dataset.target);
          } else if (link.dataset.view) {
            openAllView(link.dataset.view);
          }
        });
      });

    document
      .getElementById("hero-discover-btn")
      ?.addEventListener("click", () => {
        scrollToSection("trending-section");
      });

    [
      document.getElementById("nav-contact-btn"),
      document.getElementById("mobile-nav-contact-btn"),
    ].forEach((btn) => {
      btn?.addEventListener("click", () => {
        scrollToSection("about-connect");
      });
    });
    DOM.openAuthBtn?.addEventListener(
      "click",
      openAuthModal
    );

    DOM.artistCtaBtn?.addEventListener(
      "click",
      openCreatorAuth
    );

    DOM.heroArtistBtn?.addEventListener(
      "click",
      openCreatorAuth
    );

    document
      .getElementById("mobile-artist-cta-btn")
      ?.addEventListener("click", openCreatorAuth);

    const mobileMenuBtn = document.getElementById(
      "mobile-menu-btn"
    );

    const mobileNavDrawer = document.getElementById(
      "mobile-nav-drawer"
    );

    const closeMobileNav = () => {
      mobileMenuBtn?.classList.remove("open");
      mobileMenuBtn?.setAttribute("aria-expanded", "false");
      mobileNavDrawer?.classList.add("hidden");
      mobileNavDrawer?.setAttribute("aria-hidden", "true");
      document.body.classList.remove("mobile-nav-open");
    };

    mobileMenuBtn?.addEventListener("click", () => {
      const isOpen = mobileMenuBtn.classList.toggle("open");

      mobileMenuBtn.setAttribute(
        "aria-expanded",
        String(isOpen)
      );

      mobileNavDrawer?.classList.toggle("hidden", !isOpen);
      mobileNavDrawer?.setAttribute(
        "aria-hidden",
        String(!isOpen)
      );

      document.body.classList.toggle(
        "mobile-nav-open",
        isOpen
      );
    });

    mobileNavDrawer
      ?.querySelectorAll("a")
      .forEach((link) =>
        link.addEventListener("click", closeMobileNav)
      );

    document
      .getElementById("mobile-nav-close-btn")
      ?.addEventListener("click", closeMobileNav);

    document
      .getElementById("mobile-nav-join-btn")
      ?.addEventListener("click", () => {
        closeMobileNav();
        openCreatorAuth();
      });

    DOM.closeAuthBtn?.addEventListener(
      "click",
      closeAuthModal
    );
    
    DOM.closeCreatorOnboardingBtn?.addEventListener(
  "click",
  closeCreatorOnboardingModal
);
    DOM.continueAuthBtn?.addEventListener(
  "click",
  AuthModule.authenticateCreator
);

    DOM.logoutBtn?.addEventListener(
      "click",
      AuthModule.logout
    );

    DOM.playBtn?.addEventListener(
      "click",
      () => EventBus.emit("player:toggle")
    );

    DOM.nextBtn?.addEventListener(
      "click",
      () => EventBus.emit("player:next")
    );

    DOM.prevBtn?.addEventListener(
      "click",
      () => EventBus.emit("player:prev")
    );

    DOM.uploadBtn?.addEventListener(
      "click",
      UploadModule.uploadSong
    );

    DOM.creatorSubmitBtn?.addEventListener(
  "click",
  CreatorModule.submitCreatorProfile
);
/*
|--------------------------------------------------------------------------
| Creator Lifecycle UI
|--------------------------------------------------------------------------
*/

EventBus.on(
  "creator:onboarding-required",
  () => {
    openCreatorOnboardingModal();
  }
);

EventBus.on(
  "creator:approved",
  () => {
    DOM.creatorSection?.classList.remove(
      "hidden"
    );

    DOM.creatorPendingState?.classList.add(
      "hidden"
    );
  }
);

EventBus.on(
  "creator:pending",
  () => {
    DOM.creatorPendingState?.classList.remove(
      "hidden"
    );

    DOM.creatorSection?.classList.add(
      "hidden"
    );
  }
);
await AuthModule.checkUser();

const authState =
  AppState.get("auth");

if (authState?.authenticated) {
if (authState?.authenticated) {
  const profile =
    await CreatorModule.loadCreatorProfile();

  console.log(
    "CREATOR PROFILE AFTER AUTH:",
    profile
  );
}
}
EventBus.on("songs:loaded", (songs) => {
  SongsModule.renderSongs(
    DOM.featuredSongs,
    songs
  );

  SongsModule.renderSongs(
    DOM.trendingSongs,
    songs
  );

  SongsModule.renderSongRows(
    DOM.newReleases,
    songs.slice(0, 6)
  );

  SongsModule.renderSongRows(
    DOM.allSongsList,
    songs
  );
});
await SongsModule.loadSongs();

    Logger.info("app_initialized");
  } catch (error) {
    ErrorHandler.handle(error, "App initialization failed", {
      module: "bootstrap",
    });
  }
});