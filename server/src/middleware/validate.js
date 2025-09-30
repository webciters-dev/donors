// server/src/middleware/validate.js
export function validate(schema) {
  return (req, res, next) => {
    const parsed = schema.safeParse(req.body);
    if (parsed.success) {
      req.body = parsed.data; // use the coerced/cleaned values
      return next();
    }
    const errors = parsed.error.issues.map((i) => ({
      path: i.path.join("."),
      message: i.message,
    }));
    return res.status(422).json({
      message: "Validation failed",
      errors,
    });
  };
}
