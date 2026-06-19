import { describe, expect, it } from "vitest";
import {
  formatCiscoPortShortName,
  getCiscoDeviceTemplate,
  groupCiscoPortsByBank,
  isCiscoDownlinkPort,
  isCiscoUplinkPort,
  sortCiscoPortsLeftToRight,
  sortCiscoPhysicalPorts
} from "@/shared/cisco-catalog";

describe("cisco catalog", () => {
  it("matches concrete Catalyst 9300 SKUs", () => {
    expect(getCiscoDeviceTemplate({ vendor: "Cisco", model: "C9300-48P", name: "Access switch" })?.sku).toBe(
      "C9300-48P"
    );
    expect(getCiscoDeviceTemplate({ vendor: "Cisco", model: "WS-C2960-48TT-L", name: "Legacy access" })?.sku).toBe(
      "WS-C2960-48TT-L"
    );
    expect(getCiscoDeviceTemplate({ vendor: "Cisco", model: "WS-C3650-48PS-S", name: "Access switch" })?.sku).toBe(
      "WS-C3650-48PS-S"
    );
    expect(getCiscoDeviceTemplate({ vendor: "Cisco", model: "WS-C3750E-48TD-S", name: "Distribution switch" })?.sku).toBe(
      "WS-C3750E-48TD-S"
    );
    expect(getCiscoDeviceTemplate({ vendor: "Cisco", model: "WS-C3750G-48TS-S", name: "PIR core" })?.sku).toBe(
      "WS-C3750G-48TS-S"
    );
    expect(getCiscoDeviceTemplate({ vendor: "Cisco", model: "WS-C3750-48PS-S", name: "PIR core" })?.sku).toBe(
      "WS-C3750-48PS-S"
    );
    expect(getCiscoDeviceTemplate({ vendor: "Cisco", model: "WS-C3560-48PS-S", name: "PoE access" })?.sku).toBe(
      "WS-C3560-48PS-S"
    );
    expect(getCiscoDeviceTemplate({ vendor: "Cisco", model: "WS-C3560G-48TS-S", name: "Gigabit access" })?.sku).toBe(
      "WS-C3560G-48TS-S"
    );
    expect(getCiscoDeviceTemplate({ vendor: "Cisco", model: "C9200L-48P-4G", name: "Modern access" })?.family).toBe(
      "Catalyst 9200"
    );
    expect(getCiscoDeviceTemplate({ vendor: "Cisco", model: "C9500-32C", name: "Core switch" })?.sku).toBe(
      "C9500-32C"
    );
    expect(getCiscoDeviceTemplate({ vendor: "Cisco", model: "Catalyst 9300", name: "Generic switch" })).toBeNull();
  });

  it("matches supported Cisco router templates", () => {
    expect(getCiscoDeviceTemplate({ vendor: "Cisco", model: "CISCO1911/K9", name: "PIR lab router" })?.sku).toBe(
      "CISCO1911/K9"
    );
    expect(getCiscoDeviceTemplate({ vendor: "Cisco", model: "CISCO1941/K9", name: "Cisco 1900 Series" })?.sku).toBe(
      "CISCO1941/K9"
    );
    expect(getCiscoDeviceTemplate({ vendor: "Cisco", model: "CISCO2811/K9", name: "Cisco 2800 Series" })?.sku).toBe(
      "CISCO2811/K9"
    );
    expect(getCiscoDeviceTemplate({ vendor: "Cisco", model: "CISCO2911/K9", name: "Branch WAN" })?.sku).toBe(
      "CISCO2911/K9"
    );
    expect(getCiscoDeviceTemplate({ vendor: "Cisco", model: "IR1821-K9", name: "Industrial edge" })?.sku).toBe(
      "IR1821-K9"
    );
    expect(getCiscoDeviceTemplate({ vendor: "Cisco", model: "ISR4331/K9", name: "Branch WAN" })?.sku).toBe(
      "ISR4331/K9"
    );
    expect(getCiscoDeviceTemplate({ vendor: "Cisco", model: "C8200-1N-4T", name: "SD-WAN edge" })?.sku).toBe(
      "C8200-1N-4T"
    );
    expect(getCiscoDeviceTemplate({ vendor: "Cisco", model: "C8300-1N1S-4T2X", name: "SD-WAN edge" })?.sku).toBe(
      "C8300-1N1S-4T2X"
    );
  });

  it("separates downlink and uplink ports", () => {
    expect(isCiscoDownlinkPort("Gi1/0/48")).toBe(true);
    expect(isCiscoUplinkPort("Gi1/0/48")).toBe(false);
    expect(isCiscoDownlinkPort("Te1/1/1")).toBe(false);
    expect(isCiscoUplinkPort("Te1/1/1")).toBe(true);
    expect(isCiscoDownlinkPort("Fa0/48")).toBe(true);
    expect(isCiscoUplinkPort("Fa0/48")).toBe(false);
    expect(isCiscoDownlinkPort("Gi0/1")).toBe(false);
    expect(isCiscoUplinkPort("Gi0/1")).toBe(true);
  });

  it("formats front-panel port labels with Cisco-style prefixes", () => {
    expect(formatCiscoPortShortName("Gi1/0/4")).toBe("G1/0/4");
    expect(formatCiscoPortShortName("GigabitEthernet1/0/48")).toBe("G1/0/48");
    expect(formatCiscoPortShortName("Te1/1/1")).toBe("Te1/1/1");
    expect(formatCiscoPortShortName("TenGigabitEthernet1/1/4")).toBe("Te1/1/4");
    expect(formatCiscoPortShortName("Fa0/12")).toBe("Fa0/12");
    expect(formatCiscoPortShortName("Gi0/1")).toBe("G0/1");
    expect(formatCiscoPortShortName("Gi0/0/0")).toBe("G0/0/0");
    expect(formatCiscoPortShortName("Te0/0/4")).toBe("Te0/0/4");
    expect(formatCiscoPortShortName("Hu1/0/32")).toBe("Hu1/0/32");
  });

  it("orders a 2-row front panel as odd ports on top and even ports below", () => {
    const ports = [1, 2, 3, 4, 5, 6, 7, 8].map((portNumber) => ({
      name: `Gi1/0/${portNumber}`,
      portNumber
    }));

    expect(sortCiscoPhysicalPorts(ports).map((port) => port.name)).toEqual([
      "Gi1/0/1",
      "Gi1/0/3",
      "Gi1/0/5",
      "Gi1/0/7",
      "Gi1/0/2",
      "Gi1/0/4",
      "Gi1/0/6",
      "Gi1/0/8"
    ]);
  });

  it("orders uplink module ports left to right", () => {
    const ports = [1, 2, 3, 4].map((portNumber) => ({
      name: `Te1/1/${portNumber}`,
      portNumber
    }));

    expect(sortCiscoPortsLeftToRight(ports).map((port) => port.name)).toEqual([
      "Te1/1/1",
      "Te1/1/2",
      "Te1/1/3",
      "Te1/1/4"
    ]);
  });

  it("groups downlink ports into 12-port banks", () => {
    const ports = Array.from({ length: 48 }, (_, index) => {
      const portNumber = index + 1;
      return { name: `Gi1/0/${portNumber}`, portNumber };
    });

    const banks = groupCiscoPortsByBank(ports, 12);
    expect(banks.map((bank) => bank.label)).toEqual(["1-12", "13-24", "25-36", "37-48"]);
    expect(banks[0].ports.map((port) => port.name)).toEqual([
      "Gi1/0/1",
      "Gi1/0/3",
      "Gi1/0/5",
      "Gi1/0/7",
      "Gi1/0/9",
      "Gi1/0/11",
      "Gi1/0/2",
      "Gi1/0/4",
      "Gi1/0/6",
      "Gi1/0/8",
      "Gi1/0/10",
      "Gi1/0/12"
    ]);
  });
});
