# TraceEveryLink DESIGN.md

TraceEveryLink, 中文名接线镜, is an operational network-engineering workspace for documenting physical connectivity across sites, racks, Cisco switches, routers, Panduit cable management, patch panels, servers, APs, and field endpoints.

This file is the visual source of truth for AI agents and developers working on TraceEveryLink. The repository and technical identifiers may still use PatchPlan / patchplan, but user-facing product copy should use 接线镜 / TraceEveryLink.

## 1. Design Direction

Use an Apple-inspired soft enterprise operations style, not the old neon engineering-console style and not a marketing-site style.

The product should now soften the earlier Carbon direction with Apple-like visual ergonomics: light gray app chrome, rounded-but-controlled panels, subtle depth, calm system blue, and generous focus states. Use this as design inspiration only. Do not copy Apple branding, logos, product identity, screenshots, or proprietary assets.

The product should feel:

- Precise, quiet, and operational.
- Data-dense but readable.
- Built for network engineers scanning identifiers under time pressure.
- Structured with grids, soft 1px rules, compact panes, and stable hardware diagrams.
- Calm enough for change windows, incident response, and physical rack work.

Avoid:

- Hero-page or landing-page composition.
- Decorative blobs, glow fields, bokeh, and generic cyber dashboards.
- Oversized nested cards.
- Purple-heavy gradients.
- Overly bubbly pill-heavy UI that reduces scan speed.
- Marketing copy inside the application.

Every screen should help answer: where is this site, rack, device, port, cable, and peer?

## 2. Product-Specific Principles

Preserve this hierarchy:

Country -> City -> Site/Address -> Rack -> Device -> Port -> Cable -> Peer

Rules:

- Always preserve real infrastructure identifiers.
- Show human context and machine identifiers together: `China / Shanghai`, `MDF-01 / R01`, `C9300-ACCESS-01`, `Gi1/0/4`.
- Keep counts visible near navigation: rack count, device count, cable count.
- Empty states must say what is missing and where it belongs.
- Cisco switch and router panels must follow official-like physical order.
- Never display Cisco ports as `1-0-4`; use canonical names such as `Gi1/0/4`, `Te1/1/1`, `Fo1/1/1`, `Hu1/0/1`.
- 48-port switch layouts should preserve 12-port bank grouping when that matches the physical model.
- Rack views must use real U-height logic.
- Every real port is a button, not decoration.

## 3. Color Tokens

TraceEveryLink supports both light and dark modes. The default app shell is light, and the user can manually switch to dark mode. The theme preference should persist in local storage and should apply to both the login screen and the main workbench.

Rack interiors and hardware faces may use dark physical contrast in either theme when it improves readability.

```css
:root {
  --bg: #f5f5f7;
  --panel: #ffffff;
  --panel-2: #f8f8fa;
  --ink: #1d1d1f;
  --muted: #6e6e73;
  --line: #d9dce3;

  --blue: #0a84ff;
  --blue-strong: #0066cc;
  --blue-soft: #eaf4ff;

  --violet: #5856d6;
  --violet-soft: #eeeeff;
  --teal: #00a6c8;

  --green: #34c759;
  --green-soft: #e7f8ec;
  --amber: #ffcc00;
  --amber-soft: #fff7d6;
  --red: #ff3b30;
  --red-soft: #fff1f0;

  --rail: #9b9ba0;
  --shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
}
```

Color roles:

- `--bg`: application canvas.
- `--panel`: primary panels and detail surfaces.
- `--panel-2`: sidebars, inputs, alternate rows, subtle workbench bands.
- `--line`: borders, separators, grid edges, and hairlines.
- `--blue`: primary actions, focus rings, selected rows, selected tabs, active topology nodes.
- `--blue-strong`: pressed/selected emphasis.
- `--blue-soft`: selected or hover background.
- `--green`: confirmed/ready/connected.
- `--amber`: planned, draft, pending review, warning.
- `--red`: fault, destructive, delete.
- `--violet` and `--teal`: compatibility aliases. Do not introduce a separate purple or teal brand system.

Blue must be scarce and functional. Neutral surfaces carry the interface; semantic states carry operational meaning.

Dark mode rules:

- Use `data-theme="dark"` on the root element and keep the same semantic token names.
- Do not invert hardware diagrams blindly; keep port, rack, and device status colors recognizable.
- Keep the real world map subtle blue-gray in dark mode so topology links remain readable.
- Theme controls should be icon-based, accessible, and stored with the same persistence behavior as language preference.
- Verify both light and dark screenshots after visual changes.

## 4. Typography

Use Apple system typography first, then fall back to common system fonts:

```css
font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", "Helvetica Neue", Arial, ui-sans-serif, system-ui, sans-serif;
letter-spacing: 0;
```

Rules:

- No negative letter spacing.
- Do not scale font size with viewport width.
- Use sentence case for operational labels.
- Use lighter title weights than the old dark-console version; confidence comes from alignment and spacing, not heavy bold everywhere.
- Device, rack, cable, and port identifiers may use stronger weight for scanning.
- Port labels must remain legible at small sizes.
- Chinese and English labels must both fit in buttons, tabs, sidebars, and rack nodes.

Suggested scale:

- Product title: 20-24px, 400-600 weight.
- Panel heading: 16-18px, 400-600 weight.
- Section label: 11-12px, 400-600 weight.
- Body/data rows: 12-14px.
- Port labels: 9-11px, 800-900 weight.
- Metadata: 10-12px, muted.

## 5. Layout

Desktop is the primary target. The default screen is a three-pane operational workbench:

- Left pane: site/rack navigation and cable selection.
- Center pane: topology, rack, device, and port canvas.
- Right pane: selected object inspector, patch queue, exports, labels, audit.

Rules:

- The whole app should fit inside one viewport-height shell on desktop.
- Do not allow body-level page scroll on desktop. Only the left pane, center canvas, and right inspector scroll independently.
- The center canvas must remain the primary surface.
- The details pane is an inspector, not a second main canvas. Default width should be around 360px; resize range should stay compact.
- Collapsed panes must leave a compact restore rail.
- Use soft 1px resizers, hairlines, and subtle depth. Avoid thick glowing separators.
- The search bar belongs in the topbar and should stay wide enough for cable, port, and device identifiers.

Left pane:

- Organize sites by country and city.
- Keep rack cards compact.
- Site selection and rack selection are separate visual states: selected sites use a subtle blue surface and left rule; selected racks use a small child chip or row with a blue dot/light tint, not a large filled CTA.
- Site metadata should read naturally, for example `Default · 1 rack · 15 cables`.
- Rack children should include context such as `MDF-01 / R01` and `42U` without overpowering the site name.
- The Rackula Device Types library belongs in the left pane as a compact searchable template reference. These templates are not mounted devices until an explicit create/place workflow exists.
- Cable rows should be scannable, not large marketing cards.
- Cable rows should use a compact list hierarchy: small batch checkbox, one-line cable identifier with ellipsis, short A-to-B endpoint preview, and a small status dot. Keep full cable and endpoint detail in tooltips and the inspector instead of expanding every row.
- Site list and cable list may scroll independently to avoid one long page.

Center pane:

- Keep toolbar sticky inside the canvas.
- Global WAN topology belongs to the overview/home view. Selecting a concrete site such as Shanghai, Jiaozuo, or Bangkok should enter a site-focused workspace where the map is hidden and the rack/empty-site state becomes the primary surface.
- The overview/home map should read as a global entry point, not as a selected-site detail card. Avoid carrying active site highlights, rack selection states, or site-specific footer copy into the home view.
- Provide explicit global-map affordances in both the left navigator and the site/rack toolbar so users can return from a site workspace to the world map without guessing that the product mark is clickable.
- Site topology card and rack overview should not stack on the same site-focused page. The rack is the primary hardware operation surface after a site is selected.
- The rack overview should present one front-facing rack view, not side-by-side front and rear rack faces.
- Rack overview scale should feel like an office or small MDF room overview: one rack should be compact, and two or three racks from the same site should be able to appear side by side without making a single 42U rack dominate the page.
- Rack-mounted devices must read like physical equipment installed in a real rack, not flat inventory blocks. Include rack rails, mounting ears, screw heads, device depth/shadow, ventilation, drive bays, module slots, patch fields, and real clickable port grids where available.
- Cisco switch and router faceplates should render directly inside their real U positions whenever possible. The in-rack faceplate must keep real port buttons and official-like port order.
- In-rack device faces should look like the installed hardware, not inventory cards. Do not print hostname, model, SKU, or vendor text on the rack-mounted faceplate; show that identity in the inspector after the user selects the device.
- Do not duplicate the same selected hardware front panel below the rack and again in the right inspector. If a device is selected, the right inspector should summarize identity, connections, port/cable context, photos, and actions.
- The first topology surface should be a global dedicated-line WAN map: Shanghai is the hub for Tokyo, Singapore, Seoul, Sydney, and Bangkok; Shanghai connects to Yanzhou with dual circuits; Yanzhou connects to Shenzhou and Jiaozuo with dual circuits; China connects to Milan; Shanghai connects to Subang Factory; Jakarta connects to Subang. Use a real world-map basemap from an open geography source, true longitude/latitude anchors, city callout labels, colored link-utilization paths, dual-circuit labels, and a compact utilization legend. Do not use SolarWinds branding, logos, stamps, or copied artwork.
- The current basemap is generated into `src/shared/world-map.ts` from Natural Earth 50m Admin 0 Countries data as a full-world map. Include ocean, land, country-border, and subtle geography-label layers so the map reads as a real operational map rather than an abstract silhouette. Keep the labels and land shapes muted blue-gray so topology lines and site labels remain the focus.
- The basemap SVG, WAN link SVG, and geographic pin layer must share the same projection and aspect handling. If the basemap fills the card with `preserveAspectRatio="none"`, the link/pin SVG must do the same so city anchors stay on their true locations.
- City pins and city callout cards are separate layers. Pins should stay visible above labels and use site-specific colors; callouts should be nearby text labels, not the marker itself.
- City callout cards should stay compact and near their real longitude/latitude pins. Use short leader lines and small offsets only to avoid overlap; do not move a label so far that it implies a different city location. Do not show repeated `Pending` copy on the map callouts.
- WAN links should read as submarine/terrestrial cable traces on the map surface, not airborne arcs. Use low-curvature route waypoints through plausible sea corridors such as the South China Sea, Malacca Strait, Indian Ocean, Red Sea, and Mediterranean where applicable.
- Use grid backgrounds subtly; do not use atmospheric gradients.
- Rack and hardware surfaces can stay dark where physical contrast helps.

Right pane:

- Actions stay at the top.
- Empty details should be compact and informative, not a large blank wall.
- Selecting a Rackula device type template should show template metadata in the inspector without showing real-device actions, photos, port peers, or cable workflows.
- Audit should not be visible in the default right inspector. Keep the inspector focused on the selected device, port, cable, pending patch queue, and direct actions.
- The inspector should not repeat the rack's hardware faceplate. Wide physical panels belong in the rack/canvas, not as a second horizontal-scrolling copy in the inspector.

## 6. Component Styling

Use Apple-like soft component discipline:

- Buttons, inputs, panels, tabs, rows, and cards use controlled roundness, usually 8px for cards and 10-12px for compact controls.
- Prefer rounded rectangles over sharp square controls, but avoid oversized pills for dense technical rows.
- Prefer 1px borders, light gray surfaces, and subtle shadows over hard grid boxes.
- Primary button: solid system blue, white text.
- Secondary/icon buttons: white or translucent surface, gray border, charcoal text.
- Inputs: light-gray rounded background with blue focus outline.
- Selected rows: blue left rule or blue filled state.
- Tabs and segmented controls: square, 40-48px stable height.
- Status badges: light semantic background plus text label.

Rack/device exceptions:

- Physical hardware may use gradients or darker materials to convey device surfaces.
- Port buttons must still be clear, clickable, and stable.
- Selected ports use a visible blue outline.
- Status color must be paired with a label or positional context; do not rely on color alone.

## 7. Interaction Rules

Modes:

- Select mode: click devices, ports, and cables to inspect.
- Patch mode: click ports to queue endpoint A/B patchlines, then complete.
- Pan mode: drag the center canvas.

Mouse and trackpad:

- Wheel in the center rack canvas pans vertically.
- Shift + wheel pans horizontally.
- Sidebar and details scrolling remain independent.

Patchline creation:

- The user can queue many pending connections before completing.
- A pending A endpoint can be cancelled.
- Pending connections can be removed one by one.
- Do not auto-create a cable without a visible pending/complete action.

Selection:

- Selecting a cable shows cable details and endpoints.
- Selecting a port shows peer, route end, trace, and device context.
- Selecting a device shows its interactive front panel.

## 8. Language And Copy

- Default UI language is English.
- Users may manually switch between English and Chinese.
- Manual preference should persist.
- All visible UI copy belongs in i18n.
- Preserve physical/network identifiers as-is in every language.
- Do not translate device names, rack codes, cable IDs, or port identifiers.

## 9. Responsive Behavior And Accessibility

Desktop:

- Three-pane layout with resizable sidebars.
- Body scroll disabled.
- Center canvas independently scrolls/pans.

Tablet/mobile:

- Panes may stack.
- Body scroll can return below desktop widths.
- Center canvas remains horizontally scrollable.
- Editing may be less dense, but inspection must remain possible.

Accessibility:

- Use buttons for interactive nodes and ports.
- Use accessible labels or titles for icon-only controls.
- Maintain focus outlines using blue.
- Do not rely on color alone for status.
- Text must not overflow buttons, rows, sidebars, or rack nodes.
- Keep non-port controls around 36-48px touch size.

## 10. Do And Do Not

Do:

- Make every screen feel actionable for a network engineer.
- Keep identifiers exact and visible.
- Use stable grids for rack units, port banks, and toolbars.
- Prefer dense, organized, technical layouts over open marketing whitespace.
- Verify screenshots after visual changes.
- Check English and Chinese layouts after copy or layout changes.

Do not:

- Do not turn the app into a landing page.
- Do not add decorative orbs, bokeh blobs, generic hero gradients, or illustration-only sections.
- Do not flatten physical hierarchy into generic cards.
- Do not invent Cisco port order when official-like layout/order is known.
- Do not hide selected object context.
- Do not make ports decorative if the user expects to click them.
- Do not use ambiguous labels like `1-0-4` when `Gi1/0/4` is correct.
- Do not put cards inside cards for page sections.
- Do not let side panels obscure the rack canvas without resize/collapse.

## Agent Prompt Guide

When building or modifying TraceEveryLink UI:

> Build this as an Apple-inspired soft network operations workbench. Preserve Country -> City -> Site/Address -> Rack -> Device -> Port -> Cable -> Peer hierarchy. Support persistent light and dark modes with shared semantic tokens. Use neutral surfaces, soft 1px hairlines, controlled 8-12px roundness, subtle depth, system-blue emphasis, and semantic status colors. Keep all port identifiers canonical. Use real buttons for interactive ports. Maintain bilingual i18n keys. Avoid marketing layout, glow-heavy dashboards, and decorative visuals. Verify that the app stays within one desktop viewport and that panes scroll independently.

When adding a new UI component:

1. Define its role in the physical network workflow.
2. Map its status colors to existing semantic tokens.
3. Ensure it works in Chinese and English.
4. Ensure it does not resize surrounding rack/device layouts unexpectedly.
5. Add screenshot verification for meaningful visual changes.

## Implementation Mapping

- `src/app/DashboardClient.tsx`: main workbench, site topology, rack, device panels, details, patch interactions.
- `src/app/globals.css`: theme, layout, rack/device/site visual styling.
- `src/shared/i18n.ts`: bilingual UI strings and API/login error localization.
- `src/shared/cisco-catalog.ts`: Cisco model templates and port naming/order logic.

Keep these files aligned with this DESIGN.md.
