import { z } from 'zod';


// USER VALIDATION SCHEMAS


export const registerSchema = z.object({
  body: z.object({
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Invalid email format')
      .toLowerCase()
      .trim(),
    
    password: z
      .string()
      .min(6, 'Password must be at least 6 characters')
      .max(100, 'Password is too long'),
    
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(50, 'Name is too long')
      .trim(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Invalid email format')
      .toLowerCase()
      .trim(),
    
    password: z
      .string()
      .min(1, 'Password is required'),
  }),
});


// PRODUCT VALIDATION SCHEMAS


export const createProductSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(3, 'Product name must be at least 3 characters')
      .max(100, 'Product name is too long')
      .trim(),
    
    price: z
      .number()
      .positive('Price must be positive')
      .max(1000000, 'Price is too high'),
    
    description: z
      .string()
      .max(1000, 'Description is too long')
      .trim()
      .optional(),
    
    stock: z
      .number()
      .int('Stock must be an integer')
      .nonnegative('Stock cannot be negative')
      .default(0),
    
    categoryId: z
      .string()
      .min(1, 'Category ID is required')
      .optional(),
    
    images: z
      .array(z.string().url('Invalid image URL'))
      .max(10, 'Maximum 10 images allowed')
      .default([]),
  }),
});

export const updateProductSchema = z.object({
  params: z.object({
    id: z
      .string()
      .min(1, 'Product ID is required'),
  }),
  body: z.object({
    name: z
      .string()
      .min(3, 'Product name must be at least 3 characters')
      .max(100, 'Product name is too long')
      .trim()
      .optional(),
    
    price: z
      .number()
      .positive('Price must be positive')
      .max(1000000, 'Price is too high')
      .optional(),
    
    description: z
      .string()
      .max(1000, 'Description is too long')
      .trim()
      .optional(),
    
    stock: z
      .number()
      .int('Stock must be an integer')
      .nonnegative('Stock cannot be negative')
      .optional(),
    
    categoryId: z
      .string()
      .min(1, 'Category ID cannot be empty')
      .optional()
      .nullable(),
    
    images: z
      .array(z.string().url('Invalid image URL'))
      .max(10, 'Maximum 10 images allowed')
      .optional(),
  }),
});

export const productIdSchema = z.object({
  params: z.object({
    id: z
      .string()
      .min(1, 'Product ID is required'),
  }),
});


// CATEGORY VALIDATION SCHEMAS


export const createCategorySchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(2, 'Category name must be at least 2 characters')
      .max(50, 'Category name is too long')
      .trim(),
    
    description: z
      .string()
      .max(200, 'Description is too long')
      .trim()
      .optional(),
  }),
});

export const updateCategorySchema = z.object({
  params: z.object({
    id: z
      .string()
      .min(1, 'Category ID is required'),
  }),
  body: z.object({
    name: z
      .string()
      .min(2, 'Category name must be at least 2 characters')
      .max(50, 'Category name is too long')
      .trim()
      .optional(),
    
    description: z
      .string()
      .max(200, 'Description is too long')
      .trim()
      .optional(),
  }),
});

export const categoryIdSchema = z.object({
  params: z.object({
    id: z
      .string()
      .min(1, 'Category ID is required'),
  }),
});


// CART VALIDATION SCHEMAS


export const addToCartSchema = z.object({
  body: z.object({
    productId: z
      .string()
      .min(1, 'Product ID is required'),
    
    quantity: z
      .number()
      .int('Quantity must be an integer')
      .positive('Quantity must be at least 1')
      .max(100, 'Cannot add more than 100 items at once')
      .default(1),
  }),
});

export const updateCartItemSchema = z.object({
  params: z.object({
    itemId: z
      .string()
      .min(1, 'Cart item ID is required'),
  }),
  body: z.object({
    quantity: z
      .number()
      .int('Quantity must be an integer')
      .positive('Quantity must be at least 1')
      .max(100, 'Quantity cannot exceed 100'),
  }),
});

export const removeCartItemSchema = z.object({
  params: z.object({
    itemId: z
      .string()
      .min(1, 'Cart item ID is required'),
  }),
});


// ORDER VALIDATION SCHEMAS


export const createOrderSchema = z.object({
  body: z.object({
    shippingAddress: z
      .string()
      .min(10, 'Shipping address must be at least 10 characters')
      .max(500, 'Shipping address is too long')
      .trim(),
    
    paymentMethod: z
      .enum(['CARD', 'PAYPAL', 'CASH_ON_DELIVERY'])
      .default('CARD'),
  }),
});

export const updateOrderStatusSchema = z.object({
  params: z.object({
    id: z
      .string()
      .min(1, 'Order ID is required'),
  }),
  body: z.object({
    status: z.enum(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']),
  }),
});

export const updatePaymentStatusSchema = z.object({
  params: z.object({
    id: z
      .string()
      .min(1, 'Order ID is required'),
  }),
  body: z.object({
    paymentStatus: z.enum(['PENDING', 'PAID', 'FAILED', 'REFUNDED']),
  }),
});

export const orderIdSchema = z.object({
  params: z.object({
    id: z
      .string()
      .min(1, 'Order ID is required'),
  }),
});


// QUERY PARAMETER VALIDATION SCHEMAS

export const paginationSchema = z.object({
  query: z.object({
    page: z
      .string()
      .optional()
      .default('1')
      .transform((val) => parseInt(val, 10))
      .refine((val) => !isNaN(val) && val > 0, {
        message: 'Page must be a positive number',
      }),
    
    limit: z
      .string()
      .optional()
      .default('10')
      .transform((val) => parseInt(val, 10))
      .refine((val) => !isNaN(val) && val > 0 && val <= 100, {
        message: 'Limit must be between 1 and 100',
      }),
    
    sortBy: z
      .string()
      .regex(/^[a-zA-Z]+$/, 'Sort field can only contain letters')
      .optional()
      .default('createdAt'),
    
    order: z
      .enum(['asc', 'desc'])
      .optional()
      .default('desc'),
  }),
});

export const productFilterSchema = z.object({
  query: z.object({
    category: z
      .string()
      .min(1, 'Category ID cannot be empty')
      .optional(),
    
    minPrice: z
      .string()
      .optional()
      .transform((val) => (val ? parseFloat(val) : undefined))
      .refine((val) => val === undefined || (!isNaN(val) && val >= 0), {
        message: 'Min price must be a positive number',
      }),
    
    maxPrice: z
      .string()
      .optional()
      .transform((val) => (val ? parseFloat(val) : undefined))
      .refine((val) => val === undefined || (!isNaN(val) && val >= 0), {
        message: 'Max price must be a positive number',
      }),
    
    search: z
      .string()
      .max(100, 'Search query is too long')
      .trim()
      .optional(),
    
    inStock: z
      .string()
      .optional()
      .transform((val) => val === 'true'),
  }),
});

export const categoryFilterSchema = z.object({
  query: z.object({
    search: z
      .string()
      .max(50, 'Search query is too long')
      .trim()
      .optional(),
  }),
});

export const orderFilterSchema = z.object({
  query: z.object({
    status: z
      .enum(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'])
      .optional(),
    
    startDate: z
      .string()
      .optional()
      .refine((val) => !val || !isNaN(Date.parse(val)), {
        message: 'Invalid start date format',
      }),
    
    endDate: z
      .string()
      .optional()
      .refine((val) => !val || !isNaN(Date.parse(val)), {
        message: 'Invalid end date format',
      }),
  }),
});


// ADVANCED VALIDATION EXAMPLES


// Password confirmation validation
export const registerWithConfirmSchema = z.object({
  body: z
    .object({
      email: z
        .string()
        .min(1, 'Email is required')
        .email('Invalid email format')
        .toLowerCase()
        .trim(),
      password: z
        .string()
        .min(6, 'Password must be at least 6 characters'),
      passwordConfirm: z.string(),
      name: z
        .string()
        .min(2, 'Name must be at least 2 characters')
        .trim(),
    })
    .refine((data) => data.password === data.passwordConfirm, {
      message: "Passwords don't match",
      path: ['passwordConfirm'],
    }),
});

// Date range validation
export const dateRangeSchema = z.object({
  query: z
    .object({
      startDate: z
        .string()
        .refine((val) => !isNaN(Date.parse(val)), {
          message: 'Invalid start date',
        }),
      endDate: z
        .string()
        .refine((val) => !isNaN(Date.parse(val)), {
          message: 'Invalid end date',
        }),
    })
    .refine((data) => new Date(data.startDate) <= new Date(data.endDate), {
      message: 'Start date must be before or equal to end date',
      path: ['endDate'],
    }),
});

// Price range validation
export const priceRangeSchema = z.object({
  query: z
    .object({
      minPrice: z.string().transform((val) => parseFloat(val)),
      maxPrice: z.string().transform((val) => parseFloat(val)),
    })
    .refine((data) => data.minPrice <= data.maxPrice, {
      message: 'Min price must be less than or equal to max price',
      path: ['maxPrice'],
    }),
});


// TYPE EXPORTS (for TypeScript)


export type RegisterInput = z.infer<typeof registerSchema>['body'];
export type LoginInput = z.infer<typeof loginSchema>['body'];
export type CreateProductInput = z.infer<typeof createProductSchema>['body'];
export type UpdateProductInput = z.infer<typeof updateProductSchema>['body'];
export type CreateCategoryInput = z.infer<typeof createCategorySchema>['body'];
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>['body'];
export type AddToCartInput = z.infer<typeof addToCartSchema>['body'];
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>['body'];
export type CreateOrderInput = z.infer<typeof createOrderSchema>['body'];
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>['body'];


// REUSABLE FIELD VALIDATORS


export const emailValidator = z
  .string()
  .min(1, 'Email is required')
  .email('Invalid email format')
  .toLowerCase()
  .trim();

export const passwordValidator = z
  .string()
  .min(6, 'Password must be at least 6 characters')
  .max(100, 'Password is too long');

export const nameValidator = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(50, 'Name is too long')
  .trim();

export const priceValidator = z
  .number()
  .positive('Price must be positive')
  .max(1000000, 'Price is too high');

export const quantityValidator = z
  .number()
  .int('Quantity must be an integer')
  .positive('Quantity must be at least 1')
  .max(100, 'Quantity cannot exceed 100');

export const idValidator = z
  .string()
  .min(1, 'ID cannot be empty');

export const urlValidator = z
  .string()
  .url('Invalid URL format');

export const phoneValidator = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format');
