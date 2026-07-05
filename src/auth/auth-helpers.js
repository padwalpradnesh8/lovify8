import { DOM } from "../core/dom.js";
import { AppState } from "../core/app-state.js";
import { toast } from "../ui/toast.js";

export function openAuthModal() {
  if (!DOM.authModal) return;

  DOM.authModal.classList.remove("hidden");
  DOM.authModal.setAttribute("aria-hidden", "false");

  DOM.authEmail?.focus();
}

export function closeAuthModal() {
  if (!DOM.authModal) return;

  DOM.authModal.classList.add("hidden");
  DOM.authModal.setAttribute("aria-hidden", "true");

  DOM.openAuthBtn?.focus();
}
export function openCreatorOnboardingModal() {
  if (!DOM.creatorOnboardingModal) return;

  DOM.creatorOnboardingModal.classList.remove(
    "hidden"
  );

  DOM.creatorOnboardingModal.setAttribute(
    "aria-hidden",
    "false"
  );
  document.body.classList.add("modal-open");
  DOM.creatorArtistName?.focus();
}

export function closeCreatorOnboardingModal() {
  if (!DOM.creatorOnboardingModal) return;

  DOM.creatorOnboardingModal.classList.add(
    "hidden"
  );

  DOM.creatorOnboardingModal.setAttribute(
    "aria-hidden",
    "true"
  );
 document.body.classList.remove("modal-open");
}
export function openCreatorAuth() {
  openAuthModal();

  const title = DOM.authModal?.querySelector("h2");
  const subtitle = DOM.authModal?.querySelector("p");

  if (title) {
    title.textContent = "Become a Lovify Artist";
  }

  if (subtitle) {
    subtitle.textContent =
      "Create your creator account. Your account will remain pending until approved.";
  }
}

export function requireAuth(callback) {
  const authState =
    AppState.get("auth");

  const legacyUser =
    AppState.get("user");

  const user =
    authState?.user || legacyUser;

  if (!user) {
    toast("Please sign in");
    openAuthModal();
    return;
  }

  callback(user);
}

export function requireApprovedCreator(
  callback
) {
  requireAuth(() => {
    const creatorState =
      AppState.get("creator");

    const profile =
      creatorState?.profile;

    /*
    |--------------------------------------------------------------------------
    | Transitional Legacy Support
    |--------------------------------------------------------------------------
    */

    const legacyUser =
      AppState.get("user");

    const legacyApproved =
      legacyUser?.role === "creator" &&
      legacyUser?.approved;

    /*
    |--------------------------------------------------------------------------
    | Future Creator Architecture
    |--------------------------------------------------------------------------
    */

    const creatorApproved =
      profile?.approval_status ===
      "approved";

    if (
      !legacyApproved &&
      !creatorApproved
    ) {
      toast(
        "Your creator account is pending approval"
      );

      return;
    }

    callback(profile || legacyUser);
  });
}