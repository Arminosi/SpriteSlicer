/**
 * Detect grid layout from image
 * @param file - Image file to analyze
 * @param sensitivity - Detection sensitivity (1-10, higher = more divisions)
 */
export const detectGrid = async (file: File, sensitivity: number = 5): Promise<{ rows: number; cols: number }> => {
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
      
      // Sensitivity affects:
      // - Alpha threshold for detecting content (lower = more sensitive)
      // - Gap threshold for finding separators (higher = finds smaller gaps)
      // - Tolerance for evenly spaced divisions
      const alphaThreshold = Math.max(5, 30 - sensitivity * 3); // 5-27, lower is more sensitive
      const gapEnergyThreshold = Math.floor(sensitivity * 2); // Allow some noise in gaps at higher sensitivity
      const toleranceFactor = 0.25 - sensitivity * 0.015; // 0.1-0.235, higher sensitivity = stricter matching
      
      // 1. Calculate projection profiles (energy)
      const rowEnergy = new Uint32Array(height);
      const colEnergy = new Uint32Array(width);

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const alpha = data[(y * width + x) * 4 + 3];
          if (alpha > alphaThreshold) {
            rowEnergy[y]++;
            colEnergy[x]++;
          }
        }
      }

      // 2. Find gaps (consecutive rows/cols with zero or very low energy)
      const findGaps = (energy: Uint32Array, size: number, threshold: number): number[] => {
        const gaps: number[] = [];
        let inGap = false;
        let gapStart = 0;
        
        for (let i = 0; i < size; i++) {
          if (energy[i] <= threshold) {
            if (!inGap) {
              inGap = true;
              gapStart = i;
            }
          } else {
            if (inGap) {
              // Record the center of the gap
              const gapCenter = Math.floor((gapStart + i - 1) / 2);
              gaps.push(gapCenter);
              inGap = false;
            }
          }
        }
        return gaps;
      };

      // 3. Find evenly spaced gaps that form a grid
      const findEvenlySpacedDivisions = (gaps: number[], size: number, maxDivs: number): number => {
        if (gaps.length === 0) return 1;
        
        // Try different division counts
        for (let divs = Math.min(maxDivs, gaps.length + 1); divs >= 2; divs--) {
          const expectedStep = size / divs;
          const tolerance = expectedStep * toleranceFactor;
          
          let matchedGaps = 0;
          const usedGaps = new Set<number>();
          
          // Check if we can find gaps near expected cut positions
          for (let i = 1; i < divs; i++) {
            const expectedPos = i * expectedStep;
            
            // Find closest gap to this expected position
            let bestGap = -1;
            let bestDist = Infinity;
            
            for (const gap of gaps) {
              if (usedGaps.has(gap)) continue;
              const dist = Math.abs(gap - expectedPos);
              if (dist < bestDist && dist < tolerance) {
                bestDist = dist;
                bestGap = gap;
              }
            }
            
            if (bestGap !== -1) {
              matchedGaps++;
              usedGaps.add(bestGap);
            }
          }
          
          // If we matched all expected cut lines (divs - 1), this is a valid grid
          if (matchedGaps === divs - 1) {
            return divs;
          }
        }
        
        return 1;
      };

      // 4. Alternative: Count actual gaps and use that as division count
      const countDistinctRegions = (energy: Uint32Array, size: number): number => {
        let regions = 0;
        let inContent = false;
        
        for (let i = 0; i < size; i++) {
          if (energy[i] > gapEnergyThreshold) {
            if (!inContent) {
              regions++;
              inContent = true;
            }
          } else {
            inContent = false;
          }
        }
        
        return Math.max(1, regions);
      };

      // Find gaps with sensitivity-based threshold
      const rowGaps = findGaps(rowEnergy, height, gapEnergyThreshold);
      const colGaps = findGaps(colEnergy, width, gapEnergyThreshold);
      
      // Method 1: Try to find evenly spaced grid
      let rows = findEvenlySpacedDivisions(rowGaps, height, 50);
      let cols = findEvenlySpacedDivisions(colGaps, width, 50);
      
      // Method 2: If evenly spaced doesn't work well, count distinct regions
      if (rows === 1 && rowGaps.length > 0) {
        rows = countDistinctRegions(rowEnergy, height);
      }
      if (cols === 1 && colGaps.length > 0) {
        cols = countDistinctRegions(colEnergy, width);
      }
      
      // Method 3: Fallback - use gap count + 1 if reasonable
      if (rows === 1 && rowGaps.length >= 1 && rowGaps.length < 50) {
        rows = rowGaps.length + 1;
      }
      if (cols === 1 && colGaps.length >= 1 && colGaps.length < 50) {
        cols = colGaps.length + 1;
      }
      
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
