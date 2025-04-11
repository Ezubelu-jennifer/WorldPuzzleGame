import React, { useState, useEffect } from "react";
import { Link } from "wouter";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { CountryData, sampleRegions } from "@/data/countries";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RegionPiece } from "@shared/schema";

interface CountryCardProps {
  country: CountryData;
}

export function CountryCard({ country }: CountryCardProps) {
  const { id, name, slug, imageUrl, difficulty, regionsCount, tagType, tagText, outlinePath } = country;
  const [regions, setRegions] = useState<RegionPiece[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<RegionPiece | null>(null);
  
  // Fetch regions data for this country
  useEffect(() => {
    // Use the sample regions data as a fallback if API isn't available
    const countryRegions = sampleRegions[id] || [];
    setRegions(countryRegions);
    
    // Set a default selected region
    if (countryRegions.length > 0) {
      setSelectedRegion(countryRegions[0]);
    }
  }, [id]);
  
  // Set tag color based on type
  const getTagClasses = () => {
    switch (tagType) {
      case "popular":
        return "bg-green-100 text-green-800";
      case "new":
        return "bg-blue-100 text-blue-800";
      case "beginner":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Get a few random color variations for the regions
  const getRegionColors = (index: number) => {
    const colors = [
      { fill: "#ef4444", stroke: "#b91c1c" }, // red
      { fill: "#f97316", stroke: "#c2410c" }, // orange  
      { fill: "#eab308", stroke: "#a16207" }, // yellow
      { fill: "#22c55e", stroke: "#15803d" }, // green
      { fill: "#06b6d4", stroke: "#0e7490" }, // cyan
      { fill: "#6366f1", stroke: "#4338ca" }, // indigo
    ];
    
    return colors[index % colors.length];
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition cursor-pointer">
      <div className="h-48 bg-gray-50 relative overflow-hidden">
        {/* Country outline as black silhouette */}
        <div className="absolute inset-0 flex items-center justify-center">
          <svg 
            width="100%" 
            height="100%" 
            viewBox="0 0 400 300" 
            preserveAspectRatio="xMidYMid meet"
            className="max-w-[80%] max-h-[80%]"
          >
            <path 
              d={outlinePath} 
              fill="black" 
              stroke="none" 
            />
          </svg>
        </div>
        
        {/* Region thumbnails */}
        <div className="absolute bottom-0 left-0 right-0 flex flex-wrap justify-center gap-1 p-2 bg-gradient-to-t from-black/70 to-transparent">
          {/* Show all regions if Nigeria (id=1), otherwise limit to 8 */}
          {(id === 1 ? regions : regions.slice(0, 8)).map((region, index) => (
            <div 
              key={region.id}
              className={cn(
                "relative w-8 h-8 cursor-pointer transition-transform",
                selectedRegion?.id === region.id && "ring-2 ring-white scale-110"
              )}
              onClick={() => setSelectedRegion(region)}
            >
              <svg viewBox="0 0 400 300" className="w-full h-full">
                <path 
                  d={region.svgPath} 
                  fill={region.fillColor || getRegionColors(index).fill}
                  stroke={region.strokeColor || getRegionColors(index).stroke}
                  strokeWidth="1"
                />
              </svg>
            </div>
          ))}
          {id !== 1 && regions.length > 8 && (
            <div className="flex items-center justify-center w-8 h-8 bg-black/30 text-white rounded-full text-xs">
              +{regions.length - 8}
            </div>
          )}
        </div>
        
        {/* Selected region name */}
        {selectedRegion && (
          <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
            {selectedRegion.name}
          </div>
        )}
        
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent pt-10 pb-2 px-3">
          <h3 className="font-heading font-bold text-white text-xl">{name}</h3>
          <p className="text-white/90 text-sm">{regionsCount} {regionsCount === 1 ? 'state' : 'states'}</p>
        </div>
      </div>
      <div className="p-4">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center">
            <span className="text-sm font-medium text-gray-600">Difficulty:</span>
            <div className="ml-2 flex">
              {[...Array(5)].map((_, index) => (
                <Star 
                  key={index}
                  className={cn(
                    "h-4 w-4",
                    index < difficulty ? "text-accent fill-accent" : "text-gray-300"
                  )}
                />
              ))}
            </div>
          </div>
          {tagText && (
            <span className={cn("text-xs font-medium px-2.5 py-0.5 rounded-full", getTagClasses())}>
              {tagText}
            </span>
          )}
        </div>
        <div className="flex justify-between mt-2">
          <Link href={`/game/${id}`}>
            <Button className="bg-primary hover:bg-primary/90 text-white">
              Play Now
            </Button>
          </Link>
          <Button variant="ghost" className="text-primary hover:bg-primary/10">
            Learn More
          </Button>
        </div>
      </div>
    </Card>
  );
}
