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
  onDrop?: (id: number, x: number, y: number) => boolean;
  regionPieceId?: number;
}

interface Position {
  x: number;
  y: number;
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
  const [viewBox, setViewBox] = useState<string>("0 0 100 100");
  const [rotation, setRotation] = useState<number>(0);
  const [scale, setScale] = useState<number>(1);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  
  // Create SVG element reference
  const svgRef = useRef<SVGSVGElement>(null);
  
  // Drag operation references
  const dragStartPosRef = useRef<Position>({ x: 0, y: 0 });
  const elementStartPosRef = useRef<Position>({ x: 0, y: 0 });
  
  // Extract path data for this region
  useEffect(() => {
    if (!svgData || !regionId) return;
    
    try {
      // Extract viewBox and use a normalized one
      setViewBox("0 0 100 100");
      
      // Extract the path for this specific region
      // First, try to find an exact ID match
      const pathRegex = new RegExp(`<path[^>]*id="${regionId}"[^>]*d="([^"]+)"`, 'i');
      let pathMatch = svgData.match(pathRegex);
      
      // If no match and it's a custom ID, try to extract by region name
      if (!pathMatch && (regionId.includes('CUSTOM') || regionId.includes('MISSING') || regionId.includes('GEN'))) {
        const nameRegex = new RegExp(`<path[^>]*title="${regionName}"[^>]*d="([^"]+)"`, 'i');
        pathMatch = svgData.match(nameRegex);
      }
      
      if (pathMatch && pathMatch[1]) {
        try {
          // Get and optimize the path
          const originalPath = pathMatch[1];
          const normalizedPath = optimizeSvgPath(originalPath, 1.0);
          setPathData(normalizedPath);
        } catch (error) {
          console.warn(`Failed to optimize path for ${regionId}, using original`, error);
          setPathData(pathMatch[1]); 
        }
      } else if (regionId.includes('CUSTOM') || regionId.includes('MISSING') || regionId.includes('GEN')) {
        console.warn(`Creating fallback shape for ${regionId} (${regionName})`);
        const fallbackPath = "M10,10 L90,10 Q100,10 100,20 L100,80 Q100,90 90,90 L10,90 Q0,90 0,80 L0,20 Q0,10 10,10 Z";
        setPathData(fallbackPath);
      } else {
        console.warn(`Path for region ${regionId} not found`);
      }
    } catch (error) {
      console.error("Error extracting region path:", error);
    }
  }, [svgData, regionId, regionName]);

  // Rotation functions
  const rotateLeft = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRotation(prev => prev - 15);
  };

  const rotateRight = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRotation(prev => prev + 15);
  };

  const resetTransformations = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRotation(0);
    setScale(1);
  };

  // Click handler
  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };
  
  // Mouse handlers for dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!draggable) return;
    e.preventDefault();
    e.stopPropagation();
    
    // Record start positions
    dragStartPosRef.current = { x: e.clientX, y: e.clientY };
    elementStartPosRef.current = { ...position };
    
    setIsDragging(true);
    document.body.style.cursor = "grabbing";
    
    // Add document event handlers
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  
  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    // Calculate new position
    setPosition({
      x: e.clientX - 40, // Half of width
      y: e.clientY - 40, // Half of height
    });
  };
  
  const handleMouseUp = (e: MouseEvent) => {
    if (!isDragging) return;
    
    // Remove document event handlers
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    
    setIsDragging(false);
    document.body.style.cursor = "auto";
    
    // Handle drop event
    if (onDrop && regionPieceId !== undefined) {
      onDrop(regionPieceId, e.clientX, e.clientY);
    }
  };
  
  // Touch handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!draggable || e.touches.length !== 1) return;
    e.preventDefault();
    e.stopPropagation();
    
    const touch = e.touches[0];
    
    // Record start positions
    dragStartPosRef.current = { x: touch.clientX, y: touch.clientY };
    elementStartPosRef.current = { ...position };
    
    setIsDragging(true);
    
    // Add document event handlers
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
  };
  
  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    e.preventDefault();
    
    const touch = e.touches[0];
    
    // Calculate new position
    setPosition({
      x: touch.clientX - 40, // Half of width
      y: touch.clientY - 40, // Half of height
    });
  };
  
  const handleTouchEnd = (e: TouchEvent) => {
    if (!isDragging) return;
    
    // Remove document event handlers
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchend', handleTouchEnd);
    
    setIsDragging(false);
    
    // Handle drop event if we have position data
    if (onDrop && regionPieceId !== undefined && e.changedTouches.length > 0) {
      const touch = e.changedTouches[0];
      onDrop(regionPieceId, touch.clientX, touch.clientY);
    }
  };
  
  // Directly return SVG without any container divs
  return (
    <>
      {pathData ? (
        <svg 
          ref={svgRef}
          viewBox={viewBox} 
          width={typeof width === 'number' ? `${width}px` : width}
          height={typeof height === 'number' ? `${height}px` : height}
          preserveAspectRatio="xMidYMid meet"
          className={`${className} ${isDragging ? 'z-50' : ''}`}
          style={{
            ...(isDragging ? {
              position: 'fixed',
              left: `${position.x}px`,
              top: `${position.y}px`,
              zIndex: 9999,
              pointerEvents: 'none',
              opacity: 0.8,
            } : {
              position: 'relative',
              cursor: onClick || (draggable || rotatable) ? 'pointer' : 'default',
            }),
            transform: `rotate(${rotation}deg) scale(${scale})`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : "transform 0.3s ease",
            background: 'transparent',
            overflow: 'visible'
          }}
          onClick={onClick}
          onMouseDown={draggable ? handleMouseDown : undefined}
          onTouchStart={draggable ? handleTouchStart : undefined}
        >
          {/* Controls for rotation if needed */}
          {rotatable && !isDragging && (
            <g className="opacity-0 hover:opacity-100 transition-opacity" style={{ pointerEvents: 'all' }}>
              <circle cx="90" cy="10" r="8" fill="white" opacity="0.8" />
              <text x="90" y="10" textAnchor="middle" dominantBaseline="middle" 
                fontSize="10" fill="black" onClick={rotateLeft} style={{ cursor: 'pointer' }}>↺</text>
                
              <circle cx="90" cy="30" r="8" fill="white" opacity="0.8" />
              <text x="90" y="30" textAnchor="middle" dominantBaseline="middle" 
                fontSize="10" fill="black" onClick={rotateRight} style={{ cursor: 'pointer' }}>↻</text>
                
              <circle cx="90" cy="50" r="8" fill="white" opacity="0.8" />
              <text x="90" y="50" textAnchor="middle" dominantBaseline="middle" 
                fontSize="10" fill="black" onClick={resetTransformations} style={{ cursor: 'pointer' }}>R</text>
            </g>
          )}
          
          {/* Create a fixed-size centered container just for the state shape */}
          <g transform="translate(50, 50) scale(0.7)" style={{ transformOrigin: "center" }}>
            {/* White outline for visibility */}
            <path
              d={pathData}
              fill="white"
              stroke="white"
              strokeWidth={(strokeWidth + 3) + 4}
              transform="scale(5.5)"
              style={{
                transformBox: 'fill-box',
                transformOrigin: 'center',
                opacity: 0.7,
                pointerEvents: 'none'
              }}
            />
            
            {/* Shadow layer for depth */}
            <path
              d={pathData}
              fill="#000000"
              stroke="#000000"
              strokeWidth={strokeWidth + 3}
              transform="translate(2, 2) scale(5.5)"
              style={{
                transformBox: 'fill-box',
                transformOrigin: 'center',
                opacity: 0.3,
                filter: 'blur(3px)',
                pointerEvents: 'none'
              }}
            />
            
            {/* Main colored path - this is the interactive part */}
            <path
              d={pathData}
              fill={color}
              stroke={strokeColor}
              strokeWidth={strokeWidth + 3}
              transform="scale(5.5)"
              style={{
                transformBox: 'fill-box',
                transformOrigin: 'center',
                filter: 'drop-shadow(0px 4px 8px rgba(0,0,0,0.7))',
                opacity: 1,
                cursor: onClick || draggable ? 'pointer' : 'default',
                pointerEvents: 'all'
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
                opacity: 0.7,
                pointerEvents: 'none'
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
                fontSize="16"
                fontWeight="bold"
                style={{ 
                  textShadow: '0 0 4px white, 0 0 4px white, 0 0 4px white, 0 0 4px white',
                  fontFamily: 'Arial, sans-serif',
                  pointerEvents: 'none'
                }}
              >
                {regionName}
              </text>
            )}
          </g>
        </svg>
      ) : (
        // Fallback when no path data is available
        <svg 
          width={typeof width === 'number' ? `${width}px` : width}
          height={typeof height === 'number' ? `${height}px` : height}
          className={className}
          viewBox="0 0 100 100"
        >
          <text 
            x="50" 
            y="50" 
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#888" 
            fontSize="10"
          >
            {regionName || "Region"}
          </text>
        </svg>
      )}
    </>
  );
}