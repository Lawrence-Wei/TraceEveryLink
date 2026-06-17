export type CiscoPanelGroup = {
  id: string;
  label: string;
  columns: number;
  rows: number;
  bankSize?: number;
  selector: "downlink" | "uplink";
};

export type CiscoRouterPanelGroup = {
  id: string;
  label: string;
  columns?: number;
  portNames?: string[];
  slotLabels?: string[];
};

export type CiscoDeviceTemplate = {
  sku: string;
  aliases?: string[];
  kind?: "switch" | "router";
  family: string;
  title: string;
  sourceLabel: string;
  sourceUrl: string;
  officialImageUrl?: string;
  officialImageAlt?: string;
  downlinkPorts: number;
  downlinkDescription: string;
  uplinkDescription: string;
  panelGroups: CiscoPanelGroup[];
  routerGroups?: CiscoRouterPanelGroup[];
};

export const ciscoDeviceTemplates: CiscoDeviceTemplate[] = [
  {
    sku: "CISCO1941/K9",
    aliases: ["CISCO1941", "C1941", "1941", "CISCO1900", "C1900", "1900", "Cisco 1900 Series"],
    kind: "router",
    family: "Cisco 1900 ISR G2",
    title: "Cisco 1941 Integrated Services Router",
    sourceLabel: "Cisco 1900 Series Integrated Services Routers Data Sheet",
    sourceUrl:
      "https://www.cisco.com/c/en/us/products/collateral/routers/1900-series-integrated-services-routers-isr/data_sheet_c78_556319.html",
    downlinkPorts: 2,
    downlinkDescription: "2 x integrated Gigabit Ethernet routed ports",
    uplinkDescription: "EHWIC / ISM expansion slots",
    panelGroups: [],
    routerGroups: [
      { id: "control", label: "Console / AUX / USB", columns: 4, slotLabels: ["CON", "AUX", "USB", "USB"] },
      { id: "ports", label: "Integrated GE routed ports", columns: 2, portNames: ["Gi0/0", "Gi0/1"] },
      { id: "modules", label: "Expansion slots", columns: 3, slotLabels: ["EHWIC 0", "EHWIC 1", "ISM"] }
    ]
  },
  {
    sku: "CISCO2811/K9",
    aliases: ["CISCO2811", "C2811", "2811", "CISCO2800", "C2800", "2800", "Cisco 2800 Series"],
    kind: "router",
    family: "Cisco 2800 ISR",
    title: "Cisco 2811 Integrated Services Router",
    sourceLabel: "Cisco 2800 Series Integrated Services Routers Data Sheet",
    sourceUrl:
      "https://www.cisco.com/c/dam/global/it_it/solutions/small-business/pdf/net_found/isr_2800ds-en.pdf",
    downlinkPorts: 2,
    downlinkDescription: "2 x integrated Fast Ethernet routed ports",
    uplinkDescription: "WIC / HWIC / network module expansion",
    panelGroups: [],
    routerGroups: [
      { id: "control", label: "Console / AUX / USB", columns: 4, slotLabels: ["CON", "AUX", "USB 0", "USB 1"] },
      { id: "ports", label: "Integrated FE routed ports", columns: 2, portNames: ["Fa0/0", "Fa0/1"] },
      { id: "modules", label: "Expansion slots", columns: 4, slotLabels: ["WIC 0", "WIC 1", "HWIC 0", "NME"] }
    ]
  },
  {
    sku: "CISCO2911/K9",
    aliases: ["CISCO2911", "C2911", "2911", "ISR2911"],
    kind: "router",
    family: "Cisco 2900 ISR G2",
    title: "Cisco 2911 Integrated Services Router",
    sourceLabel: "Cisco 2900 Series Integrated Services Routers Data Sheet",
    sourceUrl:
      "https://www.cisco.com/c/en/us/products/collateral/routers/2900-series-integrated-services-routers-isr/data_sheet_c78_553896.html",
    downlinkPorts: 3,
    downlinkDescription: "3 x integrated Gigabit Ethernet routed ports",
    uplinkDescription: "EHWIC / service module slots",
    panelGroups: [],
    routerGroups: [
      { id: "control", label: "Console / USB / AUX", columns: 4, slotLabels: ["CON", "AUX", "USB", "USB"] },
      { id: "ports", label: "Integrated GE routed ports", columns: 3, portNames: ["Gi0/0", "Gi0/1", "Gi0/2"] },
      { id: "modules", label: "Expansion slots", columns: 5, slotLabels: ["EHWIC 0", "EHWIC 1", "EHWIC 2", "EHWIC 3", "SM"] }
    ]
  },
  {
    sku: "IR1821-K9",
    aliases: ["C1821", "1821", "IR1821", "CISCO1821"],
    kind: "router",
    family: "Cisco Catalyst IR1800 Rugged",
    title: "Cisco Catalyst IR1821 Rugged Router",
    sourceLabel: "Cisco Catalyst IR1800 Rugged Series Routers",
    sourceUrl:
      "https://www.cisco.com/c/en/us/products/collateral/routers/catalyst-ir1800-rugged-series-routers/nb-06-cat-ir1800-rugged-ser-rout-ds-cte-en.html",
    downlinkPorts: 5,
    downlinkDescription: "4 x GE LAN and 1 x combo GE WAN routed ports",
    uplinkDescription: "Pluggable cellular / Wi-Fi / SSD slots",
    panelGroups: [],
    routerGroups: [
      { id: "control", label: "Console / Power", columns: 3, slotLabels: ["PWR", "USB-C", "CON"] },
      { id: "lan", label: "GE LAN", columns: 4, portNames: ["Gi0/1/0", "Gi0/1/1", "Gi0/1/2", "Gi0/1/3"] },
      { id: "wan", label: "Combo GE WAN", columns: 1, portNames: ["Gi0/0/0"] },
      { id: "modules", label: "Rugged modules", columns: 4, slotLabels: ["CELL 0", "CELL 1", "Wi-Fi", "SSD/GNSS"] }
    ]
  },
  {
    sku: "ISR4331/K9",
    aliases: ["ISR4331", "C4331", "4331"],
    kind: "router",
    family: "Cisco 4000 ISR",
    title: "Cisco ISR 4331 Integrated Services Router",
    sourceLabel: "Cisco 4000 Family Integrated Services Router Data Sheet",
    sourceUrl:
      "https://www.cisco.com/c/en/us/products/collateral/routers/4000-series-integrated-services-routers-isr/data_sheet-c78-732542.html",
    downlinkPorts: 3,
    downlinkDescription: "3 onboard GE WAN/LAN ports",
    uplinkDescription: "2 NIM slots and 1 SM slot",
    panelGroups: [],
    routerGroups: [
      { id: "control", label: "Console / Mgmt / USB", columns: 5, slotLabels: ["USB-B", "CON", "AUX", "USB-A", "MGMT"] },
      { id: "ports", label: "Onboard GE WAN/LAN", columns: 3, portNames: ["Gi0/0/0", "Gi0/0/1", "Gi0/0/2"] },
      { id: "modules", label: "Modules", columns: 3, slotLabels: ["NIM 0", "NIM 1", "SM"] }
    ]
  },
  {
    sku: "C8200-1N-4T",
    aliases: ["C8200", "C8200L-1N-4T", "8200"],
    kind: "router",
    family: "Cisco Catalyst 8200 Edge",
    title: "Cisco Catalyst 8200 Series Edge Platform",
    sourceLabel: "Cisco Catalyst 8200 Series Edge Platforms Data Sheet",
    sourceUrl:
      "https://www.cisco.com/c/en/us/products/collateral/routers/catalyst-8200-series-edge-platforms/nb-06-cat8200-series-edge-plat-ds-cte-en.html",
    downlinkPorts: 4,
    downlinkDescription: "4 embedded Layer 3 Ethernet ports",
    uplinkDescription: "NIM / PIM expansion",
    panelGroups: [],
    routerGroups: [
      { id: "control", label: "Console / USB / Mgmt", columns: 4, slotLabels: ["CON", "USB", "MGMT", "RFID"] },
      { id: "ports", label: "Embedded L3 ports", columns: 4, portNames: ["Gi0/0/0", "Gi0/0/1", "Gi0/0/2", "Gi0/0/3"] },
      { id: "modules", label: "Expansion", columns: 2, slotLabels: ["NIM", "PIM"] }
    ]
  },
  {
    sku: "C8300-1N1S-4T2X",
    aliases: ["C8300", "C8300-4T2X", "8300"],
    kind: "router",
    family: "Cisco Catalyst 8300 Edge",
    title: "Cisco Catalyst 8300 Series Edge Platform",
    sourceLabel: "Cisco Catalyst 8300 Series Edge Platforms Data Sheet",
    sourceUrl:
      "https://www.cisco.com/c/en/us/products/collateral/routers/catalyst-8300-series-edge-platforms/datasheet-c78-744088.html",
    downlinkPorts: 6,
    downlinkDescription: "4 x 1G and 2 x 10G embedded Layer 3 Ethernet ports",
    uplinkDescription: "NIM / SM expansion",
    panelGroups: [],
    routerGroups: [
      { id: "control", label: "Console / USB / Mgmt", columns: 4, slotLabels: ["CON", "USB", "MGMT", "RFID"] },
      { id: "ports1g", label: "1G routed ports", columns: 4, portNames: ["Gi0/0/0", "Gi0/0/1", "Gi0/0/2", "Gi0/0/3"] },
      { id: "ports10g", label: "10G routed ports", columns: 2, portNames: ["Te0/0/4", "Te0/0/5"] },
      { id: "modules", label: "Expansion", columns: 2, slotLabels: ["NIM", "SM"] }
    ]
  },
  {
    sku: "WS-C2960-48TT-L",
    aliases: ["C2960-48TT", "WS-C2960-48"],
    family: "Catalyst 2960",
    title: "Cisco Catalyst 2960 48-port Fast Ethernet with 2 Gigabit uplinks",
    sourceLabel: "Cisco Catalyst 2960 Hardware Installation Guide",
    sourceUrl:
      "https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst2960/hardware/installation/guide/2960_hg/higover.html",
    downlinkPorts: 48,
    downlinkDescription: "48 x 10/100 Fast Ethernet ports",
    uplinkDescription: "2 x 10/100/1000 uplink ports",
    panelGroups: [
      { id: "downlinks", label: "10/100 downlinks", columns: 6, rows: 2, bankSize: 12, selector: "downlink" },
      { id: "uplinks", label: "Gigabit uplinks", columns: 2, rows: 1, selector: "uplink" }
    ]
  },
  {
    sku: "WS-C2960-24TT-L",
    aliases: ["C2960-24TT", "WS-C2960-24"],
    family: "Catalyst 2960",
    title: "Cisco Catalyst 2960 24-port Fast Ethernet with 2 Gigabit uplinks",
    sourceLabel: "Cisco Catalyst 2960 Hardware Installation Guide",
    sourceUrl:
      "https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst2960/hardware/installation/guide/2960_hg/higover.html",
    downlinkPorts: 24,
    downlinkDescription: "24 x 10/100 Fast Ethernet ports",
    uplinkDescription: "2 x 10/100/1000 uplink ports",
    panelGroups: [
      { id: "downlinks", label: "10/100 downlinks", columns: 6, rows: 2, bankSize: 12, selector: "downlink" },
      { id: "uplinks", label: "Gigabit uplinks", columns: 2, rows: 1, selector: "uplink" }
    ]
  },
  {
    sku: "WS-C2960X-48FPS-L",
    aliases: ["C2960X-48", "WS-C2960X-48"],
    family: "Catalyst 2960-X",
    title: "Cisco Catalyst 2960-X 48-port Gigabit PoE+",
    sourceLabel: "Cisco Catalyst 2960-X Series Data Sheet",
    sourceUrl:
      "https://www.cisco.com/c/en/us/products/collateral/switches/catalyst-2960-x-series-switches/data_sheet_c78-728232.html",
    downlinkPorts: 48,
    downlinkDescription: "48 x 10/100/1000 PoE+ downlink ports",
    uplinkDescription: "4 fixed uplink ports",
    panelGroups: [
      { id: "downlinks", label: "1G PoE+ downlinks", columns: 6, rows: 2, bankSize: 12, selector: "downlink" },
      { id: "uplinks", label: "Fixed uplinks", columns: 4, rows: 1, selector: "uplink" }
    ]
  },
  {
    sku: "WS-C2960X-24PS-L",
    aliases: ["C2960X-24", "WS-C2960X-24"],
    family: "Catalyst 2960-X",
    title: "Cisco Catalyst 2960-X 24-port Gigabit PoE+",
    sourceLabel: "Cisco Catalyst 2960-X Series Data Sheet",
    sourceUrl:
      "https://www.cisco.com/c/en/us/products/collateral/switches/catalyst-2960-x-series-switches/data_sheet_c78-728232.html",
    downlinkPorts: 24,
    downlinkDescription: "24 x 10/100/1000 PoE+ downlink ports",
    uplinkDescription: "4 fixed uplink ports",
    panelGroups: [
      { id: "downlinks", label: "1G PoE+ downlinks", columns: 6, rows: 2, bankSize: 12, selector: "downlink" },
      { id: "uplinks", label: "Fixed uplinks", columns: 4, rows: 1, selector: "uplink" }
    ]
  },
  {
    sku: "WS-C3560-48PS-S",
    aliases: ["C3560-48PS", "WS-C3560-48", "C3560-48", "Catalyst 3560 Series PoE-48", "3560 PoE-48"],
    family: "Catalyst 3560",
    title: "Cisco Catalyst 3560 48-port 10/100 PoE with 4 SFP uplinks",
    sourceLabel: "Cisco Catalyst 3560 Series Switches Hardware View",
    sourceUrl: "https://www.cisco.com/web/ANZ/cpp/refguide/hview/switch/3560.html",
    downlinkPorts: 48,
    downlinkDescription: "48 x 10/100 PoE downlink ports",
    uplinkDescription: "4 x SFP-based Gigabit Ethernet ports",
    panelGroups: [
      { id: "downlinks", label: "10/100 PoE downlinks", columns: 6, rows: 2, bankSize: 12, selector: "downlink" },
      { id: "uplinks", label: "SFP uplinks", columns: 4, rows: 1, selector: "uplink" }
    ]
  },
  {
    sku: "WS-C3560G-48TS-S",
    aliases: ["C3560G-48TS", "WS-C3560G-48", "C3560G-48", "Catalyst 3560G Series", "3560G"],
    family: "Catalyst 3560G",
    title: "Cisco Catalyst 3560G 48-port Gigabit with 4 SFP uplinks",
    sourceLabel: "Cisco Catalyst 3560 Series Switches Hardware View",
    sourceUrl: "https://www.cisco.com/web/ANZ/cpp/refguide/hview/switch/3560.html",
    downlinkPorts: 48,
    downlinkDescription: "48 x 10/100/1000 downlink ports",
    uplinkDescription: "4 x SFP-based Gigabit Ethernet ports",
    panelGroups: [
      { id: "downlinks", label: "1G downlinks", columns: 6, rows: 2, bankSize: 12, selector: "downlink" },
      { id: "uplinks", label: "SFP uplinks", columns: 4, rows: 1, selector: "uplink" }
    ]
  },
  {
    sku: "WS-C3560E-48TD-S",
    aliases: ["C3560E-48TD", "WS-C3560E-48", "C3560E-48"],
    family: "Catalyst 3560-E",
    title: "Cisco Catalyst 3560-E 48-port Gigabit with 2 x 10G uplinks",
    sourceLabel: "Cisco Catalyst 3750-E and 3560-E Release Notes",
    sourceUrl:
      "https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst3750e_3560e/software/release/12-2_53_se/release/notes/OL21139.html",
    downlinkPorts: 48,
    downlinkDescription: "48 x 10/100/1000 Ethernet ports",
    uplinkDescription: "2 x 10G X2 uplink slots",
    panelGroups: [
      { id: "downlinks", label: "1G downlinks", columns: 6, rows: 2, bankSize: 12, selector: "downlink" },
      { id: "uplinks", label: "10G uplinks", columns: 2, rows: 1, selector: "uplink" }
    ]
  },
  {
    sku: "WS-C3560E-24TD-S",
    aliases: ["C3560E-24TD", "WS-C3560E-24", "C3560E-24"],
    family: "Catalyst 3560-E",
    title: "Cisco Catalyst 3560-E 24-port Gigabit with 2 x 10G uplinks",
    sourceLabel: "Cisco Catalyst 3750-E and 3560-E Release Notes",
    sourceUrl:
      "https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst3750e_3560e/software/release/12-2_53_se/release/notes/OL21139.html",
    downlinkPorts: 24,
    downlinkDescription: "24 x 10/100/1000 Ethernet ports",
    uplinkDescription: "2 x 10G X2 uplink slots",
    panelGroups: [
      { id: "downlinks", label: "1G downlinks", columns: 6, rows: 2, bankSize: 12, selector: "downlink" },
      { id: "uplinks", label: "10G uplinks", columns: 2, rows: 1, selector: "uplink" }
    ]
  },
  {
    sku: "WS-C3750E-48TD-S",
    aliases: ["C3750E-48TD", "WS-C3750E-48", "C3750E-48"],
    family: "Catalyst 3750-E",
    title: "Cisco Catalyst 3750-E 48-port Gigabit with 2 x 10G uplinks",
    sourceLabel: "Cisco Catalyst 3750-E and 3560-E Release Notes",
    sourceUrl:
      "https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst3750e_3560e/software/release/12-2_53_se/release/notes/OL21139.html",
    downlinkPorts: 48,
    downlinkDescription: "48 x 10/100/1000 Ethernet ports",
    uplinkDescription: "2 x 10G X2 uplink slots",
    panelGroups: [
      { id: "downlinks", label: "1G downlinks", columns: 6, rows: 2, bankSize: 12, selector: "downlink" },
      { id: "uplinks", label: "10G uplinks", columns: 2, rows: 1, selector: "uplink" }
    ]
  },
  {
    sku: "WS-C3750E-24TD-S",
    aliases: ["C3750E-24TD", "WS-C3750E-24", "C3750E-24"],
    family: "Catalyst 3750-E",
    title: "Cisco Catalyst 3750-E 24-port Gigabit with 2 x 10G uplinks",
    sourceLabel: "Cisco Catalyst 3750-E and 3560-E Release Notes",
    sourceUrl:
      "https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst3750e_3560e/software/release/12-2_53_se/release/notes/OL21139.html",
    downlinkPorts: 24,
    downlinkDescription: "24 x 10/100/1000 Ethernet ports",
    uplinkDescription: "2 x 10G X2 uplink slots",
    panelGroups: [
      { id: "downlinks", label: "1G downlinks", columns: 6, rows: 2, bankSize: 12, selector: "downlink" },
      { id: "uplinks", label: "10G uplinks", columns: 2, rows: 1, selector: "uplink" }
    ]
  },
  {
    sku: "WS-C3560X-48P-S",
    aliases: ["C3560X-48", "WS-C3560X-48"],
    family: "Catalyst 3560-X",
    title: "Cisco Catalyst 3560-X 48-port Gigabit PoE+",
    sourceLabel: "Cisco Catalyst 3750-X and 3560-X Release Notes",
    sourceUrl:
      "https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst3750x_3560x/software/release/15-0_2a_se6/release/notes/OL25302.html",
    downlinkPorts: 48,
    downlinkDescription: "48 x 10/100/1000 PoE+ downlink ports",
    uplinkDescription: "Network module slots",
    panelGroups: [
      { id: "downlinks", label: "1G PoE+ downlinks", columns: 6, rows: 2, bankSize: 12, selector: "downlink" },
      { id: "uplinks", label: "Network module", columns: 4, rows: 1, selector: "uplink" }
    ]
  },
  {
    sku: "WS-C3750X-48P-S",
    aliases: ["C3750X-48", "WS-C3750X-48"],
    family: "Catalyst 3750-X",
    title: "Cisco Catalyst 3750-X 48-port Gigabit PoE+",
    sourceLabel: "Cisco Catalyst 3750-X and 3560-X Release Notes",
    sourceUrl:
      "https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst3750x_3560x/software/release/15-0_2a_se6/release/notes/OL25302.html",
    downlinkPorts: 48,
    downlinkDescription: "48 x 10/100/1000 PoE+ downlink ports",
    uplinkDescription: "Network module slots",
    panelGroups: [
      { id: "downlinks", label: "1G PoE+ downlinks", columns: 6, rows: 2, bankSize: 12, selector: "downlink" },
      { id: "uplinks", label: "Network module", columns: 4, rows: 1, selector: "uplink" }
    ]
  },
  {
    sku: "WS-C3650-48PS-S",
    aliases: ["C3650-48", "WS-C3650-48"],
    family: "Catalyst 3650",
    title: "Cisco Catalyst 3650 48-port Gigabit PoE+",
    sourceLabel: "Cisco Catalyst 3650 Hardware Installation Guide",
    sourceUrl:
      "https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst3650/hardware/installation/guide/Cat3650hig_book/HIGOVERV.html",
    downlinkPorts: 48,
    downlinkDescription: "48 x 10/100/1000 PoE+ downlink ports",
    uplinkDescription: "4 uplink ports",
    panelGroups: [
      { id: "downlinks", label: "1G PoE+ downlinks", columns: 6, rows: 2, bankSize: 12, selector: "downlink" },
      { id: "uplinks", label: "Uplinks", columns: 4, rows: 1, selector: "uplink" }
    ]
  },
  {
    sku: "WS-C3650-24PS-S",
    aliases: ["C3650-24", "WS-C3650-24"],
    family: "Catalyst 3650",
    title: "Cisco Catalyst 3650 24-port Gigabit PoE+",
    sourceLabel: "Cisco Catalyst 3650 Hardware Installation Guide",
    sourceUrl:
      "https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst3650/hardware/installation/guide/Cat3650hig_book/HIGOVERV.html",
    downlinkPorts: 24,
    downlinkDescription: "24 x 10/100/1000 PoE+ downlink ports",
    uplinkDescription: "4 uplink ports",
    panelGroups: [
      { id: "downlinks", label: "1G PoE+ downlinks", columns: 6, rows: 2, bankSize: 12, selector: "downlink" },
      { id: "uplinks", label: "Uplinks", columns: 4, rows: 1, selector: "uplink" }
    ]
  },
  {
    sku: "WS-C3850-48P-S",
    aliases: ["C3850-48", "WS-C3850-48"],
    family: "Catalyst 3850",
    title: "Cisco Catalyst 3850 48-port Gigabit PoE+",
    sourceLabel: "Cisco Catalyst 3850 Hardware Installation Guide",
    sourceUrl:
      "https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst3850/hardware/installation/guide/b_c3850_hig/b_c3850_hig_chapter_01.html",
    downlinkPorts: 48,
    downlinkDescription: "48 x 10/100/1000 PoE+ downlink ports",
    uplinkDescription: "Network module slots",
    panelGroups: [
      { id: "downlinks", label: "1G PoE+ downlinks", columns: 6, rows: 2, bankSize: 12, selector: "downlink" },
      { id: "uplinks", label: "Network module", columns: 4, rows: 1, selector: "uplink" }
    ]
  },
  {
    sku: "WS-C3850-24P-S",
    aliases: ["C3850-24", "WS-C3850-24"],
    family: "Catalyst 3850",
    title: "Cisco Catalyst 3850 24-port Gigabit PoE+",
    sourceLabel: "Cisco Catalyst 3850 Hardware Installation Guide",
    sourceUrl:
      "https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst3850/hardware/installation/guide/b_c3850_hig/b_c3850_hig_chapter_01.html",
    downlinkPorts: 24,
    downlinkDescription: "24 x 10/100/1000 PoE+ downlink ports",
    uplinkDescription: "Network module slots",
    panelGroups: [
      { id: "downlinks", label: "1G PoE+ downlinks", columns: 6, rows: 2, bankSize: 12, selector: "downlink" },
      { id: "uplinks", label: "Network module", columns: 4, rows: 1, selector: "uplink" }
    ]
  },
  {
    sku: "C9200L-48P-4G",
    aliases: ["C9200L-48", "C9200-48"],
    family: "Catalyst 9200",
    title: "Cisco Catalyst 9200L 48-port PoE+",
    sourceLabel: "Cisco Catalyst 9200 Hardware Installation Guide",
    sourceUrl:
      "https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9200/hardware/install/b-c9200-hig/product_overview.html",
    downlinkPorts: 48,
    downlinkDescription: "48 x 10/100/1000 PoE+ downlink ports",
    uplinkDescription: "4 x 1G/10G uplink ports",
    panelGroups: [
      { id: "downlinks", label: "1G PoE+ downlinks", columns: 6, rows: 2, bankSize: 12, selector: "downlink" },
      { id: "uplinks", label: "Fixed uplinks", columns: 4, rows: 1, selector: "uplink" }
    ]
  },
  {
    sku: "C9200L-24P-4G",
    aliases: ["C9200L-24", "C9200-24"],
    family: "Catalyst 9200",
    title: "Cisco Catalyst 9200L 24-port PoE+",
    sourceLabel: "Cisco Catalyst 9200 Hardware Installation Guide",
    sourceUrl:
      "https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9200/hardware/install/b-c9200-hig/product_overview.html",
    downlinkPorts: 24,
    downlinkDescription: "24 x 10/100/1000 PoE+ downlink ports",
    uplinkDescription: "4 x 1G/10G uplink ports",
    panelGroups: [
      { id: "downlinks", label: "1G PoE+ downlinks", columns: 6, rows: 2, bankSize: 12, selector: "downlink" },
      { id: "uplinks", label: "Fixed uplinks", columns: 4, rows: 1, selector: "uplink" }
    ]
  },
  {
    sku: "C9500-32C",
    aliases: ["C9500", "Catalyst 9500", "Catalyst 9500 Series", "C9500-32C-A", "C9500-32C-E"],
    family: "Catalyst 9500",
    title: "Cisco Catalyst 9500 High Performance 32-port 40G/100G QSFP28",
    sourceLabel: "Cisco Catalyst 9500 Hardware Installation Guide",
    sourceUrl:
      "https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9500/hardware/install/b_catalyst_9500_hig/9500_product-overview.html",
    officialImageUrl:
      "https://www.cisco.com/c/dam/en/us/td/i/300001-400000/350001-360000/356001-357000/356903.jpg",
    officialImageAlt: "Cisco Catalyst 9500 C9500-32C official front panel diagram",
    downlinkPorts: 32,
    downlinkDescription: "32 x 40G/100G QSFP28 ports",
    uplinkDescription: "Fixed 40G/100G QSFP28 front-panel ports",
    panelGroups: [
      { id: "downlinks", label: "QSFP28 ports", columns: 4, rows: 2, bankSize: 8, selector: "downlink" },
      { id: "uplinks", label: "Fixed QSFP28", columns: 1, rows: 1, selector: "uplink" }
    ]
  },
  {
    sku: "C9300-48P",
    aliases: ["C9300-48"],
    family: "Catalyst 9300",
    title: "Cisco Catalyst 9300 48-port PoE+",
    sourceLabel: "Cisco Catalyst 9300 Hardware Installation Guide",
    sourceUrl:
      "https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/hardware/install/b_c9300_hig/Product-overview.html",
    downlinkPorts: 48,
    downlinkDescription: "48 x 10/100/1000 PoE+ downlink ports",
    uplinkDescription: "Network module slots",
    panelGroups: [
      { id: "downlinks", label: "1G PoE+ downlinks", columns: 6, rows: 2, bankSize: 12, selector: "downlink" },
      { id: "uplinks", label: "Uplink module", columns: 4, rows: 1, selector: "uplink" }
    ]
  },
  {
    sku: "C9300L-48P-4X",
    aliases: ["C9300L-48", "C9300-48X"],
    family: "Catalyst 9300L",
    title: "Cisco Catalyst 9300L 48-port PoE+ with 4x 10G fixed uplinks",
    sourceLabel: "Cisco Catalyst 9300 Hardware Installation Guide",
    sourceUrl:
      "https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/hardware/install/b_c9300_hig/Product-overview.html",
    downlinkPorts: 48,
    downlinkDescription: "48 x 10/100/1000 PoE+ downlink ports",
    uplinkDescription: "4 fixed uplink ports",
    panelGroups: [
      { id: "downlinks", label: "1G PoE+ downlinks", columns: 6, rows: 2, bankSize: 12, selector: "downlink" },
      { id: "uplinks", label: "Fixed uplinks", columns: 4, rows: 1, selector: "uplink" }
    ]
  }
];

export function getCiscoDeviceTemplate(input: { vendor?: string | null; model?: string | null; name?: string | null }) {
  const text = `${input.vendor || ""} ${input.model || ""} ${input.name || ""}`.toUpperCase();
  return ciscoDeviceTemplates.find((template) =>
    [template.sku, ...(template.aliases || [])].some((value) => text.includes(value.toUpperCase()))
  ) || null;
}

export function getCiscoPortNumber(portName: string) {
  const match = portName.match(/^(Gi|GigabitEthernet|Te|TenGigabitEthernet|Twe|TwentyFiveGigE|Fo|FortyGigabitEthernet|Hu|HundredGigE|Fa|FastEthernet|Eth|Ethernet)(\d+)\/(\d+)\/(\d+)$/i);
  if (match) {
    return {
      prefix: match[1],
      stack: Number(match[2]),
      module: Number(match[3]),
      port: Number(match[4]),
      parts: 3
    };
  }

  const twoPartMatch = portName.match(/^(Gi|GigabitEthernet|Te|TenGigabitEthernet|Twe|TwentyFiveGigE|Fo|FortyGigabitEthernet|Hu|HundredGigE|Fa|FastEthernet|Eth|Ethernet)(\d+)\/(\d+)$/i);
  if (!twoPartMatch) return null;
  return {
    prefix: twoPartMatch[1],
    stack: Number(twoPartMatch[2]),
    module: 0,
    port: Number(twoPartMatch[3]),
    parts: 2
  };
}

export function isCiscoDownlinkPort(portName: string) {
  const parsed = getCiscoPortNumber(portName);
  if (!parsed) return false;
  if (parsed.parts === 2) return /^(Fa|FastEthernet)/i.test(parsed.prefix);
  return parsed.module === 0;
}

export function isCiscoUplinkPort(portName: string) {
  const parsed = getCiscoPortNumber(portName);
  if (!parsed) return false;
  if (parsed.parts === 2) return /^(Gi|GigabitEthernet|Te|TenGigabitEthernet|Twe|TwentyFiveGigE|Fo|FortyGigabitEthernet|Hu|HundredGigE)/i.test(parsed.prefix);
  return parsed.module > 0;
}

export function formatCiscoPortShortName(portName: string) {
  const parsed = getCiscoPortNumber(portName);
  if (!parsed) return portName.replace(/^(Gi|Te|Eth)/i, "");
  if (parsed.parts === 2) return `${getCiscoPortDisplayPrefix(portName)}${parsed.stack}/${parsed.port}`;
  return `${getCiscoPortDisplayPrefix(portName)}${parsed.stack}/${parsed.module}/${parsed.port}`;
}

function getCiscoPortDisplayPrefix(portName: string) {
  const value = portName.trim();
  if (/^(Gi|GigabitEthernet)/i.test(value)) return "G";
  if (/^(Te|TenGigabitEthernet)/i.test(value)) return "Te";
  if (/^(Twe|TwentyFiveGigE)/i.test(value)) return "Twe";
  if (/^(Fo|FortyGigabitEthernet)/i.test(value)) return "Fo";
  if (/^(Hu|HundredGigE)/i.test(value)) return "Hu";
  if (/^(Fa|FastEthernet)/i.test(value)) return "Fa";
  if (/^(Eth|Ethernet)/i.test(value)) return "Eth";
  return "";
}

export function sortCiscoPhysicalPorts<T extends { name: string; portNumber?: number | null }>(ports: T[]) {
  const sorted = [...ports].sort((a, b) => {
    const aNumber = getCiscoPortNumber(a.name)?.port ?? a.portNumber ?? 0;
    const bNumber = getCiscoPortNumber(b.name)?.port ?? b.portNumber ?? 0;
    return aNumber - bNumber || a.name.localeCompare(b.name);
  });

  const topRow = sorted.filter((port) => {
    const number = getCiscoPortNumber(port.name)?.port ?? port.portNumber ?? 0;
    return number % 2 === 1;
  });
  const bottomRow = sorted.filter((port) => {
    const number = getCiscoPortNumber(port.name)?.port ?? port.portNumber ?? 0;
    return number % 2 === 0;
  });

  return [...topRow, ...bottomRow];
}

export function sortCiscoPortsLeftToRight<T extends { name: string; portNumber?: number | null }>(ports: T[]) {
  return [...ports].sort((a, b) => {
    const aNumber = getCiscoPortNumber(a.name)?.port ?? a.portNumber ?? 0;
    const bNumber = getCiscoPortNumber(b.name)?.port ?? b.portNumber ?? 0;
    return aNumber - bNumber || a.name.localeCompare(b.name);
  });
}

export function groupCiscoPortsByBank<T extends { name: string; portNumber?: number | null }>(
  ports: T[],
  bankSize = 12
) {
  const banks = new Map<number, T[]>();
  for (const port of ports) {
    const portNumber = getCiscoPortNumber(port.name)?.port ?? port.portNumber ?? 0;
    if (!portNumber) continue;
    const bankIndex = Math.floor((portNumber - 1) / bankSize);
    banks.set(bankIndex, [...(banks.get(bankIndex) || []), port]);
  }

  return [...banks.entries()]
    .sort(([a], [b]) => a - b)
    .map(([bankIndex, bankPorts]) => {
      const start = bankIndex * bankSize + 1;
      const end = start + bankSize - 1;
      return {
        id: `${start}-${end}`,
        label: `${start}-${end}`,
        start,
        end,
        ports: sortCiscoPhysicalPorts(bankPorts)
      };
    });
}
