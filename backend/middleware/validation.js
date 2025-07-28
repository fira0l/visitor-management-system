const { body, validationResult } = require("express-validator")
const { AppError } = require("../utils/appError")

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((error) => error.msg)
    return next(new AppError(errorMessages.join(". "), 400))
  }
  next()
}

const validateLogin = [
  body("username")
    .notEmpty()
    .withMessage("Username is required")
    .isLength({ min: 3 })
    .withMessage("Username must be at least 3 characters"),
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  handleValidationErrors,
]

const validateRegistration = [
  body("username")
    .notEmpty()
    .withMessage("Username is required")
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be between 3 and 30 characters"),
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please enter a valid email address"),
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  body("fullName")
    .notEmpty()
    .withMessage("Full name is required")
    .isLength({ max: 50 })
    .withMessage("Full name cannot exceed 50 characters"),
  body("role")
    .notEmpty()
    .withMessage("Role is required")
    .isIn(["department_user", "security", "gate"])
    .withMessage("Role must be department_user, security, or gate"),
  body("department")
    .if(body("role").equals("department_user"))
    .notEmpty()
    .withMessage("Department is required for department users"),
  body("departmentType")
    .if(body("role").equals("department_user"))
    .notEmpty()
    .withMessage("Department type is required for department users")
    .isIn(["wing", "director", "division"])
    .withMessage("Department type must be wing, director, or division"),
  body("location")
    .notEmpty()
    .withMessage("Location is required")
    .isIn(["Wollo Sefer", "Operation"])
    .withMessage("Location must be Wollo Sefer or Operation"),
  handleValidationErrors,
]

const validateVisitorRequest = [
  body("visitorName")
    .notEmpty()
    .withMessage("Visitor name is required")
    .isLength({ max: 100 })
    .withMessage("Visitor name cannot exceed 100 characters"),
  body("visitorId")
    .notEmpty()
    .withMessage("Visitor ID is required")
    .isLength({ max: 50 })
    .withMessage("Visitor ID cannot exceed 50 characters"),
  body("visitorPhone")
    .notEmpty()
    .withMessage("Visitor phone is required")
    .matches(/^[+]?[1-9][\d]{0,15}$/)
    .withMessage("Please enter a valid phone number"),
  body("nationalId")
    .notEmpty()
    .withMessage("National ID is required")
    .isLength({ max: 50 })
    .withMessage("National ID cannot exceed 50 characters"),
  body("purpose")
    .notEmpty()
    .withMessage("Purpose of visit is required")
    .isLength({ max: 500 })
    .withMessage("Purpose cannot exceed 500 characters"),
  body("scheduledDate")
    .notEmpty()
    .withMessage("Scheduled date is required")
    .isISO8601()
    .withMessage("Please enter a valid date"),
  body("scheduledTime")
    .notEmpty()
    .withMessage("Scheduled time is required")
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage("Please enter time in HH:MM format"),
  body("location")
    .notEmpty()
    .withMessage("Location is required")
    .isIn(["Wollo Sefer", "Operation"])
    .withMessage("Location must be Wollo Sefer or Operation"),
  body("departmentType")
    .notEmpty()
    .withMessage("Department type is required")
    .isIn(["wing", "director", "division"])
    .withMessage("Department type must be wing, director, or division"),
  body("gateAssignment")
    .if(body("departmentType").equals("wing"))
    .notEmpty()
    .withMessage("Gate assignment is required for wing departments")
    .isIn(["Gate 1", "Gate 2", "Gate 3"])
    .withMessage("Gate assignment must be Gate 1, Gate 2, or Gate 3"),
  body("accessType")
    .if(body("departmentType").equals("wing"))
    .notEmpty()
    .withMessage("Access type is required for wing departments")
    .isIn(["VIP", "Guest"])
    .withMessage("Access type must be VIP or Guest"),
  body("isGroupVisit")
    .optional()
    .isBoolean()
    .withMessage("isGroupVisit must be a boolean"),
  body("companyName")
    .if(body("isGroupVisit").equals(true))
    .notEmpty()
    .withMessage("Company name is required for group visits")
    .isLength({ max: 100 })
    .withMessage("Company name cannot exceed 100 characters"),
  body("groupSize")
    .if(body("isGroupVisit").equals(true))
    .notEmpty()
    .withMessage("Group size is required for group visits")
    .isInt({ min: 1, max: 100 })
    .withMessage("Group size must be between 1 and 100"),
  body("originDepartment")
    .if(body("isGroupVisit").equals(false))
    .optional()
    .isLength({ max: 100 })
    .withMessage("Origin department cannot exceed 100 characters"),
  handleValidationErrors,
]

module.exports = {
  validateLogin,
  validateRegistration,
  validateVisitorRequest,
  handleValidationErrors,
}
