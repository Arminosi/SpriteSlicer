import React, { useCallback } from 'react';
import { useSlicer } from '../../context/SlicerContext';
import { Upload, Image as ImageIcon } from 'lucide-react';
import { clsx } from 'clsx';

export const DropZone: React.FC = () => {
  const { setFile, t } = useSlicer();
  const [isDragging, setIsDragging] = React.useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        setFile(file);
      }
    }
  }, [setFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setFile(files[0]);
    }
  }, [setFile]);

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={clsx(
        "flex-1 flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-xl transition-all duration-200 m-8",
        isDragging 
          ? "border-primary bg-primary/5 scale-[1.02]" 
          : "border-border hover:border-gray-600 bg-surface/30"
      )}
    >
      <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center mb-6 shadow-xl">
        {isDragging ? (
          <Upload className="w-10 h-10 text-primary animate-bounce" />
        ) : (
          <ImageIcon className="w-10 h-10 text-gray-400" />
        )}
      </div>
      
      <h3 className="text-xl font-semibold text-gray-200 mb-2">
        {isDragging ? t('dropzone.drop') : t('dropzone.drag')}
      </h3>
      
      <p className="text-gray-500 mb-8 text-center max-w-sm">
        {t('dropzone.support')}
        <br />
        {t('dropzone.local')}
      </p>

      <label className="relative">
        <input
          type="file"
          className="hidden"
          accept="image/*"
          onChange={handleFileSelect}
        />
        <span className="px-6 py-3 bg-primary hover:bg-primary-hover text-white rounded-lg font-medium cursor-pointer transition-colors shadow-lg shadow-primary/20">
          {t('dropzone.select')}
        </span>
      </label>
    </div>
  );
};
