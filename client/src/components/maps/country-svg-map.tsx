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
  const [scale, setScale] = useState<number>(1);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  
  const svgRef = useRef<SVGSVGElement>(null);
  
  // Add pulse animation effect when component mounts
  useEffect(() => {
    // Add a slight zoom effect
    const animateMap = () => {
      setIsAnimating(true);
      setScale(1.05); // Zoom in slightly
      
      setTimeout(() => {
        setScale(1); // Return to normal size
        setTimeout(() => {
          setIsAnimating(false);
        }, 300);
      }, 300);
    };
    
    // Run animation on initial load
    animateMap();
    
    // Setup interval for periodic animation
    const intervalId = setInterval(animateMap, 10000); // Animate every 10 seconds
    
    return () => clearInterval(intervalId);
  }, []);
  
  // Function to handle click on the map - triggers zoom effect
  const handleMapClick = () => {
    if (!isAnimating) {
      setIsAnimating(true);
      setScale(1.1); // Zoom in more than the automatic animation
      
      setTimeout(() => {
        setScale(1); // Return to normal size
        setTimeout(() => {
          setIsAnimating(false);
        }, 300);
      }, 300);
    }
  };
  
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
      onClick={handleMapClick}
    >
      <svg
        ref={svgRef}
        viewBox={viewBox}
        width="100%"
        height="100%"
        className="w-full h-full cursor-pointer"
        style={{ 
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          transition: isAnimating ? 'transform 0.4s ease-in-out' : 'none'
        }}
      >
        {/* Use a clip path to create a boundary-only effect */}
        <defs>
          <clipPath id="country-outline">
            {uniqueRegions.map((region) => (
              <path
                key={`clip-${region.id}`}
                d={region.path}
              />
            ))}
          </clipPath>
        </defs>
        
        {/* Background filled rectangle with shadow */}
        <g filter="drop-shadow(0px 2px 4px rgba(0,0,0,0.3))">
          {/* Fill the entire viewBox with the outline color */}
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="#e5e5e5" // Light gray fill for the puzzle outline
            clipPath="url(#country-outline)"
            style={{ pointerEvents: "none" }}
          />
          
          {/* Draw only the outer boundary line */}
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="none"
            stroke="#999999" // Darker gray for prominent border
            strokeWidth="12" // Significantly thicker border for the outline
            clipPath="url(#country-outline)"
            style={{ pointerEvents: "none" }}
          />
        </g>
          
        {/* Render the overlay elements (like guidance dots) */}
        {renderOverlay && renderOverlay()}
      </svg>
    </div>
  );
}