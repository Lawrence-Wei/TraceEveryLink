"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type MouseEvent, type PointerEvent, type WheelEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Cable,
  Check,
  Download,
  FileText,
  Hand,
  Home,
  LogOut,
  Maximize2,
  Minimize2,
  Moon,
  MousePointer2,
  Plus,
  Printer,
  QrCode,
  RefreshCw,
  RotateCcw,
  Search,
  Sun,
  Trash2,
  Upload,
  X
} from "lucide-react";
import {
  formatCiscoPortShortName,
  getCiscoDeviceTemplate,
  getCiscoPortNumber,
  groupCiscoPortsByBank,
  isCiscoDownlinkPort,
  isCiscoUplinkPort,
  sortCiscoPortsLeftToRight,
} from "@/shared/cisco-catalog";
import { languageOptions, translateApiError, type Translate, type TranslationKey, useI18n } from "@/shared/i18n";
import {
  rackulaDeviceCategoryOrder,
  rackulaGenericDeviceTypes,
  rackulaCategoryToTraceDeviceType,
  type RackulaDeviceCategory,
  type RackulaDeviceTemplate
} from "@/shared/rackula-device-catalog";
import { themeOptions, useTheme } from "@/shared/theme";
import { worldMapPaths, worldMapViewport } from "@/shared/world-map";

type Role = "VIEWER" | "SURVEYOR" | "REVIEWER" | "ADMIN";
type CableStatus = "planned" | "draft" | "pending_verification" | "confirmed" | "faulty" | "retired";

type UserDto = {
  id: string;
  email: string;
  name: string;
  role: Role;
};

type RackDto = {
  id: string;
  code: string;
  name: string;
  room: string;
  heightU: number;
  devices: DeviceDto[];
};

type DeviceDto = {
  id: string;
  rackId?: string | null;
  name: string;
  vendor?: string | null;
  model?: string | null;
  type: string;
  uPosition?: number | null;
  uHeight: number;
  face?: string | null;
  mgmtIp?: string | null;
  ports: PortDto[];
  rack?: { code: string; room: string } | null;
};

type PortDto = {
  id: string;
  deviceId: string;
  name: string;
  label?: string | null;
  type: string;
  speed?: string | null;
  poeEnabled: boolean;
  status: string;
  stack?: number | null;
  module?: number | null;
  mappedPortId?: string | null;
  portNumber?: number | null;
};

type PhotoDto = {
  id: string;
  originalName: string;
  mimeType: string;
  createdAt: string;
};

type CableDto = {
  id: string;
  cableId: string;
  label: string;
  status: CableStatus;
  media: string;
  color?: string | null;
  lengthM?: number | null;
  endpointAPortId: string;
  endpointBPortId: string;
  endpointAPort: PortDto & { device: DeviceDto & { rack?: { code: string; room: string } | null } };
  endpointBPort: PortDto & { device: DeviceDto & { rack?: { code: string; room: string } | null } };
  notes?: string | null;
  photos: PhotoDto[];
  updatedAt: string;
};

type PrinterDto = {
  id: string;
  name: string;
  protocol: string;
  endpoint: string;
  enabled: boolean;
};

type AuditDto = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  createdAt: string;
  actor?: { name: string; email: string } | null;
};

type InventoryDto = {
  racks: RackDto[];
  devicesWithoutRack: DeviceDto[];
  cables: CableDto[];
  printers: PrinterDto[];
  auditLogs: AuditDto[];
};

type PendingPatchConnection = {
  id: string;
  endpointAPortId: string;
  endpointBPortId: string;
};

type CableCreateResult =
  | { ok: true; cable: CableDto }
  | { ok: false; error: string };

type SitePoint = {
  id: string;
  label: string;
  country: string;
  city: string;
  address?: string;
  aliases: string[];
  x: number;
  y: number;
  geoX?: number;
  geoY?: number;
  lat?: number;
  lon?: number;
  custom?: boolean;
};

type SiteSummary = SitePoint & {
  racks: RackDto[];
  deviceCount: number;
  lineCount: number;
};

type CountrySiteGroup = {
  country: string;
  sites: SiteSummary[];
  rackCount: number;
  lineCount: number;
};

type NewSiteFormState = {
  country: string;
  city: string;
  address: string;
};

const cableStatuses: CableStatus[] = ["planned", "draft", "pending_verification", "confirmed", "faulty", "retired"];

const officeRackOverviewLimit = 3;

const customSitesStorageKey = "patchplan-custom-sites";

function createGeoSite(site: Omit<SitePoint, "x" | "y" | "geoX" | "geoY"> & { lon: number; lat: number; labelDx?: number; labelDy?: number }): SitePoint {
  const projected = projectMapPoint(site.lon, site.lat);
  return {
    ...site,
    x: clamp(projected.x + (site.labelDx || 0), 4, 96),
    y: clamp(projected.y + (site.labelDy || 0), 4, 96),
    geoX: projected.x,
    geoY: projected.y
  };
}

function projectMapPoint(lon: number, lat: number) {
  const mercator = (value: number) => Math.log(Math.tan(Math.PI / 4 + value * Math.PI / 360));
  const maxY = mercator(worldMapViewport.maxLat);
  const minY = mercator(worldMapViewport.minLat);
  const boundedLat = clamp(lat, worldMapViewport.minLat, worldMapViewport.maxLat);
  return {
    x: ((lon - worldMapViewport.minLon) / (worldMapViewport.maxLon - worldMapViewport.minLon)) * 100,
    y: ((maxY - mercator(boundedLat)) / (maxY - minY)) * 100
  };
}

const defaultSitePoints: SitePoint[] = [
  createGeoSite({ id: "shanghai", label: "Shanghai", country: "China", city: "Shanghai", aliases: ["MDF-01", "Shanghai", "上海"], lon: 121.47, lat: 31.23, labelDx: 1.8, labelDy: 2.4 }),
  createGeoSite({ id: "yanzhou", label: "Yanzhou", country: "China", city: "Yanzhou", aliases: ["Yanzhou", "兖州"], lon: 116.83, lat: 35.55, labelDx: -0.8, labelDy: -5.9 }),
  createGeoSite({ id: "shenzhou", label: "Shenzhou", country: "China", city: "Shenzhou", aliases: ["Shenzhou", "深州"], lon: 115.56, lat: 38, labelDx: -7.4, labelDy: -5.5 }),
  createGeoSite({ id: "jiaozuo", label: "Jiaozuo", country: "China", city: "Jiaozuo", aliases: ["Jiaozuo", "焦作"], lon: 113.24, lat: 35.24, labelDx: -5.6, labelDy: 3.6 }),
  createGeoSite({ id: "singapore", label: "Singapore", country: "Singapore", city: "Singapore", aliases: ["MDF-02", "Singapore", "新加坡"], lon: 103.82, lat: 1.35, labelDx: 3.4, labelDy: -0.5 }),
  createGeoSite({ id: "sydney", label: "Sydney", country: "Australia", city: "Sydney", aliases: ["Australia", "Sydney", "澳大利亚", "悉尼"], lon: 151.21, lat: -33.87, labelDx: -3.5, labelDy: -3.2 }),
  createGeoSite({ id: "seoul", label: "Seoul", country: "Korea", city: "Seoul", aliases: ["Korea", "Seoul", "Soul", "韩国", "首尔"], lon: 126.98, lat: 37.57, labelDx: 5.8, labelDy: -4.7 }),
  createGeoSite({ id: "tokyo", label: "Tokyo", country: "Japan", city: "Tokyo", aliases: ["Japan", "Tokyo", "日本", "东京"], lon: 139.69, lat: 35.68, labelDx: 4.4, labelDy: 3.2 }),
  createGeoSite({ id: "bangkok", label: "Bangkok", country: "Thailand", city: "Bangkok", aliases: ["Thailand", "Bangkok", "Bankok", "泰国", "曼谷"], lon: 100.5, lat: 13.76, labelDx: -3.6, labelDy: -1.5 }),
  createGeoSite({ id: "milan", label: "Milan", country: "Italy", city: "Milan", aliases: ["Milan", "Milano", "米兰"], lon: 9.19, lat: 45.46, labelDx: 1.6, labelDy: 1.2 }),
  createGeoSite({ id: "jakarta", label: "Jakarta", country: "Indonesia", city: "Jakarta", aliases: ["Jakarta", "雅加达"], lon: 106.85, lat: -6.21, labelDx: -7.2, labelDy: 5.8 }),
  createGeoSite({ id: "subang", label: "Subang Factory", country: "Indonesia", city: "Subang", aliases: ["Subang", "Subang Factory", "苏帮", "苏帮工厂"], lon: 107.76, lat: -6.57, labelDx: 5.3, labelDy: 5.2 })
];

const defaultSiteOrder = new Map(defaultSitePoints.map((site, index) => [site.id, index]));
const defaultCountryOrder = new Map(
  Array.from(new Set(defaultSitePoints.map((site) => site.country))).map((country, index) => [country, index])
);

type WanUtilizationBand = "u0" | "u10" | "u25" | "u40" | "u55" | "u70" | "u85" | "u100" | "unknown" | "down";

type SiteWanLink = {
  from: string;
  to: string;
  utilization: WanUtilizationBand;
  circuits?: number;
  route?: Array<{ lon: number; lat: number }>;
  labelDx?: number;
  labelDy?: number;
};

const siteWanLinks: SiteWanLink[] = [
  { from: "tokyo", to: "shanghai", utilization: "u25", route: [{ lon: 129.8, lat: 31.2 }] },
  { from: "singapore", to: "shanghai", utilization: "u40", route: [{ lon: 110.5, lat: 8.8 }, { lon: 116.2, lat: 20.4 }] },
  { from: "seoul", to: "shanghai", utilization: "u10", route: [{ lon: 124.1, lat: 34.6 }] },
  { from: "sydney", to: "shanghai", utilization: "u55", route: [{ lon: 147.5, lat: -18.5 }, { lon: 134.8, lat: -2.2 }, { lon: 124.4, lat: 18.8 }] },
  { from: "bangkok", to: "shanghai", utilization: "u25", route: [{ lon: 103.6, lat: 15.4 }, { lon: 109.8, lat: 20.2 }, { lon: 117.2, lat: 26.6 }] },
  { from: "shanghai", to: "yanzhou", utilization: "u40", circuits: 2, labelDx: 3.8, labelDy: -5.8 },
  { from: "yanzhou", to: "shenzhou", utilization: "u10", circuits: 2, labelDx: -4.2, labelDy: -6.8 },
  { from: "yanzhou", to: "jiaozuo", utilization: "u25", circuits: 2, labelDx: -5.2, labelDy: 5.8 },
  { from: "shanghai", to: "milan", utilization: "u70", route: [{ lon: 118.5, lat: 22.2 }, { lon: 103.7, lat: 1.5 }, { lon: 80, lat: 7.2 }, { lon: 59, lat: 12.5 }, { lon: 43, lat: 12.8 }, { lon: 33, lat: 31.5 }, { lon: 18, lat: 39.2 }] },
  { from: "shanghai", to: "subang", utilization: "u55", route: [{ lon: 116.4, lat: 20.2 }, { lon: 110.5, lat: 7.8 }, { lon: 107.8, lat: -1.5 }] },
  { from: "jakarta", to: "subang", utilization: "u10", route: [{ lon: 107.2, lat: -6.35 }] }
];

const linkUtilizationLegend: Array<{ utilization: WanUtilizationBand; label?: string; labelKey?: TranslationKey }> = [
  { utilization: "u0", label: "0 - 10%" },
  { utilization: "u10", label: "10 - 25%" },
  { utilization: "u25", label: "25 - 40%" },
  { utilization: "u40", label: "40 - 55%" },
  { utilization: "u55", label: "55 - 70%" },
  { utilization: "u70", label: "70 - 85%" },
  { utilization: "u85", label: "85 - 100%" },
  { utilization: "unknown", labelKey: "siteMap.unknown" },
  { utilization: "down", labelKey: "siteMap.downStatus" }
];

export default function DashboardClient({
  initialData,
  currentUser,
  csrfToken
}: {
  initialData: InventoryDto;
  currentUser: UserDto;
  csrfToken: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language, setLanguage, t } = useI18n();
  const { theme, setTheme } = useTheme();
  const [data, setData] = useState(initialData);
  const [activeRackId, setActiveRackId] = useState(initialData.racks[0]?.id || "");
  const [selectedCableIds, setSelectedCableIds] = useState<string[]>([]);
  const [selectedPortId, setSelectedPortId] = useState<string | null>(null);
  const [selectedCableId, setSelectedCableId] = useState<string | null>(searchParams.get("cable"));
  const [query, setQuery] = useState("");
  const [drawerMode, setDrawerMode] = useState<"details" | "new">("details");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [dragPortId, setDragPortId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarSize, setSidebarSize] = useState<"compact" | "normal" | "wide">("normal");
  const [sidebarWidth, setSidebarWidth] = useState(304);
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [detailsWidth, setDetailsWidth] = useState(360);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [selectedDeviceTemplateSlug, setSelectedDeviceTemplateSlug] = useState<string | null>(null);
  const [activeSiteId, setActiveSiteId] = useState("shanghai");
  const [workbenchMode, setWorkbenchMode] = useState<"overview" | "site">("overview");
  const [customSites, setCustomSites] = useState<SitePoint[]>([]);
  const [customSitesReady, setCustomSitesReady] = useState(false);
  const [showNewSiteForm, setShowNewSiteForm] = useState(false);
  const [newSite, setNewSite] = useState<NewSiteFormState>({ country: "", city: "", address: "" });
  const [viewMode, setViewMode] = useState<"select" | "pan" | "patch">("select");
  const [isPanning, setIsPanning] = useState(false);
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [pendingEndpointId, setPendingEndpointId] = useState<string | null>(null);
  const [pendingConnections, setPendingConnections] = useState<PendingPatchConnection[]>([]);
  const rackStageRef = useRef<HTMLElement | null>(null);
  const panStartRef = useRef<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null);
  const paneResizeRef = useRef<{ pane: "left" | "right"; startX: number; startWidth: number } | null>(null);
  const suppressPanClickRef = useRef(false);

  const allDevices = useMemo(
    () => [...data.racks.flatMap((rack) => rack.devices.map((device) => ({ ...device, rack }))), ...data.devicesWithoutRack],
    [data]
  );
  const allPorts = useMemo(
    () =>
      allDevices.flatMap((device) =>
        device.ports.map((port) => ({
          ...port,
          device
        }))
      ),
    [allDevices]
  );
  const portById = useMemo(() => new Map(allPorts.map((port) => [port.id, port])), [allPorts]);
  const cableById = useMemo(() => new Map(data.cables.map((cable) => [cable.id, cable])), [data.cables]);
  const sitePoints = useMemo(() => [...defaultSitePoints, ...customSites], [customSites]);
  const siteSummaries = useMemo(() => buildSiteSummaries(sitePoints, data.racks, data.cables), [sitePoints, data.racks, data.cables]);
  const countrySiteGroups = useMemo(() => groupSitesByCountry(siteSummaries), [siteSummaries]);
  const selectedSite = siteSummaries.find((site) => site.id === activeSiteId) || siteSummaries[0];
  const activeSite = workbenchMode === "site" ? selectedSite : null;
  const orderedCountrySiteGroups = useMemo(() => {
    if (!activeSite) return countrySiteGroups;
    return [...countrySiteGroups].sort((a, b) => {
      if (a.country === activeSite.country) return -1;
      if (b.country === activeSite.country) return 1;
      return 0;
    });
  }, [activeSite, countrySiteGroups]);
  const activeRack = workbenchMode === "site" ? data.racks.find((rack) => rack.id === activeRackId) || null : null;
  const officeRackOverviewRacks = useMemo(
    () => getOfficeRackOverviewRacks(activeRack, activeSite?.racks || []),
    [activeRack, activeSite?.racks]
  );
  const selectedCable = selectedCableId ? cableById.get(selectedCableId) || null : null;
  const selectedPort = selectedPortId ? portById.get(selectedPortId) || null : null;
  const selectedDevice = selectedDeviceId
    ? allDevices.find((device) => device.id === selectedDeviceId) || null
    : selectedPort?.device || selectedCable?.endpointAPort.device || null;
  const selectedDeviceTemplate = selectedDeviceTemplateSlug
    ? rackulaGenericDeviceTypes.find((template) => template.slug === selectedDeviceTemplateSlug) || null
    : null;
  const filteredDeviceTemplates = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return rackulaGenericDeviceTypes;
    return rackulaGenericDeviceTypes.filter((template) =>
      `${template.model} ${template.slug} ${template.category} ${template.heightU}U`.toLowerCase().includes(normalizedQuery)
    );
  }, [query]);
  const selectedPortCable = selectedPort ? findCableForPort(selectedPort.id, data.cables) : null;
  const pendingEndpoint = pendingEndpointId ? portById.get(pendingEndpointId) || null : null;
  const queuedPortIds = useMemo(() => {
    const ids = new Set<string>();
    if (pendingEndpointId) ids.add(pendingEndpointId);
    pendingConnections.forEach((connection) => {
      ids.add(connection.endpointAPortId);
      ids.add(connection.endpointBPortId);
    });
    return ids;
  }, [pendingConnections, pendingEndpointId]);
  const trace = selectedPort ? buildTrace(selectedPort.id, allPorts, data.cables) : [];
  const selectedTrace = trace[0] || [];
  const directPeer = selectedPort && selectedPortCable ? getCablePeer(selectedPort.id, selectedPortCable) : null;
  const routeEnd = selectedPort ? getTraceRemoteEnd(selectedPort.id, selectedTrace) : null;
  const canEdit = roleRank(currentUser.role) >= roleRank("SURVEYOR");
  const canReview = roleRank(currentUser.role) >= roleRank("REVIEWER");
  const canAdmin = roleRank(currentUser.role) >= roleRank("ADMIN");

  useEffect(() => {
    const cable = searchParams.get("cable");
    if (cable) setSelectedCableId(cable);
  }, [searchParams]);

  useEffect(() => {
    setCustomSites(loadCustomSites());
    setCustomSitesReady(true);
  }, []);

  useEffect(() => {
    if (!customSitesReady) return;
    window.localStorage.setItem(customSitesStorageKey, JSON.stringify(customSites));
  }, [customSites, customSitesReady]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => resetRackView("auto"));
    return () => window.cancelAnimationFrame(frame);
  }, [activeRackId]);

  useEffect(() => {
    const matchingSite = siteSummaries.find((site) => site.racks.some((rack) => rack.id === activeRackId));
    if (matchingSite && matchingSite.id !== activeSiteId) {
      setActiveSiteId(matchingSite.id);
    }
  }, [activeRackId, activeSiteId, siteSummaries]);

  useEffect(() => {
    if (siteSummaries.some((site) => site.id === activeSiteId)) return;
    selectSite(siteSummaries[0]?.id || "shanghai");
  }, [activeSiteId, siteSummaries]);

  useEffect(() => {
    function onPointerMove(event: globalThis.PointerEvent) {
      const resize = paneResizeRef.current;
      if (!resize) return;
      const deltaX = event.clientX - resize.startX;
      if (resize.pane === "left") {
        setSidebarWidth(clamp(resize.startWidth + deltaX, 230, 520));
        return;
      }
      setDetailsWidth(clamp(resize.startWidth - deltaX, 320, 520));
    }

    function onPointerUp() {
      if (!paneResizeRef.current) return;
      paneResizeRef.current = null;
      document.body.classList.remove("pane-resizing");
    }

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, []);

  async function refresh() {
    const response = await fetch("/api/inventory");
    if (response.ok) setData(await response.json());
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  async function updateCableStatus(status: CableStatus) {
    if (!selectedCable) return;
    setBusy(true);
    const response = await fetch(`/api/cables/${selectedCable.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json", "x-csrf-token": csrfToken },
      body: JSON.stringify({ status })
    });
    setBusy(false);
    setMessage(response.ok ? t("patch.messageUpdated") : t("patch.messageUpdateFailed"));
    await refresh();
  }

  async function deleteSelectedDevice() {
    if (!selectedDevice || busy) return;
    if (!window.confirm(t("device.deleteConfirm", { device: selectedDevice.name }))) return;

    setBusy(true);
    const response = await fetch(`/api/devices/${selectedDevice.id}`, {
      method: "DELETE",
      headers: { "x-csrf-token": csrfToken }
    });
    setBusy(false);

    if (response.ok) {
      setMessage(t("device.deleted", { device: selectedDevice.name }));
      setSelectedDeviceId(null);
      setSelectedPortId(null);
      setSelectedCableId(null);
      await refresh();
      return;
    }

    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    setMessage(translateApiError(t, payload?.error, "device.deleteFailed"));
  }

  async function uploadPhoto(file: File) {
    const targetCableId = selectedCable?.id || selectedPortCable?.id;
    if (!targetCableId && !selectedPort) return;
    const form = new FormData();
    form.set("file", file);
    if (targetCableId) form.set("cableId", targetCableId);
    if (!targetCableId && selectedPort) form.set("portId", selectedPort.id);
    const response = await fetch("/api/photos", {
      method: "POST",
      headers: { "x-csrf-token": csrfToken },
      body: form
    });
    setMessage(response.ok ? t("patch.photoUploaded") : t("patch.photoUploadFailed"));
    await refresh();
  }

  async function sendPrintJob() {
    const printer = data.printers.find((item) => item.enabled);
    if (!printer || selectedCableIds.length === 0) return;
    setBusy(true);
    const response = await fetch("/api/printing/jobs", {
      method: "POST",
      headers: { "content-type": "application/json", "x-csrf-token": csrfToken },
      body: JSON.stringify({ printerId: printer.id, cableIds: selectedCableIds, copies: 1 })
    });
    setBusy(false);
    setMessage(response.ok ? t("patch.printSent") : t("patch.printFailed"));
  }

  function selectPortForDetails(portId: string) {
    const port = portById.get(portId);
    setSelectedPortId(portId);
    setSelectedDeviceId(port?.device.id || null);
    setSelectedCableId(findCableForPort(portId, data.cables)?.id || null);
    setSelectedDeviceTemplateSlug(null);
    setDrawerMode("details");
    setDetailsOpen(true);
  }

  function selectDeviceForDetails(deviceId: string) {
    setSelectedDeviceId(deviceId);
    setSelectedPortId(null);
    setSelectedCableId(null);
    setSelectedDeviceTemplateSlug(null);
    setDrawerMode("details");
    setDetailsOpen(true);
  }

  function selectDeviceTemplateForDetails(templateSlug: string) {
    setSelectedDeviceTemplateSlug(templateSlug);
    setSelectedDeviceId(null);
    setSelectedPortId(null);
    setSelectedCableId(null);
    setDrawerMode("details");
    setDetailsOpen(true);
  }

  function handlePortSelection(portId: string) {
    selectPortForDetails(portId);
    if (viewMode === "patch" && canEdit) {
      queuePortSelection(portId);
    }
  }

  function queuePortSelection(portId: string) {
    if (!canEdit || busy) return;
    if (findCableForPort(portId, data.cables) || findPendingConnectionForPort(portId, pendingConnections)) {
      setMessage(t("patch.portBusy"));
      return;
    }

    if (!pendingEndpointId) {
      setPendingEndpointId(portId);
      setMessage(t("patch.selectedEndpointA"));
      return;
    }

    if (pendingEndpointId === portId) {
      setPendingEndpointId(null);
      setMessage(t("patch.cancelledEndpointA"));
      return;
    }

    addPendingConnection(pendingEndpointId, portId);
  }

  function addPendingConnection(endpointAPortId: string, endpointBPortId: string) {
    if (!canEdit || busy) return;
    if (endpointAPortId === endpointBPortId) {
      setMessage(t("patch.samePort"));
      return;
    }

    const endpointA = portById.get(endpointAPortId);
    const endpointB = portById.get(endpointBPortId);
    if (!endpointA || !endpointB) {
      setMessage(t("patch.portNotFound"));
      return;
    }

    if (
      findCableForPort(endpointAPortId, data.cables) ||
      findCableForPort(endpointBPortId, data.cables) ||
      findPendingConnectionForPort(endpointAPortId, pendingConnections) ||
      findPendingConnectionForPort(endpointBPortId, pendingConnections)
    ) {
      setMessage(t("patch.portBusy"));
      return;
    }

    setPendingConnections((connections) => [
      ...connections,
      {
        id: `${endpointAPortId}-${endpointBPortId}-${Date.now()}`,
        endpointAPortId,
        endpointBPortId
      }
    ]);
    setPendingEndpointId(null);
    setViewMode("patch");
    setSelectedPortId(endpointBPortId);
    setSelectedDeviceId(endpointB.device.id);
    setSelectedCableId(null);
    setDrawerMode("details");
    setDetailsOpen(true);
    setMessage(t("patch.queued"));
  }

  async function createCableBetweenPorts(endpointAPortId: string, endpointBPortId: string): Promise<CableCreateResult> {
    const endpointA = portById.get(endpointAPortId);
    const endpointB = portById.get(endpointBPortId);
    if (!endpointA || !endpointB) {
      return { ok: false, error: t("patch.portNotFound") };
    }

    const cableId = buildDraggedCableId(endpointA, endpointB);
    const response = await fetch("/api/cables", {
      method: "POST",
      headers: { "content-type": "application/json", "x-csrf-token": csrfToken },
      body: JSON.stringify({
        cableId,
        label: `${formatEndpoint(endpointA)} -> ${formatEndpoint(endpointB)}`,
        endpointAPortId,
        endpointBPortId,
        color: "blue",
        status: "draft",
        media: "COPPER"
      })
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      return { ok: false, error: translateApiError(t, payload?.error, "patch.createFailed") };
    }

    const cable = (await response.json()) as CableDto;
    return { ok: true, cable };
  }

  async function completePendingConnections() {
    if (!canEdit || busy || pendingConnections.length === 0) return;

    setBusy(true);
    let createdCable: CableDto | null = null;
    let createdCount = 0;
    let failedMessage = "";

    for (const connection of pendingConnections) {
      const result = await createCableBetweenPorts(connection.endpointAPortId, connection.endpointBPortId);
      if (!result.ok) {
        failedMessage = result.error;
        break;
      }
      createdCable = result.cable;
      createdCount += 1;
    }

    setBusy(false);
    setPendingConnections((connections) => connections.slice(createdCount));
    setPendingEndpointId(null);

    if (createdCable) {
      setSelectedCableId(createdCable.id);
      setSelectedPortId(createdCable.endpointBPortId);
      setSelectedDeviceId(createdCable.endpointBPort.device.id);
      setSelectedDeviceTemplateSlug(null);
      setDrawerMode("details");
      setDetailsOpen(true);
    }

    setMessage(
      failedMessage
        ? t("patch.completedPartial", { count: createdCount, error: failedMessage })
        : t("patch.completed", { count: createdCount })
    );
    await refresh();
  }

  function clearPendingConnections() {
    setPendingEndpointId(null);
    setPendingConnections([]);
    setMessage(t("patch.cleared"));
  }

  function showGlobalOverview() {
    setWorkbenchMode("overview");
    setActiveRackId("");
    setSelectedDeviceId(null);
    setSelectedPortId(null);
    setSelectedCableId(null);
    setSelectedDeviceTemplateSlug(null);
    setDrawerMode("details");
    setViewMode("select");
    setMessage("");
    window.requestAnimationFrame(() => resetRackView("smooth"));
  }

  function selectSite(siteId: string) {
    const site = siteSummaries.find((item) => item.id === siteId);
    setWorkbenchMode("site");
    setActiveSiteId(siteId);
    setSelectedDeviceId(null);
    setSelectedPortId(null);
    setSelectedCableId(null);
    setSelectedDeviceTemplateSlug(null);
    setDrawerMode("details");
    if (site?.racks[0]) {
      setActiveRackId(site.racks[0].id);
      setMessage(t("patch.enteredRack", { site: siteLabel(site, t), rack: site.racks[0].code }));
      return;
    }
    setActiveRackId("");
    setMessage(t("patch.siteNoRack", { site: site ? siteLabel(site, t) : t("siteMap.site") }));
  }

  function selectRack(rackId: string) {
    setWorkbenchMode("site");
    setActiveRackId(rackId);
    setSelectedDeviceId(null);
    setSelectedPortId(null);
    setSelectedCableId(null);
    setSelectedDeviceTemplateSlug(null);
    setDrawerMode("details");
  }

  function addCustomSite(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const country = newSite.country.trim();
    const city = newSite.city.trim();
    const address = newSite.address.trim();
    if (!country || !city) {
      setMessage(t("siteManager.required"));
      return;
    }

    const site: SitePoint = {
      id: `custom-${slugify(`${country}-${city}-${address}`)}-${Date.now().toString(36)}`,
      label: city,
      country,
      city,
      address,
      aliases: [country, city, address].filter(Boolean),
      custom: true,
      ...nextCustomSitePosition(sitePoints.length)
    };
    setCustomSites((sites) => [...sites, site]);
    setNewSite({ country: "", city: "", address: "" });
    setShowNewSiteForm(false);
    setWorkbenchMode("site");
    setActiveSiteId(site.id);
    setActiveRackId("");
    setMessage(t("siteManager.added", { site: formatSiteDisplay(site, t) }));
  }

  function removeCustomSite(siteId: string) {
    const site = customSites.find((item) => item.id === siteId);
    if (!site) return;
    setCustomSites((sites) => sites.filter((item) => item.id !== siteId));
    if (activeSiteId === siteId) {
      selectSite(defaultSitePoints[0].id);
    }
    setMessage(t("siteManager.removed", { site: formatSiteDisplay(site, t) }));
  }

  function startPaneResize(pane: "left" | "right", event: PointerEvent<HTMLElement>) {
    event.preventDefault();
    event.stopPropagation();
    paneResizeRef.current = {
      pane,
      startX: event.clientX,
      startWidth: pane === "left" ? sidebarWidth : detailsWidth
    };
    document.body.classList.add("pane-resizing");
  }

  function resetRackView(behavior: ScrollBehavior = "smooth") {
    const stage = rackStageRef.current;
    setCanvasOffset({ x: 0, y: 0 });
    if (!stage) return;
    stage.scrollTo({
      left: 0,
      top: 0,
      behavior
    });
  }

  function handleRackPointerDown(event: PointerEvent<HTMLElement>) {
    if (viewMode !== "pan" || event.button !== 0) return;
    const target = event.target as HTMLElement;
    if (target.closest(".rack-view-toolbar")) return;

    const stage = event.currentTarget;
    panStartRef.current = {
      x: event.clientX,
      y: event.clientY,
      offsetX: canvasOffset.x,
      offsetY: canvasOffset.y
    };
    suppressPanClickRef.current = false;
    stage.setPointerCapture(event.pointerId);
    setIsPanning(true);
  }

  function handleRackPointerMove(event: PointerEvent<HTMLElement>) {
    if (!panStartRef.current) return;
    const deltaX = event.clientX - panStartRef.current.x;
    const deltaY = event.clientY - panStartRef.current.y;
    if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
      suppressPanClickRef.current = true;
    }
    setCanvasOffset({
      x: clamp(panStartRef.current.offsetX + deltaX, -1400, 700),
      y: clamp(panStartRef.current.offsetY + deltaY, -900, 500)
    });
  }

  function handleRackWheel(event: WheelEvent<HTMLElement>) {
    const target = event.target as HTMLElement;
    if (target.closest(".rack-view-toolbar")) return;

    event.preventDefault();
    const wheelX = event.shiftKey ? event.deltaY : event.deltaX;
    const wheelY = event.shiftKey ? 0 : event.deltaY;
    setCanvasOffset((offset) => ({
      x: clamp(offset.x - wheelX, -1400, 700),
      y: clamp(offset.y - wheelY, -900, 500)
    }));
  }

  function handleRackPointerUp(event: PointerEvent<HTMLElement>) {
    if (!panStartRef.current) return;
    panStartRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setIsPanning(false);
  }

  function handleRackClickCapture(event: MouseEvent<HTMLElement>) {
    const target = event.target as HTMLElement;
    if (target.closest(".rack-view-toolbar")) {
      suppressPanClickRef.current = false;
      return;
    }
    if (viewMode === "pan") {
      event.preventDefault();
      event.stopPropagation();
      suppressPanClickRef.current = false;
      return;
    }
    if (!suppressPanClickRef.current) return;
    suppressPanClickRef.current = false;
    event.preventDefault();
    event.stopPropagation();
  }

  const filteredCables = data.cables.filter((cable) => {
    const text = `${cable.cableId} ${cable.label} ${formatEndpoint(cable.endpointAPort)} ${formatEndpoint(cable.endpointBPort)}`.toLowerCase();
    return text.includes(query.toLowerCase()) && cableBelongsToSite(cable, activeSite || undefined);
  });

  return (
    <main className="app-shell">
      <header className="topbar">
        <button className="brand-home-button" onClick={showGlobalOverview} title={t("action.globalMap")} type="button">
          <span className="brand-home-icon" aria-hidden="true">
            <Home size={17} />
          </span>
          <span>
            <span className="eyebrow">{t("app.brand")}</span>
            <span className="brand-home-title">{t("app.dashboardTitle")}</span>
          </span>
        </button>
        <div className="search-box">
          <Search size={18} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("app.searchPlaceholder")} />
        </div>
        <div className="topbar-actions">
          <div className="language-toggle" aria-label={t("language.label")}>
            {languageOptions.map((option) => (
              <button
                key={option.value}
                className={language === option.value ? "active" : ""}
                onClick={() => setLanguage(option.value)}
                type="button"
              >
                {option.shortLabel}
              </button>
            ))}
          </div>
          <div className="theme-toggle" aria-label={t("theme.label")}>
            {themeOptions.map((option) => (
              <button
                key={option.value}
                className={theme === option.value ? "active" : ""}
                onClick={() => setTheme(option.value)}
                title={t(option.value === "light" ? "theme.light" : "theme.dark")}
                type="button"
              >
                {option.icon === "sun" ? <Sun size={16} /> : <Moon size={16} />}
              </button>
            ))}
          </div>
          <span className="user-pill">{currentUser.name} · {currentUser.role}</span>
          <button title={t("action.refresh")} onClick={refresh} className="icon-button">
            <RefreshCw size={18} />
          </button>
          <button title={t("action.logout")} onClick={logout} className="icon-button">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <section className={[
        "workspace",
        `sidebar-${sidebarSize}`,
        sidebarOpen ? "" : "sidebar-collapsed",
        detailsOpen ? "" : "details-collapsed"
      ].join(" ")}
        style={{
          "--sidebar-width": `${sidebarWidth}px`,
          "--details-width": `${detailsWidth}px`
        } as React.CSSProperties}
      >
        <aside className="sidebar">
          <div className="sidebar-header">
            <div>
              <div className="section-title">{t("sidebar.siteRack")}</div>
              <strong className="sidebar-title">{t("sidebar.navigator")}</strong>
            </div>
            <div className="sidebar-tools">
              <button
                className="pane-toggle"
                onClick={() => {
                  setSidebarSize((size) => size === "compact" ? "normal" : "compact");
                  setSidebarWidth((width) => width <= 260 ? 304 : 248);
                }}
                title={sidebarWidth <= 260 ? t("action.restoreLeftPane") : t("action.compactLeftPane")}
              >
                <Minimize2 size={15} />
              </button>
              <button
                className="pane-toggle"
                onClick={() => {
                  setSidebarSize((size) => size === "wide" ? "normal" : "wide");
                  setSidebarWidth((width) => width >= 400 ? 304 : 408);
                }}
                title={sidebarWidth >= 400 ? t("action.restoreLeftPane") : t("action.expandLeftPane")}
              >
                <Maximize2 size={15} />
              </button>
              <button className="pane-toggle" onClick={() => setSidebarOpen(false)} title={t("action.collapseLeftPane")}>
                <X size={16} />
              </button>
            </div>
          </div>
          <div className="site-manager">
            <button className="secondary-button add-site-button" onClick={() => setShowNewSiteForm((value) => !value)}>
              {showNewSiteForm ? <X size={15} /> : <Plus size={15} />}
              {showNewSiteForm ? t("siteManager.cancel") : t("siteManager.add")}
            </button>
            {showNewSiteForm ? (
              <form className="site-form" onSubmit={addCustomSite}>
                <label>
                  {t("siteManager.country")}
                  <input
                    value={newSite.country}
                    onChange={(event) => setNewSite((site) => ({ ...site, country: event.target.value }))}
                    list="site-country-options"
                  />
                </label>
                <label>
                  {t("siteManager.city")}
                  <input
                    value={newSite.city}
                    onChange={(event) => setNewSite((site) => ({ ...site, city: event.target.value }))}
                    list="site-city-options"
                  />
                </label>
                <label>
                  {t("siteManager.address")}
                  <input
                    value={newSite.address}
                    onChange={(event) => setNewSite((site) => ({ ...site, address: event.target.value }))}
                    placeholder={t("siteManager.addressPlaceholder")}
                  />
                </label>
                <datalist id="site-country-options">
                  {uniqueValues(sitePoints.map((site) => site.country)).map((country) => (
                    <option value={country} key={country} />
                  ))}
                </datalist>
                <datalist id="site-city-options">
                  {uniqueValues(sitePoints.map((site) => site.city)).map((city) => (
                    <option value={city} key={city} />
                  ))}
                </datalist>
                <button className="primary-button compact" type="submit">
                  <Plus size={15} />
                  {t("siteManager.addButton")}
                </button>
              </form>
            ) : null}
          </div>
          <div className="site-list">
            {orderedCountrySiteGroups.map((countryGroup) => (
              <section
                className={countryGroup.sites.some((site) => site.id === activeSite?.id) ? "country-group active" : "country-group"}
                key={countryGroup.country}
              >
                <div className="country-heading">
                  <strong>{countryLabel(countryGroup.country, t)}</strong>
                  <small>{formatRackLineStats(countryGroup.rackCount, countryGroup.lineCount, t)}</small>
                </div>
                <div className="city-list">
                  {countryGroup.sites.map((site) => (
                    <div className={site.id === activeSite?.id ? "city-site active" : "city-site"} key={site.id}>
                      <div className="city-row">
                        <button onClick={() => selectSite(site.id)}>
                          <span>{siteLabel(site, t)}</span>
                          <small>
                            {site.address || (site.custom ? t("siteManager.custom") : t("siteManager.default"))}
                            {" · "}
                            {formatRackLineStats(site.racks.length, site.lineCount, t)}
                          </small>
                        </button>
                        {site.custom ? (
                          <button className="delete-site-button" onClick={() => removeCustomSite(site.id)} title={t("siteManager.delete")}>
                            <Trash2 size={14} />
                          </button>
                        ) : null}
                      </div>
                      {site.racks.length ? (
                        <div className="rack-tabs">
                          {site.racks.map((rack) => (
                            <button
                              key={rack.id}
                              className={rack.id === activeRack?.id ? "rack-selected" : ""}
                              aria-current={rack.id === activeRack?.id ? "true" : undefined}
                              onClick={() => selectRack(rack.id)}
                            >
                              <strong>{rack.room} / {rack.code}</strong>
                              <small>{rack.heightU}U</small>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="site-empty">{t("sidebar.noRack")}</div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <DeviceTypeLibrary
            templates={filteredDeviceTemplates}
            selectedTemplateSlug={selectedDeviceTemplate?.slug || null}
            onSelectTemplate={selectDeviceTemplateForDetails}
            t={t}
          />

          <div className="section-title">{t("sidebar.cables")}</div>
          <div className="cable-list">
            {filteredCables.map((cable) => (
              <div key={cable.id} className={selectedCableId === cable.id ? "cable-row active" : "cable-row"}>
                <input
                  type="checkbox"
                  aria-label={t("sidebar.selectCable", { cable: cable.cableId })}
                  checked={selectedCableIds.includes(cable.id)}
                  onChange={(event) => {
                    event.stopPropagation();
                    setSelectedCableIds((ids) =>
                      ids.includes(cable.id) ? ids.filter((id) => id !== cable.id) : [...ids, cable.id]
                    );
                  }}
                  onClick={(event) => event.stopPropagation()}
                />
                <button
                  type="button"
                  className="cable-open"
                  title={cable.label}
                  onClick={() => {
                    const cableRackId = cable.endpointAPort.device.rackId || cable.endpointBPort.device.rackId || "";
                    if (cableRackId) {
                      setWorkbenchMode("site");
                      setActiveRackId(cableRackId);
                    }
                    setSelectedCableId(cable.id);
                    setSelectedDeviceId(cable.endpointAPort.device.id);
                    setSelectedPortId(null);
                    setSelectedDeviceTemplateSlug(null);
                    setDrawerMode("details");
                    setDetailsOpen(true);
                  }}
                >
                  <span className="cable-id" title={cable.cableId}>{cable.cableId}</span>
                  <span className="cable-route">
                    <span title={formatCableListEndpoint(cable.endpointAPort)}>{formatCableListEndpoint(cable.endpointAPort)}</span>
                    <span className="cable-route-arrow">-&gt;</span>
                    <span title={formatCableListEndpoint(cable.endpointBPort)}>{formatCableListEndpoint(cable.endpointBPort)}</span>
                  </span>
                </button>
                <i className={`status-dot ${cable.status}`} aria-hidden="true" />
              </div>
            ))}
            {!filteredCables.length ? (
              <div className="site-empty">{t(workbenchMode === "overview" ? "sidebar.chooseSiteCables" : "sidebar.noMatchingCables")}</div>
            ) : null}
          </div>
        </aside>

        {sidebarOpen ? (
          <div
            className="pane-resizer left-resizer"
            onPointerDown={(event) => startPaneResize("left", event)}
            role="separator"
            aria-orientation="vertical"
            title={t("action.resizeLeftPane")}
          />
        ) : null}

        {!sidebarOpen ? (
          <button className="pane-rail left" onClick={() => setSidebarOpen(true)}>
            {t("sidebar.railCables")}
          </button>
        ) : null}

        <section
          ref={rackStageRef}
          className={[
            "rack-stage",
            viewMode === "pan" ? "pan-mode" : "",
            isPanning ? "panning" : ""
          ].join(" ")}
          onPointerDown={handleRackPointerDown}
          onPointerMove={handleRackPointerMove}
          onPointerUp={handleRackPointerUp}
          onPointerCancel={handleRackPointerUp}
          onClickCapture={handleRackClickCapture}
          onWheel={handleRackWheel}
        >
          {workbenchMode === "site" && activeRack ? (
            <div className="rack-view-toolbar">
              <button
                className={viewMode === "select" ? "active" : ""}
                onClick={() => setViewMode("select")}
                title={t("toolbar.selectTitle")}
                aria-pressed={viewMode === "select"}
              >
                <MousePointer2 size={16} />
                {t("toolbar.select")}
              </button>
              <button
                className={viewMode === "patch" ? "active" : ""}
                onClick={() => {
                  setViewMode("patch");
                  setDragPortId(null);
                }}
                title={t("toolbar.patchTitle")}
                aria-pressed={viewMode === "patch"}
              >
                <Cable size={16} />
                {t("toolbar.patch")}
              </button>
              <button
                className={viewMode === "pan" ? "active" : ""}
                onClick={() => {
                  setViewMode("pan");
                  setDragPortId(null);
                }}
                title={t("toolbar.panTitle")}
                aria-pressed={viewMode === "pan"}
              >
                <Hand size={16} />
                {t("toolbar.pan")}
              </button>
              <button className="reset-view-button" onClick={() => resetRackView()} title={t("toolbar.resetView")}>
                <RotateCcw size={16} />
              </button>
              {pendingConnections.length ? (
                <>
                  <span className="patch-count">{pendingConnections.length}</span>
                  <button onClick={completePendingConnections} disabled={busy || !canEdit} title={t("action.complete")}>
                    <Check size={16} />
                    {t("action.complete")}
                  </button>
                </>
              ) : null}
            </div>
          ) : null}
          <div
            className="rack-pan-content"
            style={{
              transform: `translate3d(${canvasOffset.x}px, ${canvasOffset.y}px, 0)`
            }}
          >
            {workbenchMode === "overview" ? (
              <SiteMapNavigator
                sites={siteSummaries}
                activeSiteId={activeSite?.id || ""}
                activeRack={null}
                onSelectSite={selectSite}
                t={t}
              />
            ) : activeRack ? (
              <RackView
                rack={activeRack}
                racks={officeRackOverviewRacks}
                cables={data.cables}
                canEdit={canEdit}
                isPanMode={viewMode === "pan"}
                queuedPortIds={queuedPortIds}
                pendingEndpointId={pendingEndpointId}
                dragPortId={dragPortId}
                selectedDeviceId={selectedDevice?.id || null}
                selectedPortId={selectedPortId}
                onDragStart={(portId) => setDragPortId(portId)}
                onDragEnd={() => setDragPortId(null)}
                onDropPort={(sourcePortId, targetPortId) => {
                  setDragPortId(null);
                  addPendingConnection(sourcePortId, targetPortId);
                }}
                onSelectDevice={selectDeviceForDetails}
                onSelectRack={selectRack}
                onSelectPort={handlePortSelection}
                t={t}
              />
            ) : null}
            {workbenchMode === "site" && !activeRack ? (
              <div className="site-empty-state">
                <strong>{t("siteMap.noRackData", { site: activeSite ? siteLabel(activeSite, t) : t("siteMap.site") })}</strong>
                <span>{t("siteMap.noRackHelp")}</span>
              </div>
            ) : null}
          </div>
        </section>

        {detailsOpen ? (
          <div
            className="pane-resizer right-resizer"
            onPointerDown={(event) => startPaneResize("right", event)}
            role="separator"
            aria-orientation="vertical"
            title={t("action.resizeDetailsPane")}
          />
        ) : null}

        <aside className="details-panel">
          <div className="details-header">
            <div className="section-title">{t("details.title")}</div>
            <button className="pane-toggle" onClick={() => setDetailsOpen(false)} title={t("action.collapseDetails")}>
              <X size={16} />
            </button>
          </div>
          <div className="panel-toolbar">
            <button className="primary-button compact" onClick={() => setDrawerMode("new")} disabled={!canEdit}>
              <Cable size={16} />
              {t("action.newCable")}
            </button>
            <a className="icon-button" href="/api/exports/excel" title={t("action.exportExcel")}>
              <Download size={18} />
            </a>
            <a className="icon-button" href="/api/exports/pdf" title={t("action.exportPdf")}>
              <FileText size={18} />
            </a>
            <a
              className="icon-button"
              href={`/api/exports/labels${selectedCableIds.length ? `?ids=${selectedCableIds.join(",")}` : ""}`}
              title={t("action.labelPdf")}
            >
              <QrCode size={18} />
            </a>
            <button className="icon-button" onClick={sendPrintJob} disabled={!canReview || busy || selectedCableIds.length === 0} title={t("action.batchPrint")}>
              <Printer size={18} />
            </button>
          </div>

          {pendingEndpoint || pendingConnections.length ? (
            <PatchQueuePanel
              pendingEndpoint={pendingEndpoint}
              pendingConnections={pendingConnections}
              portById={portById}
              canEdit={canEdit}
              busy={busy}
              onCancelStart={() => {
                setPendingEndpointId(null);
                setMessage(t("patch.cancelledEndpointA"));
              }}
              onRemove={(id) => {
                setPendingConnections((connections) => connections.filter((connection) => connection.id !== id));
                setMessage(t("patch.removed"));
              }}
              onClear={clearPendingConnections}
              onComplete={completePendingConnections}
              t={t}
            />
          ) : null}

          {drawerMode === "new" ? (
            <NewCableForm ports={allPorts} csrfToken={csrfToken} t={t} onSaved={async () => {
              setDrawerMode("details");
              await refresh();
            }} />
          ) : (
            <Details
              cable={selectedCable || selectedPortCable}
              port={selectedPort}
              device={selectedDevice}
              deviceTemplate={selectedDeviceTemplate}
              cables={data.cables}
              directPeer={directPeer}
              routeEnd={routeEnd}
              trace={selectedTrace}
              canEdit={canEdit}
              canReview={canReview}
              canAdmin={canAdmin}
              busy={busy}
              queuedPortIds={queuedPortIds}
              pendingEndpointId={pendingEndpointId}
              dragPortId={dragPortId}
              selectedPortId={selectedPortId}
              onDragStart={(portId) => setDragPortId(portId)}
              onDragEnd={() => setDragPortId(null)}
              onDropPort={(sourcePortId, targetPortId) => {
                setDragPortId(null);
                addPendingConnection(sourcePortId, targetPortId);
              }}
              onSelectPort={handlePortSelection}
              onStatus={updateCableStatus}
              onDeleteDevice={deleteSelectedDevice}
              onPhoto={uploadPhoto}
              t={t}
            />
          )}

          {message ? <p className="toast">{message}</p> : null}
        </aside>

        {!detailsOpen ? (
          <button className="pane-rail right" onClick={() => setDetailsOpen(true)}>
            {t("details.rail")}
          </button>
        ) : null}
      </section>
    </main>
  );
}

function DeviceTypeLibrary({
  templates,
  selectedTemplateSlug,
  onSelectTemplate,
  t
}: {
  templates: RackulaDeviceTemplate[];
  selectedTemplateSlug: string | null;
  onSelectTemplate: (templateSlug: string) => void;
  t: Translate;
}) {
  const groups = rackulaDeviceCategoryOrder
    .map((category) => ({
      category,
      templates: templates.filter((template) => template.category === category)
    }))
    .filter((group) => group.templates.length);

  return (
    <section className="device-type-library">
      <div className="device-type-library-head">
        <div className="section-title">{t("deviceLibrary.title")}</div>
        <span>{t("deviceLibrary.count", { count: templates.length })}</span>
      </div>
      {groups.length ? (
        <div className="device-type-groups">
          {groups.map((group) => (
            <section className="device-type-group" key={group.category}>
              <div className="device-type-category">
                <strong>{rackulaDeviceCategoryLabel(group.category, t)}</strong>
                <small>{group.templates.length}</small>
              </div>
              <div className="device-type-list">
                {group.templates.map((template) => (
                  <button
                    key={template.slug}
                    type="button"
                    className={selectedTemplateSlug === template.slug ? "device-type-row active" : "device-type-row"}
                    onClick={() => onSelectTemplate(template.slug)}
                  >
                    <span className="device-type-swatch" style={{ "--device-type-color": template.color } as React.CSSProperties} />
                    <span className="device-type-row-main">
                      <strong>{template.model}</strong>
                      <small>{template.slug}</small>
                    </span>
                    <span className="device-type-tags">
                      <span>{formatRackulaTemplateHeight(template)}</span>
                      {template.slotWidth === 1 ? <span>{t("deviceLibrary.halfWidth")}</span> : null}
                      {!template.fullDepth ? <span>{t("deviceLibrary.halfDepth")}</span> : null}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="site-empty">{t("deviceLibrary.noMatches")}</div>
      )}
    </section>
  );
}

function SiteMapNavigator({
  sites,
  activeSiteId,
  activeRack,
  onSelectSite,
  t
}: {
  sites: SiteSummary[];
  activeSiteId: string;
  activeRack: RackDto | null;
  onSelectSite: (siteId: string) => void;
  t: Translate;
}) {
  const activeSite = activeSiteId ? sites.find((site) => site.id === activeSiteId) || null : null;
  const totalRackCount = sites.reduce((count, site) => count + site.racks.length, 0);
  const totalLineCount = sites.reduce((count, site) => count + site.lineCount, 0);
  const siteById = new Map(sites.map((site) => [site.id, site]));
  const visibleWanLinks = siteWanLinks
    .map((link) => {
      const from = siteById.get(link.from);
      const to = siteById.get(link.to);
      return from && to ? { ...link, fromSite: from, toSite: to } : null;
    })
    .filter(Boolean) as Array<SiteWanLink & { fromSite: SiteSummary; toSite: SiteSummary }>;
  const activeLinkSiteIds = new Set(
    visibleWanLinks
      .filter((link) => activeSite && (link.from === activeSite.id || link.to === activeSite.id))
      .flatMap((link) => [link.from, link.to])
  );

  return (
    <section className="site-map-card wan-map-card" aria-label="APAC WAN site map">
      <div className="site-map-head">
        <div>
          <div className="section-title">{t("siteMap.kicker")}</div>
          <h2>{t("siteMap.title")}</h2>
          <p>{t("siteMap.subtitle")}</p>
        </div>
        <div className="site-flow">
          <span className="active">{t("siteMap.site")}</span>
          <span className={activeRack ? "active" : ""}>{t("siteMap.rack")}</span>
          <span>{t("siteMap.device")}</span>
          <span>{t("siteMap.patchline")}</span>
        </div>
      </div>

      <div className="site-map-canvas wan-map-canvas">
        <WorldBasemap t={t} />
        <svg className="site-map-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {visibleWanLinks.flatMap((link) => {
            const circuits = link.circuits || 1;
            return Array.from({ length: circuits }, (_, index) => (
              <path
                key={`${link.from}-${link.to}-${index}`}
                className={[
                  "wan-link",
                  circuits > 1 ? "multi-circuit" : "",
                  `utilization-${link.utilization}`,
                  activeSite && (link.from === activeSite.id || link.to === activeSite.id) ? "focus" : ""
                ].join(" ")}
                d={buildWanLinkPath(link, index, circuits)}
              />
            ));
          })}
          {visibleWanLinks.filter((link) => (link.circuits || 1) > 1).map((link) => {
            const labelPoint = getWanLinkLabelPoint(link);
            return (
              <text key={`${link.from}-${link.to}-label`} className="wan-link-count" x={labelPoint.x} y={labelPoint.y}>
                {link.circuits}x
              </text>
            );
          })}
          {sites.map((site) => {
            const anchor = getSiteAnchor(site);
            return (
              <path
                key={`${site.id}-leader`}
                className="geo-site-leader"
                d={`M${anchor.x} ${anchor.y} L${site.x} ${site.y}`}
              />
            );
          })}
        </svg>
        {sites.map((site) => (
          <button
            key={site.id}
            className={[
              "site-node",
              "geo-callout",
              site.id === activeSite?.id ? "active" : "",
              site.racks.length ? "ready" : "empty",
              activeLinkSiteIds.has(site.id) ? "linked" : ""
            ].join(" ")}
            style={{
              "--site-x": `${site.x}%`,
              "--site-y": `${site.y}%`,
              "--site-accent": getSiteAccent(site)
            } as React.CSSProperties}
            onClick={() => onSelectSite(site.id)}
            aria-label={`${formatSiteDisplay(site, t)} · ${site.racks.length ? t("siteMap.nodeStats", { racks: site.racks.length, devices: site.deviceCount, lines: site.lineCount }) : t("siteMap.notImported")}`}
          >
            <em>{countryLabel(site.country, t)}</em>
            <strong>{siteLabel(site, t)}</strong>
            {site.racks.length ? <span>{t("siteMap.nodeStatsMini", { racks: site.racks.length, devices: site.deviceCount, lines: site.lineCount })}</span> : null}
          </button>
        ))}
        {sites.map((site) => {
          const anchor = getSitePinPosition(site);
          return (
            <button
              key={`${site.id}-pin`}
              className={["geo-pin", site.id === activeSite?.id ? "active" : "", site.racks.length ? "ready" : "empty"].join(" ")}
              style={{
                "--pin-x": `${anchor.x}%`,
                "--pin-y": `${anchor.y}%`,
                "--site-accent": getSiteAccent(site)
              } as React.CSSProperties}
              onClick={() => onSelectSite(site.id)}
              aria-label={`${formatSiteDisplay(site, t)} · ${site.racks.length ? t("siteMap.nodeStats", { racks: site.racks.length, devices: site.deviceCount, lines: site.lineCount }) : t("siteMap.notImported")}`}
            />
          );
        })}
      </div>

      <div className="link-utilization-legend">
        <strong>{t("siteMap.linkUtilization")}</strong>
        <div>
          {linkUtilizationLegend.map((item) => (
            <span key={item.utilization}>
              <i className={`utilization-${item.utilization}`} />
              {item.labelKey ? t(item.labelKey) : item.label}
            </span>
          ))}
        </div>
      </div>

      <div className="site-map-footer">
        <div>
          <span>{activeSite ? t("siteMap.activeSite") : t("siteMap.globalOverview")}</span>
          <strong>{activeSite ? formatSiteDisplay(activeSite, t) : t("siteMap.globalMapHome")}</strong>
          {activeSite?.address ? <small>{t("siteMap.address")}: {activeSite.address}</small> : null}
        </div>
        <div>
          <span>
            {activeSite
              ? t("siteMap.rackSummary", { racks: activeSite.racks.length, devices: activeSite.deviceCount, lines: activeSite.lineCount })
              : t("siteMap.globalSummary", { sites: sites.length, racks: totalRackCount, lines: totalLineCount })}
          </span>
          <strong>
            {activeRack
              ? t("siteMap.activeRackSummary", { room: activeRack.room, rack: activeRack.code, devices: activeRack.devices.length })
              : activeSite
                ? t("siteMap.noRackSelected")
                : t("siteMap.chooseSite")}
          </strong>
        </div>
      </div>
    </section>
  );
}

function WorldBasemap({ t }: { t: Translate }) {
  return (
    <svg className="real-world-map" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <rect className="map-ocean" x="0" y="0" width="100" height="100" />
      <g className="map-graticule">
        {mapMeridians.map((longitude) => (
          <path key={`lon-${longitude}`} d={buildLongitudeLine(longitude)} />
        ))}
        {mapParallels.map((latitude) => (
          <path key={`lat-${latitude}`} d={buildLatitudeLine(latitude)} />
        ))}
      </g>
      <g className="world-land">
        {worldMapPaths.map((path, index) => (
          <path key={index} d={path} fillRule="evenodd" />
        ))}
      </g>
      <g className="map-labels">
        {mapLabels.map((label) => {
          const point = projectMapPoint(label.lon, label.lat);
          return (
            <text
              key={label.key}
              className={`map-label ${label.kind}`}
              x={point.x + (label.dx || 0)}
              y={point.y + (label.dy || 0)}
            >
              {t(label.key)}
            </text>
          );
        })}
      </g>
    </svg>
  );
}

const mapMeridians = [-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150];
const mapParallels = [-45, -20, 0, 20, 40, 60];
const mapLabels: Array<{ key: TranslationKey; lon: number; lat: number; kind: "land" | "water"; dx?: number; dy?: number }> = [
  { key: "mapLabel.northAmerica", lon: -102, lat: 44, kind: "land" },
  { key: "mapLabel.southAmerica", lon: -61, lat: -18, kind: "land" },
  { key: "mapLabel.europe", lon: 18, lat: 49, kind: "land" },
  { key: "mapLabel.russia", lon: 70, lat: 55, kind: "land" },
  { key: "mapLabel.kazakhstan", lon: 67, lat: 47, kind: "land" },
  { key: "mapLabel.india", lon: 78, lat: 22, kind: "land" },
  { key: "mapLabel.china", lon: 104, lat: 34, kind: "land", dy: 1.5 },
  { key: "mapLabel.australia", lon: 134, lat: -25, kind: "land" },
  { key: "mapLabel.indonesia", lon: 119, lat: -4, kind: "land", dy: 2 },
  { key: "mapLabel.atlanticOcean", lon: -35, lat: 7, kind: "water" },
  { key: "mapLabel.indianOcean", lon: 70, lat: -21, kind: "water" },
  { key: "mapLabel.southChinaSea", lon: 115, lat: 14, kind: "water", dy: 1.8 },
  { key: "mapLabel.pacificOcean", lon: 150, lat: 4, kind: "water" }
];

function buildLongitudeLine(longitude: number) {
  const points = [worldMapViewport.minLat, -20, 0, 20, 40, worldMapViewport.maxLat]
    .map((latitude) => projectMapPoint(longitude, latitude));
  return points.map((point, index) => `${index ? "L" : "M"}${point.x} ${point.y}`).join("");
}

function buildLatitudeLine(latitude: number) {
  const points = [worldMapViewport.minLon, -120, -60, 0, 60, 120, worldMapViewport.maxLon]
    .map((longitude) => projectMapPoint(longitude, latitude));
  return points.map((point, index) => `${index ? "L" : "M"}${point.x} ${point.y}`).join("");
}

function getSiteAnchor(site: SiteSummary | SitePoint) {
  return {
    x: site.geoX ?? site.x,
    y: site.geoY ?? site.y
  };
}

function getSitePinPosition(site: SiteSummary | SitePoint) {
  const anchor = getSiteAnchor(site);
  const closeSiteOffsets: Record<string, { x: number; y: number }> = {
    jakarta: { x: -0.55, y: 0.45 },
    subang: { x: 0.55, y: -0.45 }
  };
  const offset = closeSiteOffsets[site.id] || { x: 0, y: 0 };
  return {
    x: clamp(anchor.x + offset.x, 1, 99),
    y: clamp(anchor.y + offset.y, 1, 99)
  };
}

function getSiteAccent(site: Pick<SitePoint, "id" | "country">) {
  const siteAccents: Record<string, string> = {
    shanghai: "#0a84ff",
    yanzhou: "#5856d6",
    shenzhou: "#7c3aed",
    jiaozuo: "#00a6c8",
    singapore: "#34c759",
    sydney: "#ffcc00",
    seoul: "#4f7cff",
    tokyo: "#00c7be",
    bangkok: "#ff9f0a",
    milan: "#ff6b35",
    jakarta: "#30d158",
    subang: "#bfde42"
  };
  if (siteAccents[site.id]) {
    return siteAccents[site.id];
  }
  const countryAccents: Record<string, string> = {
    China: "#0a84ff",
    Singapore: "#34c759",
    Australia: "#ffcc00",
    Korea: "#4f7cff",
    Japan: "#00c7be",
    Thailand: "#ff9f0a",
    Italy: "#ff6b35",
    Indonesia: "#30d158"
  };
  return countryAccents[site.country] || "#8e8e93";
}

function buildWanLinkPath(link: SiteWanLink & { fromSite: SiteSummary; toSite: SiteSummary }, circuitIndex = 0, circuitCount = 1) {
  const fromAnchor = getSiteAnchor(link.fromSite);
  const toAnchor = getSiteAnchor(link.toSite);
  const parallelOffset = circuitCount > 1 ? (circuitIndex - (circuitCount - 1) / 2) * 1.2 : 0;
  const dx = toAnchor.x - fromAnchor.x;
  const dy = toAnchor.y - fromAnchor.y;
  const length = Math.hypot(dx, dy) || 1;
  const normalX = -dy / length;
  const normalY = dx / length;
  const points = [
    fromAnchor,
    ...(link.route || []).map((point) => projectMapPoint(point.lon, point.lat)),
    toAnchor
  ].map((point) => ({
    x: point.x + normalX * parallelOffset,
    y: point.y + normalY * parallelOffset
  }));

  return buildSmoothCablePath(points);
}

function buildSmoothCablePath(points: Array<{ x: number; y: number }>) {
  if (points.length < 2) {
    return "";
  }

  const command = [`M${roundPathPoint(points[0].x)} ${roundPathPoint(points[0].y)}`];
  for (let index = 1; index < points.length; index++) {
    const previous = points[index - 1];
    const current = points[index];
    const beforePrevious = points[index - 2] || previous;
    const afterCurrent = points[index + 1] || current;
    const controlOne = {
      x: previous.x + (current.x - beforePrevious.x) / 6,
      y: previous.y + (current.y - beforePrevious.y) / 6
    };
    const controlTwo = {
      x: current.x - (afterCurrent.x - previous.x) / 6,
      y: current.y - (afterCurrent.y - previous.y) / 6
    };
    command.push(`C${roundPathPoint(controlOne.x)} ${roundPathPoint(controlOne.y)}, ${roundPathPoint(controlTwo.x)} ${roundPathPoint(controlTwo.y)}, ${roundPathPoint(current.x)} ${roundPathPoint(current.y)}`);
  }
  return command.join(" ");
}

function roundPathPoint(value: number) {
  return Math.round(value * 10) / 10;
}

function getWanLinkLabelPoint(link: SiteWanLink & { fromSite: SiteSummary; toSite: SiteSummary }) {
  const from = link.fromSite;
  const to = link.toSite;
  const fromAnchor = getSiteAnchor(from);
  const toAnchor = getSiteAnchor(to);
  return {
    x: Math.round((((fromAnchor.x + toAnchor.x) / 2) + (link.labelDx || 0)) * 10) / 10,
    y: Math.round((((fromAnchor.y + toAnchor.y) / 2) - 3.2 + (link.labelDy || 0)) * 10) / 10
  };
}

function RackView({
  rack,
  racks,
  cables,
  canEdit,
  isPanMode,
  queuedPortIds,
  pendingEndpointId,
  dragPortId,
  selectedDeviceId,
  selectedPortId,
  onDragStart,
  onDragEnd,
  onDropPort,
  onSelectDevice,
  onSelectRack,
  onSelectPort,
  t
}: {
  rack: RackDto;
  racks?: RackDto[];
  cables: CableDto[];
  canEdit: boolean;
  isPanMode: boolean;
  queuedPortIds: Set<string>;
  pendingEndpointId: string | null;
  dragPortId: string | null;
  selectedDeviceId: string | null;
  selectedPortId: string | null;
  onDragStart: (portId: string) => void;
  onDragEnd: () => void;
  onDropPort: (sourcePortId: string, targetPortId: string) => void;
  onSelectDevice: (deviceId: string) => void;
  onSelectRack: (rackId: string) => void;
  onSelectPort: (portId: string) => void;
  t: Translate;
}) {
  return (
    <div className="rack-workbench">
      <RackCabinetOverview
        activeRack={rack}
        racks={racks?.length ? racks : [rack]}
        cables={cables}
        canEdit={canEdit}
        isPanMode={isPanMode}
        queuedPortIds={queuedPortIds}
        pendingEndpointId={pendingEndpointId}
        dragPortId={dragPortId}
        selectedDeviceId={selectedDeviceId}
        selectedPortId={selectedPortId}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDropPort={onDropPort}
        onSelectDevice={onSelectDevice}
        onSelectRack={onSelectRack}
        onSelectPort={onSelectPort}
        t={t}
      />
    </div>
  );
}

function RackCabinetOverview({
  activeRack,
  racks,
  cables,
  canEdit,
  isPanMode,
  queuedPortIds,
  pendingEndpointId,
  dragPortId,
  selectedDeviceId,
  selectedPortId,
  onDragStart,
  onDragEnd,
  onDropPort,
  onSelectDevice,
  onSelectRack,
  onSelectPort,
  t
}: {
  activeRack: RackDto;
  racks: RackDto[];
  cables: CableDto[];
  canEdit: boolean;
  isPanMode: boolean;
  queuedPortIds: Set<string>;
  pendingEndpointId: string | null;
  dragPortId: string | null;
  selectedDeviceId: string | null;
  selectedPortId: string | null;
  onDragStart: (portId: string) => void;
  onDragEnd: () => void;
  onDropPort: (sourcePortId: string, targetPortId: string) => void;
  onSelectDevice: (deviceId: string) => void;
  onSelectRack: (rackId: string) => void;
  onSelectPort: (portId: string) => void;
  t: Translate;
}) {
  const displayRacks = racks.slice(0, officeRackOverviewLimit);
  const selectedPortDeviceId = displayRacks.flatMap((rack) => rack.devices).find((device) => device.ports.some((port) => port.id === selectedPortId))?.id;
  const selectedDeviceRackId = displayRacks.find((rack) => rack.devices.some((device) => device.id === selectedDeviceId))?.id;
  const activeDeviceId = (selectedDeviceRackId ? selectedDeviceId || selectedPortDeviceId : selectedPortDeviceId) || undefined;
  const title = displayRacks.length > 1
    ? t("rack.officeTitle", { room: activeRack.room, count: displayRacks.length })
    : `${activeRack.room} / ${activeRack.code}`;

  return (
    <section
      className="cabinet-overview"
      aria-label={`${activeRack.room} rack overview`}
      style={{ "--office-rack-count": displayRacks.length } as React.CSSProperties}
    >
      <div className="cabinet-title">
        <div>
          <span className="section-title">{t("rack.layout")}</span>
          <h2>{title}</h2>
        </div>
        <p>{t(displayRacks.length === 1 ? "rack.officeOverview.one" : "rack.officeOverview.other", { count: displayRacks.length })}</p>
      </div>
      <div className="cabinet-faces">
        {displayRacks.map((rack) => (
          <RackFace
            key={rack.id}
            label={`${rack.code} · ${t("rack.frontShort")}`}
            isActive={rack.id === activeRack.id}
            rackHeight={rack.heightU}
            devices={rack.devices.filter((device) => (device.face || "front") !== "rear")}
            cables={cables}
            canEdit={canEdit}
            isPanMode={isPanMode}
            queuedPortIds={queuedPortIds}
            pendingEndpointId={pendingEndpointId}
            dragPortId={dragPortId}
            selectedDeviceId={activeDeviceId}
            selectedPortId={selectedPortId}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onDropPort={onDropPort}
            onSelectDevice={(deviceId) => {
              onSelectRack(rack.id);
              onSelectDevice(deviceId);
            }}
            onSelectPort={onSelectPort}
          />
        ))}
      </div>
    </section>
  );
}

function RackFace({
  label,
  isActive,
  rackHeight,
  devices,
  cables,
  canEdit,
  isPanMode,
  queuedPortIds,
  pendingEndpointId,
  dragPortId,
  selectedDeviceId,
  selectedPortId,
  onDragStart,
  onDragEnd,
  onDropPort,
  onSelectDevice,
  onSelectPort
}: {
  label: string;
  isActive: boolean;
  rackHeight: number;
  devices: DeviceDto[];
  cables: CableDto[];
  canEdit: boolean;
  isPanMode: boolean;
  queuedPortIds: Set<string>;
  pendingEndpointId: string | null;
  dragPortId: string | null;
  selectedDeviceId?: string;
  selectedPortId: string | null;
  onDragStart: (portId: string) => void;
  onDragEnd: () => void;
  onDropPort: (sourcePortId: string, targetPortId: string) => void;
  onSelectDevice: (deviceId: string) => void;
  onSelectPort: (portId: string) => void;
}) {
  const units = Array.from({ length: rackHeight }, (_, index) => rackHeight - index);
  const selectDeviceFromShell = (deviceId: string, target: EventTarget | null) => {
    if (target instanceof HTMLElement && target.closest(".port-button")) return;
    onSelectDevice(deviceId);
  };

  return (
    <div className={isActive ? "cabinet-face active" : "cabinet-face"}>
      <div className="cabinet-face-label">{label}</div>
      <div className="cabinet-grid" style={{ "--rack-units": rackHeight } as React.CSSProperties}>
        <div className="cabinet-numbers left">
          {units.map((unit) => <span key={`left-${unit}`}>{unit}</span>)}
        </div>
        <div className="cabinet-bay">
          {units.map((unit) => <span className="cabinet-u-line" key={unit} />)}
          {devices.filter((device) => device.uPosition).map((device) => {
            const position = Math.max(1, Math.min(rackHeight, device.uPosition || 1));
            const height = Math.max(1, Math.min(device.uHeight || 1, rackHeight - position + 1));
            const startRow = rackHeight - (position + height - 1) + 1;
            const category = getRackDeviceCategory(device);

            return (
              <div
                key={device.id}
                role="button"
                tabIndex={0}
                className={[
                  "cabinet-device",
                  category,
                  selectedDeviceId === device.id ? "selected" : ""
                ].join(" ")}
                style={{ gridRow: `${startRow} / span ${height}` }}
                onClick={(event) => {
                  selectDeviceFromShell(device.id, event.target);
                }}
                onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
                  if (event.key !== "Enter" && event.key !== " ") return;
                  if (event.target instanceof HTMLElement && event.target.closest(".port-button")) return;
                  event.preventDefault();
                  onSelectDevice(device.id);
                }}
                aria-label={`${device.name} rack device`}
              >
                <RackDeviceFaceplate
                  device={device}
                  height={height}
                  cables={cables}
                  canEdit={canEdit}
                  isPanMode={isPanMode}
                  queuedPortIds={queuedPortIds}
                  pendingEndpointId={pendingEndpointId}
                  dragPortId={dragPortId}
                  selectedPortId={selectedPortId}
                  onDragStart={onDragStart}
                  onDragEnd={onDragEnd}
                  onDropPort={onDropPort}
                  onSelectPort={onSelectPort}
                />
              </div>
            );
          })}
        </div>
        <div className="cabinet-numbers right">
          {units.map((unit) => <span key={`right-${unit}`}>{unit}</span>)}
        </div>
      </div>
    </div>
  );
}

function RackDeviceFaceplate({
  device,
  height,
  cables,
  canEdit,
  isPanMode,
  queuedPortIds,
  pendingEndpointId,
  dragPortId,
  selectedPortId,
  onDragStart,
  onDragEnd,
  onDropPort,
  onSelectPort
}: {
  device: DeviceDto;
  height: number;
  cables: CableDto[];
  canEdit: boolean;
  isPanMode: boolean;
  queuedPortIds: Set<string>;
  pendingEndpointId: string | null;
  dragPortId: string | null;
  selectedPortId: string | null;
  onDragStart: (portId: string) => void;
  onDragEnd: () => void;
  onDropPort: (sourcePortId: string, targetPortId: string) => void;
  onSelectPort: (portId: string) => void;
}) {
  const ciscoTemplate = getCiscoDeviceTemplate(device);
  const category = getRackDeviceCategory(device);

  if (ciscoTemplate?.kind === "router") {
    const groups = (ciscoTemplate.routerGroups || []).slice(0, Math.max(2, height * 2));
    return (
      <div className="rack-device-faceplate router rack-device-physical-face" aria-label={`${device.name} front panel`}>
        <div className="rack-physical-controls" aria-hidden="true">
          <span className="rack-mini-led" />
          <span className="rack-control-port" />
          <span className="rack-control-slot" />
        </div>
        <div className="rack-mini-router-groups" aria-hidden="true">
          {groups.map((group) => (
            <span key={group.id} />
          ))}
        </div>
      </div>
    );
  }

  if (ciscoTemplate) {
    const switchPorts = getCiscoSwitchPorts(device, ciscoTemplate.downlinkPorts);
    const downlinkGroup = ciscoTemplate.panelGroups[0];
    const uplinkGroup = ciscoTemplate.panelGroups[1];
    const banks = groupCiscoPortsByBank(switchPorts.downlinks, downlinkGroup?.bankSize ?? 12);
    return (
      <div className="rack-device-faceplate switch rack-embedded-switch" aria-label={`${device.name} front panel`}>
        <div className="rack-embedded-cisco-panel" aria-label={`${device.name} front panel`}>
          <div className="rack-embedded-controls" aria-hidden="true">
            <span className="rack-mini-led" />
            <span className="rack-embedded-mode">MODE</span>
          </div>
          <div className="rack-embedded-banks">
            {banks.map((bank) => (
              <div className="rack-embedded-bank" key={bank.id}>
                <PortGrid
                  ports={bank.ports}
                  cables={cables}
                  canEdit={canEdit}
                  isPanMode={isPanMode}
                  queuedPortIds={queuedPortIds}
                  pendingEndpointId={pendingEndpointId}
                  dragPortId={dragPortId}
                  selectedPortId={selectedPortId}
                  onDragStart={onDragStart}
                  onDragEnd={onDragEnd}
                  onDropPort={onDropPort}
                  onSelectPort={onSelectPort}
                  className="rack-embedded-downlink-grid"
                  columns={downlinkGroup?.columns ?? 6}
                />
              </div>
            ))}
          </div>
          {switchPorts.uplinks.length ? (
            <PortGrid
              ports={switchPorts.uplinks}
              cables={cables}
              canEdit={canEdit}
              isPanMode={isPanMode}
              queuedPortIds={queuedPortIds}
              pendingEndpointId={pendingEndpointId}
              dragPortId={dragPortId}
              selectedPortId={selectedPortId}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onDropPort={onDropPort}
              onSelectPort={onSelectPort}
              className="rack-embedded-uplink-grid"
              columns={uplinkGroup?.columns ?? Math.min(4, switchPorts.uplinks.length || 1)}
            />
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className={`rack-device-faceplate ${category} rack-device-physical-face`} aria-label={`${device.name} front panel`}>
      <div className="rack-physical-controls" aria-hidden="true">
        <span className="rack-mini-led" />
        <span className="rack-control-port" />
        <span className="rack-control-slot" />
      </div>
      <div className="rack-generic-slots" aria-hidden="true">
        {Array.from({ length: Math.min(12, Math.max(2, device.ports.length || height * 2)) }, (_, index) => (
          <span key={index} />
        ))}
      </div>
    </div>
  );
}

function DevicePanel({
  device,
  cables,
  canEdit,
  isPanMode,
  queuedPortIds,
  pendingEndpointId,
  dragPortId,
  selectedPortId,
  onDragStart,
  onDragEnd,
  onDropPort,
  onSelectPort,
  t
}: {
  device: DeviceDto;
  cables: CableDto[];
  canEdit: boolean;
  isPanMode: boolean;
  queuedPortIds: Set<string>;
  pendingEndpointId: string | null;
  dragPortId: string | null;
  selectedPortId: string | null;
  onDragStart: (portId: string) => void;
  onDragEnd: () => void;
  onDropPort: (sourcePortId: string, targetPortId: string) => void;
  onSelectPort: (portId: string) => void;
  t: Translate;
}) {
  const ciscoTemplate = getCiscoDeviceTemplate(device);

  if (isPanduitRearDevice(device)) {
    const banks = groupPortsByBankSize(sortPortsByPosition(device.ports), 24);

    return (
      <div className="device-panel panduit-rear-panel">
        <div className="device-meta">
          <span>U{device.uPosition ?? "-"}</span>
          <strong>{device.name}</strong>
          <small>{device.model}</small>
        </div>
        <div className="panduit-rear-shell" aria-label={`${device.name} rear cable manager`}>
          <div className="panduit-brand">
            <strong>PANDUIT</strong>
            <span>Rear cable manager</span>
          </div>
          <div className="panduit-bank-list">
            {banks.map((bank) => (
              <div className="panduit-port-bank" key={bank.id}>
                <div className="panduit-bank-label">
                  <strong>{bank.label}</strong>
                  <span>{t("rack.rearDrop")}</span>
                </div>
                <PortGrid
                  ports={bank.ports}
                  cables={cables}
                  canEdit={canEdit}
                  isPanMode={isPanMode}
                  queuedPortIds={queuedPortIds}
                  pendingEndpointId={pendingEndpointId}
                  dragPortId={dragPortId}
                  selectedPortId={selectedPortId}
                  onDragStart={onDragStart}
                  onDragEnd={onDragEnd}
                  onDropPort={onDropPort}
                  onSelectPort={onSelectPort}
                  className="panduit-port-grid"
                  columns={12}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (ciscoTemplate) {
    if (ciscoTemplate.kind === "router") {
      return (
        <div className="device-panel cisco-router-panel">
          <div className="device-meta cisco-meta">
            <span>U{device.uPosition ?? "-"}</span>
            <strong>{device.name}</strong>
            <small>{device.model || ciscoTemplate.title}</small>
            <a href={ciscoTemplate.sourceUrl} target="_blank" rel="noreferrer">
              {t("rack.ciscoTemplate")}
            </a>
          </div>
          <div className="router-front-panel" aria-label={`${device.name} front panel`}>
            <div className="router-face-title">
              <strong>{ciscoTemplate.sku}</strong>
              <span>{ciscoTemplate.family}</span>
            </div>
            {(ciscoTemplate.routerGroups || []).map((group) => {
              const groupPorts = getPortsByCiscoNames(device.ports, group.portNames || []);
              const columns = group.columns ?? Math.max(groupPorts.length, group.slotLabels?.length ?? 1);

              return (
                <div className="router-panel-group" key={group.id}>
                  <div className="router-group-label">
                    <strong>{group.label}</strong>
                  </div>
                  {group.portNames ? (
                    groupPorts.length ? (
                      <PortGrid
                        ports={groupPorts}
                        cables={cables}
                        canEdit={canEdit}
                        isPanMode={isPanMode}
                        queuedPortIds={queuedPortIds}
                        pendingEndpointId={pendingEndpointId}
                        dragPortId={dragPortId}
                        selectedPortId={selectedPortId}
                        onDragStart={onDragStart}
                        onDragEnd={onDragEnd}
                        onDropPort={onDropPort}
                        onSelectPort={onSelectPort}
                        className="router-port-grid"
                        columns={columns}
                      />
                    ) : (
                      <div className="router-slot-grid" style={{ "--slot-columns": columns } as React.CSSProperties}>
                        {group.portNames.map((portName, index) => (
                          <span className="router-slot muted-slot" key={`${group.id}-${portName}-${index}`}>
                            {formatCiscoPortShortName(portName)}
                          </span>
                        ))}
                      </div>
                    )
                  ) : (
                    <div className="router-slot-grid" style={{ "--slot-columns": columns } as React.CSSProperties}>
                      {(group.slotLabels || []).map((slotLabel, index) => (
                        <span className="router-slot" key={`${group.id}-${slotLabel}-${index}`}>{slotLabel}</span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    const downlinkGroup = ciscoTemplate.panelGroups[0];
    const switchPorts = getCiscoSwitchPorts(device, ciscoTemplate.downlinkPorts);
    const downlinkBanks = groupCiscoPortsByBank(switchPorts.downlinks, downlinkGroup?.bankSize ?? 12);
    const uplinkPorts = switchPorts.uplinks;
    return (
      <div className="device-panel cisco-switch-panel">
        <div className="device-meta cisco-meta">
          <span>U{device.uPosition ?? "-"}</span>
          <strong>{device.name}</strong>
          <small>{device.model || ciscoTemplate.title}</small>
          <a href={ciscoTemplate.sourceUrl} target="_blank" rel="noreferrer">
            {t("rack.ciscoTemplate")}
          </a>
        </div>
        {ciscoTemplate.officialImageUrl ? (
          <figure className="cisco-official-reference">
            <img
              src={ciscoTemplate.officialImageUrl}
              alt={ciscoTemplate.officialImageAlt || ciscoTemplate.title}
              draggable={false}
            />
            <figcaption>
              <span>{t("rack.ciscoHardwareImage")}</span>
              <a href={ciscoTemplate.sourceUrl} target="_blank" rel="noreferrer">
                {ciscoTemplate.sourceLabel}
              </a>
            </figcaption>
          </figure>
        ) : null}
        <div className="cisco-front-panel" aria-label={`${device.name} front panel`}>
          <div className="cisco-controls" aria-hidden="true">
            <span className="uid-led" />
            <span className="mode-pill">MODE</span>
            <span className="console-slot" />
          </div>
          <div>
            <div className="panel-label">
              <strong>{ciscoTemplate.sku}</strong>
              <span>{ciscoTemplate.downlinkDescription}</span>
            </div>
            <div className="cisco-downlink-banks">
              {downlinkBanks.map((bank) => (
                <div className="cisco-port-bank" key={bank.id}>
                  <div className="bank-top-strip" aria-hidden="true" />
                  <PortGrid
                    ports={bank.ports}
                    cables={cables}
                    canEdit={canEdit}
                    isPanMode={isPanMode}
                    queuedPortIds={queuedPortIds}
                    pendingEndpointId={pendingEndpointId}
                    dragPortId={dragPortId}
                    selectedPortId={selectedPortId}
                    onDragStart={onDragStart}
                    onDragEnd={onDragEnd}
                    onDropPort={onDropPort}
                    onSelectPort={onSelectPort}
                    className="cisco-downlink-grid"
                    columns={downlinkGroup?.columns ?? 6}
                  />
                  <div className="bank-label">
                    <span>{bank.start}</span>
                    <span>{bank.end}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="panel-label">
              <strong>NM</strong>
              <span>{ciscoTemplate.uplinkDescription}</span>
            </div>
            <PortGrid
              ports={uplinkPorts}
              cables={cables}
              canEdit={canEdit}
              isPanMode={isPanMode}
              queuedPortIds={queuedPortIds}
              pendingEndpointId={pendingEndpointId}
              dragPortId={dragPortId}
              selectedPortId={selectedPortId}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onDropPort={onDropPort}
              onSelectPort={onSelectPort}
              className="cisco-uplink-grid"
              columns={ciscoTemplate.panelGroups[1]?.columns ?? 4}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`device-panel ${device.type.toLowerCase()}`}>
      <div className="device-meta">
        <span>U{device.uPosition ?? "-"}</span>
        <strong>{device.name}</strong>
        <small>{device.model}</small>
      </div>
      <PortGrid
        ports={device.ports}
        cables={cables}
        canEdit={canEdit}
        isPanMode={isPanMode}
        queuedPortIds={queuedPortIds}
        pendingEndpointId={pendingEndpointId}
        dragPortId={dragPortId}
        selectedPortId={selectedPortId}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDropPort={onDropPort}
        onSelectPort={onSelectPort}
        className="port-grid"
        columns={12}
      />
    </div>
  );
}

function getPortsByCiscoNames(ports: PortDto[], names: string[]) {
  const portByName = new Map<string, PortDto>();
  for (const port of ports) {
    portByName.set(port.name.toLowerCase(), port);
    portByName.set(formatCiscoPortShortName(port.name).toLowerCase(), port);
  }

  return names
    .map((name) => portByName.get(name.toLowerCase()) || portByName.get(formatCiscoPortShortName(name).toLowerCase()))
    .filter(Boolean) as PortDto[];
}

function getCiscoSwitchPorts(device: DeviceDto, downlinkCount: number) {
  const physicalPorts = sortCiscoPortsLeftToRight(device.ports.filter((port) => getCiscoPortNumber(port.name)));
  const detectedDownlinks = sortCiscoPortsLeftToRight(device.ports.filter((port) => isCiscoDownlinkPort(port.name)));

  if (!physicalPorts.length) {
    return { downlinks: [] as PortDto[], uplinks: [] as PortDto[] };
  }

  const downlinks = detectedDownlinks.length
    ? detectedDownlinks.slice(0, downlinkCount)
    : physicalPorts.slice(0, downlinkCount);
  const downlinkIds = new Set(downlinks.map((port) => port.id));

  const uplinks = sortCiscoPortsLeftToRight([
    ...physicalPorts.filter((port) => !downlinkIds.has(port.id) && isCiscoUplinkPort(port.name)),
    ...physicalPorts.filter((port) => !downlinkIds.has(port.id) && !isCiscoUplinkPort(port.name))
  ]);

  return { downlinks, uplinks };
}

function isPanduitRearDevice(device: DeviceDto) {
  const text = `${device.vendor || ""} ${device.model || ""} ${device.name}`.toUpperCase();
  return device.face === "rear" && text.includes("PANDUIT");
}

function sortPortsByPosition<T extends { name: string; portNumber?: number | null }>(ports: T[]) {
  return [...ports].sort((a, b) => {
    const aNumber = a.portNumber ?? Number(a.name.match(/\d+/)?.[0] || 0);
    const bNumber = b.portNumber ?? Number(b.name.match(/\d+/)?.[0] || 0);
    return aNumber - bNumber || a.name.localeCompare(b.name);
  });
}

function groupPortsByBankSize<T extends { name: string; portNumber?: number | null }>(ports: T[], size: number) {
  const groups: Array<{ id: string; label: string; ports: T[] }> = [];
  for (let index = 0; index < ports.length; index += size) {
    const groupPorts = ports.slice(index, index + size);
    const start = index + 1;
    const end = index + groupPorts.length;
    groups.push({
      id: `${start}-${end}`,
      label: `P${String(start).padStart(2, "0")}-P${String(end).padStart(2, "0")}`,
      ports: groupPorts
    });
  }
  return groups;
}

function buildSiteSummaries(sites: SitePoint[], racks: RackDto[], cables: CableDto[]): SiteSummary[] {
  return sites.map((site) => {
    const siteRacks = racks
      .filter((rack) => rackMatchesSite(rack, site))
      .sort((a, b) => a.code.localeCompare(b.code));
    const lineCount = cables.filter((cable) => cableBelongsToRacks(cable, siteRacks)).length;
    const deviceCount = siteRacks.reduce((sum, rack) => sum + rack.devices.length, 0);

    return {
      ...site,
      racks: siteRacks,
      lineCount,
      deviceCount
    };
  });
}

function getOfficeRackOverviewRacks(activeRack: RackDto | null, siteRacks: RackDto[]) {
  if (!activeRack) return [];
  const racks = siteRacks.length ? siteRacks : [activeRack];
  if (racks.length <= officeRackOverviewLimit) return racks;
  const activeIndex = Math.max(0, racks.findIndex((rack) => rack.id === activeRack.id));
  const start = clamp(activeIndex - 1, 0, racks.length - officeRackOverviewLimit);
  return racks.slice(start, start + officeRackOverviewLimit);
}

function rackMatchesSite(rack: RackDto, site: SitePoint) {
  const text = `${rack.room} ${rack.code} ${rack.name}`.toLowerCase();
  return site.aliases.some((alias) => text.includes(alias.toLowerCase()));
}

function groupSitesByCountry(sites: SiteSummary[]): CountrySiteGroup[] {
  const groups = new Map<string, CountrySiteGroup>();
  for (const site of sites) {
    const key = site.country.trim() || "Global";
    const group = groups.get(key) || { country: key, sites: [], rackCount: 0, lineCount: 0 };
    group.sites.push(site);
    group.rackCount += site.racks.length;
    group.lineCount += site.lineCount;
    groups.set(key, group);
  }

  return Array.from(groups.values())
    .map((group) => ({
      ...group,
      sites: group.sites.sort((a, b) => {
        const orderA = defaultSiteOrder.get(a.id) ?? Number.POSITIVE_INFINITY;
        const orderB = defaultSiteOrder.get(b.id) ?? Number.POSITIVE_INFINITY;
        return orderA - orderB || a.city.localeCompare(b.city) || a.label.localeCompare(b.label);
      })
    }))
    .sort((a, b) => {
      const orderA = defaultCountryOrder.get(a.country) ?? Number.POSITIVE_INFINITY;
      const orderB = defaultCountryOrder.get(b.country) ?? Number.POSITIVE_INFINITY;
      return orderA - orderB || a.country.localeCompare(b.country);
    });
}

function formatRackLineStats(racks: number, lines: number, t: Translate) {
  return t("siteMap.rackLineStats", {
    racks: t(racks === 1 ? "siteMap.rackCount.one" : "siteMap.rackCount.other", { count: racks }),
    lines: t(lines === 1 ? "siteMap.lineCount.one" : "siteMap.lineCount.other", { count: lines })
  });
}

function cableBelongsToSite(cable: CableDto, site?: SiteSummary) {
  return Boolean(site && cableBelongsToRacks(cable, site.racks));
}

function cableBelongsToRacks(cable: CableDto, racks: RackDto[]) {
  if (!racks.length) return false;
  return racks.some((rack) => (
    endpointBelongsToRack(cable.endpointAPort, rack) ||
    endpointBelongsToRack(cable.endpointBPort, rack)
  ));
}

function endpointBelongsToRack(port: PortDto & { device: DeviceDto & { rack?: { code: string; room: string } | null } }, rack: RackDto) {
  return port.device.rack?.code === rack.code && port.device.rack?.room === rack.room;
}

function getRackDeviceCategory(device: DeviceDto) {
  if (isPanduitRearDevice(device)) return "panduit";
  const ciscoTemplate = getCiscoDeviceTemplate(device);
  if (ciscoTemplate?.kind === "router") return "router";
  if (ciscoTemplate) return "switch";
  if (device.type === "SERVER") return "server";
  if (device.type === "PATCH_PANEL") return "patch";
  if (device.type === "AP") return "ap";
  if (device.type === "FIREWALL") return "firewall";
  return "other";
}

function PortGrid({
  ports,
  cables,
  canEdit,
  isPanMode,
  queuedPortIds,
  pendingEndpointId,
  dragPortId,
  selectedPortId,
  onDragStart,
  onDragEnd,
  onDropPort,
  onSelectPort,
  className,
  columns
}: {
  ports: PortDto[];
  cables: CableDto[];
  canEdit: boolean;
  isPanMode: boolean;
  queuedPortIds: Set<string>;
  pendingEndpointId: string | null;
  dragPortId: string | null;
  selectedPortId: string | null;
  onDragStart: (portId: string) => void;
  onDragEnd: () => void;
  onDropPort: (sourcePortId: string, targetPortId: string) => void;
  onSelectPort: (portId: string) => void;
  className: string;
  columns: number;
}) {
  return (
    <div className={className} style={{ "--port-columns": columns } as React.CSSProperties}>
      {ports.map((port) => {
        const cable = findCableForPort(port.id, cables);
        const isQueued = queuedPortIds.has(port.id);
        const isPendingStart = pendingEndpointId === port.id;
        const canReceiveDrop = canEdit && Boolean(dragPortId) && dragPortId !== port.id && !isQueued;
        const canDrop = canReceiveDrop && !cable;
        return (
          <button
            key={port.id}
            draggable={canEdit && !cable && !isPanMode && !isQueued}
            className={[
              "port-button",
              cable?.status || "empty",
              selectedPortId === port.id ? "selected" : "",
              isQueued ? "queued" : "",
              isPendingStart ? "pending-start" : "",
              dragPortId === port.id ? "drag-source" : "",
              canDrop ? "drop-target" : "",
              canReceiveDrop && cable ? "drop-blocked" : "",
              dragPortId && isQueued && dragPortId !== port.id ? "drop-blocked" : ""
            ].join(" ")}
            onClick={() => onSelectPort(port.id)}
            onDragStart={(event) => {
              if (isPanMode || !canEdit || cable || isQueued) {
                event.preventDefault();
                return;
              }
              event.dataTransfer.effectAllowed = "link";
              event.dataTransfer.setData("text/plain", port.id);
              onDragStart(port.id);
            }}
            onDragEnd={onDragEnd}
            onDragOver={(event) => {
              if (!canReceiveDrop) return;
              event.preventDefault();
              event.dataTransfer.dropEffect = "link";
            }}
            onDrop={(event) => {
              event.preventDefault();
              const sourcePortId = event.dataTransfer.getData("text/plain");
              if (sourcePortId) onDropPort(sourcePortId, port.id);
            }}
            title={`${port.name}${port.label ? ` · ${port.label}` : ""}`}
          >
            {formatPortButtonLabel(port.name)}
          </button>
        );
      })}
    </div>
  );
}

function PatchQueuePanel({
  pendingEndpoint,
  pendingConnections,
  portById,
  canEdit,
  busy,
  onCancelStart,
  onRemove,
  onClear,
  onComplete,
  t
}: {
  pendingEndpoint: (PortDto & { device: DeviceDto }) | null;
  pendingConnections: PendingPatchConnection[];
  portById: Map<string, PortDto & { device: DeviceDto }>;
  canEdit: boolean;
  busy: boolean;
  onCancelStart: () => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  onComplete: () => void;
  t: Translate;
}) {
  return (
    <section className="patch-queue">
      <div className="patch-queue-head">
        <div>
          <div className="section-title">{t("rack.pendingQueue")}</div>
          <strong>{t("rack.pendingCount", { count: pendingConnections.length })}</strong>
        </div>
        <div className="patch-queue-actions">
          <button className="secondary-button" onClick={onClear} disabled={busy || (!pendingEndpoint && pendingConnections.length === 0)}>
            <X size={16} />
            {t("action.clear")}
          </button>
          <button className="primary-button compact" onClick={onComplete} disabled={!canEdit || busy || pendingConnections.length === 0}>
            <Check size={16} />
            {t("action.complete")}
          </button>
        </div>
      </div>

      {pendingEndpoint ? (
        <div className="pending-start-card">
          <span>A</span>
          <strong>{formatEndpoint(pendingEndpoint)}</strong>
          <button className="icon-button small" onClick={onCancelStart} title={t("action.cancelEndpointA")}>
            <X size={14} />
          </button>
        </div>
      ) : null}

      {pendingConnections.length ? (
        <div className="pending-connection-list">
          {pendingConnections.map((connection, index) => {
            const endpointA = portById.get(connection.endpointAPortId);
            const endpointB = portById.get(connection.endpointBPortId);

            return (
              <div className="pending-connection-row" key={connection.id}>
                <span>{index + 1}</span>
                <div>
                  <strong>{endpointA ? formatEndpoint(endpointA) : t("rack.portMissing")}</strong>
                  <small>{endpointB ? formatEndpoint(endpointB) : t("rack.portMissing")}</small>
                </div>
                <button className="icon-button small" onClick={() => onRemove(connection.id)} title={t("action.remove")}>
                  <X size={14} />
                </button>
              </div>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}

function Details({
  cable,
  port,
  device,
  deviceTemplate,
  cables,
  directPeer,
  routeEnd,
  trace,
  canEdit,
  canReview,
  canAdmin,
  busy,
  queuedPortIds,
  pendingEndpointId,
  dragPortId,
  selectedPortId,
  onDragStart,
  onDragEnd,
  onDropPort,
  onSelectPort,
  onStatus,
  onDeleteDevice,
  onPhoto,
  t
}: {
  cable: CableDto | null;
  port: (PortDto & { device: DeviceDto }) | null;
  device: DeviceDto | null;
  deviceTemplate: RackulaDeviceTemplate | null;
  cables: CableDto[];
  directPeer: (PortDto & { device: DeviceDto & { rack?: { code: string; room: string } | null } }) | null;
  routeEnd: (PortDto & { device: DeviceDto }) | null;
  trace: Array<PortDto & { device: DeviceDto }>;
  canEdit: boolean;
  canReview: boolean;
  canAdmin: boolean;
  busy: boolean;
  queuedPortIds: Set<string>;
  pendingEndpointId: string | null;
  dragPortId: string | null;
  selectedPortId: string | null;
  onDragStart: (portId: string) => void;
  onDragEnd: () => void;
  onDropPort: (sourcePortId: string, targetPortId: string) => void;
  onSelectPort: (portId: string) => void;
  onStatus: (status: CableStatus) => void;
  onDeleteDevice: () => void;
  onPhoto: (file: File) => void;
  t: Translate;
}) {
  if (!cable && !port && !device && !deviceTemplate) {
    return <div className="empty-state">{t("details.empty")}</div>;
  }

  return (
    <div className="details-stack">
      {deviceTemplate ? (
        <section className="device-detail-section compact-device-summary">
          <div className="section-title">{t("details.deviceType")}</div>
          <h2>{deviceTemplate.model}</h2>
          <dl className="device-identity-grid">
            <div>
              <dt>{t("details.model")}</dt>
              <dd>{deviceTemplate.model}</dd>
            </div>
            <div>
              <dt>{t("details.type")}</dt>
              <dd>{rackulaDeviceCategoryLabel(deviceTemplate.category, t)}</dd>
            </div>
            <div>
              <dt>{t("deviceLibrary.height")}</dt>
              <dd>{formatRackulaTemplateHeight(deviceTemplate)}</dd>
            </div>
            <div>
              <dt>{t("deviceLibrary.depth")}</dt>
              <dd>{deviceTemplate.fullDepth ? t("deviceLibrary.fullDepth") : t("deviceLibrary.halfDepth")}</dd>
            </div>
            <div>
              <dt>{t("deviceLibrary.width")}</dt>
              <dd>{deviceTemplate.slotWidth === 1 ? t("deviceLibrary.halfWidthLong") : t("deviceLibrary.fullWidth")}</dd>
            </div>
            <div>
              <dt>{t("deviceLibrary.role")}</dt>
              <dd>{formatRackulaTemplateRole(deviceTemplate, t)}</dd>
            </div>
            <div>
              <dt>{t("deviceLibrary.traceType")}</dt>
              <dd>{rackulaCategoryToTraceDeviceType(deviceTemplate.category)}</dd>
            </div>
            <div>
              <dt>{t("deviceLibrary.slots")}</dt>
              <dd>{deviceTemplate.slots?.length ? t("deviceLibrary.slotCount", { count: deviceTemplate.slots.length }) : "-"}</dd>
            </div>
          </dl>
        </section>
      ) : null}

      {device ? (
        <section className="device-detail-section compact-device-summary">
          <div className="section-title">{t("details.device")}</div>
          <h2>{device.name}</h2>
          <dl className="device-identity-grid">
            <div>
              <dt>{t("details.hostname")}</dt>
              <dd>{device.name}</dd>
            </div>
            <div>
              <dt>{t("details.model")}</dt>
              <dd>{device.model || "-"}</dd>
            </div>
            <div>
              <dt>{t("details.vendor")}</dt>
              <dd>{device.vendor || "-"}</dd>
            </div>
            <div>
              <dt>{t("details.type")}</dt>
              <dd>{device.type}</dd>
            </div>
            <div>
              <dt>{t("details.rackPosition")}</dt>
              <dd>{formatDeviceRackPosition(device)}</dd>
            </div>
            <div>
              <dt>{t("details.managementIp")}</dt>
              <dd>{device.mgmtIp || "-"}</dd>
            </div>
          </dl>
        </section>
      ) : null}

      {device ? (
        <section className="device-detail-section device-actions-section">
          <div className="section-title">{t("details.deviceActions")}</div>
          <button
            className="secondary-button danger-button"
            disabled={!canAdmin || busy}
            onClick={onDeleteDevice}
            title={canAdmin ? t("action.deleteDevice") : t("api.error.permissionDenied")}
          >
            <Trash2 size={16} />
            {t("action.deleteDevice")}
          </button>
        </section>
      ) : null}

      {device ? (
        <DeviceConnectionSummary
          device={device}
          cables={cables}
          selectedPortId={selectedPortId}
          onSelectPort={onSelectPort}
          t={t}
        />
      ) : null}

      {port ? (
        <section>
          <div className="section-title">{t("details.port")}</div>
          <h2>{port.device.name} {port.name}</h2>
          <p className="muted">{port.label || port.type} · {port.speed || "speed n/a"} {port.poeEnabled ? "· PoE" : ""}</p>
        </section>
      ) : null}

      {port ? (
        <section>
          <div className="section-title">{t("details.peerLocation")}</div>
          <div className="peer-list">
            <div>
              <span>{t("details.peerCableEnd")}</span>
              <strong>{directPeer ? formatEndpoint(directPeer) : t("details.unpatched")}</strong>
            </div>
            {routeEnd && routeEnd.id !== directPeer?.id ? (
              <div>
                <span>{t("details.routeEnd")}</span>
                <strong>{formatEndpoint(routeEnd)}</strong>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {cable ? (
        <section>
          <div className="section-title">{t("details.cable")}</div>
          <h2>{cable.cableId}</h2>
          <p>{cable.label}</p>
          <span className={`status-badge ${cable.status}`}>{statusLabel(cable.status, t)}</span>
          <div className="endpoint-list">
            <div>A · {formatEndpoint(cable.endpointAPort)}</div>
            <div>B · {formatEndpoint(cable.endpointBPort)}</div>
          </div>
          <div className="status-actions">
            {cableStatuses.map((status) => (
              <button
                key={status}
                disabled={!canEdit || busy || (status === "confirmed" && !canReview)}
                onClick={() => onStatus(status)}
                className={status === cable.status ? "active" : ""}
              >
                {statusLabel(status, t)}
              </button>
            ))}
          </div>
          <div className="qr-row">
            <img src={`/api/cables/${cable.id}/qr`} alt={cable.cableId} />
            <a href={`/api/exports/labels?ids=${cable.id}`} className="secondary-button">
              <QrCode size={16} />
              {t("action.tag")}
            </a>
          </div>
          {cable.status !== "retired" ? (
            <button
              className="secondary-button danger-button"
              disabled={!canEdit || busy}
              onClick={() => onStatus("retired")}
            >
              <X size={16} />
              {t("action.cancelCable")}
            </button>
          ) : null}
        </section>
      ) : null}

      {trace.length ? (
        <section>
          <div className="section-title">{t("details.path")}</div>
          <ol className="trace-list">
            {trace.map((item) => (
              <li key={item.id}>{formatEndpoint(item)}</li>
            ))}
          </ol>
        </section>
      ) : null}

      {cable || port || device ? (
        <section>
          <div className="section-title">{t("details.photos")}</div>
          <label className="upload-button">
            <Upload size={16} />
            {t("action.upload")}
            <input type="file" accept="image/*" onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onPhoto(file);
            }} />
          </label>
          <div className="photo-grid">
            {cable?.photos.map((photo) => (
              <a key={photo.id} href={`/api/photos/${photo.id}`} target="_blank">
                <img src={`/api/photos/${photo.id}`} alt={photo.originalName} />
              </a>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function DeviceConnectionSummary({
  device,
  cables,
  selectedPortId,
  onSelectPort,
  t
}: {
  device: DeviceDto;
  cables: CableDto[];
  selectedPortId: string | null;
  onSelectPort: (portId: string) => void;
  t: Translate;
}) {
  const connectedRows = sortPortsByPosition(device.ports)
    .map((port) => {
      const cable = findCableForPort(port.id, cables);
      const peer = cable ? getCablePeer(port.id, cable) : null;
      return { port, cable, peer };
    })
    .filter((row) => row.cable);

  return (
    <section>
      <div className="section-title">{t("details.deviceConnections")}</div>
      {connectedRows.length ? (
        <div className="connection-map">
          {connectedRows.map(({ port, cable, peer }) => (
            <button
              key={port.id}
              className={selectedPortId === port.id ? "active" : ""}
              onClick={() => onSelectPort(port.id)}
            >
              <span>{formatPortButtonLabel(port.name)}</span>
              <strong>{peer ? formatEndpoint(peer) : t("details.noPeer")}</strong>
              <small>{cable?.cableId} · {cable ? statusLabel(cable.status, t) : ""}</small>
            </button>
          ))}
        </div>
      ) : (
        <p className="muted">{t("details.noDeviceCables")}</p>
      )}
    </section>
  );
}

function formatDeviceRackPosition(device: DeviceDto) {
  if (!device.uPosition) return "-";
  const height = Math.max(1, device.uHeight || 1);
  const endPosition = device.uPosition + height - 1;

  return height > 1
    ? `U${device.uPosition}-${endPosition} · ${height}U`
    : `U${device.uPosition} · ${height}U`;
}

function NewCableForm({
  ports,
  csrfToken,
  t,
  onSaved
}: {
  ports: Array<PortDto & { device: DeviceDto }>;
  csrfToken: string;
  t: Translate;
  onSaved: () => void;
}) {
  const [endpointAPortId, setEndpointAPortId] = useState(ports[0]?.id || "");
  const [endpointBPortId, setEndpointBPortId] = useState(ports[1]?.id || "");
  const [cableId, setCableId] = useState(`CBL-${Date.now()}`);
  const [label, setLabel] = useState("");
  const [color, setColor] = useState("blue");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const options = ports.map((port) => ({ id: port.id, name: formatEndpoint(port) }));

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const response = await fetch("/api/cables", {
      method: "POST",
      headers: { "content-type": "application/json", "x-csrf-token": csrfToken },
      body: JSON.stringify({
        cableId,
        label: label || cableId,
        endpointAPortId,
        endpointBPortId,
        color,
        status: "draft",
        media: "COPPER"
      })
    });
    setSaving(false);
    if (response.ok) {
      onSaved();
      return;
    }
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    setError(translateApiError(t, payload?.error, "patch.createFailed"));
  }

  return (
    <form className="new-cable-form" onSubmit={save}>
      <div className="section-title">{t("form.newCable")}</div>
      <label>
        {t("form.cableId")}
        <input value={cableId} onChange={(event) => setCableId(event.target.value)} />
      </label>
      <label>
        {t("form.label")}
        <input value={label} onChange={(event) => setLabel(event.target.value)} />
      </label>
      <label>
        {t("form.endpointA")}
        <select value={endpointAPortId} onChange={(event) => setEndpointAPortId(event.target.value)}>
          {options.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
        </select>
      </label>
      <label>
        {t("form.endpointB")}
        <select value={endpointBPortId} onChange={(event) => setEndpointBPortId(event.target.value)}>
          {options.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
        </select>
      </label>
      <label>
        {t("form.color")}
        <input value={color} onChange={(event) => setColor(event.target.value)} />
      </label>
      {error ? <p className="form-error">{error}</p> : null}
      <button className="primary-button" disabled={saving}>
        <Check size={16} />
        {t("action.save")}
      </button>
    </form>
  );
}

function findCableForPort(portId: string, cables: CableDto[]) {
  return cables.find((cable) => cable.status !== "retired" && (cable.endpointAPortId === portId || cable.endpointBPortId === portId)) || null;
}

function findPendingConnectionForPort(portId: string, connections: PendingPatchConnection[]) {
  return connections.find((connection) => connection.endpointAPortId === portId || connection.endpointBPortId === portId) || null;
}

function getCablePeer(portId: string, cable: CableDto) {
  if (cable.endpointAPortId === portId) return cable.endpointBPort;
  if (cable.endpointBPortId === portId) return cable.endpointAPort;
  return null;
}

function getTraceRemoteEnd(portId: string, trace: Array<PortDto & { device: DeviceDto }>) {
  if (trace.length < 2) return null;
  return trace[0]?.id === portId ? trace[trace.length - 1] : trace[0];
}

function buildDraggedCableId(
  endpointA: PortDto & { device: DeviceDto & { rack?: { code: string; room: string } | null } },
  endpointB: PortDto & { device: DeviceDto & { rack?: { code: string; room: string } | null } }
) {
  const suffix = Date.now().toString(36).toUpperCase();
  return `CBL-${compactEndpointCode(endpointA)}-${compactEndpointCode(endpointB)}-${suffix}`.slice(0, 80);
}

function compactEndpointCode(port: PortDto & { device: DeviceDto & { rack?: { code: string; room: string } | null } }) {
  const rack = port.device.rack?.code || "FIELD";
  return `${rack}-${port.device.name}-${port.name}`
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24)
    .toUpperCase();
}

function formatCableListEndpoint(port: PortDto & { device: DeviceDto & { rack?: { code: string; room: string } | null } }) {
  const rack = port.device.rack ? `${port.device.rack.room}/${port.device.rack.code}` : "FIELD";
  return `${rack} · ${port.device.name} ${port.name}`;
}

function formatPortButtonLabel(portName: string) {
  if (getCiscoPortNumber(portName)) {
    return formatCiscoPortShortName(portName);
  }
  return portName;
}

function buildTrace(
  startPortId: string,
  ports: Array<PortDto & { device: DeviceDto }>,
  cables: CableDto[]
) {
  const adjacency = new Map<string, string[]>();
  ports.forEach((port) => {
    adjacency.set(port.id, adjacency.get(port.id) || []);
    if (port.mappedPortId) {
      adjacency.get(port.id)!.push(port.mappedPortId);
      adjacency.set(port.mappedPortId, adjacency.get(port.mappedPortId) || []);
      adjacency.get(port.mappedPortId)!.push(port.id);
    }
  });
  cables.filter((cable) => cable.status !== "retired").forEach((cable) => {
    adjacency.get(cable.endpointAPortId)?.push(cable.endpointBPortId);
    adjacency.get(cable.endpointBPortId)?.push(cable.endpointAPortId);
  });

  const visited = new Set([startPortId]);
  const queue: Array<{ id: string; path: string[] }> = [{ id: startPortId, path: [startPortId] }];
  const portById = new Map(ports.map((port) => [port.id, port]));
  const traces: Array<Array<PortDto & { device: DeviceDto }>> = [];

  while (queue.length) {
    const item = queue.shift()!;
    const next = (adjacency.get(item.id) || []).filter((id) => !visited.has(id));
    if (!next.length && item.path.length > 1) {
      traces.push(item.path.map((id) => portById.get(id)).filter(Boolean) as Array<PortDto & { device: DeviceDto }>);
    }
    next.forEach((id) => {
      visited.add(id);
      queue.push({ id, path: [...item.path, id] });
    });
  }
  return traces.sort((a, b) => b.length - a.length);
}

function formatEndpoint(port: PortDto & { device: DeviceDto & { rack?: { code: string; room: string } | null } }) {
  const rack = port.device.rack ? `${port.device.rack.room}/${port.device.rack.code}` : "FIELD";
  const position = port.device.uPosition ? ` U${port.device.uPosition}` : "";
  return `${rack}${position} ${port.device.name} ${port.name}`;
}

function roleRank(role: Role) {
  return { VIEWER: 1, SURVEYOR: 2, REVIEWER: 3, ADMIN: 4 }[role];
}

function loadCustomSites(): SitePoint[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(customSitesStorageKey);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item, index) => normalizeCustomSite(item, index)).filter(Boolean) as SitePoint[];
  } catch {
    return [];
  }
}

function normalizeCustomSite(item: unknown, index: number): SitePoint | null {
  if (!item || typeof item !== "object") return null;
  const record = item as Partial<SitePoint>;
  const country = String(record.country || "").trim();
  const city = String(record.city || record.label || "").trim();
  if (!country || !city) return null;
  const address = String(record.address || "").trim();
  const position = Number.isFinite(record.x) && Number.isFinite(record.y)
    ? { x: Number(record.x), y: Number(record.y) }
    : nextCustomSitePosition(index);

  return {
    id: String(record.id || `custom-${slugify(`${country}-${city}-${address || index}`)}`),
    label: String(record.label || city),
    country,
    city,
    address,
    aliases: Array.isArray(record.aliases) && record.aliases.length
      ? record.aliases.map((alias) => String(alias)).filter(Boolean)
      : [country, city, address].filter(Boolean),
    custom: true,
    x: clamp(position.x, 8, 92),
    y: clamp(position.y, 12, 88)
  };
}

function nextCustomSitePosition(index: number) {
  const positions = [
    { x: 24, y: 28 },
    { x: 34, y: 78 },
    { x: 54, y: 22 },
    { x: 84, y: 64 },
    { x: 18, y: 58 },
    { x: 72, y: 18 },
    { x: 88, y: 82 },
    { x: 44, y: 48 }
  ];
  return positions[index % positions.length];
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    || "site";
}

function uniqueValues(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b));
}

function formatSiteDisplay(site: Pick<SitePoint, "country" | "city" | "address" | "label" | "id">, t: Translate) {
  const city = siteLabel(site, t);
  const country = countryLabel(site.country, t);
  return site.address ? `${country} / ${city} · ${site.address}` : `${country} / ${city}`;
}

const rackulaCategoryTranslationKeys: Record<RackulaDeviceCategory, TranslationKey> = {
  server: "deviceLibrary.category.server",
  network: "deviceLibrary.category.network",
  firewall: "deviceLibrary.category.firewall",
  "patch-panel": "deviceLibrary.category.patch-panel",
  power: "deviceLibrary.category.power",
  storage: "deviceLibrary.category.storage",
  kvm: "deviceLibrary.category.kvm",
  "av-media": "deviceLibrary.category.av-media",
  cooling: "deviceLibrary.category.cooling",
  shelf: "deviceLibrary.category.shelf",
  blank: "deviceLibrary.category.blank",
  "cable-management": "deviceLibrary.category.cable-management",
  chassis: "deviceLibrary.category.chassis",
  other: "deviceLibrary.category.other"
};

function rackulaDeviceCategoryLabel(category: RackulaDeviceCategory, t: Translate) {
  return t(rackulaCategoryTranslationKeys[category]);
}

function formatRackulaTemplateHeight(template: RackulaDeviceTemplate) {
  return `${template.heightU}U`;
}

function formatRackulaTemplateRole(template: RackulaDeviceTemplate, t: Translate) {
  if (template.subdeviceRole === "parent") return t("deviceLibrary.roleParent");
  if (template.subdeviceRole === "child") return t("deviceLibrary.roleChild");
  return t("deviceLibrary.roleStandalone");
}

function statusLabel(status: CableStatus, t: Translate) {
  return t(`status.${status}` as TranslationKey);
}

function siteLabel(site: Pick<SitePoint, "id" | "label"> & Partial<Pick<SitePoint, "city">>, t: Translate) {
  const key = `site.${site.id}` as TranslationKey;
  const translated = t(key);
  return translated === key ? site.city || site.label : translated;
}

function countryLabel(country: string, t: Translate) {
  const key = `country.${country.toLowerCase()}` as TranslationKey;
  const translated = t(key);
  return translated === key ? country : translated;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
