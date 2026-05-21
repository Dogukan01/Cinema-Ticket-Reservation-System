const Joi = require('joi');

const registerSchema = Joi.object({
    firstName: Joi.string().required().messages({ 'any.required': 'Ad alanı zorunludur.' }),
    lastName: Joi.string().required().messages({ 'any.required': 'Soyad alanı zorunludur.' }),
    email: Joi.string().email().required().messages({ 'string.email': 'Geçerli bir e-posta girin.', 'any.required': 'E-posta zorunludur.' }),
    password: Joi.string().min(6).required().messages({ 'string.min': 'Parola en az 6 karakter olmalıdır.', 'any.required': 'Parola zorunludur.' }),
    role: Joi.string().valid('admin', 'cashier', 'customer').optional(),
    identityNumber: Joi.string().allow('', null).optional(),
    birthDate: Joi.date().required().messages({ 'any.required': 'Doğum tarihi zorunludur.', 'date.base': 'Geçerli bir doğum tarihi giriniz.' }),
    phoneNumber: Joi.string().pattern(/^05[0-9]{9}$/).required().messages({
        'string.pattern.base': 'Lütfen geçerli bir Türkiye telefon numarası giriniz (Örn: 05xxxxxxxxx).',
        'string.empty': 'Cep telefonu alanı zorunludur.',
        'any.required': 'Cep telefonu alanı zorunludur.'
    }),
    gender: Joi.string().valid('Kadın', 'Erkek').required().messages({ 'any.required': 'Cinsiyet seçimi zorunludur.' }),
    smsAllowed: Joi.boolean().optional(),
    emailAllowed: Joi.boolean().optional()
});

const loginSchema = Joi.object({
    email: Joi.string().email().required().messages({ 'string.email': 'Geçerli bir e-posta girin.', 'any.required': 'E-posta zorunludur.' }),
    password: Joi.string().required().messages({ 'any.required': 'Parola zorunludur.' })
});

module.exports = {
    registerSchema,
    loginSchema
};
