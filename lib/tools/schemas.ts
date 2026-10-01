import { z } from "zod";

const filterTextSchema = z
  .string()
  .trim()
  .min(1)
  .max(80);

const providerIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(100);

export const supportedLanguageSchema = z.enum([
  "ar",
  "en",
]);

export const searchDoctorsInputSchema = z
  .object({
    specialty: filterTextSchema.optional(),
    city: filterTextSchema.optional(),
    language: supportedLanguageSchema.optional(),
    hospitalId: providerIdSchema.optional(),
    limit: z
      .number()
      .int()
      .min(1)
      .max(20)
      .default(10),
  })
  .strict();

export const searchHospitalsInputSchema = z
  .object({
    city: filterTextSchema.optional(),
    specialty: filterTextSchema.optional(),
    emergencyAvailable: z.boolean().optional(),
    limit: z
      .number()
      .int()
      .min(1)
      .max(20)
      .default(10),
  })
  .strict();

export const getProviderDetailsInputSchema = z
  .object({
    providerType: z.enum([
      "doctor",
      "hospital",
    ]),
    providerId: providerIdSchema,
  })
  .strict();

export const hospitalRecordSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    city: z.string(),
    country: z.string(),
    address: z.string().nullable(),
    emergencyAvailable: z.boolean(),
    languages: z.array(z.string()),
  })
  .strict();

export const hospitalProviderSchema =
  hospitalRecordSchema.extend({
    providerType: z.literal("hospital"),
  });

export const doctorProviderSchema = z
  .object({
    providerType: z.literal("doctor"),
    id: z.string(),
    name: z.string(),
    specialty: z.string(),
    city: z.string(),
    languages: z.array(z.string()),
    bio: z.string().nullable(),
    hospital: hospitalRecordSchema,
  })
  .strict();

export const providerRecordSchema =
  z.discriminatedUnion("providerType", [
    doctorProviderSchema,
    hospitalProviderSchema,
  ]);

export type SearchDoctorsInput = z.infer<
  typeof searchDoctorsInputSchema
>;

export type SearchHospitalsInput = z.infer<
  typeof searchHospitalsInputSchema
>;

export type GetProviderDetailsInput = z.infer<
  typeof getProviderDetailsInputSchema
>;