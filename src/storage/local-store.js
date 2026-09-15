export const STORAGE_KEY = "ai-deal-hunter.phase1-state";
export const SCHEMA_VERSION = 1;

const DEFAULT_STATE = Object.freeze({
  schemaVersion: SCHEMA_VERSION,
  watchlists: [],
  targetConditions: {},
  alerts: [],
  compare: [],
  preferences: {
    appearance: "system",
    layout: "compact",
  },
});

function cloneDefaultState() {
  return JSON.parse(JSON.stringify(DEFAULT_STATE));
}

function normalizeState(candidate) {
  if (!candidate || candidate.schemaVersion !== SCHEMA_VERSION) {
    return cloneDefaultState();
  }

  return {
    ...cloneDefaultState(),
    ...candidate,
    preferences: {
      ...DEFAULT_STATE.preferences,
      ...(candidate.preferences ?? {}),
    },
  };
}

export function createPersistence(storage) {
  if (!storage || typeof storage.getItem !== "function" || typeof storage.setItem !== "function") {
    throw new TypeError("A Storage-compatible object is required");
  }

  function load() {
    try {
      const storedValue = storage.getItem(STORAGE_KEY);
      return storedValue ? normalizeState(JSON.parse(storedValue)) : cloneDefaultState();
    } catch {
      return cloneDefaultState();
    }
  }

  function save(state) {
    const normalized = normalizeState({ ...state, schemaVersion: SCHEMA_VERSION });
    storage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    return normalized;
  }

  function update(mutator) {
    const current = load();
    const next = mutator(current);
    return save(next ?? current);
  }

  function reset() {
    storage.removeItem(STORAGE_KEY);
    return cloneDefaultState();
  }

  return { load, save, update, reset };
}

export function createMemoryStorage(initialEntries = {}) {
  const values = new Map(Object.entries(initialEntries));
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
    removeItem(key) {
      values.delete(key);
    },
  };
}
