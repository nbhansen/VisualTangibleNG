/**
 * ViewMode Component
 *
 * Main view mode displaying the communication board.
 */

import { Board } from './Board';
import { useBoard } from '../hooks/useBoard';
import { useAppContext } from '../hooks/useAppContext';
import './ViewMode.css';

export function ViewMode() {
  const { board, playButtonAudio, playingButtonId, progress, stopAllAudio } = useBoard();
  const { setMode } = useAppContext();

  if (!board) {
    return (
      <div className="view-mode view-mode--loading">
        <div className="spinner" aria-label="Loading board"></div>
      </div>
    );
  }

  const handleEditClick = () => {
    // Stop any playing audio when entering edit mode (002-audio-feedback)
    stopAllAudio();
    setMode('pin-entry');
  };

  return (
    <div className="view-mode">
      <main className="view-mode__board">
        <Board
          buttons={board.buttons}
          layout={board.layout}
          onButtonTap={playButtonAudio}
          playingButtonId={playingButtonId}
          progress={progress}
          labelPosition={board.labelPosition}
        />
      </main>
      <footer className="view-mode__footer">
        <button
          type="button"
          className="view-mode__edit-button"
          onClick={handleEditClick}
          aria-label="Enter edit mode"
        >
          Edit Board
        </button>
      </footer>
    </div>
  );
}
