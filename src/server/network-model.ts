import type { CableStatus } from "@prisma/client";

export type TracePort = {
  id: string;
  name: string;
  label?: string | null;
  mappedPortId?: string | null;
  device: {
    id: string;
    name: string;
    type: string;
    rack?: { code: string; room: string } | null;
  };
};

export type TraceCable = {
  id: string;
  cableId: string;
  status: CableStatus | string;
  endpointAPortId: string;
  endpointBPortId: string;
};

export function isCiscoCatalystPortName(value: string) {
  return /^(Gi|GigabitEthernet|Te|TenGigabitEthernet|Twe|TwentyFiveGigE|Fo|FortyGigabitEthernet|Hu|HundredGigE|Fa|FastEthernet|Eth|Ethernet)\d+(\/\d+){1,3}$/i.test(
    value.trim()
  );
}

export function formatPort(port: TracePort) {
  const rack = port.device.rack?.code ? `${port.device.rack.code} ` : "";
  return `${rack}${port.device.name} ${port.name}`;
}

export function buildTrace(startPortId: string, ports: TracePort[], cables: TraceCable[]) {
  const activeCables = cables.filter((cable) => cable.status !== "retired");
  const adjacency = new Map<string, { to: string; via: string }[]>();

  for (const port of ports) {
    if (!adjacency.has(port.id)) adjacency.set(port.id, []);
    if (port.mappedPortId) {
      adjacency.get(port.id)!.push({ to: port.mappedPortId, via: "patch-panel-map" });
      if (!adjacency.has(port.mappedPortId)) adjacency.set(port.mappedPortId, []);
      adjacency.get(port.mappedPortId)!.push({ to: port.id, via: "patch-panel-map" });
    }
  }

  for (const cable of activeCables) {
    adjacency.get(cable.endpointAPortId)?.push({ to: cable.endpointBPortId, via: cable.id });
    adjacency.get(cable.endpointBPortId)?.push({ to: cable.endpointAPortId, via: cable.id });
  }

  const visited = new Set<string>([startPortId]);
  const queue: Array<{ id: string; path: string[] }> = [{ id: startPortId, path: [startPortId] }];
  const leaves: string[][] = [];

  while (queue.length) {
    const current = queue.shift()!;
    const next = (adjacency.get(current.id) || []).filter((edge) => !visited.has(edge.to));
    if (next.length === 0 && current.path.length > 1) {
      leaves.push(current.path);
    }
    for (const edge of next) {
      visited.add(edge.to);
      queue.push({ id: edge.to, path: [...current.path, edge.to] });
    }
  }

  const portById = new Map(ports.map((port) => [port.id, port]));
  return leaves
    .sort((a, b) => b.length - a.length)
    .map((path) => path.map((id) => portById.get(id)).filter(Boolean) as TracePort[]);
}
