import React, { useState } from 'react';
import { useSlicer } from '../../context/SlicerContext';
import { Input } from '../UI/Input';
import { Button } from '../UI/Button';
import { Tooltip } from '../UI/Tooltip';
import { Settings, Type, Grid3X3, ArrowDown01, ArrowRightLeft, Wand2, Loader2, Minus, Plus, Upload, RotateCcw, Trash2, MousePointerClick } from 'lucide-react';
import { SortMode } from '../../types';
import { detectGrid } from '../../utils/imageAnalysis';
import { GridPresetSelector } from '../Slicer/GridPresetSelector';

// Helper component for number input with buttons
const NumberInput = ({ 
  label, 
  value, 
  onChange, 
  min = 1, 
  max = 50 
}: { 
  label: string; 
  value: number; 
  onChange: (val: number) => void;
  min?: number;
  max?: number;
}) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-medium text-gray-400">
      {label}
    </label>
    <div className="flex items-center">
      <button
        onClick={() => onChange(Math.max(value - 1, min))}
        disabled={value <= min}
        className="h-9 w-9 flex items-center justify-center rounded-l-md border border-r-0 border-border bg-surface hover:bg-surface-hover text-gray-400 hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0"
      >
        <Minus className="w-3 h-3" />
      </button>
      <input
        type="number"
        value={value}
        onChange={(e) => {
          const val = parseInt(e.target.value);
          if (!isNaN(val)) onChange(Math.min(Math.max(val, min), max));
        }}
        className="flex h-9 w-full border border-border bg-surface px-2 py-1 text-sm text-center shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary text-gray-200 appearance-none [&::-webkit-inner-spin-button]:appearance-none rounded-none z-10"
      />
      <button
        onClick={() => onChange(Math.min(value + 1, max))}
        disabled={value >= max}
        className="h-9 w-9 flex items-center justify-center rounded-r-md border border-l-0 border-border bg-surface hover:bg-surface-hover text-gray-400 hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0"
      >
        <Plus className="w-3 h-3" />
      </button>
    </div>
  </div>
);

export const Sidebar: React.FC = () => {
  const { 
    settings, 
    updateSettings, 
    file, 
    setFile,
    t, 
    resetCells
  } = useSlicer();
  
  const [isDetecting, setIsDetecting] = useState(false);
  const [confirmGithub, setConfirmGithub] = useState(false);

  const handleGithubClick = () => {
    if (confirmGithub) {
      window.open('https://github.com/Arminosi/SpriteSlicer', '_blank');
      setConfirmGithub(false);
    } else {
      setConfirmGithub(true);
      setTimeout(() => setConfirmGithub(false), 3000);
    }
  };
  const [sensitivity, setSensitivity] = useState(10); // 1-10, default 10 (max)

  const handleSortChange = (mode: SortMode) => {
    updateSettings({ sortMode: mode });
  };

  const handleAutoDetect = async () => {
    if (!file) return;
    
    setIsDetecting(true);
    try {
      const { rows, cols } = await detectGrid(file, sensitivity);
      updateSettings({ rows, cols });
    } catch (error) {
      console.error('Detection failed:', error);
    } finally {
      setIsDetecting(false);
    }
  };

  return (
    <aside className="w-80 h-full border-r border-border bg-surface/50 flex flex-col shrink-0 overflow-y-auto">
      {/* Persistent Drop Zone */}
      <div className="p-4 border-b border-border">
        <div 
          className="border-2 border-dashed border-border hover:border-primary/50 rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer transition-colors bg-surface/30 hover:bg-surface group"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const files = e.dataTransfer.files;
            if (files && files.length > 0) setFile(files[0]);
          }}
          onClick={() => document.getElementById('sidebar-upload')?.click()}
        >
          <input 
            id="sidebar-upload"
            type="file" 
            className="hidden" 
            accept="image/*"
            onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])}
          />
          <Upload className="w-6 h-6 text-gray-400 group-hover:text-primary mb-2 transition-colors" />
          <span className="text-xs text-gray-400 group-hover:text-gray-200 text-center transition-colors">
            {file ? t('dropzone.select') : t('dropzone.drag')}
          </span>
        </div>
      </div>

      <div className="p-4 border-b border-border">
        <h2 className="flex items-center gap-2 font-medium text-gray-200">
          <Settings className="w-4 h-4" />
          {t('settings.title')}
        </h2>
      </div>

      <div className="p-4 space-y-6">
        {/* Grid Settings */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <Grid3X3 className="w-3 h-3" />
              {t('settings.grid')}
            </h3>
            {file && (
              <div className="flex items-center gap-1">
                {/* Sensitivity Controls */}
                <Tooltip content={t('settings.decreaseSensitivity')}>
                  <button
                    onClick={() => setSensitivity(s => Math.max(1, s - 1))}
                    disabled={sensitivity <= 1 || isDetecting}
                    className="h-6 w-6 flex items-center justify-center text-gray-500 hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                </Tooltip>
                
                <Tooltip content={t('settings.detectTooltip')}>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleAutoDetect}
                    disabled={isDetecting}
                    className="h-6 px-2 text-[10px] gap-1"
                  >
                    {isDetecting ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Wand2 className="w-3 h-3" />
                    )}
                    {isDetecting ? t('settings.detecting') : `${t('settings.detect')} (${sensitivity})`}
                  </Button>
                </Tooltip>
                
                <Tooltip content={t('settings.increaseSensitivity')}>
                  <button
                    onClick={() => setSensitivity(s => Math.min(10, s + 1))}
                    disabled={sensitivity >= 10 || isDetecting}
                    className="h-6 w-6 flex items-center justify-center text-gray-500 hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </Tooltip>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <NumberInput
              label={t('settings.rows')}
              min={1}
              max={50}
              value={settings.rows}
              onChange={(val) => updateSettings({ rows: val })}
            />
            <NumberInput
              label={t('settings.cols')}
              min={1}
              max={50}
              value={settings.cols}
              onChange={(val) => updateSettings({ cols: val })}
            />
          </div>
          
          {/* Swap Rows & Columns Button */}
          <Tooltip content={t('settings.swap')}>
            <button
              onClick={() => updateSettings({ rows: settings.cols, cols: settings.rows })}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs text-gray-400 hover:text-gray-200 bg-surface hover:bg-surface-hover border border-border rounded-md transition-colors"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              {t('settings.swap')}
            </button>
          </Tooltip>
          
          {/* Grid Presets */}
          <GridPresetSelector />
        </div>

        {/* Numbering Settings */}
        <div className="space-y-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
            <ArrowDown01 className="w-3 h-3" />
            {t('settings.numbering')}
          </h3>
          <Input
            label={t('settings.startId')}
            type="number"
            value={settings.startId}
            onChange={(e) => updateSettings({ startId: Number(e.target.value) })}
          />
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-400 flex items-center gap-2">
              <Type className="w-3 h-3" />
              {t('settings.fontSize')} ({settings.fontSize}px)
            </label>
            <input
              type="range"
              min={8}
              max={100}
              value={settings.fontSize}
              onChange={(e) => updateSettings({ fontSize: Number(e.target.value) })}
              className="w-full h-2 bg-surface-hover rounded-lg appearance-none cursor-pointer accent-primary touch-none"
            />
          </div>
        </div>

        {/* Sorting Settings */}
        <div className="space-y-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
            <ArrowRightLeft className="w-3 h-3" />
            {t('settings.sorting')}
          </h3>
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-400">
              {t('settings.pattern')}
            </label>
            
            <div className="grid grid-cols-3 gap-2">
              {[
                { mode: 'normal', labelKey: 'labelNormal' },
                { mode: 'reverse', labelKey: 'labelReverse' },
                { mode: 'vertical', labelKey: 'labelVertical' },
                { mode: 'vertical-reverse', labelKey: 'labelVerticalReverse' },
                { mode: 'snake-1', labelKey: 'labelSnake1' },
                { mode: 'snake-2', labelKey: 'labelSnake2' },
              ].map(({ mode, labelKey }) => (
                <Tooltip key={mode} content={t(`sort.${mode.replace('-', '').replace('verticalreverse', 'verticalReverse')}` as any)}>
                  <button
                    onClick={() => handleSortChange(mode as SortMode)}
                    className={`
                      w-full h-10 flex items-center justify-center rounded-md border transition-all text-xs font-medium
                      ${settings.sortMode === mode 
                        ? 'bg-primary text-white border-primary shadow-sm' 
                        : 'bg-surface border-border text-gray-400 hover:text-gray-200 hover:bg-surface-hover'
                      }
                    `}
                  >
                    {t(`sort.${labelKey}` as any)}
                  </button>
                </Tooltip>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        {file && (
          <div className="space-y-4 pt-4 border-t border-border">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <MousePointerClick className="w-3 h-3" />
              {t('action.actions')}
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <Tooltip content={t('action.resetTooltip')}>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={resetCells}
                  className="w-full text-xs"
                >
                  <RotateCcw className="w-3 h-3 mr-1.5" />
                  {t('action.reset')}
                </Button>
              </Tooltip>
              <Tooltip content={t('action.clearTooltip')}>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => setFile(null)}
                  className="w-full text-xs hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20"
                >
                  <Trash2 className="w-3 h-3 mr-1.5" />
                  {t('action.clear')}
                </Button>
              </Tooltip>
            </div>
          </div>
        )}
      </div>
      
      {!file && (
        <div className="mt-auto p-4 text-center text-sm text-gray-500">
          {t('sidebar.noFile')}
        </div>
      )}

      {/* Author Info */}
      <div className="mt-auto border-t border-border p-4 bg-surface/30">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">{t('sidebar.createdBy')}</span>
            <span className="text-gray-300 font-medium">Arminosi</span>
          </div>
          <button 
            onClick={handleGithubClick}
            className={`flex items-center justify-center gap-2 px-3 py-2 rounded-md border transition-all text-xs group w-full ${
              confirmGithub 
                ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/30' 
                : 'bg-surface hover:bg-surface-hover border-border hover:border-primary/50 text-gray-400 hover:text-primary'
            }`}
          >
            {confirmGithub ? (
              <span className="font-medium">{t('sidebar.confirmGithub')}</span>
            ) : (
              <>
                <svg className="w-4 h-4 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                GitHub
              </>
            )}
          </button>
          <div className="text-[10px] text-gray-600 text-center leading-tight px-1">
            {t('sidebar.localProcessing')}
          </div>
        </div>
      </div>

    </aside>
  );
};
