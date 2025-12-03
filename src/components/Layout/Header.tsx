import React from 'react';
import { Scissors, Languages } from 'lucide-react';
import { useSlicer } from '../../context/SlicerContext';
import { Button } from '../UI/Button';

export const Header: React.FC = () => {
  const { language, setLanguage, t } = useSlicer();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'zh' : 'en');
  };

  return (
    <header className="h-14 border-b border-border bg-background/50 backdrop-blur-sm flex items-center px-4 justify-between shrink-0 z-10">
      <div className="flex items-center gap-2">
        <div className="p-1.5 bg-primary/10 rounded-md">
          <Scissors className="w-5 h-5 text-primary" />
        </div>
        <h1 className="font-semibold text-gray-100">{t('app.title')}</h1>
      </div>
      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={toggleLanguage}
          className="text-gray-400 hover:text-gray-200"
          title={language === 'en' ? 'Switch to Chinese' : '切换到英文'}
        >
          <Languages className="w-4 h-4 mr-2" />
          {language === 'en' ? 'EN' : '中文'}
        </Button>
      </div>
    </header>
  );
};
