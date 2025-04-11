import React, { useState, useEffect } from "react";
import { RegionPiece } from "@shared/schema";

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
  height = 600,
  width = "100%"
}: CountrySvgMapProps) {
  const [regions, setRegions] = useState<RegionData[]>([]);
  const [viewBox, setViewBox] = useState<string>("0 0 800 600");
  const [loading, setLoading] = useState<boolean>(true);
  
  useEffect(() => {
    // Parse SVG data to extract region paths
    const parseRegions = async () => {
      setLoading(true);
      
      try {
        // Extract regions using regex
        const extractedRegions: RegionData[] = [];
        const pathRegex = /<path\s+id="([^"]+)"\s+title="([^"]+)"\s+d="([^"]+)"/g;
        let match;
        
        while ((match = pathRegex.exec(svgData)) !== null) {
          const id = match[1];
          const name = match[2];
          const path = match[3];
          
          extractedRegions.push({
            id,
            name,
            path
          });
        }
        
        setRegions(extractedRegions);
        
        // Extract viewBox
        const viewBoxRegex = /viewBox="([^"]+)"/;
        const viewBoxMatch = viewBoxRegex.exec(svgData);
        
        if (viewBoxMatch && viewBoxMatch[1]) {
          setViewBox(viewBoxMatch[1]);
        }
      } catch (error) {
        console.error("Error parsing SVG data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    if (svgData) {
      parseRegions();
    }
  }, [svgData]);
  
  // Generate colors for regions
  const getRegionColor = (index: number, isHighlighted: boolean) => {
    const colors = [
      { fill: "#f87171", stroke: "#b91c1c" }, // red-400, red-700
      { fill: "#fb923c", stroke: "#c2410c" }, // orange-400, orange-700
      { fill: "#fbbf24", stroke: "#b45309" }, // amber-400, amber-700
      { fill: "#4ade80", stroke: "#15803d" }, // green-400, green-700
      { fill: "#2dd4bf", stroke: "#0f766e" }, // teal-400, teal-700
      { fill: "#60a5fa", stroke: "#1d4ed8" }, // blue-400, blue-700
      { fill: "#a78bfa", stroke: "#6d28d9" }, // violet-400, violet-700
      { fill: "#f472b6", stroke: "#be185d" }, // pink-400, pink-700
    ];
    
    const baseColor = colors[index % colors.length];
    
    return {
      fill: isHighlighted ? baseColor.fill : `${baseColor.fill}99`, // Add transparency if not highlighted
      stroke: baseColor.stroke,
      strokeWidth: isHighlighted ? 2 : 1
    };
  };
  
  if (loading) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height, width }}>
        <div className="spinner w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  return (
    <div className={`relative ${className}`}>
      <svg 
        viewBox={viewBox}
        xmlns="http://www.w3.org/2000/svg"
        style={{ 
          height: typeof height === 'number' ? `${height}px` : height,
          width: typeof width === 'number' ? `${width}px` : width
        }}
        className="max-w-full"
      >
        <title>{countryName} Map</title>
        {regions.map((region, index) => {
          const isHighlighted = highlightRegion === region.id;
          const { fill, stroke, strokeWidth } = getRegionColor(index, isHighlighted);
          
          return (
            <path
              key={region.id}
              id={region.id}
              d={region.path}
              fill={fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
              className="transition-colors duration-200 hover:opacity-80"
              onClick={() => onRegionClick && onRegionClick(region.id, region.name)}
              style={{ cursor: onRegionClick ? 'pointer' : 'default' }}
            >
              <title>{region.name}</title>
            </path>
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