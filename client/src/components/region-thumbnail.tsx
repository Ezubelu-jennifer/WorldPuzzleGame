import React, { useState, useEffect, useRef } from "react";
import { optimizeSvgPath } from "@/utils/svg-clipper";
import { getPathBounds } from "svg-path-bounds";
import { Button } from "@/components/ui/button";
import { useDrag } from "@/hooks/useDrag";

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
  rotatable = false,
  onDrop,
  regionPieceId
}: RegionThumbnailProps) {
  const [pathData, setPathData] = useState<string>("");
  const [viewBox, setViewBox] = useState<string>("0 0 800 600");
  const [rotation, setRotation] = useState<number>(0);
  const [scale, setScale] = useState<number>(1);
  const thumbnailRef = useRef<HTMLDivElement>(null);
  
  // Set up drag functionality if draggable is enabled
  const { isDragging, position, dragHandlers } = useDrag({
    onDragStart: () => {
      // Add any needed drag start behavior
      document.body.style.cursor = "grabbing";
    },
    onDragEnd: (position, dropped) => {
      // Reset cursor and handle any post-drag behavior
      document.body.style.cursor = "auto";
      
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
            transform="scale(5.5)"
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
              fontSize="46"
              fontWeight="bold"
              style={{ 
                textShadow: '0 0 8px white, 0 0 8px white, 0 0 8px white, 0 0 8px white',
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
                transform="scale(5.5)" // Increased to exactly 5.5x scale per request
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
                transform="translate(2, 2) scale(5.5)" // Offset shadow
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
                transform="scale(5.5)" // Increased to exactly 5.5x scale per request
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
                transform="scale(5.5)"
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
                  fontSize="46"
                  fontWeight="bold"
                  style={{ 
                    textShadow: '0 0 8px white, 0 0 8px white, 0 0 8px white, 0 0 8px white',
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