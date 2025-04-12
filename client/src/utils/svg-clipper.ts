import { getPathBounds } from 'svg-path-bounds';

// Direct scaling approach for SVG paths
export function optimizeSvgPath(svgPath: string, scaleFactor: number = 1.5): string {
  try {
    // Improved SVG path scaling that properly handles all SVG path commands
    const commands = svgPath.match(/([a-z][^a-z]*)/gi);
    if (!commands) return svgPath;
    
    // Get the bounds of the original path
    const bounds = getPathBounds(svgPath);
    const [minX, minY, maxX, maxY] = bounds;
    
    // Calculate the center point for scaling around center
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    
    const scaledCommands = commands.map(command => {
      // Get the command letter (first character)
      const cmd = command.charAt(0);
      
      // Handle different types of commands
      if (/[MLHVCSQTA]/i.test(cmd)) {
        // Commands that have coordinate values
        
        // Extract all numbers from the command
        const parts = command.substring(1).trim().split(/[\s,]+/);
        const isRelative = cmd === cmd.toLowerCase();
        
        // Process the coordinates differently based on the command type
        let processedParts;
        
        if (/[ML]/i.test(cmd)) {
          // Move and Line commands: x,y pairs
          processedParts = parts.map((val, index) => {
            const num = parseFloat(val);
            
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
            const num = parseFloat(val);
            return isRelative
              ? num * scaleFactor
              : centerX + (num - centerX) * scaleFactor;
          });
        } else if (/[V]/i.test(cmd)) {
          // Vertical commands: y values only
          processedParts = parts.map(val => {
            const num = parseFloat(val);
            return isRelative
              ? num * scaleFactor
              : centerY + (num - centerY) * scaleFactor;
          });
        } else if (/[CSQTA]/i.test(cmd)) {
          // Curve commands: multiple coordinate pairs
          processedParts = parts.map((val, index) => {
            const num = parseFloat(val);
            
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
        return cmd + processedParts.join(' ');
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