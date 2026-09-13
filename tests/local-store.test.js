import test from "node:test";
import assert from "node:assert/strict";
import {
  createMemoryStorage,
  createPersistence,
  SCHEMA_VERSION,
  STORAGE_KEY,
} from "../src/storage/local-store.js";

test("persistence returns isolated default state", () => {
  const persistence = createPersistence(createMemoryStorage());
  const first = persistence.load();
  first.watchlists.push({ id: "changed" });
  const second = persistence.load();

  assert.equal(second.schemaVersion, SCHEMA_VERSION);
  assert.deepEqual(second.watchlists, []);
});

test("persistence saves and reloads Phase 1 state", () => {
  const storage = createMemoryStorage();
  const persistence = createPersistence(storage);
  persistence.save({
    ...persistence.load(),
    watchlists: [{ id: "phones", name: "Phones" }],
    targetConditions: { phones: { maxPrice: 20500, minimumDealScore: 80 } },
    alerts: [{ id: "alert-1", type: "price", enabled: true }],
    compare: ["listing-iphone-17-air-256"],
    preferences: { appearance: "light", layout: "compact" },
  });

  const reloaded = persistence.load();
  assert.equal(reloaded.watchlists[0].name, "Phones");
  assert.equal(reloaded.targetConditions.phones.maxPrice, 20500);
  assert.equal(reloaded.alerts[0].type, "price");
  assert.deepEqual(reloaded.compare, ["listing-iphone-17-air-256"]);
  assert.equal(reloaded.preferences.appearance, "light");
});

test("invalid or old stored data safely falls back to defaults", () => {
  const invalidJson = createPersistence(createMemoryStorage({ [STORAGE_KEY]: "not-json" }));
  assert.deepEqual(invalidJson.load().watchlists, []);

  const oldVersion = createPersistence(createMemoryStorage({
    [STORAGE_KEY]: JSON.stringify({ schemaVersion: 0, watchlists: [{ id: "old" }] }),
  }));
  assert.deepEqual(oldVersion.load().watchlists, []);
});
