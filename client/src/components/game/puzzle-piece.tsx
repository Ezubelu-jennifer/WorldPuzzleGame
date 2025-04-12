import React, { useEffect, useRef, RefObject, useState } from "react";
import { useDrag } from "@/hooks/useDrag";
import { RegionPiece } from "@shared/schema";
import { cn } from "@/lib/utils";
import { getSvgDataById } from "@/data/svg-map-data";
import { getViewBoxFromSVG } from "@/data/svg-parser";
import { optimizeSvgPath } from "@/utils/svg-clipper";
import { Button } from "@/components/ui/button";

interface PuzzlePieceProps {
  region: RegionPiece;
  onDrop: (id: number, x: number, y: number) => boolean;
  containerRef: RefObject<HTMLDivElement>;
  snapToPosition?: boolean;
  isTrayPiece?: boolean;
  useThumbnail?: boolean; // Whether to use the thumbnail instead of rendering SVG
}

export function PuzzlePiece({ 
  region, 
  onDrop, 
  containerRef,
  snapToPosition = false,
  isTrayPiece = false,
  useThumbnail = false
}: PuzzlePieceProps) {
  const pieceRef = useRef<HTMLDivElement>(null);
  const [svgPathData, setSvgPathData] = useState<string | null>(null);
  const [viewBox, setViewBox] = useState<string>("0 0 100 100");
  const [rotation, setRotation] = useState<number>(0);
  const [scale, setScale] = useState<number>(1);
  // Animation states for dynamic sizing during interaction
  const [isEnlarged, setIsEnlarged] = useState<boolean>(false);
  
  // Initialize position
  const initialX = region.currentX || (isTrayPiece ? 0 : Math.random() * 100);
  const initialY = region.currentY || (isTrayPiece ? 0 : Math.random() * 100);

  // Try to get the actual SVG path for this region from the SVG data
  useEffect(() => {
    // Determine country ID from the region data
    const countryId = region.countryId || (region.id <= 36 ? 1 : 2); 
    const svgData = getSvgDataById(countryId);
    
    // Predefined paths for problematic regions
    const specialRegionPaths: Record<string, string> = {
      // Nigeria special cases
      'Nasarawa': 'M402.62,337.27L403.22,336.31L404.49,336.24L406.03,336.58L407.31,337.66L407.63,338.92L408.39,339.06L408.92,340.55L408.59,342.84L407.84,342.84L404.04,342.84L403.63,343.04L401.11,342.65L401.7,341.1L401.55,339.88L402.62,337.27z',
      'Federal Capital Territory': 'M379.02,365.63L379.89,367.08L379.96,368.27L381.17,368.98L382.72,369.89L383.7,371.75L383.79,373.68L382.55,375.21L380.88,375.98L380.92,374.14L380.39,372.65L379.02,371.37L377.88,368.73L378.26,367.57L379.02,365.63z',
      
      // Kenya special cases
      'Taita-Taveta': 'M446.43,526.43L447.06,525.13L448.78,524.28L450.14,524.76L451.35,525.92L451.93,527.65L451.58,529.57L450.41,531.21L448.78,532.08L447.06,531.9L445.83,530.71L445.45,528.97L446.43,526.43z',
      'Tharaka-Nithi': 'M376.83,313.47L378.98,312.62L380.25,313.1L381.86,314.26L382.44,315.98L382.01,317.9L380.93,319.54L379.22,320.41L377.58,320.23L376.35,319.06L375.88,317.32L376.83,313.47z',
    };
    
    if (svgData) {
      // Set viewBox from SVG
      const extractedViewBox = getViewBoxFromSVG(svgData);
      setViewBox(extractedViewBox);
      
      // Special case: check if this is one of our problematic regions
      if (specialRegionPaths[region.name]) {
        setSvgPathData(specialRegionPaths[region.name]);
        console.log(`Using predefined path for ${region.name}`);
        return;
      }
      
      // Try to find the actual SVG path for this region
      // Convert numeric region ID to SVG ID format
      let regionSvgId = countryId === 1 
        ? `NG-${region.name.replace(/ /g, '_')}` // Nigeria prefix
        : `KE-${region.name.replace(/ /g, '_')}`; // Kenya prefix
      
      // Alternative IDs - some SVGs use different naming conventions
      const alternativeIds = [];
      
      // For Nigeria
      if (countryId === 1) {
        // Try state code
        const stateCodeMap: Record<string, string> = {
          'Abia': 'AB', 'Adamawa': 'AD', 'Akwa Ibom': 'AK', 'Anambra': 'AN',
          'Bauchi': 'BA', 'Bayelsa': 'BY', 'Benue': 'BE', 'Borno': 'BO',
          'Cross River': 'CR', 'Delta': 'DE', 'Ebonyi': 'EB', 'Edo': 'ED',
          'Ekiti': 'EK', 'Enugu': 'EN', 'Federal Capital Territory': 'FC',
          'Gombe': 'GO', 'Imo': 'IM', 'Jigawa': 'JI', 'Kaduna': 'KD',
          'Kano': 'KN', 'Katsina': 'KT', 'Kebbi': 'KE', 'Kogi': 'KO',
          'Kwara': 'KW', 'Lagos': 'LA', 'Nasarawa': 'NA', 'Niger': 'NI',
          'Ogun': 'OG', 'Ondo': 'ON', 'Osun': 'OS', 'Oyo': 'OY',
          'Plateau': 'PL', 'Rivers': 'RI', 'Sokoto': 'SO', 'Taraba': 'TA',
          'Yobe': 'YO', 'Zamfara': 'ZA'
        };
        
        if (stateCodeMap[region.name]) {
          alternativeIds.push(`NG-${stateCodeMap[region.name]}`);
        }
        
        // Add common variations of FCT
        if (region.name === 'Federal Capital Territory') {
          alternativeIds.push('NG-FC', 'NG-FCT', 'NG-Abuja');
        }
      }
      
      // For Kenya
      if (countryId === 2) {
        // Add numeric IDs for counties (some maps use numbers)
        const countyNumberMap: Record<string, string> = {
          'Mombasa': '01', 'Kwale': '02', 'Kilifi': '03', 'Tana River': '04',
          'Lamu': '05', 'Taita-Taveta': '06', 'Garissa': '07', 'Wajir': '08',
          'Mandera': '09', 'Marsabit': '10', 'Isiolo': '11', 'Meru': '12',
          'Tharaka-Nithi': '13', 'Embu': '14', 'Kitui': '15', 'Machakos': '16',
          'Makueni': '17', 'Nyandarua': '18', 'Nyeri': '19', 'Kirinyaga': '20',
          'Murang\'a': '21', 'Kiambu': '22', 'Turkana': '23', 'West Pokot': '24',
          'Samburu': '25', 'Trans-Nzoia': '26', 'Uasin Gishu': '27', 'Elgeyo-Marakwet': '28',
          'Nandi': '29', 'Baringo': '30', 'Laikipia': '31', 'Nakuru': '32',
          'Narok': '33', 'Kajiado': '34', 'Kericho': '35', 'Bomet': '36',
          'Kakamega': '37', 'Vihiga': '38', 'Bungoma': '39', 'Busia': '40',
          'Siaya': '41', 'Kisumu': '42', 'Homa Bay': '43', 'Migori': '44',
          'Kisii': '45', 'Nyamira': '46', 'Nairobi': '47'
        };
        
        if (countyNumberMap[region.name]) {
          alternativeIds.push(`KE-${countyNumberMap[region.name]}`);
        }
        
        // Special cases for hyphenated names
        if (region.name.includes('-')) {
          // Try without hyphen
          alternativeIds.push(`KE-${region.name.replace('-', '')}`);
          // Try with underscore instead of hyphen
          alternativeIds.push(`KE-${region.name.replace('-', '_')}`);
        }
        
        // Special case for name variations based on SVG data
        if (region.name === 'Taita-Taveta') {
          alternativeIds.push('KE-39', 'KE-Taita Taveta');
        }
        if (region.name === 'Tharaka-Nithi') {
          alternativeIds.push('KE-41', 'KE-Tharaka');
        }
        if (region.name === 'Trans-Nzoia') {
          alternativeIds.push('KE-42', 'KE-Trans Nzoia');
        }
        if (region.name === 'Elgeyo-Marakwet') {
          alternativeIds.push('KE-05', 'KE-Keiyo-Marakwet');
        }
      }
      
      // Try multiple approaches to find the path
      // 1. Try by ID with exact match
      const regexById = new RegExp(`<path[^>]*id="${regionSvgId}"[^>]*d="([^"]+)"`, 'i');
      // 2. Try by title with exact match
      const regexByName = new RegExp(`<path[^>]*title="${region.name}"[^>]*d="([^"]+)"`, 'i');
      // 3. Try by ID with contains
      const regexByIdContains = new RegExp(`<path[^>]*id="[^"]*${region.name.replace(/ /g, '[_\\s-]')}[^"]*"[^>]*d="([^"]+)"`, 'i');
      // 4. Try by title with contains
      const regexByNameContains = new RegExp(`<path[^>]*title="[^"]*${region.name}[^"]*"[^>]*d="([^"]+)"`, 'i');
      
      // 5. Try all alternative IDs
      const alternativeMatches = alternativeIds.map(id => {
        const regex = new RegExp(`<path[^>]*id="${id}"[^>]*d="([^"]+)"`, 'i');
        return svgData.match(regex);
      }).filter(Boolean);
      
      // Try all matchers in order of preference
      let match = svgData.match(regexById) || 
                  svgData.match(regexByName) || 
                  svgData.match(regexByIdContains) || 
                  svgData.match(regexByNameContains) ||
                  (alternativeMatches.length > 0 ? alternativeMatches[0] : null);
      
      if (match && match[1]) {
        // Found a matching path - optimize with SVG Clipper!
        try {
          // Use original scale to preserve actual proportions
          const optimizedPath = optimizeSvgPath(match[1], 1.0);
          setSvgPathData(optimizedPath);
          console.log(`Optimized SVG path for ${region.name} with actual proportions`);
        } catch (error) {
          console.warn(`Failed to optimize path for ${region.name}, using original`, error);
          setSvgPathData(match[1]);
        }
      } else {
        // If no match found but we have a valid path from backend, use it
        if (region.svgPath && region.svgPath.includes('M')) {
          try {
            // Optimize the backend path while preserving proportions
            const optimizedPath = optimizeSvgPath(region.svgPath, 1.0);
            setSvgPathData(optimizedPath);
            console.log(`Using optimized backend SVG path for ${region.name}`);
          } catch (error) {
            console.warn(`Failed to optimize backend path for ${region.name}`, error);
            setSvgPathData(region.svgPath);
          }
        } else {
          // Last resort: try a very flexible search in the SVG data
          const flexRegex = new RegExp(`<path[^>]*d="(M[^"]+)"[^>]*`, 'i');
          const flexMatch = flexRegex.exec(svgData);
          if (flexMatch && flexMatch[1]) {
            try {
              const optimizedPath = optimizeSvgPath(flexMatch[1], 1.0);
              setSvgPathData(optimizedPath);
              console.log(`Using optimized flexible SVG path for ${region.name}`);
            } catch (error) {
              console.warn(`Failed to optimize flexible path for ${region.name}`, error);
              setSvgPathData(flexMatch[1]);
            }
          } else {
            // Fallback to the original path
            setSvgPathData(region.svgPath);
            console.log(`Fallback path used for ${region.name}`);
          }
        }
      }
    } else {
      // No SVG data found, fallback to the original path
      setSvgPathData(region.svgPath);
    }
  }, [region.id, region.name, region.svgPath, region.countryId]);

  // Use our custom drag hook
  const { isDragging, position, setPosition, dragHandlers } = useDrag({
    initialPosition: { x: initialX, y: initialY },
    onDragStart: () => {
      // Start animation - make piece significantly bigger when first tapped
      setIsEnlarged(true);
    },
    onDragEnd: (finalPosition) => {
      // Reset animation state
      setIsEnlarged(false);
      
      // Calculate position relative to container
      if (containerRef.current && pieceRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const pieceRect = pieceRef.current.getBoundingClientRect();
        
        const relativeX = finalPosition.x - containerRect.left;
        const relativeY = finalPosition.y - containerRect.top;
        
        // Check if piece should be placed in the correct position
        const isPlaced = onDrop(region.id, relativeX, relativeY);
        
        if (isPlaced && snapToPosition) {
          // If it's placed and we want to snap, set to the correct position
          setPosition({ x: region.correctX, y: region.correctY });
        }
      }
    }
  });

  // If the piece is placed correctly and snapToPosition is true, position it correctly
  useEffect(() => {
    if (region.isPlaced && snapToPosition) {
      setPosition({ x: region.correctX, y: region.correctY });
    }
  }, [region.isPlaced, snapToPosition, region.correctX, region.correctY, setPosition]);
  
  // We no longer need the gradual size reduction effect
  // The animation will be handled by CSS transitions

  // Handle rotation of the piece
  const rotateLeft = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent drag from starting
    setRotation((prev) => prev - 45);
  };

  const rotateRight = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent drag from starting
    setRotation((prev) => prev + 45);
  };

  // Handle scaling of the piece
  const increaseSize = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent drag from starting
    setScale((prev) => Math.min(prev + 0.1, 1.5)); // Max scale 1.5x
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

  // Determine piece size based on whether it's in the tray or on the board 
  // Using even smaller pieces for more direct palm positioning
  const basePieceSize = isTrayPiece ? 40 : 60; // Significantly reduced size for the most direct hand-palm positioning
  const pieceSize = basePieceSize * scale;

  return (
    <div
      ref={pieceRef}
      className={cn(
        "absolute transition-transform",
        isDragging ? "z-10" : "",
        region.isPlaced ? "cursor-default" : "cursor-move",
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
        transformOrigin: "center center"
      }}
      {...dragHandlers}
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
        }}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* No background elements - just the state shape centered precisely */}
        <g transform="translate(50, 50) scale(0.7)" style={{ transformOrigin: "center" }}>
          <path 
            d={svgPathData || region.svgPath} 
            fill={region.isPlaced ? region.fillColor : "#ef4444"} // Red for unplaced pieces
            stroke={region.strokeColor}
            strokeWidth="2" // Reduced for cleaner appearance at smaller size
            transform="scale(7.5)" // Significantly increased scale to fill the much smaller container
            strokeLinejoin="round"
            strokeLinecap="round"
            style={{ 
              transformOrigin: 'center center'
            }}
          />
        </g>
        <text 
          x="50%" 
          y="50%" 
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#000000" 
          fontSize={isTrayPiece ? "14" : "16"}
          fontWeight="bold"
          style={{ 
            textShadow: '0 0 3px white, 0 0 3px white, 0 0 3px white, 0 0 3px white',
            fontFamily: 'Arial, sans-serif'
          }}
        >
          {region.name}
        </text>
      </svg>
    </div>
  );
}
