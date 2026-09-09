// src/components/panel/schemas.ts
import { z } from 'zod';

export const profileSchema = z.object({
  username: z
    .string()
    .min(3, 'یوزرنیم باید حداقل ۳ کاراکتر باشد')
    .max(30, 'یوزرنیم نباید بیشتر از ۳۰ کاراکتر باشد')
    .regex(/^[a-zA-Z0-9_]+$/, 'فقط حروف انگلیسی، اعداد و زیرخط مجاز است'),
  firstName: z
    .string()
    .min(2, 'نام باید حداقل ۲ کاراکتر باشد')
    .max(50, 'نام نباید بیشتر از ۵۰ کاراکتر باشد'),
  lastName: z
    .string()
    .min(2, 'نام خانوادگی باید حداقل ۲ کاراکتر باشد')
    .max(50, 'نام خانوادگی نباید بیشتر از ۵۰ کاراکتر باشد'),
  bio: z.string().max(180, 'بیوگرافی نباید بیشتر از ۱۸۰ کاراکتر باشد').default(''), // مقدار پیش‌فرض برای bio
  avatarUrl: z.string().nullable().optional(),
  avatarFile: z.instanceof(File).nullable().optional(),
});

export const additionalInfoSchema = z.object({
  studentCode: z
    .string()
    .min(8, 'کد دانشجویی باید حداقل ۸ رقم باشد')
    .max(20, 'کد دانشجویی نباید بیشتر از ۲۰ رقم باشد')
    .regex(/^[0-9]+$/, 'فقط اعداد مجاز است')
    .optional(),
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'فرمت تاریخ تولد صحیح نیست')
    .optional(),
  educationLevel: z.enum(['diploma', 'associate', 'bachelor', 'master', 'phd']),
});

export type ProfileFormData = z.infer<typeof profileSchema>;
export type AdditionalInfoFormData = z.infer<typeof additionalInfoSchema>;
