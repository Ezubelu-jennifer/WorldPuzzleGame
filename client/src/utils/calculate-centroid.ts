import { getPathBounds } from 'svg-path-bounds';

// Very simplified SVG path command
interface PathCommand {
  type: string;
  x?: number;
  y?: number;
}

/**
 * Very simplified SVG path parser that extracts points
 * @param path SVG path string
 * @returns Array of commands with coordinates
 */
function parseSvgPath(path: string): PathCommand[] {
  const commands: PathCommand[] = [];
  const regex = /([mMlLhHvVcCsSqQtTaAzZ])([^mMlLhHvVcCsSqQtTaAzZ]*)/g;
  let match: RegExpExecArray | null;
  
  let lastX = 0;
  let lastY = 0;
  
  while ((match = regex.exec(path)) !== null) {
    const type = match[1];
    const args = match[2].trim().split(/[\s,]+/).filter(arg => arg !== '').map(Number);
    
    switch (type) {
      case 'M': // Move absolute
      case 'm': // Move relative
        if (args.length >= 2) {
          for (let i = 0; i < args.length; i += 2) {
            const x = type === 'm' ? lastX + args[i] : args[i];
            const y = type === 'm' ? lastY + args[i+1] : args[i+1];
            lastX = x;
            lastY = y;
            commands.push({ type, x, y });
          }
        }
        break;
        
      case 'L': // Line absolute
      case 'l': // Line relative
        if (args.length >= 2) {
          for (let i = 0; i < args.length; i += 2) {
            const x = type === 'l' ? lastX + args[i] : args[i];
            const y = type === 'l' ? lastY + args[i+1] : args[i+1];
            lastX = x;
            lastY = y;
            commands.push({ type, x, y });
          }
        }
        break;
        
      // Add more command parsing as needed
    }
  }
  
  return commands;
}

/**
 * Calculate the centroid of an SVG path using various methods
 * @param path The SVG path string
 * @returns {x: number, y: number} The centroid coordinates
 */
export function calculatePathCentroid(path: string): { x: number, y: number } {
  try {
    // We'll use a simpler approach with bounds calculation
    console.log(`Calculating centroid for path: ${path.substring(0, 30)}...`);
    
    // Parse the SVG path to extract commands
    const commands = parseSvgPath(path);
    if (commands.length > 0) {
      // Calculate average of all path commands
      let totalX = 0;
      let totalY = 0;
      let pointCount = 0;
      
      for (const cmd of commands) {
        if (cmd.x !== undefined && cmd.y !== undefined) {
          totalX += cmd.x;
          totalY += cmd.y;
          pointCount++;
        }
      }
      
      if (pointCount > 0) {
        return {
          x: totalX / pointCount,
          y: totalY / pointCount
        };
      }
    }
  } catch (err) {
    console.warn('Error calculating centroid with path parsing:', err);
  }
  
  try {
    // Fallback method: calculate centroid from bounding box
    const [minX, minY, maxX, maxY] = getPathBounds(path);
    
    return {
      x: minX + (maxX - minX) / 2,
      y: minY + (maxY - minY) / 2
    };
  } catch (err) {
    console.warn('Error calculating centroid with svg-path-bounds:', err);
    
    // Last resort fallback: return 0,0 (should never happen)
    return { x: 0, y: 0 };
  }
}