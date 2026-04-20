import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

export const validateRequest = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body);

    if (error) {
      res.status(400).json({ error: error.details[0].message });
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
    workspace_id: Joi.string().uuid().required(),
    assigned_to: Joi.string().uuid().allow(null, '').optional(),
    title: Joi.string().max(255).required(),
    description: Joi.string().allow('').optional(),
    priority: Joi.string().valid('Low', 'Medium', 'High').default('Medium'),
    status: Joi.string().valid('Todo', 'In-Progress', 'Completed').default('Todo'),
    due_date: Joi.date().allow(null).optional(),
  }),

  updateTask: Joi.object({
    assigned_to: Joi.string().uuid().allow(null, '').optional(),
    title: Joi.string().max(255).optional(),
    description: Joi.string().allow('').optional(),
    priority: Joi.string().valid('Low', 'Medium', 'High').optional(),
    status: Joi.string().valid('Todo', 'In-Progress', 'Completed').optional(),
    due_date: Joi.date().allow(null).optional(),
    completed_at: Joi.date().allow(null).optional(),
  }),

  createWorkspace: Joi.object({
    name: Joi.string().max(255).required(),
  }),

  inviteToWorkspace: Joi.object({
    workspace_id: Joi.string().uuid().required(),
    email: Joi.string().email().required(),
    role: Joi.string().valid('admin', 'member').default('member'),
  }),
};
