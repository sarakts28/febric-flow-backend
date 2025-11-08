import createError from "../utilies/errorHandle.js";

/**
 * Middleware to check if user has required roles
 * @param {Array} allowedRoles - Array of roles that are allowed to access the route
 * @returns {Function} Express middleware function
 */
const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.userType) {
      return next(createError("User information not found", 401));
    }

    const userRole = req.user.userType.toLowerCase();
    
    if (!allowedRoles.includes(userRole)) {
      const rolesString = allowedRoles.join(' or ');
      return next(
        createError(
          `Not authorized. Only ${rolesString} can access this resource.`,
          403
        )
      );
    }
    
    next();
  };
};

export default checkRole;
