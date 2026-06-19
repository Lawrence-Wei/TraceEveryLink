# TraceEveryLink Change Log

This file records product, UI, data-model, deployment, and documentation changes made during the current TraceEveryLink build-out.

## 2026-06-19

### Workbench Map And Cable Creation UX

- Kept the global WAN map pinned inside the center workbench viewport instead of requiring vertical scrolling.
- Moved the overview map ahead of the navigator on narrow screens so the map remains the first workbench surface.
- Added Google Maps-style WAN map zoom controls, mouse-wheel zoom, double-click zoom, and drag-to-pan behavior after zooming.
- Split overview map interaction from rack-canvas pan behavior so rack wheel/pan controls only apply inside site rack workspaces.
- Reworked the right inspector's New Cable flow into a dedicated create state with grouped cable details, endpoint selectors, color swatches, and sticky Save/Cancel actions.
- Added English and Chinese i18n copy for map zoom controls, New Cable form grouping, generated cable ID helper text, and color swatches.

## 2026-06-18

### Pirelli Office Lab Onboarding

- Added Cisco catalog support for the Pirelli lab's Cisco 1911 and Catalyst 3750/3750G onboarding models.
- Added `PIR-LAB-R01` seed inventory with the agreed `PIR-LAB-...77.x` naming convention, management IPs, rack placement, ports, and planned uplinks.
- Seeded the iStoreOS gateway, 3750 core, two 2960-X access switches, 1911/2811 routers, 2811 voice gateway candidate, and CUCM 7.4 server.
- Added `docs/pirelli-lab-network-plan.md` with VLAN 77 management, future VLANs, planned physical links, and TraceEveryLink onboarding order.
- Updated the lab network plan to treat `192.168.10.0/23` as the already-used upstream office network and to avoid the previous `192.168.50.0/24` range.
- Removed the older 3560G/3560 distribution switches from the active Pirelli lab seed, documentation, and Excel patch plan while keeping Cisco catalog recognition available.
- Added Markdown and HTML troubleshooting notes for bringing the C3750X management SSH address `192.168.77.2/24` online through `Vlan12`, including the command history, validation steps, and the VLAN 1 vs VLAN 12 explanation.
- Added Markdown and HTML C3750X IOS upgrade tutorial covering Ubuntu TFTP preparation, copying `c3750e-universalk9-mz.152-4.E10.bin` into switch flash, MD5 validation, boot variable changes, reload verification, and rollback.

### Cisco Official Device Imagery

- Replaced in-rack Cisco switch faceplates with Cisco-hosted official front-panel imagery only when the catalog image is a usable front view.
- Added a locked-down `/api/cisco-official-image` proxy that only serves allowlisted Cisco catalog images and passes the matching Cisco source page as the upstream referer.
- Kept port interaction by layering transparent port hit zones over official Cisco front-panel images, with cable statuses reduced to subtle outlines so they do not cover the equipment.
- Added Cisco image view metadata so rear, I/O-side, and product photos remain available in the details reference panel without being forced into the front rack view.
- Widened and slightly raised the rack overview scale so 1U Cisco front panels read as equipment instead of compressed web thumbnails.

## 2026-06-17

### Rackula Device Type Library

- Imported Rackula's current Generic starter device type library into `src/shared/rackula-device-catalog.ts`.
- Added 64 Rackula-style generic templates covering servers, firewalls, network switches, storage, power, patch panels, KVM, AV/media, cooling, shelves, chassis, blanks, and cable management.
- Preserved Rackula metadata including slug, category, U height, depth, half-width status, parent/child role, and container slots.
- Added a searchable Rackula Device Types section in the left sidebar.
- Added selected-template details in the inspector so Rackula templates can be reviewed separately from real rack-mounted devices.
- Added Vitest coverage for the imported catalog count and container slot metadata.

### Compact Office Rack Overview

- Reduced the front rack overview scale so a 42U rack no longer dominates the site workspace.
- Changed the site rack view to show up to three racks from the selected office/site side by side, while still highlighting the active rack.
- Kept front-only rack rendering and preserved real U-position placement for devices and ports.
- Updated `DESIGN.md` with the compact office/small MDF rack overview rule.

### Device Removal Actions

- Added an Admin-only device action in the details inspector for deleting mounted devices.
- Added `/api/devices/[id]` DELETE support with CSRF and Admin role checks.
- Blocked device deletion while any of the device ports still have connected cables, preserving cable records until they are removed or retired intentionally.
- Added English and Chinese device deletion copy and API error messages.

### Single Front Rack View

- Changed the main rack overview from side-by-side front and rear rack faces to one front-facing rack view.
- Updated rack overview copy in English and Chinese so it no longer describes a front/rear split.
- Updated README preview text to describe the center pane as a front rack view.
- Documented the single front-facing rack overview rule in `DESIGN.md`.

### Rack Hardware Identity Display

- Removed visible hostname/model/vendor text from in-rack device faceplates so the rack view reads like installed hardware instead of inventory cards.
- Kept port buttons, switch banks, LEDs, and module/slot shapes inside the real U positions for hardware-level interaction.
- Expanded the selected-device details summary with Hostname, Model, Vendor, Type, Rack position, and Management IP fields.
- Updated `DESIGN.md` to keep rack-mounted faces focused on physical appearance and move inventory identity to the inspector.

### Product Naming

- Finalized the Chinese product name as `接线镜`.
- Finalized the English product name as `TraceEveryLink`.
- Kept the slogan direction `From Site to Port, Trace Every Link.` / `从站点到端口，一眼追线。`
- Kept `PatchPlan` as the current repository and development codename for technical compatibility.
- Avoided using `Cisco` in the product name to reduce trademark and vendor-branding risk.

### Branding Update

- Updated the app brand i18n strings:
  - Chinese UI brand: `接线镜`.
  - English UI brand: `TraceEveryLink`.
- Updated browser metadata title to `接线镜 | TraceEveryLink`.
- Updated exported PDF title to `TraceEveryLink Cable Register`.
- Updated export download filenames:
  - `traceeverylink-cables.xls`
  - `traceeverylink-cables.pdf`
  - `traceeverylink-labels.pdf`
- Updated README title and product introduction to `接线镜 / TraceEveryLink`.
- Updated `DESIGN.md` to use `TraceEveryLink` as the product name and describe `PatchPlan` as the repository codename.
- Updated product requirements documentation titles and core product descriptions to `接线镜 / TraceEveryLink`.

### Language Default Update

- Changed the default UI language to English for all first-time users.
- Removed browser-language auto-detection from the default language flow.
- Kept manual language switching between English and Chinese.
- Switched language preference storage to `traceeverylink-language` so old automatic `patchplan-language` values do not force the UI back to Chinese.
- Updated the root HTML default `lang` attribute to `en`.
- Documented the English-first bilingual rule in `DESIGN.md`.

### Agent Documentation

- Added `AGENTS.md` as the canonical repository instruction file for coding agents.
- Added `CLAUDE.md` as a short pointer to `AGENTS.md`.
- Captured package manager, file-scoped commands, project map, product naming rules, i18n rules, Cisco port conventions, deployment constraints, verification commands, and commit attribution.
- Attempted to create `CLAUDE.md` as a symlink to `AGENTS.md`, but Windows required administrator privileges, so a pointer file was used instead.

### Design System And Product Direction

- Added `DESIGN.md` as the project-level design source of truth for future AI and developer work.
- Defined TraceEveryLink as a network-engineering workbench rather than a generic SaaS dashboard.
- Captured the intended dark blue/violet engineering-console style.
- Documented the required hierarchy:
  `Country -> City -> Site/Address -> Rack -> Device -> Port -> Cable -> Peer`.
- Documented rack, device, port, cable, map, sidebar, details panel, and i18n design rules.
- Added explicit rules for Cisco-like front panels:
  - Use official-style front-panel composition.
  - Use 12-port banks where appropriate.
  - Preserve physical port order.
  - Use canonical labels such as `Gi1/0/4`, `Te1/1/1`, `Fo1/1/1`, `Hu1/0/1`.
  - Do not show ambiguous labels such as `1-0-4`.
- Documented expected pan, wheel, resizable panes, collapsed pane rails, and port-selection behavior.
- Documented that every visible UI string should go through i18n.

### Product Requirements Documentation

- Added a detailed product development requirements document in Markdown:
  - `docs/PatchPlan-产品开发需求文档.md`
- Added the same product development requirements document in HTML:
  - `docs/PatchPlan-产品开发需求文档.html`
- Covered product goals, users, permissions, workflows, data model, deployment, security, export, printing, and acceptance criteria.
- Added a separate SolarWinds 30-day trial deployment guide:
  - `docs/solarwinds-30-day-trial-deployment-guide.md`
  - `docs/solarwinds-30-day-trial-deployment-guide.html`

### Authentication And Local Development

- Configured development defaults so the admin account can log in without MFA:
  - `ADMIN_MFA_ENABLED="false"` in `.env.example`.
  - `prisma/seed.ts` reads `ADMIN_MFA_ENABLED` and disables the seeded admin TOTP state when false.
- Kept MFA support in the product for production use.
- Documented that production should replace default passwords, `SESSION_SECRET`, TOTP secret, database password, and backup passphrase.
- Clarified local login credentials in `README.md`.

### Bilingual i18n

- Added project-wide bilingual UI support in `src/shared/i18n.ts`.
- Added Chinese and English strings for the workbench, login, site manager, topology map, rack UI, patch queue, actions, statuses, and error messages.
- Added language switching to the login experience.
- Added language switching to the main workbench.
- Preserved network identifiers as literal values across languages, such as device names, rack codes, and port names.

### Site And Map Navigation

- Added a site topology navigator for network engineers.
- Changed navigation toward a country/city/site/address model.
- Added default APAC sites:
  - China / Shanghai
  - Singapore / Singapore
  - Japan / Tokyo
  - Thailand / Bangkok
  - Korea / Seoul
  - Australia / Sydney
- Removed the accidental duplicate Thailand site.
- Added support for custom site/address records stored in browser local storage.
- Added site add and delete behavior for user-defined sites.
- Added site grouping by country.
- Added city/site display labels and translated country/city labels.
- Added active site summary with rack/device/line counts.
- Added empty-site messaging for sites that do not yet have imported rack data.

### Rack Workbench Layout

- Reworked the app into a three-pane network workbench:
  - Left pane for site/rack/cable navigation.
  - Center canvas for topology, rack, devices, and ports.
  - Right pane for selected port/device/cable details and audit trail.
- Added left and right pane resize handles.
- Added pane collapse rails so sidebars can be hidden and restored.
- Adjusted layout so side panes do not permanently cover the rack canvas.
- Improved central rack canvas spacing for large hardware panels.
- Added independent scrolling/panning behavior for the center canvas.

### In-Rack Cisco Faceplate Operations

- Moved Cisco switch port operation into the rack itself by rendering the C9300-style faceplate directly at the device's U position.
- Kept each visible in-rack Cisco port as a real clickable port button, preserving canonical port names in the interaction target.
- Removed the duplicate selected-device front panel from below the rack so the center canvas no longer repeats the same hardware view.
- Replaced the right-side duplicate device front panel with a compact device summary and local connection list.
- Updated the design rules so rack/canvas remains the single primary hardware surface and the inspector stays focused on details, connections, photos, and actions.

### Global Map Home Mode

- Split the center workspace into a global map overview mode and a site-focused mode.
- The WAN world map now appears on the overview/home view only.
- Selecting a site from the map or left navigator enters the site workspace and hides the world map.
- Added a top-left brand/home control to return from a site workspace to the global WAN map.
- Added explicit Global Map entry points in the left navigator and rack toolbar so the world map is discoverable after entering a site.
- Kept the global map home neutral, with global summary copy instead of carrying an active site selection into the overview.
- Kept the left navigator in topology order on the global home and changed the cable empty state to prompt site selection.
- Site pages with no imported rack now show only the empty-site state instead of repeating the global map.

### Realistic Rack Hardware View

- Reworked rack-mounted device rendering so the rack view reads like physical equipment instead of flat inventory blocks.
- Added visual rack rails, mounting holes, device mounting ears, screw heads, chassis depth, vents, drive bays, module slots, and status/control areas.
- Rendered patch panels and Panduit fields with actual clickable port grids inside the rack-mounted faceplate.
- Kept Cisco switch/router ports interactive while making the embedded faceplates look more like installed hardware.

### Pan, Wheel, And Selection Modes

- Added selectable workbench modes:
  - Select mode.
  - Pan mode.
  - Patch mode.
- Added hand-style drag panning for the center canvas.
- Added mouse wheel vertical pan for the rack canvas.
- Added Shift + wheel horizontal pan.
- Preserved normal scrolling for sidebars and details panes.
- Adjusted port click behavior so pan mode does not accidentally select or patch ports.

### Patchline Creation Workflow

- Added click-to-patch behavior for ports.
- Added drag-to-patch behavior between ports.
- Added a pending patch queue so users can click multiple port pairs before completing.
- Added pending endpoint A state.
- Added complete action for queued patchlines.
- Added clear all pending patchlines action.
- Added cancel endpoint A action.
- Added remove single pending patchline action.
- Added busy/queued visual states for ports.
- Added protection against patching a port to itself.
- Added protection against using already-cabled or already-queued ports.
- Added translated messages for patch queued, completed, partial failure, cleared, removed, busy port, missing port, and cancelled endpoint.

### Port Details And Trace Behavior

- Added route-end visibility in the details panel.
- Added peer endpoint visibility for selected ports.
- Added device-detail panel rendering for selected devices and ports.
- Added direct peer and traced remote endpoint distinction.
- Added cable status controls and cancellation/retire action.
- Added route path display from port through patch panel mappings and cable endpoints.

### Cisco Switch Front Panels

- Added richer Cisco switch front-panel rendering in `src/app/DashboardClient.tsx`.
- Added official-style 12-port bank layout for 48-port switch front panels.
- Changed port labels to canonical network-engineering labels such as:
  - `Gi1/0/1`
  - `Gi1/0/48`
  - `Te1/1/1`
  - `Te1/1/4`
  - `Hu1/0/1`
- Ensured `Te1/1/1` through `Te1/1/4` are arranged left-to-right, not in an alternating top/bottom order.
- Added switch panel metadata and grouping via `src/shared/cisco-catalog.ts`.
- Added or expanded support for these Catalyst models and families:
  - Catalyst 2960
  - Catalyst 2960-X
  - Catalyst 3560
  - Catalyst 3560G
  - Catalyst 3650
  - Catalyst 3750-E
  - Catalyst 3750-X
  - Catalyst 9300
  - Catalyst 9500
- Added a C9500-32C style high-density front panel with `Hu1/0/1` through `Hu1/0/32`.
- Added visual treatment for RJ45, SFP, SFP+, QSFP, and port status states.

### Cisco Router Panels

- Added router-style front panels for Cisco ISR and Catalyst Edge devices.
- Added or expanded support for:
  - Cisco 2911
  - Cisco 1821 / IR1821
  - Cisco 4331
  - Cisco 8200
  - Cisco 8300
  - Cisco 1900 series demo template
  - Cisco 2800 / 2811 demo template
- Added router slot groups, onboard ports, module placeholders, and front-panel style sections.
- Seeded demo router devices with appropriate management IPs, U positions, and port names.

### Panduit And Rear Rack Modeling

- Added a Panduit-style rear cable-management device:
  - `PANDUIT-R01-REAR-01`
- Added 48 rear cable manager positions named `P01` through `P48`.
- Added Panduit rear panel visual rendering.
- Seeded example cables from Cisco device ports to Panduit rear positions.
- Added support for tracing where a selected port lands on the rear rack/cable-management side.

### Seed Data And Demo Inventory

- Expanded `prisma/seed.ts` with additional racks, devices, ports, and cables.
- Added `R01` access rack demo data.
- Added `R02` photo rack demo data based on user-supplied equipment photos.
- Added Cisco switch, router, server, AP, wall outlet, patch panel, and Panduit rear cable manager demo records.
- Added demo cables for:
  - Switch to patch panel.
  - Patch panel rear to wall outlet.
  - Patch panel rear to AP.
  - Switch to server.
  - Cisco uplinks to Panduit rear positions.
  - Cisco routers to Panduit rear positions.
- Added demo label printer seed record.
- Kept seeded admin configurable through `.env`.

### UI Styling

- Expanded `src/app/globals.css` for:
  - Blue/violet engineering theme.
  - Site topology map.
  - Rack cabinet rails and U markers.
  - Cisco switch panels.
  - Cisco router panels.
  - Panduit rear panels.
  - Patch queue.
  - Pan/select/patch states.
  - Resizable side panes and collapsed rails.
  - Login bilingual controls.
- Improved density and scanability for network-engineering use.
- Reduced the feeling that left and right side panels are clipped or covering the rack.
- Added visual distinction for selected, connected, queued, disabled, and drop-target ports.

### API And Data Behavior

- Kept existing authenticated API surfaces for inventory, cables, photos, exports, printers, and printing jobs.
- Continued to use Prisma and PostgreSQL as the source of truth.
- Kept route tracing based on cable endpoints and patch-panel front/rear mappings.
- Kept export, QR, photo, and print job behavior intact while expanding UI around them.

### Deployment And Operations

- Added Linux one-click installer:
  - `scripts/install-linux.sh`
- Installer supports:
  - Ubuntu/Debian-like systems.
  - Fedora/RHEL-like systems.
  - Docker deployment mode.
  - Native deployment mode.
  - Optional Git repository clone/update.
  - Automatic `.env` generation.
  - Automatic secret generation.
  - PostgreSQL setup.
  - Prisma `db push`.
  - Optional seed.
  - Native systemd service registration.
  - Native Nginx reverse proxy configuration.
- Docker mode defaults to `docker compose up -d --build`.
- Native mode installs Node.js, PostgreSQL, Nginx, and registers `patchplan.service`.
- Added installer options:
  - `--mode docker|native`
  - `--dir`
  - `--domain`
  - `--port`
  - `--repo`
  - `--ref`
  - `--admin-email`
  - `--admin-password`
  - `--skip-seed`

### Docker Deployment

- Updated `Dockerfile` to use Next.js standalone production output.
- Added runner image with non-root `nextjs` user.
- Added `NODE_ENV=production`, `PORT=3000`, and `HOSTNAME=0.0.0.0`.
- Added Alpine runtime compatibility packages.
- Added Prisma runtime assets to the runner image.
- Ensured `public/` exists during build even when the repository has no static public directory yet.
- Added private photo storage directory setup inside the container.
- Added `.dockerignore` to keep local-only files out of images:
  - `.env`
  - `.next`
  - `node_modules`
  - `storage`
  - `backups`
  - editor/system noise
- Updated `docker-compose.yml`:
  - PostgreSQL is now exposed only inside the Docker network.
  - Removed host `5432` publishing from production compose.
  - Added a one-shot `migrate` service.
  - Added app healthcheck.
  - Made Caddy wait for the app healthcheck.
  - Added `RUN_SEED` support for the migration service.
  - Kept Caddy public ports `80` and `443`.

### Environment And README

- Added `APP_DOMAIN` and `RUN_SEED` to `.env.example`.
- Updated `README.md` with:
  - Server one-click install instructions.
  - Docker deployment instructions.
  - Native deployment instructions.
  - Manual Docker Compose deployment flow.
  - Security recommendations for firewall and PostgreSQL exposure.
  - Notes about production secrets and MFA.

### README Onboarding

- Added a public workbench screenshot to `docs/assets/traceeverylink-workbench.png`.
- Added the screenshot to `README.md` so GitHub visitors can immediately see the TraceEveryLink interface.
- Added a basic usage tutorial covering local startup, admin login, rack selection, search, port selection, patchline creation, and export actions.

### Carbon-Inspired Workbench Redesign

- Rewrote `DESIGN.md` as the active TraceEveryLink design source of truth.
- Selected an IBM/Carbon-inspired enterprise operations direction from the awesome-design-md style set because it best fits network infrastructure workflows.
- Reworked the application shell toward light neutral surfaces, 1px hairlines, square controls, scarce blue emphasis, and semantic status colors.
- Fixed desktop scrolling so the body stays locked to one viewport while the sidebar, rack canvas, and details inspector scroll independently.
- Reduced the default details inspector from 600px to 360px and narrowed its resize range so it no longer hides the rack canvas.
- Updated responsive rules so mobile layouts stack sidebar, rack, and details areas without collapsing the rack canvas to a narrow column.
- Renamed the English dashboard title from `Patchline Workbench` to `Trace Workbench`.
- Replaced the README workbench screenshot with the redesigned Carbon-style UI.

### APAC WAN Map

- Reworked the main site topology card into a SolarWinds-like APAC WAN map while keeping the Carbon-inspired operations styling from `DESIGN.md`.
- Separated the default sites as Tokyo, Singapore, Shanghai, Seoul, Sydney, and Bangkok on a dotted world-map background.
- Added fixed WAN link paths with utilization color bands, an Unknown state, and a dashed Down status legend.
- Added `Soul` and `Bankok` as tolerant aliases while keeping the visible site names as `Seoul` and `Bangkok`.

### Apple-Inspired Softening

- Updated `DESIGN.md` from strict square Carbon-style controls to an Apple-inspired soft operations direction.
- Added controlled 8-12px roundness, Apple-like system typography, softer gray app chrome, subtle shadows, and calmer system-blue emphasis.
- Rounded the topbar controls, side navigation rows, cable rows, workbench cards, WAN map nodes, legends, details panels, and action toolbar while preserving dense engineering layout and clickable port behavior.
- Kept the physical rack and hardware panels visually technical, but softened their outer containers so the page feels less sharp.

### Dedicated-Line Topology Update

- Updated the WAN map to model the requested dedicated-line topology:
  - Tokyo, Singapore, Seoul, Sydney, and Bangkok each connect back to Shanghai.
  - Shanghai connects to Yanzhou with two dedicated lines.
  - Yanzhou connects to Shenzhou and Jiaozuo with two dedicated lines each.
  - Shanghai/China connects to Milan with one dedicated line.
  - Shanghai connects to Indonesia Subang Factory, and Jakarta connects to Subang.
- Added Yanzhou, Shenzhou, Jiaozuo, Milan, Jakarta, and Subang Factory as default map sites with bilingual labels.
- Enlarged the WAN map canvas and made the dotted world map denser and clearer.
- Made dual dedicated lines render as parallel circuits with `2x` labels.
- Compactized the left rack selector so `R01 / 42U` no longer dominates the site card.
- Removed the default audit log list from the right details panel.

### Real World Map Basemap

- Replaced the fake dotted WAN map background with a generated real-world basemap in `src/shared/world-map.ts`.
- Generated the basemap from Natural Earth 50m Admin 0 Countries data and projected sites with longitude/latitude anchors.
- Kept site labels as offset callouts so dense East Asia locations remain readable while lines still connect to the real geographic anchors.
- Shifted the basemap colors toward a soft blue-gray Apple-inspired treatment instead of the older SolarWinds-like tan map.
- Separated the three China dual-circuit `2x` labels so the Shanghai/Yanzhou/Shenzhou/Jiaozuo area is easier to read.
- Updated the README workbench screenshot to show the real basemap and dedicated-line topology.

### Enhanced Real Map Detail

- Upgraded the generated basemap from the earlier simplified 202-path map to an 811-path Natural Earth 50m map.
- Added a dedicated ocean layer, clearer land/country-border strokes, and subtle geography labels for Europe, Russia, Kazakhstan, India, China, Australia, Indonesia, Indian Ocean, South China Sea, and Pacific Ocean.
- Added bilingual i18n entries for the basemap labels.
- Tuned light and dark mode map colors so the basemap feels more realistic while remaining behind the WAN topology.
- Updated the README workbench screenshot again with the enhanced real-map treatment.

### WAN City Position Correction

- Fixed the WAN link/pin SVG layer to use the same full-card aspect behavior as the Natural Earth basemap, so city markers align with their true longitude/latitude positions.
- Tightened city callout offsets around Shanghai, Yanzhou, Shenzhou, Jiaozuo, Seoul, Tokyo, Singapore, Jakarta, and Subang while keeping leader lines connected to the true geographic pins.
- Added a compact `geo-callout` treatment for WAN map city labels so dense East Asia and Indonesia locations no longer need exaggerated offsets.
- Added short map-node i18n labels such as `1R/12D/15L` to avoid text clipping inside compact imported-site callouts.
- Verified the WAN map in light and dark mode with no city-label overlaps or text overflow, then updated the README workbench screenshot.

### Full World WAN Map And Site Pins

- Regenerated `src/shared/world-map.ts` as a full-world Natural Earth 50m basemap instead of the earlier Europe-to-Pacific cropped viewport.
- Expanded the WAN map canvas height and removed the previous max-width cap so the world map uses more of the center workspace.
- Split city markers from callout labels: colored site pins now render above labels, while callouts only show country, city, and imported-site stats.
- Removed visible `Pending` text from WAN map callouts and the map status legend to reduce visual noise.
- Added site-specific accent colors for Shanghai, China domestic sites, Singapore, Seoul, Tokyo, Bangkok, Milan, Jakarta, Subang, and Sydney.
- Added a tiny visual separation for the close Jakarta/Subang pin pair while keeping cable links anchored to the real geographic points.
- Added North America, South America, and Atlantic Ocean geography labels for the full-world map.
- Verified in browser that the WAN map has 1620 world paths, 12 visible pins, no visible `Pending` map text, no callout overlaps, and no covered pin centers.
- Updated the README workbench screenshot with the full-world colored-pin map.

### Submarine Cable Route Styling

- Replaced the previous high-lift WAN curves with low-curvature cable traces built from route waypoints.
- Routed Shanghai-to-Milan through sea-cable corridors via the South China Sea, Malacca Strait, Indian Ocean, Red Sea, and Mediterranean instead of a high overland arc.
- Added waypoint-based routes for Shanghai links to Tokyo, Seoul, Singapore, Sydney, Bangkok, Subang, and Jakarta/Subang so the lines sit on the map surface like cable paths.
- Kept China domestic dual circuits as compact parallel terrestrial traces while preserving the `2x` labels.
- Updated the README workbench screenshot with the submarine-style route treatment.

### Light And Dark Theme Support

- Added persistent light/dark mode support with `traceeverylink-theme` local storage.
- Added a root theme initialization script so saved dark mode applies before the app hydrates.
- Added icon-based light/dark theme toggles to both the login page and the main workbench topbar.
- Added bilingual i18n labels for theme controls.
- Added dark theme styling for the app shell, login screen, side panes, details inspector, WAN map, real basemap, site callouts, tabs, buttons, forms, status badges, and port states.
- Kept light mode as the default theme.

### Sidebar Site/Rack Hierarchy Polish

- Changed the left sidebar site card hierarchy so the site remains the primary information and racks render as compact child rows.
- Combined site metadata into natural text such as `Default · 1 rack · 15 cables`.
- Added plural-aware rack/cable count strings for English.
- Changed the active rack style from a large filled blue button to a light selected chip with a blue dot.
- Changed rack child labels to include context as `MDF-01 / R01` with `42U` as supporting metadata.
- Separated rack selection styling from the generic `.active` state by using a dedicated `rack-selected` class.

### Cable Sidebar List Polish

- Reworked the left sidebar cable rows from large text-heavy cards into compact scan rows.
- Separated the batch-selection checkbox from the row open action instead of nesting a checkbox inside a button.
- Added a one-line cable identifier, short A-to-B endpoint preview, and small status dot so dense cable lists are easier to scan.
- Added a shorter cable-list endpoint formatter while keeping full cable labels in tooltips and the details inspector.
- Added an accessible i18n label for selecting cables in the batch list.
- Verified the compact cable list in light and dark mode and updated the README workbench screenshot.

### Backup And Existing Operations Scripts

- Kept `scripts/backup.sh` for encrypted PostgreSQL and photo backup.
- Kept `scripts/deploy-rackula-pve.sh` for Rackula reference deployment.
- Documented that TraceEveryLink's Docker Compose deployment is separate from Rackula's deployment helper.

### Verification

- `npm run typecheck` passed.
- `npm run test` passed during the UI/i18n/site-map iteration.
- Browser/UI screenshots were generated during UI validation, including:
  - `.next/dev/screenshots/patchplan-engineer-topology-zh.png`
- `bash -n scripts/install-linux.sh` passed.
- `docker compose config` passed.
- `docker build --target runner -t patchplan:deploy-check .` passed.
- Direct Windows `npm run build` hit a local Prisma engine file-lock error:
  - `EPERM: operation not permitted, rename ... query_engine-windows.dll.node`
  - The same production build passed inside Docker Linux, so this is recorded as a local Windows process/file-lock issue rather than a code build failure.

### Known Notes

- The workspace directory is currently not a git repository, so this changelog was reconstructed from the current files and completed task history rather than from `git diff`.
- The project still uses `PatchPlan` / `patchplan` in some technical metadata, database defaults, cookie/localStorage keys, install paths, backup names, and historical document filenames. User-facing product branding is now `接线镜 / TraceEveryLink`.
- Production deployments should replace all default secrets and enable MFA before public exposure.
