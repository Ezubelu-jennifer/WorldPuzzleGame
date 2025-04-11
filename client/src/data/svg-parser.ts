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
  
  return regions;
}

export function extractKenyaRegions(svgData: string) {
  const regions: { id: string; name: string; path: string }[] = [];
  
  // Create standard region IDs for Kenya counties
  // These are county codes we expect to find in the SVG
  const countyIds = Array.from({length: 47}, (_, i) => `KE-${String(i+1).padStart(2, '0')}`);
  
  // Map county codes to names
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
  
  // If we still haven't found any regions, add fallback regions with empty paths
  if (regions.length === 0) {
    console.warn("Could not extract regions from Kenya SVG data. Using fallback.");
    countyIds.forEach(id => {
      regions.push({
        id: id,
        name: countyNames[id] || id.replace('KE-', 'County '),
        path: ""  // Empty path, will be generated on the client
      });
    });
  }
  
  return regions;
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