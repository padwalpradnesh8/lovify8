import { EventBus } from "./event-bus.js";

export const AppState = (() => {
  const state = {
  /*
  |--------------------------------------------------------------------------
  | Legacy State
  |--------------------------------------------------------------------------
  | Keep during gradual migration.
  | Existing modules still depend on these.
  |--------------------------------------------------------------------------
  */

  user: null,
  songs: [],
  currentSong: null,
  queue: [],
  currentArtistProfile: null,
  /*
  |--------------------------------------------------------------------------
  | Domain State
  |--------------------------------------------------------------------------
  */

  auth: {
    user: null,
    authenticated: false,
  },

  creator: {
    profile: null,
    approved: false,
    onboardingComplete: false,
  },

  player: {
    currentSong: null,
    queue: [],
  },

  loading: {
    songs: false,
    upload: false,
    auth: false,
    creator: false,
  },

  pagination: {
    offset: 0,
    hasMore: true,
    fetching: false,
  },
};
  return {
  getState() {
    return state;
  },

  get(key) {
      return state[key];
    },

    set(key, value) {
      state[key] = value;
      EventBus.emit(`state:${key}`, value);
    },

    patch(key, value) {
  const current =
    typeof state[key] === "object" &&
    state[key] !== null
      ? state[key]
      : {};

  state[key] = {
    ...current,
    ...value,
  };

  EventBus.emit(`state:${key}`, state[key]);
},
  };
})();