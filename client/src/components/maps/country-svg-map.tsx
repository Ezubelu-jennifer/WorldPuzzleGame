import React, { useState, useEffect, useRef } from "react";
import { extractNigeriaRegions, extractKenyaRegions, getViewBoxFromSVG } from "@/data/svg-parser";

interface CountrySvgMapProps {
  countryId: number;
  countryName: string;
  svgData: string;
  className?: string;
  highlightRegion?: string | null;
  onRegionClick?: (regionId: string, regionName: string) => void;
  showLabels?: boolean;
  height?: number | string;
  width?: number | string;
  renderOverlay?: () => React.ReactNode; // Function to render additional overlay elements
}

interface RegionData {
  id: string;
  name: string;
  path: string;
}

export function CountrySvgMap({
  countryId,
  countryName,
  svgData,
  className = "",
  highlightRegion = null,
  onRegionClick,
  showLabels = false,
  height = "100%",
  width = "100%",
  renderOverlay
}: CountrySvgMapProps) {
  const [regions, setRegions] = useState<RegionData[]>([]);
  const [viewBox, setViewBox] = useState<string>("0 0 800 600");
  
  const svgRef = useRef<SVGSVGElement>(null);
  
  // Extract regions from SVG data
  useEffect(() => {
    if (!svgData) return;
    
    let extractedRegions: RegionData[] = [];
    
    if (countryId === 1) {
      // Nigeria
      extractedRegions = extractNigeriaRegions(svgData);
      console.log(`Found ${extractedRegions.length} Nigeria regions from SVG data`);
    } else if (countryId === 2) {
      // Kenya
      extractedRegions = extractKenyaRegions(svgData);
      console.log(`Found ${extractedRegions.length} Kenya regions from SVG data`);
    }
    
    setRegions(extractedRegions);
    
    // Set viewBox
    const extractedViewBox = getViewBoxFromSVG(svgData);
    setViewBox(extractedViewBox);
  }, [svgData, countryId]);
  
  // Create unique regions list
  const uniqueRegions = regions.filter((region, index, self) => 
    index === self.findIndex((r) => r.id === region.id)
  );
  
  return (
    <div 
      className={`country-svg-map relative ${className}`} 
      style={{ width, height }}
    >
      <svg
        ref={svgRef}
        viewBox={viewBox}
        width="100%"
        height="100%"
        className="w-full h-full"
      >
        {/* Country outer silhouette - draw once as a background to add shadow effect */}
        <g filter="drop-shadow(0px 2px 4px rgba(0,0,0,0.3))">
          {uniqueRegions.map((region) => (
            <path
              key={`silhouette-${region.id}`}
              d={region.path}
              fill="#e5e5e5" // Light gray fill for the puzzle outline
              stroke="#999999" // Darker gray for more prominent border
              strokeWidth="2.5" // Much thicker border
              style={{ pointerEvents: "none" }}
            />
          ))}
        </g>
          
        {/* Render the overlay elements (like guidance dots) */}
        {renderOverlay && renderOverlay()}
      </svg>
    </div>
  );
}