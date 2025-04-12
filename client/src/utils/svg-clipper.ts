import { getPathBounds } from 'svg-path-bounds';

/**
 * Similar to Flutter's SvgClipper, this function properly scales SVG paths
 * based on the path's bounding box, ensuring uniform scaling across different shapes.
 * 
 * @param svgPath - The SVG path string to scale
 * @param targetSize - The target size object with width and height
 * @returns The scaled SVG path string
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
    const scale = Math.min(scaleX, scaleY);
    
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
          return isRelative ? x * scale : (x - minX) * scale;
        });
      } else if (command.toUpperCase() === 'V') {
        // Vertical line - only Y coordinates
        transformedNumbers = numbers.map((y: number) => {
          return isRelative ? y * scale : (y - minY) * scale;
        });
      } else {
        // Commands with X,Y coordinate pairs (M, L, C, S, Q, T, A)
        for (let i = 0; i < numbers.length; i++) {
          if (i % 2 === 0) {
            // X coordinate
            transformedNumbers.push(isRelative ? numbers[i] * scale : (numbers[i] - minX) * scale);
          } else {
            // Y coordinate
            transformedNumbers.push(isRelative ? numbers[i] * scale : (numbers[i] - minY) * scale);
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
 * @param scaleFactor - The desired scale factor (default: 2.5)
 * @returns The optimized SVG path string
 */
export function optimizeSvgPath(svgPath: string, scaleFactor: number = 2.5): string {
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