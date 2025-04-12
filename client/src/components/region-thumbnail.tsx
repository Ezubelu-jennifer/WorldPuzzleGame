import React, { useState, useEffect, useRef, useCallback } from "react";
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
  // State variables
  const [pathData, setPathData] = useState<string>("");
  const [viewBox, setViewBox] = useState<string>("0 0 100 100");
  const [rotation, setRotation] = useState<number>(0);
  const [scale, setScale] = useState<number>(1);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });

  // Refs for elements
  const svgRef = useRef<SVGSVGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const size = typeof width === 'number' ? width : 100;

  // Process SVG path data
  useEffect(() => {
    if (!svgData || !regionId) return;
    
    try {
      // Extract viewBox, but use a fixed one for consistency
      setViewBox("0 0 100 100");
      
      // Extract the path for this region
      const pathRegex = new RegExp(`<path[^>]*id="${regionId}"[^>]*d="([^"]+)"`, 'i');
      let pathMatch = svgData.match(pathRegex);
      
      // Try alternative searches for custom regions
      if (!pathMatch && (regionId.includes('CUSTOM') || regionId.includes('MISSING') || regionId.includes('GEN'))) {
        const nameRegex = new RegExp(`<path[^>]*title="${regionName}"[^>]*d="([^"]+)"`, 'i');
        pathMatch = svgData.match(nameRegex);
      }
      
      if (pathMatch && pathMatch[1]) {
        try {
          // Optimize the path if possible
          const normalizedPath = optimizeSvgPath(pathMatch[1], 1.0);
          setPathData(normalizedPath);
        } catch (error) {
          console.warn(`Failed to optimize path for ${regionId}, using original`, error);
          setPathData(pathMatch[1]); 
        }
      } else if (regionId.includes('CUSTOM') || regionId.includes('MISSING') || regionId.includes('GEN')) {
        // Fallback for missing regions
        const fallbackPath = "M10,10 L90,10 Q100,10 100,20 L100,80 Q100,90 90,90 L10,90 Q0,90 0,80 L0,20 Q0,10 10,10 Z";
        setPathData(fallbackPath);
      } else {
        console.warn(`Path for region ${regionId} not found`);
      }
    } catch (error) {
      console.error("Error processing SVG path:", error);
    }
  }, [svgData, regionId, regionName]);

  // Drag handlers
  const handleDragStart = useCallback((e: React.MouseEvent<SVGPathElement>) => {
    if (!draggable) return;
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragging(true);
    
    // Get path element's position
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - (rect.left + rect.width/2);
    const offsetY = e.clientY - (rect.top + rect.height/2);
    
    setPosition({
      x: e.clientX - offsetX - size/2,
      y: e.clientY - offsetY - size/2
    });
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [draggable, size]);
  
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    
    setPosition({
      x: e.clientX - size/2,
      y: e.clientY - size/2
    });
  }, [isDragging, size]);
  
  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    
    // Reset dragging state
    setIsDragging(false);
    
    // Trigger the drop callback if provided
    if (onDrop && regionPieceId !== undefined) {
      onDrop(regionPieceId, e.clientX, e.clientY);
    }
  }, [isDragging, onDrop, regionPieceId]);
  
  // Touch event handlers
  const handleTouchStart = useCallback((e: React.TouchEvent<SVGPathElement>) => {
    if (!draggable || e.touches.length !== 1) return;
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragging(true);
    
    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = touch.clientX - (rect.left + rect.width/2);
    const offsetY = touch.clientY - (rect.top + rect.height/2);
    
    setPosition({
      x: touch.clientX - offsetX - size/2,
      y: touch.clientY - offsetY - size/2
    });
    
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
  }, [draggable, size]);
  
  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    e.preventDefault();
    
    const touch = e.touches[0];
    setPosition({
      x: touch.clientX - size/2,
      y: touch.clientY - size/2
    });
  }, [isDragging, size]);
  
  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!isDragging) return;
    
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchend', handleTouchEnd);
    
    setIsDragging(false);
    
    if (onDrop && regionPieceId !== undefined && e.changedTouches.length === 1) {
      const touch = e.changedTouches[0];
      onDrop(regionPieceId, touch.clientX, touch.clientY);
    }
  }, [isDragging, onDrop, regionPieceId]);

  // Click handler
  const handleClick = useCallback(() => {
    if (onClick) {
      onClick();
    }
  }, [onClick]);

  // Rotation handlers
  const rotateLeft = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setRotation(prev => prev - 15);
  }, []);

  const rotateRight = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setRotation(prev => prev + 15);
  }, []);

  return (
    <svg
      ref={svgRef}
      viewBox={viewBox}
      width={width}
      height={height}
      className={`${className} ${isDragging ? 'z-50' : ''}`}
      style={{
        position: isDragging ? 'fixed' : 'absolute',
        top: isDragging ? position.y : 'auto',
        left: isDragging ? position.x : 'auto',
        transform: `rotate(${rotation}deg) scale(${scale})`,
        transformOrigin: 'center center',
        pointerEvents: 'none', // The SVG itself has no pointer events
        overflow: 'visible'
      }}
      onClick={!draggable ? handleClick : undefined}
    >
      <g transform="translate(50, 50) scale(0.7)">
        {/* Shadow for depth */}
        <path 
          d={pathData}
          fill="rgba(0,0,0,0.3)"
          stroke="rgba(0,0,0,0.4)"
          strokeWidth={strokeWidth + 2}
          transform="translate(1.5, 1.5) scale(6)"
          style={{ pointerEvents: 'none' }}
        />
        
        {/* The actual interactive path */}
        <path 
          ref={pathRef}
          d={pathData}
          fill={color}
          stroke={strokeColor}
          strokeWidth={strokeWidth + 1.5}
          transform="scale(6)"
          style={{ 
            transformOrigin: 'center center',
            cursor: draggable ? 'move' : onClick ? 'pointer' : 'default',
            pointerEvents: 'auto', // Only the path gets events
            filter: 'drop-shadow(0px 2px 3px rgba(0,0,0,0.3))'
          }}
          onMouseDown={draggable ? handleDragStart : undefined}
          onTouchStart={draggable ? handleTouchStart : undefined}
        />

        {/* Label */}
        {showLabel && (
          <text 
            x="0" 
            y="0" 
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#000000" 
            fontSize="14"
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
      
      {/* Rotation controls (for rotatable pieces only) */}
      {rotatable && !isDragging && (
        <g transform="translate(80, 20)">
          <circle 
            cx="0" cy="0" r="10" 
            fill="white" 
            stroke="#ccc" 
            strokeWidth="1" 
            style={{ cursor: 'pointer', pointerEvents: 'auto' }}
            onClick={rotateLeft}
          />
          <text 
            x="0" y="0" 
            textAnchor="middle" 
            dominantBaseline="middle"
            fontSize="12"
            style={{ pointerEvents: 'none' }}
          >↺</text>
          
          <circle 
            cx="25" cy="0" r="10" 
            fill="white" 
            stroke="#ccc" 
            strokeWidth="1" 
            style={{ cursor: 'pointer', pointerEvents: 'auto' }}
            onClick={rotateRight}
          />
          <text 
            x="25" y="0" 
            textAnchor="middle" 
            dominantBaseline="middle"
            fontSize="12"
            style={{ pointerEvents: 'none' }}
          >↻</text>
        </g>
      )}
      
      {/* Drag indicator for dragging state */}
      {isDragging && (
        <g>
          <circle cx="50%" cy="50%" r="15" fill="none" stroke="rgba(255,0,0,0.5)" strokeWidth="3"
            style={{ animation: 'pulse 1.5s infinite', pointerEvents: 'none' }} />
          <circle cx="50%" cy="50%" r="5" fill="red" stroke="white" strokeWidth="1.5" 
            style={{ pointerEvents: 'none' }} />
        </g>
      )}
    </svg>
  );
}