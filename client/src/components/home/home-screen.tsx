import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Shuffle, Map, AlertCircle, Dices, Plus, Star } from "lucide-react";
import { CountryCard } from "@/components/home/country-card";
import { CountryDetails } from "@/components/home/country-details";
import { CountryMapShowcase } from "@/components/home/country-map-showcase";
import { Button } from "@/components/ui/button";
import { CountryData, initialCountries } from "@/data/countries";
import { WorldSvg } from "@/data/svg-map-data";

export function HomeScreen() {
  const [selectedCountry, setSelectedCountry] = useState<CountryData | null>(null);
  const [, setLocation] = useLocation();

  const [showCountryImage, setShowCountryImage] = useState(false);
  const [showImageUrl, setShowImageUrl] = useState<string | null>(null);

  
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
    //setLocation(`/game/${randomCountry.id}`);
     // Navigate to level selection with country ID
    setLocation(`/level-selection/${randomCountry.id}`);
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
  //const handlePlaySelected = () => {
   // if (selectedCountry) {
      //setLocation(`/game/${selectedCountry.id}`);
       // Navigate to level selection with country ID
    // setLocation(`/level-selection/${selectedCountry.id}`);
   // }
 // };

  //2. Modify handlePlaySelected to trigger the image first

  const handlePlaySelected = () => {
    if (selectedCountry) {
      setShowImageUrl(selectedCountry.imageUrl); // Make sure `imageUrl` exists in your country data
      setShowCountryImage(true);
  
      // Wait 30 seconds before navigating
      setTimeout(() => {
        setLocation(`/level-selection/${selectedCountry.id}`);
      }, 7500); // 30,000 milliseconds = 30 seconds
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
     {showCountryImage && showImageUrl ? (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <img src={showImageUrl} alt="Selected Country" className="max-w-full max-h-[80vh] rounded-xl shadow-lg transition-opacity duration-1000" />
        <p className="text-xl text-gray-700 mt-6">Get ready! Loading level...</p>
      </div>
    ) : !selectedCountry ? (
        <>
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="mb-8 animate-float">
              <Map className="h-20 w-20 text-emerald-600 mx-auto" strokeWidth={1.5} />
            </div>
            <h2 className="font-heading font-bold text-4xl mb-4 bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">
              Discover Africa's Geography
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto mb-8">
              Explore, learn, and master the geography of African nations through interactive puzzles. 
              Perfect for students, educators, and geography enthusiasts!
            </p>
            <div className="flex justify-center gap-4">

            <Button 
              onClick={playRandomCountry}
              className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white font-semibold rounded-full px-8 py-6 shadow-lg hover:shadow-xl transition-all"
              disabled={isLoading || !countries || countries.length === 0}
            >
              <Shuffle className="h-5 w-5 mr-2" />
              <span className="text-lg">Random Challenge</span>
            </Button>
            <Button
                variant="outline"
                className="border-emerald-600 text-emerald-600 hover:bg-emerald-50 rounded-full px-6 py-4"
              >
                <Star className="h-5 w-5 mr-2" />
                View Progress
              </Button>
            </div>
          </div>

          {/* Compact Map Preview */}
          <div className="relative mb-14 group">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-50 to-cyan-50 rounded-2xl transform -rotate-1 scale-98 group-hover:scale-100 transition-all" />
          {/* Country Map Showcase with detailed SVG maps */}
          <CountryMapShowcase 
              worldSvg={WorldSvg}
              
            />
          <div className="absolute bottom-4 left-4 bg-white/90 px-3 py-1.5 rounded-full text-sm text-emerald-700 shadow-sm">
              Interactive Preview
            </div>
          </div>

          {/* Enhanced Country Grid */}
          <div className="mb-10">
            <h3 className="text-2xl font-bold text-center mb-8 bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">
              Available Countries
            </h3>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse bg-gray-100 rounded-xl h-48"></div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-10 bg-red-50 rounded-xl">
              <div className="mx-auto mb-3 text-red-600">
                <AlertCircle className="h-10 w-10" />
              </div>
              <p className="text-red-600 font-medium mb-3">Failed to load countries</p>
              
              <Button 
                variant="outline"
                onClick={() => window.location.reload()}
                className="text-red-600 border-red-200 hover:bg-red-50 text-sm"
                >
                Retry
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {countries?.map((country: CountryData) => (
                <div 
                  key={country.id} 
                  onClick={() => handleCountryClick(country)}
                  className="relative group cursor-pointer transform transition-all hover:-translate-y-2 hover:shadow-xl"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-cyan-50/50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <CountryCard 
                    country={country}
                  />
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                          {country.name} Regions
                        </span>
                        <div className="flex items-center">
                          {[...Array(3)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${i < country.difficulty ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`}
                              />
                          ))}
                        </div>
                      </div>
                  </div>
                ))}
               {/* Enhanced Coming Soon Card */}
               <div className="bg-white/80 border-2 border-dashed border-emerald-100 rounded-xl flex flex-col items-center justify-center p-6 text-center hover:bg-white transition-all">
                  <div className="mb-3 animate-pulse">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-r from-emerald-100 to-cyan-100 flex items-center justify-center mx-auto">
                      <Plus className="h-6 w-6 text-emerald-600" />
                    </div>
                  </div>
                  <h3 className="font-semibold text-gray-800 text-lg mb-1">More Countries Coming</h3>
                  <p className="text-gray-500 text-sm mb-3">We're expanding our African nation collection</p>
                  <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-emerald-400 to-cyan-400 h-full w-1/3 animate-progress"
                      style={{ animationIterationCount: 'infinite' }}
                      />
                      </div>
                    </div>
                  </div>
                )}
              </div>
    
           {/* CTA Section */}
           <div className="mt-20 text-center">
            <h4 className="text-2xl font-semibold text-gray-800 mb-4">
              Can't Decide Where to Start?
            </h4>
            <Button 
              onClick={playRandomCountry}
              variant="outline"
              className="border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50 font-semibold rounded-full px-8 py-6"
            >
              <Dices className="h-5 w-5 mr-2" />
              Surprise Me!
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