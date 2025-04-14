import React from "react";
import { useLocation } from "wouter";
import { GameScreen } from "@/components/game/game-screen";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { GameProvider } from "@/context/game-context";

export default function Game() {
  // Get country ID from URL query parameter
  const [location] = useLocation();
  const searchParams = new URLSearchParams(location.split("?")[1]);
  const countryId = searchParams.get("country") ? parseInt(searchParams.get("country") || "0") : 0;
  
  if (!countryId) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center p-8">
            <h1 className="text-2xl font-bold mb-4">Invalid Country ID</h1>
            <p className="mb-6">The country you're looking for doesn't exist.</p>
            <a href="/" className="bg-primary text-white px-6 py-3 rounded-md">
              Return to Home
            </a>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <GameProvider>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow">
          <GameScreen countryId={countryId} />
        </main>
        <Footer />
      </div>
    </GameProvider>
  );
}
