import { describe, expect, it } from "vitest";
import { buildTrace, formatPort, isCiscoCatalystPortName, type TraceCable, type TracePort } from "./network-model";

describe("network model", () => {
  it("accepts common Cisco Catalyst port names", () => {
    expect(isCiscoCatalystPortName("Gi1/0/24")).toBe(true);
    expect(isCiscoCatalystPortName("Te1/1/1")).toBe(true);
    expect(isCiscoCatalystPortName("GigabitEthernet2/0/48")).toBe(true);
    expect(isCiscoCatalystPortName("bad-port-1")).toBe(false);
  });

  it("traces across patch-panel rear/front mapping", () => {
    const ports: TracePort[] = [
      port("sw", "Gi1/0/1", "switch"),
      port("panel-front", "F01", "patch", "panel-rear"),
      port("panel-rear", "R01", "patch", "panel-front"),
      port("wall", "RJ45-1", "WA-101")
    ];
    const cables: TraceCable[] = [
      cable("c1", "sw", "panel-front"),
      cable("c2", "panel-rear", "wall")
    ];

    const [trace] = buildTrace("sw", ports, cables);
    expect(trace.map((item) => item.id)).toEqual(["sw", "panel-front", "panel-rear", "wall"]);
    expect(formatPort(trace[0])).toBe("R01 switch Gi1/0/1");
  });
});

function port(id: string, name: string, deviceName: string, mappedPortId?: string): TracePort {
  return {
    id,
    name,
    mappedPortId,
    device: {
      id: `${id}-device`,
      name: deviceName,
      type: "CISCO_CATALYST",
      rack: { code: "R01", room: "MDF" }
    }
  };
}

function cable(id: string, a: string, b: string): TraceCable {
  return {
    id,
    cableId: id,
    status: "confirmed",
    endpointAPortId: a,
    endpointBPortId: b
  };
}
