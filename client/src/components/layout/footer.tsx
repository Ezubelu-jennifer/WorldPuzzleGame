import React from "react";
import { Puzzle } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-gray-800 text-white py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <div className="flex items-center space-x-2">
              <Puzzle className="h-5 w-5 text-accent" />
              <span className="font-heading font-bold">Africa Jigsaw Explorer</span>
            </div>
            <p className="text-gray-400 text-sm mt-1">Learn African geography while having fun!</p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4">
            <a href="#" className="text-gray-300 hover:text-white transition">About</a>
            <a href="#" className="text-gray-300 hover:text-white transition">Contact</a>
            <a href="#" className="text-gray-300 hover:text-white transition">Privacy Policy</a>
            <a href="#" className="text-gray-300 hover:text-white transition">Terms of Use</a>
          </div>
        </div>
        
        <div className="mt-6 pt-6 border-t border-gray-700 text-center text-gray-400 text-sm">
          <p>&copy; {new Date().getFullYear()} Africa Jigsaw Explorer. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
