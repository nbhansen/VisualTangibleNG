/**
 * EditMode Component
 *
 * Edit mode for configuring board buttons.
 */

import { useCallback, useState } from 'react';
import { Board } from './Board';
import { ButtonEditor, LayoutSelector, LabelPositionSelector, ModeSelector } from './Editor';
import { useAppContext } from '../hooks/useAppContext';
import { useStorage } from '../hooks/useStorage';
import { getPinService } from '../services/pin';
import { gridToFreeformPositions, freeformToGridPositions } from '../utils/canvas';
import type { ButtonWithMedia, GridLayout, LabelPosition, BoardMode } from '../types';
import { DEFAULT_CANVAS_CONFIG } from '../types';
import './Editor/Editor.css';

interface EditModeProps {
  onExit: () => void;
}

export function EditMode({ onExit }: EditModeProps) {
  const { state, selectButton, updateButton, setLayout, setBoard } = useAppContext();
  const { updateLayout, updateBoardLabelPosition, updateBoardMode, batchUpdateButtonPositions, loadBoard } = useStorage();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isSwitchingMode, setIsSwitchingMode] = useState(false);

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

  // Handle mode change (004-freeform-board)
  const handleModeChange = useCallback(
    async (mode: BoardMode) => {
      if (!state.board || mode === state.board.mode || isSwitchingMode) return;

      setIsSwitchingMode(true);
      try {
        const currentMode = state.board.mode ?? 'grid';

        if (currentMode === 'grid' && mode === 'freeform') {
          // Grid → Freeform: Convert button positions
          const buttonData = state.board.buttons.map((btn) => ({
            id: btn.id,
            position: btn.position,
          }));

          const positionUpdates = gridToFreeformPositions(
            buttonData,
            state.board.layout,
            state.board.canvasWidth ?? DEFAULT_CANVAS_CONFIG.width,
            state.board.canvasHeight ?? DEFAULT_CANVAS_CONFIG.height
          );

          await batchUpdateButtonPositions(positionUpdates);
        } else if (currentMode === 'freeform' && mode === 'grid') {
          // Freeform → Grid: Sort buttons by position and assign grid indices
          const buttonData = state.board.buttons.map((btn) => ({
            id: btn.id,
            x: btn.x,
            y: btn.y,
          }));

          const gridUpdates = freeformToGridPositions(buttonData);

          // Update button positions in storage
          // The position field will be updated when we reload the board
          for (const update of gridUpdates) {
            const btn = state.board.buttons.find((b) => b.id === update.buttonId);
            if (btn) {
              updateButton({ ...btn, position: update.position });
            }
          }
        }

        // Update board mode
        await updateBoardMode(state.board.id, mode);

        // Refresh board to get updated state
        const updatedBoard = await loadBoard();
        if (updatedBoard) {
          setBoard(updatedBoard);
        }
      } catch (err) {
        console.error('Failed to switch mode:', err);
      } finally {
        setIsSwitchingMode(false);
      }
    },
    [state.board, isSwitchingMode, batchUpdateButtonPositions, updateBoardMode, loadBoard, setBoard, updateButton]
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
            // Freeform props (004-freeform-board)
            mode={state.board.mode}
            boardId={state.board.id}
            canvasWidth={state.board.canvasWidth}
            canvasHeight={state.board.canvasHeight}
            viewportZoom={state.board.viewportZoom}
            viewportPanX={state.board.viewportPanX}
            viewportPanY={state.board.viewportPanY}
            onButtonsChange={async () => {
              const updatedBoard = await loadBoard();
              if (updatedBoard) {
                setBoard(updatedBoard);
              }
            }}
          />
        </main>

        <aside className="edit-mode__sidebar">
          {/* Mode Selector (004-freeform-board) */}
          <ModeSelector
            currentMode={state.board.mode ?? 'grid'}
            onModeChange={handleModeChange}
            disabled={isSwitchingMode}
          />

          {/* Layout Selector - only show in grid mode */}
          {(state.board.mode ?? 'grid') === 'grid' && (
            <LayoutSelector
              currentLayout={state.board.layout}
              onLayoutChange={handleLayoutChange}
            />
          )}

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
