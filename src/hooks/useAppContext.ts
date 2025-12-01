/**
 * useAppContext Hook
 *
 * Hook to access the application context.
 */

import { useContext } from 'react';
import { AppContext } from '../context/appContextDef';

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
