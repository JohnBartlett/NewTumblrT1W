/**
 * Input Validation Schemas
 * Using Zod for type-safe validation
 */

import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

// ===== Auth Schemas =====

export const registerSchema = z.object({
  email: z.string().email('Invalid email address').max(255),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must not exceed 30 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-zA-Z]/, 'Password must contain at least one letter')
    .regex(/\d/, 'Password must contain at least one number')
    .max(128, 'Password must not exceed 128 characters'),
  displayName: z.string().max(100).optional(),
});

export const loginSchema = z.object({
  emailOrUsername: z.string().min(1, 'Email or username is required').max(255),
  password: z.string().min(1, 'Password is required').max(128),
});

export const changePasswordSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-zA-Z]/, 'Password must contain at least one letter')
    .regex(/\d/, 'Password must contain at least one number')
    .max(128, 'Password must not exceed 128 characters'),
});

export const passwordResetRequestSchema = z.object({
  emailOrUsername: z.string().min(1, 'Email or username is required').max(255),
});

export const passwordResetSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-zA-Z]/, 'Password must contain at least one letter')
    .regex(/\d/, 'Password must contain at least one number')
    .max(128, 'Password must not exceed 128 characters'),
});

export const emailVerificationSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});

// ===== User Schemas =====

export const updateUserSchema = z.object({
  displayName: z.string().max(100).optional(),
  bio: z.string().max(500).optional(),
  avatar: z.string().url('Invalid avatar URL').optional(),
});

export const updatePreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  fontSize: z.number().min(12).max(24).optional(),
  reducedMotion: z.boolean().optional(),
  enableHaptics: z.boolean().optional(),
  enableGestures: z.boolean().optional(),
  allowDuplicateImageUrls: z.boolean().optional(),
  maxStoredNotes: z.number().min(10).max(200).optional(),
  blogFilterLimit: z.number().min(5).max(100).optional(),
  slideshowInterval: z.number().min(1).max(60).optional(),
  slideshowAutoplay: z.boolean().optional(),
  slideshowShuffle: z.boolean().optional(),
  slideshowTransition: z.enum(['fade', 'slide', 'zoom', 'kenburns']).optional(),
});

// ===== Stored Image Schemas =====

export const storeImageSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  images: z.array(
    z.object({
      postId: z.string().min(1, 'Post ID is required').max(255),
      blogName: z.string().min(1, 'Blog name is required').max(255),
      url: z.string().url('Invalid image URL'),
      width: z.number().int().positive().optional(),
      height: z.number().int().positive().optional(),
      tags: z.array(z.string().max(100)).max(50).optional().default([]),
      description: z.string().max(1000).optional(),
      notes: z.number().int().nonnegative().default(0),
      notesData: z.array(z.any()).optional(),
      cost: z.number().nonnegative().optional(),
      timestamp: z.string().datetime().or(z.date()),
    })
  ).min(1, 'At least one image is required').max(1000, 'Cannot store more than 1000 images at once'),
});

export const updateImageCostSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  cost: z.number().nonnegative('Cost must be a positive number'),
});

export const deleteImageSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
});

export const getImagesSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  limit: z.number().int().positive().max(1000).default(50).optional(),
  offset: z.number().int().nonnegative().default(0).optional(),
  blogName: z.string().max(255).optional(),
});

// ===== Blog Schemas =====

export const blogIdentifierSchema = z.object({
  blogIdentifier: z.string().min(1, 'Blog identifier is required').max(255),
});

export const postIdSchema = z.object({
  postId: z.string().min(1, 'Post ID is required').max(255),
});

export const searchQuerySchema = z.object({
  q: z.string().min(1, 'Search query is required').max(500),
  limit: z.number().int().positive().max(100).default(20).optional(),
  offset: z.number().int().nonnegative().default(0).optional(),
});

// ===== Admin Schemas =====

export const updateUserRoleSchema = z.object({
  role: z.enum(['USER', 'ADMIN', 'MODERATOR']),
});

export const userIdParamSchema = z.object({
  id: z.string().uuid('Invalid user ID'),
});

// ===== OAuth Schemas =====

export const tumblrConnectSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
});

export const tumblrCallbackSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  oauthToken: z.string().min(1, 'OAuth token is required'),
  oauthVerifier: z.string().min(1, 'OAuth verifier is required'),
});

export const tumblrDisconnectSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
});

// ===== Validation Middleware =====

/**
 * Validate request body against a Zod schema
 */
export function validateBody(schema: z.ZodSchema) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = await schema.parseAsync(req.body);
      req.body = validated; // Replace with validated data
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid request data',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      next(error);
    }
  };
}

/**
 * Validate request params against a Zod schema
 */
export function validateParams(schema: z.ZodSchema) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = await schema.parseAsync(req.params);
      req.params = validated; // Replace with validated data
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid URL parameters',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      next(error);
    }
  };
}

/**
 * Validate request query against a Zod schema
 */
export function validateQuery(schema: z.ZodSchema) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = await schema.parseAsync(req.query);
      req.query = validated; // Replace with validated data
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid query parameters',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      next(error);
    }
  };
}






