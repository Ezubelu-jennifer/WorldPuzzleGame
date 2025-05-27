import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, Map } from "lucide-react";
import { CountryData, sampleRegions } from "@/data/countries";
import { RegionPiece } from "@shared/schema";
import { RegionMap } from "./region-map";
import { Button } from "@/components/ui/button";
import  CountrySvgMap  from "@/components/maps/country-svg-map";
import { getSvgDataById } from "@/data/svg-map-data";
import { RegionThumbnail } from "@/components/region-thumbnail";
import { extractWorldRegions} from "@/data/svg-parser";

interface CountryDetailsProps {
  country: CountryData;
  onBack: () => void;
  onPlay: () => void;
}

export function CountryDetails({ country, onBack, onPlay }: CountryDetailsProps) {
  const [regions, setRegions] = useState<RegionPiece[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  
  // Get SVG data for this country
  const svgData = getSvgDataById(country.id);
  
  // Fetch regions for this country
  const { data, isLoading, error } = useQuery({
    queryKey: [`/api/countries/${country.id}/regions`],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/countries/${country.id}/regions`);
        if (!response.ok) {
          throw new Error("Failed to fetch regions");
        }
        return await response.json();
      } catch (error) {
        console.warn("Using sample regions data as fallback");
        // Return sample data as fallback
        return sampleRegions[country.id] || [];
      }
    }
  });
  
  useEffect(() => {
    if (data) {
      setRegions(data);
    }
  }, [data]);
  
  // Get SVG regions from the SVG data
  const svgRegions = extractWorldRegions(svgData || '');
    
  
  // Handle region click in SVG map
  const handleRegionClick = (regionId: string, regionName: string) => {
    setSelectedRegion(selectedRegion === regionId ? null : regionId);
  };
  
  // Generate a variety of colors for regions
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
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={onBack} className="flex items-center text-gray-600">
          <ChevronLeft className="h-5 w-5 mr-1" />
          Back to Countries
        </Button>
        <Button onClick={onPlay} className="bg-primary hover:bg-primary/90 text-white flex items-center">
          <Map className="h-5 w-5 mr-2" />
          Play Now
        </Button>
      </div>
      
      <div className="flex flex-col md:flex-row gap-6">
        {/* Country Overview */}
        <div className="w-full md:w-1/3">
          <h2 className="font-heading font-bold text-2xl mb-2">{country.name}</h2>
          <p className="text-gray-600 mb-4">
            This puzzle features all {country.regionsCount} states/regions of {country.name}.
            Each piece represents a state or administrative region that you'll need to place
            in its correct position.
          </p>
          
          <div className="bg-gray-100 rounded-lg p-4 mb-4">
            <h3 className="font-medium text-lg mb-2">Country Map</h3>
            {svgData ? (
              <div className="aspect-[4/3] bg-white rounded-md shadow-sm flex items-center justify-center p-4 overflow-hidden">
                <CountrySvgMap
                  countryId={country.id}
                  countryName={country.name}
                  svgData={svgData}
                  highlightRegion={selectedRegion}
                  onRegionClick={handleRegionClick}
                  height="100%"
                  width="100%"
                />
              </div>
            ) : (
              <div className="aspect-[4/3] bg-white rounded-md shadow-sm flex items-center justify-center p-4">
                <svg 
                  width="100%" 
                  height="100%" 
                  viewBox="0 0 400 300" 
                  preserveAspectRatio="xMidYMid meet"
                >
                  <path 
                    d={country.outlinePath}
                    fill="black"
                    stroke="none"
                  />
                </svg>
              </div>
            )}
          </div>
          
          <div className="text-sm text-gray-500">
            <p>
              Difficulty: <span className="font-medium text-gray-700">
                {["Easy", "Moderate", "Challenging", "Hard", "Expert"][country.difficulty-1]}
              </span>
            </p>
            <p>
              States/Regions: <span className="font-medium text-gray-700">
                {country.regionsCount}
              </span>
            </p>
          </div>
        </div>
        
        {/* Regions Grid */}
        <div className="w-full md:w-2/3">
          <h3 className="font-medium text-lg mb-4">States/Regions ({svgRegions.length})</h3>
          {!svgData ? (
            <div className="text-center py-10">
              <div className="spinner w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading regions...</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {svgRegions.map((region, index) => {
                const { fill, stroke } = getRegionColor(index);
                const isSelected = region.id === selectedRegion;
                
                // Create a unique key that includes the ID and name to avoid duplicate key errors
                const uniqueKey = `${region.id}-${region.name.replace(/\s+/g, '-')}`;
                
                return (
                  <div 
                    key={uniqueKey} 
                    className={`bg-gray-50 rounded-md border ${isSelected ? 'border-primary ring-2 ring-primary/30' : 'border-gray-200'} p-2 hover:shadow-md transition`}
                    onClick={() => handleRegionClick(region.id, region.name)}
                  >
                    <RegionThumbnail
                      svgData={svgData}
                      regionId={region.id}
                      regionName={region.name}
                      color={isSelected ? fill : `${fill}80`}
                      strokeColor={stroke}
                      strokeWidth={isSelected ? 2 : 1}
                      className="aspect-[4/3]"
                      width="100%"
                      height={80}
                      showLabel={true}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}