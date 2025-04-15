import React, { useState, useEffect, useRef } from "react";
import { optimizeSvgPath } from "@/utils/svg-clipper";
import { getPathBounds } from "svg-path-bounds";
import { Button } from "@/components/ui/button";
import { useDrag } from "@/hooks/useDrag";
import { useDragContext } from "@/context/drag-context";

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
  onDrop?: (id: number, x: number, y: number) => boolean;
  regionPieceId?: number;
  forceViewBox?: string; // Force a consistent viewBox for scaling
}

export function RegionThumbnail({
  svgData,
  regionId,
  regionName,
  width = 120,
  height = 100,
  color = "#ef4444",
  strokeColor = "#b91c1c",
  strokeWidth = 3.5,
  showLabel = true,
  onClick,
  className = "",
  draggable = false,
  rotatable = false,
  onDrop,
  regionPieceId
}: RegionThumbnailProps) {
  const [pathData, setPathData] = useState<string>("");
  const [viewBox, setViewBox] = useState<string>("0 0 800 600");
  const [rotation, setRotation] = useState<number>(0);
  const [scale, setScale] = useState<number>(1);
  const thumbnailRef = useRef<HTMLDivElement>(null);
  const { setDraggedPieceId } = useDragContext();
  
  // Set up drag functionality if draggable is enabled
  const { isDragging, position, dragHandlers } = useDrag({
    onDragStart: () => {
      // Add any needed drag start behavior
      document.body.style.cursor = "grabbing";
      
      // Set the dragged piece ID in the global context
      if (regionPieceId !== undefined) {
        setDraggedPieceId(regionPieceId);
        console.log("RegionThumbnail: Setting draggedPieceId to", regionPieceId);
      }
    },
    onDragEnd: (position, dropped) => {
      // Reset cursor and handle any post-drag behavior
      document.body.style.cursor = "auto";
      
      // Clear the dragged piece ID from the global context
      setDraggedPieceId(null);
      console.log("RegionThumbnail: Clearing draggedPieceId");
      
      // If there's a custom click handler and we didn't actually drag (just clicked), 
      // trigger the click handler
      if (!isDragging && onClick) {
        onClick();
      }
      
      // If we have the onDrop handler and a piece ID, we can attempt to drop the piece
      if (isDragging && dropped && onDrop && regionPieceId !== undefined) {
        onDrop(regionPieceId, position.x, position.y);
      }
    }
  });
  
  useEffect(() => {
    if (!svgData || !regionId) return;
    
    try {
      // Extract viewBox
      const viewBoxMatch = svgData.match(/viewBox="([^"]+)"/);
      if (viewBoxMatch && viewBoxMatch[1]) {
        setViewBox("0 0 100 100"); // Use a normalized viewBox for consistent positioning
      }
      
      // Extract the path for this specific region
      // First, try to find an exact ID match - testing several possible patterns
      const idPatterns = [
        // Standard format: id="regionId"
        new RegExp(`<path[^>]*id="${regionId}"[^>]*d="([^"]+)"`, 'i'),
        // SVG might use different ID formats
        new RegExp(`<path[^>]*id="${regionId.replace('NG-', '')}"[^>]*d="([^"]+)"`, 'i'),
        new RegExp(`<path[^>]*id="${regionId.replace('KE-', '')}"[^>]*d="([^"]+)"`, 'i'),
        // Try with quotes
        new RegExp(`<path[^>]*id=['"]${regionId}['"][^>]*d=['"]([^'"]+)['"]`, 'i'),
      ];
      
      // Try each pattern until we find a match
      let pathMatch = null;
      for (const pattern of idPatterns) {
        pathMatch = svgData.match(pattern);
        if (pathMatch && pathMatch[1]) break;
      }
      
      // Special case for Ebonyi
      if (!pathMatch && (regionId === "NG-EB" || regionName.includes("Ebonyi"))) {
        console.log("Special handling for Ebonyi state");
        // Try to find Ebonyi by name in any attribute
        const ebonyiPattern = new RegExp(`<path[^>]*(?:id|title|name)=['"](?:.*Ebonyi.*|EB)['"][^>]*d=['"]([^'"]+)['"]`, 'i');
        pathMatch = svgData.match(ebonyiPattern);
        
        // If still not found, try with a simple pattern
        if (!pathMatch) {
          const simplePattern = new RegExp(`<path[^>]*d=['"]([^'"]+)['"][^>]*(?:id|title|name)=['"](?:.*Ebonyi.*|EB)['"]`, 'i');
          pathMatch = svgData.match(simplePattern);
        }
        
        // If still not found, use hardcoded path
        if (!pathMatch) {
          console.log("Using hardcoded path for Ebonyi");
          const hardcodedEbonyi = "M300.85,493.42L305.2,493.8L307.48,495.6L309.22,496.92L310.5,498.25L311.45,501.38L312.83,503.5L313.78,504.72L315.78,504.72L317.02,506.58L317.24,508.77L317.94,509.81L315.69,526.86L315.11,524.75L313.92,523.28L310.52,522.37L308.1,522.51L307.82,523.42L308.35,526.93L306.51,532.03L301.55,535.5L300.45,536.48L300.38,537.23L301.45,539.17L300.24,544.98L298.8,492.08L300.85,493.42z";
          pathMatch = ["", hardcodedEbonyi];
        }
      }
      
      // Special case for Federal Capital Territory
      if (!pathMatch && (regionId === "NG-FC" || regionName.includes("Federal Capital Territory") || regionName.includes("FCT"))) {
        console.log("Special handling for FCT");
        // Try to find FCT by name in any attribute
        const fctPattern = new RegExp(`<path[^>]*(?:id|title|name)=['"](?:.*Federal.*Capital.*|FCT)['"][^>]*d=['"]([^'"]+)['"]`, 'i');
        pathMatch = svgData.match(fctPattern);
        
        // If still not found, use hardcoded path
        if (!pathMatch) {
          console.log("Using hardcoded path for FCT");
          const hardcodedFCT = "M379.02,365.63L379.89,367.08L379.96,368.27L381.17,368.98L382.72,369.89L383.7,371.75L383.79,373.68L382.55,375.21L380.88,375.98L380.92,374.14L380.39,372.65L379.02,371.37L377.88,368.73L378.26,367.57L379.02,365.63z";
          pathMatch = ["", hardcodedFCT];
        }
      }
      
      // If no match and it's a Kenya county, try a few more patterns
      if (!pathMatch && regionId.startsWith("KE-")) {
        // Try matching by county number without the KE prefix
        const countyNum = regionId.replace("KE-", "");
        const kenyaCountyPattern = new RegExp(`<path[^>]*id=['"]${countyNum}['"][^>]*d=['"]([^'"]+)['"]`, 'i');
        pathMatch = svgData.match(kenyaCountyPattern);
        
        // If still no match, try matching by name (case insensitive)
        if (!pathMatch) {
          const countyNameRegex = new RegExp(`<path[^>]*(?:title|name)=['"].*${regionName.replace(/[^a-z0-9]/gi, '.*')}.*['"][^>]*d=['"]([^'"]+)['"]`, 'i');
          pathMatch = svgData.match(countyNameRegex);
        }
      }
      
      // If no match and it's a custom ID (KE-CUSTOM-*, KE-MISSING-*, etc), try to extract by region name
      if (!pathMatch && (regionId.includes('CUSTOM') || regionId.includes('MISSING') || regionId.includes('GEN'))) {
        // Look for the path with the regionName in title attribute (try different attribute variations)
        const namePatterns = [
          new RegExp(`<path[^>]*title="${regionName}"[^>]*d="([^"]+)"`, 'i'),
          new RegExp(`<path[^>]*name="${regionName}"[^>]*d="([^"]+)"`, 'i'),
          new RegExp(`<path[^>]*label="${regionName}"[^>]*d="([^"]+)"`, 'i'),
          // Try with simplified name (alphanumeric chars only)
          new RegExp(`<path[^>]*title=".*${regionName.replace(/[^a-z0-9]/gi, '.*')}.*"[^>]*d="([^"]+)"`, 'i'),
        ];
        
        for (const pattern of namePatterns) {
          pathMatch = svgData.match(pattern);
          if (pathMatch && pathMatch[1]) break;
        }
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

  // Rotation functions
  const rotateLeft = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRotation(prev => prev - 15);
  };

  const rotateRight = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRotation(prev => prev + 15);
  };

  // Scaling functions
  const increaseSize = (e: React.MouseEvent) => {
    e.stopPropagation();
    setScale(prev => Math.min(prev + 0.1, 1.5));
  };

  const decreaseSize = (e: React.MouseEvent) => {
    e.stopPropagation();
    setScale(prev => Math.max(prev - 0.1, 0.5));
  };

  // Reset transformations
  const resetTransformations = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRotation(0);
    setScale(1);
  };

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };
  
  const styles = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    cursor: onClick || (draggable || rotatable) ? 'pointer' : 'default',
    position: 'relative' as const
  };
  
  // Don't render a div container when dragging to avoid the box
  if (draggable && isDragging) {
    return (
      <svg 
        width={typeof width === 'number' ? width : 100}
        height={typeof height === 'number' ? height : 80}
        viewBox={viewBox}
        preserveAspectRatio="xMidYMid meet"
        style={{
          position: 'fixed',
          left: `${position.x}px`,
          top: `${position.y}px`,
          zIndex: 9999,
          pointerEvents: 'none',
          opacity: 0.9,
          transform: `translate(-50%, -50%) rotate(${rotation}deg) scale(${scale})`,
          transformOrigin: 'center center',
          filter: 'drop-shadow(0 0 12px rgba(0,0,0,0.5))',
          background: 'transparent',
          overflow: 'visible'
        }}
      >
        <g transform="translate(50, 50) scale(0.7)" style={{ transformOrigin: "center" }}>
          {/* Main colored path */}
          <path
            d={pathData}
            fill={color}
            stroke={strokeColor}
            strokeWidth={strokeWidth + 3}
            transform="scale(6.5)" /* Increased scale factor for larger shapes */
            style={{
              transformBox: 'fill-box',
              transformOrigin: 'center',
              filter: 'drop-shadow(0px 4px 8px rgba(0,0,0,0.7))'
            }}
          />
          
          {/* Text label */}
          {showLabel && (
            <text 
              x="0" 
              y="0" 
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#000000" 
              fontSize={regionId.startsWith("KE-") ? "50" : "70"} // Smaller font for Kenya counties which tend to have longer names
              fontWeight="900"
              style={{ 
                textShadow: '0 0 15px white, 0 0 15px white, 0 0 15px white, 0 0 15px white, 0 2px 4px rgba(0,0,0,0.8)',
                fontFamily: 'Arial, sans-serif'
              }}
            >
              {regionName}
            </text>
          )}
        </g>
      </svg>
    );
  }

  // Regular non-dragging view
  return (
    <div 
      ref={thumbnailRef}
      className={`region-thumbnail ${className} overflow-visible group`}
      style={{
        ...styles,
        background: 'transparent'
      }}
      {...(draggable ? {
        ...dragHandlers,
        onMouseDown: (e) => {
          dragHandlers.onMouseDown(e);
          e.stopPropagation();
        },
        onTouchStart: (e) => {
          dragHandlers.onTouchStart(e);
          e.stopPropagation();
        }
      } : { onClick: handleClick })}
    >
      {/* Control buttons for rotation and scaling (only visible when hovering) */}
      {rotatable && (
        <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity z-20 flex space-x-1">
          <Button 
            size="icon" 
            variant="secondary"
            className="w-6 h-6 bg-white/80 hover:bg-white text-black" 
            onClick={rotateLeft}
          >
            ↺
          </Button>
          <Button 
            size="icon" 
            variant="secondary"
            className="w-6 h-6 bg-white/80 hover:bg-white text-black" 
            onClick={rotateRight}
          >
            ↻
          </Button>
          <Button 
            size="icon" 
            variant="secondary" 
            className="w-6 h-6 bg-white/80 hover:bg-white text-black"
            onClick={resetTransformations}
          >
            ↺↻
          </Button>
        </div>
      )}
      
      {pathData ? (
        <div className="w-full h-full relative" style={{ background: 'transparent' }}>
          <svg 
            viewBox={viewBox} 
            width="100%" 
            height="100%" 
            preserveAspectRatio="xMidYMid meet"
            style={{
              transform: `rotate(${rotation}deg) scale(${scale})`,
              transition: "transform 0.3s ease",
              background: 'transparent'
            }}
          >
            {/* No rectangular background */}
            
            {/* Create a fixed-size centered container just for the state shape */}
            <g transform="translate(50, 50) scale(0.7)" style={{ transformOrigin: "center" }}>
              {/* White outline for visibility */}
              <path
                d={pathData}
                fill="white"
                stroke="white"
                strokeWidth={(strokeWidth + 3) + 4} // Extra thick white border for visibility
                transform="scale(6.5)" /* Increased scale factor for larger shapes */ // Increased to exactly 5.5x scale per request
                style={{
                  transformBox: 'fill-box',
                  transformOrigin: 'center',
                  opacity: 0.7
                }}
              />
              
              {/* Shadow layer for depth */}
              <path
                d={pathData}
                fill="#000000"
                stroke="#000000"
                strokeWidth={strokeWidth + 3}
                transform="translate(2, 2) scale(7.0)" // Increased offset shadow size
                style={{
                  transformBox: 'fill-box',
                  transformOrigin: 'center',
                  opacity: 0.3,
                  filter: 'blur(3px)'
                }}
              />
              
              {/* Main colored path with extra high contrast */}
              <path
                d={pathData}
                fill={color}
                stroke={strokeColor}
                strokeWidth={strokeWidth + 3} // Thicker border for very bold appearance
                transform="scale(6.5)" /* Increased scale factor for larger shapes */ // Increased to exactly 5.5x scale per request
                style={{
                  transformBox: 'fill-box',
                  transformOrigin: 'center',
                  filter: 'drop-shadow(0px 4px 8px rgba(0,0,0,0.7))',
                  opacity: 1
                }}
              />
              
              {/* Highlight edge for better definition */}
              <path
                d={pathData}
                fill="none"
                stroke="white"
                strokeWidth={1}
                transform="scale(6.5)" /* Increased scale factor for larger shapes */
                style={{
                  transformBox: 'fill-box',
                  transformOrigin: 'center',
                  opacity: 0.7
                }}
              />
              
              {/* Add text label IN the shape */}
              {showLabel && (
                <text 
                  x="0" 
                  y="0" 
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#000000" 
                  fontSize={regionId.startsWith("KE-") ? "50" : "70"} // Smaller font for Kenya counties which tend to have longer names
                  fontWeight="900"
                  style={{ 
                    textShadow: '0 0 15px white, 0 0 15px white, 0 0 15px white, 0 0 15px white, 0 2px 4px rgba(0,0,0,0.8)',
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