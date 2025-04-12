import React, { useState, useEffect } from "react";
import { optimizeSvgPath } from "@/utils/svg-clipper";
import { getPathBounds } from "svg-path-bounds";

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
  className = ""
}: RegionThumbnailProps) {
  const [pathData, setPathData] = useState<string>("");
  const [viewBox, setViewBox] = useState<string>("0 0 800 600");
  
  useEffect(() => {
    if (!svgData || !regionId) return;
    
    try {
      // Extract viewBox
      const viewBoxMatch = svgData.match(/viewBox="([^"]+)"/);
      if (viewBoxMatch && viewBoxMatch[1]) {
        setViewBox("0 0 100 100"); // Use a normalized viewBox for consistent positioning
      }
      
      // Extract the path for this specific region
      const pathRegex = new RegExp(`<path[^>]*id="${regionId}"[^>]*d="([^"]+)"`, 'i');
      const pathMatch = svgData.match(pathRegex);
      
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
        console.warn(`Path for region ${regionId} not found`);
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
      className={`region-thumbnail ${className} overflow-hidden rounded-md bg-gray-100`}
      style={styles}
      onClick={handleClick}
    >
      {pathData ? (
        <div className="w-full h-full relative">
          <svg viewBox={viewBox} width="100%" height="100%">
            {/* Solid background for consistent positioning */}
            <rect
              x="0" 
              y="0" 
              width="100%" 
              height="100%"
              fill="rgba(255,255,255,0.1)"
              rx="5"
            />
            {/* Create a fixed-size centered container for the state shape */}
            <g>
              <path
                d={pathData}
                fill={color}
                stroke={strokeColor}
                strokeWidth={strokeWidth + 2}
                transform="scale(0.9)"
                style={{
                  transformBox: 'fill-box',
                  transformOrigin: 'center',
                  filter: 'drop-shadow(0px 3px 4px rgba(0,0,0,0.5))'
                }}
              />
              {/* Add a centered positioning indicator */}
              <circle
                cx="50%"
                cy="50%"
                r="2"
                fill="transparent"
              />
            </g>
          </svg>
          
          {showLabel && (
            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs px-1 py-0.5 text-center truncate">
              {regionName}
            </div>
          )}
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