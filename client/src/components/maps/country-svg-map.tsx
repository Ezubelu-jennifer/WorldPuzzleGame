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
  const [regionMappings, setRegionMappings] = useState<Record<string, number>>({});
  
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
    
    // Fetch region data from the API to map SVG regions to database regions
    const fetchRegions = async () => {
      try {
        const response = await fetch(`/api/countries/${countryId}/regions`);
        if (!response.ok) {
          throw new Error("Failed to fetch regions");
        }
        
        const regions = await response.json();
        const mappings: Record<string, number> = {};
        
        // Create a mapping from region name to database ID
        regions.forEach((region: any) => {
          // Clean up region names for comparison
          const cleanName = region.name.trim().toLowerCase();
          
          // Extract the region code from SVG IDs (like NG-AB -> AB)
          if (countryId === 1) {
            // For Nigeria, try to match by name or code
            extractedRegions.forEach(svgRegion => {
              const svgRegionName = svgRegion.name.trim().toLowerCase();
              const svgRegionCode = svgRegion.id.replace('NG-', '');
              
              if (svgRegionName === cleanName || 
                  svgRegionName.includes(cleanName) || 
                  cleanName.includes(svgRegionName)) {
                mappings[svgRegion.id] = region.id;
              }
            });
          } else if (countryId === 2) {
            // For Kenya, try to match by name
            extractedRegions.forEach(svgRegion => {
              const svgRegionName = svgRegion.name.trim().toLowerCase();
              
              if (svgRegionName === cleanName || 
                  svgRegionName.includes(cleanName) || 
                  cleanName.includes(svgRegionName)) {
                mappings[svgRegion.id] = region.id;
              }
            });
          }
        });
        
        console.log('Created region mappings:', mappings);
        setRegionMappings(mappings);
      } catch (error) {
        console.error("Error mapping regions:", error);
      }
    };
    
    fetchRegions();
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
        {/* Draw a thick outer border */}
        {uniqueRegions.map((region) => (
          <path
            key={`border-${region.id}`}
            d={region.path}
            fill="none"
            stroke="#666666"
            strokeWidth="12"
            style={{ 
              pointerEvents: "none",
              filter: "drop-shadow(0px 2px 4px rgba(0,0,0,0.3))"
            }}
          />
        ))}
        
        {/* Draw the filled regions */}
        {uniqueRegions.map((region) => (
          <path
            key={`fill-${region.id}`}
            d={region.path}
            fill="#e5e5e5"
            stroke="#e5e5e5"
            strokeWidth="2"
            style={{ pointerEvents: "none" }}
          />
        ))}
        
        {/* Draw region outlines inside the map */}
        {uniqueRegions.map((region) => (
          <path
            key={`outline-${region.id}`}
            d={region.path}
            fill="none"
            stroke="#cccccc"
            strokeWidth="1.5"
            strokeDasharray="2,2"
            data-region-id={region.id}
            data-numeric-id={regionMappings[region.id]}
            data-name={region.name}
            style={{ 
              pointerEvents: "none"
            }}
          />
        ))}
          
        {/* Render the overlay elements (like guidance dots) */}
        {renderOverlay && renderOverlay()}
      </svg>
    </div>
  );
}