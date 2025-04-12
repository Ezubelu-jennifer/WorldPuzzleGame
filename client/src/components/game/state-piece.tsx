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
  useThumbnail?: boolean; // Whether to use the thumbnail instead of rendering SVG
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
  isTrayPiece = false,
  useThumbnail = false
}: StatePieceProps) {
  // State for this component
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [svgPathData, setSvgPathData] = useState<string | null>(null);
  const [viewBox, setViewBox] = useState<string>("0 0 100 100");
  const [position, setPosition] = useState<Position>({ 
    x: region.currentX || 0, 
    y: region.currentY || 0
  });
  const [rotation, setRotation] = useState<number>(0);
  const [scale, setScale] = useState<number>(1);
  const [isEnlarged, setIsEnlarged] = useState<boolean>(false);
  
  // Get the country ID to match with the right SVG
  const countryId = region.countryId || 0;

  // Refs
  const pieceRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const dragOffset = useRef<Position>({ x: 0, y: 0 });
  
  // Piece size - using a mask to ensure accurate shape-only dragging
  const pieceSize = isTrayPiece ? 100 : 150; // Slightly larger when on board

  // Fetch the SVG data for this region
  useEffect(() => {
    if (!region) return;
    
    try {
      // Get the SVG data for the appropriate country
      let svgData = getSvgDataById(countryId);
      if (!svgData) return;
      
      // Extract the viewBox from the SVG
      const viewBoxStr = getViewBoxFromSVG(svgData);
      if (viewBoxStr) {
        setViewBox(viewBoxStr);
      }
      
      setSvgPathData(region.svgPath);
      
    } catch (error) {
      console.error("Error processing region SVG path:", error);
    }
  }, [region, countryId]);

  // Mouse event handlers for dragging - ONLY for the path element
  const handlePathMouseDown = useCallback((e: React.MouseEvent<SVGPathElement>) => {
    if (region.isPlaced) return;
    e.stopPropagation();
    
    // Get the path's position in the SVG
    const pathElement = e.currentTarget;
    const rect = pathElement.getBoundingClientRect();
    
    // Center the drag point on the cursor
    dragOffset.current = {
      x: rect.width / 2,
      y: rect.height / 2
    };
    
    setIsDragging(true);
    setIsEnlarged(true); // Enlarge on start
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [region.isPlaced]);
  
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    // Position the piece so its center is exactly at the cursor
    // Use half of pieceSize to position the top-left corner correctly
    const halfSize = pieceSize / 2;
    setPosition({
      x: e.clientX - halfSize,
      y: e.clientY - halfSize
    });
  }, [isDragging, pieceSize]);
  
  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    
    setIsDragging(false);
    setIsEnlarged(false);
    
    // Try to place the piece if we have a container
    if (containerRef.current && e.target instanceof Node) {
      const containerRect = containerRef.current.getBoundingClientRect();
      
      // Calculate position relative to the container
      const relX = e.clientX - containerRect.left;
      const relY = e.clientY - containerRect.top;
      
      // Check if the drop was successful
      const dropSuccess = onDrop(region.id, relX, relY);
      
      // If drop was not successful (piece didn't snap into place), return it to original position
      if (!dropSuccess && !snapToPosition) {
        // Return to tray or other original position logic here
      }
    }
  }, [isDragging, region, onDrop, containerRef, snapToPosition]);

  // Touch events - ONLY for the path element
  const handlePathTouchStart = useCallback((e: React.TouchEvent<SVGPathElement>) => {
    if (region.isPlaced || e.touches.length !== 1) return;
    e.stopPropagation();
    e.preventDefault();
    
    const pathElement = e.currentTarget;
    const rect = pathElement.getBoundingClientRect();
    
    // Center the drag point on the touch point
    dragOffset.current = {
      x: rect.width / 2,
      y: rect.height / 2
    };
    
    setIsDragging(true);
    setIsEnlarged(true);
    
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
  }, [region.isPlaced]);
  
  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    e.preventDefault(); // Prevent scrolling
    
    const touch = e.touches[0];
    // Position the piece so its center is exactly at the touch point
    const halfSize = pieceSize / 2;
    setPosition({
      x: touch.clientX - halfSize,
      y: touch.clientY - halfSize
    });
  }, [isDragging, pieceSize]);
  
  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!isDragging) return;
    
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchend', handleTouchEnd);
    
    setIsDragging(false);
    setIsEnlarged(false);
    
    // Try to place the piece if we have a container
    if (containerRef.current && e.changedTouches.length === 1) {
      const touch = e.changedTouches[0];
      const containerRect = containerRef.current.getBoundingClientRect();
      
      // Calculate position relative to the container
      const relX = touch.clientX - containerRect.left;
      const relY = touch.clientY - containerRect.top;
      
      // Check if the drop was successful
      const dropSuccess = onDrop(region.id, relX, relY);
      
      // If drop was not successful (piece didn't snap into place), return it to original position
      if (!dropSuccess && !snapToPosition) {
        // Return to tray or other original position logic here
      }
    }
  }, [isDragging, region, onDrop, containerRef, snapToPosition]);

  // Buttons for piece manipulation
  const rotateLeft = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent drag from starting
    setRotation((prev) => prev - 15); // Rotate 15 degrees left
  };

  const rotateRight = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent drag from starting
    setRotation((prev) => prev + 15); // Rotate 15 degrees right
  };

  const increaseSize = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent drag from starting
    setScale((prev) => Math.min(prev + 0.1, 1.3)); // Max scale 1.3x
  };

  const decreaseSize = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent drag from starting
    setScale((prev) => Math.max(prev - 0.1, 0.7)); // Min scale 0.7x
  };

  // Reset transformations
  const resetTransformations = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent drag from starting
    setRotation(0);
    setScale(1);
  };

  return (
    <div
      ref={pieceRef}
      className={cn(
        "absolute transition-transform",
        isDragging ? "z-50" : "",
        region.isPlaced ? "cursor-default" : "",
        isTrayPiece ? "inline-block" : "",
        region.isPlaced ? "" : "group" // Add group for hover effects
      )}
      style={{ 
        position: isDragging ? 'fixed' : 'absolute', 
        top: position.y,
        left: position.x,
        opacity: region.isPlaced ? 0.9 : 1,
        width: pieceSize,
        height: pieceSize,
        transition: isDragging ? "none" : "opacity 0.3s ease",
        background: 'transparent',
        transformOrigin: "center center",
        pointerEvents: 'none' // IMPORTANT: Main container has NO pointer events
      }}
    >
      {/* Control buttons (only visible when hovering and not placed) */}
      {!region.isPlaced && !isTrayPiece && (
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
            onClick={increaseSize}
          >
            +
          </Button>
          <Button 
            size="icon" 
            variant="secondary" 
            className="w-6 h-6 bg-white/80 hover:bg-white text-black"
            onClick={decreaseSize}
          >
            -
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

      <svg 
        ref={svgRef}
        viewBox={viewBox} 
        className={cn(
          "w-full h-full puzzle-piece", 
          isDragging && "puzzle-piece-dragging",
          isEnlarged && !isDragging && "puzzle-piece-enlarged"
        )}
        style={{ 
          overflow: 'visible',
          transform: `rotate(${rotation}deg)`,
          transformOrigin: "center center", // Ensure rotation happens from center
          background: 'transparent',
          pointerEvents: 'none', // SVG has no pointer events either
        }}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Create a mask definition that matches the shape */}
        <defs>
          <mask id={`mask-${region.id}`}>
            {/* White shape = visible area */}
            <path
              d={svgPathData || region.svgPath}
              fill="white"
            />
          </mask>
        </defs>
        
        {/* No background elements - just the state shape centered precisely */}
        <g transform="translate(50, 50) scale(0.7)" style={{ transformOrigin: "center", pointerEvents: 'none' }}>
          {/* Main path that takes pointer events to trigger dragging */}
          <path 
            ref={pathRef}
            d={svgPathData || region.svgPath} 
            fill={region.isPlaced ? region.fillColor : "#ef4444"} // Red for unplaced pieces
            stroke={region.strokeColor}
            strokeWidth="2" // Reduced for cleaner appearance at smaller size
            transform="scale(7.5)" // Significantly increased scale to fill the much smaller container
            strokeLinejoin="round"
            strokeLinecap="round"
            style={{ 
              transformOrigin: 'center center',
              cursor: !region.isPlaced ? 'move' : 'default',
              pointerEvents: 'auto', // ONLY the path gets pointer events!
              filter: 'drop-shadow(0px 4px 6px rgba(0, 0, 0, 0.3))'
            }}
            onMouseDown={!region.isPlaced ? handlePathMouseDown : undefined}
            onTouchStart={!region.isPlaced ? handlePathTouchStart : undefined}
          />
        </g>

        {/* Centroid indicator (red dot) - only visible during dragging */}
        {isDragging && (
          <>
            {/* Outermost pulse effect */}
            <circle 
              cx="50%" 
              cy="50%" 
              r="12" 
              fill="none" 
              stroke="rgba(255,0,0,0.3)"
              strokeWidth="4"
              style={{ 
                filter: 'drop-shadow(0px 0px 8px rgba(255,0,0,0.7))',
                animation: 'pulse 2s infinite',
                transformOrigin: 'center',
                pointerEvents: 'none'
              }}
            />
            {/* Middle pulse effect */}
            <circle 
              cx="50%" 
              cy="50%" 
              r="9" 
              fill="none" 
              stroke="rgba(255,0,0,0.5)"
              strokeWidth="3"
              style={{ 
                filter: 'drop-shadow(0px 0px 6px rgba(255,0,0,0.6))',
                animation: 'pulse 1.5s infinite 0.2s',
                transformOrigin: 'center',
                pointerEvents: 'none'
              }}
            />
            {/* Inner pulse ring */}
            <circle 
              cx="50%" 
              cy="50%" 
              r="6" 
              fill="none" 
              stroke="rgba(255,0,0,0.7)"
              strokeWidth="2"
              style={{ 
                filter: 'drop-shadow(0px 0px 4px rgba(255,0,0,0.7))',
                animation: 'pulse 1s infinite 0.4s',
                transformOrigin: 'center',
                pointerEvents: 'none'
              }}
            />
            {/* Main red dot */}
            <circle 
              cx="50%" 
              cy="50%" 
              r="4" 
              fill="red" 
              stroke="white"
              strokeWidth="2"
              style={{ 
                filter: 'drop-shadow(0px 0px 5px rgba(255,0,0,0.9))',
                opacity: 1,
                pointerEvents: 'none'
              }}
            />
          </>
        )}

        <text 
          x="50%" 
          y="50%" 
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#000000" 
          fontSize={isTrayPiece ? "12" : "14"} // Slightly reduced text size
          fontWeight="bold"
          style={{ 
            textShadow: '0 0 3px white, 0 0 3px white, 0 0 3px white, 0 0 3px white',
            fontFamily: 'Arial, sans-serif',
            pointerEvents: 'none'
          }}
        >
          {region.name}
        </text>
      </svg>
    </div>
  );
}