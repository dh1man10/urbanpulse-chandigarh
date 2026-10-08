# UrbanPulse v4.2 — team setup

## Open and edit on another computer

1. Extract the source ZIP completely.
2. Install Node.js 24 LTS from https://nodejs.org if it is not installed.
3. In VS Code or Cursor, open this folder or `UrbanPulse.code-workspace`.
4. Open the editor terminal and run `node server.cjs`.
5. Open the printed link, normally http://localhost:4173.

No dependency install is needed to run the included site. Use the Node server: opening index.html directly or using Live Server will not provide booking APIs. If the port is occupied, set `PORT` to another number before starting. Stop with Ctrl+C.

Local reservations live in `.local-data/operations.sqlite`; cloud reservations use Sites D1. These databases are separate. A fresh computer starts empty locally. Existing public passes work on the public website. Do not publish local databases or operator keys.

## Demonstration sequence

1. Open Operator Desk and create a demo event. Save the displayed operator key privately.
2. Adjust capacity and INR price per event for any of the three sample zones. A zone cannot be reduced below committed spaces. Closing it stops new reservations and preserves existing passes.
3. Open the visitor link. Register a demo alias, choose parking (or no parking), and create the pass.
4. Download the QR pass HTML. Open it on another device or print it. Anyone with the private pass code can view its contents and cancel it before use.
5. Open Operator Desk on the gate device. Enter the event ID or visitor link and operator key.
6. Select Attendee check-in, Parking entry, or Parking exit. Read the QR with the camera/image reader or paste its contents; press Record scan. Each action is separate. Repeated actions are rejected. Exiting frees a parking space; a pass cannot re-enter.
7. Refresh availability to see reservations and scan counts. No sensors or real parking operator are connected. Reservations are for the whole demo event, not hourly time slots.
8. In Scenario Studio, select Traffic animation under Movement, mapped. Drag the time slider, step ±30 minutes, or use Play and 1×/2×/4× playback. The Event Timeline uses the same time selection. Click a road to select its closure controls.
9. In Traffic Lab, compare the same arriving vehicles with different signal timing or a north-approach lane closure. Scrub/play the experiment and inspect vehicle speeds.

The mapped planning model, booking inventory, and junction experiment are separate. Use Studio event details copies the event name/date into the booking form. Use selected scenario peak copies demand into the junction experiment. Booking counts do not silently overwrite planning assumptions.

## Important boundaries

- All parking names, capacities and prices start as samples. No payment is taken and a demo pass grants no real parking entitlement.
- The operator key is a per-event capability, not a staff-account system. There is no recovery, individual staff attribution, or key rotation UI. Share only with trusted staff.
- Visitor names or aliases are stored; no phone, email, or vehicle number is required. Use demo aliases for public demonstrations.
- Inventory and scans persist on the server and work across devices using the same event link. Updates are refreshed manually, not streamed live.
- QR camera access requires permission and HTTPS (or localhost). Image upload and code entry remain available without camera access.
- Traffic Lab is a simplified straight-through junction experiment: fixed-step car following, spacing constraints, limited lane changes, signals and queues. It has no turns, pedestrians, real signal calibration, or citywide forecasting. Reported completed-trip delays can exclude the longest unfinished trips.
- This public hackathon prototype has bounded inputs, private capability keys and atomic booking checks, but no production rate limiting, anti-bot service, payment gateway, deletion/retention workflow, or authenticated staff accounts. Plan those before accepting real public bookings.

## Where to edit

| File | Purpose |
|---|---|
| `dist/index.html` | Main layout, sidebar and animation controls |
| `dist/styles.css` | Themes, responsive layout, pointer and motion styles |
| `dist/pages.js` | Seven page routes and navigation |
| `dist/app.js` | Mapped simulation, animation time, reports |
| `dist/operations-ui.js` | Visitor passes, QR reading and operator controls |
| `server/operations.mjs` | Reservation and check-in API with authorization |
| `db/schema.ts` / `drizzle/` | Durable database schema and generated migrations |
| `dist/traffic-lab.js` | Standalone deterministic junction model |
| `dist/traffic-ui.js` | Junction controls, animation and comparison |
| `server/local-db.cjs` | Local SQLite adapter and migration runner |
| `scripts/build-worker.cjs` | Hosted Worker, public assets and migration metadata |

To install development tools, run `pnpm install --frozen-lockfile`. Generate schema changes with `pnpm exec drizzle-kit generate`; keep applied migrations immutable. Run `pnpm test` (or `npm test`) for all checks. `node scripts/build-worker.cjs` builds the hosted Worker without dependency installation.

Sites hosting uses `.openai/hosting.json`, D1 binding `DB` and existing R2 binding `BUCKET`. Deployment includes generated migrations in `dist/.openai/drizzle`. Publish through the existing Site project; no credentials are included in this source package.

## Map background
The default map draws the packaged OpenStreetMap road snapshot without tile requests. Select Online street background for optional OSM tiles. Map image requests send only the site origin as their referrer; pass links and event query details are not sent. A failed background automatically returns to packaged roads. No tile proxy, prefetch, bulk download or cache bypass is used.

