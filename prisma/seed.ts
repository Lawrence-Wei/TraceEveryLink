import "dotenv/config";
import {
  PrismaClient,
  Role,
  DeviceType,
  PortType,
  CableMedia,
  CableStatus,
  PrintProtocol,
  Prisma
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function env(name: string, fallback: string) {
  return process.env[name] || fallback;
}

function envBool(name: string, fallback: boolean) {
  const value = process.env[name];
  if (!value) {
    return fallback;
  }
  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}

async function main() {
  const adminEmail = env("ADMIN_EMAIL", "admin@example.com");
  const adminPassword = env("ADMIN_PASSWORD", "ChangeMe123!");
  const adminTotpSecret = env("ADMIN_TOTP_SECRET", "JBSWY3DPEHPK3PXP");
  const adminMfaEnabled = envBool("ADMIN_MFA_ENABLED", false);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: "TraceEveryLink Admin",
      passwordHash: await bcrypt.hash(adminPassword, 12),
      role: Role.ADMIN,
      mfaSecret: adminMfaEnabled ? adminTotpSecret : null,
      mfaEnabled: adminMfaEnabled
    },
    create: {
      email: adminEmail,
      name: "TraceEveryLink Admin",
      passwordHash: await bcrypt.hash(adminPassword, 12),
      role: Role.ADMIN,
      mfaSecret: adminMfaEnabled ? adminTotpSecret : null,
      mfaEnabled: adminMfaEnabled
    }
  });

  await prisma.account.upsert({
    where: { provider_providerAccountId: { provider: "LOCAL", providerAccountId: adminEmail } },
    update: { userId: admin.id, email: adminEmail },
    create: {
      provider: "LOCAL",
      providerAccountId: adminEmail,
      email: adminEmail,
      userId: admin.id
    }
  });

  const rack = await prisma.rack.upsert({
    where: { code: "R01" },
    update: {},
    create: {
      code: "R01",
      name: "R01 Access Rack",
      room: "MDF-01",
      heightU: 42,
      row: "A",
      position: "01"
    }
  });

  const photoRack = await prisma.rack.upsert({
    where: { code: "R02" },
    update: {
      name: "R02 Photo Rack",
      room: "MDF-02",
      heightU: 42,
      row: "A",
      position: "02"
    },
    create: {
      code: "R02",
      name: "R02 Photo Rack",
      room: "MDF-02",
      heightU: 42,
      row: "A",
      position: "02"
    }
  });

  const panduitRear = await upsertDevice("PANDUIT-R01-REAR-01", {
    rackId: rack.id,
    vendor: "Panduit",
    model: "NetRunner rear cable manager / 48-position patch field",
    type: DeviceType.PATCH_PANEL,
    uPosition: 42,
    uHeight: 2,
    face: "rear",
    notes: "Rear-side Panduit-style cable management field for tracing device ports to their back-of-rack landing positions."
  });

  const sw = await upsertDevice("C9300-ACCESS-01", {
    rackId: rack.id,
    vendor: "Cisco",
    model: "C9300-48P",
    type: DeviceType.CISCO_CATALYST,
    uPosition: 36,
    uHeight: 1,
    mgmtIp: "10.10.10.11",
    notes: "Cisco Catalyst 9300 48-port PoE+ access switch. Front-panel template follows Cisco Catalyst 9300 hardware guide."
  });

  const legacySw = await upsertDevice("C2960-ACCESS-02", {
    rackId: rack.id,
    vendor: "Cisco",
    model: "WS-C2960-48TT-L",
    type: DeviceType.CISCO_CATALYST,
    uPosition: 34,
    uHeight: 1,
    mgmtIp: "10.10.10.12",
    notes: "Cisco Catalyst 2960 48-port Fast Ethernet switch with two Gigabit uplinks."
  });

  const c3650 = await upsertDevice("C3650-ACCESS-03", {
    rackId: rack.id,
    vendor: "Cisco",
    model: "WS-C3650-48PS-S",
    type: DeviceType.CISCO_CATALYST,
    uPosition: 32,
    uHeight: 1,
    mgmtIp: "10.10.10.13",
    notes: "Cisco Catalyst 3650 48-port Gigabit PoE+ access switch."
  });

  const c3750e = await upsertDevice("C3750E-ACCESS-04", {
    rackId: rack.id,
    vendor: "Cisco",
    model: "WS-C3750E-48TD-S",
    type: DeviceType.CISCO_CATALYST,
    uPosition: 30,
    uHeight: 1,
    mgmtIp: "10.10.10.14",
    notes: "Cisco Catalyst 3750-E 48-port Gigabit switch with two 10G uplinks."
  });

  const isr2911 = await upsertDevice("ISR2911-WAN-01", {
    rackId: rack.id,
    vendor: "Cisco",
    model: "CISCO2911/K9",
    type: DeviceType.OTHER,
    uPosition: 28,
    uHeight: 2,
    mgmtIp: "10.10.10.21",
    notes: "Cisco 2911 Integrated Services Router demo front panel with onboard GE ports and EHWIC / SM slots."
  });

  const ir1821 = await upsertDevice("IR1821-EDGE-01", {
    rackId: rack.id,
    vendor: "Cisco",
    model: "IR1821-K9",
    type: DeviceType.OTHER,
    uPosition: 26,
    uHeight: 1,
    mgmtIp: "10.10.10.22",
    notes: "Cisco Catalyst IR1821 Rugged Router demo front panel with GE LAN / WAN ports and rugged module slots."
  });

  const isr4331 = await upsertDevice("ISR4331-WAN-01", {
    rackId: rack.id,
    vendor: "Cisco",
    model: "ISR4331/K9",
    type: DeviceType.OTHER,
    uPosition: 22,
    uHeight: 1,
    mgmtIp: "10.10.10.23",
    notes: "Cisco ISR 4331 Integrated Services Router demo front panel with onboard GE ports and NIM / SM slots."
  });

  const c8200 = await upsertDevice("C8200-EDGE-01", {
    rackId: rack.id,
    vendor: "Cisco",
    model: "C8200-1N-4T",
    type: DeviceType.OTHER,
    uPosition: 20,
    uHeight: 1,
    mgmtIp: "10.10.10.24",
    notes: "Cisco Catalyst 8200 Edge Platform demo front panel with embedded Layer 3 Ethernet ports."
  });

  const c8300 = await upsertDevice("C8300-EDGE-01", {
    rackId: rack.id,
    vendor: "Cisco",
    model: "C8300-1N1S-4T2X",
    type: DeviceType.OTHER,
    uPosition: 18,
    uHeight: 1,
    mgmtIp: "10.10.10.25",
    notes: "Cisco Catalyst 8300 Edge Platform demo front panel with 1G and 10G routed ports."
  });

  const photoC9300 = await upsertDevice("PHOTO-C9300-48P-4X-01", {
    rackId: photoRack.id,
    vendor: "Cisco",
    model: "C9300-48P",
    type: DeviceType.CISCO_CATALYST,
    uPosition: 42,
    uHeight: 1,
    mgmtIp: "10.20.10.11",
    notes: "From site photo: Catalyst 48 PoE+ with 4 x 10G uplink module."
  });

  const photoC9500 = await upsertDevice("PHOTO-C9500-32C-01", {
    rackId: photoRack.id,
    vendor: "Cisco",
    model: "C9500-32C",
    type: DeviceType.CISCO_CATALYST,
    uPosition: 39,
    uHeight: 1,
    mgmtIp: "10.20.10.16",
    notes: "Cisco Catalyst 9500 C9500-32C high-performance switch. Uses the official Cisco front-panel diagram as reference."
  });

  const cucmServer = await upsertDevice("CUCM7-4-SRV-01", {
    rackId: photoRack.id,
    vendor: "Cisco",
    model: "CUCM server / hardware model unreadable",
    type: DeviceType.SERVER,
    uPosition: 40,
    uHeight: 2,
    mgmtIp: "10.20.10.20",
    notes: "From site photo label CUCM7.4. Exact server model was not readable in the photo."
  });

  const photoC1900 = await upsertDevice("PHOTO-C1900-WAN-01", {
    rackId: photoRack.id,
    vendor: "Cisco",
    model: "CISCO1941/K9",
    type: DeviceType.OTHER,
    uPosition: 37,
    uHeight: 2,
    mgmtIp: "10.20.10.21",
    notes: "From site photo: Cisco 1900 Series ISR, represented with the common Cisco 1941 template."
  });

  const photoC2811 = await upsertDevice("PHOTO-C2811-WAN-01", {
    rackId: photoRack.id,
    vendor: "Cisco",
    model: "CISCO2811/K9",
    type: DeviceType.OTHER,
    uPosition: 36,
    uHeight: 1,
    mgmtIp: "10.20.10.22",
    notes: "From site photo: Cisco 2811 / Cisco 2800 Series ISR."
  });

  const photoC3560G = await upsertDevice("PHOTO-C3560G-ACCESS-01", {
    rackId: photoRack.id,
    vendor: "Cisco",
    model: "WS-C3560G-48TS-S",
    type: DeviceType.CISCO_CATALYST,
    uPosition: 34,
    uHeight: 1,
    mgmtIp: "10.20.10.13",
    notes: "From site photo: Catalyst 3560G Series with 48 Gigabit ports and 4 SFP uplinks."
  });

  const photoC3560Poe = await upsertDevice("PHOTO-C3560-POE48-01", {
    rackId: photoRack.id,
    vendor: "Cisco",
    model: "WS-C3560-48PS-S",
    type: DeviceType.CISCO_CATALYST,
    uPosition: 33,
    uHeight: 1,
    mgmtIp: "10.20.10.14",
    notes: "From site photo: Catalyst 3560 Series PoE-48."
  });

  const photoC2960X = await upsertDevice("PHOTO-C2960X-ACCESS-01", {
    rackId: photoRack.id,
    vendor: "Cisco",
    model: "WS-C2960X-48FPS-L",
    type: DeviceType.CISCO_CATALYST,
    uPosition: 31,
    uHeight: 1,
    mgmtIp: "10.20.10.12",
    notes: "From site photo: Catalyst 2960-X Series with 48 access ports and 4 SFP uplinks."
  });

  const photoC3750X = await upsertDevice("PHOTO-C3750X-ACCESS-01", {
    rackId: photoRack.id,
    vendor: "Cisco",
    model: "WS-C3750X-48P-S",
    type: DeviceType.CISCO_CATALYST,
    uPosition: 30,
    uHeight: 1,
    mgmtIp: "10.20.10.15",
    notes: "From site photo: Catalyst 3750-X Series switch with network module."
  });

  const panel = await upsertDevice("PP-R01-01", {
    rackId: rack.id,
    vendor: "Panduit",
    model: "24-port copper patch panel",
    type: DeviceType.PATCH_PANEL,
    uPosition: 40,
    uHeight: 1
  });

  const server = await upsertDevice("SRV-APP-01", {
    rackId: rack.id,
    vendor: "Dell",
    model: "PowerEdge",
    type: DeviceType.SERVER,
    uPosition: 24,
    uHeight: 2
  });

  const outlet = await upsertDevice("WA-101", {
    vendor: "Generic",
    model: "Wall outlet",
    type: DeviceType.WALL_OUTLET,
    notes: "Office 101 information outlet."
  });

  const ap = await upsertDevice("AP-LOBBY-01", {
    vendor: "Cisco",
    model: "Catalyst AP",
    type: DeviceType.AP,
    notes: "Lobby ceiling AP."
  });

  const swPorts = [];
  for (let i = 1; i <= 48; i += 1) {
    swPorts.push(
      await upsertPort(sw.id, `Gi1/0/${i}`, {
        label: `GigabitEthernet1/0/${i}`,
        type: PortType.RJ45,
        speed: "1G",
        poeEnabled: true,
        stack: 1,
        module: 0,
        portNumber: i
      })
    );
  }
  for (let i = 1; i <= 4; i += 1) {
    await upsertPort(sw.id, `Te1/1/${i}`, {
      label: `TenGigabitEthernet1/1/${i}`,
      type: PortType.SFP_PLUS,
      speed: "10G",
      stack: 1,
      module: 1,
      portNumber: i
    });
  }

  for (let i = 1; i <= 48; i += 1) {
    await upsertPort(legacySw.id, `Fa0/${i}`, {
      label: `FastEthernet0/${i}`,
      type: PortType.RJ45,
      speed: "100M",
      poeEnabled: false,
      stack: 0,
      module: 0,
      portNumber: i
    });
  }
  for (let i = 1; i <= 2; i += 1) {
    await upsertPort(legacySw.id, `Gi0/${i}`, {
      label: `GigabitEthernet0/${i}`,
      type: PortType.RJ45,
      speed: "1G",
      poeEnabled: false,
      stack: 0,
      module: 1,
      portNumber: i
    });
  }

  for (let i = 1; i <= 48; i += 1) {
    await upsertPort(c3650.id, `Gi1/0/${i}`, {
      label: `GigabitEthernet1/0/${i}`,
      type: PortType.RJ45,
      speed: "1G",
      poeEnabled: true,
      stack: 1,
      module: 0,
      portNumber: i
    });
  }
  for (let i = 1; i <= 4; i += 1) {
    await upsertPort(c3650.id, `Gi1/1/${i}`, {
      label: `GigabitEthernet1/1/${i}`,
      type: PortType.SFP,
      speed: "1G",
      stack: 1,
      module: 1,
      portNumber: i
    });
  }

  for (let i = 1; i <= 48; i += 1) {
    await upsertPort(c3750e.id, `Gi1/0/${i}`, {
      label: `GigabitEthernet1/0/${i}`,
      type: PortType.RJ45,
      speed: "1G",
      poeEnabled: false,
      stack: 1,
      module: 0,
      portNumber: i
    });
  }
  for (let i = 1; i <= 2; i += 1) {
    await upsertPort(c3750e.id, `Te1/1/${i}`, {
      label: `TenGigabitEthernet1/1/${i}`,
      type: PortType.SFP_PLUS,
      speed: "10G",
      stack: 1,
      module: 1,
      portNumber: i
    });
  }

  for (let i = 0; i <= 2; i += 1) {
    await upsertPort(isr2911.id, `Gi0/${i}`, {
      label: `GigabitEthernet0/${i}`,
      type: PortType.RJ45,
      speed: "1G",
      stack: 0,
      module: 0,
      portNumber: i
    });
  }

  await upsertPort(ir1821.id, "Gi0/0/0", {
    label: "GigabitEthernet0/0/0 WAN",
    type: PortType.RJ45,
    speed: "1G",
    stack: 0,
    module: 0,
    portNumber: 0
  });
  for (let i = 0; i <= 3; i += 1) {
    await upsertPort(ir1821.id, `Gi0/1/${i}`, {
      label: `GigabitEthernet0/1/${i} LAN`,
      type: PortType.RJ45,
      speed: "1G",
      poeEnabled: true,
      stack: 0,
      module: 1,
      portNumber: i
    });
  }

  for (let i = 0; i <= 2; i += 1) {
    await upsertPort(isr4331.id, `Gi0/0/${i}`, {
      label: `GigabitEthernet0/0/${i}`,
      type: PortType.RJ45,
      speed: "1G",
      stack: 0,
      module: 0,
      portNumber: i
    });
  }

  for (let i = 0; i <= 3; i += 1) {
    await upsertPort(c8200.id, `Gi0/0/${i}`, {
      label: `GigabitEthernet0/0/${i}`,
      type: PortType.RJ45,
      speed: "1G",
      stack: 0,
      module: 0,
      portNumber: i
    });
  }

  for (let i = 0; i <= 3; i += 1) {
    await upsertPort(c8300.id, `Gi0/0/${i}`, {
      label: `GigabitEthernet0/0/${i}`,
      type: PortType.RJ45,
      speed: "1G",
      stack: 0,
      module: 0,
      portNumber: i
    });
  }
  for (let i = 4; i <= 5; i += 1) {
    await upsertPort(c8300.id, `Te0/0/${i}`, {
      label: `TenGigabitEthernet0/0/${i}`,
      type: PortType.SFP_PLUS,
      speed: "10G",
      stack: 0,
      module: 0,
      portNumber: i
    });
  }

  for (let i = 1; i <= 48; i += 1) {
    await upsertPort(photoC9300.id, `Gi1/0/${i}`, {
      label: `GigabitEthernet1/0/${i}`,
      type: PortType.RJ45,
      speed: "1G",
      poeEnabled: true,
      stack: 1,
      module: 0,
      portNumber: i
    });
  }
  for (let i = 1; i <= 4; i += 1) {
    await upsertPort(photoC9300.id, `Te1/1/${i}`, {
      label: `TenGigabitEthernet1/1/${i}`,
      type: PortType.SFP_PLUS,
      speed: "10G",
      stack: 1,
      module: 1,
      portNumber: i
    });
  }

  for (let i = 1; i <= 32; i += 1) {
    await upsertPort(photoC9500.id, `Hu1/0/${i}`, {
      label: `HundredGigE1/0/${i}`,
      type: PortType.QSFP,
      speed: "100G",
      stack: 1,
      module: 0,
      portNumber: i
    });
  }

  await upsertPort(cucmServer.id, "mgmt0", {
    label: "Management",
    type: PortType.RJ45,
    speed: "1G",
    portNumber: 0
  });
  await upsertPort(cucmServer.id, "eth0", {
    label: "CUCM LAN 0",
    type: PortType.RJ45,
    speed: "1G",
    portNumber: 1
  });
  await upsertPort(cucmServer.id, "eth1", {
    label: "CUCM LAN 1",
    type: PortType.RJ45,
    speed: "1G",
    portNumber: 2
  });

  for (let i = 0; i <= 1; i += 1) {
    await upsertPort(photoC1900.id, `Gi0/${i}`, {
      label: `GigabitEthernet0/${i}`,
      type: PortType.RJ45,
      speed: "1G",
      stack: 0,
      module: 0,
      portNumber: i
    });
  }

  for (let i = 0; i <= 1; i += 1) {
    await upsertPort(photoC2811.id, `Fa0/${i}`, {
      label: `FastEthernet0/${i}`,
      type: PortType.RJ45,
      speed: "100M",
      stack: 0,
      module: 0,
      portNumber: i
    });
  }

  for (let i = 1; i <= 52; i += 1) {
    await upsertPort(photoC3560G.id, `Gi0/${i}`, {
      label: `GigabitEthernet0/${i}`,
      type: i <= 48 ? PortType.RJ45 : PortType.SFP,
      speed: "1G",
      stack: 0,
      module: i <= 48 ? 0 : 1,
      portNumber: i
    });
  }

  for (let i = 1; i <= 48; i += 1) {
    await upsertPort(photoC3560Poe.id, `Fa0/${i}`, {
      label: `FastEthernet0/${i}`,
      type: PortType.RJ45,
      speed: "100M",
      poeEnabled: true,
      stack: 0,
      module: 0,
      portNumber: i
    });
  }
  for (let i = 1; i <= 4; i += 1) {
    await upsertPort(photoC3560Poe.id, `Gi0/${i}`, {
      label: `GigabitEthernet0/${i} SFP`,
      type: PortType.SFP,
      speed: "1G",
      stack: 0,
      module: 1,
      portNumber: i
    });
  }

  for (let i = 1; i <= 52; i += 1) {
    await upsertPort(photoC2960X.id, `Gi1/0/${i}`, {
      label: `GigabitEthernet1/0/${i}${i > 48 ? " SFP" : ""}`,
      type: i <= 48 ? PortType.RJ45 : PortType.SFP,
      speed: "1G",
      poeEnabled: i <= 48,
      stack: 1,
      module: i <= 48 ? 0 : 1,
      portNumber: i
    });
  }

  for (let i = 1; i <= 48; i += 1) {
    await upsertPort(photoC3750X.id, `Gi1/0/${i}`, {
      label: `GigabitEthernet1/0/${i}`,
      type: PortType.RJ45,
      speed: "1G",
      poeEnabled: true,
      stack: 1,
      module: 0,
      portNumber: i
    });
  }
  for (let i = 1; i <= 4; i += 1) {
    await upsertPort(photoC3750X.id, `Gi1/1/${i}`, {
      label: `GigabitEthernet1/1/${i}`,
      type: PortType.SFP,
      speed: "1G",
      stack: 1,
      module: 1,
      portNumber: i
    });
  }

  const panduitRearPorts = [];
  for (let i = 1; i <= 48; i += 1) {
    panduitRearPorts.push(
      await upsertPort(panduitRear.id, `P${String(i).padStart(2, "0")}`, {
        label: `Rear cable manager position ${i}`,
        type: PortType.RJ45,
        portNumber: i
      })
    );
  }

  const panelFront = [];
  const panelRear = [];
  for (let i = 1; i <= 24; i += 1) {
    const front = await upsertPort(panel.id, `F${String(i).padStart(2, "0")}`, {
      label: `Front ${i}`,
      type: PortType.RJ45,
      portNumber: i
    });
    const rear = await upsertPort(panel.id, `R${String(i).padStart(2, "0")}`, {
      label: `Rear ${i}`,
      type: PortType.RJ45,
      portNumber: i
    });
    await prisma.port.update({
      where: { id: front.id },
      data: { mappedPortId: rear.id }
    });
    panelFront.push(front);
    panelRear.push(rear);
  }

  const outletPort = await upsertPort(outlet.id, "RJ45-1", {
    label: "Office 101",
    type: PortType.RJ45,
    speed: "1G"
  });
  const apPort = await upsertPort(ap.id, "Eth0", {
    label: "AP uplink",
    type: PortType.RJ45,
    speed: "1G",
    poeEnabled: true
  });
  const serverPort = await upsertPort(server.id, "eth0", {
    label: "Server LAN",
    type: PortType.RJ45,
    speed: "1G"
  });
  await upsertPort(server.id, "eth1", {
    label: "Server spare LAN",
    type: PortType.RJ45,
    speed: "1G"
  });

  await upsertCable("CBL-MDF01-R01-GI1-0-1", "R01-U36 Gi1/0/1 -> PP01-F01", swPorts[0].id, panelFront[0].id, {
    status: CableStatus.confirmed,
    color: "blue",
    lengthM: 2
  });
  await upsertCable("CBL-MDF01-R01-PP01-R01-WA101", "PP01-R01 -> WA-101", panelRear[0].id, outletPort.id, {
    status: CableStatus.confirmed,
    color: "blue",
    lengthM: 18
  });
  await upsertCable("CBL-MDF01-R01-GI1-0-2", "R01-U36 Gi1/0/2 -> PP01-F02", swPorts[1].id, panelFront[1].id, {
    status: CableStatus.pending_verification,
    color: "yellow",
    lengthM: 2
  });
  await upsertCable("CBL-MDF01-R01-PP01-R02-APLOBBY", "PP01-R02 -> AP-LOBBY-01", panelRear[1].id, apPort.id, {
    status: CableStatus.pending_verification,
    color: "yellow",
    lengthM: 32
  });
  await upsertCable("CBL-MDF01-R01-GI1-0-3-SRV", "Gi1/0/3 -> SRV-APP-01", swPorts[2].id, serverPort.id, {
    status: CableStatus.draft,
    color: "green",
    lengthM: 3
  });

  await upsertCable(
    "CBL-R01-C9300-TE1-1-1-PANDUIT-P01",
    "C9300-ACCESS-01 Te1/1/1 -> Panduit rear P01",
    (await requirePort(sw.id, "Te1/1/1")).id,
    panduitRearPorts[0].id,
    { status: CableStatus.confirmed, color: "aqua", lengthM: 1.5 }
  );
  await upsertCable(
    "CBL-R01-C2960-GI0-1-PANDUIT-P02",
    "C2960-ACCESS-02 Gi0/1 -> Panduit rear P02",
    (await requirePort(legacySw.id, "Gi0/1")).id,
    panduitRearPorts[1].id,
    { status: CableStatus.confirmed, color: "blue", lengthM: 1.5 }
  );
  await upsertCable(
    "CBL-R01-C3650-GI1-1-1-PANDUIT-P03",
    "C3650-ACCESS-03 Gi1/1/1 -> Panduit rear P03",
    (await requirePort(c3650.id, "Gi1/1/1")).id,
    panduitRearPorts[2].id,
    { status: CableStatus.confirmed, color: "blue", lengthM: 1.5 }
  );
  await upsertCable(
    "CBL-R01-C3750E-TE1-1-1-PANDUIT-P04",
    "C3750E-ACCESS-04 Te1/1/1 -> Panduit rear P04",
    (await requirePort(c3750e.id, "Te1/1/1")).id,
    panduitRearPorts[3].id,
    { status: CableStatus.confirmed, color: "aqua", lengthM: 1.5 }
  );
  await upsertCable(
    "CBL-R01-ISR2911-GI0-0-PANDUIT-P05",
    "ISR2911-WAN-01 Gi0/0 -> Panduit rear P05",
    (await requirePort(isr2911.id, "Gi0/0")).id,
    panduitRearPorts[4].id,
    { status: CableStatus.confirmed, color: "yellow", lengthM: 1.5 }
  );
  await upsertCable(
    "CBL-R01-IR1821-GI0-0-0-PANDUIT-P06",
    "IR1821-EDGE-01 Gi0/0/0 -> Panduit rear P06",
    (await requirePort(ir1821.id, "Gi0/0/0")).id,
    panduitRearPorts[5].id,
    { status: CableStatus.confirmed, color: "yellow", lengthM: 1.5 }
  );
  await upsertCable(
    "CBL-R01-ISR4331-GI0-0-0-PANDUIT-P07",
    "ISR4331-WAN-01 Gi0/0/0 -> Panduit rear P07",
    (await requirePort(isr4331.id, "Gi0/0/0")).id,
    panduitRearPorts[6].id,
    { status: CableStatus.confirmed, color: "yellow", lengthM: 1.5 }
  );
  await upsertCable(
    "CBL-R01-C8200-GI0-0-0-PANDUIT-P08",
    "C8200-EDGE-01 Gi0/0/0 -> Panduit rear P08",
    (await requirePort(c8200.id, "Gi0/0/0")).id,
    panduitRearPorts[7].id,
    { status: CableStatus.confirmed, color: "yellow", lengthM: 1.5 }
  );
  await upsertCable(
    "CBL-R01-C8300-TE0-0-4-PANDUIT-P09",
    "C8300-EDGE-01 Te0/0/4 -> Panduit rear P09",
    (await requirePort(c8300.id, "Te0/0/4")).id,
    panduitRearPorts[8].id,
    { status: CableStatus.confirmed, color: "aqua", lengthM: 1.5 }
  );

  await prisma.auditLog.create({
    data: {
      actorId: admin.id,
      action: "seed",
      entityType: "system",
      entityId: "bootstrap",
      newValue: { message: "Seeded demo rack, Panduit rear field, ports, and cables." }
    }
  });

  await prisma.labelPrinter.upsert({
    where: { id: "demo-http-label-printer" },
    update: {
      name: "HTTP Label Printer",
      protocol: PrintProtocol.HTTP_JSON,
      endpoint: "http://label-printer.local/api/print",
      enabled: false,
      notes: "Demo printer adapter. Enable and replace endpoint for production."
    },
    create: {
      id: "demo-http-label-printer",
      name: "HTTP Label Printer",
      protocol: PrintProtocol.HTTP_JSON,
      endpoint: "http://label-printer.local/api/print",
      enabled: false,
      notes: "Demo printer adapter. Enable and replace endpoint for production."
    }
  });

  console.log(`Seeded admin ${adminEmail}`);
  console.log(`Admin MFA is ${adminMfaEnabled ? "enabled" : "disabled"}.`);
}

async function upsertDevice(
  name: string,
  data: Omit<Prisma.DeviceUncheckedCreateInput, "id" | "name" | "createdAt" | "updatedAt">
) {
  const existing = await prisma.device.findFirst({ where: { name } });
  if (existing) {
    return prisma.device.update({ where: { id: existing.id }, data: data as Prisma.DeviceUncheckedUpdateInput });
  }
  return prisma.device.create({ data: { name, ...data } });
}

async function upsertPort(
  deviceId: string,
  name: string,
  data: Omit<Prisma.PortUncheckedCreateInput, "id" | "deviceId" | "name" | "createdAt" | "updatedAt">
) {
  return prisma.port.upsert({
    where: { deviceId_name: { deviceId, name } },
    update: data as Prisma.PortUncheckedUpdateInput,
    create: { deviceId, name, ...data }
  });
}

async function requirePort(deviceId: string, name: string) {
  const port = await prisma.port.findUnique({ where: { deviceId_name: { deviceId, name } } });
  if (!port) throw new Error(`Missing port ${deviceId} ${name}`);
  return port;
}

async function upsertCable(
  cableId: string,
  label: string,
  endpointAPortId: string,
  endpointBPortId: string,
  data: Partial<{
    status: CableStatus;
    media: CableMedia;
    color: string;
    lengthM: number;
  }>
) {
  return prisma.cable.upsert({
    where: { cableId },
    update: {
      label,
      endpointAPortId,
      endpointBPortId,
      status: data.status,
      media: data.media,
      color: data.color,
      lengthM: data.lengthM
    },
    create: {
      cableId,
      label,
      endpointAPortId,
      endpointBPortId,
      status: data.status ?? CableStatus.draft,
      media: data.media ?? CableMedia.COPPER,
      color: data.color,
      lengthM: data.lengthM
    }
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
