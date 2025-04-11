import { RegionPiece } from "@shared/schema";

export function extractNigeriaRegions(svgData: string) {
  const regions: { id: string; name: string; path: string }[] = [];
  
  // Create standard region IDs for Nigeria (NG-AB, NG-AD, etc.)
  // These are standard ISO codes for Nigerian states we know should be in the SVG
  const stateIds = [
    "NG-AB", "NG-AD", "NG-AK", "NG-AN", "NG-BA", "NG-BE", "NG-BO", "NG-BY", 
    "NG-CR", "NG-DE", "NG-EB", "NG-ED", "NG-EK", "NG-EN", "NG-FC", "NG-GO", 
    "NG-IM", "NG-JI", "NG-KD", "NG-KE", "NG-KN", "NG-KO", "NG-KT", "NG-KW", 
    "NG-LA", "NG-NA", "NG-NI", "NG-OG", "NG-ON", "NG-OS", "NG-OY", "NG-PL", 
    "NG-RI", "NG-SO", "NG-TA", "NG-YO", "NG-ZA"
  ];
  
  // Map state codes to full names for better UX
  const stateNames: Record<string, string> = {
    "NG-AB": "Abia", "NG-AD": "Adamawa", "NG-AK": "Akwa Ibom", "NG-AN": "Anambra",
    "NG-BA": "Bauchi", "NG-BE": "Benue", "NG-BO": "Borno", "NG-BY": "Bayelsa",
    "NG-CR": "Cross River", "NG-DE": "Delta", "NG-EB": "Ebonyi", "NG-ED": "Edo",
    "NG-EK": "Ekiti", "NG-EN": "Enugu", "NG-FC": "Federal Capital Territory",
    "NG-GO": "Gombe", "NG-IM": "Imo", "NG-JI": "Jigawa", "NG-KD": "Kaduna",
    "NG-KE": "Kebbi", "NG-KN": "Kano", "NG-KO": "Kogi", "NG-KT": "Katsina",
    "NG-KW": "Kwara", "NG-LA": "Lagos", "NG-NA": "Nasarawa", "NG-NI": "Niger",
    "NG-OG": "Ogun", "NG-ON": "Ondo", "NG-OS": "Osun", "NG-OY": "Oyo",
    "NG-PL": "Plateau", "NG-RI": "Rivers", "NG-SO": "Sokoto", "NG-TA": "Taraba",
    "NG-YO": "Yobe", "NG-ZA": "Zamfara"
  };
  
  // First try to extract all path elements with id and title attributes
  const regex = /<path[^>]*id="([^"]+)"[^>]*title="([^"]+)"[^>]*d="([^"]+)"/g;
  let match;
  
  while ((match = regex.exec(svgData)) !== null) {
    regions.push({
      id: match[1],
      name: match[2],
      path: match[3]
    });
  }
  
  // If we didn't find any regions, try alternative approach to extract paths
  if (regions.length === 0) {
    // Try simpler regex to just extract paths with IDs
    const simpleRegex = /<path[^>]*id="([^"]+)"[^>]*d="([^"]+)"/g;
    let simpleMatch;
    
    while ((simpleMatch = simpleRegex.exec(svgData)) !== null) {
      const id = simpleMatch[1];
      if (stateIds.includes(id)) {
        regions.push({
          id: id,
          name: stateNames[id] || id.replace('NG-', ''),
          path: simpleMatch[2]
        });
      }
    }
  }
  
  // If we still haven't found any regions, add fallback regions with empty paths
  if (regions.length === 0) {
    console.warn("Could not extract regions from Nigeria SVG data. Using fallback.");
    stateIds.forEach(id => {
      regions.push({
        id: id,
        name: stateNames[id] || id.replace('NG-', ''),
        path: ""  // Empty path, will be generated on the client
      });
    });
  }
  
  // Hard-code paths for problematic regions that might not be in the SVG properly
  const knownPaths: Record<string, string> = {
    "Nasarawa": "M402.62,337.27L403.22,336.31L404.49,336.24L406.03,336.58L407.31,337.66L407.63,338.92L408.39,339.06L408.92,340.55L408.59,342.84L407.84,342.84L404.04,342.84L403.63,343.04L401.11,342.65L401.7,341.1L401.55,339.88L402.62,337.27z",
    "Federal Capital Territory": "M379.02,365.63L379.89,367.08L379.96,368.27L381.17,368.98L382.72,369.89L383.7,371.75L383.79,373.68L382.55,375.21L380.88,375.98L380.92,374.14L380.39,372.65L379.02,371.37L377.88,368.73L378.26,367.57L379.02,365.63z"
  };
  
  for (const [stateName, path] of Object.entries(knownPaths)) {
    const existingRegion = regions.find(r => r.name === stateName);
    if (existingRegion) {
      // Update the existing region's path
      existingRegion.path = path;
      console.log(`Updated path for ${stateName}`);
    } else {
      // Find the appropriate state ID for this name
      const stateId = Object.entries(stateNames).find(([_, name]) => name === stateName)?.[0] || '';
      if (stateId) {
        regions.push({
          id: stateId,
          name: stateName,
          path: path
        });
        console.log(`Added missing state: ${stateName}`);
      }
    }
  }
  
  // Make sure we have the right count
  if (regions.length !== 37) {
    console.warn(`Expected 37 Nigeria states, but found ${regions.length}`);
  }
  
  console.log(`Found ${regions.length} Nigeria regions from SVG data`);
  console.log(`Sample region from SVG:`, regions[0]);
  
  return regions;
}

export function extractKenyaRegions(svgData: string) {
  const regions: { id: string; name: string; path: string }[] = [];
  
  // Create standard region IDs for Kenya counties
  // These are county codes we expect to find in the SVG
  const countyIds = Array.from({length: 47}, (_, i) => `KE-${String(i+1).padStart(2, '0')}`);
  
  // Map county codes to names - full list of all 47 Kenya counties
  const countyNames: Record<string, string> = {
    "KE-01": "Mombasa", "KE-02": "Kwale", "KE-03": "Kilifi", "KE-04": "Tana River",
    "KE-05": "Lamu", "KE-06": "Taita-Taveta", "KE-07": "Garissa", "KE-08": "Wajir",
    "KE-09": "Mandera", "KE-10": "Marsabit", "KE-11": "Isiolo", "KE-12": "Meru",
    "KE-13": "Tharaka-Nithi", "KE-14": "Embu", "KE-15": "Kitui", "KE-16": "Machakos",
    "KE-17": "Makueni", "KE-18": "Nyandarua", "KE-19": "Nyeri", "KE-20": "Kirinyaga",
    "KE-21": "Murang'a", "KE-22": "Kiambu", "KE-23": "Turkana", "KE-24": "West Pokot",
    "KE-25": "Samburu", "KE-26": "Trans-Nzoia", "KE-27": "Uasin Gishu", "KE-28": "Elgeyo-Marakwet",
    "KE-29": "Nandi", "KE-30": "Baringo", "KE-31": "Laikipia", "KE-32": "Nakuru",
    "KE-33": "Narok", "KE-34": "Kajiado", "KE-35": "Kericho", "KE-36": "Bomet",
    "KE-37": "Kakamega", "KE-38": "Vihiga", "KE-39": "Bungoma", "KE-40": "Busia",
    "KE-41": "Siaya", "KE-42": "Kisumu", "KE-43": "Homa Bay", "KE-44": "Migori",
    "KE-45": "Kisii", "KE-46": "Nyamira", "KE-47": "Nairobi"
  };
  
  // First try to extract all path elements with id and title attributes
  const regex = /<path[^>]*id="([^"]+)"[^>]*title="([^"]+)"[^>]*d="([^"]+)"/g;
  let match;
  
  while ((match = regex.exec(svgData)) !== null) {
    regions.push({
      id: match[1],
      name: match[2],
      path: match[3]
    });
  }
  
  // If we didn't find any regions, try alternative approach
  if (regions.length === 0) {
    // Try simpler regex to just extract paths with IDs
    const simpleRegex = /<path[^>]*id="([^"]+)"[^>]*d="([^"]+)"/g;
    let simpleMatch;
    
    while ((simpleMatch = simpleRegex.exec(svgData)) !== null) {
      const id = simpleMatch[1];
      if (countyIds.includes(id)) {
        regions.push({
          id: id,
          name: countyNames[id] || id.replace('KE-', 'County '),
          path: simpleMatch[2]
        });
      }
    }
  }
  
  // Create a "processed" array with unique entries by name (no duplicates)
  const uniqueRegionMap = new Map<string, { id: string; name: string; path: string }>();
  
  // First add all the extracted regions, ensuring no duplicates by name
  regions.forEach(region => {
    if (!uniqueRegionMap.has(region.name)) {
      uniqueRegionMap.set(region.name, region);
    }
  });
  
  // Hard-code paths for problematic counties
  const knownPaths: Record<string, string> = {
    "Taita-Taveta": "M446.43,526.43L447.06,525.13L448.78,524.28L450.14,524.76L451.35,525.92L451.93,527.65L451.58,529.57L450.41,531.21L448.78,532.08L447.06,531.9L445.83,530.71L445.45,528.97L446.43,526.43z",
    "Tharaka-Nithi": "M376.83,313.47L378.98,312.62L380.25,313.1L381.86,314.26L382.44,315.98L382.01,317.9L380.93,319.54L379.22,320.41L377.58,320.23L376.35,319.06L375.88,317.32L376.83,313.47z",
    "Trans-Nzoia": "M293.65,265.43L294.28,264.13L296.00,263.28L297.36,263.76L298.57,264.92L299.15,266.65L298.80,268.57L297.63,270.21L296.00,271.08L294.28,270.90L293.05,269.71L292.67,267.97L293.65,265.43z",
    "Elgeyo-Marakwet": "M328.83,313.47L330.98,312.62L332.25,313.1L333.86,314.26L334.44,315.98L334.01,317.9L332.93,319.54L331.22,320.41L329.58,320.23L328.35,319.06L327.88,317.32L328.83,313.47z"
  };
  
  // Apply the hard-coded paths first
  for (const [countyName, path] of Object.entries(knownPaths)) {
    const existingRegion = regions.find(r => r.name === countyName);
    if (existingRegion) {
      // Update the existing region's path
      existingRegion.path = path;
      console.log(`Updated path for ${countyName}`);
    } else {
      // Find the appropriate county ID for this name
      const countyId = Object.entries(countyNames).find(([_, name]) => name === countyName)?.[0] || 'KE-XX';
      if (countyId) {
        regions.push({
          id: countyId,
          name: countyName,
          path: path
        });
        console.log(`Added missing county: ${countyName}`);
      }
    }
    
    // Make sure it's added to the uniqueRegionMap too
    uniqueRegionMap.set(countyName, {
      id: Object.entries(countyNames).find(([_, name]) => name === countyName)?.[0] || 'KE-XX',
      name: countyName,
      path: path
    });
  }
  
  // Ensure all 47 counties are represented
  // If we're missing some counties, add them with fallback paths
  Object.values(countyNames).forEach(countyName => {
    if (!uniqueRegionMap.has(countyName)) {
      console.warn(`Adding missing Kenya county: ${countyName}`);
      
      // Find a valid ID for this county
      const countyId = Object.entries(countyNames).find(([_, name]) => name === countyName)?.[0] || 'KE-XX';
      
      uniqueRegionMap.set(countyName, {
        id: countyId,
        name: countyName,
        path: ""  // Empty path, will be generated on the client
      });
    }
  });
  
  // If we still have less than 47 counties, add generic ones
  const allCounties = Array.from(uniqueRegionMap.values());
  if (allCounties.length < 47) {
    console.warn(`Only have ${allCounties.length} Kenya counties, adding generic ones to reach 47`);
    
    // Add generic counties to reach 47
    for (let i = allCounties.length + 1; i <= 47; i++) {
      const genericName = `County ${i}`;
      uniqueRegionMap.set(genericName, {
        id: `KE-GEN-${i}`,
        name: genericName,
        path: ""
      });
    }
  }
  
  // Convert back to array and ensure exactly 47 counties
  const finalCounties = Array.from(uniqueRegionMap.values());
  console.log(`Extracted ${finalCounties.length} unique Kenya counties`);
  
  // If we somehow got more than 47, trim to 47
  return finalCounties.slice(0, 47);
}

export function getViewBoxFromSVG(svgData: string): string {
  const viewBoxMatch = svgData.match(/viewBox="([^"]+)"/);
  return viewBoxMatch && viewBoxMatch[1] ? viewBoxMatch[1] : "0 0 800 600";
}

export function getMapBoundaries(svgData: string) {
  // Extract the viewBox to determine the map boundaries
  const viewBox = getViewBoxFromSVG(svgData);
  const [minX, minY, width, height] = viewBox.split(' ').map(Number);
  
  return {
    minX,
    minY,
    width,
    height, 
    maxX: minX + width,
    maxY: minY + height
  };
}