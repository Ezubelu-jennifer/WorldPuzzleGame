import React, { useEffect, useRef, RefObject, useState, useCallback } from "react";
import { RegionPiece } from "@shared/schema";
import { cn } from "@/lib/utils";
import { getSvgDataById } from "@/data/svg-map-data";
import { getViewBoxFromSVG } from "@/data/svg-parser";
import { optimizeSvgPath } from "@/utils/svg-clipper";
import { Button } from "@/components/ui/button";
import { useDragContext } from "@/context/drag-context";

interface StatePieceProps {
  region: RegionPiece;
  onDrop: (id: number, x: number, y: number) => boolean;
  containerRef: RefObject<HTMLDivElement>;
  snapToPosition?: boolean;
  isTrayPiece?: boolean;
  useThumbnail?: boolean;
  shapeSize?: number; // Added shape size prop
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
  shapeSize = 1.0
}: StatePieceProps) {
  // Debug log
  console.log(`StatePiece: Rendering ${region.name} with shapeSize ${shapeSize}`);
  // Access drag context
  const { draggedPieceId, setDraggedPieceId } = useDragContext();
  
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
  const [isNearTarget, setIsNearTarget] = useState<boolean>(false); // Track if piece is near correct position
  const [pulseEffect, setPulseEffect] = useState<boolean>(false); // Visual feedback when piece is placed correctly
  
  // Country ID
  const countryId = region.countryId || 0;

  // Path reference - separate refs for path and circle
  const pathRef = useRef<SVGPathElement>(null); 
  const circleRef = useRef<SVGCircleElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  
  // Size calculation (important for positioning)
  const baseSize = isTrayPiece ? 80 : 140;
  const size = Math.round(baseSize * shapeSize);

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
      
      // Special case for Ebonyi
      if (region.name === "Ebonyi") {
        console.log("StatePiece: Using special path for Ebonyi");
        const ebonyiPath = "M300.85,493.42L305.2,493.8L307.48,495.6L309.22,496.92L310.5,498.25L311.45,501.38L312.83,503.5L313.78,504.72L315.78,504.72L317.02,506.58L317.24,508.77L317.94,509.81L315.69,526.86L315.11,524.75L313.92,523.28L310.52,522.37L308.1,522.51L307.82,523.42L308.35,526.93L306.51,532.03L301.55,535.5L300.45,536.48L300.38,537.23L301.45,539.17L300.24,544.98L298.8,492.08L300.85,493.42z";
        setSvgPathData(ebonyiPath);
        return;
      }
      
      // Special case for FCT
      if (region.name === "Federal Capital Territory" || region.name === "FCT") {
        console.log("StatePiece: Using special path for FCT");
        const fctPath = "M379.02,365.63L379.89,367.08L379.96,368.27L381.17,368.98L382.72,369.89L383.7,371.75L383.79,373.68L382.55,375.21L380.88,375.98L380.92,374.14L380.39,372.65L379.02,371.37L377.88,368.73L378.26,367.57L379.02,365.63z";
        setSvgPathData(fctPath);
        return;
      }
      
      // Use region path directly for all other regions
      setSvgPathData(region.svgPath);
    } catch (error) {
      console.error("Error processing SVG:", error);
    }
  }, [region, countryId]);

  // Drag handlers - using fixed position SVG
  const handleDragStart = useCallback((e: React.MouseEvent<SVGElement>) => {
    if (region.isPlaced) return;
    e.stopPropagation();
    e.preventDefault();
    
    setIsDragging(true);
    // Set the global dragged piece ID
    setDraggedPieceId(region.id);
    
    // Apply zoom effect when starting drag
    setScale(2.0); // Start with a larger scale for the zoom effect
    setTimeout(() => {
      // After 300ms, gradually reduce back to normal size
      setScale(1.0);
    }, 300);
    
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
  }, [region.isPlaced, size, setDraggedPieceId, region.id]);
  
  // Mouse move handler
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    // Update position with the cursor exactly at the shape's position with no offset
    setPosition({
      x: e.clientX,
      y: e.clientY
    });
    
    // Check if we're near the target position during dragging
    if (containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const relX = e.clientX - containerRect.left;
      const relY = e.clientY - containerRect.top;
      
      // Calculate distance to correct position
      const dx = relX - region.correctX;
      const dy = relY - region.correctY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Update nearTarget state - tolerance of 50px
      const isNear = distance <= 60; // Match tolerance in game-context.tsx
      if (isNear !== isNearTarget) {
        setIsNearTarget(isNear);
        
        // Provide subtle user feedback when near target
        if (isNear) {
          setScale(1.2); // Slightly enlarge to show it's in a good spot
        } else {
          setScale(1.0);
        }
      }
    }
  }, [isDragging, containerRef, region.correctX, region.correctY, isNearTarget]);
  
  // Note: We've removed distance-based matching and now rely completely on shape matching
  // through the onDrop function that forwards to the game context's placePiece method
  
  // Mouse up/drop handler
  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    // Remove listeners
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    
    // Reset dragging state
    setIsDragging(false);
    // Clear the global dragged piece ID
    setDraggedPieceId(null);
    
    // Handle drop if we have a container
    if (containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const relX = e.clientX - containerRect.left;
      const relY = e.clientY - containerRect.top;
      
      // Try to drop the piece on the board using only shape-based matching
      const isDropped = onDrop(region.id, relX, relY);
      
      if (isDropped) {
        console.log(`✅ Region ${region.name} placed in correct position!`);
        
        // Immediately set position to the exact correct position for a perfect fit
        // This ensures the SVG path aligns perfectly with the outline on the map
        setPosition({
          x: containerRect.left + region.correctX,
          y: containerRect.top + region.correctY
        });
        
        // Add a smooth animation for the final snap
        setScale(1.2); // Initially scale up slightly
        setTimeout(() => {
          setScale(1.0); // Then scale back to normal
        }, 150);
        
        // Add a visual effect to show the piece fits perfectly
        // The piece will briefly flash with a highlight and then settle with a slight shadow
        setPulseEffect(true);
        setTimeout(() => {
          setPulseEffect(false);
        }, 600);
      }
    }
  }, [isDragging, region.id, onDrop, containerRef, setDraggedPieceId]);

  // Touch handlers
  const handleTouchStart = useCallback((e: React.TouchEvent<SVGElement>) => {
    if (region.isPlaced || e.touches.length !== 1) return;
    e.stopPropagation();
    e.preventDefault();
    
    setIsDragging(true);
    // Set the global dragged piece ID
    setDraggedPieceId(region.id);
    
    // Apply zoom effect when starting touch drag
    setScale(2.0); // Start with a larger scale for the zoom effect
    setTimeout(() => {
      // After 300ms, gradually reduce back to normal size
      setScale(1.0);
    }, 300);
    
    const touch = e.touches[0];
    setPosition({
      x: touch.clientX,
      y: touch.clientY
    });
    
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
  }, [region.isPlaced, size, setDraggedPieceId, region.id]);
  
  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    e.preventDefault();
    
    // Position exactly at the touch point with no offset
    const touch = e.touches[0];
    setPosition({
      x: touch.clientX,
      y: touch.clientY
    });
    
    // Check if we're near the target position during touch dragging
    if (containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const relX = touch.clientX - containerRect.left;
      const relY = touch.clientY - containerRect.top;
      
      // Calculate distance to correct position
      const dx = relX - region.correctX;
      const dy = relY - region.correctY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Update nearTarget state - tolerance of 50px
      const isNear = distance <= 60; // Match tolerance in game-context.tsx
      if (isNear !== isNearTarget) {
        setIsNearTarget(isNear);
        
        // Provide subtle user feedback when near target
        if (isNear) {
          setScale(1.2); // Slightly enlarge to show it's in a good spot
          
          // Provide subtle vibration feedback on mobile
          if ('vibrate' in navigator) {
            try {
              // Vibrate gently to indicate proximity to correct position
              navigator.vibrate(20);
            } catch (error) {
              console.log('Vibration not supported or disabled');
            }
          }
        } else {
          setScale(1.0);
        }
      }
    }
  }, [isDragging, containerRef, region.correctX, region.correctY, isNearTarget]);
  
  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!isDragging) return;
    
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchend', handleTouchEnd);
    
    setIsDragging(false);
    // Clear the global dragged piece ID
    setDraggedPieceId(null);
    
    if (containerRef.current && e.changedTouches.length === 1) {
      const touch = e.changedTouches[0];
      const containerRect = containerRef.current.getBoundingClientRect();
      
      const relX = touch.clientX - containerRect.left;
      const relY = touch.clientY - containerRect.top;
      
      // Try to drop the piece on the board using only shape-based matching
      const isDropped = onDrop(region.id, relX, relY);
      
      if (isDropped) {
        console.log(`✅ Region ${region.name} placed in correct position!`);
        
        // Immediately set position to the exact correct position for a perfect fit
        // This ensures the SVG path aligns perfectly with the outline on the map
        setPosition({
          x: containerRect.left + region.correctX,
          y: containerRect.top + region.correctY
        });
        
        // Add a smooth animation for the final snap
        setScale(1.2); // Initially scale up slightly
        setTimeout(() => {
          setScale(1.0); // Then scale back to normal
        }, 150);
        
        // Provide tactile feedback for mobile devices
        if ('vibrate' in navigator) {
          try {
            // Vibrate for 100ms to provide tactile feedback on mobile
            navigator.vibrate(100);
          } catch (error) {
            console.log('Vibration not supported or disabled');
          }
        }
        
        // Add a visual effect to show the piece fits perfectly
        // The piece will briefly flash with a highlight and then settle with a slight shadow
        setPulseEffect(true);
        setTimeout(() => {
          setPulseEffect(false);
        }, 600);
      }
    }
  }, [isDragging, region.id, onDrop, containerRef, setDraggedPieceId]);

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
        transition: isDragging ? 'transform 0.3s ease' : 'all 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        pointerEvents: 'none', // The SVG itself has no pointer events
        overflow: 'visible',
        filter: isDragging ? 'drop-shadow(0 0 8px rgba(0,0,0,0.5))' : 'none'
      }}
    >
      <g transform="translate(50, 50) scale(0.7)">
        {/* Special handling for FCT and Nasarawa with perfect circles */}
        {(region.name === "Federal Capital Territory" || region.name === "FCT" || region.name === "Nasarawa") ? (
          <>
            {/* Shadow circle for special regions */}
            <circle 
              cx="0" 
              cy="0" 
              r="50"
              fill="rgba(0,0,0,0.2)"
              transform="translate(2, 2)"
              style={{ pointerEvents: 'none' }}
            />
            
            {/* The actual interactive circle for special regions */}
            <circle
              ref={circleRef}
              cx="0" 
              cy="0"
              r="50"
              fill={region.isPlaced ? region.fillColor : "#ef4444"}
              stroke={region.strokeColor}
              strokeWidth="3.5"
              strokeLinejoin="round"
              strokeLinecap="round"
              className={pulseEffect ? 'pulse-effect' : ''}
              style={{ 
                transformOrigin: 'center center',
                cursor: !region.isPlaced ? 'move' : 'default',
                pointerEvents: region.isPlaced ? 'none' : 'auto',
                filter: pulseEffect 
                  ? undefined 
                  : (isNearTarget && isDragging) 
                    ? 'drop-shadow(0px 0px 10px rgba(0, 255, 0, 0.7))' 
                    : 'drop-shadow(0px 4px 6px rgba(0, 0, 0, 0.3))'
              }}
              onMouseDown={!region.isPlaced ? handleDragStart : undefined}
              onTouchStart={!region.isPlaced ? handleTouchStart : undefined}
            />
          </>
        ) : (
          <>
            {/* Shadow for depth - slightly offset - normal regions */}
            <path 
              d={svgPathData || region.svgPath} 
              fill="rgba(0,0,0,0.2)"
              transform="translate(2, 2) scale(1.0)"
              strokeLinejoin="round"
              strokeLinecap="round"
              style={{ pointerEvents: 'none' }}
            />
            
            {/* The actual interactive path - normal regions */}
            <path 
              ref={pathRef}
              d={svgPathData || region.svgPath} 
              fill={region.isPlaced ? region.fillColor : "#ef4444"}
              stroke={region.strokeColor}
              strokeWidth="3.5"
              transform="scale(1.0)"
              strokeLinejoin="round"
              strokeLinecap="round"
              className={pulseEffect ? 'pulse-effect' : ''}
              style={{ 
                transformOrigin: 'center center',
                cursor: !region.isPlaced ? 'move' : 'default',
                pointerEvents: region.isPlaced ? 'none' : 'auto', // Only enable pointer events when not placed
                filter: pulseEffect 
                  ? undefined 
                  : (isNearTarget && isDragging) 
                    ? 'drop-shadow(0px 0px 10px rgba(0, 255, 0, 0.7))' 
                    : 'drop-shadow(0px 4px 6px rgba(0, 0, 0, 0.3))'
              }}
              onMouseDown={!region.isPlaced ? handleDragStart : undefined}
              onTouchStart={!region.isPlaced ? handleTouchStart : undefined}
            />
          </>
        )}

        {/* Region label */}
        <text 
          x="0" 
          y="0" 
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#000000" 
          fontSize="30"
          fontWeight="900"
          style={{ 
            textShadow: '0 0 5px white, 0 0 5px white, 0 0 5px white, 0 0 5px white',
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
            style={{ pointerEvents: 'none' }} />
          <circle cx="50%" cy="50%" r="4" fill="red" stroke="white" strokeWidth="1" 
            style={{ pointerEvents: 'none' }} />
        </g>
      )}
      
      {/* Target position indicators have been moved to the PuzzleBoard component
          to ensure only one dot is shown at a time based on the global drag context */}
    </svg>
  );
}