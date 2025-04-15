import React, { useEffect, useRef, RefObject, useState, useCallback } from "react";
import { RegionPiece } from "@shared/schema";
import { useDragContext } from "@/context/drag-context";
import { compareSvgPaths } from "@/utils/svg-clipper";

interface StatePieceProps {
  region: RegionPiece;
  onDrop: (id: number, x: number, y: number) => boolean;
  containerRef: RefObject<HTMLDivElement>;
  snapToPosition?: boolean;
  isTrayPiece?: boolean;
}

interface Position {
  x: number;
  y: number;
}

export function DynamicStatePiece({ 
  region, 
  onDrop, 
  containerRef,
  snapToPosition = false,
  isTrayPiece = false
}: StatePieceProps) {
  // Access drag context
  const { draggedPieceId, setDraggedPieceId } = useDragContext();
  
  // State
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [position, setPosition] = useState<Position>({ 
    x: region.currentX || 0, 
    y: region.currentY || 0
  });
  const [scale, setScale] = useState<number>(1.0);
  const [isNearTarget, setIsNearTarget] = useState<boolean>(false);
  const [pulseEffect, setPulseEffect] = useState<boolean>(false);
  const [showPopup, setShowPopup] = useState<boolean>(false);
  const [popupText, setPopupText] = useState<string>("");
  const [targetRegionName, setTargetRegionName] = useState<string>("");
  
  // Refs
  const svgRef = useRef<SVGSVGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const circleRef = useRef<SVGCircleElement>(null);
  
  // Use dynamic size based on region properties if available
  const baseSize = 100; // Base size for the SVG viewBox
  const size = region.width || baseSize; // Use region's own width if available
  
  // Debug logging for initialization
  useEffect(() => {
    console.log(`DynamicStatePiece initialized: ${region.name} (ID: ${region.id})`);
  }, [region.name, region.id]);
  
  // Function to find target path element for a region
  const findTargetPathElement = useCallback(() => {
    // Try all possible selectors to find the matching path element
    const selectors = [
      `path[data-numeric-id="${region.id}"]`,
      `path[data-region-id="${region.id}"]`,
      `path[data-region-id="NG-${region.id}"]`,
      `path[data-name="${region.name}"]`
    ];
    
    // Try each selector
    for (const selector of selectors) {
      const element = document.querySelector(selector) as SVGPathElement;
      if (element) {
        const targetName = element.getAttribute('data-name');
        if (targetName) {
          setTargetRegionName(targetName);
        }
        return element;
      }
    }
    
    // If no direct match, try a more exhaustive search
    const allPaths = document.querySelectorAll('path[data-region-id], path[data-numeric-id], path[data-name]');
    
    // Convert NodeList to Array to avoid TypeScript issues
    const pathsArray = Array.from(allPaths);
    
    // First try attribute matching
    for (const path of pathsArray) {
      const regionId = path.getAttribute('data-region-id');
      const numericId = path.getAttribute('data-numeric-id');
      const pathName = path.getAttribute('data-name');
      
      // Check if any attribute matches our region
      if ((regionId && regionId.includes(`${region.id}`)) || 
          (numericId && parseInt(numericId) === region.id) ||
          (pathName && pathName.toLowerCase() === region.name.toLowerCase())) {
        if (pathName) {
          setTargetRegionName(pathName);
        }
        return path as SVGPathElement;
      }
    }
    
    // If still no match, try SVG path shape matching
    if (pathRef.current) {
      const draggedPathData = pathRef.current.getAttribute('d');
      
      if (draggedPathData) {
        for (const path of pathsArray) {
          const targetPathData = path.getAttribute('d');
          const pathName = path.getAttribute('data-name');
          
          if (targetPathData && compareSvgPaths(draggedPathData, targetPathData, 0.7)) {
            console.log(`Found matching SVG path shape for ${region.name}`);
            if (pathName) {
              setTargetRegionName(pathName);
            }
            return path as SVGPathElement;
          }
        }
      }
    }
    
    return null;
  }, [region.id, region.name]);
  
  // Function to calculate dynamic size based on target element to ensure exact matching
  const calculateDynamicSize = useCallback(() => {
    // Find the target path element
    const targetElement = findTargetPathElement();
    if (!targetElement || !pathRef.current) {
      console.log('Could not calculate size: missing elements');
      return region.scale || 1.0; // Use predefined scale if available, or default
    }
    
    try {
      // Store dimensions for future reference
      if (!region.width && targetElement && pathRef.current) {
        // Use SVG getBBox for more accurate measurement of the actual path
        const targetSVGRect = targetElement.getBBox();
        const pieceSVGRect = pathRef.current.getBBox();
        
        // Store calculated dimensions for consistency
        region.width = pieceSVGRect.width;
        region.height = pieceSVGRect.height;
        
        // Calculate the ideal ratio that would make the piece match the target
        const idealRatio = Math.min(
          targetSVGRect.width / pieceSVGRect.width,
          targetSVGRect.height / pieceSVGRect.height
        );
        
        // Store the calculated scale for future reference
        region.scale = idealRatio;
        
        console.log(`Stored dimensions for ${region.name}: ${region.width.toFixed(2)}x${region.height.toFixed(2)}, scale: ${region.scale.toFixed(2)}`);
      }
      
      // For visual feedback, log the comparison even if we're using stored values
      console.log(`Size comparison for ${region.name}: Using scale ${(region.scale || 1.0).toFixed(2)}`);
      
      // Apply reasonable constraints to the scale to avoid extreme values
      const safeScale = Math.max(0.6, Math.min(1.4, region.scale || 1.0));
      
      return safeScale;
    } catch (err) {
      console.error('Error calculating size:', err);
      return region.scale || 1.0; // Use stored scale or default on error
    }
  }, [findTargetPathElement, region]);
  
  // Mouse drag start handler
  const handleDragStart = useCallback((e: React.MouseEvent<SVGElement>) => {
    if (region.isPlaced) return;
    e.stopPropagation();
    
    setIsDragging(true);
    setDraggedPieceId(region.id);
    
    // Get the path element that was clicked
    const pathElement = e.currentTarget;
    const rect = pathElement.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Set initial position
    setPosition({
      x: e.clientX,
      y: e.clientY
    });
    
    // Start with a slightly larger scale for better visibility
    setScale(1.2 );
    
    // Add document event listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [region.isPlaced, region.id, setDraggedPieceId]);
  
  // Mouse move handler
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    // Update position with cursor at center of shape
    setPosition({
      x: e.clientX,
      y: e.clientY
    });
    
    // Check if we're near the target position
    if (containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const relX = e.clientX - containerRect.left;
      const relY = e.clientY - containerRect.top;
      
      // Calculate distance to correct position
      const dx = relX - region.correctX;
      const dy = relY - region.correctY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Update nearTarget state with tolerance of 60px
      const isNear = distance <= 60;
      if (isNear !== isNearTarget) {
        setIsNearTarget(isNear);
        
        if (isNear) {
          // When near target, apply dynamic sizing
          const newScale = calculateDynamicSize();
          setScale(newScale);
          
          // Show matching popup
          if (targetRegionName && region.name) {
            setPopupText(`Matching ${region.name} to ${targetRegionName}`);
            setShowPopup(true);
          }
        } else {
          // Reset to normal size when not near
          setScale(1.0);
          setShowPopup(false); // Hide popup when moving away
        }
      }
    }
  }, [isDragging, containerRef, region.correctX, region.correctY, isNearTarget, calculateDynamicSize]);
  
  // Mouse up/drop handler
  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    // Remove listeners
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    
    setIsDragging(false);
    setDraggedPieceId(null);
    
    // Handle drop if we have a container
    if (containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const relX = e.clientX - containerRect.left;
      const relY = e.clientY - containerRect.top;
      
      // Calculate final size before dropping
      const finalScale = calculateDynamicSize();
      setScale(finalScale);
      
      // Try to drop the piece
      const isDropped = onDrop(region.id, relX, relY);
      console.log(`Drop attempted for ${region.name} at (${relX}, ${relY}): ${isDropped ? 'SUCCESS' : 'FAILED'}`);
      
      if (isDropped) {
        // Set position to exact correct position
        setPosition({
          x: containerRect.left + region.correctX,
          y: containerRect.top + region.correctY
        });
        
        // Add visual feedback
        setPulseEffect(true);
        setTimeout(() => {
          setPulseEffect(false);
        }, 600);
      } else {
        // Reset scale if not dropped
        setScale(1.0 );
      }
    }
  }, [isDragging, region.id, region.name, region.correctX, region.correctY, onDrop, containerRef, setDraggedPieceId, calculateDynamicSize]);
  
  // Touch handlers (similar logic to mouse handlers)
  const handleTouchStart = useCallback((e: React.TouchEvent<SVGElement>) => {
    if (region.isPlaced || e.touches.length !== 1) return;
    e.stopPropagation();
    e.preventDefault();
    
    setIsDragging(true);
    setDraggedPieceId(region.id);
    
    // Apply zoom effect when starting touch drag
    setScale(2.0 );
    setTimeout(() => {
      // After 300ms, gradually reduce
      setScale(1.0 );
    }, 300);
    
    const touch = e.touches[0];
    setPosition({
      x: touch.clientX,
      y: touch.clientY
    });
    
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
  }, [region.isPlaced, region.id, setDraggedPieceId]);
  
  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    e.preventDefault();
    
    // Position at touch point
    const touch = e.touches[0];
    setPosition({
      x: touch.clientX,
      y: touch.clientY
    });
    
    // Check if near target position
    if (containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const relX = touch.clientX - containerRect.left;
      const relY = touch.clientY - containerRect.top;
      
      // Calculate distance to correct position
      const dx = relX - region.correctX;
      const dy = relY - region.correctY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Update nearTarget state
      const isNear = distance <= 60;
      if (isNear !== isNearTarget) {
        setIsNearTarget(isNear);
        
        if (isNear) {
          // When near target, calculate and apply dynamic sizing
          const newScale = calculateDynamicSize();
          setScale(newScale);
          
          // Show matching popup
          if (targetRegionName && region.name) {
            setPopupText(`Matching ${region.name} to ${targetRegionName}`);
            setShowPopup(true);
          }
          
          // Provide subtle vibration feedback on mobile
          if ('vibrate' in navigator) {
            try {
              navigator.vibrate(20);
            } catch (error) {
              console.log('Vibration not supported or disabled');
            }
          }
        } else {
          // Reset when not near
          setScale(1.0);
          setShowPopup(false); // Hide popup when moving away
        }
      }
    }
  }, [isDragging, containerRef, region.correctX, region.correctY, isNearTarget, calculateDynamicSize]);
  
  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!isDragging) return;
    
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchend', handleTouchEnd);
    
    setIsDragging(false);
    setDraggedPieceId(null);
    
    if (containerRef.current && e.changedTouches.length === 1) {
      const touch = e.changedTouches[0];
      const containerRect = containerRef.current.getBoundingClientRect();
      
      const relX = touch.clientX - containerRect.left;
      const relY = touch.clientY - containerRect.top;
      
      // Calculate final size before dropping
      const finalScale = calculateDynamicSize();
      setScale(finalScale);
      
      // Try to drop the piece
      const isDropped = onDrop(region.id, relX, relY);
      
      if (isDropped) {
        // Set to exact position
        setPosition({
          x: containerRect.left + region.correctX,
          y: containerRect.top + region.correctY
        });
        
        // Provide tactile feedback
        if ('vibrate' in navigator) {
          try {
            navigator.vibrate(100);
          } catch (error) {
            console.log('Vibration not supported or disabled');
          }
        }
        
        // Add visual feedback
        setPulseEffect(true);
        setTimeout(() => {
          setPulseEffect(false);
        }, 600);
      } else {
        // Reset if not dropped
        setScale(1.0 );
      }
    }
  }, [isDragging, region.id, region.correctX, region.correctY, onDrop, containerRef, setDraggedPieceId, calculateDynamicSize]);
  
  // Special properties for circular regions (FCT, Nasarawa)
  const isCircleRegion = region.name === "Federal Capital Territory" || 
                         region.name === "FCT" || 
                         region.name === "Nasarawa";
  
  return (
    <svg
      ref={svgRef}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 100 100`}
      width={size}
      height={size}
      className={isDragging ? "z-50" : ""}
      style={{
        position: isDragging ? 'fixed' : 'absolute', 
        top: position.y,
        left: position.x,
        opacity: region.isPlaced ? 0.9 : 1,
        transform: `translate(-50%, -50%) scale(${scale})`,
        transformOrigin: 'center center',
        transition: isDragging ? 'transform 0.2s ease' : 'all 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        pointerEvents: 'none',
        overflow: 'visible',
        filter: isDragging ? 'drop-shadow(0 0 8px rgba(0,0,0,0.5))' : 'none'
      }}
    >
      <g transform="translate(50, 50) scale(0.8)">
        {isCircleRegion ? (
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
            
            {/* Interactive circle */}
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
            {/* Shadow for depth */}
            <path 
              d={region.svgPath} 
              fill="rgba(0,0,0,0.2)"
              transform="translate(2, 2)"
              strokeLinejoin="round"
              strokeLinecap="round"
              style={{ pointerEvents: 'none' }}
            />
            
            {/* Interactive path */}
            <path 
              ref={pathRef}
              d={region.svgPath} 
              fill={region.isPlaced ? region.fillColor : "#ef4444"}
              stroke={region.strokeColor}
              strokeWidth="3.5"
              transform=""
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
      
      {/* Popup message - positioned above the shape */}
      {showPopup && isDragging && (
        <foreignObject x="-150" y="-100" width="300" height="100" style={{ 
          pointerEvents: 'none',
          zIndex: 1000,
          overflow: 'visible'
         }}>
          <div
            style={{
              backgroundColor: '#4CAF50',
              color: 'white',
              padding: '10px 16px',
              borderRadius: '12px',
              boxShadow: '0 4px 14px rgba(0,0,0,0.5)',
              fontFamily: 'Arial, sans-serif',
              fontWeight: 'bold',
              textAlign: 'center',
              fontSize: '16px',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              animation: 'popupFadeIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              border: '3px solid white',
              position: 'absolute',
              left: '50%',
              top: 0,
              transform: 'translateX(-50%) translateY(-100%)',
              margin: '0 auto',
              width: 'fit-content'
            }}
          >
            {popupText}
          </div>
        </foreignObject>
      )}
    </svg>
  );
}