import { OrganizationManager } from '../../providers/organization-manager';
import type { QueryResolvers } from './../../../../__generated__/types';

export const organizations: NonNullable<QueryResolvers['organizations']> = async (
  _,
  __,
  { injector },
) => {
  return injector.get(OrganizationManager).getOrganizations();
};
