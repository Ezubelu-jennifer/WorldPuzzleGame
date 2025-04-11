import React, { useState } from "react";
import { Link } from "wouter";
import { CircleHelp, Settings, Puzzle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { HowToPlayModal } from "@/components/modals/how-to-play-modal";

export function Header() {
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  return (
    <header className="bg-primary text-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/">
          <a className="flex items-center space-x-2 cursor-pointer">
            <Puzzle className="h-6 w-6 text-accent" />
            <h1 className="font-heading font-bold text-xl md:text-2xl">
              Africa Jigsaw Explorer
            </h1>
          </a>
        </Link>
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            className="bg-white/20 hover:bg-white/30 text-white"
            onClick={() => setShowHowToPlay(true)}
          >
            <CircleHelp className="h-4 w-4 mr-2" />
            <span className="hidden md:inline">How to Play</span>
          </Button>
          <IconButton
            icon={Settings}
            variant="ghost"
            className="bg-white/20 hover:bg-white/30 text-white"
            aria-label="Settings"
          />
        </div>
      </div>
      <HowToPlayModal isOpen={showHowToPlay} onClose={() => setShowHowToPlay(false)} />
    </header>
  );
}
