import React, { useState, useEffect, useRef } from "react";
import { optimizeSvgPath } from "@/utils/svg-clipper";
import { getPathBounds } from "svg-path-bounds";
import { Button } from "@/components/ui/button";

interface RegionThumbnailProps {
  svgData: string;
  regionId: string;
  regionName: string;
  width?: string | number;
  height?: string | number;
  color?: string;
  strokeColor?: string;
  strokeWidth?: number;
  showLabel?: boolean;
  onClick?: () => void;
  className?: string;
  draggable?: boolean;
  rotatable?: boolean;
}

export function RegionThumbnail({
  svgData,
  regionId,
  regionName,
  width = 100,
  height = 80,
  color = "#ef4444",
  strokeColor = "#b91c1c",
  strokeWidth = 1,
  showLabel = true,
  onClick,
  className = "",
  draggable = false,
  rotatable = false
}: RegionThumbnailProps) {
  const [pathData, setPathData] = useState<string>("");
  const [viewBox, setViewBox] = useState<string>("0 0 800 600");
  const [rotation, setRotation] = useState<number>(0);
  const [scale, setScale] = useState<number>(1);
  const thumbnailRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!svgData || !regionId) return;
    
    try {
      // Extract viewBox
      const viewBoxMatch = svgData.match(/viewBox="([^"]+)"/);
      if (viewBoxMatch && viewBoxMatch[1]) {
        setViewBox("0 0 100 100"); // Use a normalized viewBox for consistent positioning
      }
      
      // Extract the path for this specific region
      // First, try to find an exact ID match
      const pathRegex = new RegExp(`<path[^>]*id="${regionId}"[^>]*d="([^"]+)"`, 'i');
      let pathMatch = svgData.match(pathRegex);
      
      // If no match and it's a custom ID (KE-CUSTOM-*, KE-MISSING-*, etc), try to extract by region name
      if (!pathMatch && (regionId.includes('CUSTOM') || regionId.includes('MISSING') || regionId.includes('GEN'))) {
        // Look for the path with the regionName in title attribute
        const nameRegex = new RegExp(`<path[^>]*title="${regionName}"[^>]*d="([^"]+)"`, 'i');
        pathMatch = svgData.match(nameRegex);
      }
      
      if (pathMatch && pathMatch[1]) {
        try {
          // Get the original path
          const originalPath = pathMatch[1];
          
          // Get the bounds of the path to normalize it
          const bounds = getPathBounds(originalPath);
          const [minX, minY, maxX, maxY] = bounds;
          
          // Calculate the width and height
          const width = maxX - minX;
          const height = maxY - minY;
          
          // Calculate the center of the path
          const centerX = minX + width / 2;
          const centerY = minY + height / 2;
          
          // Center the path in the middle of the 100x100 viewBox
          const scaleFactor = 55 / Math.max(width, height);
          
          // Create a simplified optimized path centered in the viewBox
          // This is a simplified approach that modifies the path string directly
          const normalizedPath = optimizeSvgPath(originalPath, 1.0); // First get optimized path
          
          // Set as the path data
          setViewBox("0 0 100 100");
          
          // Now we will use SVG transformation to center and scale the path
          // rather than modifying the path data directly
          setPathData(normalizedPath);
        } catch (error) {
          console.warn(`Failed to optimize path for ${regionId}, using original`, error);
          setPathData(pathMatch[1]); 
        }
      } else {
        // For missing or custom paths, create a simple shape as fallback
        if (regionId.includes('CUSTOM') || regionId.includes('MISSING') || regionId.includes('GEN')) {
          console.warn(`Creating fallback shape for ${regionId} (${regionName})`);
          
          // Create a simple rounded rectangle shape as fallback
          const fallbackPath = "M10,10 L90,10 Q100,10 100,20 L100,80 Q100,90 90,90 L10,90 Q0,90 0,80 L0,20 Q0,10 10,10 Z";
          setPathData(fallbackPath);
        } else {
          console.warn(`Path for region ${regionId} not found`);
        }
      }
    } catch (error) {
      console.error("Error extracting region path:", error);
    }
  }, [svgData, regionId]);

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };
  
  const styles = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    cursor: onClick ? 'pointer' : 'default'
  };
  
  return (
    <div 
      className={`region-thumbnail ${className} overflow-visible`}
      style={styles}
      onClick={handleClick}
    >
      {pathData ? (
        <div className="w-full h-full relative">
          <svg viewBox={viewBox} width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
            {/* Background for better boundaries */}
            <rect x="0" y="0" width="100%" height="100%" fill="transparent" />
            
            {/* Create a fixed-size centered container for the state shape */}
            <g transform="translate(50, 50) scale(0.7)" style={{ transformOrigin: "center" }}>
              <path
                d={pathData}
                fill={color}
                stroke={strokeColor}
                strokeWidth={strokeWidth + 3} // Thicker border for very bold appearance
                transform="scale(5.5)" // Increased to exactly 5.5x scale per request
                style={{
                  transformBox: 'fill-box',
                  transformOrigin: 'center',
                  filter: 'drop-shadow(0px 2px 5px rgba(0,0,0,0.5))'
                }}
              />
              {/* Add text label IN the shape */}
              {showLabel && (
                <text 
                  x="50%" 
                  y="50%" 
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#000000" 
                  fontSize="14"
                  fontWeight="bold"
                  style={{ 
                    textShadow: '0 0 3px white, 0 0 3px white, 0 0 3px white, 0 0 3px white',
                    fontFamily: 'Arial, sans-serif'
                  }}
                >
                  {regionName}
                </text>
              )}
            </g>
          </svg>
          
          {/* State name is now rendered directly in the SVG */}
        </div>
      ) : (
        <div className="flex items-center justify-center w-full h-full">
          <div className="text-xs text-gray-400">
            {regionName || "Region"}
          </div>
        </div>
      )}
    </div>
  );
}