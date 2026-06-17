import PDFDocument from "pdfkit";
import { prisma } from "@/server/db";
import { cableQrBuffer, formatEndpoint } from "@/server/labels";

export async function buildCableWorkbook() {
  const cables = await prisma.cable.findMany({
    orderBy: { cableId: "asc" },
    include: {
      endpointAPort: { include: { device: { include: { rack: true } } } },
      endpointBPort: { include: { device: { include: { rack: true } } } }
    }
  });

  const headers = [
    "Cable ID",
    "Label",
    "Status",
    "Media",
    "Color",
    "Length(m)",
    "Endpoint A",
    "Endpoint B",
    "Updated"
  ];
  const rows = cables.map((cable) => [
    cable.cableId,
    cable.label,
    cable.status,
    cable.media,
    cable.color || "",
    cable.lengthM?.toString() || "",
    formatEndpoint(cable.endpointAPort),
    formatEndpoint(cable.endpointBPort),
    cable.updatedAt.toISOString()
  ]);

  const table = [
    "<html><head><meta charset=\"utf-8\"></head><body><table border=\"1\">",
    `<tr>${headers.map((cell) => `<th>${escapeHtml(cell)}</th>`).join("")}</tr>`,
    ...rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`),
    "</table></body></html>"
  ].join("");

  return Buffer.from(table, "utf8");
}

export async function buildCablePdf() {
  const cables = await prisma.cable.findMany({
    orderBy: { cableId: "asc" },
    include: {
      endpointAPort: { include: { device: { include: { rack: true } } } },
      endpointBPort: { include: { device: { include: { rack: true } } } }
    }
  });

  return new Promise<Buffer>((resolve) => {
    const doc = new PDFDocument({ size: "A4", margin: 36 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));

    doc.fontSize(18).text("TraceEveryLink Cable Register", { underline: true });
    doc.moveDown();

    for (const cable of cables) {
      doc.fontSize(11).text(cable.cableId, { continued: true }).text(`  ${cable.status}`);
      doc.fontSize(9).text(cable.label);
      doc.text(`A: ${formatEndpoint(cable.endpointAPort)}`);
      doc.text(`B: ${formatEndpoint(cable.endpointBPort)}`);
      doc.moveDown(0.6);
      if (doc.y > 760) doc.addPage();
    }

    doc.end();
  });
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function buildLabelsPdf(cableIds?: string[]) {
  const cables = await prisma.cable.findMany({
    where: cableIds?.length ? { id: { in: cableIds } } : undefined,
    orderBy: { cableId: "asc" },
    include: {
      endpointAPort: { include: { device: { include: { rack: true } } } },
      endpointBPort: { include: { device: { include: { rack: true } } } }
    }
  });

  return new Promise<Buffer>(async (resolve) => {
    const doc = new PDFDocument({ size: [288, 144], margin: 12 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));

    for (let index = 0; index < cables.length; index += 1) {
      const cable = cables[index];
      if (index > 0) doc.addPage();
      const qr = await cableQrBuffer(cable.id, 86);
      doc.fontSize(10).text(cable.cableId, 12, 12, { width: 184 });
      doc.fontSize(7).text(formatEndpoint(cable.endpointAPort), 12, 32, { width: 184 });
      doc.text(formatEndpoint(cable.endpointBPort), 12, 52, { width: 184 });
      doc.text(cable.status, 12, 72, { width: 184 });
      doc.image(qr, 200, 16, { width: 72, height: 72 });
    }

    doc.end();
  });
}
