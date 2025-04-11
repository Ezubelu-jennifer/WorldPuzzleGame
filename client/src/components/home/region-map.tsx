import React from "react";
import { RegionPiece } from "@shared/schema";

interface RegionMapProps {
  region: RegionPiece;
  colorFill?: string;
  colorStroke?: string;
  strokeWidth?: number;
  className?: string;
  showName?: boolean;
  width?: number;
  height?: number;
}

export function RegionMap({
  region,
  colorFill,
  colorStroke,
  strokeWidth = 1,
  className = "",
  showName = false,
  width = 100,
  height = 100
}: RegionMapProps) {
  const viewBox = `0 0 400 300`;
  
  return (
    <div className={`relative ${className}`} style={{ width, height }}>
      <svg 
        viewBox={viewBox}
        width={width}
        height={height}
        className="w-full h-full"
      >
        <path
          d={region.svgPath}
          fill={colorFill || region.fillColor}
          stroke={colorStroke || region.strokeColor}
          strokeWidth={strokeWidth}
        />
      </svg>
      
      {showName && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs px-1 py-0.5 text-center truncate">
          {region.name}
        </div>
      )}
    </div>
  );
}