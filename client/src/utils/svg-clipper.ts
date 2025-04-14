import { getPathBounds } from 'svg-path-bounds';

// Known centroids for ALL Nigerian states and problematic Kenyan counties
// These coordinates are carefully mapped to match the SVG positions exactly
const KNOWN_CENTROIDS: Record<string, { x: number, y: number }> = {
  // Nigerian states with manually adjusted centroids to more accurately reflect visual centers
  "NG-AB": { x: 306.5, y: 525.1 }, // Abia - adjusted to be more central
  "NG-AD": { x: 438.5, y: 327.2 }, // Adamawa - fine-tuned position
  "NG-AK": { x: 288.3, y: 546.5 }, // Akwa Ibom - moved slightly southeast
  "NG-AN": { x: 294.2, y: 498.4 }, // Anambra - minor adjustment
  "NG-BA": { x: 403.2, y: 293.6 }, // Bauchi - moved west slightly
  "NG-BE": { x: 372.2, y: 395.1 }, // Benue - adjusted to true center
  "NG-BO": { x: 469.9, y: 234.8 }, // Borno - moved east slightly
  "NG-BY": { x: 268.9, y: 538.4 }, // Bayelsa - moved south
  "NG-CR": { x: 340.2, y: 503.6 }, // Cross River - adjusted west
  "NG-DE": { x: 267.5, y: 493.1 }, // Delta - minor adjustment
  "NG-EB": { x: 325.7, y: 476.9 }, // Ebonyi - moved south slightly
  "NG-ED": { x: 272.8, y: 463.8 }, // Edo - moved south
  "NG-EK": { x: 257.9, y: 437.1 }, // Ekiti - moved west slightly
  "NG-EN": { x: 308.5, y: 485.1 }, // Enugu - minor adjustment
  "NG-FC": { x: 358.8, y: 363.3 }, // Federal Capital Territory - adjusted to center
  "NG-GO": { x: 440.6, y: 290.8 }, // Gombe - moved northwest
  "NG-IM": { x: 305.2, y: 513.6 }, // Imo - moved east slightly
  "NG-JI": { x: 398.6, y: 223.9 }, // Jigawa - moved southwest
  "NG-KD": { x: 355.5, y: 301.8 }, // Kaduna - adjusted to true center
  "NG-KE": { x: 314.5, y: 243.6 }, // Kebbi - adjusted east
  "NG-KN": { x: 380.2, y: 254.4 }, // Kano - moved southwest
  "NG-KO": { x: 335.6, y: 379.9 }, // Kogi - adjusted northwest
  "NG-KT": { x: 356.3, y: 227.2 }, // Katsina - moved southwest
  "NG-KW": { x: 279.8, y: 401.7 }, // Kwara - adjusted to true center
  "NG-LA": { x: 238.3, y: 471.5 }, // Lagos - moved southwest
  "NG-NA": { x: 374.5, y: 349.4 }, // Nasarawa - adjusted for visual center
  "NG-NI": { x: 335.8, y: 340.5 }, // Niger - moved south
  "NG-OG": { x: 244.5, y: 458.1 }, // Ogun - moved southwest
  "NG-ON": { x: 264.3, y: 462.9 }, // Ondo - moved southeast
  "NG-OS": { x: 253.2, y: 434.9 }, // Osun - moved southwest
  "NG-OY": { x: 242.0, y: 419.3 }, // Oyo - moved southwest
  "NG-PL": { x: 404.8, y: 348.2 }, // Plateau - moved southwest
  "NG-RI": { x: 277.5, y: 526.3 }, // Rivers - moved southeast
  "NG-SO": { x: 312.4, y: 207.3 }, // Sokoto - moved southwest
  "NG-TA": { x: 412.9, y: 377.8 }, // Taraba - moved southwest
  "NG-YO": { x: 387.8, y: 190.3 }, // Yobe - moved northwest
  "NG-ZA": { x: 345.2, y: 233.5 }, // Zamfara - moved southwest
  
  // Kenya counties with manually adjusted centroids
  "KE-01": { x: 495.3, y: 783.1 }, // Mombasa
  "KE-21": { x: 373.5, y: 520.7 }, // Murang'a
  "KE-26": { x: 95.5, y: 440.5 },  // Trans Nzoia
  "KE-28": { x: 172.1, y: 483.7 }  // Elgeyo-Marakwet
};

// Calculate the centroid (center point) of an SVG path
export function getPathCentroid(svgPath: string, regionId?: string): { x: number, y: number } | null {
  try {
    // First try to use known centroids for problematic regions
    if (regionId && KNOWN_CENTROIDS[regionId]) {
      console.log(`Using known centroid for ${regionId}:`, KNOWN_CENTROIDS[regionId]);
      return KNOWN_CENTROIDS[regionId];
    }
    
    // Check if path is empty or undefined
    if (!svgPath || svgPath.trim() === '') {
      console.log('SVG path is empty or undefined');
      return null;
    }
    
    // Look for an ID in the region path (might be embedded in data)
    const idMatch = svgPath.match(/id="([^"]+)"/);
    const extractedId = idMatch ? idMatch[1] : null;
    
    // Try to use known centroid based on extracted ID
    if (extractedId && KNOWN_CENTROIDS[extractedId]) {
      console.log(`Using known centroid for extracted ID ${extractedId}:`, KNOWN_CENTROIDS[extractedId]);
      return KNOWN_CENTROIDS[extractedId];
    }
    
    console.log('Processing path:', svgPath.substring(0, 50) + '...');
    
    // Sanitize the path to ensure it's processable
    const sanitizedPath = svgPath
      .replace(/\s+/g, ' ')
      .replace(/\s*,\s*/g, ',')
      .trim();
    
    // Get the bounding box of the path
    let bounds;
    try {
      bounds = getPathBounds(sanitizedPath);
      console.log('Path bounds:', bounds);
    } catch (e) {
      console.warn('Error getting path bounds:', e);
      return null;
    }
    
    // Check if bounds calculation was successful
    const [minX, minY, maxX, maxY] = bounds;
    if (isNaN(minX) || isNaN(minY) || isNaN(maxX) || isNaN(maxY)) {
      console.warn('Invalid path bounds, cannot calculate centroid');
      return null;
    }
    
    // Calculate the center point of the bounding box as an approximation of the centroid
    // Note: This isn't a true geometric centroid, but a reasonable approximation
    // that works well for visualization purposes
    const centroid = {
      x: (minX + maxX) / 2,
      y: (minY + maxY) / 2
    };
    
    console.log('Calculated centroid:', centroid);
    return centroid;
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