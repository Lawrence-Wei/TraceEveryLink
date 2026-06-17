# TraceEveryLink Change Log

This file records product, UI, data-model, deployment, and documentation changes made during the current TraceEveryLink build-out.

## 2026-06-17

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
