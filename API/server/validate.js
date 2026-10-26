const { body, query, validationResult } = require("express-validator");

const readRules = [
    query("detail").optional().isBoolean().withMessage("detail must be a boolean")
];

const clearRules = [
    body().custom((value) => {
        if (value == null || typeof value !== "object" || Array.isArray(value)) {
            throw new Error("body must be an object");
        }
        return true;
    })
];

const incidentRules = [
    body("title")
        .isString()
        .withMessage("title must be a string")
        .bail()
        .trim()
        .notEmpty()
        .withMessage("title is required")
];

function rejectValidation(req, res) {
    const result = validationResult(req);
    if (result.isEmpty()) return false;
    res.status(400).json({ success: false, error: result.array()[0].msg });
    return true;
}

function validate(body, schema) {
    const errors = [];
    if (body === null || typeof body !== "object" || Array.isArray(body)) {
        return { ok: false, errors: ["body must be an object"] };
    }

    for (const [name, rule] of Object.entries(schema)) {
        const value = body[name];
        const missing = value === undefined || value === null || value === "";
        if (rule.required && missing) {
            errors.push(`${name} is required`);
            continue;
        }
        if (!missing && rule.type && typeof value !== rule.type) {
            errors.push(`${name} must be a ${rule.type}`);
        }
    }

    return { ok: errors.length === 0, errors };
}

module.exports = { incidentRules, clearRules, readRules, rejectValidation, validate };
