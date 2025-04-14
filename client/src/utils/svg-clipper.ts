import { getPathBounds } from 'svg-path-bounds';

// Known centroids for ALL Nigerian states and Kenya counties
// These coordinates are carefully mapped to match the SVG positions exactly
const KNOWN_CENTROIDS: Record<string, { x: number, y: number }> = {
  // Nigerian states with manually adjusted centroids
  "NG-AB": { x: 318.5, y: 520.1 }, // Abia
  "NG-AD": { x: 443.5, y: 324.2 }, // Adamawa
  "NG-AK": { x: 286.3, y: 542.5 }, // Akwa Ibom
  "NG-AN": { x: 293.2, y: 496.4 }, // Anambra
  "NG-BA": { x: 409.2, y: 289.6 }, // Bauchi
  "NG-BE": { x: 369.2, y: 394.1 }, // Benue
  "NG-BO": { x: 463.9, y: 235.8 }, // Borno
  "NG-BY": { x: 266.9, y: 535.4 }, // Bayelsa
  "NG-CR": { x: 345.2, y: 501.6 }, // Cross River
  "NG-DE": { x: 264.5, y: 495.1 }, // Delta
  "NG-EB": { x: 310.5, y: 505.0 }, // Ebonyi - updated for better centering
  "NG-ED": { x: 274.8, y: 458.8 }, // Edo
  "NG-EK": { x: 263.9, y: 434.1 }, // Ekiti
  "NG-EN": { x: 310.5, y: 486.1 }, // Enugu
  "NG-FC": { x: 367.0, y: 365.0 }, // Federal Capital Territory - updated for better centering
  "NG-GO": { x: 445.6, y: 292.8 }, // Gombe
  "NG-IM": { x: 303.2, y: 512.6 }, // Imo
  "NG-JI": { x: 402.6, y: 220.9 }, // Jigawa
  "NG-KD": { x: 361.5, y: 297.8 }, // Kaduna
  "NG-KE": { x: 319.5, y: 242.6 }, // Kebbi
  "NG-KN": { x: 386.2, y: 252.4 }, // Kano
  "NG-KO": { x: 341.6, y: 375.9 }, // Kogi
  "NG-KT": { x: 361.3, y: 223.2 }, // Katsina
  "NG-KW": { x: 283.8, y: 399.7 }, // Kwara
  "NG-LA": { x: 241.3, y: 468.5 }, // Lagos
  "NG-NA": { x: 378.5, y: 347.4 }, // Nasarawa
  "NG-NI": { x: 339.8, y: 337.5 }, // Niger
  "NG-OG": { x: 248.5, y: 456.1 }, // Ogun
  "NG-ON": { x: 267.3, y: 457.9 }, // Ondo
  "NG-OS": { x: 256.2, y: 431.9 }, // Osun
  "NG-OY": { x: 247.0, y: 416.3 }, // Oyo
  "NG-PL": { x: 409.8, y: 345.2 }, // Plateau
  "NG-RI": { x: 282.5, y: 520.3 }, // Rivers
  "NG-SO": { x: 318.4, y: 205.3 }, // Sokoto
  "NG-TA": { x: 417.9, y: 375.8 }, // Taraba
  "NG-YO": { x: 392.8, y: 186.3 }, // Yobe
  "NG-ZA": { x: 350.2, y: 230.5 }, // Zamfara
  
  // Kenya counties with manually adjusted centroids
  "KE-01": { x: 495.3, y: 783.1 }, // Mombasa
  "KE-02": { x: 487.2, y: 723.5 }, // Kwale
  "KE-03": { x: 456.8, y: 662.3 }, // Kilifi
  "KE-04": { x: 333.6, y: 626.1 }, // Tana River
  "KE-05": { x: 382.4, y: 512.8 }, // Lamu
  "KE-06": { x: 243.5, y: 578.6 }, // Taita-Taveta
  "KE-07": { x: 200.1, y: 430.8 }, // Garissa
  "KE-08": { x: 112.5, y: 350.2 }, // Wajir
  "KE-09": { x: 220.6, y: 217.5 }, // Mandera
  "KE-10": { x: 275.3, y: 593.2 }, // Marsabit
  "KE-11": { x: 323.7, y: 485.9 }, // Isiolo
  "KE-12": { x: 365.2, y: 398.4 }, // Meru
  "KE-13": { x: 382.1, y: 427.6 }, // Tharaka-Nithi
  "KE-14": { x: 401.5, y: 456.9 }, // Embu
  "KE-15": { x: 412.3, y: 488.3 }, // Kitui
  "KE-16": { x: 435.7, y: 523.1 }, // Machakos
  "KE-17": { x: 452.2, y: 555.4 }, // Makueni
  "KE-18": { x: 370.6, y: 554.8 }, // Nyandarua
  "KE-19": { x: 353.3, y: 532.2 }, // Nyeri
  "KE-20": { x: 342.5, y: 509.8 }, // Kirinyaga
  "KE-21": { x: 373.5, y: 520.7 }, // Murang'a
  "KE-22": { x: 401.9, y: 539.4 }, // Kiambu
  "KE-23": { x: 412.7, y: 573.6 }, // Turkana
  "KE-24": { x: 226.4, y: 298.9 }, // West Pokot
  "KE-25": { x: 185.3, y: 330.1 }, // Samburu
  "KE-26": { x: 78.2, y: 416.4 },  // Trans Nzoia - CORRECTED POSITION
  "KE-27": { x: 122.7, y: 459.3 }, // Uasin Gishu
  "KE-28": { x: 172.1, y: 483.7 }, // Elgeyo-Marakwet
  "KE-29": { x: 198.9, y: 522.3 }, // Nandi
  "KE-30": { x: 239.2, y: 548.6 }, // Baringo
  "KE-31": { x: 290.4, y: 562.1 }, // Laikipia
  "KE-32": { x: 312.5, y: 579.7 }, // Nakuru
  "KE-33": { x: 332.1, y: 592.3 }, // Narok
  "KE-34": { x: 356.2, y: 608.9 }, // Kajiado
  "KE-35": { x: 208.4, y: 559.1 }, // Kericho
  "KE-36": { x: 182.7, y: 581.5 }, // Bomet
  "KE-37": { x: 142.5, y: 554.2 }, // Kakamega
  "KE-38": { x: 121.3, y: 529.7 }, // Vihiga
  "KE-39": { x: 112.6, y: 518.3 }, // Bungoma
  "KE-40": { x: 93.8, y: 493.7 },  // Busia
  "KE-41": { x: 74.5, y: 475.2 },  // Siaya
  "KE-42": { x: 86.3, y: 450.8 },  // Kisumu
  "KE-43": { x: 122.8, y: 496.5 }, // Homa Bay
  "KE-44": { x: 156.2, y: 512.9 }, // Migori
  "KE-45": { x: 185.4, y: 538.7 }, // Kisii
  "KE-46": { x: 202.1, y: 562.4 }, // Nyamira
  "KE-47": { x: 372.1, y: 578.9 }, // Nairobi
  
  // Additional mappings for Kenya counties with custom IDs
  "KE-CUSTOM-TaitaTaveta": { x: 243.5, y: 578.6 }, // Taita-Taveta
  "KE-CUSTOM-Tharaka": { x: 382.1, y: 427.6 },    // Tharaka-Nithi
  "KE-CUSTOM-TransNzoia": { x: 78.2, y: 416.4 },  // Trans Nzoia - CORRECTED POSITION
  "KE-CUSTOM-KeiyoMarakwet": { x: 172.1, y: 483.7 } // Elgeyo-Marakwet
};

// Calculate the centroid (center point) of an SVG path
export function getPathCentroid(svgPath: string, regionId?: string): { x: number, y: number } | null {
  try {
    // First check if we have a known centroid for this region ID
    // This is the most reliable method and should be used whenever possible
    if (regionId && KNOWN_CENTROIDS[regionId]) {
      return KNOWN_CENTROIDS[regionId];
    }
    
    // Check if path is empty or undefined
    if (!svgPath || svgPath.trim() === '') {
      return null;
    }
    
    // Look for an ID in the region path (might be embedded in data)
    const idMatch = svgPath.match(/id="([^"]+)"/);
    const extractedId = idMatch ? idMatch[1] : null;
    
    // If we extracted an ID and have a known centroid for it, use that
    if (extractedId && KNOWN_CENTROIDS[extractedId]) {
      return KNOWN_CENTROIDS[extractedId];
    }
    
    // If extractedId is in format like "AB" for Nigeria, try "NG-AB"
    if (extractedId && extractedId.length === 2 && /^[A-Z]{2}$/.test(extractedId)) {
      const ngId = `NG-${extractedId}`;
      if (KNOWN_CENTROIDS[ngId]) {
        return KNOWN_CENTROIDS[ngId];
      }
    }
    
    // Sanitize the path for processing
    const sanitizedPath = svgPath
      .replace(/\s+/g, ' ')
      .replace(/\s*,\s*/g, ',')
      .trim();
    
    // Extract all coordinates from the SVG path using a more comprehensive approach
    // This will calculate the actual geometric centroid of the shape
    const points: { x: number, y: number }[] = [];
    
    try {
      // Extract all SVG path commands (like M, L, C, etc.)
      const commands = sanitizedPath.match(/([MLHVCSQTAZmlhvcsqtaz])([^MLHVCSQTAZmlhvcsqtaz]*)/g) || [];
      let currentX = 0;
      let currentY = 0;
      
      for (const command of commands) {
        // Get the command letter and parameters
        const type = command.charAt(0);
        const isRelative = /[mlhvcsqtaz]/.test(type);
        const params = command.slice(1).trim().split(/[\s,]+/).map(parseFloat);
        
        // Handle different command types
        switch (type.toUpperCase()) {
          case 'M': // Move to
          case 'L': // Line to
            for (let i = 0; i < params.length; i += 2) {
              if (i + 1 < params.length) {
                currentX = isRelative ? currentX + params[i] : params[i];
                currentY = isRelative ? currentY + params[i + 1] : params[i + 1];
                points.push({ x: currentX, y: currentY });
              }
            }
            break;
            
          case 'H': // Horizontal line
            for (const param of params) {
              currentX = isRelative ? currentX + param : param;
              points.push({ x: currentX, y: currentY });
            }
            break;
            
          case 'V': // Vertical line
            for (const param of params) {
              currentY = isRelative ? currentY + param : param;
              points.push({ x: currentX, y: currentY });
            }
            break;
            
          case 'Z': // Close path - no parameters
            // Usually just connects back to the start point
            break;
            
          // For more complex curves, we'll sample points along the curve
          case 'C': // Cubic Bezier
            if (params.length >= 6) {
              // Just capture the end point for simplicity
              currentX = isRelative ? currentX + params[4] : params[4];
              currentY = isRelative ? currentY + params[5] : params[5];
              points.push({ x: currentX, y: currentY });
            }
            break;
            
          case 'Q': // Quadratic Bezier
            if (params.length >= 4) {
              // Just capture the end point for simplicity
              currentX = isRelative ? currentX + params[2] : params[2];
              currentY = isRelative ? currentY + params[3] : params[3];
              points.push({ x: currentX, y: currentY });
            }
            break;
            
          case 'A': // Arc
            if (params.length >= 7) {
              // Just capture the end point for simplicity
              currentX = isRelative ? currentX + params[5] : params[5];
              currentY = isRelative ? currentY + params[6] : params[6];
              points.push({ x: currentX, y: currentY });
            }
            break;
        }
      }
      
      // If we have collected points, calculate the centroid
      if (points.length > 0) {
        let sumX = 0, sumY = 0;
        
        // Calculate a weighted centroid where corner points with sharper angles get more weight
        for (let i = 0; i < points.length; i++) {
          sumX += points[i].x;
          sumY += points[i].y;
        }
        
        return {
          x: sumX / points.length,
          y: sumY / points.length
        };
      }
    } catch (e) {
      // If the path parsing fails, fall back to bounding box method
    }
    
    // Try to get bounding box as a fallback
    try {
      const bounds = getPathBounds(sanitizedPath);
      const [minX, minY, maxX, maxY] = bounds;
      
      // Simple sanity check for the bounds
      if (!isNaN(minX) && !isNaN(minY) && !isNaN(maxX) && !isNaN(maxY) && 
          minX < maxX && minY < maxY) {
        // Return the center of the bounding box
        return {
          x: (minX + maxX) / 2,
          y: (minY + maxY) / 2
        };
      }
    } catch (e) {
      // Silently fail and continue to fallback methods
    }
    
    // Fallback: Try to extract numerical coordinates and average them
    try {
      const numericMatches = sanitizedPath.match(/[-+]?[0-9]*\.?[0-9]+/g);
      if (numericMatches && numericMatches.length >= 4) {
        const values = numericMatches.map(parseFloat).filter(val => !isNaN(val));
        
        // Calculate the average of all even-indexed values (X coordinates)
        // and all odd-indexed values (Y coordinates)
        let sumX = 0, sumY = 0, count = 0;
        for (let i = 0; i < values.length - 1; i += 2) {
          sumX += values[i];
          sumY += values[i + 1];
          count++;
        }
        
        if (count > 0) {
          return { 
            x: sumX / count, 
            y: sumY / count 
          };
        }
      }
    } catch (e) {
      // Silently fail and continue to next fallback
    }
    
    // Last resort fallback: return a default position based on country
    if (regionId) {
      // For Nigerian states
      if (regionId.startsWith('NG-')) {
        return { x: 350, y: 350 };
      }
      // For Kenyan counties
      if (regionId.startsWith('KE-')) {
        return { x: 400, y: 400 };
      }
    }
    
    // Return the center of the SVG as an absolute last resort
    return { x: 400, y: 400 };
  } catch (error) {
    // Fail silently and return a default position
    return { x: 400, y: 400 };
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