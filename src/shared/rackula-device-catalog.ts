// Adapted from Rackula's Generic starter device type library.
// Source: https://github.com/RackulaLives/Rackula/blob/main/src/lib/data/starterLibrary.ts
// Field names are normalized for TraceEveryLink, but slugs, model names, categories,
// heights, slot widths, depth flags, and container slot metadata are preserved.

export type RackulaDeviceCategory =
  | "server"
  | "network"
  | "firewall"
  | "patch-panel"
  | "power"
  | "storage"
  | "kvm"
  | "av-media"
  | "cooling"
  | "shelf"
  | "blank"
  | "cable-management"
  | "chassis"
  | "other";

export type RackulaSubdeviceRole = "parent" | "child";

export type RackulaSlot = {
  id: string;
  name: string;
  position: { row: number; col: number };
  widthFraction: number;
  heightUnits?: number;
  accepts?: RackulaDeviceCategory[];
};

export type RackulaDeviceTemplate = {
  slug: string;
  model: string;
  heightU: number;
  category: RackulaDeviceCategory;
  fullDepth: boolean;
  slotWidth: 1 | 2;
  color: string;
  slots?: RackulaSlot[];
  subdeviceRole?: RackulaSubdeviceRole;
};

export const rackulaDeviceCategoryOrder: RackulaDeviceCategory[] = [
  "server",
  "firewall",
  "network",
  "storage",
  "power",
  "patch-panel",
  "kvm",
  "av-media",
  "cooling",
  "shelf",
  "chassis",
  "blank",
  "cable-management",
  "other"
];

export const rackulaCategoryColors: Record<RackulaDeviceCategory, string> = {
  server: "#4A7A8A",
  network: "#7B6BA8",
  firewall: "#C0392B",
  storage: "#3D7A4A",
  power: "#A84A4A",
  kvm: "#A87A4A",
  "av-media": "#A85A7A",
  cooling: "#8A8A4A",
  chassis: "#5A6A8A",
  shelf: "#6272A4",
  blank: "#44475A",
  "cable-management": "#6272A4",
  "patch-panel": "#6272A4",
  other: "#6272A4"
};

const rackulaStarterDeviceSpecs: Array<Omit<RackulaDeviceTemplate, "color" | "fullDepth" | "slotWidth"> & {
  fullDepth?: boolean;
  slotWidth?: 1 | 2;
}> = [
  { slug: "1u-server", model: "Server", heightU: 1, category: "server" },
  { slug: "2u-server", model: "Server", heightU: 2, category: "server" },
  { slug: "3u-server", model: "Server", heightU: 3, category: "server" },
  { slug: "4u-server", model: "Server", heightU: 4, category: "server" },
  { slug: "1u-router-firewall", model: "Router/Firewall", heightU: 1, category: "firewall" },
  { slug: "2u-router-firewall", model: "Router/Firewall", heightU: 2, category: "firewall" },
  { slug: "24-port-switch", model: "Switch (24-Port)", heightU: 1, category: "network" },
  { slug: "48-port-switch", model: "Switch (48-Port)", heightU: 1, category: "network" },
  { slug: "1u-storage", model: "Storage", heightU: 1, category: "storage" },
  { slug: "2u-storage", model: "Storage", heightU: 2, category: "storage" },
  { slug: "3u-storage", model: "Storage", heightU: 3, category: "storage" },
  { slug: "4u-storage", model: "Storage", heightU: 4, category: "storage" },
  { slug: "1u-pdu", model: "PDU", heightU: 1, category: "power", fullDepth: false },
  { slug: "2u-pdu", model: "PDU", heightU: 2, category: "power", fullDepth: false },
  { slug: "2u-ups", model: "UPS", heightU: 2, category: "power" },
  { slug: "4u-ups", model: "UPS", heightU: 4, category: "power" },
  { slug: "1u-fiber-patch-panel", model: "Fiber Patch Panel", heightU: 1, category: "patch-panel", fullDepth: false },
  { slug: "24-port-patch-panel", model: "Patch Panel (24-Port)", heightU: 1, category: "patch-panel", fullDepth: false },
  { slug: "48-port-patch-panel", model: "Patch Panel (48-Port)", heightU: 2, category: "patch-panel", fullDepth: false },
  { slug: "1u-console-drawer", model: "Console Drawer", heightU: 1, category: "kvm" },
  { slug: "1u-kvm", model: "KVM Switch", heightU: 1, category: "kvm" },
  { slug: "1u-amplifier", model: "Amplifier", heightU: 1, category: "av-media" },
  { slug: "2u-amplifier", model: "Amplifier", heightU: 2, category: "av-media" },
  { slug: "1u-audio-processor", model: "Audio Processor", heightU: 1, category: "av-media" },
  { slug: "1u-av-receiver", model: "AV Receiver", heightU: 1, category: "av-media" },
  { slug: "2u-av-receiver", model: "AV Receiver", heightU: 2, category: "av-media" },
  { slug: "3u-power-amplifier", model: "Power Amplifier", heightU: 3, category: "av-media" },
  { slug: "1u-streaming-encoder", model: "Streaming Encoder", heightU: 1, category: "av-media" },
  { slug: "1u-video-switcher", model: "Video Switcher", heightU: 1, category: "av-media" },
  { slug: "1u-fan-panel", model: "Fan Panel", heightU: 1, category: "cooling", fullDepth: false },
  { slug: "2u-fan-panel", model: "Fan Panel", heightU: 2, category: "cooling", fullDepth: false },
  { slug: "1u-cantilever-shelf", model: "Cantilever Shelf", heightU: 1, category: "shelf", fullDepth: false },
  { slug: "1u-shelf", model: "Shelf", heightU: 1, category: "shelf" },
  { slug: "2u-shelf", model: "Shelf", heightU: 2, category: "shelf" },
  { slug: "1u-vented-shelf", model: "Vented Shelf", heightU: 1, category: "shelf" },
  {
    slug: "shelf-1u-2slot",
    model: "Shelf (2 Slot)",
    heightU: 1,
    category: "shelf",
    slots: [
      { id: "left", name: "Left", position: { row: 0, col: 0 }, widthFraction: 0.5, heightUnits: 1 },
      { id: "right", name: "Right", position: { row: 0, col: 1 }, widthFraction: 0.5, heightUnits: 1 }
    ]
  },
  {
    slug: "shelf-1u-3slot",
    model: "Shelf (3 Slot)",
    heightU: 1,
    category: "shelf",
    slots: [
      { id: "left", name: "Left", position: { row: 0, col: 0 }, widthFraction: 0.33, heightUnits: 1 },
      { id: "center", name: "Center", position: { row: 0, col: 1 }, widthFraction: 0.34, heightUnits: 1 },
      { id: "right", name: "Right", position: { row: 0, col: 2 }, widthFraction: 0.33, heightUnits: 1 }
    ]
  },
  {
    slug: "shelf-2u-2slot",
    model: "Shelf (2 Slot)",
    heightU: 2,
    category: "shelf",
    slots: [
      { id: "left", name: "Left", position: { row: 0, col: 0 }, widthFraction: 0.5, heightUnits: 2 },
      { id: "right", name: "Right", position: { row: 0, col: 1 }, widthFraction: 0.5, heightUnits: 2 }
    ]
  },
  {
    slug: "shelf-2u-3slot",
    model: "Shelf (3 Slot)",
    heightU: 2,
    category: "shelf",
    slots: [
      { id: "left", name: "Left", position: { row: 0, col: 0 }, widthFraction: 0.33, heightUnits: 2 },
      { id: "center", name: "Center", position: { row: 0, col: 1 }, widthFraction: 0.34, heightUnits: 2 },
      { id: "right", name: "Right", position: { row: 0, col: 2 }, widthFraction: 0.33, heightUnits: 2 }
    ]
  },
  {
    slug: "carrier-1u-2col",
    model: "Carrier (1U, 2 Column)",
    heightU: 1,
    category: "shelf",
    subdeviceRole: "parent",
    slots: [
      { id: "col-1", name: "Column 1", position: { row: 0, col: 0 }, widthFraction: 0.5, heightUnits: 1 },
      { id: "col-2", name: "Column 2", position: { row: 0, col: 1 }, widthFraction: 0.5, heightUnits: 1 }
    ]
  },
  {
    slug: "carrier-1u-2x2",
    model: "Carrier (1U, 2x2)",
    heightU: 1,
    category: "shelf",
    subdeviceRole: "parent",
    slots: [
      { id: "r0-c0", name: "Bottom Left", position: { row: 0, col: 0 }, widthFraction: 0.5, heightUnits: 0.5 },
      { id: "r0-c1", name: "Bottom Right", position: { row: 0, col: 1 }, widthFraction: 0.5, heightUnits: 0.5 },
      { id: "r1-c0", name: "Top Left", position: { row: 1, col: 0 }, widthFraction: 0.5, heightUnits: 0.5 },
      { id: "r1-c1", name: "Top Right", position: { row: 1, col: 1 }, widthFraction: 0.5, heightUnits: 0.5 }
    ]
  },
  {
    slug: "carrier-k79-2x2",
    model: "K-79 Mounting Kit",
    heightU: 1,
    category: "shelf",
    subdeviceRole: "parent",
    slots: [
      { id: "r0-c0", name: "Bottom Left", position: { row: 0, col: 0 }, widthFraction: 0.5, heightUnits: 0.5 },
      { id: "r0-c1", name: "Bottom Right", position: { row: 0, col: 1 }, widthFraction: 0.5, heightUnits: 0.5 },
      { id: "r1-c0", name: "Top Left", position: { row: 1, col: 0 }, widthFraction: 0.5, heightUnits: 0.5 },
      { id: "r1-c1", name: "Top Right", position: { row: 1, col: 1 }, widthFraction: 0.5, heightUnits: 0.5 }
    ]
  },
  {
    slug: "carrier-av-tray-2col",
    model: "AV Joining Tray (2 Column)",
    heightU: 1,
    category: "shelf",
    subdeviceRole: "parent",
    slots: [
      { id: "col-1", name: "Left", position: { row: 0, col: 0 }, widthFraction: 0.5 },
      { id: "col-2", name: "Right", position: { row: 0, col: 1 }, widthFraction: 0.5 }
    ]
  },
  { slug: "generic-mini-pc", model: "Mini PC", heightU: 1, category: "server", slotWidth: 1, fullDepth: false },
  {
    slug: "blade-chassis-4u",
    model: "Blade Chassis (4-Bay)",
    heightU: 4,
    category: "chassis",
    subdeviceRole: "parent",
    slots: [
      { id: "bay-1", name: "Bay 1", position: { row: 0, col: 0 }, widthFraction: 0.5, heightUnits: 2, accepts: ["server"] },
      { id: "bay-2", name: "Bay 2", position: { row: 0, col: 1 }, widthFraction: 0.5, heightUnits: 2, accepts: ["server"] },
      { id: "bay-3", name: "Bay 3", position: { row: 1, col: 0 }, widthFraction: 0.5, heightUnits: 2, accepts: ["server"] },
      { id: "bay-4", name: "Bay 4", position: { row: 1, col: 1 }, widthFraction: 0.5, heightUnits: 2, accepts: ["server"] }
    ]
  },
  {
    slug: "blade-chassis-7u",
    model: "Blade Chassis (8-Bay)",
    heightU: 7,
    category: "chassis",
    subdeviceRole: "parent",
    slots: [
      { id: "bay-1", name: "Bay 1", position: { row: 0, col: 0 }, widthFraction: 0.25, heightUnits: 7, accepts: ["server"] },
      { id: "bay-2", name: "Bay 2", position: { row: 0, col: 1 }, widthFraction: 0.25, heightUnits: 7, accepts: ["server"] },
      { id: "bay-3", name: "Bay 3", position: { row: 0, col: 2 }, widthFraction: 0.25, heightUnits: 7, accepts: ["server"] },
      { id: "bay-4", name: "Bay 4", position: { row: 0, col: 3 }, widthFraction: 0.25, heightUnits: 7, accepts: ["server"] }
    ]
  },
  { slug: "blade-server-half", model: "Blade Server (Half-Height)", heightU: 2, category: "server", subdeviceRole: "child", slotWidth: 1, fullDepth: false },
  { slug: "blade-server-full", model: "Blade Server (Full-Height)", heightU: 4, category: "server", subdeviceRole: "child", slotWidth: 1, fullDepth: false },
  { slug: "0-5u-blank", model: "Blank Panel", heightU: 0.5, category: "blank", fullDepth: false },
  { slug: "1u-blank", model: "Blank Panel", heightU: 1, category: "blank", fullDepth: false },
  { slug: "2u-blank", model: "Blank Panel", heightU: 2, category: "blank", fullDepth: false },
  { slug: "3u-blank", model: "Blank Panel", heightU: 3, category: "blank", fullDepth: false },
  { slug: "4u-blank", model: "Blank Panel", heightU: 4, category: "blank", fullDepth: false },
  { slug: "1u-brush-panel", model: "Brush Panel", heightU: 1, category: "cable-management", fullDepth: false },
  { slug: "1u-cable-manager", model: "Cable Manager", heightU: 1, category: "cable-management", fullDepth: false },
  { slug: "2u-cable-manager", model: "Cable Manager", heightU: 2, category: "cable-management", fullDepth: false },
  { slug: "1u-half-blank", model: "Half Blank Panel", heightU: 1, category: "blank", fullDepth: false, slotWidth: 1 },
  { slug: "2u-half-blank", model: "Half Blank Panel", heightU: 2, category: "blank", fullDepth: false, slotWidth: 1 },
  { slug: "1u-half-shelf", model: "Half Shelf", heightU: 1, category: "shelf", fullDepth: false, slotWidth: 1 },
  { slug: "1u-half-patch-panel", model: "Half Patch Panel", heightU: 1, category: "patch-panel", fullDepth: false, slotWidth: 1 },
  { slug: "1u-half-switch", model: "Half Switch (8-Port)", heightU: 1, category: "network", fullDepth: false, slotWidth: 1 },
  { slug: "1u-half-brush-panel", model: "Half Brush Panel", heightU: 1, category: "cable-management", fullDepth: false, slotWidth: 1 },
  { slug: "1u-mini-ups", model: "Mini UPS", heightU: 1, category: "power", fullDepth: false, slotWidth: 1 },
  { slug: "1u-half-fan", model: "Half Fan Panel", heightU: 1, category: "cooling", fullDepth: false, slotWidth: 1 }
];

export const rackulaGenericDeviceTypes: RackulaDeviceTemplate[] = rackulaStarterDeviceSpecs.map((spec) => ({
  ...spec,
  fullDepth: spec.fullDepth ?? true,
  slotWidth: spec.slotWidth ?? 2,
  color: rackulaCategoryColors[spec.category]
}));

export function findRackulaDeviceTemplate(slug: string) {
  return rackulaGenericDeviceTypes.find((device) => device.slug === slug);
}

export function rackulaCategoryToTraceDeviceType(category: RackulaDeviceCategory) {
  if (category === "server") return "SERVER";
  if (category === "firewall") return "FIREWALL";
  if (category === "patch-panel") return "PATCH_PANEL";
  return "OTHER";
}
