import React, { useEffect, useRef, useState } from 'react';
import { useSlicer } from '../../context/SlicerContext';

export const Preview: React.FC = () => {
  const { imageUrl, settings, imageDimensions } = useSlicer();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  // Calculate grid cells based on settings
  const getGridCells = () => {
    if (!imageDimensions) return [];
    
    const { width, height } = imageDimensions;
    const { rows, cols, startId, sortMode } = settings;
    
    const cellWidth = width / cols;
    const cellHeight = height / rows;
    
    const cells = [];
    let counter = startId;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let actualCol = c;
        
        // Handle snake sorting
        if (sortMode === 'snake-1') { // Odd rows L-R, Even rows R-L (0-indexed, so row 0 is "odd" in 1-based logic if we consider 1st row)
          // Actually let's stick to 0-indexed logic:
          // Row 0 (1st): L-R
          // Row 1 (2nd): R-L
          if (r % 2 !== 0) actualCol = cols - 1 - c;
        } else if (sortMode === 'snake-2') {
          // Row 0 (1st): R-L
          // Row 1 (2nd): L-R
          if (r % 2 === 0) actualCol = cols - 1 - c;
        }

        cells.push({
          id: counter++,
          x: actualCol * cellWidth,
          y: r * cellHeight,
          width: cellWidth,
          height: cellHeight,
          row: r,
          col: actualCol
        });
      }
    }
    
    // Sort cells back to visual order for rendering grid lines correctly? 
    // No, we just need to render the ID at the correct position.
    // The loop above iterates visually (row by row), but assigns IDs based on logic?
    // Wait, the loop above iterates row by row, col by col (visually L-R).
    // But we want the ID to follow the sort mode.
    
    // Let's re-think. We want to draw the grid visually L-R, T-B.
    // But the number inside should change.
    
    // Correct approach: Iterate 0..total-1, calculate position for each ID
    const total = rows * cols;
    const cellMap = new Map<string, number>(); // "r,c" -> id
    const visualCells = [];

    for (let i = 0; i < total; i++) {
        const id = startId + i;
        let r = Math.floor(i / cols);
        let c = i % cols;

        // If snake mode, adjust column based on row
        if (sortMode === 'reverse') {
            const reversedIndex = total - 1 - i;
            r = Math.floor(reversedIndex / cols);
            c = reversedIndex % cols;
        } else if (sortMode === 'snake-1') {
            if (r % 2 !== 0) c = cols - 1 - c;
        } else if (sortMode === 'snake-2') {
            if (r % 2 === 0) c = cols - 1 - c;
        }
        
        // However, the user wants:
        // Normal: 
        // 1 2
        // 3 4
        
        // Snake 1 (Odd L-R, Even R-L):
        // 1 2 (Row 0)
        // 4 3 (Row 1)
        
        // Snake 2 (Even L-R, Odd R-L):
        // 2 1 (Row 0)
        // 3 4 (Row 1)
        
        // My logic above:
        // i=0 (id=1), r=0, c=0. Snake1: r0 is even(0), c=0. Correct.
        // i=1 (id=2), r=0, c=1. Snake1: r0 is even(0), c=1. Correct.
        // i=2 (id=3), r=1, c=0. Snake1: r1 is odd(1), c=2-1-0=1. Pos (1,1). Correct (bottom right).
        // i=3 (id=4), r=1, c=1. Snake1: r1 is odd(1), c=2-1-1=0. Pos (1,0). Correct (bottom left).
        
        cellMap.set(`${r},${c}`, id);
    }

    // Now generate visual cells for rendering
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            visualCells.push({
                id: cellMap.get(`${r},${c}`),
                x: c * cellWidth,
                y: r * cellHeight,
                width: cellWidth,
                height: cellHeight
            });
        }
    }
    
    return visualCells;
  };

  useEffect(() => {
    if (!canvasRef.current || !imageUrl || !imageDimensions) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.src = imageUrl;
    
    img.onload = () => {
      // Reset canvas size
      canvas.width = imageDimensions.width;
      canvas.height = imageDimensions.height;

      // Draw image
      ctx.drawImage(img, 0, 0);

      // Draw grid and numbers
      const cells = getGridCells();
      
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.8)'; // blue-500
      ctx.lineWidth = 1;
      ctx.fillStyle = 'rgba(59, 130, 246, 0.3)'; // blue-500 with opacity
      
      // Font settings
      ctx.font = `bold ${settings.fontSize}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      cells.forEach((cell: any) => {
        // Draw grid line
        ctx.strokeRect(cell.x, cell.y, cell.width, cell.height);
        
        // Draw number background (optional, for readability)
        // ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        // ctx.fillRect(cell.x + cell.width/2 - 20, cell.y + cell.height/2 - 20, 40, 40);

        // Draw number
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 4;
        ctx.lineWidth = 3;
        ctx.strokeText(cell.id?.toString() || '', cell.x + cell.width / 2, cell.y + cell.height / 2);
        ctx.fillText(cell.id?.toString() || '', cell.x + cell.width / 2, cell.y + cell.height / 2);
        
        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
      });
    };

  }, [imageUrl, imageDimensions, settings]);

  // Fit to container logic
  useEffect(() => {
    if (!containerRef.current || !imageDimensions) return;
    
    const { width, height } = imageDimensions;
    const container = containerRef.current;
    
    const scaleX = (container.clientWidth - 48) / width; // 48px padding
    const scaleY = (container.clientHeight - 48) / height;
    
    const newScale = Math.min(scaleX, scaleY, 1); // Don't scale up if smaller
    setScale(newScale);
    
  }, [imageDimensions]);

  if (!imageUrl) return null;

  return (
    <div 
      ref={containerRef} 
      className="flex-1 flex items-center justify-center overflow-hidden bg-surface/30 relative p-6"
    >
      <div 
        style={{ 
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          transition: 'transform 0.2s ease-out'
        }}
        className="shadow-2xl"
      >
        <canvas ref={canvasRef} className="bg-white/5 rounded-sm" />
      </div>
      
      <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur px-3 py-1 rounded-full text-xs text-gray-300 font-mono">
        {Math.round(scale * 100)}% • {imageDimensions?.width}x{imageDimensions?.height}px
      </div>
    </div>
  );
};
