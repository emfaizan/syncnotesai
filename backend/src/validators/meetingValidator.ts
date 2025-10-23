import Joi from 'joi';

export const createMeetingSchema = Joi.object({
  title: Joi.string().min(1).max(200).required().messages({
    'string.min': 'Title is required',
    'string.max': 'Title must not exceed 200 characters',
    'any.required': 'Title is required',
  }),
  meetingUrl: Joi.string().uri().required().messages({
    'string.uri': 'Please provide a valid meeting URL',
    'any.required': 'Meeting URL is required',
  }),
  platform: Joi.string()
    .valid('zoom', 'meet', 'teams', 'webex', 'other')
    .required()
    .messages({
      'any.only': 'Platform must be one of: zoom, meet, teams, webex, other',
      'any.required': 'Platform is required',
    }),
  scheduledAt: Joi.date().iso().optional(),
  description: Joi.string().max(1000).optional(),
  clickupListId: Joi.string().optional(),
});
