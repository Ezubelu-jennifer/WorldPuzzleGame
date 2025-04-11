import React, { useState, useEffect } from "react";

interface DetailedMapProps {
  svgData: string;
  width?: string | number;
  height?: string | number;
  className?: string;
  highlightRegion?: string;
  onRegionClick?: (regionId: string, regionName: string) => void;
  showLabels?: boolean;
}

export function DetailedMap({
  svgData,
  width = "100%",
  height = "500px",
  className = "",
  highlightRegion,
  onRegionClick,
  showLabels = false
}: DetailedMapProps) {
  const [parsedSvg, setParsedSvg] = useState<string>("");
  const [viewBox, setViewBox] = useState<string>("");
  
  useEffect(() => {
    if (!svgData) return;
    
    try {
      // Extract viewBox
      const viewBoxMatch = svgData.match(/viewBox="([^"]+)"/);
      if (viewBoxMatch && viewBoxMatch[1]) {
        setViewBox(viewBoxMatch[1]);
      }
      
      // Add click handlers to each path
      let modifiedSvg = svgData;
      
      // Make sure this doesn't contain the <!DOCTYPE> and XML declaration
      if (modifiedSvg.includes("<?xml")) {
        modifiedSvg = modifiedSvg.substring(modifiedSvg.indexOf("<svg"));
      }
      
      // Remove the opening svg tag
      modifiedSvg = modifiedSvg.replace(/<svg[^>]*>/, "");
      
      // Remove the closing svg tag
      modifiedSvg = modifiedSvg.replace(/<\/svg>/, "");
      
      // Keep only paths (remove other elements like defs, etc.)
      const pathRegex = /<path[^>]*>/g;
      const paths = modifiedSvg.match(pathRegex) || [];
      
      // Add highlight styling to paths
      const styledPaths = paths.map(path => {
        const idMatch = path.match(/id="([^"]+)"/);
        const titleMatch = path.match(/title="([^"]+)"/);
        
        if (idMatch && idMatch[1]) {
          const id = idMatch[1];
          const title = titleMatch ? titleMatch[1] : id;
          
          // Check if this path is the highlighted region
          const isHighlighted = id === highlightRegion;
          
          // Add styling based on highlight state
          const styleProps = isHighlighted
            ? 'fill="#f87171" stroke="#b91c1c" stroke-width="2"'
            : 'fill="#94a3b8" stroke="#64748b" stroke-width="1" opacity="0.9"';
          
          // Replace styling in the path
          return path
            .replace(/fill="[^"]*"/, `fill="${isHighlighted ? '#f87171' : '#94a3b8'}"`)
            .replace(/stroke="[^"]*"/, `stroke="${isHighlighted ? '#b91c1c' : '#64748b'}"`)
            .replace(/stroke-width="[^"]*"/, `stroke-width="${isHighlighted ? '2' : '1'}"`)
            // Add data attributes for interaction
            .replace(/>$/, ` data-region-id="${id}" data-region-name="${title}" class="region-path" style="cursor: pointer; transition: all 0.2s ease-in-out;">`);
        }
        
        return path;
      });
      
      // Set the inner content
      setParsedSvg(styledPaths.join(""));
    } catch (error) {
      console.error("Error parsing SVG:", error);
    }
  }, [svgData, highlightRegion]);
  
  // Handle region click
  const handleRegionClick = (e: React.MouseEvent) => {
    if (!onRegionClick) return;
    
    const target = e.target as HTMLElement;
    if (target.classList.contains('region-path')) {
      const regionId = target.getAttribute('data-region-id');
      const regionName = target.getAttribute('data-region-name');
      
      if (regionId && regionName) {
        onRegionClick(regionId, regionName);
      }
    }
  };
  
  return (
    <div className={`detailed-map ${className}`} style={{ width, height }}>
      {parsedSvg ? (
        <svg
          viewBox={viewBox || "0 0 800 600"}
          width="100%"
          height="100%"
          onClick={handleRegionClick}
          dangerouslySetInnerHTML={{ __html: parsedSvg }}
        />
      ) : (
        <div className="flex items-center justify-center w-full h-full bg-gray-100 rounded-md">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      )}
    </div>
  );
}