import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { SlicerSettings, Cell } from '../types';

export const sliceImage = async (
  file: File,
  settings: SlicerSettings,
  cells: Cell[],
  onProgress?: (progress: number) => void
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = async () => {
      try {
        const { rows, cols, fontSize } = settings;
        const cellWidth = img.width / cols;
        const cellHeight = img.height / rows;
        
        const zip = new JSZip();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        canvas.width = cellWidth;
        canvas.height = cellHeight;

        let processed = 0;
        const total = cells.length;

        for (const cell of cells) {
            // Clear canvas
            ctx.clearRect(0, 0, cellWidth, cellHeight);
            
            // Draw slice based on original row/col
            ctx.drawImage(
              img,
              cell.col * cellWidth, cell.row * cellHeight, cellWidth, cellHeight, // Source
              0, 0, cellWidth, cellHeight // Destination
            );

            // Draw number (displayId)
            const id = cell.displayId;
            
            // Font settings
            ctx.font = `bold ${fontSize}px Inter, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // Stroke
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 3;
            ctx.strokeText(id.toString(), cellWidth / 2, cellHeight / 2);
            
            // Fill
            ctx.fillStyle = '#ffffff';
            ctx.fillText(id.toString(), cellWidth / 2, cellHeight / 2);

            // Add to zip
            const blob = await new Promise<Blob | null>(resolveBlob => 
              canvas.toBlob(resolveBlob, file.type, 0.9)
            );
            
            if (blob) {
              const ext = file.name.split('.').pop() || 'png';
              const fileName = `${file.name.split('.')[0]}_${id}.${ext}`;
              zip.file(fileName, blob);
            }

            processed++;
            if (onProgress) onProgress((processed / total) * 100);
        }

        // Generate zip
        const content = await zip.generateAsync({ type: 'blob' });
        saveAs(content, `${file.name.split('.')[0]}_sliced.zip`);
        
        URL.revokeObjectURL(url);
        resolve();
      } catch (err) {
        URL.revokeObjectURL(url);
        reject(err);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
};
