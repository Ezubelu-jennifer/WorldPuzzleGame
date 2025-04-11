import React, { useState, useEffect, useCallback } from "react";
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
  width = "100%"
}: CountrySvgMapProps) {
  const [regions, setRegions] = useState<RegionData[]>([]);
  const [viewBox, setViewBox] = useState<string>("0 0 800 600");
  
  // Extract regions from SVG data
  useEffect(() => {
    if (!svgData) return;
    
    let extractedRegions: RegionData[] = [];
    
    if (countryId === 1) {
      // Nigeria
      extractedRegions = extractNigeriaRegions(svgData);
    } else if (countryId === 2) {
      // Kenya
      extractedRegions = extractKenyaRegions(svgData);
    }
    
    setRegions(extractedRegions);
    
    // Set viewBox
    const extractedViewBox = getViewBoxFromSVG(svgData);
    setViewBox(extractedViewBox);
  }, [svgData, countryId]);
  
  // Handle region click
  const handleRegionClick = useCallback((id: string, name: string) => {
    if (onRegionClick) {
      onRegionClick(id, name);
    }
  }, [onRegionClick]);
  
  // Generate a color for regions based on index
  const getRegionColor = (index: number, isHighlighted: boolean) => {
    if (isHighlighted) return "#f87171"; // red-400
    
    const colors = [
      "#94a3b8", // slate-400
      "#a1a1aa", // zinc-400
      "#a3a3a3", // neutral-400
      "#9ca3af", // gray-400
      "#94a3b8", // slate-400
      "#a1a1aa", // zinc-400
    ];
    
    return colors[index % colors.length];
  };
  
  return (
    <div className={`country-svg-map ${className}`} style={{ width, height }}>
      <svg
        viewBox={viewBox}
        width="100%"
        height="100%"
        className="w-full h-full"
      >
        {/* Fill the map with regions */}
        {regions.map((region, index) => {
          const isHighlighted = region.id === highlightRegion;
          const fill = getRegionColor(index, isHighlighted);
          const stroke = isHighlighted ? "#b91c1c" : "#64748b"; // red-700 or slate-500
          const strokeWidth = isHighlighted ? "1.5" : "1";
          
          return (
            <path
              key={region.id}
              id={region.id}
              d={region.path}
              fill={fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
              data-name={region.name} // Using data attribute instead of title
              aria-label={region.name}
              className="transition-colors duration-200 hover:opacity-90"
              style={{ cursor: "pointer" }}
              onClick={() => handleRegionClick(region.id, region.name)}
            />
          );
        })}
        
        {showLabels && regions.map(region => {
          // For simplicity, we'll use fixed label positions
          // In a production app, you'd calculate center points dynamically
          return (
            <text
              key={`label-${region.id}`}
              x="50%"
              y="50%"
              textAnchor="middle"
              fontSize="8"
              fill="#000"
              className="pointer-events-none"
            >
              {region.name}
            </text>
          );
        })}
      </svg>
    </div>
  );
}