import React, { createContext, useContext } from 'react';
import { AppRole } from '@/hooks/useRoleBasedView';
import { PermissionKey, hasPermission as checkPermission } from '@/constants/permissions';
import { ROLE_TYPE } from '@/types/api.types';

interface RoleContextType {
  role: AppRole | null;
  hasPermission: (permission: PermissionKey) => boolean;
}

const RoleContext = createContext<RoleContextType>({
  role: null,
  hasPermission: () => false,
});

interface RoleProviderProps {
  role: AppRole | null;
  children: React.ReactNode;
}

export const RoleProvider: React.FC<RoleProviderProps> = ({ role, children }) => {
  const hasPermission = (permission: PermissionKey) => {
    // Consumers don't have backend RBAC permissions in this system
    if (role === 'CONSUMER' || role === null) return false;
    return checkPermission(role as ROLE_TYPE, permission);
  };

  return (
    <RoleContext.Provider value={{ role, hasPermission }}>
      {children}
    </RoleContext.Provider>
  );
};

export const useRoleContext = () => useContext(RoleContext);
