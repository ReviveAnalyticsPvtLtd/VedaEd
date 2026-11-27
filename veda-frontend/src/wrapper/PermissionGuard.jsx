import React from 'react';
import { getStoredPermissions } from "../utils/authStorage";

const PermissionGuard = ({ requiredPermission, children }) => {
  const userPermissions = getStoredPermissions();

  if (userPermissions.includes(requiredPermission)) {
    return <>{children}</>;
  }

  return null;
};

export default PermissionGuard;
