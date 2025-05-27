import React, { useState, useEffect, useRef, forwardRef, useMemo, useCallback, useLayoutEffect } from "react";
import { extractWorldRegions, getViewBoxFromSVG, } from "@/data/svg-parser";
import { useGame} from "@/context/game-context";
import { svgPathProperties } from "svg-path-properties";

interface CountrySvgMapProps {
  countryId: number;
  countryName: string;
  svgData: string;
  className?: string;
  highlightRegion?: string | string[] | null;
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
  position?: { x: number; y: number };

}


interface RegionMapping {
  [key: string]: number;
}

const ANIMATION_DURATION = 300;

const CountrySvgMap = forwardRef<SVGSVGElement, CountrySvgMapProps>((props, ref) => {
  const {
    countryId,
    countryName,
    svgData,
    className = "",
    highlightRegion = " ",
    onRegionClick,
    showLabels = false,
    height = "100%",
    width = "100%",
    renderOverlay,
   
  } = props;

  const [regions, setRegions] = useState<RegionData[]>([]);
  const [viewBox, setViewBox] = useState<string>("0 0 400 300");
  const [scale, setScale] = useState<number>(1);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [regionMappings, setRegionMappings] = useState<RegionMapping>({});
  
  
  const svgRef = useRef<SVGSVGElement>(null);
  const { setSvgDimensions,setmapregionPosition,countdown,currentTarget, } = useGame();
// Generate a variety of colors for regions
const getRegionColor = (index: number) => {
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
  
  return colors[index % colors.length];
};

   // Memoized region data processing
   const uniqueRegions = useMemo(() => 
    regions.filter((region, index, self) => 
      index === self.findIndex(r => r.id === region.id)
    ),
    [regions]
  );
  
  useLayoutEffect(() => {
    if (!svgRef.current) return;
  
    const updateDimensions = () => {
      const bbox = svgRef.current?.getBBox?.();
      if (bbox && bbox.width > 0 && bbox.height > 0) {
        setSvgDimensions({
          width: bbox.width,
          height: bbox.height
        });
      }
    };
  
  }, [svgData]);


  // Animation handlers
  const animateMap = useCallback((targetScale: number) => {
    setIsAnimating(true);
    setScale(targetScale);
    setTimeout(() => {
      setScale(1);
      setTimeout(() => setIsAnimating(false), ANIMATION_DURATION);
    }, ANIMATION_DURATION);
  }, []);
  
 // Initial animation setup
 useEffect(() => {
  const initialAnimate = () => animateMap(1.05);
  initialAnimate();
}, [animateMap]);
  
  // Extract regions from SVG data and set up region mappings
  useEffect(() => {
    if (!svgData) return;
    
    const extractRegions = () => {

      let extracted: RegionData[] = [];
      if (countryId === 1) {
        extracted = extractWorldRegions(svgData);
        

      } 

       // Add centroid position to each region
    const regionsWithPositions = extracted.map(region => {
      
      try {
       
      const properties = new svgPathProperties(region.path);
      
      const length = properties.getTotalLength();
      const center = properties.getPointAtLength(length / 2); // Approximate center
      
      return {
        ...region,
        position: { x: center.x, y: center.y }
      };
    } catch (e) {
      console.warn(`Invalid path for region ${region.name}:`, e);
      return { ...region };
    }
  });  
      setRegions(regionsWithPositions);
      setViewBox(getViewBoxFromSVG(svgData));
      setmapregionPosition(regionsWithPositions);
      console.log('regionposition:',regionsWithPositions);
    };

    extractRegions();
  }, [svgData, countryId]);

//this use effect is for medium light flashing
  useEffect(() => {
    if (countdown === 0 && currentTarget?.name) {
     // console.log("Looking for centroid of:", currentTarget?.name);

      const delay = setTimeout(() => {
        const regionElement = svgRef.current?.querySelector(`[data-name="${currentTarget.name}"]`);
  
        if (regionElement) {
          const centroidDot = svgRef.current?.querySelector(
            `circle[data-centroid-for="${currentTarget.name}"]`
            
          );

  
          if (centroidDot) {
            const originalFill = centroidDot.getAttribute("fill") || "red";
            let isGold = false;
            let flashes = 0;
  
            const flashInterval = setInterval(() => {
              centroidDot.setAttribute("fill", isGold ? originalFill : "gold");
              isGold = !isGold;
              flashes++;
  
              if (flashes >= 6) { // 3 full flashes
                clearInterval(flashInterval);
                centroidDot.setAttribute("fill", originalFill);
              }
            }, 250);
  
            return () => clearInterval(flashInterval);
          }
        }
      }, 0);
  
      // Clear delay timeout on unmount
      return () => clearTimeout(delay);
    }
  }, [countdown, currentTarget]);
  
    // Set viewBox
   // const extractedViewBox = getViewBoxFromSVG(svgData);
    //setViewBox(extractedViewBox);
    
    // Fetch region data from the API to map SVG regions to database regions
   // Region mapping logic
  useEffect(() => {
    const fetchRegionMappings = async () => {
      try {
        const response = await fetch(`/api/countries/${countryId}/regions`);
        if (!response.ok) throw new Error("Failed to fetch regions");
        
        const regionsData = await response.json();
        const mappings = createRegionMappings(regionsData);
        setRegionMappings(mappings);
      } catch (error) {
        console.error("Region mapping error:", error);
      }
    }; if (regions.length > 0) {
      fetchRegionMappings();
    }

  }, [countryId, regions]);

  // Region mapping creator
  const createRegionMappings = (regionsData: any[]): RegionMapping => {
    const nameMap = new Map<string, any>(
      regionsData.map(region => [
        region.name.trim().toLowerCase(),
        region
      ])
    );

    return regions.reduce((acc, region) => {
      const regionId = getRegionId(region, nameMap, countryId);
      //console.log('regionId:', regionId);

      if (regionId) acc[region.id] = regionId;
      return acc;
    }, {} as RegionMapping);
  };

          // Region ID resolver
  const getRegionId = (
    region: RegionData,
    nameMap: Map<string, any>,
    countryId: number
  ): number | null => {
    const cleanName = region.name.trim().toLowerCase();
    const dbRegion = nameMap.get(cleanName);
    
    if (dbRegion) return dbRegion.id;


    // Generate fallback ID
    return Math.max(...Array.from(nameMap.values()).map(r => r.id)) + 100;
  };
            
   // Event handlers
   const handleMapClick = useCallback(() => {
    if (!isAnimating) animateMap(1.1);
  }, [animateMap, isAnimating]);

  const handleRegionClick = (id: string, name: string) => {
    console.log("Clicked region:", id, name);
    onRegionClick?.(id, name);
  };
  

  // Render helpers
  const renderPaths = (strokeWidth: number, style: React.CSSProperties) => {
   
       const isHighlighted = (regionName: string) => {
        if (Array.isArray(highlightRegion)) {
          return highlightRegion.includes(regionName);
        }
        return regionName === highlightRegion;
      };
    
      return uniqueRegions.map((region, index) => {
        const highlighted = isHighlighted(region.name);
        //const { fill, stroke } = getRegionColor(index);
        const highlightColors = getRegionColor(index);

      return (
        <path
        
        key={region.id}
        d={region.path}
        strokeWidth={strokeWidth}
        style={{
          ...style,
          ...(highlighted
            ? { fill: highlightColors.fill, stroke: highlightColors.stroke }
            : {}),
        }}
        data-region-id={region.id}
        data-numeric-id={regionMappings[region.id]}
        data-name={region.name}
        onClick={() => handleRegionClick(region.id, region.name)}
        />
      );
    });
  };
  

  
  return (
    <div 
      className={`country-svg-map relative ${className}`} 
      style={{ width,height, overflowY: 'auto', overflowX: 'auto' }}
      onClick={handleMapClick}
    >
      <svg
        ref={svgRef}
        viewBox={viewBox}
         width="100%"
         height="100%"
        className="w-full h-full cursor-pointer"
        
        style={{ 
          width:'79%',
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          transition: isAnimating ? `transform ${ANIMATION_DURATION}ms ease-in-out` : 'none',
          display: 'block',
          overflow: 'visible',

        }}
      >
        {/* Draw a thick outer border */}
         {/* Border layer */}
         {renderPaths(12, { 
          fill: "none",
          stroke: "#666",
          filter: "drop-shadow(0px 2px 4px rgba(0,0,0,0.3))",
          pointerEvents: "none"
        })}

        {/* Fill layer */}
        {renderPaths(2, {
          fill: "#e5e5e5",
          stroke: "#e5e5e5",
          pointerEvents: "none"
        })}
        {/* Outline layer */}
        {renderPaths(1.5, {
          fill: "none",
          stroke: "#ccc",
          strokeDasharray: "2,2",
          pointerEvents: "none"
        })}
        

        {renderOverlay?.()}
      </svg>
    </div>
  );
});

CountrySvgMap.displayName = "CountrySvgMap";
export default CountrySvgMap;