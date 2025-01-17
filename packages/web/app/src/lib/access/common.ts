import React, { useEffect } from 'react';
import { OrganizationAccessScope, ProjectAccessScope, TargetAccessScope } from '@/gql/graphql';
import { useRouter } from '@tanstack/react-router';

export interface Scope<T> {
  name: string;
  description: string;
  mapping: {
    'read-only'?: T;
    'read-write': T;
  };
}

export const NoAccess = 'no-access';

export const RegistryAccessScope = {
  name: 'Registry',
  description: 'Manage registry (publish schemas, run checks, report usage)',
  mapping: {
    'read-only': TargetAccessScope.RegistryRead,
    'read-write': TargetAccessScope.RegistryWrite,
  },
};

export const scopes: {
  organization: readonly Scope<OrganizationAccessScope>[];
  project: readonly Scope<ProjectAccessScope>[];
  target: readonly Scope<TargetAccessScope>[];
} = {
  organization: [
    {
      name: 'Delete',
      description: 'The member will be able to delete an organization',
      mapping: {
        'read-write': OrganizationAccessScope.Delete,
      },
    },
    {
      name: 'Settings',
      description: "Manage organization's settings (change its name, etc.)",
      mapping: {
        'read-write': OrganizationAccessScope.Settings,
      },
    },
    {
      name: 'Integrations',
      description: 'Manage 3rd party integrations (Slack, GitHub, etc.)',
      mapping: {
        'read-write': OrganizationAccessScope.Integrations,
      },
    },
    {
      name: 'Members',
      description: 'Manage organization members (invite, remove, etc.)',
      mapping: {
        'read-write': OrganizationAccessScope.Members,
      },
    },
  ],
  project: [
    {
      name: 'Delete',
      description: 'The member will be able to delete a project',
      mapping: {
        'read-write': ProjectAccessScope.Delete,
      },
    },
    {
      name: 'Settings',
      description: 'Manage project settings (change its name, etc.)',
      mapping: {
        'read-write': ProjectAccessScope.Settings,
      },
    },
    {
      name: 'Alerts',
      description: 'Manage 3rd party integrations (Slack, GitHub, etc.)',
      mapping: {
        'read-write': ProjectAccessScope.Alerts,
      },
    },
    {
      name: 'Operations Store',
      description: 'Manage persisted operations',
      mapping: {
        'read-only': ProjectAccessScope.OperationsStoreRead,
        'read-write': ProjectAccessScope.OperationsStoreWrite,
      },
    },
  ],
  target: [
    {
      name: 'Delete',
      description: 'The member will be able to delete a target',
      mapping: {
        'read-write': TargetAccessScope.Delete,
      },
    },
    RegistryAccessScope,
    {
      name: 'Settings',
      description: 'Manage target settings (change its name, etc.)',
      mapping: {
        'read-write': TargetAccessScope.Settings,
      },
    },
    {
      name: 'Tokens',
      description: 'Manage access tokens',
      mapping: {
        'read-only': TargetAccessScope.TokensRead,
        'read-write': TargetAccessScope.TokensWrite,
      },
    },
  ],
};

export function useRedirect({
  canAccess,
  entity,
  redirectTo,
}: {
  canAccess: boolean;
  redirectTo?: (router: ReturnType<typeof useRouter>) => void;
  /** The entity that must be non-null for the redirect to happen. */
  entity?: any;
}) {
  const router = useRouter();
  const redirectRef = React.useRef(false);
  useEffect(() => {
    if (!redirectTo) {
      return;
    }

    if (!canAccess && entity && !redirectRef.current) {
      redirectRef.current = true;
      redirectTo(router);
    }
  }, [router, canAccess, redirectRef, redirectTo]);
}
