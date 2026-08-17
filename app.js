const routes = [
  {
    id: "embarcadero",
    name: "Embarcadero Lowline",
    start: "ferry",
    startName: "Ferry Building",
    distance: 5.0,
    gain: 58,
    grade: 1.8,
    surface: "paved",
    duration: 51,
    color: "#176b5b",
    summary: "Waterfront miles with barely a bump.",
    why: "This route stays beside the bay, avoiding Nob Hill and Telegraph Hill. It has the lowest climb per mile in your results—about 12 feet per mile.",
    via: ["Pier 14", "Oracle Park", "Mission Creek"],
    points: [[687, 421], [724, 448], [748, 482], [733, 526], [755, 570], [733, 627], [758, 676], [719, 710], [668, 691], [648, 645], [676, 591], [659, 533], [688, 478], [687, 421]],
    elevation: [10, 12, 11, 14, 16, 18, 17, 20, 19, 24, 23, 27, 25, 31, 28, 24, 20, 16, 13, 10]
  },
  {
    id: "mission-creek",
    name: "Mission Creek Flat",
    start: "mission",
    startName: "Mission Bay",
    distance: 3.2,
    gain: 42,
    grade: 1.5,
    surface: "paved",
    duration: 33,
    color: "#c58c43",
    summary: "Creekside paths and stadium views.",
    why: "A compact shoreline loop that follows Mission Creek and the ballpark promenade. It avoids the grade changes west of Potrero Hill.",
    via: ["Mission Creek", "Oracle Park", "China Basin"],
    points: [[675, 682], [720, 711], [769, 687], [750, 640], [708, 626], [664, 648], [630, 684], [675, 682]],
    elevation: [12, 13, 16, 15, 18, 20, 17, 16, 19, 22, 20, 18, 16, 14]
  },
  {
    id: "crissy",
    name: "Crissy Waterfront",
    start: "marina",
    startName: "Marina Green",
    distance: 5.6,
    gain: 92,
    grade: 2.3,
    surface: "any",
    duration: 58,
    color: "#64849a",
    summary: "Golden Gate views, near-level miles.",
    why: "The route tracks the old airfield and waterfront. A short rise near Fort Point is the only meaningful climb, keeping the rest comfortably level.",
    via: ["Crissy Field", "Fort Point", "Marina Green"],
    points: [[462, 154], [420, 139], [361, 146], [306, 130], [242, 143], [194, 174], [220, 200], [281, 188], [343, 198], [405, 182], [462, 154]],
    elevation: [9, 10, 12, 12, 15, 18, 24, 32, 36, 28, 22, 17, 14, 11, 9]
  },
  {
    id: "park-glide",
    name: "Golden Gate Glide",
    start: "ggp",
    startName: "JFK Promenade",
    distance: 4.8,
    gain: 128,
    grade: 3.1,
    surface: "any",
    duration: 51,
    color: "#9b7c53",
    summary: "Car-free park miles on gentle grades.",
    why: "JFK Promenade follows the park’s gradual westward slope. This loop trades a little elevation for shade, low traffic, and long uninterrupted stretches.",
    via: ["Conservatory of Flowers", "Stow Lake", "Ocean Beach"],
    points: [[453, 430], [404, 428], [354, 447], [298, 454], [241, 475], [181, 501], [162, 532], [226, 526], [290, 504], [354, 490], [415, 472], [453, 430]],
    elevation: [188, 195, 202, 207, 214, 218, 225, 232, 239, 234, 229, 221, 215, 207, 200, 194, 188]
  },
  {
    id: "bay-arc",
    name: "Bayfront Long Arc",
    start: "ferry",
    startName: "Ferry Building",
    distance: 8.1,
    gain: 146,
    grade: 2.6,
    surface: "paved",
    duration: 83,
    color: "#7c6ea8",
    summary: "A long, breezy sweep along the bay.",
    why: "This longer out-and-back connects the Embarcadero to Mission Bay almost entirely along shoreline streets and promenades, bypassing the city’s central ridges.",
    via: ["Exploratorium", "Ferry Building", "Chase Center"],
    points: [[572, 277], [625, 316], [665, 366], [687, 421], [724, 469], [733, 526], [755, 585], [729, 651], [675, 682], [633, 652], [659, 591], [642, 530], [670, 476], [649, 414], [612, 356], [572, 277]],
    elevation: [14, 17, 22, 19, 25, 29, 27, 34, 31, 39, 37, 43, 39, 35, 32, 28, 24, 20, 17, 14]
  },
  {
    id: "merced",
    name: "Lake Merced Loop",
    start: "merced",
    startName: "Lake Merced",
    distance: 4.5,
    gain: 112,
    grade: 3.4,
    surface: "trail",
    duration: 48,
    color: "#5a8664",
    summary: "Soft edges, open water, rolling easy.",
    why: "The lakeside path gently rolls without any sustained climbs. It is the softest-surface option among your flatter matches.",
    via: ["North Lake", "Sunset Circle", "South Lake"],
    points: [[328, 676], [287, 661], [245, 679], [219, 718], [239, 758], [287, 774], [336, 756], [360, 718], [328, 676]],
    elevation: [38, 44, 48, 46, 52, 58, 61, 57, 53, 56, 62, 59, 52, 46, 41, 38]
  },
  {
    id: "presidio",
    name: "Presidio Shoreline",
    start: "marina",
    startName: "Marina Green",
    distance: 7.4,
    gain: 218,
    grade: 4.2,
    surface: "trail",
    duration: 79,
    color: "#b66b57",
    summary: "Coastal trails with one honest rise.",
    why: "The shoreline keeps most of the Presidio’s steeper interior terrain out of your way. A brief climb by the bluffs accounts for most of the gain.",
    via: ["Crissy Field", "Fort Point", "Baker Beach"],
    points: [[462, 154], [397, 132], [329, 144], [261, 130], [195, 159], [151, 213], [137, 276], [163, 330], [211, 288], [247, 229], [318, 203], [394, 190], [462, 154]],
    elevation: [15, 18, 22, 28, 34, 48, 61, 79, 96, 111, 104, 92, 77, 63, 51, 39, 29, 21, 15]
  },
  {
    id: "twin-peaks",
    name: "Twin Peaks Challenge",
    start: "mission",
    startName: "Mission Bay",
    distance: 5.3,
    gain: 742,
    grade: 12.4,
    surface: "paved",
    duration: 68,
    color: "#dc6d50",
    summary: "A beautiful route for days you want hills.",
    why: "This route is included as a comparison: it climbs into the city’s central highlands and has more than ten times the gain of the waterfront option.",
    via: ["Mission Dolores", "Market Street", "Twin Peaks"],
    points: [[675, 682], [608, 642], [548, 603], [491, 564], [434, 581], [398, 620], [430, 653], [491, 638], [551, 664], [612, 696], [675, 682]],
    elevation: [18, 28, 51, 89, 142, 217, 305, 416, 520, 602, 669, 598, 489, 367, 248, 157, 84, 42, 18]
  }
];

const state = {
  start: "ferry",
  distance: 5,
  priority: "flat",
  surface: "any",
  ranked: [],
  selected: null,
  saved: new Set(JSON.parse(localStorage.getItem("runflat-saved") || "[]"))
};

const el = (id) => document.getElementById(id);
const routeForm = el("routeForm");
const distanceRange = el("distanceRange");
const distanceOutput = el("distanceOutput");
const findButton = el("findButton");
const routeResults = el("routeResults");
const routeLayer = el("routeLayer");
const markerLayer = el("markerLayer");
const bookmarkButton = el("bookmarkButton");
let toastTimer;

function scoreRoute(route) {
  const distanceError = Math.abs(route.distance - state.distance) / state.distance;
  const gainPerMile = route.gain / route.distance / 150;
  const gradePenalty = Math.max(0, route.grade - 4) / 10;
  const sameStart = route.start === state.start ? 0 : 1;
  const weights = {
    flat: [0.31, 0.47, 0.16, 0.06],
    balanced: [0.39, 0.31, 0.13, 0.17],
    near: [0.36, 0.14, 0.08, 0.42]
  }[state.priority];
  const surfacePenalty = state.surface === "any" || route.surface === state.surface || route.surface === "any" ? 0 : 0.5;
  return distanceError * weights[0] + gainPerMile * weights[1] + gradePenalty * weights[2] + sameStart * weights[3] + surfacePenalty;
}

function rankRoutes() {
  state.ranked = routes
    .map((route) => ({ ...route, score: scoreRoute(route) }))
    .sort((a, b) => a.score - b.score)
    .slice(0, 3);
  state.selected = state.ranked[0];
}

function routeMeta(route) {
  const gainPerMile = Math.round(route.gain / route.distance);
  return `${route.distance.toFixed(1)} mi · +${route.gain} ft · ${gainPerMile} ft/mi`;
}

function renderResults() {
  routeResults.innerHTML = state.ranked.map((route, index) => `
    <button class="route-card ${route.id === state.selected.id ? "selected" : ""}" type="button" data-route-id="${route.id}" aria-pressed="${route.id === state.selected.id}">
      <span class="route-number" style="background:${route.color}">${index + 1}</span>
      <span class="route-card-copy"><strong>${route.name}</strong><span>${index === 0 ? "Best for your settings" : route.summary}</span></span>
      <span class="route-card-stats"><strong>${route.distance.toFixed(1)} mi</strong><span>+${route.gain} ft</span></span>
    </button>
  `).join("");
  el("resultCount").textContent = `${state.ranked.length} routes`;
  el("mapStatus").textContent = `${state.ranked.length} low-climb routes found`;
  routeResults.querySelectorAll(".route-card").forEach((card) => {
    card.addEventListener("click", () => selectRoute(card.dataset.routeId));
  });
}

function renderMap(animate = false) {
  routeLayer.innerHTML = state.ranked.map((route, index) => {
    const selected = route.id === state.selected.id;
    return `<g class="route-set ${selected ? "selected" : ""}" data-route-id="${route.id}">
      <polyline class="route-underlay" points="${route.points.map((p) => p.join(",")).join(" ")}" />
      <polyline class="route-line ${index ? "alternate" : ""} ${animate ? "draw" : ""}" style="stroke:${route.color}" points="${route.points.map((p) => p.join(",")).join(" ")}" />
    </g>`;
  }).join("");
  markerLayer.innerHTML = state.ranked.map((route, index) => {
    const [x, y] = route.points[0];
    return `<g class="route-marker" transform="translate(${x} ${y})"><circle r="14" fill="${route.color}"/><text y="1">${index + 1}</text></g>`;
  }).join("");
}

function elevationPath(samples) {
  const width = 320;
  const height = 74;
  const top = 8;
  const min = Math.min(...samples);
  const max = Math.max(...samples);
  return samples.map((value, index) => {
    const x = (index / (samples.length - 1)) * width;
    const y = top + height - ((value - min) / Math.max(1, max - min)) * (height - 16);
    return [x, y];
  });
}

function renderDetail() {
  const route = state.selected;
  el("detailRank").textContent = route.id === state.ranked[0].id ? "Best match" : "Route option";
  el("detailSurface").textContent = route.surface === "any" ? "Road + trail" : route.surface === "paved" ? "Mostly paved" : "Mostly trail";
  el("detailName").textContent = route.name;
  el("detailSummary").textContent = route.summary;
  el("detailDistance").textContent = route.distance.toFixed(1);
  el("detailGain").textContent = `+${route.gain}`;
  el("detailGrade").textContent = `${route.grade.toFixed(1)}%`;
  el("detailTime").textContent = `~${route.duration}`;
  el("whyCopy").textContent = route.why;
  el("whyCopy").hidden = true;
  el("whyButton").setAttribute("aria-expanded", "false");
  bookmarkButton.setAttribute("aria-pressed", state.saved.has(route.id).toString());
  bookmarkButton.setAttribute("aria-label", state.saved.has(route.id) ? "Remove this route from saved" : "Save this route");

  const profile = elevationPath(route.elevation);
  const line = profile.map((p) => p.join(",")).join(" ");
  const area = `M 0 82 L ${profile.map((p) => p.join(" ")).join(" L ")} L 320 82 Z`;
  el("elevationChart").innerHTML = `<line class="elevation-baseline" x1="0" y1="82" x2="320" y2="82"/><path class="elevation-area" d="${area}"/><polyline class="elevation-line" points="${line}"/>`;
  el("elevationRange").textContent = `${Math.min(...route.elevation)}–${Math.max(...route.elevation)} ft`;
  el("elevationMid").textContent = `${(route.distance / 2).toFixed(1)} mi`;
  el("elevationChart").setAttribute("aria-label", `${route.name} elevation profile: ${route.gain} feet of gain, highest point ${Math.max(...route.elevation)} feet.`);
}

function selectRoute(routeId) {
  const selected = state.ranked.find((route) => route.id === routeId);
  if (!selected) return;
  state.selected = selected;
  renderResults();
  renderMap();
  renderDetail();
}

function showToast(message) {
  clearTimeout(toastTimer);
  el("toast").textContent = message;
  el("toast").classList.add("show");
  toastTimer = setTimeout(() => el("toast").classList.remove("show"), 2200);
}

function saveState() {
  localStorage.setItem("runflat-saved", JSON.stringify([...state.saved]));
  el("savedCount").textContent = state.saved.size;
  el("savedButton").setAttribute("aria-label", `Saved routes, ${state.saved.size} saved`);
}

function updateDistance(value) {
  state.distance = Number(value);
  distanceRange.value = state.distance;
  distanceOutput.innerHTML = `<strong>${state.distance.toFixed(1)}</strong> mi`;
  const progress = ((state.distance - 2) / 8) * 100;
  distanceRange.style.background = `linear-gradient(to right, var(--green) 0 ${progress}%, #d8ddd6 ${progress}% 100%)`;
  document.querySelectorAll("[data-distance]").forEach((button) => button.classList.toggle("active", Number(button.dataset.distance) === state.distance));
}

distanceRange.addEventListener("input", (event) => updateDistance(event.target.value));
document.querySelectorAll("[data-distance]").forEach((button) => button.addEventListener("click", () => updateDistance(button.dataset.distance)));
el("startLocation").addEventListener("change", (event) => { state.start = event.target.value; });
document.querySelectorAll("[data-priority]").forEach((button) => {
  button.addEventListener("click", () => {
    state.priority = button.dataset.priority;
    document.querySelectorAll("[data-priority]").forEach((candidate) => {
      const active = candidate === button;
      candidate.classList.toggle("active", active);
      candidate.setAttribute("aria-checked", active.toString());
    });
  });
});
document.querySelectorAll("input[name='surface']").forEach((input) => input.addEventListener("change", (event) => { state.surface = event.target.value; }));

routeForm.addEventListener("submit", (event) => {
  event.preventDefault();
  findButton.classList.add("loading");
  findButton.disabled = true;
  setTimeout(() => {
    rankRoutes();
    renderResults();
    renderMap(true);
    renderDetail();
    findButton.classList.remove("loading");
    findButton.disabled = false;
    el("resultsHeading").focus?.();
    showToast(`${state.ranked.length} routes compared · ${state.ranked[0].name} is your best match`);
  }, 680);
});

bookmarkButton.addEventListener("click", () => {
  const id = state.selected.id;
  if (state.saved.has(id)) {
    state.saved.delete(id);
    showToast("Removed from saved routes");
  } else {
    state.saved.add(id);
    showToast("Route saved for later");
  }
  saveState();
  renderDetail();
});

el("savedButton").addEventListener("click", () => {
  if (!state.saved.size) return showToast("No saved routes yet — tap the bookmark on a route");
  const names = routes.filter((route) => state.saved.has(route.id)).map((route) => route.name);
  showToast(`Saved: ${names.join(", ")}`);
});

el("whyButton").addEventListener("click", () => {
  const expanded = el("whyButton").getAttribute("aria-expanded") === "true";
  el("whyButton").setAttribute("aria-expanded", (!expanded).toString());
  el("whyCopy").hidden = expanded;
});

el("labelsToggle").addEventListener("click", () => {
  const button = el("labelsToggle");
  const pressed = button.getAttribute("aria-pressed") === "true";
  button.setAttribute("aria-pressed", (!pressed).toString());
  document.querySelector(".map-labels").classList.toggle("hidden", pressed);
});

el("locateButton").addEventListener("click", () => {
  state.start = "ferry";
  el("startLocation").value = "ferry";
  showToast("Approximate location set near the Ferry Building");
});

function closeModal() {
  el("modalBackdrop").hidden = true;
  el("startButton").focus();
}

el("startButton").addEventListener("click", () => {
  const route = state.selected;
  el("modalRouteCopy").textContent = `${route.distance.toFixed(1)} miles from ${route.startName}, with ${route.gain} feet of total gain.`;
  el("modalSteps").innerHTML = route.via.map((place, index) => `<div class="modal-step"><span>${index + 1}</span><strong>${place}</strong><em>${index === route.via.length - 1 ? "finish" : `${((route.distance / route.via.length) * (index + 1)).toFixed(1)} mi`}</em></div>`).join("");
  el("modalBackdrop").hidden = false;
  el("modalClose").focus();
});
el("modalClose").addEventListener("click", closeModal);
el("modalDone").addEventListener("click", closeModal);
el("modalBackdrop").addEventListener("click", (event) => { if (event.target === el("modalBackdrop")) closeModal(); });
document.addEventListener("keydown", (event) => { if (event.key === "Escape" && !el("modalBackdrop").hidden) closeModal(); });

rankRoutes();
renderResults();
renderMap();
renderDetail();
saveState();
