(function attachRunflatOptimizer(root) {
  "use strict";

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const isTerrainReady = (route) => Number.isFinite(route.gain) && Number.isFinite(route.maxGrade);

  function haversineMeters(a, b) {
    const radius = 6371000;
    const toRad = (value) => value * Math.PI / 180;
    const dLat = toRad(b[1] - a[1]);
    const dLon = toRad(b[0] - a[0]);
    const lat1 = toRad(a[1]);
    const lat2 = toRad(b[1]);
    const value = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    return 2 * radius * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
  }

  function resampleCoordinates(coords, count = 12) {
    if (!Array.isArray(coords) || coords.length < 2) return coords || [];
    const cumulative = [0];
    for (let index = 1; index < coords.length; index += 1) {
      cumulative.push(cumulative[index - 1] + haversineMeters(coords[index - 1], coords[index]));
    }
    const total = cumulative[cumulative.length - 1];
    const samples = [];
    let segment = 1;
    for (let index = 0; index < count; index += 1) {
      const target = (index / (count - 1)) * total;
      while (segment < cumulative.length - 1 && cumulative[segment] < target) segment += 1;
      const beforeDistance = cumulative[segment - 1];
      const afterDistance = cumulative[segment];
      const fraction = (target - beforeDistance) / Math.max(1, afterDistance - beforeDistance);
      const before = coords[segment - 1];
      const after = coords[segment];
      samples.push([before[0] + (after[0] - before[0]) * fraction, before[1] + (after[1] - before[1]) * fraction]);
    }
    return samples;
  }

  function routesAreSimilar(a, b) {
    if (Math.abs(a.distance - b.distance) / Math.max(.1, Math.min(a.distance, b.distance)) > .035) return false;
    const samplesA = resampleCoordinates(a.coords);
    const samplesB = resampleCoordinates(b.coords);
    if (samplesA.length !== samplesB.length || !samplesA.length) return false;
    const averageSeparation = samplesA.reduce((sum, point, index) => sum + haversineMeters(point, samplesB[index]), 0) / samplesA.length;
    return averageSeparation < 70;
  }

  function dedupeRoutes(routes, limit = 6) {
    const ordered = routes.slice().sort((a, b) =>
      (a.providerRouteIndex - b.providerRouteIndex) ||
      (a.seedOrder - b.seedOrder) ||
      (a.distance - b.distance)
    );
    const unique = [];
    for (const route of ordered) {
      if (!unique.some((candidate) => routesAreSimilar(route, candidate))) unique.push(route);
      if (unique.length === limit) break;
    }
    return unique.map((route, index) => ({ ...route, id: `route-${index}` }));
  }

  function dominates(a, b) {
    const noWorse = a.distance <= b.distance + .04 && a.gain <= b.gain + 10 && a.maxGrade <= b.maxGrade + .5;
    const meaningfullyBetter = a.distance < b.distance - .04 || a.gain < b.gain - 10 || a.maxGrade < b.maxGrade - .5;
    return noWorse && meaningfullyBetter;
  }

  function paretoFrontier(routes) {
    return routes.filter((route) => !routes.some((candidate) => candidate.id !== route.id && dominates(candidate, route)));
  }

  function rankRoutes(routes, preference) {
    if (!routes.length) return [];
    const shortestDistance = Math.min(...routes.map((route) => route.distance));
    const valid = routes.filter(isTerrainReady);
    const gains = valid.map((route) => route.gain).sort((a, b) => a - b);
    const minGain = gains[0] ?? 0;
    const p90Gain = gains[Math.min(gains.length - 1, Math.floor(gains.length * .9))] ?? minGain;
    const flatWeight = 1 - clamp(preference, 0, 100) / 100;
    const shorterWeight = 1 - flatWeight;
    const detourCap = .08 + flatWeight * .22;

    return routes.map((route) => {
      const distancePenalty = clamp((route.distance - shortestDistance) / Math.max(.05, shortestDistance * detourCap), 0, 1.5);
      const gainPenalty = isTerrainReady(route) ? clamp((route.gain - minGain) / Math.max(50, p90Gain - minGain), 0, 1.5) : 1.15;
      const gradePenalty = isTerrainReady(route) ? clamp((route.maxGrade - 4) / 8, 0, 1.5) : 1.15;
      const hillPenalty = .72 * gainPenalty + .28 * gradePenalty;
      return { ...route, score: shorterWeight * distancePenalty + flatWeight * hillPenalty };
    }).sort((a, b) => a.score - b.score || a.distance - b.distance);
  }

  function optimizeRoutes(candidates, preference) {
    if (!candidates.length) return { routes: [], ranked: [], stats: { evaluated: 0, eligible: 0, frontier: 0, terrain: 0, detourPercent: 0 } };
    const maxDetourCap = .30;
    const shortest = candidates.reduce((best, route) => route.distance < best.distance ? route : best);
    const eligible = candidates.filter((route) => route.distance <= shortest.distance * (1 + maxDetourCap) + .03);
    const terrainReady = eligible.filter(isTerrainReady);
    const frontier = terrainReady.length ? paretoFrontier(terrainReady) : eligible.slice();
    const pool = frontier.slice();
    if (!pool.some((route) => route.id === shortest.id)) pool.push(shortest);
    const ranked = rankRoutes(pool, preference);
    const flattest = terrainReady.length
      ? terrainReady.reduce((best, route) => route.gain < best.gain || (route.gain === best.gain && route.maxGrade < best.maxGrade) ? route : best)
      : null;
    const chosen = [];
    [ranked[0], flattest, shortest, ...ranked].forEach((route) => {
      if (route && chosen.length < 3 && !chosen.some((candidate) => candidate.id === route.id)) chosen.push(route);
    });
    const chosenIds = new Set(chosen.map((route) => route.id));
    const presentation = ranked.filter((route) => chosenIds.has(route.id));
    return {
      routes: presentation,
      ranked: rankRoutes(presentation, preference),
      stats: {
        evaluated: candidates.length,
        eligible: eligible.length,
        frontier: frontier.length,
        terrain: candidates.filter(isTerrainReady).length,
        detourPercent: Math.round(maxDetourCap * 100)
      }
    };
  }

  const api = { clamp, dedupeRoutes, dominates, optimizeRoutes, paretoFrontier, rankRoutes, resampleCoordinates, routesAreSimilar };
  root.RunflatOptimizer = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
