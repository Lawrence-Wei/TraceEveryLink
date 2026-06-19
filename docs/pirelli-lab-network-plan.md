# Pirelli Office Lab Network Plan

This plan records the initial TraceEveryLink/PatchPlan onboarding layout for the Pirelli office lab.

## Management Network

| Item | Value |
| --- | --- |
| Upstream office gateway | `192.168.10.1` |
| Upstream office subnet | `192.168.10.0/23`, already in use |
| iStoreOS WAN side | Office network under `192.168.10.1` |
| Management VLAN | VLAN 77 / MGMT |
| Subnet | `192.168.77.0/24` |
| Gateway | `192.168.77.1` |
| Gateway device | `PIR-LAB-GW77.1` / iStoreOS |
| Suggested DHCP pool | `192.168.77.100-192.168.77.199` |
| Static infrastructure range | `192.168.77.1-192.168.77.99` |

Keep iStoreOS as the only DHCP/NAT gateway for the lab at first. Its WAN side sits below the existing `192.168.10.1` office router on the already-used `192.168.10.0/23` network, and its LAN side is `192.168.77.1` for the lab. Cisco routers should be added as managed lab devices, not as competing DHCP or NAT gateways.

## Seeded Devices

| Role | TraceEveryLink name | Management IP | Initial model |
| --- | --- | --- | --- |
| Gateway | `PIR-LAB-GW77.1` | `192.168.77.1` | iStoreOS router |
| Core switch | `PIR-LAB-CORE77.2` | `192.168.77.2` | `WS-C3750G-48TS-S` pending chassis-label confirmation |
| Access switch | `PIR-LAB-ACC77.5` | `192.168.77.5` | `WS-C2960X-48FPS-L` |
| Access switch | `PIR-LAB-ACC77.6` | `192.168.77.6` | `WS-C2960X-48FPS-L` |
| Router | `PIR-LAB-RTR77.11` | `192.168.77.11` | `CISCO1911/K9` pending chassis-label confirmation |
| Router | `PIR-LAB-RTR77.12` | `192.168.77.12` | `CISCO2811/K9` |
| Voice gateway candidate | `PIR-LAB-VGW77.13` | `192.168.77.13` | `CISCO2811/K9` |
| CUCM server | `PIR-LAB-CUCM77.20` | `192.168.77.20` | CUCM 7.4 |

## VLAN Plan

| VLAN | Name | Subnet | Gateway | Purpose |
| --- | --- | --- | --- | --- |
| 77 | MGMT | `192.168.77.0/24` | `192.168.77.1` initially | Device management |
| 78 | LAB-CLIENT | `192.168.78.0/24` | `192.168.78.1` | Lab PCs and test clients |
| 79 | VOICE | `192.168.79.0/24` | `192.168.79.1` | IP phones and CUCM/SRST labs |
| 80 | LAB-RTR | `192.168.80.0/24` | `192.168.80.1` | Routed lab segments |
| 81 | SERVER | `192.168.81.0/24` | `192.168.81.1` | Servers, VMs, and services |
| 82 | WIFI-IOT | `192.168.82.0/24` | `192.168.82.1` | Wi-Fi, IoT, and temporary devices |

Do not reuse `192.168.10.0/23` inside the lab because that is already the upstream office network behind the `192.168.10.1` router. Also avoid the previous `192.168.50.0/24` network.

Start with VLAN 77 only. Add the other VLANs after management access is stable from your laptop.

## Planned Physical Links

| Cable ID | Planned path | Status |
| --- | --- | --- |
| `CBL-PIR-GW77-1-CORE77-2` | `PIR-LAB-GW77.1 lan1` -> `PIR-LAB-CORE77.2 Gi1/0/48` | Planned |
| `CBL-PIR-CORE77-2-ACC77-5` | `PIR-LAB-CORE77.2 Gi1/0/51` -> `PIR-LAB-ACC77.5 Gi1/0/49` | Planned |
| `CBL-PIR-CORE77-2-ACC77-6` | `PIR-LAB-CORE77.2 Gi1/0/52` -> `PIR-LAB-ACC77.6 Gi1/0/49` | Planned |
| `CBL-PIR-CORE77-2-RTR77-11` | `PIR-LAB-CORE77.2 Gi1/0/11` -> `PIR-LAB-RTR77.11 Gi0/0` | Planned |
| `CBL-PIR-CORE77-2-RTR77-12` | `PIR-LAB-CORE77.2 Gi1/0/12` -> `PIR-LAB-RTR77.12 Fa0/0` | Planned |
| `CBL-PIR-CORE77-2-VGW77-13` | `PIR-LAB-CORE77.2 Gi1/0/13` -> `PIR-LAB-VGW77.13 Fa0/0` | Planned |
| `CBL-PIR-CORE77-2-CUCM77-20` | `PIR-LAB-CORE77.2 Gi1/0/20` -> `PIR-LAB-CUCM77.20 eth0` | Planned |

## TraceEveryLink Onboarding Order

1. Seed or create the `PIR-LAB-R01` rack and all devices with their management IPs.
2. Configure VLAN 77 management reachability on the core switch first.
3. Connect iStoreOS to the core switch and confirm that the core can ping `192.168.77.1`.
4. Add distribution and access uplinks one at a time, marking each planned cable as confirmed after it is patched and tested.
5. Add routers and CUCM as endpoints on VLAN 77 first.
6. Only after management is stable, create VLAN 78/79/80/81/82 and convert selected switch ports from access to trunk or voice/access roles.
