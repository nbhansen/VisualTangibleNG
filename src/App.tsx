/**
 * Main Application Component
 *
 * Handles app initialization, mode routing, and main layout.
 */

import { useEffect, useState, useCallback } from 'react';
import { AppProvider } from './context/AppContext';
import { useAppContext } from './hooks/useAppContext';
import { useStorage } from './hooks/useStorage';
import { ViewMode } from './components/ViewMode';
import { EditMode } from './components/EditMode';
import { PINSetup, PINEntry } from './components/PIN';
import { ErrorBoundary, Spinner } from './components/common';
import { getPinService } from './services/pin';
import './App.css';

function AppContent() {
  const { state, setBoard, setError, setLoading, setMode } = useAppContext();
  const { isInitialized, error: storageError, loadBoard } = useStorage();
  const [pinError, setPinError] = useState<string | null>(null);

  // Load board on initialization
  useEffect(() => {
    if (isInitialized && !state.board) {
      loadBoard().then((board) => {
        if (board) {
          setBoard(board);
        }
        setLoading(false);
      });
    }
  }, [isInitialized, state.board, loadBoard, setBoard, setLoading]);

  // Handle storage errors
  useEffect(() => {
    if (storageError) {
      setError(storageError);
    }
  }, [storageError, setError]);

  // Check if PIN is needed when entering pin-entry mode
  useEffect(() => {
    if (state.mode === 'pin-entry') {
      const checkPin = async () => {
        const pinService = getPinService();
        const isFirstRun = await pinService.isFirstRun();
        const isPinSet = await pinService.isPinSet();

        if (isFirstRun || !isPinSet) {
          setMode('pin-setup');
        }
      };
      checkPin();
    }
  }, [state.mode, setMode]);

  // Handle PIN setup completion
  const handlePinSetupComplete = useCallback(
    async (pin: string) => {
      try {
        const pinService = getPinService();
        await pinService.setPin(pin);
        setMode('edit');
      } catch (err) {
        setPinError(err instanceof Error ? err.message : 'Failed to set PIN');
      }
    },
    [setMode]
  );

  // Handle PIN entry verification
  const handlePinEntry = useCallback(
    async (pin: string) => {
      try {
        const pinService = getPinService();
        const isValid = await pinService.verifyPin(pin);

        if (isValid) {
          setPinError(null);
          setMode('edit');
        } else {
          setPinError('Incorrect PIN');
        }
      } catch (err) {
        setPinError(err instanceof Error ? err.message : 'Failed to verify PIN');
      }
    },
    [setMode]
  );

  // Handle cancel
  const handleCancel = useCallback(() => {
    setPinError(null);
    setMode('view');
  }, [setMode]);

  // Loading state
  if (state.isLoading && !state.board) {
    return (
      <div className="app-loading">
        <Spinner size="large" label="Loading application" />
        <p>Loading...</p>
      </div>
    );
  }

  // Error state
  if (state.error) {
    return (
      <div className="app-error" role="alert">
        <h1>Error</h1>
        <p>{state.error}</p>
        <button onClick={() => window.location.reload()}>Reload</button>
      </div>
    );
  }

  // Mode-based rendering
  switch (state.mode) {
    case 'view':
      return <ViewMode />;

    case 'pin-setup':
      return <PINSetup onComplete={handlePinSetupComplete} onCancel={handleCancel} />;

    case 'pin-entry':
      return <PINEntry onSubmit={handlePinEntry} onCancel={handleCancel} error={pinError} />;

    case 'edit':
      return <EditMode onExit={() => setMode('view')} />;

    default:
      return null;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ErrorBoundary>
  );
}

export default App;
