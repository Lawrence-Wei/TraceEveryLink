import { PrintProtocol, PrintJobStatus } from "@prisma/client";
import { prisma } from "@/server/db";
import { cableUrl, formatEndpoint } from "@/server/labels";

type PrintPayload = {
  jobId: string;
  copies: number;
  labels: Array<{
    cableId: string;
    label: string;
    endpointA: string;
    endpointB: string;
    qrUrl: string;
  }>;
};

export async function createAndSendPrintJob(input: {
  printerId: string;
  cableIds: string[];
  copies: number;
  requestedBy?: string | null;
}) {
  const printer = await prisma.labelPrinter.findUnique({ where: { id: input.printerId } });
  if (!printer || !printer.enabled) {
    throw new Error("Printer is disabled or not found");
  }

  const cables = await prisma.cable.findMany({
    where: { id: { in: input.cableIds } },
    include: {
      endpointAPort: { include: { device: { include: { rack: true } } } },
      endpointBPort: { include: { device: { include: { rack: true } } } }
    }
  });

  if (cables.length !== input.cableIds.length) {
    throw new Error("One or more cables were not found");
  }

  const job = await prisma.printJob.create({
    data: {
      printerId: printer.id,
      requestedBy: input.requestedBy ?? null,
      copies: input.copies,
      items: {
        create: cables.map((cable) => ({
          cableId: cable.id,
          labelText: cable.label,
          qrUrl: cableUrl(cable.id)
        }))
      }
    },
    include: { items: true }
  });

  const payload: PrintPayload = {
    jobId: job.id,
    copies: input.copies,
    labels: cables.map((cable) => ({
      cableId: cable.cableId,
      label: cable.label,
      endpointA: formatEndpoint(cable.endpointAPort),
      endpointB: formatEndpoint(cable.endpointBPort),
      qrUrl: cableUrl(cable.id)
    }))
  };

  try {
    const response = await sendToPrinter(printer, payload);
    return prisma.printJob.update({
      where: { id: job.id },
      data: {
        status: PrintJobStatus.sent,
        payload,
        response
      },
      include: { items: true, printer: true }
    });
  } catch (error) {
    return prisma.printJob.update({
      where: { id: job.id },
      data: {
        status: PrintJobStatus.failed,
        payload,
        error: error instanceof Error ? error.message : "Unknown printer error"
      },
      include: { items: true, printer: true }
    });
  }
}

async function sendToPrinter(
  printer: { protocol: PrintProtocol; endpoint: string; apiKey: string | null },
  payload: PrintPayload
) {
  const headers: Record<string, string> = {};
  if (printer.apiKey) headers.authorization = `Bearer ${printer.apiKey}`;

  if (printer.protocol === PrintProtocol.HTTP_JSON) {
    const response = await fetch(printer.endpoint, {
      method: "POST",
      headers: { ...headers, "content-type": "application/json" },
      body: JSON.stringify(payload)
    });
    return parsePrinterResponse(response);
  }

  const body =
    printer.protocol === PrintProtocol.HTTP_ZPL
      ? renderZpl(payload)
      : renderTspl(payload);

  const response = await fetch(printer.endpoint, {
    method: "POST",
    headers: { ...headers, "content-type": "text/plain" },
    body
  });
  return parsePrinterResponse(response);
}

async function parsePrinterResponse(response: Response) {
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Printer returned ${response.status}: ${text.slice(0, 300)}`);
  }
  try {
    return JSON.parse(text);
  } catch {
    return { status: response.status, body: text.slice(0, 1000) };
  }
}

function renderZpl(payload: PrintPayload) {
  return payload.labels
    .flatMap((label) =>
      Array.from({ length: payload.copies }, () =>
        [
          "^XA",
          "^CI28",
          "^FO30,25^A0N,28,28^FD" + escapeZpl(label.cableId) + "^FS",
          "^FO30,65^A0N,22,22^FD" + escapeZpl(label.endpointA) + "^FS",
          "^FO30,95^A0N,22,22^FD" + escapeZpl(label.endpointB) + "^FS",
          "^FO430,25^BQN,2,5^FDLA," + escapeZpl(label.qrUrl) + "^FS",
          "^XZ"
        ].join("\n")
      )
    )
    .join("\n");
}

function renderTspl(payload: PrintPayload) {
  return payload.labels
    .flatMap((label) =>
      Array.from({ length: payload.copies }, () =>
        [
          "SIZE 60 mm,30 mm",
          "GAP 2 mm,0",
          "CLS",
          `TEXT 20,20,"0",0,1,1,"${escapeTspl(label.cableId)}"`,
          `TEXT 20,55,"0",0,1,1,"${escapeTspl(label.endpointA)}"`,
          `TEXT 20,85,"0",0,1,1,"${escapeTspl(label.endpointB)}"`,
          `QRCODE 360,20,L,4,A,0,"${escapeTspl(label.qrUrl)}"`,
          "PRINT 1"
        ].join("\n")
      )
    )
    .join("\n");
}

function escapeZpl(value: string) {
  return value.replace(/\^/g, " ").replace(/~/g, " ");
}

function escapeTspl(value: string) {
  return value.replace(/"/g, "'");
}
