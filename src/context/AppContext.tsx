/**
 * Application Context Provider
 *
 * Provider component for the application context.
 */

import { useReducer, type ReactNode } from 'react';
import { AppContext, appReducer, initialState, type AppContextValue } from './appContextDef';
import type { BoardWithButtons, ButtonWithMedia, GridLayout, RecordingState, AppMode } from '../types';

// Re-export for convenience
export { AppContext, type AppContextValue } from './appContextDef';

// Provider
interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const value: AppContextValue = {
    state,
    dispatch,
    setLoading: (loading: boolean) => dispatch({ type: 'SET_LOADING', payload: loading }),
    setError: (error: string | null) => dispatch({ type: 'SET_ERROR', payload: error }),
    setBoard: (board: BoardWithButtons) => dispatch({ type: 'SET_BOARD', payload: board }),
    setMode: (mode: AppMode) => dispatch({ type: 'SET_MODE', payload: mode }),
    selectButton: (buttonId: string | null) => dispatch({ type: 'SELECT_BUTTON', payload: buttonId }),
    updateButton: (button: ButtonWithMedia) => dispatch({ type: 'UPDATE_BUTTON', payload: button }),
    setLayout: (layout: GridLayout) => dispatch({ type: 'SET_LAYOUT', payload: layout }),
    setRecordingState: (recordingState: RecordingState) =>
      dispatch({ type: 'SET_RECORDING_STATE', payload: recordingState }),
    setRecordingTime: (time: number) => dispatch({ type: 'SET_RECORDING_TIME', payload: time }),
    resetRecording: () => dispatch({ type: 'RESET_RECORDING' }),
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
