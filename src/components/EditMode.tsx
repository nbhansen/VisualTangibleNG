/**
 * EditMode Component
 *
 * Edit mode for configuring board buttons.
 */

import { useCallback, useState } from 'react';
import { Board } from './Board';
import { ButtonEditor, LayoutSelector, LabelPositionSelector } from './Editor';
import { useAppContext } from '../hooks/useAppContext';
import { useStorage } from '../hooks/useStorage';
import { getPinService } from '../services/pin';
import type { ButtonWithMedia, GridLayout, LabelPosition } from '../types';
import './Editor/Editor.css';

interface EditModeProps {
  onExit: () => void;
}

export function EditMode({ onExit }: EditModeProps) {
  const { state, selectButton, updateButton, setLayout, setBoard } = useAppContext();
  const { updateLayout, updateBoardLabelPosition, loadBoard } = useStorage();
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleButtonSelect = useCallback(
    (button: ButtonWithMedia) => {
      selectButton(button.id);
    },
    [selectButton]
  );

  const handleButtonUpdate = useCallback(
    (updatedButton: ButtonWithMedia) => {
      updateButton(updatedButton);
    },
    [updateButton]
  );

  const handleLayoutChange = useCallback(
    async (layout: GridLayout) => {
      // Update local state immediately for responsive UI
      setLayout(layout);
      // Persist to storage
      await updateLayout(layout);
    },
    [setLayout, updateLayout]
  );

  // Handle label position change (003-button-text)
  const handleLabelPositionChange = useCallback(
    async (position: LabelPosition) => {
      if (!state.board) return;

      // Persist to storage
      await updateBoardLabelPosition(state.board.id, position);

      // Refresh board to update all components
      const updatedBoard = await loadBoard();
      if (updatedBoard) {
        setBoard(updatedBoard);
      }
    },
    [state.board, updateBoardLabelPosition, loadBoard, setBoard]
  );

  const handleResetPin = useCallback(async () => {
    try {
      const pinService = getPinService();
      await pinService.resetPin();
      setShowResetConfirm(false);
      // User will need to set a new PIN next time they enter edit mode
    } catch (err) {
      console.error('Failed to reset PIN:', err);
    }
  }, []);

  const selectedButton = state.board?.buttons.find(
    (b) => b.id === state.selectedButtonId
  );

  if (!state.board) {
    return (
      <div className="edit-mode">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="edit-mode">
      <header className="edit-mode__header">
        <h1>Edit Board</h1>
        <button type="button" onClick={onExit}>
          Done
        </button>
      </header>

      <div className="edit-mode__content">
        <main className="edit-mode__board">
          <Board
            buttons={state.board.buttons}
            layout={state.board.layout}
            onButtonTap={() => {}}
            isEditMode={true}
            selectedButtonId={state.selectedButtonId}
            onButtonSelect={handleButtonSelect}
            labelPosition={state.board.labelPosition}
          />
        </main>

        <aside className="edit-mode__sidebar">
          <LayoutSelector
            currentLayout={state.board.layout}
            onLayoutChange={handleLayoutChange}
          />

          {/* Label Position Selector (003-button-text) */}
          <LabelPositionSelector
            currentPosition={state.board.labelPosition}
            onPositionChange={handleLabelPositionChange}
          />

          {selectedButton ? (
            <ButtonEditor
              button={selectedButton}
              onUpdate={handleButtonUpdate}
            />
          ) : (
            <div className="edit-mode__empty">
              <p>Select a button to edit</p>
            </div>
          )}

          {/* Settings Section */}
          <section className="edit-mode__settings">
            <h3>Settings</h3>
            {showResetConfirm ? (
              <div className="edit-mode__confirm">
                <p>Reset PIN? You will need to set a new PIN.</p>
                <div className="edit-mode__confirm-actions">
                  <button
                    type="button"
                    onClick={() => setShowResetConfirm(false)}
                    className="edit-mode__button--secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleResetPin}
                    className="edit-mode__button--danger"
                  >
                    Reset
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowResetConfirm(true)}
                className="edit-mode__button--secondary"
              >
                Reset PIN
              </button>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
