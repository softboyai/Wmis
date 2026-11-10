import { z } from 'zod';

export const commonPasswords = [
  'password', 'password1', 'password123', '123456', '12345678', '123456789',
  'qwerty', 'abc123', 'letmein', 'monkey', 'dragon', 'master', 'sunshine',
  'princess', 'welcome', 'shadow', 'superman', 'iloveyou', 'admin', 'admin123',
  'pass', 'test', 'guest', 'login', 'changeme', 'secret', 'pass123', 'Pa$$w0rd',
  'P@ssword', 'P@ssw0rd', 'Admin@123', 'Passw0rd', 'Password1', 'Password1!',
];

const rwandaPhone = /^(\+250|0)7[2389]\d{7}$/;

export const fullNameSchema = z
  .string()
  .trim()
  .transform((val) => val.replace(/\s+/g, ' '))
  .refine((val) => val.length >= 2 && val.length <= 50, {
    message: 'Enter your real name using letters only (2 to 50 characters).',
  })
  .refine((val) => /^[\p{L}][\p{L}\p{M}'' \-]{1,49}$/u.test(val), {
    message: 'Enter your real name using letters only (2 to 50 characters).',
  });

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email({ message: 'Please enter a valid email address.' })
  .max(254)
  .refine((val) => !val.includes(' '), 'Email must not contain spaces.');

export const passwordSchema = (email = '', fullName = '') =>
  z
    .string()
    .min(8, 'Password must be at least 8 characters.')
    .max(64, 'Password must not exceed 64 characters.')
    .refine((val) => !val.includes(' '), 'Password must not contain spaces.')
    .refine((val) => /[A-Z]/.test(val), 'Must contain at least one uppercase letter.')
    .refine((val) => /[a-z]/.test(val), 'Must contain at least one lowercase letter.')
    .refine((val) => /[0-9]/.test(val), 'Must contain at least one number.')
    .refine((val) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~]/.test(val), 'Must contain at least one special character.')
    .refine((val) => {
      const lower = val.toLowerCase();
      const emailName = email.split('@')[0]?.toLowerCase();
      const firstName = fullName.split(' ')[0]?.toLowerCase();
      if (emailName && emailName.length > 2 && lower.includes(emailName)) return false;
      if (firstName && firstName.length > 2 && lower.includes(firstName)) return false;
      return true;
    }, 'Password must not contain your name or email.')
    .refine((val) => !commonPasswords.includes(val.toLowerCase()), 'This password is too common.');

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required.'),
});

export const changePasswordSchema = (email = '', fullName = '') =>
  z.object({
    currentPassword: z.string().min(1, 'Current password is required.'),
    newPassword: passwordSchema(email, fullName),
    confirmPassword: z.string(),
  }).refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

export const productSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters.').max(100),
  sku: z.string().trim().toUpperCase().min(3, 'SKU must be at least 3 characters.').max(20)
    .regex(/^[A-Z0-9-]+$/, 'SKU: uppercase letters, numbers, and hyphens only.'),
  category: z.string().trim().min(1, 'Category is required.'),
  unit: z.string().trim().min(1, 'Unit is required.'),
  minimumStock: z.coerce.number().int().min(0, 'Minimum stock must be 0 or greater.'),
  supplier: z.string().optional().nullable(),
  description: z.string().trim().max(500).optional(),
});

export const supplierSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters.').max(100),
  email: z.string().trim().toLowerCase().email('Invalid email.').max(254).optional().or(z.literal('')),
  phone: z.string().trim()
    .refine((v) => !v || rwandaPhone.test(v), 'Enter a valid Rwanda phone number.')
    .optional().or(z.literal('')),
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
  quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1.').max(1000000),
  referenceNote: z.string().trim().max(500).optional(),
  receiptDate: z.string().refine((v) => {
    const d = new Date(v);
    return !isNaN(d.getTime()) && d <= new Date();
  }, 'Date must be valid and not in the future.'),
});

export const dispatchOrderSchema = z.object({
  product: z.string().min(1, 'Product is required.'),
  client: z.string().min(1, 'Client is required.'),
  quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1.').max(1000000),
  notes: z.string().trim().max(500).optional(),
});

export const registerUserSchema = (email = '', fullName = '') =>
  z.object({
    fullName: fullNameSchema,
    email: emailSchema,
    password: passwordSchema(email, fullName),
    confirmPassword: z.string(),
    role: z.enum(['administrator', 'manager', 'storekeeper'], {
      errorMap: () => ({ message: 'Invalid role.' }),
    }),
  }).refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });
