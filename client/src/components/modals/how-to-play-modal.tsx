import React from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Hand, Puzzle, Lightbulb, Trophy } from "lucide-react";

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HowToPlayModal({ isOpen, onClose }: HowToPlayModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">How To Play</DialogTitle>
        </DialogHeader>
        
        <div className="max-h-[70vh] overflow-y-auto py-4">
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="bg-gray-100 rounded-lg p-4 flex items-center justify-center md:w-1/3">
                <Hand className="h-12 w-12 text-primary" />
              </div>
              <div className="md:w-2/3">
                <h3 className="font-heading font-bold text-lg mb-2">Drag & Place</h3>
                <p className="text-gray-600">
                  Drag puzzle pieces from the tray at the bottom and place them in their correct positions on the map.
                </p>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="bg-gray-100 rounded-lg p-4 flex items-center justify-center md:w-1/3">
                <Puzzle className="h-12 w-12 text-primary" />
              </div>
              <div className="md:w-2/3">
                <h3 className="font-heading font-bold text-lg mb-2">Snap Into Place</h3>
                <p className="text-gray-600">
                  Pieces will snap into their correct position when placed close enough. Correctly placed pieces will change color!
                </p>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="bg-gray-100 rounded-lg p-4 flex items-center justify-center md:w-1/3">
                <Lightbulb className="h-12 w-12 text-accent" />
              </div>
              <div className="md:w-2/3">
                <h3 className="font-heading font-bold text-lg mb-2">Use Hints</h3>
                <p className="text-gray-600">
                  Stuck? Use a hint to automatically place a random piece in its correct position. You have a limited number of hints per puzzle!
                </p>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="bg-gray-100 rounded-lg p-4 flex items-center justify-center md:w-1/3">
                <Trophy className="h-12 w-12 text-accent" />
              </div>
              <div className="md:w-2/3">
                <h3 className="font-heading font-bold text-lg mb-2">Complete the Map</h3>
                <p className="text-gray-600">
                  Place all pieces correctly to complete the puzzle. Your score is based on completion time and hints used.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <DialogClose asChild>
            <Button className="bg-primary hover:bg-primary/90 text-white">
              Got It
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
