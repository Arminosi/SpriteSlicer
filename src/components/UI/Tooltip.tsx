import React, { useState } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  content: string;
  children: React.ReactElement;
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState<{ 
    x: number; 
    y: number; 
    align: 'center' | 'left' | 'right';
    placement: 'top' | 'bottom';
  }>({ x: 0, y: 0, align: 'center', placement: 'top' });

  const handleMouseEnter = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Vertical positioning logic
    // If element is too close to top (< 50px), show tooltip below
    const spaceTop = rect.top;
    const placement = spaceTop > 50 ? 'top' : 'bottom';

    // Horizontal positioning logic
    const isLeftEdge = rect.left < 100;
    const isRightEdge = viewportWidth - rect.right < 100;
    
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
      y: placement === 'top' ? rect.top : rect.bottom,
      align,
      placement
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
            top: position.placement === 'top' ? position.y - 8 : position.y + 8,
            transform: `translate(${
              position.align === 'left' ? '0' : position.align === 'right' ? '-100%' : '-50%'
            }, ${
              position.placement === 'top' ? '-100%' : '0'
            })`
          }}
        >
          <div className="bg-gray-900/95 backdrop-blur-sm text-primary text-xs font-bold px-3 py-2 rounded-sm shadow-[0_0_15px_rgba(0,0,0,0.5)] border border-primary/50 text-center leading-tight max-w-[200px] break-words">
            {content}
          </div>
          {/* Arrow */}
          <div 
            className={`w-1.5 h-1.5 bg-gray-900 border-primary/50 transform rotate-45 absolute ${
              position.placement === 'top' 
                ? '-bottom-[3.5px] border-r border-b' 
                : '-top-[3.5px] border-l border-t'
            }`}
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
