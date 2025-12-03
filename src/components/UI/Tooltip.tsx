import React, { useState } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  content: string;
  children: React.ReactElement;
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState<{ x: number; y: number; align: 'center' | 'left' | 'right' }>({ x: 0, y: 0, align: 'center' });

  const handleMouseEnter = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const isLeftEdge = rect.left < 100;
    const isRightEdge = window.innerWidth - rect.right < 100;
    
    let x = rect.left + rect.width / 2;
    let align: 'center' | 'left' | 'right' = 'center';

    if (isLeftEdge) {
      x = rect.left;
      align = 'left';
    } else if (isRightEdge) {
      x = rect.right;
      align = 'right';
    }

    setPosition({
      x,
      y: rect.top,
      align
    });
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  return (
    <>
      {React.cloneElement(children, {
        onMouseEnter: (e: React.MouseEvent) => {
          handleMouseEnter(e);
          children.props.onMouseEnter?.(e);
        },
        onMouseLeave: (e: React.MouseEvent) => {
          handleMouseLeave();
          children.props.onMouseLeave?.(e);
        }
      })}
      {isVisible && createPortal(
        <div 
          className="fixed z-[9999] pointer-events-none transition-all duration-200"
          style={{ 
            left: position.x, 
            top: position.y - 8,
            transform: position.align === 'left' 
              ? 'translate(0, -100%)' 
              : position.align === 'right'
                ? 'translate(-100%, -100%)'
                : 'translate(-50%, -100%)'
          }}
        >
          <div className="bg-gray-900/95 backdrop-blur-sm text-primary text-xs font-bold px-3 py-2 rounded-sm shadow-[0_0_15px_rgba(0,0,0,0.5)] border border-primary/50 text-center leading-tight whitespace-nowrap tracking-wide">
            {content}
          </div>
          {/* Arrow */}
          <div 
            className="w-1.5 h-1.5 bg-gray-900 border-r border-b border-primary/50 transform rotate-45 absolute -bottom-[3.5px]"
            style={{
              left: position.align === 'left' 
                ? '20px' 
                : position.align === 'right'
                  ? 'calc(100% - 20px)'
                  : '50%',
              transform: 'translateX(-50%) rotate(45deg)'
            }}
          ></div>
        </div>,
        document.body
      )}
    </>
  );
};
