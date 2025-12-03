export const detectGrid = async (file: File): Promise<{ rows: number; cols: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error('Canvas context not available'));
        return;
      }
      
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const width = canvas.width;
      const height = canvas.height;
      
      // 1. Calculate projection profiles (energy)
      // rowEnergy[y] = number of non-transparent pixels in row y
      // colEnergy[x] = number of non-transparent pixels in col x
      const rowEnergy = new Uint32Array(height);
      const colEnergy = new Uint32Array(width);

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const alpha = data[(y * width + x) * 4 + 3];
          if (alpha > 20) { // Threshold for transparency
            rowEnergy[y]++;
            colEnergy[x]++;
          }
        }
      }

      // 2. Find best grid divisions
      // We look for the largest number of divisions (up to 50) where all cut lines fall on empty space (gaps).
      
      const findBestDivision = (size: number, energy: Uint32Array, maxDivs: number) => {
        // Iterate from max divisions down to 2
        for (let divs = maxDivs; divs >= 2; divs--) {
          const step = size / divs;
          let allCutsClean = true;
          
          // Check all cut lines for this division count
          for (let i = 1; i < divs; i++) {
            // Calculate theoretical cut position
            const cutPos = Math.floor(i * step);
            
            if (cutPos >= size) continue;
            
            // Check if the cut line passes through content
            // We check the exact line. If it hits content, this grid is invalid.
            // This assumes there is at least 1px gap between sprites.
            if (energy[cutPos] > 0) {
              allCutsClean = false;
              break;
            }
          }
          
          if (allCutsClean) {
            return divs;
          }
        }
        return 1; // Default to 1 if no valid grid found
      };

      const rows = findBestDivision(height, rowEnergy, 50);
      const cols = findBestDivision(width, colEnergy, 50);
      
      URL.revokeObjectURL(url);
      resolve({ rows, cols });
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    
    img.src = url;
  });
};
