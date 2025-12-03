export type SortMode = 'normal' | 'snake-1' | 'snake-2' | 'reverse';
export type Language = 'en' | 'zh';

export interface SlicerSettings {
  rows: number;
  cols: number;
  startId: number;
  fontSize: number;
  sortMode: SortMode;
}

export interface Cell {
  id: string; // Unique identifier for dnd-kit (e.g., "0-0")
  row: number; // Original row index
  col: number; // Original col index
  displayId: number; // The number to display/export
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  fileName: string;
  settings: SlicerSettings;
  thumbnail?: string; // Base64 thumbnail
}

export interface SlicerState {
  file: File | null;
  imageUrl: string | null;
  imageDimensions: { width: number; height: number } | null;
  settings: SlicerSettings;
  isProcessing: boolean;
  cells: Cell[]; // Current ordered list of cells
}
