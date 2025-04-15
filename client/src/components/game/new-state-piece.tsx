import React, { useRef, useEffect, useState, useCallback, RefObject } from "react";
import { useDragContext } from "@/context/drag-context";
import { RegionPiece } from "@shared/schema";

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

// Enhanced state piece component with improved animations and size control
export function StatePiece({ 
  region, 
  onDrop, 
  containerRef, 
  snapToPosition = false,
  isTrayPiece = false,
  useThumbnail = false,
  shapeSize = 1.0
}: StatePieceProps) {
  const pieceRef = useRef<HTMLDivElement>(null);
  const initialPosition = useRef<Position | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState<Position>({
    x: region.currentX || 0,
    y: region.currentY || 0
  });
  const [rotation, setRotation] = useState(0);
  const [scale, setScale] = useState(1);
  const [isPlaced, setIsPlaced] = useState(false);
  
  // Access the drag context to track the currently dragged piece
  const { draggedPieceId, setDraggedPieceId } = useDragContext();
  
  // Track if this piece has been correctly placed
  const wasPlaced = useRef(region.isPlaced);
  
  // Track touch points for multi-touch gestures
  const touchPoints = useRef<Position[]>([]);
  
  // Initial scale when the piece is first shown in the tray
  const initialScale = isTrayPiece ? 0.8 : 1.0;
  
  // Update position when region's currentX/Y changes (for example when using a hint)
  useEffect(() => {
    if (region.currentX !== undefined && region.currentY !== undefined) {
      setPosition({
        x: region.currentX,
        y: region.currentY
      });
    }
    
    // Update placed status
    if (region.isPlaced && !wasPlaced.current) {
      wasPlaced.current = true;
      setIsPlaced(true);
      // Play placed animation
      if (pieceRef.current) {
        pieceRef.current.classList.add('correctly-placed-pulse');
        // Remove class after animation completes
        setTimeout(() => {
          if (pieceRef.current) {
            pieceRef.current.classList.remove('correctly-placed-pulse');
          }
        }, 1500); // Animation duration + a bit more
      }
    }
  }, [region.currentX, region.currentY, region.isPlaced]);
  
  // Helper to get element boundaries
  const getElementBounds = (element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    return {
      left: rect.left,
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
      width: rect.width,
      height: rect.height
    };
  };
  
  // Helper to get container offset for proper positioning
  const getContainerOffset = useCallback(() => {
    if (!containerRef.current) return { left: 0, top: 0 };
    
    const containerRect = containerRef.current.getBoundingClientRect();
    return {
      left: containerRect.left,
      top: containerRect.top
    };
  }, [containerRef]);
  
  // Mouse event handlers with enhanced animation
  const handleMouseDown = useCallback((e: MouseEvent) => {
    if (region.isPlaced) return;
    e.preventDefault();
    e.stopPropagation();
    
    const containerOffset = getContainerOffset();
    
    // Set initial position on mouse down
    initialPosition.current = {
      x: e.clientX - containerOffset.left - position.x,
      y: e.clientY - containerOffset.top - position.y
    };
    
    // Animate scale up when starting to drag
    setScale(2.0);
    setIsDragging(true);
    setDraggedPieceId(region.id);
    
    // Add global event listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [region, position, getContainerOffset, setDraggedPieceId]);
  
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !initialPosition.current) return;
    e.preventDefault();
    
    const containerOffset = getContainerOffset();
    
    // Calculate new position
    const newX = e.clientX - containerOffset.left - initialPosition.current.x;
    const newY = e.clientY - containerOffset.top - initialPosition.current.y;
    
    // Set position (the piece follows the cursor directly)
    setPosition({ x: newX, y: newY });
    
    // Gradually reduce scale as user continues dragging
    const dragScale = Math.max(1.2, scale * 0.98);
    setScale(dragScale);
  }, [isDragging, getContainerOffset, scale]);
  
  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    
    const containerOffset = getContainerOffset();
    
    // Calculate final position
    const finalX = e.clientX - containerOffset.left - (initialPosition.current?.x || 0);
    const finalY = e.clientY - containerOffset.top - (initialPosition.current?.y || 0);
    
    // Try to drop the piece at the current position
    const isCorrectlyPlaced = onDrop(region.id, finalX, finalY);
    
    if (!isCorrectlyPlaced) {
      // Not correctly placed, animate back to original position if needed
      if (snapToPosition && !isTrayPiece) {
        setPosition({ x: region.currentX || 0, y: region.currentY || 0 });
      }
      // Reset scale
      setScale(initialScale);
    } else {
      // Piece was placed correctly - will be handled by the region.isPlaced effect
    }
    
    // Reset dragging state
    setIsDragging(false);
    setDraggedPieceId(null);
    initialPosition.current = null;
    
    // Clean up event listeners
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }, [isDragging, region, onDrop, snapToPosition, isTrayPiece, getContainerOffset, setDraggedPieceId, initialScale]);
  
  // Touch event handlers with multi-touch support for mobile
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (region.isPlaced) return;
    e.preventDefault();
    e.stopPropagation();
    
    const containerOffset = getContainerOffset();
    
    // Record all touch points to support rotation & scaling
    touchPoints.current = [];
    for (let i = 0; i < e.touches.length; i++) {
      touchPoints.current.push({
        x: e.touches[i].clientX,
        y: e.touches[i].clientY
      });
    }
    
    // Set initial position based on the first touch point
    initialPosition.current = {
      x: e.touches[0].clientX - containerOffset.left - position.x,
      y: e.touches[0].clientY - containerOffset.top - position.y
    };
    
    // Animate scale up when starting to drag
    setScale(2.0);
    setIsDragging(true);
    setDraggedPieceId(region.id);
    
    // Add global event listeners
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
    document.addEventListener('touchcancel', handleTouchEnd);
  }, [region, position, getContainerOffset, setDraggedPieceId]);
  
  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging || !initialPosition.current) return;
    e.preventDefault();
    
    const containerOffset = getContainerOffset();
    
    // Calculate new position based on the first touch point
    const newX = e.touches[0].clientX - containerOffset.left - initialPosition.current.x;
    const newY = e.touches[0].clientY - containerOffset.top - initialPosition.current.y;
    
    // Set position (the piece follows the finger directly)
    setPosition({ x: newX, y: newY });
    
    // If we have two touch points, calculate rotation and scale
    if (e.touches.length >= 2 && touchPoints.current.length >= 2) {
      // Get the previous and current touch points
      const prevPoint1 = touchPoints.current[0];
      const prevPoint2 = touchPoints.current[1];
      const currPoint1 = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      const currPoint2 = { x: e.touches[1].clientX, y: e.touches[1].clientY };
      
      // Calculate the angle between the touch points
      const prevAngle = Math.atan2(prevPoint2.y - prevPoint1.y, prevPoint2.x - prevPoint1.x);
      const currAngle = Math.atan2(currPoint2.y - currPoint1.y, currPoint2.x - currPoint1.x);
      
      // Calculate the new rotation (in degrees)
      const rotationChange = (currAngle - prevAngle) * (180 / Math.PI);
      setRotation(rotation + rotationChange);
      
      // Update touch points for next movement
      touchPoints.current = [];
      for (let i = 0; i < e.touches.length; i++) {
        touchPoints.current.push({
          x: e.touches[i].clientX,
          y: e.touches[i].clientY
        });
      }
    }
    
    // Gradually reduce scale as user continues dragging
    const dragScale = Math.max(1.2, scale * 0.98);
    setScale(dragScale);
  }, [isDragging, getContainerOffset, scale, rotation]);
  
  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    
    const containerOffset = getContainerOffset();
    
    // Use the last known position for the drop
    let finalX = position.x;
    let finalY = position.y;
    
    // If there are still touches, use the first one
    if (e.touches.length > 0) {
      finalX = e.touches[0].clientX - containerOffset.left - (initialPosition.current?.x || 0);
      finalY = e.touches[0].clientY - containerOffset.top - (initialPosition.current?.y || 0);
    }
    
    // Try to drop the piece at the current position
    const isCorrectlyPlaced = onDrop(region.id, finalX, finalY);
    
    if (!isCorrectlyPlaced) {
      // Not correctly placed, animate back to original position if needed
      if (snapToPosition && !isTrayPiece) {
        setPosition({ x: region.currentX || 0, y: region.currentY || 0 });
      }
      // Reset scale and rotation
      setScale(initialScale);
      setRotation(0);
    } else {
      // Piece was placed correctly - will be handled by the region.isPlaced effect
    }
    
    // Reset dragging state
    setIsDragging(false);
    setDraggedPieceId(null);
    initialPosition.current = null;
    touchPoints.current = [];
    
    // Clean up event listeners
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchend', handleTouchEnd);
    document.removeEventListener('touchcancel', handleTouchEnd);
  }, [isDragging, position, region, onDrop, snapToPosition, isTrayPiece, getContainerOffset, setDraggedPieceId, initialScale]);
  
  // Set up event listeners
  useEffect(() => {
    const element = pieceRef.current;
    if (!element) return;
    
    // Only set up drag handlers if the region is not already placed
    if (!region.isPlaced) {
      // Mouse events
      element.addEventListener('mousedown', handleMouseDown as any);
      
      // Touch events
      element.addEventListener('touchstart', handleTouchStart as any, { passive: false });
      
      return () => {
        // Clean up all event listeners
        element.removeEventListener('mousedown', handleMouseDown as any);
        element.removeEventListener('touchstart', handleTouchStart as any);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleTouchMove as any);
        document.removeEventListener('touchend', handleTouchEnd as any);
        document.removeEventListener('touchcancel', handleTouchEnd as any);
      };
    }
  }, [
    region.isPlaced,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd
  ]);
  
  // Apply dynamic shape size adjustment
  const adjustedScale = scale * (shapeSize || 1.0);
  
  // Enhanced styling for better visual feedback
  const pieceStyle: React.CSSProperties = {
    position: 'absolute',
    left: position.x,
    top: position.y,
    cursor: region.isPlaced ? 'default' : 'grab',
    zIndex: isDragging ? 1000 : (region.isPlaced ? 5 : 10),
    transform: `scale(${adjustedScale}) rotate(${rotation}deg)`,
    transition: isDragging ? 'none' : 'transform 0.2s ease, box-shadow 0.3s ease',
    touchAction: 'none',
    userSelect: 'none',
    transformOrigin: 'center',
    // Enhanced shadow with a subtle glow for active pieces
    boxShadow: isDragging 
      ? '0 12px 24px rgba(0, 0, 0, 0.3), 0 0 15px rgba(66, 153, 225, 0.5)' 
      : (region.isPlaced 
          ? 'none' 
          : '0 4px 8px rgba(0, 0, 0, 0.1)'),
  };
  
  return (
    <div 
      ref={pieceRef}
      className={`state-piece-wrapper ${region.isPlaced ? 'placed' : ''} ${isDragging ? 'dragging' : ''} ${isPlaced ? 'correctly-placed' : ''}`}
      style={pieceStyle}
    >
      {/* SVG shape */}
      <svg 
        viewBox="0 0 800 800" 
        preserveAspectRatio="xMidYMid meet"
        className="region-shape"
        style={{ 
          width: `${60 * shapeSize}px`,
          height: `${60 * shapeSize}px`,
          display: 'block',
          pointerEvents: 'none'
        }}
      >
        <path
          d={region.svgPath}
          fill={region.fillColor || '#4CAF50'}
          stroke={region.strokeColor || '#2E7D32'}
          strokeWidth={3}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      
      {/* Region name - only show on tray pieces */}
      {isTrayPiece && (
        <div 
          className="region-label" 
          style={{ 
            position: 'absolute',
            bottom: '-20px',
            left: '0',
            width: '100%',
            textAlign: 'center',
            fontSize: '10px',
            fontWeight: 'bold',
            color: '#333',
            textShadow: '0 0 2px white',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          {region.name}
        </div>
      )}
    </div>
  );
}