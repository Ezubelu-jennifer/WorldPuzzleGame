import React from "react";
import { useLocation, useRoute } from "wouter";
import { useGame } from "@/context/game-context";
import { Button } from "@/components/ui/button";

export function LevelSelection() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/level-selection/:countryId");

  const countryId = params?.countryId;

  if (!countryId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-center text-lg text-red-600">Invalid country selection.</p>
      </div>
    );
  }

  // Now just navigate with query param (do NOT set context here — do it in the game page)
  const handleLevelSelect = (level: "easy" | "medium" | "hard"| "very hard") => {
    setLocation(`/game/${countryId}?level=${level}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center px-4">
      <div className="bg-white shadow-2xl rounded-2xl p-8 w-full max-w-md text-center">
        <h2 className="text-3xl font-extrabold mb-6 text-gray-800">Select Game Level</h2>
        <p className="text-gray-600 mb-8">Choose a difficulty to get started with the game.</p>

        <div className="flex flex-col gap-4">
          {["easy", "medium", "hard", "very hard"].map((level) => (
            <Button
              key={level}
              className="bg-primary text-white py-4 text-lg rounded-full transition-transform hover:scale-105"
              onClick={() => handleLevelSelect(level as "easy" | "medium" | "hard" | "very hard")}
            >
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
