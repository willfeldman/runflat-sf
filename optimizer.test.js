"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { dedupeRoutes, optimizeRoutes, paretoFrontier, rankRoutes } = require("./optimizer.js");

const line = (offset = 0) => [[-122.45, 37.77 + offset], [-122.43, 37.78 + offset], [-122.41, 37.79 + offset]];
const route = (id, distance, gain, maxGrade, offset = 0, extra = {}) => ({
  id, distance, gain, maxGrade, coords: line(offset), providerRouteIndex: 0, seedOrder: 0, ...extra
});

test("dedupeRoutes removes aligned near-identical geometry", () => {
  const unique = dedupeRoutes([
    route("a", 3, null, null),
    route("b", 3.03, null, null, .00005, { providerRouteIndex: 1 }),
    route("c", 3.1, null, null, .006, { seedOrder: 1 })
  ]);
  assert.equal(unique.length, 2);
});

test("paretoFrontier removes a route worse on distance, gain, and grade", () => {
  const routes = [route("a", 3, 180, 7), route("b", 3.3, 240, 9), route("c", 3.5, 120, 5)];
  assert.deepEqual(paretoFrontier(routes).map((candidate) => candidate.id).sort(), ["a", "c"]);
});

test("preference changes the recommended route", () => {
  const routes = [route("short", 3, 260, 9), route("balanced", 3.25, 170, 6), route("flat", 3.65, 90, 4)];
  assert.equal(rankRoutes(routes, 100)[0].id, "short");
  assert.equal(rankRoutes(routes, 0)[0].id, "flat");
});

test("optimization enforces a 30% maximum detour limit", () => {
  const candidates = [route("short", 3, 250, 9), route("reasonable", 3.6, 120, 5), route("loop", 4.2, 20, 2)];
  const result = optimizeRoutes(candidates, 0);
  assert.equal(result.stats.detourPercent, 30);
  assert.ok(result.routes.some((candidate) => candidate.id === "reasonable"));
  assert.ok(!result.routes.some((candidate) => candidate.id === "loop"));
});

test("shortest remains available when its terrain sample fails", () => {
  const candidates = [route("short", 3, null, null), route("flat", 3.3, 100, 5)];
  const result = optimizeRoutes(candidates, 100);
  assert.equal(result.ranked[0].id, "short");
});
