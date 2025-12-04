import React, { createContext, useContext, useState, useEffect } from 'react';
import { SlicerSettings, SlicerState, HistoryItem, Language, Cell, GridPreset } from '../types';
import * as idb from 'idb-keyval';
import { translations } from '../i18n/translations';

// Helper type for nested keys
type NestedKeyOf<ObjectType extends object> = 
  {[Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object 
  ? `${Key}.${NestedKeyOf<ObjectType[Key]>}`
  : `${Key}`
}[keyof ObjectType & (string | number)];

type TranslationKeys = NestedKeyOf<typeof translations.en>;

interface ActionHistoryItem {
  settings: SlicerSettings;
  cells: Cell[];
  description: string;
  timestamp: number;
}

interface SlicerContextType extends SlicerState {
  setFile: (file: File | null) => void;
  updateSettings: (settings: Partial<SlicerSettings>) => void;
  history: HistoryItem[];
  addToHistory: (item: HistoryItem) => void;
  clearHistory: () => void;
  deleteHistoryItem: (id: string) => void;
  loadHistoryItem: (item: HistoryItem) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKeys) => string;
  reorderCells: (newCells: Cell[]) => void;
  resetCells: () => void;
  
  // Undo/Redo
  past: ActionHistoryItem[];
  future: ActionHistoryItem[];
  undo: () => void;
  redo: () => void;
  jumpToHistory: (index: number) => void;
  
  // Grid Presets
  gridPresets: GridPreset[];
  addGridPreset: (rows: number, cols: number) => void;
  deleteGridPreset: (id: string) => void;
  reorderGridPresets: (presets: GridPreset[]) => void;
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
  
  // Grid Presets
  const defaultPresets: GridPreset[] = [
    { id: '1', rows: 2, cols: 4 },
    { id: '2', rows: 4, cols: 2 },
    { id: '3', rows: 3, cols: 4 },
    { id: '4', rows: 4, cols: 3 },
    { id: '5', rows: 4, cols: 4 },
  ];
  const [gridPresets, setGridPresets] = useState<GridPreset[]>(defaultPresets);
  
  // Undo/Redo State
  const [past, setPast] = useState<ActionHistoryItem[]>([]);
  const [future, setFuture] = useState<ActionHistoryItem[]>([]);

  const pushState = (description: string) => {
    setPast(prev => [
      ...prev,
      {
        settings: { ...state.settings },
        cells: [...state.cells],
        description,
        timestamp: Date.now()
      }
    ]);
    setFuture([]);
  };

  const undo = () => {
    if (past.length === 0) return;

    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);

    setFuture(prev => [
      {
        settings: { ...state.settings },
        cells: [...state.cells],
        description: previous.description, // Or "Undo " + desc
        timestamp: Date.now()
      },
      ...prev
    ]);

    setPast(newPast);
    setState(prev => ({
      ...prev,
      settings: previous.settings,
      cells: previous.cells
    }));
  };

  const redo = () => {
    if (future.length === 0) return;

    const next = future[0];
    const newFuture = future.slice(1);

    setPast(prev => [
      ...prev,
      {
        settings: { ...state.settings },
        cells: [...state.cells],
        description: next.description,
        timestamp: Date.now()
      }
    ]);

    setFuture(newFuture);
    setState(prev => ({
      ...prev,
      settings: next.settings,
      cells: next.cells
    }));
  };

  const jumpToHistory = (index: number) => {
    if (index < 0 || index >= past.length) return;

    const targetState = past[index];
    const newPast = past.slice(0, index);
    const itemsToFuture = past.slice(index + 1);
    
    // Current state also goes to future
    const currentStateItem: ActionHistoryItem = {
        settings: { ...state.settings },
        cells: [...state.cells],
        description: 'Current State', // Placeholder
        timestamp: Date.now()
    };

    setFuture(prev => [...itemsToFuture, currentStateItem, ...prev]); // This logic is a bit complex for jump.
    // Simplified jump: Just restore state and clear future? Or move everything after index to future?
    // Standard history jump usually just resets stack or moves pointer.
    // Let's just set state and adjust stacks.
    
    // Actually, if we jump back to index, everything AFTER index in `past` should move to `future`.
    // And the current state should also move to `future`.
    
    const futureItems = [...past.slice(index + 1), currentStateItem, ...future];
    
    setPast(newPast);
    setFuture(futureItems); // This might be wrong order.
    
    // Let's stick to simple undo/redo for now, or just implement jump correctly.
    // If past is [A, B, C], current is D.
    // Jump to A (index 0).
    // New past: [] (or [A] if we want to keep A in past? No, if we are AT A, A is current).
    // Wait, `past` usually contains states *before* current.
    // If I am at D. Past is [A, B, C].
    // Undo -> Current C. Past [A, B]. Future [D].
    // So if I jump to index 0 (A).
    // I want Current to be A.
    // Past should be [].
    // Future should be [B, C, D].
    
    // Correct logic:
    // Target is past[index].
    // New Past = past.slice(0, index);
    // Items to move to future = past.slice(index + 1);
    // Current state becomes the first item in future (closest to now).
    // So Future = [...itemsToFuture.reverse(), currentState, ...future] ?
    // No, Future is a stack. Top is "Redo".
    // If I am at A. Redo -> B.
    // So Future should be [B, C, D].
    
    const itemsToMoveToFuture = past.slice(index + 1); // [B, C]
    // We need to reverse them because `past` is [oldest ... newest].
    // `future` is [newest ... oldest] (stack).
    
    // So [B, C] -> C is newer than B.
    // Future should be [C, B].
    // And D (current) is newest.
    // So Future = [D, C, B].
    
    const newFuture = [
        currentStateItem,
        ...itemsToMoveToFuture.reverse(),
        ...future
    ];
    
    setPast(newPast);
    setFuture(newFuture);
    
    setState(prev => ({
      ...prev,
      settings: targetState.settings,
      cells: targetState.cells
    }));
  };

  const generateCells = (currentSettings: SlicerSettings, dimensions: { width: number, height: number } | null) => {
    if (!dimensions) return [];

    const { rows, cols, startId, sortMode } = currentSettings;
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
      sortedCells.sort((a, b) => {
        const rowDiff = a.row - b.row;
        if (rowDiff !== 0) return rowDiff;
        if (a.row % 2 !== 0) return b.col - a.col;
        return a.col - b.col;
      });
    } else if (sortMode === 'snake-2') {
      sortedCells.sort((a, b) => {
        const rowDiff = a.row - b.row;
        if (rowDiff !== 0) return rowDiff;
        if (a.row % 2 === 0) return b.col - a.col;
        return a.col - b.col;
      });
    } else if (sortMode === 'reverse') {
      sortedCells.sort((a, b) => {
        const rowDiff = b.row - a.row;
        if (rowDiff !== 0) return rowDiff;
        return b.col - a.col;
      });
    } else if (sortMode === 'vertical') {
      sortedCells.sort((a, b) => {
        const colDiff = a.col - b.col;
        if (colDiff !== 0) return colDiff;
        return a.row - b.row;
      });
    } else if (sortMode === 'vertical-reverse') {
      sortedCells.sort((a, b) => {
        const colDiff = b.col - a.col;
        if (colDiff !== 0) return colDiff;
        return b.row - a.row;
      });
    }

    // Assign display IDs
    return sortedCells.map((cell, index) => ({
      ...cell,
      displayId: startId + index
    }));
  };

  const resetCells = () => {
    const cells = generateCells(state.settings, state.imageDimensions);
    setState(prev => ({ ...prev, cells }));
  };

  // Load history and settings on mount
  useEffect(() => {
    idb.get('slicer_history').then((val) => {
      if (val) setHistory(val);
    });
    
    // Load saved settings (rows, cols)
    idb.get('slicer_settings').then((val) => {
      if (val) {
        setState(prev => ({
          ...prev,
          settings: { ...prev.settings, ...val }
        }));
      }
    });
    
    // Load saved grid presets
    idb.get('slicer_grid_presets').then((val) => {
      if (val && Array.isArray(val) && val.length > 0) {
        setGridPresets(val);
      }
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
      setPast([]);
      setFuture([]);
      return;
    }

    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = async () => {
      const dimensions = { width: img.width, height: img.height };
      
      // Use current settings (no auto-detection on import)
      const currentSettings = { ...state.settings };

      // Generate cells with current settings
      const initialCells = generateCells(currentSettings, dimensions);

      setState(prev => ({
        ...prev,
        file,
        imageUrl: url,
        imageDimensions: dimensions,
        settings: currentSettings,
        cells: initialCells
      }));
      
      setPast([]);
      setFuture([]);
    };
    img.src = url;
  };

  const updateSettings = (newSettings: Partial<SlicerSettings>) => {
    const nextSettings = { ...state.settings, ...newSettings };
    
    // Push state
    pushState(`Update settings`);

    // Save rows and cols to IndexedDB for persistence
    if (newSettings.rows !== undefined || newSettings.cols !== undefined) {
      idb.set('slicer_settings', { 
        rows: nextSettings.rows, 
        cols: nextSettings.cols 
      });
    }

    let nextCells = state.cells;

    // Check if we need to regenerate or update cells
    if (newSettings.rows !== undefined || newSettings.cols !== undefined || newSettings.sortMode !== undefined) {
       // Structure changed, regenerate
       nextCells = generateCells(nextSettings, state.imageDimensions);
    } else if (newSettings.startId !== undefined) {
       // Only IDs changed, preserve order
       nextCells = state.cells.map((cell, index) => ({
         ...cell,
         displayId: (newSettings.startId || 1) + index
       }));
    }

    setState(prev => ({ ...prev, settings: nextSettings, cells: nextCells }));
  };

  const reorderCells = (newCells: Cell[]) => {
    pushState('Reorder cells');
    // Re-assign display IDs based on new order
    const { startId } = state.settings;
    const updatedCells = newCells.map((cell, index) => ({
      ...cell,
      displayId: startId + index
    }));
    setState(prev => ({ ...prev, cells: updatedCells }));
  };

  const addToHistory = (item: HistoryItem) => {
    const newItem = { ...item, fileData: state.file || undefined };
    const newHistory = [newItem, ...history].slice(0, 50);
    setHistory(newHistory);
    idb.set('slicer_history', newHistory);
  };

  const clearHistory = () => {
    setHistory([]);
    idb.del('slicer_history');
  };

  const deleteHistoryItem = (id: string) => {
    const newHistory = history.filter(item => item.id !== id);
    setHistory(newHistory);
    idb.set('slicer_history', newHistory);
  };

  const loadHistoryItem = (item: HistoryItem) => {
    if (item.fileData) {
      setFile(item.fileData);
    }
    updateSettings(item.settings);
  };

  // Grid Preset Functions
  const addGridPreset = (rows: number, cols: number) => {
    // Check if preset already exists
    const exists = gridPresets.some(p => p.rows === rows && p.cols === cols);
    if (exists) return;
    
    const newPreset: GridPreset = {
      id: Date.now().toString(),
      rows,
      cols
    };
    const newPresets = [...gridPresets, newPreset];
    setGridPresets(newPresets);
    idb.set('slicer_grid_presets', newPresets);
  };

  const deleteGridPreset = (id: string) => {
    const newPresets = gridPresets.filter(p => p.id !== id);
    setGridPresets(newPresets);
    idb.set('slicer_grid_presets', newPresets);
  };

  const reorderGridPresets = (presets: GridPreset[]) => {
    setGridPresets(presets);
    idb.set('slicer_grid_presets', presets);
  };

  return (
    <SlicerContext.Provider value={{
      ...state,
      setFile,
      updateSettings,
      history,
      addToHistory,
      clearHistory,
      deleteHistoryItem,
      loadHistoryItem,
      language,
      setLanguage,
      t,
      reorderCells,
      resetCells,
      past,
      future,
      undo,
      redo,
      jumpToHistory,
      gridPresets,
      addGridPreset,
      deleteGridPreset,
      reorderGridPresets
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
