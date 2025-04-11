import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { DetailedMap } from "@/components/detailed-map";
import { RegionThumbnail } from "@/components/region-thumbnail";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Map as MapIcon } from "lucide-react";

interface CountryMapShowcaseProps {
  nigeriaSvg: string;
  kenyaSvg: string;
}

interface CountryData {
  id: number;
  name: string;
  svgData: string;
  description: string;
}

export function CountryMapShowcase({ nigeriaSvg, kenyaSvg }: CountryMapShowcaseProps) {
  const [selectedCountryIndex, setSelectedCountryIndex] = useState(0);
  const [selectedRegion, setSelectedRegion] = useState<{ id: string; name: string } | null>(null);
  const [regionIds, setRegionIds] = useState<{ id: string; name: string }[]>([]);
  const [, setLocation] = useLocation();

  const countries: CountryData[] = [
    {
      id: 1,
      name: "Nigeria",
      svgData: nigeriaSvg,
      description: "Nigeria is divided into 36 states and the Federal Capital Territory. Each state is further divided into Local Government Areas. Click on a state to see its details."
    },
    {
      id: 2,
      name: "Kenya",
      svgData: kenyaSvg,
      description: "Kenya is divided into 47 counties, established by the 2010 Constitution of Kenya. Each county has its own government with a governor and assembly. Click on a county to see its details."
    }
  ];

  const selectedCountry = countries[selectedCountryIndex];

  // Extract region IDs and names from SVG data
  useEffect(() => {
    const extractRegions = () => {
      const svgData = selectedCountry.svgData;
      const regions: { id: string; name: string }[] = [];
      
      // Extract using regex - find all path elements with id and title attributes
      const regex = /<path[^>]*id="([^"]+)"[^>]*title="([^"]+)"/g;
      let match;
      
      while ((match = regex.exec(svgData)) !== null) {
        regions.push({
          id: match[1],
          name: match[2]
        });
      }
      
      setRegionIds(regions);
    };
    
    extractRegions();
    setSelectedRegion(null);
  }, [selectedCountryIndex, selectedCountry]);

  const handleRegionClick = (regionId: string, regionName: string) => {
    setSelectedRegion({ id: regionId, name: regionName });
  };

  const handlePreviousCountry = () => {
    setSelectedCountryIndex(prev => (prev === 0 ? countries.length - 1 : prev - 1));
  };

  const handleNextCountry = () => {
    setSelectedCountryIndex(prev => (prev === countries.length - 1 ? 0 : prev + 1));
  };

  const handlePlay = () => {
    setLocation(`/game/${selectedCountry.id}`);
  };

  // Generate a color palette for the region thumbnails
  const getRegionColor = (index: number) => {
    const colors = [
      { fill: "#f87171", stroke: "#b91c1c" }, // red-400, red-700
      { fill: "#fb923c", stroke: "#c2410c" }, // orange-400, orange-700
      { fill: "#fbbf24", stroke: "#b45309" }, // amber-400, amber-700
      { fill: "#4ade80", stroke: "#15803d" }, // green-400, green-700
      { fill: "#2dd4bf", stroke: "#0f766e" }, // teal-400, teal-700
      { fill: "#60a5fa", stroke: "#1d4ed8" }, // blue-400, blue-700
      { fill: "#a78bfa", stroke: "#6d28d9" }, // violet-400, violet-700
      { fill: "#f472b6", stroke: "#be185d" }, // pink-400, pink-700
    ];
    
    return colors[index % colors.length];
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 my-8">
      <h2 className="text-2xl font-bold text-center mb-2">
        Explore the States of {selectedCountry.name}
      </h2>
      <p className="text-gray-600 text-center mb-6">
        {selectedCountry.description}
      </p>

      {/* Main content area */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Map display */}
        <div className="w-full lg:w-2/3 relative">
          <div className="bg-gray-50 rounded-lg p-4 h-[500px] flex items-center justify-center">
            <DetailedMap
              svgData={selectedCountry.svgData}
              highlightRegion={selectedRegion?.id}
              onRegionClick={handleRegionClick}
              height="450px"
            />
            
            {/* Country navigation controls */}
            <div className="absolute top-1/2 left-2 transform -translate-y-1/2">
              <Button onClick={handlePreviousCountry} size="icon" variant="ghost" className="rounded-full bg-white/80 hover:bg-white">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </div>
            <div className="absolute top-1/2 right-2 transform -translate-y-1/2">
              <Button onClick={handleNextCountry} size="icon" variant="ghost" className="rounded-full bg-white/80 hover:bg-white">
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Selected region info */}
          {selectedRegion && (
            <div className="p-4 bg-gray-100 rounded-lg mt-4">
              <h3 className="font-bold text-lg">{selectedRegion.name}</h3>
              <p className="text-sm text-gray-600">
                Click Play to start the puzzle game with all regions of {selectedCountry.name}.
              </p>
            </div>
          )}
        </div>

        {/* Region thumbnails and info */}
        <div className="w-full lg:w-1/3">
          <div className="bg-gray-50 rounded-lg p-4 h-full">
            <h3 className="font-bold text-xl mb-4">{selectedCountry.name} States</h3>
            
            {/* Region thumbnails grid */}
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-3 gap-2 mb-6 max-h-72 overflow-y-auto">
              {regionIds.map((region, index) => {
                const { fill, stroke } = getRegionColor(index);
                return (
                  <RegionThumbnail
                    key={region.id}
                    svgData={selectedCountry.svgData}
                    regionId={region.id}
                    regionName={region.name}
                    color={selectedRegion?.id === region.id ? fill : `${fill}80`}
                    strokeColor={stroke}
                    strokeWidth={selectedRegion?.id === region.id ? 2 : 1}
                    width="100%"
                    height={60}
                    showLabel={true}
                    onClick={() => handleRegionClick(region.id, region.name)}
                    className={`transition-all duration-200 ${selectedRegion?.id === region.id ? 'ring-2 ring-primary scale-105' : ''}`}
                  />
                );
              })}
            </div>
            
            <div className="text-sm text-gray-500 mb-6">
              <p><strong>Total States/Regions:</strong> {regionIds.length}</p>
            </div>
            
            <Button 
              onClick={handlePlay} 
              className="w-full bg-primary hover:bg-primary/90 text-white flex items-center justify-center gap-2 py-6"
            >
              <MapIcon className="h-5 w-5" />
              <span>Play Puzzle</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}