/**
 * Application Context Definition
 *
 * Context type definitions and createContext call.
 * Separated from provider to satisfy react-refresh/only-export-components rule.
 */

import { createContext } from 'react';
import type {
  AppContext as AppContextType,
  AppAction,
  AppMode,
  BoardWithButtons,
  ButtonWithMedia,
  GridLayout,
  RecordingState,
} from '../types';

// Initial state
export const initialState: AppContextType = {
  mode: 'view',
  board: null,
  isLoading: true,
  error: null,
  selectedButtonId: null,
  recordingState: 'idle',
  recordingTime: 0,
};

// Reducer
export function appReducer(state: AppContextType, action: AppAction): AppContextType {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    case 'SET_BOARD':
      return { ...state, board: action.payload, isLoading: false };

    case 'SET_MODE':
      return {
        ...state,
        mode: action.payload,
        // Clear selection when leaving edit mode
        selectedButtonId: action.payload === 'view' ? null : state.selectedButtonId,
        // Reset recording state when leaving edit mode
        recordingState: action.payload === 'view' ? 'idle' : state.recordingState,
        recordingTime: action.payload === 'view' ? 0 : state.recordingTime,
      };

    case 'SELECT_BUTTON':
      return {
        ...state,
        selectedButtonId: action.payload,
        // Reset recording state when changing button
        recordingState: 'idle',
        recordingTime: 0,
      };

    case 'UPDATE_BUTTON': {
      if (!state.board) return state;

      const updatedButtons = state.board.buttons.map((b) =>
        b.id === action.payload.id ? action.payload : b
      );

      return {
        ...state,
        board: { ...state.board, buttons: updatedButtons },
      };
    }

    case 'SET_LAYOUT': {
      if (!state.board) return state;

      return {
        ...state,
        board: { ...state.board, layout: action.payload },
      };
    }

    case 'SET_RECORDING_STATE':
      return { ...state, recordingState: action.payload };

    case 'SET_RECORDING_TIME':
      return { ...state, recordingTime: action.payload };

    case 'RESET_RECORDING':
      return { ...state, recordingState: 'idle', recordingTime: 0 };

    default:
      return state;
  }
}

// Context value type
export interface AppContextValue {
  state: AppContextType;
  dispatch: React.Dispatch<AppAction>;
  // Convenience actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setBoard: (board: BoardWithButtons) => void;
  setMode: (mode: AppMode) => void;
  selectButton: (buttonId: string | null) => void;
  updateButton: (button: ButtonWithMedia) => void;
  setLayout: (layout: GridLayout) => void;
  setRecordingState: (state: RecordingState) => void;
  setRecordingTime: (time: number) => void;
  resetRecording: () => void;
}

export const AppContext = createContext<AppContextValue | null>(null);
