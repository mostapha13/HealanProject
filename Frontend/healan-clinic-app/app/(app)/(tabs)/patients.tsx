import React from 'react';
import { Redirect } from 'expo-router';
import { useAccess } from '../../../src/access/AccessContext';
import { CrudModuleView } from '../../../src/modules/CrudModuleView';

/** Bottom-tab entry for Patients — Admin/staff with /patients AccessForm. */
export default function PatientsTab() {
  const { canAccess, loading } = useAccess();

  if (loading) return null;
  if (!canAccess('/patients')) return <Redirect href="/(app)/(tabs)/index" />;

  return <CrudModuleView moduleId="patients" title="بیماران" />;
}
