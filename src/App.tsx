import React, { useState, useEffect } from 'react';
import { SlicerProvider, useSlicer } from './context/SlicerContext';
import { Header } from './components/Layout/Header';
import { Sidebar } from './components/Layout/Sidebar';
import { DropZone } from './components/Slicer/DropZone';
import { SortablePreview } from './components/Slicer/SortablePreview';
import { HistoryPanel } from './components/Slicer/HistoryPanel';
import { Button } from './components/UI/Button';
import { Download, Loader2 } from 'lucide-react';
import { sliceImage } from './utils/slicer';

const MainContent: React.FC = () => {
  const { file, settings, addToHistory, setFile, t, cells } = useSlicer();
  const [isSlicing, setIsSlicing] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleSlice = async () => {
    if (!file) return;
    
    setIsSlicing(true);
    try {
      const zipBlob = await sliceImage(file, settings, cells);
      
      addToHistory({
        id: Date.now().toString(),
        timestamp: Date.now(),
        fileName: file.name,
        settings: { ...settings },
        zipData: zipBlob,
        cellCount: cells.length
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
      <Header 
        isSidebarOpen={isSidebarOpen} 
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isHistoryOpen={isHistoryOpen}
        onToggleHistory={() => setIsHistoryOpen(!isHistoryOpen)}
      />
      
      <div className="flex flex-1 overflow-hidden">
        <div className={`transition-all duration-300 ease-in-out overflow-hidden shrink-0 ${isSidebarOpen ? 'w-80 opacity-100' : 'w-0 opacity-0'}`}>
          <Sidebar />
        </div>
        
        <main className="flex-1 flex flex-col relative bg-grid-pattern">
          {file ? (
            <>
              <div className="flex-1 flex overflow-hidden relative">
                <SortablePreview />
              </div>
              
              <div className="h-16 border-t border-border bg-surface/50 backdrop-blur flex items-center justify-between px-6 shrink-0 z-10">
                <div className="text-sm text-gray-400 truncate min-w-0 flex-1 mr-4">
                  {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </div>
                
                <Button 
                  size="lg" 
                  onClick={handleSlice} 
                  disabled={isSlicing}
                  className="shadow-lg shadow-primary/20 shrink-0"
                >
                  {isSlicing ? (
                    <>
                      <Loader2 className="w-5 h-5 sm:mr-2 animate-spin" />
                      <span className="hidden sm:inline">{t('action.processing')}</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5 sm:mr-2" />
                      <span className="hidden sm:inline">{t('action.slice')}</span>
                    </>
                  )}
                </Button>
              </div>
            </>
          ) : (
            <DropZone />
          )}
          
          <HistoryPanel isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} />
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
