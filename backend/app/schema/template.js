import { z } from 'zod';

export const RequestCreationSchema = z.object({
  url: z.string(),
  description: z.string(),
  templateName: z.string(),
  templateVariables: z.array(
    z.object({
      name: z.string(),
      required: z.boolean().optional(),
      showOnExcel: z.boolean().optional(),
    })
  ).optional(),
  docCount: z.number().optional().default(0),
  rejectedDocs: z.number().optional().default(0),
  createdBy: z.string(),
  updatedBy: z.string(),
  assignedTo: z.string().optional().nullable(),
});
