import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface ContextMenuAction {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  danger?: boolean;
  keepOpen?: boolean;
}

interface ContextMenuProps {
  x: number;
  y: number;
  actions: ContextMenuAction[];
  onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, actions, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleScroll = () => {
      onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', onClose);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', onClose);
    };
  }, [onClose]);

  // Adjust position if it goes off screen
  const style: React.CSSProperties = {
    top: y,
    left: x,
  };

  // Simple adjustment logic (can be improved)
  if (typeof window !== 'undefined') {
    if (x + 200 > window.innerWidth) {
      style.left = x - 200;
    }
    if (y + actions.length * 40 > window.innerHeight) {
      style.top = y - actions.length * 40;
    }
  }

  return createPortal(
    <div
      ref={menuRef}
      className="fixed z-[9999] min-w-[160px] bg-surface border border-border rounded-md shadow-xl py-1 animate-in fade-in zoom-in-95 duration-100"
      style={style}
      onContextMenu={(e) => e.preventDefault()}
    >
      {actions.map((action, index) => (
        <button
          key={index}
          onClick={(e) => {
            e.stopPropagation();
            action.onClick();
            if (!action.keepOpen) {
              onClose();
            }
          }}
          className={`w-full px-3 py-2 text-xs text-left flex items-center gap-2 hover:bg-surface-hover transition-colors
            ${action.danger ? 'text-red-400 hover:bg-red-500/10' : 'text-gray-200'}
          `}
        >
          {action.icon && <span className="w-4 h-4">{action.icon}</span>}
          {action.label}
        </button>
      ))}
    </div>,
    document.body
  );
};
