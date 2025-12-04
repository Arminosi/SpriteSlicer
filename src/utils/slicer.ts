import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { SlicerSettings, Cell } from '../types';

export const sliceImage = async (
  file: File,
  settings: SlicerSettings,
  cells: Cell[],
  onProgress?: (progress: number) => void
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = async () => {
      try {
        const { rows, cols } = settings;
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

            // Add to zip
            const id = cell.displayId;
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
        resolve(content);
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

export const sliceImageDirectly = async (
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
        const { rows, cols } = settings;
        const cellWidth = img.width / cols;
        const cellHeight = img.height / rows;
        
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

            // Get blob
            const id = cell.displayId;
            const blob = await new Promise<Blob | null>(resolveBlob => 
              canvas.toBlob(resolveBlob, file.type, 0.9)
            );
            
            if (blob) {
              const ext = file.name.split('.').pop() || 'png';
              const fileName = `${file.name.split('.')[0]}_${id}.${ext}`;
              saveAs(blob, fileName);
              
              // Small delay to prevent browser throttling
              await new Promise(r => setTimeout(r, 100));
            }

            processed++;
            if (onProgress) onProgress((processed / total) * 100);
        }
        
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

export const downloadMultipleSlices = async (
  file: File,
  settings: SlicerSettings,
  cells: Cell[]
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = async () => {
      try {
        const { rows, cols } = settings;
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

        for (const cell of cells) {
          // Clear canvas
          ctx.clearRect(0, 0, cellWidth, cellHeight);
          
          // Draw slice based on original row/col
          ctx.drawImage(
            img,
            cell.col * cellWidth, cell.row * cellHeight, cellWidth, cellHeight,
            0, 0, cellWidth, cellHeight
          );

          // Add to zip
          const id = cell.displayId;
          const blob = await new Promise<Blob | null>(resolveBlob => 
            canvas.toBlob(resolveBlob, file.type, 0.9)
          );
          
          if (blob) {
            const ext = file.name.split('.').pop() || 'png';
            const fileName = `${file.name.split('.')[0]}_${id}.${ext}`;
            zip.file(fileName, blob);
          }
        }

        // Generate zip
        const content = await zip.generateAsync({ type: 'blob' });
        saveAs(content, `${file.name.split('.')[0]}_selected.zip`);
        
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

export const downloadSingleSlice = async (
  file: File,
  settings: SlicerSettings,
  cell: Cell
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = async () => {
      try {
        const { rows, cols } = settings;
        const cellWidth = img.width / cols;
        const cellHeight = img.height / rows;
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        canvas.width = cellWidth;
        canvas.height = cellHeight;

        // Draw slice based on original row/col
        ctx.drawImage(
          img,
          cell.col * cellWidth, cell.row * cellHeight, cellWidth, cellHeight, // Source
          0, 0, cellWidth, cellHeight // Destination
        );

        // Convert to blob and download
        const id = cell.displayId;
        canvas.toBlob((blob) => {
          if (blob) {
            const ext = file.name.split('.').pop() || 'png';
            const fileName = `${file.name.split('.')[0]}_${id}.${ext}`;
            saveAs(blob, fileName);
            resolve();
          } else {
            reject(new Error('Failed to create blob'));
          }
        }, file.type, 0.9);
        
        URL.revokeObjectURL(url);
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
