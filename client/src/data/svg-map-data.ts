// This file contains the SVG map data for the countries
// Import the SVG files as raw text using Vite's raw import feature

// Read the SVG data from the attached assets
import NigeriaSvgRaw from '@assets/Pasted--xml-version-1-0-encoding-utf-8-c-ammap-com-SVG-map-of-Nigeria-High-svg-xmlns-1744400600984.txt?raw';
import KenyaSvgRaw from '@assets/Pasted--xml-version-1-0-encoding-utf-8-c-ammap-com-SVG-map-of-Kenya-High-svg-xmlns--1744400701442.txt?raw';

// Export the SVG data so it can be used by components
export const NigeriaSvg = NigeriaSvgRaw;
export const KenyaSvg = KenyaSvgRaw;

// Helper function to get SVG data by country ID
export function getSvgDataById(countryId: number): string {
  switch (countryId) {
    case 1:
      return NigeriaSvg;
    case 2:
      return KenyaSvg;
    default:
      return '';
  }
}