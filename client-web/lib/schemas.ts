import { z } from 'zod';

export const vehicleSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  plate: z
    .string()
    .regex(
      /^[A-Z]{2,3}\d{3}[A-Z]{0,2}$/,
      'El formato de la patente no es válido (Ej: AA123BB o ABC123)'
    ),
  mileage: z.coerce.number().min(0, 'El kilometraje debe ser mayor o igual a 0'),
  lastOilChange: z.string().optional().nullable(),
  oilType: z.string().optional().nullable(),
  nextOilChangeKm: z.coerce
    .number()
    .min(0, 'El próximo cambio de aceite debe ser mayor o igual a 0'),
  notes: z.string().optional().nullable(),
  tireCondition: z.enum(['Bueno', 'Regular', 'Malo']),
  status: z.enum(['Activo', 'Mantenimiento', 'Inactivo']),
});

export const clientSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  dni: z
    .string()
    .regex(/^\d+$/, 'El DNI solo debe contener números')
    .optional()
    .nullable()
    .or(z.literal('')),
  phone: z
    .string()
    .regex(/^\+?[\d\s-]+$/, 'El formato del teléfono no es válido')
    .optional()
    .nullable()
    .or(z.literal('')),
  email: z.string().email('El email no es válido').optional().nullable().or(z.literal('')),
  address: z.string().optional().nullable(),
});
