const Joi = require('joi');

const registerSchema = Joi.object({
    firstName: Joi.string().required().messages({ 'any.required': 'Ad alanı zorunludur.' }),
    lastName: Joi.string().required().messages({ 'any.required': 'Soyad alanı zorunludur.' }),
    email: Joi.string().email().required().messages({ 'string.email': 'Geçerli bir e-posta girin.', 'any.required': 'E-posta zorunludur.' }),
    password: Joi.string().min(6).required().messages({ 'string.min': 'Parola en az 6 karakter olmalıdır.', 'any.required': 'Parola zorunludur.' }),
    role: Joi.string().valid('admin', 'cashier', 'customer').optional(),
    identityNumber: Joi.string().required().messages({ 'any.required': 'TC Kimlik No zorunludur.' }),
    birthDate: Joi.date().optional()
});

const loginSchema = Joi.object({
    email: Joi.string().email().required().messages({ 'string.email': 'Geçerli bir e-posta girin.', 'any.required': 'E-posta zorunludur.' }),
    password: Joi.string().required().messages({ 'any.required': 'Parola zorunludur.' })
});

module.exports = {
    registerSchema,
    loginSchema
};
