import React, { useState, useEffect, useRef, useCallback } from "react";
import { optimizeSvgPath,getPathCentroid } from "@/utils/svg-clipper";
import  {getPathBounds } from "svg-path-bounds";
import { useDrag } from "@/hooks/useDrag";
import { useDragContext } from "@/context/drag-context";
import { useGame } from "@/context/game-context";
import { useScrollContext } from "@/context/scrollcontext";


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
  onDrop?: (id: number, x: number, y: number, rotation: number, pathData:string) => void; // Add rotation parameter
  regionPieceId?: number;
  shapeSize?: number; // Add shapeSize parameter to control dimensions
  initialRotation?: number;
  onRotate?: (newRotation: number) => void;


}

export function RegionThumbnail({
  svgData,
  regionId,
  regionName,
  width = 50,
  height = 50,
  color = "#ef4444",
  strokeColor = "#b91c1c",
  strokeWidth = 1.5,
  showLabel = true,
  onClick,
  className = "",
  draggable = false,
  rotatable = false,
  onDrop,
  regionPieceId,
  initialRotation = 0,
  onRotate,
  shapeSize = 1.0 // Default size factor
}: RegionThumbnailProps) {
  const [pathData, setPathData] = useState<string>("");
  const [viewBox, setViewBox] = useState<string>("0 0 800 600");
  const thumbnailRef = useRef<HTMLDivElement>(null);
  const { gameState, placePiece, useHint,selectedLevel} = useGame();
  
  const { draggedPieceId, draggedRotation,  setDraggedPieceId,setDraggedRotation } = useDragContext();
  const [localRotation, setLocalRotation] = useState(initialRotation);
  const { scrollableMapContainerRef } = useScrollContext();
 
  
 // Add a ref to track initial rotation setup
const initialRotationSet = useRef(false);

// Random initial rotation setup (runs once)
useEffect(() => {
  if ((selectedLevel === "hard" || selectedLevel === "very hard") && !initialRotationSet.current) {
    const randomRotation = 30 * Math.floor(Math.random() * 12);
    setLocalRotation(randomRotation);
    initialRotationSet.current = true;
    if (onRotate) onRotate(randomRotation);
  }
}, [selectedLevel, onRotate]);


// Sync with parent rotation changes
useEffect(() => {
 // if (initialRotation !== localRotation && !initialRotationSet.current) {
    setLocalRotation(initialRotation);
  //}
}, [initialRotation]);


  // Set up drag functionality if draggable is enabled
  const { isDragging, position, dragHandlers } = useDrag({
    dragItemId: regionId,
    onDragStart: () => {
      // Add any needed drag start behavior
      document.body.style.cursor = "grabbing";
      
      // Set the dragged piece ID in the global context
      if (regionPieceId !== undefined) {
        setDraggedPieceId(regionPieceId);
        //console.log("RegionThumbnail: Setting draggedPieceId to", regionPieceId);
        setDraggedRotation(localRotation); // Track initial rotation

      }
    },

    // In the useDrag configuration:
    // Inside onDragEnd:
    onDragEnd: (position,elementUnderCursor) => {    
      console.log('onDragEnd triggered!');
      console.log(`Raw drop position: x=${position.x}, y=${position.y}`);

      let x = position.x;
      let y = position.y;
      

       const board = document.querySelector('.puzzle-board');
       
       if (!board) return;
       const boardRect = board.getBoundingClientRect();
        const scrollContainerEl = scrollableMapContainerRef.current;

       if (!scrollContainerEl) {
          console.error("Scrollable map container ref is not available in PuzzleBoard!");
          setDraggedPieceId(null); // Clear dragging state
        return;
       }

       const scrollRect = scrollContainerEl.getBoundingClientRect();
       const scrollTop = scrollContainerEl.scrollTop;
       const scrollLeft = scrollContainerEl.scrollLeft;

       const currentScale = 1; // Replace with dynamic scale if needed
       // Correct coordinate adjustment
       const relativeX = position.x - scrollRect.left + scrollLeft;
       const relativeY = position.y - scrollRect.top + scrollTop;

        x = relativeX / currentScale;
        y = relativeY / currentScale;

        console.log(`ScrollLeft: ${scrollLeft}, ScrollTop: ${scrollTop}, Scale: ${currentScale}`);
        console.log(`Calculated Adjusted drop position (SVG coords): x=${x.toFixed(2)}, y=${y.toFixed(2)}`);

      // x = position.x - rect.left;
      // y = position.y - rect.top;
     
      // console.log(`Adjusted drop position: x=${x}, y=${y}`);

    
      if (onDrop && regionPieceId !== undefined && pathData) { // Ensure pathData exists
        //const centroid = getPathCentroid(pathData, `thumbnail-${regionId}`); // Generate a unique ID

        onDrop(regionPieceId, x, y, localRotation, pathData); // Fallback to drop position
        //console.log("newrotation:", initialRotation);

        }
      
      document.body.style.cursor = "default";
 
    }

    
});




function shiftPath(pathString: string, dx: number, dy: number): string {
  return pathString.replace(/([MmLlHhVvTtSsQqCcAa])([^MmLlHhVvTtSsQqCcAa]*)/g, (match, command, params) => {
    const numbers = params.trim().split(/[\s,]+/).map((n: string) => parseFloat(n));

    if (numbers.length === 0) return match;

    let shifted = '';
    switch (command.toUpperCase()) {
      case 'M':
      case 'L':
      case 'T':
        shifted = numbers.map((n: number, i: number) => (i % 2 === 0 ? n + dx : n + dy)).join(' ');
        break;
      case 'C':
      case 'S':
      case 'Q':
        shifted = numbers.map((n: number, i: number) => (i % 2 === 0 ? n + dx : n + dy)).join(' ');
        break;
      case 'H':
        shifted = numbers.map((n: number) => n + dx).join(' ');
        break;
      case 'V':
        shifted = numbers.map((n: number) => n + dy).join(' ');
        break;
      default:
        shifted = params;
        break;
    }
    return command + shifted;
  });
}

  // Extract path from SVG data based on region ID or name
  useEffect(() => {
    if (!svgData || !regionId) return;
   // console.log("RegionThumbnail: Clearing draggedPieceId checking");
    
    try {
      // Extract viewBox
      const viewBoxMatch = svgData.match(/viewBox="([^"]+)"/);
      if (viewBoxMatch && viewBoxMatch[1]) {
        setViewBox("0 0 800 600"); // Use a normalized viewBox for consistent positioning
      }
      
     // Prepare generic ID variations to check
    const baseRegionId = regionId.replace(/^[A-Z]{2}-/, ""); // Strip country code prefix like NG-, KE-, etc.
    const idPatterns = [
      new RegExp(`<path[^>]*id=["']${regionId}["'][^>]*d=["']([^"']+)["']`, 'i'), // Full ID
      new RegExp(`<path[^>]*id=["']${baseRegionId}["'][^>]*d=["']([^"']+)["']`, 'i'), // Just the numeric part
    ];
      
      // Try each pattern until we find a match
      let pathMatch = null;
      for (const pattern of idPatterns) {
        pathMatch = svgData.match(pattern);
        if (pathMatch && pathMatch[1]) break;
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
      //console.log('pathMatch[1]:', pathMatch ? pathMatch[1] : undefined);
      
      if (pathMatch && pathMatch[1]) {
       // console.log(`Extracted path for ${regionId}:`, pathMatch[1]);
        try {

       
          // Get the original path
          const originalPath = pathMatch[1];
          
          // Get the bounds of the path to normalize it
          const bounds = getPathBounds(originalPath);

          if (!bounds || bounds.length !== 4) {
            console.warn('Invalid bounds returned from getPathBounds');
            return;
          }
          
          const [minX, minY, maxX, maxY] = bounds;

          console.log('Bounds:', { minX, minY, maxX, maxY });

          
          // Calculate the width and height
          const width = maxX - minX;
          const height = maxY - minY;
          
          //const normalizedPath = optimizeSvgPath(originalPath, 1.0); // First get optimized path
          const shiftedPath = shiftPath(originalPath, -minX, -minY);
          const normalizedPath = optimizeSvgPath(shiftedPath, 1.0);
          // Set as the path data
          setViewBox("0 0 800 600");
          
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

 

  const handleClick = () => {
    if(selectedLevel === "hard")return;
    if (onClick) {
      onClick();
    }
  };
  
  // Apply shapeSize to dimensions
  const styles = {
    width: typeof width === 'number' ? `${width * shapeSize}px` : width,
    height: typeof height === 'number' ? `${height * shapeSize}px` : height,
    cursor: onClick || (draggable || rotatable) ? 'pointer' : 'default',
    position: 'relative' as const
    
  };

  const getFontSize = (name: string) => {
    if (!name) return "100";
    const len = name.length;
    return Math.max(40, 160 - len * 5).toString();
  };

  // Don't render a div container when dragging to avoid the box
  if (isDragging && regionPieceId !== undefined && !gameState?.placedPieces.includes(regionPieceId)) {
    return (
      <svg 
        width={typeof width === 'number' ? width * shapeSize : 100}
        height={typeof height === 'number' ? height * shapeSize : 80}
        viewBox={viewBox}
        preserveAspectRatio="xMidYMid meet"
        style={{
          position: 'fixed',
          left: `${position.x}px`,
          top: `${position.y}px`,
          zIndex: 9999,
          pointerEvents: 'none',
          opacity: 0.9,
          transform: `translate(-50%, -50%) scale(1)`,
          transformOrigin: 'center center',
          filter: 'drop-shadow(0 0 12px rgba(0,0,0,0.5))',
          background: 'transparent',
          overflow: 'visible'
        }}
      >
      

      <g
          transform={`translate(50, 50) rotate(${localRotation}) scale(0.7)`}
             style={{ transformOrigin: "center" }}
>
            {/* Main colored path */}
            <path
              d={pathData}
              fill={color}
              stroke={strokeColor}
              strokeWidth={strokeWidth + 3}
              transform="scale(7.0)" /* Increased scale factor for larger shapes */
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
                fontSize={getFontSize(regionName)}
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
        background: 'transparent',
       
      }}

      
      {...(draggable ? {
        ...dragHandlers,
        onMouseDown: (e) => {
          dragHandlers.onMouseDown(e);
          e.stopPropagation();
          e.preventDefault();
        },
        onTouchStart: (e) => {
          dragHandlers.onTouchStart(e);
          e.stopPropagation();
          e.preventDefault();
        }
      } : { onClick: handleClick })}
    >
      
      {pathData ? (
        <div className="w-full h-full relative" 
        style={{
          background: 'transparent'
                     }}>
          <svg 
            viewBox={viewBox} 
            width="100%" 
            height="100%" 
            preserveAspectRatio="xMidYMid meet"
            style={{
              zIndex: 9999,
              pointerEvents: 'none',
              opacity: 0.9,
              transformOrigin: 'center center',
              background: 'transparent',
              overflow: 'visible',
              display: 'block',
            }}
            
          >
            {/* No rectangular background */}
            
            {/* Create a fixed-size centered container just for the state shape */}
            <g transform="translate(50, 50) scale(0.7)" style={{ transformOrigin: "center" }}>
              
            {/* Rotated shape only */}
            <g transform={`rotate(${localRotation})`} style={{ transformOrigin: "center" }}>


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
               </g>
              
              {/* Add text label IN the shape */}
              {showLabel && (
                <text 
                  x="0" 
                  y="0" 
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#000000" 
                  fontSize={getFontSize(regionName)}
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