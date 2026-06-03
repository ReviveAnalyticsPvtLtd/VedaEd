const workspaceService = require("../services/workspaceService");
const { validateCheckWorkspaceBody } = require("../validators/workspaceValidators");

exports.checkAvailability = async (req, res) => {
  try {
    const validation = validateCheckWorkspaceBody(req.body);
    if (validation.errors.length) {
      return res.status(400).json({
        success: false,
        message: validation.errors[0],
        errors: validation.errors,
      });
    }

    const result = await workspaceService.checkWorkspaceAvailability(
      {
        schoolName: validation.schoolName,
        workspaceSlug: validation.workspaceSlug,
      },
      req.user?.userId
    );

    return res.json({
      available: result.available,
      ...(result.reason ? { reason: result.reason } : {}),
    });
  } catch (error) {
    console.error("workspace checkAvailability error:", error);
    const status = error.statusCode || 500;
    return res.status(status).json({
      success: false,
      message: error.message || "Failed to check workspace availability",
      errors: error.errors,
    });
  }
};
