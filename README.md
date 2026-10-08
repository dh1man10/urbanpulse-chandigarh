# UrbanPulse v4.2 — Event Impact and Urban Mobility Planning for Chandigarh

**Start with [START-HERE.md](START-HERE.md)** for Node.js 24 setup, the seven pages, reservations, QR check-in, operator keys, Traffic Lab and current limitations. The earlier planning documentation below describes the mapped model; the new Traffic Lab is a separate experiment.

An editable event planning prototype built with HTML, CSS, JavaScript and bundled Leaflet. Local planning needs no package installation, login or API key. Cloud snapshot sharing requires a deployed Worker and storage binding; running `node server.cjs` stores snapshots locally.

## Readiness workspace

Click **Show me how** for a six-step walkthrough, or **Open readiness workspace** for:

- Dated evidence and freshness labels for uploaded counts (older than 30 days prompts review; this is a display rule, not a validity standard).
- Independent predicted-versus-observed traffic and parking comparisons. Enter matching locations and intervals. The dashboard reports mean absolute error, weighted absolute percentage error and signed bias. Zero observed totals have no percentage error. These samples do not establish citywide accuracy.
- Site-check records for step-free entrances, crossings, accessible parking and emergency access, with checker, evidence and outcome.
- Assigned tasks, due dates and completion status.
- Timestamped manual incidents and resolved/reopened status. Incident records do not automatically close roads or modify the model.
- Reviewer comments and decisions tied to a model-input revision. Changed inputs make previous reviews historical. Reviewer names are self-reported; this is not authenticated approval.

Notebooks save per event name, date and venue in this browser. Re-entering that combination restores its notebook. Scenario save/export/import includes notebook records; the printable report includes the summary, evidence, access checks, tasks, incidents and reviews. Export JSON before clearing browser data. Public snapshot links include notebook records, so include only information intended for viewers.

Authenticated accounts, shared live editing and verified field surveys are not implemented. The software records supplied evidence; it cannot establish on-site access conditions on its own.

Advanced planning includes custom venue/entrance pins, traffic CSV imports, proposed transit stops and seat capacity, entrance-pressure estimates, attendance sensitivity, intervention budgets and up to three nearby events. These remain simplified estimates. With multiple events, the map combines each road's peak across time; peaks on different roads need not occur simultaneously.

Run `npm test` for the complete check suite for model and notebook checks. `npm run build` generates the Worker. Local source: `dist/readiness-model.js` and `dist/readiness-ui.js`.

## Open on this or another device

1. Clone this repository or download and extract its source ZIP.
2. Open `UrbanPulse.code-workspace` in VS Code, or use **File → Open Folder → urbanpulse**.
3. With Node.js 22.13+ (Node.js 24 recommended), run `node server.cjs` and visit http://localhost:4173. The server provides the reservation and check-in APIs.
4. Edit the files and refresh the browser.

Copy the ZIP/folder using a USB drive or cloud storage. Source files do not automatically sync. To move a saved event between devices, use **Export scenario**, transfer its JSON file, then **Import scenario** on the other device.

## Included features

- **Real Chandigarh map:** bundled OpenStreetMap road geometry and mapped parking/hospital locations. The default background uses packaged roads without tile requests. Optional online street tiles require internet. The road overlay, places, calculations and animation remain available offline.
- **Road closures:** click a colored road and select **Close in B**, or use the road selector. Each selection is an OSM way segment, not an entire named road. Multiple closures are supported, with **Reopen all** to reset. Routes respect mapped one-way directions.
- **Suggested improvements:** add shuttle buses, extra remote parking or staggered arrivals. Suggestion cards show modeled outcomes and can apply a change to B. A remains the original event.
- **Traffic animation:** select **Traffic animation** or **Play timeline**. Moving dots show relative traffic; clusters illustrate pressure. This is not a microscopic vehicle or queue simulation.
- **Parking locations:** cards and map markers show peak occupancy at the nearest three mapped locations. Supply is distributed 50%/30%/20% from your input. Free spaces provide alternative sites. Remote parking is a proposed pin, not a verified facility.
- **Saved scenarios:** store up to 30 plans in browser local storage. Export/import portable JSON. Reloaded forms start with demo defaults; use **Load** to restore a saved plan. Clearing browser data deletes local saves. File-mode local storage support varies by browser, so keep JSON backups.
- **Arrival/departure timeline:** half-hour arrival, departure and parking estimates, labeled with event start time. Adjust duration and arrival window. Negative/positive day labels handle midnight.
- **Shareable report:** **Create PDF report** opens an in-page printable report containing inputs, A/B maps, comparison, parking table, timeline and limitations. Choose **Print / Save as PDF**, then choose your browser's PDF destination. No external PDF service is used. A downloadable standalone HTML copy and text report are also available.

## Two-minute presentation

1. Explain that an event adds traffic and parking demand.
2. Run the default 5,000-person event and point out the parking shortfall.
3. Close a major road segment using its map popup; compare A and B.
4. Apply five shuttle buses. The example car demand falls from 1,100 to 940 and parking demand from 935 to 799.
5. Play the timeline to show the arrival peak and the later departures.
6. Create the PDF report. Explain that geographic data is real, while traffic and capacity estimates are illustrative.

## Edit these files

| File | Purpose |
|---|---|
| `dist/index.html` | Page layout, inputs and explanatory text |
| `dist/styles.css` | Responsive styles and colors |
| `dist/app.js` | Maps, animation, interactions, saving and reports |
| `dist/model.js` | Demand model, road graph, routing and validation |
| `dist/map-data.js` | Packaged OSM geometry and places, approximate venue pins |
| `scripts/prepare-map.cjs` | Rebuild map-data.js from osm-source.json |
| `tests/v2.test.cjs` | Model and graph regression checks |
| `dist/vendor/` | Leaflet 1.9.4 and its license |

Run `npm test` to check demand conservation, closures, disconnected routes, improvements, parking and imported-input validation.

## Data and model limitations

Map data © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright), available under ODbL, retrieved through the public Overpass API. The source snapshot is included as `osm-source.json`; exact retrieval date is in `dist/map-data.js`. [Leaflet](https://leafletjs.com) is BSD-2-Clause licensed; its license is bundled. OSM standard tiles are loaded on demand, never prefetched or packaged. For substantial public deployment, follow the [OSM tile policy](https://operations.osmfoundation.org/policies/tiles/) and choose an appropriate tile provider.

This is an educational prototype, not an operational forecast or emergency certification. Counts, capacities, speeds, parking supply, full shuttle occupancy and access times are assumptions. Venue pins are approximate. Event routes connect four approach points to a nearby major-road node; emergency routes connect the mapped hospital's nearby road node to that same node. Baseline access nodes are chosen within the downloaded network. Final access from road to actual venue entrance is not verified.

The road model uses a first-pass event assignment and then congestion-weighted shortest paths, not equilibrium routing. Background traffic is synthetic and is not rerouted on closure. Routes outside the downloaded area are not considered. If an approach is disconnected, its demand is unassigned and the UI flags it; the reported average covers only reachable approaches. Mapped one-way attributes are used; turn restrictions, signal timing, actual queues and other access restrictions are not modeled.

Arrivals and departures conserve car totals. Parking assumes 85% of cars remain parked. Shuttles remove up to 80 car passengers per bus and add two inbound bus movements per arrival window. The arrival period is capped at three hours. The departure profile spans two hours after the event. Date/time affect labels, not background traffic. More parking changes supply, not car demand.

Before using results for a real event, obtain current counts and usable parking capacities, verify entrances and access restrictions, calibrate the model, and validate plans with responsible local agencies.


## Ready-made demo files

Import `demo-scenario.json` to load five shuttles, 100 extra spaces, a three-hour arrival window and a Junction 27 segment closure. The ZIP also includes a standalone sample HTML report; open it in a browser and choose Print / Save as PDF. In VS Code, use Format Document to format source files to your preferences.

## Appearance

Use the Light theme / Dark theme button in the header. Your preference is saved in this browser; the initial theme follows your device setting. Road colors are teal for free flow, amber for busy, red for congested, and purple dashed for emergency routes. Closed segments use gray dashes. Reports retain a light background for printing.

