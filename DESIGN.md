# TraceEveryLink DESIGN.md

TraceEveryLink, 中文名接线镜, is an operational network-engineering workspace for documenting physical connectivity across sites, racks, Cisco switches, routers, Panduit cable management, patch panels, servers, APs, and field endpoints. This design system should make the product feel like an engineer's live rack notebook: dense, exact, visual, and calm under pressure.

This file is the visual source of truth for AI agents and developers working on TraceEveryLink. The current repository codename may still appear as PatchPlan in technical paths, but user-facing product copy should use 接线镜 / TraceEveryLink. Follow this file when adding screens, components, states, copy, and interaction behavior.

## 1. Visual Theme And Atmosphere

TraceEveryLink uses a dark engineering-console aesthetic with blue and violet accents. The interface should feel like a rack topology tool, not a SaaS marketing dashboard.

The mood is:

- Technical, precise, and field-ready.
- Dense but readable.
- Built for network engineers who scan identifiers, not casual users reading tutorials.
- Blueprint-like, with grid surfaces, topology lines, hardware panels, and status lights.
- Calm enough for production change windows and incident response.

Avoid hero-page styling, decorative blobs, oversized cards, playful illustration, soft consumer gradients, and generic admin dashboard patterns. Every visual element should help answer: "Where is this site, rack, device, port, cable, and peer?"

## 2. Product-Specific Design Principles

Use engineer-first hierarchy:

- Country -> City -> Site/Address -> Rack -> Device -> Port -> Cable -> Peer.
- Always preserve real infrastructure identifiers.
- Show both human context and machine identifiers: example `China / Shanghai`, `MDF-01 / R01`, `C9300-ACCESS-01`, `Gi1/0/4`.
- Make counts visible near navigation: rack count, device count, line/cable count.
- Empty states should show what is missing and where to add it.

Use physical realism where it matters:

- Cisco switch and router panels must follow official port order as closely as possible.
- Do not display Cisco ports as `1-0-4`; use `Gi1/0/4`, `Te1/1/1`, `Fo1/1/1`, or the correct short form.
- 48-port switch layouts should preserve bank grouping, usually 12 ports per group when matching official front-panel diagrams.
- Rack views must use real U-height visual logic.
- Port buttons must be clickable/interactive when they represent real ports, not decorative shapes.

Use status clarity:

- A port/cable state must be visible by color and label, not color alone.
- Confirmed lines are stable green.
- Draft/planned lines are amber/blue.
- Faulty lines are red and visually distinct.
- Retired lines should be muted and never look active.

## 3. Color Palette And Tokens

Use these semantic tokens as the primary palette. Keep new colors close to this set unless a new semantic state is truly needed.

```css
:root {
  --bg: #071527;
  --panel: #0f2240;
  --panel-2: #142a4e;
  --ink: #f4f9ff;
  --muted: #9eb6d6;
  --line: #294568;

  --blue: #37a8ff;
  --blue-strong: #1677ff;
  --blue-soft: #0c345d;

  --violet: #8b5cf6;
  --violet-soft: #251b52;
  --teal: #4ee5ff;

  --green: #2ee6a6;
  --green-soft: #0d3a36;
  --amber: #f2a744;
  --amber-soft: #3f2a14;
  --red: #ff6b7a;
  --red-soft: #3a1420;

  --rail: #64748b;
  --shadow: 0 26px 70px rgba(2, 8, 23, 0.44);
}
```

Color roles:

- `--bg`: main application canvas.
- `--panel`: primary sidebars, login panel, major modules.
- `--panel-2`: selected surfaces and rack/device panels.
- `--line`: borders, separators, grid edges.
- `--blue`: active selection, primary CTAs, focus.
- `--violet`: secondary active emphasis, selected rack underlines, route emphasis.
- `--teal`: metadata highlights, brand eyebrow, small equipment indicators.
- `--green`: confirmed/ready/connected.
- `--amber`: planned/draft/warning.
- `--red`: fault, destructive, delete, retired action.

Do not create a one-note blue page. Blue is the operational base; violet, teal, green, amber, red, and steel-gray provide semantic contrast.

## 4. Typography Rules

Use system UI fonts:

```css
font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
letter-spacing: 0;
```

Type rules:

- No negative letter spacing.
- Do not scale font size with viewport width.
- Use compact, high-weight labels for engineering identifiers.
- Use large text only for page titles and selected primary object names.
- Port labels must remain legible at small sizes.
- Chinese and English labels must both fit in buttons, tabs, sidebars, and rack nodes.

Suggested scale:

- Page title: 24px, 800-900 weight.
- Section title: 11-12px uppercase or compact label, 800-900 weight.
- Panel heading: 16-18px, 800-900 weight.
- Body/data rows: 12-14px.
- Port labels: 9-11px, 800-900 weight.
- Metadata: 10-12px, muted.

## 5. Layout And Information Architecture

TraceEveryLink's default screen is a three-pane operational workbench:

- Left: navigation and inventory filter.
- Center: topology/rack/device canvas.
- Right: selected object details, peer path, status, audit, photo, labels.

Left pane rules:

- Organize sites by `Country -> City -> Site/Address`.
- Current country/site should be easy to spot.
- Custom addresses can be added and removed by the user.
- Show rack and cable counts at country and city level.
- Do not flatten country and city into duplicate site nodes.

Center canvas rules:

- The top region is a site topology navigator.
- The rack layout follows below.
- The selected device/port panel follows the rack layout or appears in details.
- Support hand panning, mouse wheel pan, and reset.
- The canvas should feel like a working diagram surface, not a static illustration.

Right details pane rules:

- Always answer "what is selected?"
- Show selected device front panel when a device/port is selected.
- Show peer endpoint, final route endpoint, cable state, QR label, photos, audit.
- Keep actions at the top: new cable, exports, labels, print.

Resizable pane behavior:

- Left and right panes must be draggable.
- Collapsed panes must leave a compact rail so the user can restore them.
- Center content must not be permanently hidden behind side panels.

## 6. Core Component Styling

Topbar:

- Sticky, dark, compact.
- Brand at left, search in center, user/actions/language at right.
- Search should be wide and calm, not prominent like a marketing search box.

Buttons:

- Primary actions use blue gradient, 8px radius or less.
- Icon buttons use actual icons from `lucide-react`.
- Avoid text-only rounded pills when an icon is clearer.
- Buttons must have stable dimensions so labels and icons do not shift layout.

Sidebars:

- Use compact row/card surfaces for repeated navigation items.
- Do not nest decorative cards inside decorative cards.
- Active site/rack uses blue border and violet underline/shadow.
- Delete custom site action uses red icon button and only appears for custom sites.

Site Topology Map:

- Use engineering-topology language, not decorative map language.
- Nodes show country, city, and `R/D/L` counts.
- Include legend for imported, pending, and selected states.
- Lines are subtle; nodes and counts carry meaning.
- Selected site gets a clear blue/violet state.
- Empty sites must say pending import.

Rack Layout:

- Use visible left/right U rails.
- Devices occupy real U rows.
- Device blocks should show U position, name, status, and condensed port hints.
- Front and rear faces should be visually distinct but adjacent.
- Rack panel should be 1040px-ish in desktop views and stable while panning.

Cisco Device Panels:

- Use official-like front-panel composition.
- Group 48 downlink ports in 12-port banks where appropriate.
- Uplinks/network modules are visually separated.
- Show official image reference when present, but the interactive port grid remains the primary control.
- Do not crop critical ports.

Port Buttons:

- Every real port is a button.
- Port labels use canonical Cisco short names.
- Selected port has visible blue/violet outline.
- Connected ports use status color.
- Drop targets and blocked targets must be visually distinct.

Forms:

- Keep forms compact and inline where possible.
- Use labels above fields.
- New site/address form fields: country, city, address/site.
- New cable form fields: cable ID, label, endpoint A, endpoint B, color.
- Errors are red and placed close to the relevant action.

## 7. Interaction Rules

Modes:

- Select mode: click devices/ports/cables to inspect.
- Patch mode: click ports to queue endpoint A/B patchlines, then complete.
- Pan mode: drag the center canvas with a hand cursor.

Mouse and trackpad:

- Wheel in the center rack canvas pans vertically.
- Shift + wheel pans horizontally.
- Trackpad horizontal scroll pans horizontally.
- Sidebar and details pane scrolling should remain independent.

Patchline creation:

- The user can select many pending connections before completing.
- A pending A endpoint can be cancelled.
- Pending connections can be removed one by one.
- Do not auto-create a cable without a visible pending/complete action.

Selection:

- Selecting a cable should show cable details and endpoints.
- Selecting a port should show peer, route end, and device panel.
- Selecting a device should show its interactive front panel.

Language:

- UI is bilingual Chinese/English.
- Use i18n keys for all visible UI copy.
- Default language must be English for every first-time user.
- Users may manually switch to Chinese, and that manual preference should persist.
- Do not hard-code Chinese or English labels in components.
- Preserve physical/network identifiers as-is in both languages.

## 8. Responsive Behavior And Accessibility

Desktop is the primary target. Mobile/tablet should remain usable but can prioritize inspection over dense editing.

Breakpoints:

- Desktop: three-pane layout with resizable sidebars.
- Medium: allow collapsing one or both side panes.
- Small: stack or rail side panes; center canvas remains scroll/pan capable.

Accessibility:

- Use buttons for interactive nodes and ports.
- Use `title` or accessible labels for icon-only controls.
- Maintain focus outlines using blue.
- Do not rely on color alone for status.
- Text must not overflow buttons, cards, sidebars, or rack nodes.
- Keep touch targets around 36-40px for controls; port buttons can be smaller only inside dense hardware panels.

## 9. Do And Do Not

Do:

- Make every screen feel like a network engineer can act from it.
- Keep identifiers exact and visible.
- Use stable grids for rack units, port banks, and toolbars.
- Prefer dense, organized, technical layouts over open marketing whitespace.
- Verify screenshots after visual changes.
- Check both Chinese and English UI after copy/layout changes.

Do not:

- Do not turn the app into a landing page.
- Do not add decorative orbs, bokeh blobs, generic hero gradients, or illustration-only sections.
- Do not flatten physical hierarchy into generic cards.
- Do not invent Cisco port order when official layout/order is known.
- Do not hide the selected object context.
- Do not make ports decorative if the user expects to click them.
- Do not use ambiguous labels like `1-0-4` when `Gi1/0/4` is correct.
- Do not put cards inside cards for page sections.
- Do not let side panels obscure the rack canvas without a way to resize/collapse.

## Agent Prompt Guide

When building or modifying TraceEveryLink UI, use this prompt framing:

> Build this as a dense network-engineering workbench. Preserve Country -> City -> Site/Address -> Rack -> Device -> Port hierarchy. Use the existing dark blue/violet engineering console theme. Keep all port identifiers canonical. Use real buttons for interactive ports. Maintain bilingual i18n keys. Avoid marketing layout and decorative visuals. Verify that text fits and the rack/topology canvas remains usable with pan, wheel, and resizable side panes.

When adding a new UI component:

1. Define its role in the physical network workflow.
2. Map its status colors to existing semantic tokens.
3. Ensure it works in Chinese and English.
4. Ensure it does not resize surrounding rack/device layouts unexpectedly.
5. Add screenshot verification for meaningful visual changes.

## Implementation Mapping

Current primary files:

- `src/app/DashboardClient.tsx`: main workbench, site topology, rack, device panels, details, patch interactions.
- `src/app/globals.css`: global theme, layout, rack/device/site visual styling.
- `src/shared/i18n.ts`: bilingual UI strings and API/login error localization.
- `src/shared/cisco-catalog.ts`: Cisco model templates and port naming/order logic.

All future UI changes should keep these files aligned with this design system.
