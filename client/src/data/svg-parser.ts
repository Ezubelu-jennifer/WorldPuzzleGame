// SVG Parser for extracting region data from SVG maps

// Process Nigeria SVG data
export function extractNigeriaRegions(svgData: string) {
  const regions: {id: string, name: string, path: string}[] = [];

  // Extract region paths using regex
  const pathRegex = /<path\s+id="([^"]+)"\s+title="([^"]+)"\s+d="([^"]+)"/g;
  let match;

  while ((match = pathRegex.exec(svgData)) !== null) {
    const id = match[1];
    const name = match[2];
    const path = match[3];
    
    regions.push({
      id,
      name,
      path
    });
  }

  return regions;
}

// Process Kenya SVG data
export function extractKenyaRegions(svgData: string) {
  const regions: {id: string, name: string, path: string}[] = [];

  // Extract region paths using regex
  const pathRegex = /<path\s+id="([^"]+)"\s+title="([^"]+)"\s+d="([^"]+)"/g;
  let match;

  while ((match = pathRegex.exec(svgData)) !== null) {
    const id = match[1];
    const name = match[2];
    const path = match[3];
    
    regions.push({
      id,
      name,
      path
    });
  }

  return regions;
}

// Get SVG viewBox dimensions from the SVG data
export function getViewBoxFromSVG(svgData: string): string {
  const viewBoxRegex = /viewBox="([^"]+)"/;
  const match = viewBoxRegex.exec(svgData);
  
  if (match && match[1]) {
    return match[1];
  }
  
  // Default viewBox if not found
  return "0 0 800 600";
}

// Extract coordinate boundaries from amcharts:ammap projection tag
export function getMapBoundaries(svgData: string) {
  const boundaryRegex = /leftLongitude="([^"]+)"\s+topLatitude="([^"]+)"\s+rightLongitude="([^"]+)"\s+bottomLatitude="([^"]+)"/;
  const match = boundaryRegex.exec(svgData);
  
  if (match) {
    return {
      leftLongitude: parseFloat(match[1]),
      topLatitude: parseFloat(match[2]),
      rightLongitude: parseFloat(match[3]),
      bottomLatitude: parseFloat(match[4])
    };
  }
  
  return null;
}