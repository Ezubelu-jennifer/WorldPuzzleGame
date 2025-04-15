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
}: CountrySvgMapProps): JSX.Element {
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
  
  // Extract regions from SVG data and set up region mappings
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
        
        const regionsData = await response.json();
        const mappings: Record<string, number> = {};
        
        // Create a mapping from region name to database ID
        const nameToRegion = new Map<string, any>();
        
        // First, build a lookup table of names to DB regions
        regionsData.forEach((region: any) => {
          const cleanName = region.name.trim().toLowerCase();
          nameToRegion.set(cleanName, region);
          
          // Add common variations/abbreviations
          if (cleanName === "federal capital territory") {
            nameToRegion.set("fct", region);
          }
        });
        
        console.log(`Built name lookup with ${nameToRegion.size} entries`);
        
        // Then map SVG regions to DB regions
        if (countryId === 1) { // Nigeria
          extractedRegions.forEach(svgRegion => {
            const svgRegionName = svgRegion.name.trim().toLowerCase();
            const svgRegionCode = svgRegion.id.replace('NG-', '');
            let mapped = false;
            
            // Try direct name match
            if (nameToRegion.has(svgRegionName)) {
              const region = nameToRegion.get(svgRegionName);
              mappings[svgRegion.id] = region.id;
              console.log(`Direct match: ${svgRegion.name} -> ID ${region.id}`);
              mapped = true;
            }
            
            // Try prefix match (e.g., "Akwa Ibom" matches "Akwa")
            if (!mapped) {
              nameToRegion.forEach((dbRegion, dbName) => {
                if (svgRegionName.startsWith(dbName) || dbName.startsWith(svgRegionName)) {
                  mappings[svgRegion.id] = dbRegion.id;
                  console.log(`Prefix match: ${svgRegion.name} -> ${dbRegion.name} (ID ${dbRegion.id})`);
                  mapped = true;
                }
              });
            }
            
            // Special cases for problematic states
            if (!mapped) {
              if (svgRegionName === "ebonyi") {
                // Find Ebonyi in the regions or use a fallback ID
                const ebonyiRegion = regionsData.find((r: any) => 
                  r.name.toLowerCase() === "ebonyi" || r.id === 11);
                
                if (ebonyiRegion) {
                  mappings[svgRegion.id] = ebonyiRegion.id;
                  console.log(`Special case: Ebonyi -> ID ${ebonyiRegion.id}`);
                } else {
                  mappings[svgRegion.id] = 11; // Fallback ID for Ebonyi
                  console.log(`Special fallback: Ebonyi -> ID 11`);
                }
                mapped = true;
              }
              else if (svgRegion.name === "Federal Capital Territory" || svgRegionName === "fct") {
                const fctRegion = regionsData.find((r: any) => 
                  r.name.toLowerCase().includes("capital") || r.name.toLowerCase() === "fct" || r.id === 12);
                
                if (fctRegion) {
                  mappings[svgRegion.id] = fctRegion.id;
                  console.log(`Special case: FCT -> ID ${fctRegion.id}`);
                } else {
                  mappings[svgRegion.id] = 12; // Fallback ID for FCT
                  console.log(`Special fallback: FCT -> ID 12`);
                }
                mapped = true;
              }
            }
            
            // For any remaining unmapped regions, add them with a high ID number
            if (!mapped) {
              // Find the highest existing ID and add from there
              const maxId = Math.max(...regionsData.map((r: any) => r.id));
              
              // Use an offset to ensure we don't conflict with existing IDs
              const uniqueId = maxId + 100 + (svgRegionCode.charCodeAt(0) + svgRegionCode.charCodeAt(1));
              
              mappings[svgRegion.id] = uniqueId;
              console.log(`Generated unique ID: ${svgRegion.name} -> ID ${uniqueId}`);
            }
          });
        } else if (countryId === 2) { // Kenya
          // Similar logic for Kenya
          extractedRegions.forEach(svgRegion => {
            const svgRegionName = svgRegion.name.trim().toLowerCase();
            let mapped = false;
            
            // Try direct name match
            if (nameToRegion.has(svgRegionName)) {
              const region = nameToRegion.get(svgRegionName);
              mappings[svgRegion.id] = region.id;
              mapped = true;
            }
            
            // Try prefix match
            if (!mapped) {
              nameToRegion.forEach((dbRegion, dbName) => {
                if (svgRegionName.startsWith(dbName) || dbName.startsWith(svgRegionName)) {
                  mappings[svgRegion.id] = dbRegion.id;
                  mapped = true;
                }
              });
            }
            
            // For any remaining unmapped regions, add them with a high ID number
            if (!mapped) {
              const maxId = Math.max(...regionsData.map((r: any) => r.id));
              const uniqueId = maxId + 100 + svgRegion.name.length;
              mappings[svgRegion.id] = uniqueId;
            }
          });
        }
        
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