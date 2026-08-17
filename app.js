const API = {
  route: "https://api.trailsplits.com/route/v1",
  elevation: "https://api.trailsplits.com/tiles/v1/elevation/current/sample",
  geocode: "https://photon.komoot.io/api/",
  reverse: "https://photon.komoot.io/reverse"
};

const SF = {
  center: [-122.431, 37.7749],
  bounds: [[-122.56, 37.68], [-122.33, 37.86]],
  searchBbox: "-122.55,37.69,-122.34,37.85"
};

const landmarks = [
  { label: "Ferry Building", detail: "Embarcadero", coords: [-122.3935, 37.7955] },
  { label: "Marina Green", detail: "Marina District", coords: [-122.4384, 37.8066] },
  { label: "Crissy Field", detail: "Presidio waterfront", coords: [-122.4649, 37.8039] },
  { label: "Dolores Park", detail: "Mission District", coords: [-122.4269, 37.7596] },
  { label: "JFK Promenade", detail: "Golden Gate Park", coords: [-122.4662, 37.7714] },
  { label: "Oracle Park", detail: "Mission Bay", coords: [-122.3893, 37.7786] },
  { label: "Ocean Beach", detail: "Great Highway", coords: [-122.5103, 37.7697] },
  { label: "Lake Merced", detail: "Southwest San Francisco", coords: [-122.4858, 37.7295] }
];

const state = {
  points: { start: null, end: null, waypoint: null },
  pinMode: "start",
  map: null,
  mapReady: false,
  markers: {},
  routes: [],
  selectedRoute: null,
  preference: 22,
  surface: "mixed",
  pace: 10,
  avoidStairs: true,
  loading: false,
  requestVersion: 0,
  searchControllers: {},
  profileMarker: null,
  ignoreMapClickUntil: 0,
  saved: JSON.parse(localStorage.getItem("runflat-saved-v2") || "[]")
};

const el = (id) => document.getElementById(id);
const pointInput = (type) => el(`${type}Input`);
const pointSuggestions = (type) => el(`${type}Suggestions`);
let toastTimer;
let searchTimer;
let replanTimer;

function escapeHtml(value = "") {
  return String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
}

function showToast(message) {
  clearTimeout(toastTimer);
  el("toast").textContent = message;
  el("toast").classList.add("show");
  toastTimer = setTimeout(() => el("toast").classList.remove("show"), 2600);
}

function showMessage(message) {
  el("inlineMessage").textContent = message;
  el("inlineMessage").hidden = false;
}

function clearMessage() {
  el("inlineMessage").hidden = true;
}

function isInsideSF(coords) {
  return coords[0] >= SF.bounds[0][0] && coords[0] <= SF.bounds[1][0] && coords[1] >= SF.bounds[0][1] && coords[1] <= SF.bounds[1][1];
}

function formatPlace(properties = {}) {
  const label = properties.name || properties.street || properties.city || "Dropped pin";
  const parts = [properties.housenumber && properties.street ? `${properties.housenumber} ${properties.street}` : properties.street, properties.district, properties.city]
    .filter(Boolean)
    .filter((part, index, array) => array.indexOf(part) === index && part !== label);
  return { label, detail: parts.slice(0, 2).join(" · ") || "San Francisco" };
}

async function fetchJson(url, options = {}, timeout = 16000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    if (!response.ok) throw new Error(`Service returned ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

function initMap() {
  if (!window.maplibregl) {
    el("mapError").hidden = false;
    return;
  }

  state.map = new maplibregl.Map({
    container: "map",
    center: SF.center,
    zoom: 12.7,
    minZoom: 10.5,
    maxZoom: 18,
    maxBounds: SF.bounds,
    attributionControl: false,
    style: {
      version: 8,
      sources: {
        carto: {
          type: "raster",
          tiles: ["https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png"],
          tileSize: 256,
          attribution: "© OpenStreetMap contributors © CARTO"
        }
      },
      layers: [{ id: "carto-base", type: "raster", source: "carto", paint: { "raster-saturation": -0.2, "raster-contrast": 0.03, "raster-brightness-max": 0.97 } }]
    }
  });

  state.map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
  state.map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");

  state.map.on("load", () => {
    state.mapReady = true;
    state.map.addSource("route-options", { type: "geojson", data: emptyFeatureCollection() });
    state.map.addLayer({
      id: "route-casing",
      type: "line",
      source: "route-options",
      paint: {
        "line-color": "rgba(255,255,255,.94)",
        "line-width": ["case", ["boolean", ["get", "selected"], false], 11, 8],
        "line-opacity": ["case", ["boolean", ["get", "selected"], false], 1, .76]
      },
      layout: { "line-cap": "round", "line-join": "round" }
    });
    state.map.addLayer({
      id: "route-lines",
      type: "line",
      source: "route-options",
      paint: {
        "line-color": ["case", ["boolean", ["get", "selected"], false], "#1a725f", "#738681"],
        "line-width": ["case", ["boolean", ["get", "selected"], false], 7, 4],
        "line-opacity": ["case", ["boolean", ["get", "selected"], false], 1, .52]
      },
      layout: { "line-cap": "round", "line-join": "round" }
    });
    state.map.addLayer({
      id: "route-hit",
      type: "line",
      source: "route-options",
      paint: { "line-color": "rgba(0,0,0,0)", "line-width": 22 },
      layout: { "line-cap": "round", "line-join": "round" }
    });

    state.map.on("mouseenter", "route-hit", () => { state.map.getCanvas().style.cursor = "pointer"; });
    state.map.on("mouseleave", "route-hit", () => { state.map.getCanvas().style.cursor = "crosshair"; });
    state.map.on("click", "route-hit", (event) => {
      const routeId = event.features?.[0]?.properties?.id;
      if (!routeId) return;
      state.ignoreMapClickUntil = Date.now() + 120;
      selectRoute(routeId, false);
    });
    state.map.getCanvas().style.cursor = "crosshair";
  });

  state.map.on("click", (event) => {
    if (Date.now() < state.ignoreMapClickUntil) return;
    const coords = [event.lngLat.lng, event.lngLat.lat];
    if (!isInsideSF(coords)) return showMessage("Choose a point inside San Francisco.");
    setPoint(state.pinMode, { label: "Dropped pin", detail: formatCoordinates(coords), coords }, { reverse: true, autoPlan: true });
  });

  state.map.on("error", (event) => {
    if (!state.mapReady && /style|source/i.test(event?.error?.message || "")) el("mapError").hidden = false;
  });
}

function emptyFeatureCollection() {
  return { type: "FeatureCollection", features: [] };
}

function formatCoordinates(coords) {
  return `${coords[1].toFixed(4)}, ${coords[0].toFixed(4)}`;
}

function setPinMode(mode) {
  if (mode === "waypoint" && el("waypointField").hidden) return;
  state.pinMode = mode;
  document.querySelectorAll("[data-map-mode]").forEach((button) => {
    const active = button.dataset.mapMode === mode;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", active.toString());
  });
  const names = { start: "start", end: "end", waypoint: "stop" };
  el("mapHint").querySelector("span:last-child").textContent = `Tap anywhere to set your ${names[mode]}`;
}

function makeMarker(type, coords) {
  state.markers[type]?.remove();
  const markerElement = document.createElement("div");
  markerElement.className = `map-marker ${type}`;
  markerElement.setAttribute("aria-label", `${type} point`);
  markerElement.innerHTML = `<span>${type === "start" ? "A" : type === "end" ? "B" : "+"}</span>`;
  const marker = new maplibregl.Marker({ element: markerElement, anchor: "bottom", draggable: true })
    .setLngLat(coords)
    .addTo(state.map);
  marker.on("dragstart", () => clearMessage());
  marker.on("dragend", async () => {
    const lngLat = marker.getLngLat();
    const nextCoords = [lngLat.lng, lngLat.lat];
    state.points[type] = { label: "Dropped pin", detail: formatCoordinates(nextCoords), coords: nextCoords };
    updatePointUI(type);
    await reverseGeocodePoint(type);
    if (state.points.start && state.points.end) planRoutes();
  });
  state.markers[type] = marker;
}

async function setPoint(type, point, options = {}) {
  clearMessage();
  state.points[type] = point;
  updatePointUI(type);
  if (state.mapReady) makeMarker(type, point.coords);

  if (type === "start" && !state.points.end) setPinMode("end");
  else if (type === "end" && el("waypointField").hidden) setPinMode("end");
  else if (type === "waypoint") setPinMode("end");

  updatePlannerState();
  closeSuggestions();
  if (options.reverse) await reverseGeocodePoint(type);
  if (options.autoPlan && state.points.start && state.points.end) planRoutes();
}

async function reverseGeocodePoint(type) {
  const point = state.points[type];
  if (!point) return;
  try {
    const [lon, lat] = point.coords;
    const data = await fetchJson(`${API.reverse}?lon=${lon}&lat=${lat}&limit=1`, {}, 9000);
    const feature = data.features?.[0];
    if (!feature || !state.points[type] || state.points[type].coords[0] !== lon || state.points[type].coords[1] !== lat) return;
    const place = formatPlace(feature.properties);
    state.points[type] = { ...state.points[type], ...place };
    updatePointUI(type);
  } catch {
    // Coordinates remain a useful fallback when reverse geocoding is unavailable.
  }
}

function updatePointUI(type) {
  const input = pointInput(type);
  const point = state.points[type];
  if (!input) return;
  input.value = point?.label || "";
  const clearButton = document.querySelector(`[data-clear="${type}"]`);
  if (clearButton) clearButton.hidden = !point && type !== "waypoint";
}

function clearPoint(type, options = {}) {
  state.points[type] = null;
  state.markers[type]?.remove();
  delete state.markers[type];
  if (pointInput(type)) pointInput(type).value = "";
  const clearButton = document.querySelector(`[data-clear="${type}"]`);
  if (clearButton && type !== "waypoint") clearButton.hidden = true;
  if (type === "waypoint") {
    el("waypointField").hidden = true;
    el("waypointModeButton").hidden = true;
    el("addStopButton").hidden = false;
    setPinMode(state.points.end ? "end" : "start");
  }
  if (!options.keepRoutes) clearRoutes();
  updatePlannerState();
}

function updatePlannerState() {
  const ready = Boolean(state.points.start && state.points.end);
  el("planButton").disabled = !ready || state.loading;
  el("planButton").querySelector(".plan-label").textContent = ready ? (state.routes.length ? "Replan route" : "Plan flatter route") : "Choose a start and end";
  const prompt = !state.points.start ? "Tap the map to set your start" : !state.points.end ? "Now choose your end point" : "Drag either pin to fine-tune your route";
  el("mapPrompt").querySelector("span").textContent = prompt;
  el("mapHint").querySelector("span:last-child").textContent = prompt;
}

function closeSuggestions(except) {
  ["start", "end", "waypoint"].forEach((type) => {
    if (type !== except && pointSuggestions(type)) pointSuggestions(type).hidden = true;
  });
}

function renderSuggestions(type, places) {
  const container = pointSuggestions(type);
  if (!container) return;
  if (!places.length) {
    container.innerHTML = `<div class="suggestion-empty">No San Francisco matches found.</div>`;
    container.hidden = false;
    return;
  }
  container.innerHTML = places.map((place, index) => `
    <button class="suggestion" type="button" role="option" data-index="${index}">
      <span class="suggestion-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s6-5.7 6-12a6 6 0 1 0-12 0c0 6.3 6 12 6 12Z"/><circle cx="12" cy="9" r="2.2"/></svg></span>
      <span><strong>${escapeHtml(place.label)}</strong><small>${escapeHtml(place.detail)}</small></span>
    </button>`).join("");
  container.hidden = false;
  container.querySelectorAll(".suggestion").forEach((button) => {
    button.addEventListener("pointerdown", (event) => event.preventDefault());
    button.addEventListener("click", () => setPoint(type, places[Number(button.dataset.index)], { autoPlan: true }));
  });
}

function localMatches(query = "") {
  const normalized = query.trim().toLowerCase();
  return landmarks.filter((place) => !normalized || `${place.label} ${place.detail}`.toLowerCase().includes(normalized)).slice(0, 6);
}

async function searchPlaces(type, query) {
  state.searchControllers[type]?.abort();
  const controller = new AbortController();
  state.searchControllers[type] = controller;
  const local = localMatches(query);
  if (query.trim().length < 3) return renderSuggestions(type, local);
  try {
    const url = `${API.geocode}?q=${encodeURIComponent(query)}&limit=7&bbox=${SF.searchBbox}&lat=${SF.center[1]}&lon=${SF.center[0]}`;
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error("Search unavailable");
    const data = await response.json();
    const remote = (data.features || []).map((feature) => {
      const place = formatPlace(feature.properties);
      return { ...place, coords: feature.geometry.coordinates };
    }).filter((place) => isInsideSF(place.coords));
    const combined = [...local, ...remote].filter((place, index, array) => array.findIndex((candidate) => candidate.label === place.label && Math.abs(candidate.coords[0] - place.coords[0]) < .0005) === index).slice(0, 7);
    renderSuggestions(type, combined);
  } catch (error) {
    if (error.name !== "AbortError") renderSuggestions(type, local);
  }
}

function bindSearch(type) {
  const input = pointInput(type);
  if (!input) return;
  input.addEventListener("focus", () => {
    setPinMode(type);
    closeSuggestions(type);
    searchPlaces(type, input.value);
  });
  input.addEventListener("input", () => {
    if (state.points[type] && input.value !== state.points[type].label) {
      state.points[type] = null;
      state.markers[type]?.remove();
      delete state.markers[type];
      clearRoutes();
      updatePlannerState();
    }
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => searchPlaces(type, input.value), 450);
  });
  input.addEventListener("keydown", (event) => {
    if (event.key === "Escape") pointSuggestions(type).hidden = true;
    if (event.key === "Enter") {
      event.preventDefault();
      pointSuggestions(type).querySelector(".suggestion")?.click();
    }
  });
}

function decodePolyline(encoded, precision = 6) {
  let index = 0;
  let lat = 0;
  let lon = 0;
  const coordinates = [];
  const factor = 10 ** precision;
  while (index < encoded.length) {
    let result = 0;
    let shift = 0;
    let byte;
    do { byte = encoded.charCodeAt(index++) - 63; result |= (byte & 0x1f) << shift; shift += 5; } while (byte >= 0x20);
    lat += (result & 1) ? ~(result >> 1) : (result >> 1);
    result = 0;
    shift = 0;
    do { byte = encoded.charCodeAt(index++) - 63; result |= (byte & 0x1f) << shift; shift += 5; } while (byte >= 0x20);
    lon += (result & 1) ? ~(result >> 1) : (result >> 1);
    coordinates.push([lon / factor, lat / factor]);
  }
  return coordinates;
}

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

function candidateLocations(direction) {
  const base = [state.points.start, state.points.waypoint, state.points.end].filter(Boolean).map((point) => point.coords);
  if (!direction) return base.map(([lon, lat]) => ({ lon, lat, type: "break" }));
  let longestIndex = 0;
  let longestDistance = 0;
  for (let index = 0; index < base.length - 1; index += 1) {
    const distance = haversineMeters(base[index], base[index + 1]);
    if (distance > longestDistance) { longestDistance = distance; longestIndex = index; }
  }
  const from = base[longestIndex];
  const to = base[longestIndex + 1];
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const norm = Math.hypot(dx, dy) || 1;
  const offset = Math.max(.0028, Math.min(.008, (longestDistance / 1609.344) * .0017));
  const via = [(from[0] + to[0]) / 2 + direction * (-dy / norm) * offset, (from[1] + to[1]) / 2 + direction * (dx / norm) * offset];
  const withVia = [...base];
  withVia.splice(longestIndex + 1, 0, via);
  return withVia.map(([lon, lat], index) => ({ lon, lat, type: index === 0 || index === withVia.length - 1 ? "break" : "through" }));
}

async function fetchRoute(direction, index) {
  const walkwayFactors = { paved: 1.15, mixed: .9, paths: .65 };
  const hikingDifficulty = { paved: 0, mixed: 1, paths: 2 };
  const body = {
    locations: candidateLocations(direction),
    costing: "pedestrian",
    directions_options: { units: "miles", language: "en", format: "osrm" },
    costing_options: {
      pedestrian: {
        walking_speed: Math.min(15, 96.56 / state.pace),
        walkway_factor: walkwayFactors[state.surface],
        max_hiking_difficulty: hikingDifficulty[state.surface],
        step_penalty: state.avoidStairs ? 1200 : 30
      }
    }
  };
  const data = await fetchJson(API.route, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }, 22000);
  const result = data.routes?.[0];
  if (!result?.geometry) throw new Error("No route found");
  return {
    id: `route-${index}`,
    coords: decodePolyline(result.geometry, 6),
    distance: result.distance / 1609.344,
    serviceDuration: result.duration,
    maneuvers: result.legs?.flatMap((leg) => leg.steps || []) || [],
    candidateDirection: direction
  };
}

function resampleLine(coords, count) {
  const cumulative = [0];
  for (let index = 1; index < coords.length; index += 1) cumulative.push(cumulative[index - 1] + haversineMeters(coords[index - 1], coords[index]));
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
    samples.push({ coords: [before[0] + (after[0] - before[0]) * fraction, before[1] + (after[1] - before[1]) * fraction], distanceM: target });
  }
  return samples;
}

async function addElevation(route) {
  const count = Math.max(34, Math.min(82, Math.round(route.distance * 12)));
  const samples = resampleLine(route.coords, count);
  const points = samples.map((sample) => `${sample.coords[1].toFixed(6)},${sample.coords[0].toFixed(6)}`).join("|");
  try {
    const data = await fetchJson(`${API.elevation}?z=12&encoding=mapbox&points=${encodeURIComponent(points)}`, {}, 18000);
    const raw = data.points.map((point) => Number(point.elevation_m));
    const smooth = raw.map((value, index) => {
      const start = Math.max(0, index - 1);
      const end = Math.min(raw.length, index + 2);
      return raw.slice(start, end).reduce((sum, current) => sum + current, 0) / (end - start);
    });
    let gainM = 0;
    let maxGrade = 0;
    for (let index = 1; index < smooth.length; index += 1) {
      const rise = smooth[index] - smooth[index - 1];
      if (rise > .35) gainM += rise;
      if (index >= 2) {
        const windowRise = smooth[index] - smooth[index - 2];
        const run = samples[index].distanceM - samples[index - 2].distanceM;
        maxGrade = Math.max(maxGrade, (windowRise / Math.max(1, run)) * 100);
      }
    }
    return {
      ...route,
      gain: Math.round((gainM * 3.28084) / 5) * 5,
      maxGrade: Math.max(0, maxGrade),
      highPoint: Math.round(Math.max(...smooth) * 3.28084),
      lowPoint: Math.round(Math.min(...smooth) * 3.28084),
      profile: samples.map((sample, index) => ({ ...sample, elevationFt: smooth[index] * 3.28084 }))
    };
  } catch {
    return { ...route, gain: null, maxGrade: null, highPoint: null, lowPoint: null, profile: null };
  }
}

function routeSignature(route) {
  const sample = route.coords[Math.floor(route.coords.length / 2)] || route.coords[0];
  return `${route.distance.toFixed(2)}:${sample[0].toFixed(3)}:${sample[1].toFixed(3)}`;
}

function rankRoutes() {
  if (!state.routes.length) return [];
  const distances = state.routes.map((route) => route.distance);
  const gains = state.routes.map((route) => route.gain).filter(Number.isFinite);
  const minDistance = Math.min(...distances);
  const maxDistance = Math.max(...distances);
  const minGain = gains.length ? Math.min(...gains) : 0;
  const maxGain = gains.length ? Math.max(...gains) : 0;
  const distanceRange = Math.max(.05, maxDistance - minDistance);
  const gainRange = Math.max(10, maxGain - minGain);
  const shorterWeight = state.preference / 100;
  return state.routes.map((route) => {
    const distanceScore = (route.distance - minDistance) / distanceRange;
    const gainScore = Number.isFinite(route.gain) ? (route.gain - minGain) / gainRange : .5;
    return { ...route, score: shorterWeight * distanceScore + (1 - shorterWeight) * gainScore };
  }).sort((a, b) => a.score - b.score);
}

async function planRoutes() {
  if (!state.points.start || !state.points.end || state.loading) return;
  clearMessage();
  const version = ++state.requestVersion;
  state.loading = true;
  el("planButton").classList.add("loading");
  el("planButton").disabled = true;
  el("mapLoading").hidden = false;
  el("mapHint").hidden = true;

  try {
    const attempts = await Promise.allSettled([fetchRoute(0, 0), fetchRoute(1, 1), fetchRoute(-1, 2)]);
    if (version !== state.requestVersion) return;
    const unique = [];
    const signatures = new Set();
    attempts.forEach((attempt) => {
      if (attempt.status !== "fulfilled") return;
      const signature = routeSignature(attempt.value);
      if (!signatures.has(signature)) { signatures.add(signature); unique.push(attempt.value); }
    });
    if (!unique.length) throw new Error("We couldn’t find a runnable connection between those points.");
    state.routes = await Promise.all(unique.map(addElevation));
    if (version !== state.requestVersion) return;
    const ranked = rankRoutes();
    state.selectedRoute = ranked[0];
    renderResults();
    renderRoutesOnMap(true);
    el("routeResults").hidden = false;
    el("routeResults").scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "nearest" });
  } catch (error) {
    showMessage(error.message || "Routing is temporarily unavailable. Keep your pins in place and try again.");
    clearRoutes();
  } finally {
    if (version === state.requestVersion) {
      state.loading = false;
      el("planButton").classList.remove("loading");
      el("mapLoading").hidden = true;
      el("mapHint").hidden = false;
      updatePlannerState();
    }
  }
}

function clearRoutes() {
  state.requestVersion += 1;
  state.routes = [];
  state.selectedRoute = null;
  el("routeResults").hidden = true;
  if (state.mapReady && state.map.getSource("route-options")) state.map.getSource("route-options").setData(emptyFeatureCollection());
  removeProfileMarker();
}

function optionLabel(route) {
  const validGains = state.routes.filter((candidate) => Number.isFinite(candidate.gain));
  const flattest = validGains.length ? validGains.reduce((best, candidate) => candidate.gain < best.gain ? candidate : best) : null;
  const shortest = state.routes.reduce((best, candidate) => candidate.distance < best.distance ? candidate : best);
  if (flattest?.id === route.id && shortest.id === route.id) return "Best overall";
  if (flattest?.id === route.id) return "Flattest";
  if (shortest.id === route.id) return "Shortest";
  return "Alternative";
}

function selectRoute(routeId, fit = true) {
  const route = state.routes.find((candidate) => candidate.id === routeId);
  if (!route) return;
  state.selectedRoute = route;
  renderResults();
  renderRoutesOnMap(fit);
}

function renderResults() {
  if (!state.selectedRoute) return;
  const ranked = rankRoutes();
  const route = state.selectedRoute;
  const label = optionLabel(route);
  el("resultBadge").textContent = label === "Flattest" || label === "Best overall" ? "Lowest-climb option found" : `${label} option`;
  el("resultTitle").textContent = label === "Shortest" ? "The direct route" : label === "Flattest" ? "Your flatter route" : "A balanced route";
  el("routeOptions").innerHTML = ranked.map((candidate) => `
    <button class="route-option ${candidate.id === route.id ? "active" : ""}" type="button" role="radio" aria-checked="${candidate.id === route.id}" data-route-id="${candidate.id}">
      <strong>${escapeHtml(optionLabel(candidate))}</strong>
      <span>${candidate.distance.toFixed(1)} mi · ${Number.isFinite(candidate.gain) ? `+${candidate.gain} ft` : "elev. n/a"}</span>
    </button>`).join("");
  el("routeOptions").querySelectorAll(".route-option").forEach((button) => button.addEventListener("click", () => selectRoute(button.dataset.routeId)));

  el("distanceStat").textContent = route.distance.toFixed(1);
  el("gainStat").textContent = Number.isFinite(route.gain) ? `+${route.gain}` : "—";
  el("timeStat").textContent = formatDuration(route.distance * state.pace);
  el("gradeStat").textContent = Number.isFinite(route.maxGrade) ? `${route.maxGrade.toFixed(1)}%` : "Unavailable";
  el("highStat").textContent = Number.isFinite(route.highPoint) ? `${route.highPoint} ft` : "Unavailable";
  el("midpointLabel").textContent = `${(route.distance / 2).toFixed(1)} mi`;
  el("elevationSummary").textContent = route.profile ? `${route.lowPoint}–${route.highPoint} ft · Copernicus estimate` : "Elevation service unavailable";

  const rankedFirst = ranked[0]?.id === route.id;
  const flatDelta = Number.isFinite(route.gain) ? route.gain - Math.min(...state.routes.map((candidate) => Number.isFinite(candidate.gain) ? candidate.gain : Infinity)) : 0;
  const distanceDelta = route.distance - Math.min(...state.routes.map((candidate) => candidate.distance));
  el("routeExplanation").textContent = rankedFirst
    ? `Best match for your ${preferenceName().toLowerCase()} preference. We compared ${state.routes.length} pedestrian paths between your points using measured terrain elevation.`
    : `${distanceDelta > .05 ? `${distanceDelta.toFixed(1)} mi longer than the shortest option` : "Near the shortest distance"}${flatDelta > 5 ? `, with ${Math.round(flatDelta)} ft more climb than the flattest` : ", and close to the lowest measured climb"}.`;
  renderElevationChart(route);
  updateBookmark();
}

function formatDuration(minutes) {
  const rounded = Math.max(1, Math.round(minutes));
  if (rounded < 60) return `${rounded} min`;
  const hours = Math.floor(rounded / 60);
  const remainder = rounded % 60;
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`;
}

function renderElevationChart(route) {
  const chart = el("elevationChart");
  if (!route.profile) {
    chart.innerHTML = `<text x="180" y="58" text-anchor="middle" fill="#75807c" font-size="11">Elevation unavailable for this route</text>`;
    chart.setAttribute("aria-label", "Elevation data is unavailable for this route.");
    return;
  }
  const values = route.profile.map((point) => point.elevationFt);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const points = values.map((value, index) => {
    const x = (index / (values.length - 1)) * 360;
    const y = 14 + 82 - ((value - min) / Math.max(1, max - min)) * 70;
    return [x, y];
  });
  const polyline = points.map((point) => point.join(",")).join(" ");
  const area = `M0 102 L${points.map((point) => point.join(" ")).join(" L")} L360 102 Z`;
  chart.innerHTML = `<line class="elevation-grid" x1="0" y1="102" x2="360" y2="102"/><line class="elevation-grid" x1="0" y1="55" x2="360" y2="55"/><path class="elevation-area" d="${area}"/><polyline class="elevation-line" points="${polyline}"/><circle id="elevationFocus" class="elevation-focus" cx="0" cy="0" r="4.5" hidden/>`;
  chart.setAttribute("aria-label", `${route.distance.toFixed(1)} mile elevation profile, ${route.gain} feet of estimated gain, highest point ${route.highPoint} feet.`);
}

function renderRoutesOnMap(fit) {
  if (!state.mapReady || !state.selectedRoute) return;
  const features = state.routes
    .slice()
    .sort((a) => a.id === state.selectedRoute.id ? 1 : -1)
    .map((route) => ({ type: "Feature", properties: { id: route.id, selected: route.id === state.selectedRoute.id }, geometry: { type: "LineString", coordinates: route.coords } }));
  state.map.getSource("route-options")?.setData({ type: "FeatureCollection", features });
  if (!fit) return;
  const bounds = state.selectedRoute.coords.reduce((value, coords) => value.extend(coords), new maplibregl.LngLatBounds(state.selectedRoute.coords[0], state.selectedRoute.coords[0]));
  const mobile = window.matchMedia("(max-width: 820px)").matches;
  state.map.fitBounds(bounds, { padding: mobile ? { top: 90, right: 50, bottom: Math.min(window.innerHeight * .52, 520), left: 50 } : { top: 90, right: 80, bottom: 100, left: 80 }, duration: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 650, maxZoom: 15.6 });
}

function preferenceName() {
  if (state.preference < 35) return "Flatter";
  if (state.preference > 65) return "Shorter";
  return "Balanced";
}

function updatePreference(value) {
  state.preference = Number(value);
  const percent = state.preference;
  el("preferenceRange").style.background = `linear-gradient(to right, var(--green) 0 ${percent}%, #d8ddda ${percent}% 100%)`;
  el("preferenceValue").textContent = preferenceName();
  el("preferenceCopy").textContent = state.preference < 35 ? "Favoring low elevation, even if it adds a little distance." : state.preference > 65 ? "Favoring the most direct runnable path." : "Balancing distance with measured elevation gain.";
  if (state.routes.length) {
    const previous = state.selectedRoute?.id;
    const ranked = rankRoutes();
    state.selectedRoute = ranked[0] || state.routes.find((route) => route.id === previous);
    renderResults();
    renderRoutesOnMap(false);
  }
}

function scheduleReplan() {
  clearTimeout(replanTimer);
  if (state.points.start && state.points.end && state.routes.length) replanTimer = setTimeout(planRoutes, 450);
}

function routeSaveKey(route) {
  const start = state.points.start.coords.map((value) => value.toFixed(4)).join(",");
  const end = state.points.end.coords.map((value) => value.toFixed(4)).join(",");
  return `${start}:${end}:${route.id}`;
}

function updateBookmark() {
  if (!state.selectedRoute) return;
  const saved = state.saved.some((item) => item.key === routeSaveKey(state.selectedRoute));
  el("bookmarkButton").setAttribute("aria-pressed", saved.toString());
  el("bookmarkButton").setAttribute("aria-label", saved ? "Remove this route from saved" : "Save this route");
}

function persistSaved() {
  localStorage.setItem("runflat-saved-v2", JSON.stringify(state.saved));
  el("savedCount").textContent = state.saved.length;
  el("savedButton").setAttribute("aria-label", `Saved routes, ${state.saved.length} saved`);
}

function removeProfileMarker() {
  state.profileMarker?.remove();
  state.profileMarker = null;
}

function bindEvents() {
  ["start", "end", "waypoint"].forEach(bindSearch);
  document.querySelectorAll("[data-clear]").forEach((button) => button.addEventListener("click", () => clearPoint(button.dataset.clear)));
  document.querySelectorAll("[data-map-mode]").forEach((button) => button.addEventListener("click", () => setPinMode(button.dataset.mapMode)));
  document.addEventListener("pointerdown", (event) => { if (!event.target.closest(".place-field")) closeSuggestions(); });

  el("swapButton").addEventListener("click", () => {
    const start = state.points.start;
    const end = state.points.end;
    state.points.start = end;
    state.points.end = start;
    state.markers.start?.remove();
    state.markers.end?.remove();
    delete state.markers.start;
    delete state.markers.end;
    ["start", "end"].forEach((type) => { updatePointUI(type); if (state.points[type] && state.mapReady) makeMarker(type, state.points[type].coords); });
    if (state.points.start && state.points.end) planRoutes();
  });

  el("mapPrompt").addEventListener("click", () => {
    setPinMode(!state.points.start ? "start" : "end");
    showToast("Tap the map to place the selected point");
  });
  el("preferenceRange").addEventListener("input", (event) => updatePreference(event.target.value));
  document.querySelectorAll("input[name='surface']").forEach((input) => input.addEventListener("change", (event) => { state.surface = event.target.value; scheduleReplan(); }));
  el("paceSelect").addEventListener("change", (event) => { state.pace = Number(event.target.value); if (state.selectedRoute) renderResults(); });
  el("avoidStairs").addEventListener("change", (event) => { state.avoidStairs = event.target.checked; scheduleReplan(); });
  el("planButton").addEventListener("click", planRoutes);

  el("addStopButton").addEventListener("click", () => {
    el("waypointField").hidden = false;
    el("waypointModeButton").hidden = false;
    el("addStopButton").hidden = true;
    setPinMode("waypoint");
    pointInput("waypoint").focus();
    updatePlannerState();
  });

  el("locateButton").addEventListener("click", () => {
    if (!navigator.geolocation) return showMessage("Location isn’t available in this browser. Search for a start instead.");
    navigator.geolocation.getCurrentPosition((position) => {
      const coords = [position.coords.longitude, position.coords.latitude];
      if (!isInsideSF(coords)) return showMessage("Your current location is outside the San Francisco planning area.");
      setPoint("start", { label: "Current location", detail: "Approximate GPS position", coords }, { reverse: true, autoPlan: true });
      state.map?.easeTo({ center: coords, zoom: 14.2, duration: 500 });
    }, () => showMessage("Location access was unavailable. You can still search or place a pin on the map."), { enableHighAccuracy: true, timeout: 8000 });
  });

  el("resetMapButton").addEventListener("click", () => state.map?.easeTo({ center: SF.center, zoom: 12.7, duration: 450 }));
  el("bookmarkButton").addEventListener("click", () => {
    if (!state.selectedRoute) return;
    const key = routeSaveKey(state.selectedRoute);
    const index = state.saved.findIndex((item) => item.key === key);
    if (index >= 0) { state.saved.splice(index, 1); showToast("Removed from saved routes"); }
    else {
      state.saved.push({ key, start: state.points.start.label, end: state.points.end.label, distance: state.selectedRoute.distance, gain: state.selectedRoute.gain, savedAt: Date.now() });
      showToast("Route saved on this device");
    }
    persistSaved();
    updateBookmark();
  });
  el("savedButton").addEventListener("click", () => showToast(state.saved.length ? `${state.saved.length} route${state.saved.length === 1 ? "" : "s"} saved on this device` : "Save a route with the bookmark button"));

  el("elevationChart").addEventListener("pointermove", (event) => {
    const route = state.selectedRoute;
    if (!route?.profile) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const fraction = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    const index = Math.round(fraction * (route.profile.length - 1));
    const sample = route.profile[index];
    const focus = el("elevationFocus");
    if (focus) {
      const values = route.profile.map((point) => point.elevationFt);
      const min = Math.min(...values);
      const max = Math.max(...values);
      focus.hidden = false;
      focus.setAttribute("cx", String(fraction * 360));
      focus.setAttribute("cy", String(14 + 82 - ((sample.elevationFt - min) / Math.max(1, max - min)) * 70));
    }
    if (state.mapReady) {
      if (!state.profileMarker) {
        const markerElement = document.createElement("div");
        markerElement.className = "profile-marker";
        state.profileMarker = new maplibregl.Marker({ element: markerElement }).setLngLat(sample.coords).addTo(state.map);
      } else state.profileMarker.setLngLat(sample.coords);
    }
    el("elevationSummary").textContent = `${Math.round(sample.elevationFt)} ft at ${(sample.distanceM / 1609.344).toFixed(1)} mi`;
  });
  el("elevationChart").addEventListener("pointerleave", () => {
    removeProfileMarker();
    const focus = el("elevationFocus");
    if (focus) focus.hidden = true;
    if (state.selectedRoute?.profile) el("elevationSummary").textContent = `${state.selectedRoute.lowPoint}–${state.selectedRoute.highPoint} ft · Copernicus estimate`;
  });
}

initMap();
bindEvents();
updatePreference(state.preference);
updatePlannerState();
persistSaved();
