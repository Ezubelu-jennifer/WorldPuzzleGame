// This file contains the SVG map data for the countries
// Import the SVG files as raw text using Vite's raw import feature

// Read the SVG data from the attached assets
import WorldSvgRaw from '@assets/world-with-countries.txt?raw';

// Export the SVG data so it can be used by components
export const WorldSvg = WorldSvgRaw;


// Helper function to get SVG data by country ID
export function getSvgDataById(countryId: number): string {
  switch (countryId) {
    case 1:
      return WorldSvg;
   
    default:
      return '';
  }
}