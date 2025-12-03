import React, { useState, useRef } from 'react';
import { Scissors, Languages, PanelLeft, History, RotateCcw, RotateCw, ChevronDown } from 'lucide-react';
import { useSlicer } from '../../context/SlicerContext';
import { Button } from '../UI/Button';
import { Tooltip } from '../UI/Tooltip';
import { OperationHistoryPanel } from '../Slicer/OperationHistoryPanel';

interface HeaderProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  isHistoryOpen: boolean;
  onToggleHistory: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  isSidebarOpen, 
  onToggleSidebar,
  isHistoryOpen,
  onToggleHistory
}) => {
  const { language, setLanguage, t, undo, redo, past, future } = useSlicer();
  const [isOpsHistoryOpen, setIsOpsHistoryOpen] = useState(false);
  const opsHistoryButtonRef = useRef<HTMLButtonElement>(null);

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'zh' : 'en');
  };

  return (
    <header className="h-14 border-b border-border bg-background/50 backdrop-blur-sm flex items-center px-4 justify-between shrink-0 z-10">
      <div className="flex items-center gap-4">
        <Tooltip content={isSidebarOpen ? 'Hide Sidebar' : 'Show Sidebar'}>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleSidebar}
            className={`text-gray-400 hover:text-gray-200 ${!isSidebarOpen ? 'text-primary' : ''}`}
          >
            <PanelLeft className="w-5 h-5" />
          </Button>
        </Tooltip>

        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-primary/10 rounded-md">
            <Scissors className="w-5 h-5 text-primary" />
          </div>
          <h1 className="font-semibold text-gray-100 hidden sm:block">{t('app.title')}</h1>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Undo / Redo Group */}
        <div className="flex items-center bg-surface/50 rounded-md border border-border/50 mr-2">
          <Tooltip content={t('action.undo')}>
            <Button
              variant="ghost"
              size="sm"
              onClick={undo}
              disabled={past.length === 0}
              className="text-gray-400 hover:text-gray-200 disabled:opacity-30 px-2"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </Tooltip>
          
          <div className="w-px h-4 bg-border/50" />

          <Tooltip content={t('action.redo')}>
            <Button
              variant="ghost"
              size="sm"
              onClick={redo}
              disabled={future.length === 0}
              className="text-gray-400 hover:text-gray-200 disabled:opacity-30 px-2"
            >
              <RotateCw className="w-4 h-4" />
            </Button>
          </Tooltip>

          <div className="w-px h-4 bg-border/50" />

          <Tooltip content={t('action.historyOps')}>
            <Button
              ref={opsHistoryButtonRef}
              variant="ghost"
              size="sm"
              onClick={() => setIsOpsHistoryOpen(!isOpsHistoryOpen)}
              className={`text-gray-400 hover:text-gray-200 px-1 ${isOpsHistoryOpen ? 'bg-surface-hover text-primary' : ''}`}
            >
              <ChevronDown className="w-3 h-3" />
            </Button>
          </Tooltip>
        </div>

        <OperationHistoryPanel 
          isOpen={isOpsHistoryOpen} 
          onClose={() => setIsOpsHistoryOpen(false)} 
          anchorRef={opsHistoryButtonRef}
        />

        <Tooltip content={t('history.title')}>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleHistory}
            className={`text-gray-400 hover:text-gray-200 ${isHistoryOpen ? 'text-primary bg-primary/10' : ''}`}
          >
            <History className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">{t('history.title')}</span>
          </Button>
        </Tooltip>

        <Tooltip content={language === 'en' ? 'Switch to Chinese' : '切换到英文'}>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={toggleLanguage}
            className="text-gray-400 hover:text-gray-200"
          >
            <Languages className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">{language === 'en' ? 'EN' : '中文'}</span>
          </Button>
        </Tooltip>
      </div>
    </header>
  );
};
