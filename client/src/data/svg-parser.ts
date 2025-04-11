import { RegionPiece } from "@shared/schema";

export function extractNigeriaRegions(svgData: string) {
  const regions: { id: string; name: string; path: string }[] = [];
  
  // Extract all path elements with id and title attributes
  const regex = /<path[^>]*id="([^"]+)"[^>]*title="([^"]+)"[^>]*d="([^"]+)"/g;
  let match;
  
  while ((match = regex.exec(svgData)) !== null) {
    regions.push({
      id: match[1],
      name: match[2],
      path: match[3]
    });
  }
  
  return regions;
}

export function extractKenyaRegions(svgData: string) {
  const regions: { id: string; name: string; path: string }[] = [];
  
  // Extract all path elements with id and title attributes
  const regex = /<path[^>]*id="([^"]+)"[^>]*title="([^"]+)"[^>]*d="([^"]+)"/g;
  let match;
  
  while ((match = regex.exec(svgData)) !== null) {
    regions.push({
      id: match[1],
      name: match[2],
      path: match[3]
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