import React from "react";
import { Link } from "wouter";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { CountryData } from "@/data/countries";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface CountryCardProps {
  country: CountryData;
}

export function CountryCard({ country }: CountryCardProps) {
  const { id, name, slug, imageUrl, difficulty, regionsCount, tagType, tagText } = country;
  
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

  return (
    <Card className="overflow-hidden hover:shadow-lg transition cursor-pointer">
      <div className="h-48 bg-gray-200 relative overflow-hidden">
        <img 
          src={imageUrl} 
          alt={`${name} Map Preview`} 
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
          <h3 className="font-heading font-bold text-white text-xl">{name}</h3>
          <p className="text-white/90 text-sm">{regionsCount} {regionsCount === 1 ? 'region' : 'regions'}</p>
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
