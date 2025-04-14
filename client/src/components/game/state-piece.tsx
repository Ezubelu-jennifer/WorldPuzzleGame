import React, { useEffect, useRef, RefObject, useState, useCallback } from "react";
import { RegionPiece } from "@shared/schema";
import { cn } from "@/lib/utils";
import { getSvgDataById } from "@/data/svg-map-data";
import { getViewBoxFromSVG } from "@/data/svg-parser";
import { optimizeSvgPath } from "@/utils/svg-clipper";
import { Button } from "@/components/ui/button";

interface StatePieceProps {
  region: RegionPiece;
  onDrop: (id: number, x: number, y: number) => boolean;
  containerRef: RefObject<HTMLDivElement>;
  snapToPosition?: boolean;
  isTrayPiece?: boolean;
  useThumbnail?: boolean;
}

interface Position {
  x: number;
  y: number;
}

export function StatePiece({ 
  region, 
  onDrop, 
  containerRef,
  snapToPosition = false,
  isTrayPiece = false
}: StatePieceProps) {
  // State
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [svgPathData, setSvgPathData] = useState<string | null>(null);
  const [viewBox, setViewBox] = useState<string>("0 0 100 100");
  const [position, setPosition] = useState<Position>({ 
    x: region.currentX || 0, 
    y: region.currentY || 0
  });
  const [rotation, setRotation] = useState<number>(0);
  const [scale, setScale] = useState<number>(1);
  
  // Country ID
  const countryId = region.countryId || 0;

  // Path reference
  const pathRef = useRef<SVGPathElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  
  // Size calculation (important for positioning)
  const size = isTrayPiece ? 80 : 140;

  // Fetch SVG data for this region
  useEffect(() => {
    if (!region) return;
    
    try {
      // Get SVG data
      let svgData = getSvgDataById(countryId);
      if (!svgData) return;
      
      // Get viewBox
      const viewBoxStr = getViewBoxFromSVG(svgData);
      if (viewBoxStr) {
        setViewBox(viewBoxStr);
      }
      
      // Use region path directly
      setSvgPathData(region.svgPath);
    } catch (error) {
      console.error("Error processing SVG:", error);
    }
  }, [region, countryId]);

  // Drag handlers - using fixed position SVG
  const handleDragStart = useCallback((e: React.MouseEvent<SVGPathElement>) => {
    if (region.isPlaced) return;
    e.stopPropagation();
    e.preventDefault();
    
    setIsDragging(true);
    
    // Get path element's center
    const pathElement = e.currentTarget;
    const rect = pathElement.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Calculate offset from cursor to center
    const offsetX = e.clientX - centerX;
    const offsetY = e.clientY - centerY;
    
    // Set initial position
    setPosition({
      x: e.clientX - offsetX - size/2,
      y: e.clientY - offsetY - size/2
    });
    
    // Add document event listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [region.isPlaced, size]);
  
  // Mouse move handler
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    // Update position with the cursor exactly at the shape's position with no offset
    setPosition({
      x: e.clientX,
      y: e.clientY
    });
  }, [isDragging]);
  
  // Mouse up/drop handler
  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    // Remove listeners
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    
    // Reset dragging state
    setIsDragging(false);
    
    // Handle drop if we have a container
    if (containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const relX = e.clientX - containerRect.left;
      const relY = e.clientY - containerRect.top;
      
      // Try to drop the piece
      onDrop(region.id, relX, relY);
    }
  }, [isDragging, region.id, onDrop, containerRef]);

  // Touch handlers
  const handleTouchStart = useCallback((e: React.TouchEvent<SVGPathElement>) => {
    if (region.isPlaced || e.touches.length !== 1) return;
    e.stopPropagation();
    e.preventDefault();
    
    setIsDragging(true);
    
    const touch = e.touches[0];
    setPosition({
      x: touch.clientX,
      y: touch.clientY
    });
    
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
  }, [region.isPlaced, size]);
  
  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    e.preventDefault();
    
    // Position exactly at the touch point with no offset
    const touch = e.touches[0];
    setPosition({
      x: touch.clientX,
      y: touch.clientY
    });
  }, [isDragging]);
  
  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!isDragging) return;
    
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchend', handleTouchEnd);
    
    setIsDragging(false);
    
    if (containerRef.current && e.changedTouches.length === 1) {
      const touch = e.changedTouches[0];
      const containerRect = containerRef.current.getBoundingClientRect();
      
      const relX = touch.clientX - containerRect.left;
      const relY = touch.clientY - containerRect.top;
      
      onDrop(region.id, relX, relY);
    }
  }, [isDragging, region.id, onDrop, containerRef]);

  // Build the SVG element directly
  return (
    <svg
      ref={svgRef}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={viewBox}
      width={size}
      height={size}
      className={isDragging ? "z-50" : ""}
      style={{
        position: isDragging ? 'fixed' : 'absolute', 
        top: position.y,
        left: position.x,
        opacity: region.isPlaced ? 0.9 : 1,
        transform: `translate(-50%, -50%) rotate(${rotation}deg) scale(${scale})`,
        transformOrigin: 'center center',
        transition: isDragging ? 'none' : 'all 0.3s ease',
        pointerEvents: 'none', // The SVG itself has no pointer events
        overflow: 'visible',
        filter: isDragging ? 'drop-shadow(0 0 8px rgba(0,0,0,0.5))' : 'none'
      }}
    >
      <g transform="translate(50, 50) scale(0.7)">
        {/* Shadow for depth - slightly offset */}
        <path 
          d={svgPathData || region.svgPath} 
          fill="rgba(0,0,0,0.2)"
          transform="translate(2, 2) scale(7.5)"
          strokeLinejoin="round"
          strokeLinecap="round"
          style={{ pointerEvents: 'none' }}
        />
        
        {/* The actual interactive path */}
        <path 
          ref={pathRef}
          d={svgPathData || region.svgPath} 
          fill={region.isPlaced ? region.fillColor : "#ef4444"}
          stroke={region.strokeColor}
          strokeWidth="2"
          transform="scale(7.5)"
          strokeLinejoin="round"
          strokeLinecap="round"
          style={{ 
            transformOrigin: 'center center',
            cursor: !region.isPlaced ? 'move' : 'default',
            pointerEvents: region.isPlaced ? 'none' : 'auto', // Only enable pointer events when not placed
            filter: 'drop-shadow(0px 4px 6px rgba(0, 0, 0, 0.3))'
          }}
          onMouseDown={!region.isPlaced ? handleDragStart : undefined}
          onTouchStart={!region.isPlaced ? handleTouchStart : undefined}
        />

        {/* Region label */}
        <text 
          x="0" 
          y="0" 
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#000000" 
          fontSize="100"
          fontWeight="900"
          style={{ 
            textShadow: '0 0 10px white, 0 0 10px white, 0 0 10px white, 0 0 10px white',
            fontFamily: 'Arial, sans-serif',
            pointerEvents: 'none'
          }}
        >
          {region.name}
        </text>
      </g>
      
      {/* Drag indicator */}
      {isDragging && (
        <g>
          {/* Central indicator on the dragging piece */}
          <circle cx="50%" cy="50%" r="10" fill="none" stroke="rgba(255,0,0,0.5)" strokeWidth="3"
            style={{ animation: 'pulse 1.5s infinite', pointerEvents: 'none' }} />
          <circle cx="50%" cy="50%" r="4" fill="red" stroke="white" strokeWidth="1" 
            style={{ pointerEvents: 'none' }} />
        </g>
      )}
      
      {/* Target position indicator - Only shown when THIS piece is being dragged */}
      {isDragging && region.correctX && region.correctY && (
        <g>
          <circle 
            cx={region.correctX} 
            cy={region.correctY} 
            r="15" 
            fill="none" 
            stroke="rgba(255,0,0,0.7)" 
            strokeWidth="3"
            style={{ 
              animation: 'pulse 1.5s infinite', 
              pointerEvents: 'none',
              filter: 'drop-shadow(0 0 5px white)' 
            }} 
          />
          <circle 
            cx={region.correctX} 
            cy={region.correctY} 
            r="6" 
            fill="red" 
            stroke="white" 
            strokeWidth="1.5"
            style={{ 
              pointerEvents: 'none',
              filter: 'drop-shadow(0 0 3px white)' 
            }} 
          />
        </g>
      )}
    </svg>
  );
}