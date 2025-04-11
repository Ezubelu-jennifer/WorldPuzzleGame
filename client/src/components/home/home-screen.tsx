import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Shuffle, Map } from "lucide-react";
import { CountryCard } from "@/components/home/country-card";
import { CountryDetails } from "@/components/home/country-details";
import { CountryMapShowcase } from "@/components/home/country-map-showcase";
import { Button } from "@/components/ui/button";
import { CountryData, initialCountries } from "@/data/countries";
import { NigeriaSvg, KenyaSvg } from "@/data/svg-map-data";

export function HomeScreen() {
  const [selectedCountry, setSelectedCountry] = useState<CountryData | null>(null);
  const [, setLocation] = useLocation();
  
  // Fetch countries from the API
  const { data: countries, isLoading, error } = useQuery({
    queryKey: ['/api/countries'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/countries');
        if (!response.ok) {
          throw new Error("Failed to fetch countries");
        }
        return await response.json();
      } catch (error) {
        console.warn("Using initial data as fallback:", error);
        // Return initial data as fallback
        return initialCountries;
      }
    }
  });

  // Function to play a random country
  const playRandomCountry = () => {
    if (!countries || countries.length === 0) return;
    
    const randomIndex = Math.floor(Math.random() * countries.length);
    const randomCountry = countries[randomIndex];
    setLocation(`/game/${randomCountry.id}`);
  };
  
  // Handler for when a country card is clicked
  const handleCountryClick = (country: CountryData) => {
    setSelectedCountry(country);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // Handler for going back to country list
  const handleBackToList = () => {
    setSelectedCountry(null);
  };
  
  // Handler for playing the selected country
  const handlePlaySelected = () => {
    if (selectedCountry) {
      setLocation(`/game/${selectedCountry.id}`);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {!selectedCountry ? (
        <>
          <div className="text-center mb-8">
            <h2 className="font-heading font-bold text-3xl mb-2 text-gray-800">
              Learn African Geography Through Play
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Assemble puzzles of African countries by placing states and regions in their correct positions. 
              Challenge yourself with different countries and difficulty levels!
            </p>
          </div>
          
          {/* Country Map Showcase with detailed SVG maps */}
          <CountryMapShowcase 
            nigeriaSvg={NigeriaSvg}
            kenyaSvg={KenyaSvg}
          />
          
          <h3 className="text-2xl font-bold text-center mt-16 mb-6">Available Countries</h3>
          
          {isLoading ? (
            <div className="text-center py-10">
              <div className="spinner w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading countries...</p>
            </div>
          ) : error ? (
            <div className="text-center py-10 text-red-500">
              <p>Error loading countries. Please try again later.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {countries?.map((country: CountryData) => (
                <div key={country.id} onClick={() => handleCountryClick(country)}>
                  <CountryCard country={country} />
                </div>
              ))}
              
              {/* "More coming soon" card */}
              <div className="bg-white/50 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center p-6 text-center hover:bg-white/70 transition">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <span className="text-2xl text-gray-400">+</span>
                </div>
                <h3 className="font-heading font-bold text-gray-700 text-xl mb-2">More Coming Soon</h3>
                <p className="text-gray-500 text-sm">We're working on adding more African countries to the collection!</p>
              </div>
            </div>
          )}

          <div className="flex justify-center mt-12">
            <Button 
              onClick={playRandomCountry}
              className="bg-accent hover:bg-accent/90 text-white font-medium rounded-full px-6 py-6"
              disabled={isLoading || !countries || countries.length === 0}
            >
              <Shuffle className="h-5 w-5 mr-2" />
              <span>Play Random Country</span>
            </Button>
          </div>
        </>
      ) : (
        <CountryDetails 
          country={selectedCountry}
          onBack={handleBackToList}
          onPlay={handlePlaySelected}
        />
      )}
    </div>
  );
}
