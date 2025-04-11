import React, { useState, useEffect } from 'react';
import { useLocation } from "wouter";
import { CountrySvgMap } from '@/components/maps/country-svg-map';
import { Button } from '@/components/ui/button';
import { Map, ChevronLeft, ChevronRight } from 'lucide-react';

interface SvgMapShowcaseProps {
  nigeriaData: string;
  kenyaData: string;
}

export function SvgMapShowcase({ nigeriaData, kenyaData }: SvgMapShowcaseProps) {
  const [selectedCountryIndex, setSelectedCountryIndex] = useState(0);
  const [highlightedRegion, setHighlightedRegion] = useState<string | null>(null);
  const [, setLocation] = useLocation();
  
  const countries = [
    {
      id: 1,
      name: 'Nigeria',
      svgData: nigeriaData,
      description: 'Nigeria is a country in West Africa, bordering Niger, Chad, Cameroon, and Benin. It consists of 36 states and the Federal Capital Territory, where the capital Abuja is located.',
      stats: {
        states: 36,
        capital: 'Abuja',
        population: '200+ million',
        area: '923,768 km²'
      }
    },
    {
      id: 2,
      name: 'Kenya',
      svgData: kenyaData,
      description: 'Kenya is a country in East Africa, bordering South Sudan, Ethiopia, Somalia, Tanzania, Uganda, and the Indian Ocean. It consists of 47 counties established by the 2010 Constitution of Kenya.',
      stats: {
        states: 47,
        capital: 'Nairobi',
        population: '53+ million',
        area: '580,367 km²'
      }
    }
  ];
  
  const selectedCountry = countries[selectedCountryIndex];
  
  const handleRegionClick = (regionId: string, regionName: string) => {
    setHighlightedRegion(regionId);
  };
  
  const handlePreviousCountry = () => {
    setSelectedCountryIndex(prev => (prev === 0 ? countries.length - 1 : prev - 1));
    setHighlightedRegion(null);
  };
  
  const handleNextCountry = () => {
    setSelectedCountryIndex(prev => (prev === countries.length - 1 ? 0 : prev + 1));
    setHighlightedRegion(null);
  };
  
  const handlePlay = (countryId: number) => {
    setLocation(`/game/${countryId}`);
  };
  
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 my-8">
      <h2 className="text-2xl font-bold text-center mb-2">
        Interactive Map of {selectedCountry.name}
      </h2>
      <p className="text-gray-600 text-center mb-6">
        Click on any state/region to see its details. Play the puzzle to test your knowledge!
      </p>
      
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Map Display */}
        <div className="w-full lg:w-2/3 relative">
          <div className="bg-gray-50 rounded-lg p-4 h-[500px] flex items-center justify-center">
            <CountrySvgMap
              countryId={selectedCountry.id}
              countryName={selectedCountry.name}
              svgData={selectedCountry.svgData}
              highlightRegion={highlightedRegion}
              onRegionClick={handleRegionClick}
              height={450}
            />
            
            {/* Country navigation controls */}
            <div className="absolute top-1/2 left-2 transform -translate-y-1/2 flex flex-col gap-2">
              <Button onClick={handlePreviousCountry} size="icon" variant="ghost" className="rounded-full bg-white/80 hover:bg-white">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </div>
            <div className="absolute top-1/2 right-2 transform -translate-y-1/2 flex flex-col gap-2">
              <Button onClick={handleNextCountry} size="icon" variant="ghost" className="rounded-full bg-white/80 hover:bg-white">
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
          
          {/* Selected region info */}
          {highlightedRegion && (
            <div className="p-4 bg-gray-100 rounded-lg mt-4">
              <h3 className="font-bold text-lg">
                {selectedCountry.svgData.match(new RegExp(`id="${highlightedRegion}" title="([^"]+)"`))?.[1] || 'Region'}
              </h3>
              <p className="text-sm text-gray-600">
                Click Play to start a puzzle with all regions of {selectedCountry.name}.
              </p>
            </div>
          )}
        </div>
        
        {/* Country Information */}
        <div className="w-full lg:w-1/3">
          <div className="bg-gray-50 rounded-lg p-4 h-full">
            <h3 className="font-bold text-xl mb-2">{selectedCountry.name}</h3>
            <p className="text-gray-600 mb-4">
              {selectedCountry.description}
            </p>
            
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-white p-3 rounded-md shadow-sm">
                <span className="text-sm text-gray-500">States/Regions</span>
                <p className="font-bold text-lg">{selectedCountry.stats.states}</p>
              </div>
              <div className="bg-white p-3 rounded-md shadow-sm">
                <span className="text-sm text-gray-500">Capital</span>
                <p className="font-bold text-lg">{selectedCountry.stats.capital}</p>
              </div>
              <div className="bg-white p-3 rounded-md shadow-sm">
                <span className="text-sm text-gray-500">Population</span>
                <p className="font-bold text-lg">{selectedCountry.stats.population}</p>
              </div>
              <div className="bg-white p-3 rounded-md shadow-sm">
                <span className="text-sm text-gray-500">Area</span>
                <p className="font-bold text-lg">{selectedCountry.stats.area}</p>
              </div>
            </div>
            
            <Button 
              onClick={() => handlePlay(selectedCountry.id)} 
              className="w-full bg-primary hover:bg-primary/90 text-white flex items-center justify-center gap-2 py-6"
            >
              <Map className="h-5 w-5" />
              <span>Play Puzzle</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}