# Runflat

A responsive point-to-point running route planner for finding lower-climb paths across San Francisco.

**Live site:** https://willfeldman.github.io/runflat-sf/

## Run locally

```bash
python3 -m http.server 4173
```

Then open [http://localhost:4173](http://localhost:4173).

## What it does

- Search for a start and end, place draggable pins on a real map, or use your current location
- Add an optional stop and tune surface, stair, and pace preferences
- Search up to nine pedestrian route candidates, remove geometry duplicates, and evaluate the six most diverse paths
- Optimize on a Pareto frontier of distance, ascent, and steepest grade with a 30% maximum detour limit
- Compare the best tradeoffs using a flatter-to-shorter optimization control
- Sample 30-meter terrain data to estimate ascent, steepest section, and the elevation profile

The browser app uses MapLibre, OpenStreetMap/CARTO tiles, Photon search, and TrailSplits routing/elevation services. The optimizer makes three bounded pedestrian graph searches with native alternates, samples terrain on the distinct results, removes dominated routes, and ranks the survivors. Route elevation is an estimate; always check current access, closures, and conditions before running.
