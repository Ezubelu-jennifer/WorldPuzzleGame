import { getPathBounds } from 'svg-path-bounds';

/**
 * Inspired by Flutter's SvgClipper, this function properly scales and centers SVG paths
 * based on the path's bounding box, ensuring uniform scaling across different shapes.
 * It centers the transformed path to ensure it's perfectly aligned within the target container.
 * 
 * @param svgPath - The SVG path string to scale
 * @param targetSize - The target size object with width and height
 * @returns The scaled and centered SVG path string
 */
export function clipSvgPath(svgPath: string, targetSize: { width: number, height: number }): string {
  try {
    // Get the bounds of the original path
    const bounds = getPathBounds(svgPath);
    const [minX, minY, maxX, maxY] = bounds;
    
    // Calculate the bounding box dimensions
    const pathWidth = maxX - minX;
    const pathHeight = maxY - minY;
    
    // Calculate scaling factors to fit within target size while preserving aspect ratio
    const scaleX = targetSize.width / pathWidth;
    const scaleY = targetSize.height / pathHeight;
    
    // Use the smaller scale factor to ensure the entire path fits within the target
    const scale = Math.min(scaleX, scaleY) * 0.95; // 95% to add a small margin
    
    // Calculate the scaled dimensions
    const scaledWidth = pathWidth * scale;
    const scaledHeight = pathHeight * scale;
    
    // Calculate centering offsets to position the path in the center of the target area
    const offsetX = (targetSize.width - scaledWidth) / 2;
    const offsetY = (targetSize.height - scaledHeight) / 2;
    
    // Parse the SVG path commands one by one
    const commandRegex = /([MLHVCSQTAZmlhvcsqtaz])([^MLHVCSQTAZmlhvcsqtaz]*)/g;
    let matches: RegExpExecArray[] = [];
    let match: RegExpExecArray | null;

    while ((match = commandRegex.exec(svgPath)) !== null) {
      matches.push(match);
    }
    
    if (matches.length === 0) return svgPath;
    
    let scaledPath = '';
    
    for (const match of matches) {
      const command = match[1]; // The command letter (M, L, H, etc.)
      const params = match[2].trim(); // The parameters for the command
      
      // Handle different command types
      if (command === 'Z' || command === 'z') {
        // Close path command has no parameters
        scaledPath += command;
        continue;
      }
      
      // Split parameters on whitespace or commas
      const numbers = params.split(/[\s,]+/).map(parseFloat);
      
      // Transform the numbers based on command type
      const isRelative = command === command.toLowerCase();
      let transformedNumbers: number[] = [];
      
      if (command.toUpperCase() === 'H') {
        // Horizontal line - only X coordinates
        transformedNumbers = numbers.map((x: number) => {
          // Scale X and add the centering offset
          return isRelative 
            ? x * scale 
            : (x - minX) * scale + offsetX;
        });
      } else if (command.toUpperCase() === 'V') {
        // Vertical line - only Y coordinates
        transformedNumbers = numbers.map((y: number) => {
          // Scale Y and add the centering offset
          return isRelative 
            ? y * scale 
            : (y - minY) * scale + offsetY;
        });
      } else if (command.toUpperCase() === 'A') {
        // Arc commands have 7 parameters: rx ry x-axis-rotation large-arc-flag sweep-flag x y
        for (let i = 0; i < numbers.length; i += 7) {
          if (i + 6 < numbers.length) { // Ensure we have a complete set of arc parameters
            // rx and ry are scaled but not offset
            transformedNumbers.push(numbers[i] * scale);
            transformedNumbers.push(numbers[i + 1] * scale);
            
            // x-axis-rotation, large-arc-flag, and sweep-flag remain unchanged
            transformedNumbers.push(numbers[i + 2]);
            transformedNumbers.push(numbers[i + 3]);
            transformedNumbers.push(numbers[i + 4]);
            
            // End point x,y are scaled and offset
            transformedNumbers.push(isRelative 
              ? numbers[i + 5] * scale 
              : (numbers[i + 5] - minX) * scale + offsetX);
            transformedNumbers.push(isRelative 
              ? numbers[i + 6] * scale 
              : (numbers[i + 6] - minY) * scale + offsetY);
          }
        }
      } else {
        // Commands with X,Y coordinate pairs (M, L, C, S, Q, T)
        for (let i = 0; i < numbers.length; i++) {
          if (i % 2 === 0) {
            // X coordinate: scale and add X offset
            transformedNumbers.push(isRelative 
              ? numbers[i] * scale 
              : (numbers[i] - minX) * scale + offsetX);
          } else {
            // Y coordinate: scale and add Y offset
            transformedNumbers.push(isRelative 
              ? numbers[i] * scale 
              : (numbers[i] - minY) * scale + offsetY);
          }
        }
      }
      
      // Append the transformed command to the path
      scaledPath += command + transformedNumbers.join(' ');
    }
    
    return scaledPath;
  } catch (error) {
    console.warn('Failed to clip SVG path:', error);
    return svgPath;
  }
}

/**
 * Optimizes an SVG path by scaling it based on a desired scale factor.
 * Uses the clipSvgPath function internally.
 * 
 * @param svgPath - The SVG path string to optimize
 * @param scaleFactor - The desired scale factor (default: 3.0)
 * @returns The optimized SVG path string
 */
export function optimizeSvgPath(svgPath: string, scaleFactor: number = 3.0): string {
  try {
    // First we get the bounds of the path
    const bounds = getPathBounds(svgPath);
    const [minX, minY, maxX, maxY] = bounds;
    
    // Calculate the original size
    const originalWidth = maxX - minX;
    const originalHeight = maxY - minY;
    
    // Calculate the target size based on the scale factor
    const targetSize = {
      width: originalWidth * scaleFactor,
      height: originalHeight * scaleFactor
    };
    
    // Use the clipSvgPath function to properly scale the path
    return clipSvgPath(svgPath, targetSize);
  } catch (error) {
    console.warn('SVG path optimization failed:', error);
    return svgPath;
  }
}