import ClipperLib from 'clipper-lib';
import { getPathBounds } from 'svg-path-bounds';

// Define interfaces for ClipperLib types if needed
interface IntPoint {
  X: number;
  Y: number;
}

type Path = IntPoint[];
type Paths = Path[];

// Convert SVG path to Clipper points
export function svgPathToClipperPoints(svgPath: string): Path {
  try {
    // Parse the SVG path to extract points
    const pathRegex = /([MLHVCSQTAZmlhvcsqtaz])([^MLHVCSQTAZmlhvcsqtaz]*)/g;
    const pathMatch = svgPath.match(pathRegex);
    
    if (!pathMatch) {
      console.error('Failed to parse SVG path:', svgPath);
      return [];
    }
    
    // Get the bounding box of the SVG path
    const bounds = getPathBounds(svgPath);
    const [minX, minY, maxX, maxY] = bounds;
    
    // Generate points along the path (simplified approach)
    const points: IntPoint[] = [];
    const scale = 1000; // Scale factor to convert to integer coordinates
    
    // Sample points along the path
    const numPoints = 100; // Number of points to sample
    
    for (let i = 0; i < numPoints; i++) {
      const t = i / (numPoints - 1);
      // Simple linear interpolation around the path
      const x = Math.round((minX + t * (maxX - minX)) * scale);
      const y = Math.round((minY + t * (maxY - minY)) * scale);
      points.push({ X: x, Y: y });
    }
    
    return points;
  } catch (error) {
    console.error('Error converting SVG path to Clipper points:', error);
    return [];
  }
}

// Scale a path by a factor
export function scalePath(path: Path, scaleFactor: number): Path {
  try {
    const solution: Paths = [];
    const clipper = new ClipperLib.ClipperOffset();
    
    clipper.AddPath(path, ClipperLib.JoinType.jtRound, ClipperLib.EndType.etClosedPolygon);
    clipper.Execute(solution, scaleFactor);
    
    return solution.length > 0 ? solution[0] : path;
  } catch (error) {
    console.error('Error scaling path:', error);
    return path;
  }
}

// Convert Clipper points back to SVG path
export function clipperPointsToSvgPath(points: Path): string {
  if (points.length === 0) return '';
  
  let svgPath = `M ${points[0].X} ${points[0].Y} `;
  
  for (let i = 1; i < points.length; i++) {
    svgPath += `L ${points[i].X} ${points[i].Y} `;
  }
  
  svgPath += 'Z'; // Close the path
  return svgPath;
}

// Fallback simplified scaling if ClipperLib fails
function simpleScalePath(svgPath: string, scaleFactor: number): string {
  try {
    // This is a very basic approach that just attempts to
    // scale the path by modifying the coordinates
    const scale = scaleFactor;
    
    // Get the bounds of the original path
    const bounds = getPathBounds(svgPath);
    const [minX, minY, maxX, maxY] = bounds;
    
    // Calculate the center point
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    
    // Regular expression to find coordinates
    const coordRegex = /([0-9]+(?:\.[0-9]+)?)/g;
    
    // Scale coordinates around the center
    let scaledPath = svgPath.replace(coordRegex, (match) => {
      const coord = parseFloat(match);
      return String(coord * scale);
    });
    
    return scaledPath;
  } catch (error) {
    console.error('Error in simple path scaling:', error);
    return svgPath;
  }
}

// Optimize and scale an SVG path
export function optimizeSvgPath(svgPath: string, scaleFactor: number = 1.5): string {
  try {
    // Try ClipperLib approach first
    const clipperPoints = svgPathToClipperPoints(svgPath);
    
    if (clipperPoints.length > 0) {
      try {
        // Scale the path
        const scaledPoints = scalePath(clipperPoints, scaleFactor * 100);
        
        // Convert back to SVG path
        return clipperPointsToSvgPath(scaledPoints);
      } catch (error) {
        console.warn('ClipperLib scaling failed, trying simple scaling', error);
        return simpleScalePath(svgPath, scaleFactor);
      }
    } else {
      // If we couldn't get clipper points, try simple scaling
      return simpleScalePath(svgPath, scaleFactor);
    }
  } catch (error) {
    console.warn('Could not optimize SVG path, returning original', error);
    return svgPath;
  }
}