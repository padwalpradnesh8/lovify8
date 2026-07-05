import { DOM } from "../core/dom.js";
import { EventBus } from "../core/event-bus.js";
import { ErrorHandler } from "../core/error-handler.js";
import { UIComponents } from "../ui/ui-components.js";
import { SongsModule } from "../songs/songs-module.js";

export const ArtistModule = (() => {
  async function loadArtists(container = DOM.artistGrid) {
    if (!container) return [];

    try {
      const { data, error } =
        await supabaseClient
          .from("creators")
          .select("*")
          .eq(
            "approval_status",
            "approved"
          )
          .order("created_at", {
            ascending: false,
          });

      if (error) {
        throw error;
      }

      renderArtists(data || [], container);
      return data || [];
    } catch (error) {
      ErrorHandler.handle(
        error,
        "Failed to load artists",
        {
          module: "ArtistModule",
        }
      );
    }
  }

  function renderArtists(artists, container = DOM.artistGrid) {
    if (!container) return;

    container.replaceChildren();

    if (!artists?.length) {
      container.appendChild(
        UIComponents.createEmptyState(
          "No artists found"
        )
      );

      return;
    }

    const fragment =
      document.createDocumentFragment();

    artists.forEach((artist) => {
      fragment.appendChild(
        UIComponents.createArtistCard(
          artist
        )
      );
    });

    container.appendChild(fragment);
  }

  function init() {
    EventBus.on(
      "artist:open",
      async (artist) => {
        await SongsModule.loadArtistProfile(
          artist
        );
      }
    );

    loadArtists();
  }

  return {
    init,
    loadArtists,
    loadArtistsInto: loadArtists,
  };
})();