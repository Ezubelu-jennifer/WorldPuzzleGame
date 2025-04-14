import { getPathBounds } from 'svg-path-bounds';

// Calculate the centroid (center point) of an SVG path
export function getPathCentroid(svgPath: string): { x: number, y: number } | null {
  try {
    // Sanitize the path to ensure it's processable
    const sanitizedPath = svgPath
      .replace(/\s+/g, ' ')
      .replace(/\s*,\s*/g, ',')
      .trim();
    
    // Get the bounding box of the path
    const bounds = getPathBounds(sanitizedPath);
    
    // Check if bounds calculation was successful
    const [minX, minY, maxX, maxY] = bounds;
    if (isNaN(minX) || isNaN(minY) || isNaN(maxX) || isNaN(maxY)) {
      console.warn('Invalid path bounds, cannot calculate centroid');
      return null;
    }
    
    // Calculate the center point of the bounding box as an approximation of the centroid
    // Note: This isn't a true geometric centroid, but a reasonable approximation
    // that works well for visualization purposes
    return {
      x: (minX + maxX) / 2,
      y: (minY + maxY) / 2
    };
  } catch (error) {
    console.warn('Failed to calculate path centroid:', error);
    return null;
  }
}

// Direct scaling approach for SVG paths
export function optimizeSvgPath(svgPath: string, scaleFactor: number = 1.5): string {
  try {
    // Skip optimization for very complex paths to prevent errors
    if (svgPath.length > 5000) {
      console.warn('Path too complex for optimization, using original');
      return svgPath;
    }
    
    // Simple path sanitization to handle potential parsing issues
    // Remove multiple consecutive spaces and normalize commas
    const sanitizedPath = svgPath
      .replace(/\s+/g, ' ')
      .replace(/\s*,\s*/g, ',')
      .trim();
    
    // Try to get path bounds - if this fails, we'll use the original path
    let bounds;
    try {
      bounds = getPathBounds(sanitizedPath);
    } catch (e) {
      console.warn('Failed to get path bounds, using original path');
      return svgPath;
    }
    
    // If bounds calculation returns NaN or invalid values, return original
    const [minX, minY, maxX, maxY] = bounds;
    if (isNaN(minX) || isNaN(minY) || isNaN(maxX) || isNaN(maxY)) {
      console.warn('Invalid path bounds, using original path');
      return svgPath;
    }
    
    // Improved SVG path scaling that properly handles all SVG path commands
    const commands = sanitizedPath.match(/([a-z][^a-z]*)/gi);
    if (!commands) return svgPath;
    
    // Calculate the center point for scaling around center
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    
    // Safe parsing of number values
    const safeParseFloat = (val: string): number => {
      const parsed = parseFloat(val);
      return isNaN(parsed) ? 0 : parsed;
    };
    
    const scaledCommands = commands.map(command => {
      // Get the command letter (first character)
      const cmd = command.charAt(0);
      
      // Handle different types of commands
      if (/[MLHVCSQTA]/i.test(cmd)) {
        // Commands that have coordinate values
        
        // Extract all numbers from the command
        const parts = command.substring(1).trim().split(/[\s,]+/).filter(p => p.length > 0);
        if (parts.length === 0) return command; // Skip if no valid parts
        
        const isRelative = cmd === cmd.toLowerCase();
        
        // Process the coordinates differently based on the command type
        let processedParts;
        
        if (/[ML]/i.test(cmd)) {
          // Move and Line commands: x,y pairs
          processedParts = parts.map((val, index) => {
            const num = safeParseFloat(val);
            
            // Scale around center point for absolute coordinates
            if (!isRelative) {
              return index % 2 === 0
                ? centerX + (num - centerX) * scaleFactor
                : centerY + (num - centerY) * scaleFactor;
            } else {
              // For relative coordinates, just scale directly
              return num * scaleFactor;
            }
          });
        } else if (/[H]/i.test(cmd)) {
          // Horizontal commands: x values only
          processedParts = parts.map(val => {
            const num = safeParseFloat(val);
            return isRelative
              ? num * scaleFactor
              : centerX + (num - centerX) * scaleFactor;
          });
        } else if (/[V]/i.test(cmd)) {
          // Vertical commands: y values only
          processedParts = parts.map(val => {
            const num = safeParseFloat(val);
            return isRelative
              ? num * scaleFactor
              : centerY + (num - centerY) * scaleFactor;
          });
        } else if (/[CSQTA]/i.test(cmd)) {
          // Curve commands: multiple coordinate pairs
          processedParts = parts.map((val, index) => {
            const num = safeParseFloat(val);
            
            if (!isRelative) {
              return index % 2 === 0
                ? centerX + (num - centerX) * scaleFactor
                : centerY + (num - centerY) * scaleFactor;
            } else {
              return num * scaleFactor;
            }
          });
        } else {
          // Unknown commands, keep as is
          processedParts = parts;
        }
        
        // Recombine the command letter with processed coordinates
        // Format numbers to reduce floating point precision issues
        const formattedParts = processedParts.map(p => 
          typeof p === 'number' ? p.toFixed(2) : p
        );
        
        return cmd + formattedParts.join(' ');
      } else {
        // Commands without coordinates (Z)
        return command;
      }
    });
    
    // Join all transformed commands back into an SVG path string
    return scaledCommands.join('');
  } catch (error) {
    console.warn('SVG path scaling failed:', error);
    return svgPath;
  }
}