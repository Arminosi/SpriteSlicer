import React, { createContext, useContext, useState, useEffect } from 'react';
import { SlicerSettings, SlicerState, HistoryItem, Language, Cell } from '../types';
import * as idb from 'idb-keyval';
import { translations } from '../i18n/translations';

// Helper type for nested keys
type NestedKeyOf<ObjectType extends object> = 
  {[Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object 
  ? `${Key}.${NestedKeyOf<ObjectType[Key]>}`
  : `${Key}`
}[keyof ObjectType & (string | number)];

type TranslationKeys = NestedKeyOf<typeof translations.en>;

interface SlicerContextType extends SlicerState {
  setFile: (file: File | null) => void;
  updateSettings: (settings: Partial<SlicerSettings>) => void;
  history: HistoryItem[];
  addToHistory: (item: HistoryItem) => void;
  clearHistory: () => void;
  loadHistoryItem: (item: HistoryItem) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKeys) => string;
  reorderCells: (newCells: Cell[]) => void;
}

const defaultSettings: SlicerSettings = {
  rows: 2,
  cols: 2,
  startId: 1,
  fontSize: 24,
  sortMode: 'normal',
};

const SlicerContext = createContext<SlicerContextType | undefined>(undefined);

export const SlicerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<SlicerState>({
    file: null,
    imageUrl: null,
    imageDimensions: null,
    settings: defaultSettings,
    isProcessing: false,
    cells: [],
  });

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [language, setLanguage] = useState<Language>('en');

  // Generate cells based on settings
  useEffect(() => {
    if (!state.imageDimensions) {
      setState(prev => ({ ...prev, cells: [] }));
      return;
    }

    const { rows, cols, startId, sortMode } = state.settings;
    const newCells: Cell[] = [];

    // Create initial cells
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        newCells.push({
          id: `${r}-${c}`,
          row: r,
          col: c,
          displayId: 0 // Will be assigned later
        });
      }
    }

    // Sort based on sortMode
    let sortedCells = [...newCells];
    
    if (sortMode === 'snake-1') {
      // Odd rows L-R, Even rows R-L (0-indexed)
      // Actually, let's just sort the array based on the logic
      sortedCells.sort((a, b) => {
        const rowDiff = a.row - b.row;
        if (rowDiff !== 0) return rowDiff;
        
        // Same row
        if (a.row % 2 !== 0) {
          // Odd row: R-L (Wait, snake-1 description: Odd L-R, Even R-L)
          // Let's check previous logic in Preview.tsx
          // "Snake (Odd L-R, Even R-L)" -> Row 1 (index 0) is Odd? No, usually 1-based.
          // Let's assume 1-based for user description "Odd/Even".
          // Row 0 (1st) -> Odd -> L-R
          // Row 1 (2nd) -> Even -> R-L
          return b.col - a.col; // R-L
        }
        return a.col - b.col; // L-R
      });
    } else if (sortMode === 'snake-2') {
      // Even L-R, Odd R-L
      // Row 0 (1st) -> Odd -> R-L
      // Row 1 (2nd) -> Even -> L-R
      sortedCells.sort((a, b) => {
        const rowDiff = a.row - b.row;
        if (rowDiff !== 0) return rowDiff;
        
        if (a.row % 2 === 0) {
          return b.col - a.col; // R-L
        }
        return a.col - b.col; // L-R
      });
    } else if (sortMode === 'reverse') {
      // Reverse: R-L, B-T (Reverse of Normal)
      sortedCells.sort((a, b) => {
        const rowDiff = b.row - a.row; // B-T
        if (rowDiff !== 0) return rowDiff;
        return b.col - a.col; // R-L
      });
    } else {
      // Normal: L-R, T-B
      // Already generated in that order
    }

    // Assign display IDs
    sortedCells = sortedCells.map((cell, index) => ({
      ...cell,
      displayId: startId + index
    }));

    setState(prev => ({ ...prev, cells: sortedCells }));

  }, [state.settings.rows, state.settings.cols, state.settings.sortMode, state.settings.startId, state.imageDimensions]);

  // Load history on mount
  useEffect(() => {
    idb.get('slicer_history').then((val) => {
      if (val) setHistory(val);
    });
    
    // Detect language
    const browserLang = navigator.language.startsWith('zh') ? 'zh' : 'en';
    setLanguage(browserLang);
  }, []);

  // Save history when it changes
  useEffect(() => {
    if (history.length > 0) {
      idb.set('slicer_history', history);
    }
  }, [history]);

  const t = (key: TranslationKeys): string => {
    const keys = key.split('.');
    let value: any = translations[language];
    for (const k of keys) {
      value = value?.[k];
    }
    return value || key;
  };

  const setFile = (file: File | null) => {
    if (state.imageUrl) {
      URL.revokeObjectURL(state.imageUrl);
    }

    if (!file) {
      setState(prev => ({ ...prev, file: null, imageUrl: null, imageDimensions: null }));
      return;
    }

    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setState(prev => ({
        ...prev,
        file,
        imageUrl: url,
        imageDimensions: { width: img.width, height: img.height }
      }));
    };
    img.src = url;
  };

  const updateSettings = (newSettings: Partial<SlicerSettings>) => {
    setState(prev => ({ ...prev, settings: { ...prev.settings, ...newSettings } }));
  };

  const reorderCells = (newCells: Cell[]) => {
    // Re-assign display IDs based on new order
    const { startId } = state.settings;
    const updatedCells = newCells.map((cell, index) => ({
      ...cell,
      displayId: startId + index
    }));
    setState(prev => ({ ...prev, cells: updatedCells }));
  };

  const addToHistory = (item: HistoryItem) => {
    setHistory(prev => [item, ...prev].slice(0, 50)); // Keep last 50
  };

  const clearHistory = () => {
    setHistory([]);
    idb.del('slicer_history');
  };

  const loadHistoryItem = (item: HistoryItem) => {
    // Note: We can't restore the file object easily unless we stored it in IDB as Blob.
    // For this MVP, we'll just restore settings. 
    // If we want to restore the image, we need to store the blob in history.
    // Let's assume for now we just restore settings.
    updateSettings(item.settings);
  };

  return (
    <SlicerContext.Provider value={{
      ...state,
      setFile,
      updateSettings,
      history,
      addToHistory,
      clearHistory,
      loadHistoryItem,
      language,
      setLanguage,
      t,
      reorderCells
    }}>
      {children}
    </SlicerContext.Provider>
  );
};

export const useSlicer = () => {
  const context = useContext(SlicerContext);
  if (!context) throw new Error('useSlicer must be used within SlicerProvider');
  return context;
};
