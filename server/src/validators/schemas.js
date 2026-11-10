import { z } from 'zod';
import { commonPasswords } from '../utils/commonPasswords.js';

// Rwanda phone regex
const rwandaPhone = /^(\+250|0)7[2389]\d{7}$/;

export const normalizePhone = (phone) => {
  if (!phone) return phone;
  if (phone.startsWith('07')) return '+250' + phone.slice(1);
  return phone;
};

export const fullNameSchema = z
  .string()
  .trim()
  .transform((val) => val.replace(/\s+/g, ' '))
  .refine((val) => val.length >= 2 && val.length <= 50, {
    message: 'Enter your real name using letters only (2 to 50 characters).',
  })
  .refine((val) => /^[\p{L}][\p{L}\p{M}'' -]{1,49}$/u.test(val), {
    message: 'Enter your real name using letters only (2 to 50 characters).',
  });

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email({ message: 'Please enter a valid email address.' })
  .max(254, { message: 'Email must not exceed 254 characters.' })
  .refine((val) => !val.includes(' '), { message: 'Email must not contain spaces.' });

export const passwordSchema = (email = '', fullName = '') =>
  z
    .string()
    .min(8, { message: 'Password must be at least 8 characters.' })
    .max(64, { message: 'Password must not exceed 64 characters.' })
    .refine((val) => !val.includes(' '), { message: 'Password must not contain spaces.' })
    .refine((val) => /[A-Z]/.test(val), { message: 'Password must contain at least one uppercase letter.' })
    .refine((val) => /[a-z]/.test(val), { message: 'Password must contain at least one lowercase letter.' })
    .refine((val) => /[0-9]/.test(val), { message: 'Password must contain at least one number.' })
    .refine((val) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~]/.test(val), {
      message: 'Password must contain at least one special character.',
    })
    .refine(
      (val) => {
        const lowerVal = val.toLowerCase();
        const emailName = email.split('@')[0]?.toLowerCase();
        const firstName = fullName.split(' ')[0]?.toLowerCase();
        if (emailName && emailName.length > 2 && lowerVal.includes(emailName)) return false;
        if (firstName && firstName.length > 2 && lowerVal.includes(firstName)) return false;
        return true;
      },
      { message: 'Password must not contain your name or email.' }
    )
    .refine((val) => !commonPasswords.includes(val.toLowerCase()), {
      message: 'This password is too common. Please choose a stronger password.',
    });

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, { message: 'Password is required.' }),
});

export const registerUserSchema = z
  .object({
    fullName: fullNameSchema,
    email: emailSchema,
    password: z.string(),
    confirmPassword: z.string(),
    role: z.enum(['administrator', 'manager', 'storekeeper'], {
      errorMap: () => ({ message: 'Invalid role.' }),
    }),
  })
  .superRefine((data, ctx) => {
    const passResult = passwordSchema(data.email, data.fullName).safeParse(data.password);
    if (!passResult.success) {
      passResult.error.errors.forEach((e) =>
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: e.message, path: ['password'] })
      );
    }
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Passwords do not match.',
        path: ['confirmPassword'],
      });
    }
  });

export const changePasswordSchema = (email = '', fullName = '') =>
  z
    .object({
      currentPassword: z.string().min(1, { message: 'Current password is required.' }),
      newPassword: z.string(),
      confirmPassword: z.string(),
    })
    .superRefine((data, ctx) => {
      const passResult = passwordSchema(email, fullName).safeParse(data.newPassword);
      if (!passResult.success) {
        passResult.error.errors.forEach((e) =>
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: e.message, path: ['newPassword'] })
        );
      }
      if (data.newPassword !== data.confirmPassword) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Passwords do not match.',
          path: ['confirmPassword'],
        });
      }
    });

export const productSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters.').max(100, 'Name must not exceed 100 characters.'),
  sku: z
    .string()
    .trim()
    .toUpperCase()
    .min(3, 'SKU must be at least 3 characters.')
    .max(20, 'SKU must not exceed 20 characters.')
    .regex(/^[A-Z0-9-]+$/, 'SKU must contain only uppercase letters, numbers, and hyphens.'),
  category: z.string().trim().min(1, 'Category is required.'),
  unit: z.string().trim().min(1, 'Unit is required.'),
  minimumStock: z.coerce.number().int().min(0, 'Minimum stock must be 0 or greater.'),
  supplier: z.string().optional().nullable(),
  description: z.string().trim().max(500, 'Description must not exceed 500 characters.').optional(),
});

export const supplierSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters.').max(100),
  email: z.string().trim().toLowerCase().email('Invalid email.').max(254).optional().or(z.literal('')),
  phone: z
    .string()
    .trim()
    .regex(rwandaPhone, 'Enter a valid Rwanda phone number (e.g. +2507XXXXXXXX or 07XXXXXXXX).')
    .optional()
    .or(z.literal('')),
  address: z.string().trim().max(500).optional(),
  contactPerson: z.string().trim().max(100).optional(),
});

export const clientSchema = supplierSchema;

export const locationSchema = z.object({
  zone: z.string().trim().toUpperCase().min(1, 'Zone is required.').max(10),
  rack: z.string().trim().toUpperCase().min(1, 'Rack is required.').max(10),
  bin: z.string().trim().toUpperCase().min(1, 'Bin is required.').max(10),
  capacity: z.coerce.number().int().min(1, 'Capacity must be at least 1.'),
  description: z.string().trim().max(500).optional(),
});

export const goodsReceiptSchema = z.object({
  product: z.string().min(1, 'Product is required.'),
  supplier: z.string().min(1, 'Supplier is required.'),
  location: z.string().min(1, 'Location is required.'),
  quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1.').max(1000000, 'Quantity too large.'),
  referenceNote: z.string().trim().max(500).optional(),
  receiptDate: z
    .string()
    .refine((val) => {
      const date = new Date(val);
      return !isNaN(date.getTime()) && date <= new Date();
    }, 'Receipt date must be a valid date and not in the future.'),
});

export const dispatchOrderSchema = z.object({
  product: z.string().min(1, 'Product is required.'),
  client: z.string().min(1, 'Client is required.'),
  quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1.').max(1000000, 'Quantity too large.'),
  notes: z.string().trim().max(500).optional(),
});

export const approveDispatchSchema = z.object({
  reason: z.string().trim().max(500).optional(),
});

export const rejectDispatchSchema = z.object({
  reason: z.string().trim().min(1, 'Rejection reason is required.').max(500),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});
