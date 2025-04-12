import React, { useState, useEffect } from "react";

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
        setViewBox(viewBoxMatch[1]);
      }
      
      // Extract the path for this specific region
      const pathRegex = new RegExp(`<path[^>]*id="${regionId}"[^>]*d="([^"]+)"`, 'i');
      const pathMatch = svgData.match(pathRegex);
      
      if (pathMatch && pathMatch[1]) {
        setPathData(pathMatch[1]);
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
      className={`region-thumbnail ${className} overflow-visible`}
      style={styles}
      onClick={handleClick}
    >
      {pathData ? (
        <div className="w-full h-full relative">
          <svg viewBox={viewBox} width="100%" height="100%">
            <path
              d={pathData}
              fill="#ef4444" /* Fixed red color like in the screenshot */
              stroke="#b91c1c" /* Darker red for stroke */
              strokeWidth={1}
              style={{
                transform: 'scale(2.8)', /* Make it much larger to match the screenshot */
                transformOrigin: 'center',
                filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,0.2))'
              }}
            />
            {/* Add state name text in the center of the SVG */}
            <text 
              x="50%" 
              y="50%" 
              textAnchor="middle" 
              dominantBaseline="middle"
              fontSize="8" 
              fill="white"
              fontWeight="bold"
              style={{
                textShadow: '0px 1px 1px rgba(0,0,0,0.5)'
              }}
            >
              {regionName}
            </text>
          </svg>
          
          {/* Original label - hidden now */}
          {false && showLabel && (
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