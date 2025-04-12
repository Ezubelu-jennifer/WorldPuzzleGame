import React, { useState, useEffect, useCallback, useRef } from "react";
import { extractNigeriaRegions, extractKenyaRegions, getViewBoxFromSVG } from "@/data/svg-parser";
import { ZoomIn, ZoomOut, Maximize } from "lucide-react";

interface CountrySvgMapProps {
  countryId: number;
  countryName: string;
  svgData: string;
  className?: string;
  highlightRegion?: string | null;
  onRegionClick?: (regionId: string, regionName: string) => void;
  showLabels?: boolean;
  height?: number | string;
  width?: number | string;
}

interface RegionData {
  id: string;
  name: string;
  path: string;
}

export function CountrySvgMap({
  countryId,
  countryName,
  svgData,
  className = "",
  highlightRegion = null,
  onRegionClick,
  showLabels = false,
  height = "100%",
  width = "100%"
}: CountrySvgMapProps) {
  const [regions, setRegions] = useState<RegionData[]>([]);
  const [viewBox, setViewBox] = useState<string>("0 0 800 600");
  const [originalViewBox, setOriginalViewBox] = useState<string>("0 0 800 600");
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number, y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number, y: number }>({ x: 0, y: 0 });
  
  const svgRef = useRef<SVGSVGElement>(null);
  
  // Extract regions from SVG data
  useEffect(() => {
    if (!svgData) return;
    
    let extractedRegions: RegionData[] = [];
    
    if (countryId === 1) {
      // Nigeria
      extractedRegions = extractNigeriaRegions(svgData);
      console.log(`Found ${extractedRegions.length} Nigeria regions from SVG data`);
    } else if (countryId === 2) {
      // Kenya
      extractedRegions = extractKenyaRegions(svgData);
      console.log(`Found ${extractedRegions.length} Kenya regions from SVG data`);
    }
    
    // Log the extracted regions for debugging
    if (extractedRegions.length > 0) {
      console.log("Sample region from SVG:", extractedRegions[0]);
    } else {
      console.warn("No regions extracted from SVG data");
    }
    
    setRegions(extractedRegions);
    
    // Set viewBox
    const extractedViewBox = getViewBoxFromSVG(svgData);
    setViewBox(extractedViewBox);
    setOriginalViewBox(extractedViewBox);
    
    // Reset zoom and pan when country changes
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [svgData, countryId]);
  
  // Update viewBox when zoom or pan changes
  useEffect(() => {
    if (originalViewBox) {
      const [origX, origY, origWidth, origHeight] = originalViewBox.split(' ').map(parseFloat);
      
      // Calculate new dimensions based on zoom
      const newWidth = origWidth / zoom;
      const newHeight = origHeight / zoom;
      
      // Calculate center point for zooming
      const centerX = origX + origWidth / 2;
      const centerY = origY + origHeight / 2;
      
      // Calculate new origin with pan adjustment
      const newX = centerX - newWidth / 2 + pan.x;
      const newY = centerY - newHeight / 2 + pan.y;
      
      setViewBox(`${newX} ${newY} ${newWidth} ${newHeight}`);
    }
  }, [zoom, pan, originalViewBox]);
  
  // Handle region click
  const handleRegionClick = useCallback((id: string, name: string) => {
    if (onRegionClick) {
      onRegionClick(id, name);
    }
  }, [onRegionClick]);
  
  // Generate a color for regions based on index
  const getRegionColor = (index: number, isHighlighted: boolean) => {
    if (isHighlighted) return "#f87171"; // red-400
    
    const colors = [
      "#94a3b8", // slate-400
      "#a1a1aa", // zinc-400
      "#a3a3a3", // neutral-400
      "#9ca3af", // gray-400
      "#94a3b8", // slate-400
      "#a1a1aa", // zinc-400
    ];
    
    return colors[index % colors.length];
  };
  
  // Handle zoom in/out
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.5, 8)); // Limit max zoom
  };
  
  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.5, 0.5)); // Limit min zoom
  };
  
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };
  
  // Pan handling with mouse/touch
  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (e.button === 0) { // Left click only
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      e.preventDefault();
    }
  };
  
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isDragging && originalViewBox) {
      const [, , origWidth, origHeight] = originalViewBox.split(' ').map(parseFloat);
      const svgRect = svgRef.current?.getBoundingClientRect();
      
      if (svgRect) {
        // Calculate movement as a fraction of the viewBox dimensions
        const dx = (e.clientX - dragStart.x) * (origWidth / svgRect.width) / zoom;
        const dy = (e.clientY - dragStart.y) * (origHeight / svgRect.height) / zoom;
        
        setPan(prev => ({ x: prev.x - dx, y: prev.y - dy }));
        setDragStart({ x: e.clientX, y: e.clientY });
      }
    }
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  // Handle touch events for mobile
  const handleTouchStart = (e: React.TouchEvent<SVGSVGElement>) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    }
  };
  
  const handleTouchMove = (e: React.TouchEvent<SVGSVGElement>) => {
    if (isDragging && e.touches.length === 1 && originalViewBox) {
      const [, , origWidth, origHeight] = originalViewBox.split(' ').map(parseFloat);
      const svgRect = svgRef.current?.getBoundingClientRect();
      
      if (svgRect) {
        const dx = (e.touches[0].clientX - dragStart.x) * (origWidth / svgRect.width) / zoom;
        const dy = (e.touches[0].clientY - dragStart.y) * (origHeight / svgRect.height) / zoom;
        
        setPan(prev => ({ x: prev.x - dx, y: prev.y - dy }));
        setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
      }
    }
  };
  
  const handleTouchEnd = () => {
    setIsDragging(false);
  };
  
  // Handle wheel zoom
  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1; // Zoom out or in
    setZoom(prev => Math.max(0.5, Math.min(prev * zoomFactor, 8))); // Limit zoom range
  };
  
  return (
    <div 
      className={`country-svg-map relative ${className}`} 
      style={{ width, height }}
    >
      <svg
        ref={svgRef}
        viewBox={viewBox}
        width="100%"
        height="100%"
        className={`w-full h-full ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
      >
        {/* Fill the map with regions */}
        {regions.map((region, index) => {
          const isHighlighted = region.id === highlightRegion;
          const fill = isHighlighted ? "#f87171" : "#757575"; // Use gray for the puzzle outline
          const stroke = isHighlighted ? "#b91c1c" : "#757575"; // Same gray for stroke to remove boundaries
          const strokeWidth = isHighlighted ? "1.5" : "0.1"; // Very thin stroke to essentially remove inner boundaries
          
          return (
            <path
              key={region.id}
              id={region.id}
              d={region.path}
              fill={fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
              data-name={region.name}
              aria-label={region.name}
              className="transition-colors duration-200 hover:opacity-90"
              style={{ cursor: "pointer" }}
              onClick={() => handleRegionClick(region.id, region.name)}
            />
          );
        })}
        
        {showLabels && regions.map(region => {
          // For simplicity, we'll use fixed label positions
          // In a production app, you'd calculate center points dynamically
          return (
            <text
              key={`label-${region.id}`}
              x="50%"
              y="50%"
              textAnchor="middle"
              fontSize="8"
              fill="#fff"
              className="pointer-events-none"
            >
              {region.name}
            </text>
          );
        })}
      </svg>
      
      {/* Zoom controls */}
      <div className="absolute right-2 bottom-2 flex flex-col gap-1">
        <button 
          onClick={handleZoomIn}
          className="bg-white rounded-full p-1.5 shadow-md hover:bg-gray-100 focus:outline-none"
          aria-label="Zoom in"
        >
          <ZoomIn size={16} />
        </button>
        <button 
          onClick={handleZoomOut}
          className="bg-white rounded-full p-1.5 shadow-md hover:bg-gray-100 focus:outline-none"
          aria-label="Zoom out"
        >
          <ZoomOut size={16} />
        </button>
        <button 
          onClick={handleReset}
          className="bg-white rounded-full p-1.5 shadow-md hover:bg-gray-100 focus:outline-none"
          aria-label="Reset zoom"
        >
          <Maximize size={16} />
        </button>
      </div>
    </div>
  );
}