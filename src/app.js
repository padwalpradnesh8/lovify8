import "./config/config.js";
import "./core/dom.js";
import "./core/logger.js";
import "./core/cache.js";
import "./core/error-handler.js";
import "./core/event-bus.js";
import "./core/app-state.js";
import "./utils/utils.js";
import "./ui/ui-components.js";
import "./ui/toast.js";
import "./ui/reactive-ui.js";
import "./ui/accessibility.js";
import "./services/supabase-helpers.js";
import "./auth/auth-helpers.js";
import "./auth/auth-module.js";
import "./songs/songs-module.js";
import "./artist/artist-module.js";
import "./player/player-module.js";
import "./player/player-ui-events.js";
import "./upload/upload-module.js";
import "./analytics/analytics-module.js";
import "./bootstrap/init.js";
if (
  "serviceWorker" in navigator
) {
  window.addEventListener(
    "load",
    () => {
      navigator.serviceWorker
        .register("/sw.js")
        .catch(console.error);
    }
  );
}