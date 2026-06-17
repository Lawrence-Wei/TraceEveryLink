import { z } from "zod";

export const cableStatusSchema = z.enum([
  "planned",
  "draft",
  "pending_verification",
  "confirmed",
  "faulty",
  "retired"
]);

export const cableCreateSchema = z.object({
  cableId: z.string().min(3).max(80),
  label: z.string().min(3).max(120),
  endpointAPortId: z.string().min(1),
  endpointBPortId: z.string().min(1),
  status: cableStatusSchema.default("draft"),
  media: z.enum(["COPPER", "FIBER", "DAC", "OTHER"]).default("COPPER"),
  color: z.string().max(40).optional().nullable(),
  lengthM: z.number().positive().max(500).optional().nullable(),
  notes: z.string().max(1000).optional().nullable()
});

export const cablePatchSchema = z.object({
  status: cableStatusSchema.optional(),
  notes: z.string().max(1000).optional().nullable()
});

export const printJobSchema = z.object({
  printerId: z.string().min(1),
  cableIds: z.array(z.string().min(1)).min(1).max(200),
  copies: z.number().int().min(1).max(10).default(1)
});

export const printerSchema = z.object({
  name: z.string().min(2).max(80),
  protocol: z.enum(["HTTP_JSON", "HTTP_ZPL", "HTTP_TSPL"]).default("HTTP_JSON"),
  endpoint: z.string().url(),
  apiKey: z.string().max(300).optional().nullable(),
  enabled: z.boolean().default(true),
  notes: z.string().max(1000).optional().nullable()
});

export const printerPatchSchema = printerSchema.partial();
