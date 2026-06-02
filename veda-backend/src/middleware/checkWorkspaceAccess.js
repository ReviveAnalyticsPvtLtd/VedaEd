const Workspace = require("../modules/workspace/models/workspaceModel");
const {
  isWorkspaceAccessActive,
} = require("../modules/workspace/services/workspaceService");
const {
  SUBSCRIPTION_STATUS,
  PAYMENT_STATUS,
} = require("../modules/workspace/constants/workspaceConstants");

/**
 * Reusable middleware for future workspace-scoped routes.
 * Validates subscription, payment, workspaceAccess flag, and expiry.
 */
const checkWorkspaceAccess = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
        code: "UNAUTHORIZED",
      });
    }

    const workspace = await Workspace.findOne({ userId }).lean();
    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: "Workspace not found. Complete onboarding first.",
        code: "WORKSPACE_NOT_FOUND",
        redirectTo: "/onboarding/step-2",
      });
    }

    req.workspace = workspace;

    if (isWorkspaceAccessActive(workspace)) {
      return next();
    }

    let reason = "Workspace access requires an active subscription.";
    if (workspace.subscriptionExpiresAt && new Date(workspace.subscriptionExpiresAt) < new Date()) {
      reason = "Your subscription has expired.";
    } else if (workspace.subscriptionStatus !== SUBSCRIPTION_STATUS.ACTIVE) {
      reason = "No active subscription found for this workspace.";
    } else if (workspace.paymentStatus !== PAYMENT_STATUS.PAID) {
      reason = "Payment is required to access this workspace.";
    } else if (!workspace.workspaceAccess) {
      reason = "Workspace access has not been enabled yet.";
    }

    return res.status(403).json({
      success: false,
      message: reason,
      code: "WORKSPACE_ACCESS_DENIED",
      redirectTo: "/pricing",
      workspace: {
        workspaceSlug: workspace.workspaceSlug,
        subscriptionStatus: workspace.subscriptionStatus,
        paymentStatus: workspace.paymentStatus,
        workspaceAccess: workspace.workspaceAccess,
        subscriptionExpiresAt: workspace.subscriptionExpiresAt,
      },
    });
  } catch (error) {
    console.error("checkWorkspaceAccess error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to verify workspace access",
    });
  }
};

module.exports = checkWorkspaceAccess;
