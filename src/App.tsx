import React, { useState, useEffect } from 'react';
import { SlicerProvider, useSlicer } from './context/SlicerContext';
import { Header } from './components/Layout/Header';
import { Sidebar } from './components/Layout/Sidebar';
import { DropZone } from './components/Slicer/DropZone';
import { Preview } from './components/Slicer/Preview';
import { SortablePreview } from './components/Slicer/SortablePreview';
import { HistoryPanel } from './components/Slicer/HistoryPanel';
import { Button } from './components/UI/Button';
import { Download, Loader2, LayoutGrid, Move } from 'lucide-react';
import { sliceImage } from './utils/slicer';

const MainContent: React.FC = () => {
  const { file, settings, addToHistory, setFile, t, cells } = useSlicer();
  const [isSlicing, setIsSlicing] = useState(false);
  const [viewMode, setViewMode] = useState<'preview' | 'sort'>('preview');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleSlice = async () => {
    if (!file) return;
    
    setIsSlicing(true);
    try {
      await sliceImage(file, settings, cells);
      
      addToHistory({
        id: Date.now().toString(),
        timestamp: Date.now(),
        fileName: file.name,
        settings: { ...settings }
      });
    } catch (error) {
      console.error('Slicing failed:', error);
      alert('Failed to slice image');
    } finally {
      setIsSlicing(false);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 's') {
          e.preventDefault();
          if (file && !isSlicing) handleSlice();
        } else if (e.key === 'o') {
          e.preventDefault();
          fileInputRef.current?.click();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [file, isSlicing, settings, cells]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setFile(files[0]);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background text-gray-200 overflow-hidden">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileSelect}
      />
      <Header />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        
        <main className="flex-1 flex flex-col relative bg-grid-pattern">
          {file ? (
            <>
              <div className="flex-1 flex overflow-hidden relative">
                {viewMode === 'preview' ? <Preview /> : <SortablePreview />}
                
                {/* View Mode Toggle */}
                <div className="absolute top-4 right-4 bg-surface/90 backdrop-blur border border-border rounded-lg p-1 flex gap-1 z-20">
                  <button
                    onClick={() => setViewMode('preview')}
                    className={`p-2 rounded-md transition-colors ${viewMode === 'preview' ? 'bg-primary text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-surface-hover'}`}
                    title="Original View"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('sort')}
                    className={`p-2 rounded-md transition-colors ${viewMode === 'sort' ? 'bg-primary text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-surface-hover'}`}
                    title="Sort View"
                  >
                    <Move className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="h-16 border-t border-border bg-surface/50 backdrop-blur flex items-center justify-between px-6 shrink-0 z-10">
                <div className="text-sm text-gray-400">
                  {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </div>
                
                <Button 
                  size="lg" 
                  onClick={handleSlice} 
                  disabled={isSlicing}
                  className="shadow-lg shadow-primary/20"
                >
                  {isSlicing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      {t('action.processing')}
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5 mr-2" />
                      {t('action.slice')}
                    </>
                  )}
                </Button>
              </div>
            </>
          ) : (
            <DropZone />
          )}
          
          <HistoryPanel />
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <SlicerProvider>
      <MainContent />
    </SlicerProvider>
  );
}

export default App;
