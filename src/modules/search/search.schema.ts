import { BonusTypeEnum } from '@/modules/servivuelo/servivuelo.types';
import { Parameters } from '@/types';
import { z } from 'zod';

export const JourneySchema = z.object({
  from: z.string().nonempty(),
  to: z.string().nonempty(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD')
    .transform(d => d.split('-').reverse().join('/')) // DD/MM/YYYY
    .refine(d => d.length > 0, { message: 'Date is required' }),
});

export const PassengerSchema = z.object({
  adults: z.number().int().min(1, { message: 'At least one adult required' }),
  children: z.number().int().min(0).default(0),
  total: z.number().int().min(1),
});

export const SearchParamsSchema = z
  .object({
    journeys: z.array(JourneySchema).min(1),
    passenger: PassengerSchema,
    bonus: z
      .array(z.enum(BonusTypeEnum, { message: 'Bonus type is required' }))
      .max(1)
      .default([]),
  })
  .strict();

export type SearchParameters = z.infer<typeof SearchParamsSchema>;
export type SearchJourney = z.infer<typeof JourneySchema>;

export function validateSearchParams(data: Parameters) {
  return SearchParamsSchema.safeParse(data);
}

export type Journey = {
  from: string;
  to: string;
  date: string;
};
