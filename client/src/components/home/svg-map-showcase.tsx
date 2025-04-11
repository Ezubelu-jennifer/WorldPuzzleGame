import React from "react";
import { DetailedMap } from "@/components/detailed-map";

interface SvgMapShowcaseProps {
  nigeriaData: string;
  kenyaData: string;
}

export function SvgMapShowcase({ nigeriaData, kenyaData }: SvgMapShowcaseProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4 py-6">
      <div className="w-full md:w-1/2 bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-4 bg-green-600 text-white font-bold">
          Nigeria
        </div>
        <div className="p-4">
          <DetailedMap 
            svgData={nigeriaData} 
            height={300}
            className="rounded-md overflow-hidden"
          />
        </div>
      </div>
      
      <div className="w-full md:w-1/2 bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-4 bg-green-600 text-white font-bold">
          Kenya
        </div>
        <div className="p-4">
          <DetailedMap 
            svgData={kenyaData} 
            height={300}
            className="rounded-md overflow-hidden"
          />
        </div>
      </div>
    </div>
  );
}