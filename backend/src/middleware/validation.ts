import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

export const validateRequest = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    //console.log('REQ BODY:', req.body);

    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      console.log('VALIDATION ERRORS:', error.details);

      res.status(400).json({
        error: error.details.map((d) => d.message),
      });

      return;
    }

    req.body = value;
    next();
  };
};

export const schemas = {
  signup: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  createTask: Joi.object({
    title: Joi.string().max(255).required(),
    description: Joi.string().allow('').optional(),
    priority: Joi.string().valid('Low', 'Medium', 'High').default('Medium'),
    status: Joi.string().valid('Todo', 'In-Progress', 'Completed').default('Todo'),
    due_date: Joi.date().allow(null).optional(),
    workspace_id: Joi.string().uuid().allow(null).optional(),
    assignee_email: Joi.string().email().allow(null, '').optional(), // ✅ Added
  }),

  updateTask: Joi.object({
    title: Joi.string().max(255).optional(),
    description: Joi.string().allow('').optional(),
    priority: Joi.string().valid('Low', 'Medium', 'High').optional(),
    status: Joi.string().valid('Todo', 'In-Progress', 'Completed').optional(),
    due_date: Joi.date().allow(null).optional(),
    completed_at: Joi.date().allow(null).optional(),
    assignee_email: Joi.string().email().allow(null, '').optional(), // ✅ Added
  }),

  createWorkspace: Joi.object({
    name: Joi.string().max(100).required(),
  }),

  inviteMember: Joi.object({
    email: Joi.string().email().required(),
  }),
};