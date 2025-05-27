import React, { useState, useEffect, useRef, useCallback, useMemo, useLayoutEffect } from "react";
import { useGame } from "@/context/game-context";
import { Button } from "@/components/ui/button";
import { getSvgDataById } from "@/data/svg-map-data";
import { getViewBoxFromSVG, extractWorldRegions } from "@/data/svg-parser";
import CountrySvgMap from "@/components/maps/country-svg-map";
import { useDragContext } from "@/context/drag-context";
import { getPathCentroid } from "@/utils/svg-clipper";
import { useScrollContext } from "@/context/scrollcontext";



// Configuration for the improved guidance system - ONLY RED DOTS MODE
const ENABLE_ALL_GUIDES = false;         // When true, shows faint outlines for all states
const SHOW_ALL_POSITION_DOTS = true;     // When true, shows target dots for all unplaced regions
const HIGHLIGHT_TARGET_REGION = false;   // When true, highlights the specific target region when dragging
const SHOW_CROSSHAIR_GUIDES = false;     // When true, shows crosshair guides for precise placement
const ENHANCED_DOTS = false;             // Disabled - only show simple red dots
const DOTS_ONLY_MODE = true;             // When true, only shows dots with no other visual elements

interface PuzzleBoardProps {
  countryId: number;
  countryName: string;
  outlinePath: string;
  onStart: () => void;
}

export function PuzzleBoard({ 
  countryId, 
  countryName, 
  outlinePath,
  onStart
}: PuzzleBoardProps) {
  const { gameState, useHint,countdown, errorPopup,droppedItems,setHighlightedRegions,highlightedRegions,selectedLevel,currentTarget,showPopup} = useGame();
  const [gameStarted, setGameStarted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollableMapContainerRef } = useScrollContext();
  
  const [svgData, setSvgData] = useState<string>("");
  const [viewBox, setViewBox] = useState<string>( "0 0 800 600"); // Use initialViewBox or default
  const [svgRegions, setSvgRegions] = useState<{ id: string; name: string; path: string }[]>( []); // Use initialSvgRegions or default  
  const svgRef = useRef<SVGSVGElement>(null);
  const { draggedPieceId, draggedRotation } = useDragContext();

   
  type RegionType = {
    id: string;
    name: string;
    path: string;
  };

  //selected level for guiding dot

  const isEasy = selectedLevel === "easy";
  const isMedium= selectedLevel === "medium";
  const isHard = selectedLevel === "hard";
  const isVeryHard = selectedLevel === "very hard";


   // Helper function to find a matching region in the SVG for a game region
   const findMatchingRegion = (gameRegion: any) => {
    if (!gameRegion) return null;
    
    // Attempt to find a direct match by name
    let matchingRegion = svgRegions.find(svgRegion => 
      svgRegion.name.toLowerCase() === gameRegion.name.toLowerCase()
    );
    
    
    // If no direct match, try for Nigeria states using state codes
    if (!matchingRegion && countryId === 1) {
      // Map of Nigerian state names to their IDs
      const stateIdMap: Record<string, string> = {
        "ID-AD": "Andorra","ID-AE" :"United Arab Emirates","ID-AF" :"Afghanistan","ID-AG":"Antigua and Barbuda","ID-AI":"Anguilla", "ID-AL":"Albania","ID-AM" :"Armenia","ID-AO":"Angola","ID-AR": "Argentina","ID-AS":"American Samoa",
    "ID-AT" :"Austria", "ID-AU":"Australia", "ID-AW":"Aruba", "ID-AX":"Aland Islands","ID-AZ":"Azerbaijan","ID-BA":"Bosnia and Herzegovina","ID-BB":"Barbados","ID-BD":"Bangladesh","ID-BE":"Belgium","ID-BF" :"Burkina Faso",
    "ID-BG":"Bulgaria", "ID-BH":"Bahrain", "ID-BI":"Burundi", "ID-BJ":"Benin","ID-BL":"Saint Barthelemy","ID-BN":"Brunei Darussalam","ID-BO":"Bolivia","ID-BM" :"Bermuda","ID-BQ" :"Bonaire, Sint Eustatius and Saba","ID-BR":"Brazil",
    "ID-BS" :"Bahamas", "ID-BT":"Bhutan", "ID-BV" :"Bouvet Island", "ID-BW":"Botswana","ID-BY":"Belarus","ID-BZ":"Belize","ID-CA" :"Canada","ID-CC":"Cocos (Keeling) Islands","ID-CD":"Democratic Republic of Congo","ID-CF": "Central African Republic",
    "ID-CG" :"Republic of Congo", "ID-CH" :"Switzerland", "ID-CI" :"Côte d'Ivoire","ID-CK":"Cook Islands","ID-CL":"Chile","ID-CM":"Cameroon","ID-CN":"China","ID-CO":"Colombia","ID-CR":"Costa Rica","ID-CU":"Cuba",
    "ID-CV" :"Cape Verde", "ID-CW":"Curaçao", "ID-CX":"Christmas Island", "ID-CY":"Cyprus","ID-CZ" :"Czechia","ID-DE":"Germany","ID-DJ":"Djibouti","ID-DK":"Denmark","ID-DM":"Dominica","ID-DO":"Dominican Republic",
    "ID-DZ": "Algeria", "ID-EC":"Ecuador", "ID-EG": "Egypt", "ID-EE":"Estonia","ID-EH":"Western Sahara","ID-ER":"Eritrea","ID-ES":"Spain","ID-ET":"Ethiopia","ID-FI":"Finland","ID-FJ":"Fiji",
    "ID-FK": "Falkland Islands", "ID-FM":"Federated States of Micronesia", "ID-FO":"Faroe Islands", "ID-FR":"France","ID-GA":"Gabon","ID-GB":"United Kingdom","ID-GE":"Georgia","ID-GD" :"Grenada","ID-GF":"French Guiana","ID-GG":"Guernsey",
    "ID-GH":"Ghana","ID-GI":"Gibraltar", "ID-GL":"Greenland","ID-GM" :"Gambia", "ID-GN":"Guinea","ID-GO":"Glorioso Islands","ID-GP":"Guadeloupe","ID-GQ":"Equatorial Guinea","ID-GR" :"Greece","ID-GS":"South Georgia and South Sandwich Islands",
    "ID-GT" :"Guatemala", "ID-GU":"Guam", "ID-GW":"Guinea-Bissau", "ID-GY":"Guyana","ID-HK" :"Hong Kong","ID-HM":"Heard Island and McDonald Islands","ID-HN":"Honduras" ,"ID-HR":"Croatia","ID-HT":"Haiti","ID-HU":"Hungary",
    "ID-ID" :"Indonesia", "ID-IE" :"Ireland","ID-IL" :"Israel","ID-IM" :"Isle of Man","ID-IN":"India","ID-IO":"British Indian Ocean Territory","ID-IQ":"Iraq","ID-IR" :"Iran","ID-IS" :"Iceland","ID-IT":"Italy",
    "ID-JE" :"Jersey","ID-JM":"Jamaica","ID-JO" :"Jordan","ID-JP" :"Japan","ID-JU":"Juan De Nova Island","ID-KE":"Kenya","ID-KG":"Kyrgyzstan","ID-KH":"Cambodia","ID-KI":"Kiribati","ID-KM" :"Comoros",
    "ID-KN" :"Saint Kitts and Nevis","ID-KP" :"North Korea","ID-KR" :"South Korea" ,"ID-XK" :"Kosovo","ID-KW":"Kuwait" ,"ID-KY":"Cayman Islands","ID-KZ" :"Kazakhstan","ID-LA":"Lao People's Democratic Republic","ID-LB":"Lebanon","ID-LC" :"Saint Lucia",
    "ID-LI" :"Liechtenstein","ID-LK":"Sri Lanka","ID-LR":"Liberia","ID-LS" :"Lesotho","ID-LT":"Lithuania","ID-LU":"Luxembourg","ID-LV" :"Latvia","ID-LY":"Libya","ID-MA":"Morocco","ID-MC":"Monaco",
    "ID-MD" :"Moldova","ID-MG":"Madagascar","ID-ME":"Montenegro","ID-MF":"Saint Martin","ID-MH" :"Marshall Islands","ID-MK":"North Macedonia" ,"ID-ML":"Mali","ID-MO":"Macau","ID-MM":"Myanmar","ID-MN" :"Mongolia",
    "ID-MP" :"Northern Mariana Islands","ID-MQ" :"Martinique","ID-MR" :"Mauritania","ID-MS":"Montserrat","ID-MT":"Malta" ,"ID-MU":"Mauritius","ID-MV":"Maldives", "ID-MW":"Malawi","ID-MX":"Mexico","ID-MY":"Malaysia",
    "ID-MZ" :"Mozambique","ID-NA" :"Namibia","ID-NC":"New Caledonia","ID-NE":"Niger","ID-NF" :"Norfolk Island","ID-NG" :"Nigeria","ID-NI":"Nicaragua","ID-NL":"Netherlands","ID-NO":"Norway","ID-NP":"Nepal",
    "ID-NR" :"Nauru","ID-NU":"Niue","ID-NZ" :"New Zealand","ID-OM" :"Oman","ID-PA" :"Panama","ID-PE" :"Peru","ID-PF":"French Polynesia","ID-PG" :"Papua New Guinea","ID-PH":"Philippines","ID-PK":"Pakistan",
    "ID-PL" :"Poland","ID-PM":"Saint Pierre and Miquelon","ID-PN":"Pitcairn Islands","ID-PR" :"Puerto Rico","ID-PS" :"Palestinian Territories","ID-PT" :"Portugal","ID-PW" :"Palau","ID-PY" :"Paraguay","ID-QA" :"Qatar","ID-RE" :"Reunion",
    "ID-RO" :"Romania","ID-RS" :"Serbia","ID-RU" :"Russia","ID-RW":"Rwanda","ID-SA" :"Saudi Arabia","ID-SB" :"Solomon Islands","ID-SC" :"Seychelles","ID-SD" :"Sudan","ID-SE" :"Sweden","ID-SG" :"Singapore",
    "ID-SH" :"Saint Helena","ID-SI" :"Slovenia","ID-SJ" :"Svalbard and Jan Mayen","ID-SK" :"Slovakia","ID-SL" :"Sierra Leone","ID-SM" :"San Marino","ID-SN" :"Senegal","ID-SO" :"Somalia","ID-SR" :"Suriname","ID-SS" :"South Sudan",
    "ID-ST" :"Sao Tome and Principe","ID-SV" :"El Salvador","ID-SX" :"Sint Maarten","ID-SY":"Syria","ID-SZ" :"Swaziland","ID-TC" :"Turks and Caicos Islands","ID-TD" :"Chad","ID-TF" :"French Southern and Antarctic Lands","ID-TG" :"Togo","ID-TH" :"Thailand" ,
    "ID-TJ" :"Tajikistan","ID-TK" :"Tokelau","ID-TL" :"Timor-Leste","ID-TM":"Turkmenistan","ID-TN" :"Tunisia","ID-TO" :"Tonga","ID-TR" :"Turkey","ID-TT" :"Trinidad and Tobago","ID-TV" :"Tuvalu","ID-TW" :"Taiwan",
    "ID-TZ" :"Tanzania","ID-UA" :"Ukraine","ID-UG" :"Uganda","ID-UMDQ" :"Jarvis Island","ID-UMFQ" :"Baker Island","ID-UMHQ" :"Howland Island","ID-UMJQ":"Johnston Atoll","ID-UMMQ" :"Midway Islands","ID-UMWQ" :"Wake Island","ID-US" :"United States",
    "ID-UY" :"Uruguay","ID-UZ" :"Uzbekistan","ID-VA" :"Vatican City","ID-VC" :"Saint Vincent and the Grenadines","ID-VE" :"Venezuela","ID-VG" :"British Virgin Islands","ID-VI" :"US Virgin Islands","ID-VN" :"Vietnam","ID-VU" :"Vanuatu" ,"ID-WF" :"Wallis and Futuna",
    "ID-WS" :"Samoa","ID-YE" :"Yemen","ID-YT" :"Mayotte","ID-ZA" :"South Africa","ID-ZM" :"Zambia","ID-ZW" :"Zimbabwe",
      };
      
      const stateId = stateIdMap[gameRegion.name];
      
      if (stateId) {
        matchingRegion = svgRegions.find(r => r.id === stateId);
       
      }
    }
    
    return matchingRegion;
  };


  // use case for dropping and highlighting piece
  useEffect(() => {
    if (droppedItems.length > 0) {
      const regionNames = droppedItems
        .map(item => {
          const region = gameState?.regions.find(r => r.id === item.regionId);
          return region?.name;
        })
        .filter((name): name is string => typeof name === 'string');

        const uniqueRegionNames = Array.from(new Set(regionNames));
        console.log('Highlighted regions:', uniqueRegionNames);
        setHighlightedRegions(uniqueRegionNames);
    }
  }, [droppedItems, gameState]);
  

  // Define a map from countryId to their extractor functions
  const regionExtractors: { [key: number]: (svgData: string) => RegionType[] } = {
    1: extractWorldRegions,
    

  // Add more countries here as needed
  };

  // Get SVG data for this country
  // Load SVG data
  useEffect(() => {
    const loadSvgData = async () => {
      const data = getSvgDataById(countryId);
      if (!data) return;

      setSvgData(data);
      setViewBox(getViewBoxFromSVG(data));
      
      const extractor = regionExtractors[countryId];
    if (extractor) {
      setSvgRegions(extractor(data));
    } else {
      setSvgRegions([]); // fallback if no extractor is defined
    }
  };

    loadSvgData();
  }, [countryId]);


 // Handle game start
  const handleStartPuzzle = useCallback(() => {
    setGameStarted(true);
    onStart();
  }, [onStart]);


  // Check if regions are available
  const hasRegions = gameState && gameState.regions && gameState.regions.length > 0;

  
  // Handle region click
  const handleRegionClick = (regionId: string, regionName: string) => {
    console.log(`Clicked region: ${regionId} - ${regionName}`);
    
    // Find matching game region
    if (hasRegions) {
      // Get the matching region from gameState
      const gameRegion = gameState.regions.find(r => {
        // First try direct name match (case insensitive)
        if (r.name.toLowerCase() === regionName.toLowerCase()) {
          return true;
        }
        
        // Try to see if the game region name contains the SVG region name or vice versa
        if (regionName.toLowerCase().includes(r.name.toLowerCase()) || 
            r.name.toLowerCase().includes(regionName.toLowerCase())) {
          return true;
        }
        
        // For Nigeria, try to match state codes
        if (countryId === 1 && regionId.startsWith('ID-')) {
          // If our region name contains the short code (like AB, AD, etc.), it's a match
          const stateCode = regionId.replace('ID-', '');
      
          return r.name.toUpperCase().includes(stateCode);
          
        }
        
       
        return false;
      });
      
      if (gameRegion && !gameRegion.isPlaced) {
        console.log(`Found matching game region: ${gameRegion.name}`);
        // Trigger hint functionality
        useHint();
      } else {
        console.log(`No matching unplaced game region found for ${regionName}`);
      }
    }
  };
 

  return (
    <div className="w-full max-w-4xl mx-auto h-full flex flex-col">
    <div 
    ref={scrollableMapContainerRef} // ✅ Attach it here
    className="puzzle-board relative"
    style={{
      width: '1000px',
      height: '700px', // or any scrollable height
      overflow: 'auto',
        position: 'relative',
        //border: '2px solid red'
      }}
    >
     
        {/* Country Outline (using actual interactive SVG map) */}
        <div className="w-full h-full min-h-[1000px]  absolute top-0 left-0">
          {svgData ? (
            <CountrySvgMap
              ref={svgRef}
              countryId={countryId}
              countryName={countryName}
              svgData={svgData}
              highlightRegion={highlightedRegions}
              onRegionClick={handleRegionClick}
              className="w-full h-full"
              renderOverlay={
                // Render the guidance dot as an overlay within the SVG map component
                // This ensures it respects the same zoom and pan transformations
                hasRegions ? (
                  () => {
                    // Create an array to hold all guidance elements
                    const guidanceElements: React.ReactNode[] = [];
                    
                    // Get all unplaced regions
                    const unplacedRegions = gameState.regions.filter(region => !region.isPlaced);
                    
                    // If we have an actively dragged piece, find it and prioritize it
                    const draggedRegion = draggedPieceId 
                      ? gameState.regions.find(region => region.id === draggedPieceId && !region.isPlaced)
                      : null;
                      
                    
                    // console.log('draggedregion', draggedRegion);
                    // Function to render a guidance dot for a specific region
                    const renderGuidanceDot = (gameRegion: any, isPrimary: boolean = false) => {
                      // First try to find a matching region in the SVG data
                      const svgRegion = findMatchingRegion(gameRegion);
                      
                      // Generate possible region codes to try for centroid lookup
                      let regionCodes: string[] = [];
                      const regionName = gameRegion.name;
                      
                      if (countryId === 1) { // Nigeria
                        // Try standard format first (NG-XX)
                        if (svgRegion && svgRegion.id) {
                          regionCodes.push(`ID-${svgRegion.id}`);
                        }
                        
                        // Try to match by first two letters of region name
                        const stateCodes = {
                              "ID-AD": "Andorra","ID-AE" :"United Arab Emirates","ID-AF" :"Afghanistan","ID-AG":"Antigua and Barbuda","ID-AI":"Anguilla", "ID-AL":"Albania","ID-AM" :"Armenia","ID-AO":"Angola","ID-AR": "Argentina","ID-AS":"American Samoa",
                              "ID-AT" :"Austria", "ID-AU":"Australia", "ID-AW":"Aruba", "ID-AX":"Aland Islands","ID-AZ":"Azerbaijan","ID-BA":"Bosnia and Herzegovina","ID-BB":"Barbados","ID-BD":"Bangladesh","ID-BE":"Belgium","ID-BF" :"Burkina Faso",
        "ID-BG":"Bulgaria", "ID-BH":"Bahrain", "ID-BI":"Burundi", "ID-BJ":"Benin","ID-BL":"Saint Barthelemy","ID-BN":"Brunei Darussalam","ID-BO":"Bolivia","ID-BM" :"Bermuda","ID-BQ" :"Bonaire, Sint Eustatius and Saba","ID-BR":"Brazil",
        "ID-BS" :"Bahamas", "ID-BT":"Bhutan", "ID-BV" :"Bouvet Island", "ID-BW":"Botswana","ID-BY":"Belarus","ID-BZ":"Belize","ID-CA" :"Canada","ID-CC":"Cocos (Keeling) Islands","ID-CD":"Democratic Republic of Congo","ID-CF": "Central African Republic",
        "ID-CG" :"Republic of Congo", "ID-CH" :"Switzerland", "ID-CI" :"Côte d'Ivoire","ID-CK":"Cook Islands","ID-CL":"Chile","ID-CM":"Cameroon","ID-CN":"China","ID-CO":"Colombia","ID-CR":"Costa Rica","ID-CU":"Cuba",
        "ID-CV" :"Cape Verde", "ID-CW":"Curaçao", "ID-CX":"Christmas Island", "ID-CY":"Cyprus","ID-CZ" :"Czechia","ID-DE":"Germany","ID-DJ":"Djibouti","ID-DK":"Denmark","ID-DM":"Dominica","ID-DO":"Dominican Republic",
        "ID-DZ": "Algeria", "ID-EC":"Ecuador", "ID-EG": "Egypt", "ID-EE":"Estonia","ID-EH":"Western Sahara","ID-ER":"Eritrea","ID-ES":"Spain","ID-ET":"Ethiopia","ID-FI":"Finland","ID-FJ":"Fiji",
        "ID-FK": "Falkland Islands", "ID-FM":"Federated States of Micronesia", "ID-FO":"Faroe Islands", "ID-FR":"France","ID-GA":"Gabon","ID-GB":"United Kingdom","ID-GE":"Georgia","ID-GD" :"Grenada","ID-GF":"French Guiana","ID-GG":"Guernsey",
        "ID-GH":"Ghana","ID-GI":"Gibraltar", "ID-GL":"Greenland","ID-GM" :"Gambia", "ID-GN":"Guinea","ID-GO":"Glorioso Islands","ID-GP":"Guadeloupe","ID-GQ":"Equatorial Guinea","ID-GR" :"Greece","ID-GS":"South Georgia and South Sandwich Islands",
        "ID-GT" :"Guatemala", "ID-GU":"Guam", "ID-GW":"Guinea-Bissau", "ID-GY":"Guyana","ID-HK" :"Hong Kong","ID-HM":"Heard Island and McDonald Islands","ID-HN":"Honduras" ,"ID-HR":"Croatia","ID-HT":"Haiti","ID-HU":"Hungary",
        "ID-ID" :"Indonesia", "ID-IE" :"Ireland","ID-IL" :"Israel","ID-IM" :"Isle of Man","ID-IN":"India","ID-IO":"British Indian Ocean Territory","ID-IQ":"Iraq","ID-IR" :"Iran","ID-IS" :"Iceland","ID-IT":"Italy",
        "ID-JE" :"Jersey","ID-JM":"Jamaica","ID-JO" :"Jordan","ID-JP" :"Japan","ID-JU":"Juan De Nova Island","ID-KE":"Kenya","ID-KG":"Kyrgyzstan","ID-KH":"Cambodia","ID-KI":"Kiribati","ID-KM" :"Comoros",
        "ID-KN" :"Saint Kitts and Nevis","ID-KP" :"North Korea","ID-KR" :"South Korea" ,"ID-XK" :"Kosovo","ID-KW":"Kuwait" ,"ID-KY":"Cayman Islands","ID-KZ" :"Kazakhstan","ID-LA":"Lao People's Democratic Republic","ID-LB":"Lebanon","ID-LC" :"Saint Lucia",
        "ID-LI" :"Liechtenstein","ID-LK":"Sri Lanka","ID-LR":"Liberia","ID-LS" :"Lesotho","ID-LT":"Lithuania","ID-LU":"Luxembourg","ID-LV" :"Latvia","ID-LY":"Libya","ID-MA":"Morocco","ID-MC":"Monaco",
        "ID-MD" :"Moldova","ID-MG":"Madagascar","ID-ME":"Montenegro","ID-MF":"Saint Martin","ID-MH" :"Marshall Islands","ID-MK":"North Macedonia" ,"ID-ML":"Mali","ID-MO":"Macau","ID-MM":"Myanmar","ID-MN" :"Mongolia",
        "ID-MP" :"Northern Mariana Islands","ID-MQ" :"Martinique","ID-MR" :"Mauritania","ID-MS":"Montserrat","ID-MT":"Malta" ,"ID-MU":"Mauritius","ID-MV":"Maldives", "ID-MW":"Malawi","ID-MX":"Mexico","ID-MY":"Malaysia",
        "ID-MZ" :"Mozambique","ID-NA" :"Namibia","ID-NC":"New Caledonia","ID-NE":"Niger","ID-NF" :"Norfolk Island","ID-NG" :"Nigeria","ID-NI":"Nicaragua","ID-NL":"Netherlands","ID-NO":"Norway","ID-NP":"Nepal",
        "ID-NR" :"Nauru","ID-NU":"Niue","ID-NZ" :"New Zealand","ID-OM" :"Oman","ID-PA" :"Panama","ID-PE" :"Peru","ID-PF":"French Polynesia","ID-PG" :"Papua New Guinea","ID-PH":"Philippines","ID-PK":"Pakistan",
        "ID-PL" :"Poland","ID-PM":"Saint Pierre and Miquelon","ID-PN":"Pitcairn Islands","ID-PR" :"Puerto Rico","ID-PS" :"Palestinian Territories","ID-PT" :"Portugal","ID-PW" :"Palau","ID-PY" :"Paraguay","ID-QA" :"Qatar","ID-RE" :"Reunion",
        "ID-RO" :"Romania","ID-RS" :"Serbia","ID-RU" :"Russia","ID-RW":"Rwanda","ID-SA" :"Saudi Arabia","ID-SB" :"Solomon Islands","ID-SC" :"Seychelles","ID-SD" :"Sudan","ID-SE" :"Sweden","ID-SG" :"Singapore",
        "ID-SH" :"Saint Helena","ID-SI" :"Slovenia","ID-SJ" :"Svalbard and Jan Mayen","ID-SK" :"Slovakia","ID-SL" :"Sierra Leone","ID-SM" :"San Marino","ID-SN" :"Senegal","ID-SO" :"Somalia","ID-SR" :"Suriname","ID-SS" :"South Sudan",
        "ID-ST" :"Sao Tome and Principe","ID-SV" :"El Salvador","ID-SX" :"Sint Maarten","ID-SY":"Syria","ID-SZ" :"Swaziland","ID-TC" :"Turks and Caicos Islands","ID-TD" :"Chad","ID-TF" :"French Southern and Antarctic Lands","ID-TG" :"Togo","ID-TH" :"Thailand" ,
        "ID-TJ" :"Tajikistan","ID-TK" :"Tokelau","ID-TL" :"Timor-Leste","ID-TM":"Turkmenistan","ID-TN" :"Tunisia","ID-TO" :"Tonga","ID-TR" :"Turkey","ID-TT" :"Trinidad and Tobago","ID-TV" :"Tuvalu","ID-TW" :"Taiwan",
        "ID-TZ" :"Tanzania","ID-UA" :"Ukraine","ID-UG" :"Uganda","ID-UMDQ" :"Jarvis Island","ID-UMFQ" :"Baker Island","ID-UMHQ" :"Howland Island","ID-UMJQ":"Johnston Atoll","ID-UMMQ" :"Midway Islands","ID-UMWQ" :"Wake Island","ID-US" :"United States",
        "ID-UY" :"Uruguay","ID-UZ" :"Uzbekistan","ID-VA" :"Vatican City","ID-VC" :"Saint Vincent and the Grenadines","ID-VE" :"Venezuela","ID-VG" :"British Virgin Islands","ID-VI" :"US Virgin Islands","ID-VN" :"Vietnam","ID-VU" :"Vanuatu" ,"ID-WF" :"Wallis and Futuna",
        "ID-WS" :"Samoa","ID-YE" :"Yemen","ID-YT" :"Mayotte","ID-ZA" :"South Africa","ID-ZM" :"Zambia","ID-ZW" :"Zimbabwe",
                        };
                        
                        // Loop through all possible state names and try to find a match
                        for (const [stateName, code] of Object.entries(stateCodes)) {
                          if (regionName.includes(stateName) || stateName.includes(regionName)) {
                            regionCodes.push(`ID-${code}`);
                          }
                        }
                        
                        // Add generic Nigeria code as fallback
                        regionCodes.push("ID");

                      } 
                        

/*
                      else if (countryId === 5) { // moroco
                        // Try standard format first (MA-XX)
                        if (svgRegion && svgRegion.id) {
                          regionCodes.push(`MA-${svgRegion.id}`);
                        }
                        
                        
                        // Try all numbered county codes (KE-01 through KE-47)
                        for (let i = 1; i <= 16; i++) {
                          const countyCode = `MA-${i.toString().padStart(2, '0')}`;
                          regionCodes.push(countyCode);
                        }
                        
                        // Add generic Kenya code as fallback
                        regionCodes.push("MA");
                      }
*/
                      
                      // Try to get the centroid using the region's SVG path and region codes
                      //let centroid = null;
                      let centroid: { x: number; y: number } | null = null;

                      let pathToUse = svgRegion ? svgRegion.path : "";
                      
                      
                      // If not one of the special cases, try all region codes until we find a centroid
                      if (!centroid) {
                        for (const code of regionCodes) {
                          if (pathToUse) {
                            centroid = getPathCentroid(pathToUse, code);
                           // setCentroidPosition(centroid);
                            if (centroid) break;
                          }
                        }
                      }
                      
                      // If we still don't have a centroid, create a fallback based on region ID
                      if (!centroid) {
                        // Fallback centroids based on country and region ID
                        if (countryId === 1) { // Nigeria
                          // Create a grid-like distribution based on region ID
                          const id = gameRegion.id;
                          const row = Math.floor(id / 6);
                          const col = id % 6;
                          const x = 200 + col * 50;
                          const y = 200 + row * 50;
                          centroid = { x, y };
                        } else if (countryId === 2) { // Kenya
                          // Create a grid-like distribution based on region ID
                          const id = gameRegion.id;
                          const row = Math.floor((id - 100) / 7);
                          const col = (id - 100) % 7;
                          const x = 150 + col * 60;
                          const y = 300 + row * 60;
                          centroid = { x, y };
                         
                        }
                      }

                      // Final safety check to ensure we always have a centroid
                      if (!centroid) {
                        centroid = { x: 400, y: 400 }; // Default center position as absolute last resort
                      }
                      
                      // Calculate appropriate dot size based on viewBox
                      const [, , width, height] = viewBox.split(' ').map(Number);
                      const baseDotSize = Math.min(width, height) * 0.01; // Smaller dots as requested
                      const dotSize = isPrimary ? baseDotSize * 1.0 : baseDotSize * 1.0;
                      
                      // Set dot styles - using only red dots as per user request
                      const dotColor = "rgba(255,0,0,1)"; // Pure red for all dots
                      const outlineColor = "white"; // White outline for better contrast
                      const opacity = isPrimary ? 1 : 0; // Hide non-primary (secondary) dots
                     // setCentroidPosition(centroid);
                      return (
                        <g key={`dot-${gameRegion.id}`} className={isPrimary ? "primary-dot" : "secondary-dot"}>
                          {/* If primary dot and crosshair is enabled, show crosshair guides */}
                          {isPrimary && SHOW_CROSSHAIR_GUIDES && (
                            <>
                              <line 
                                x1={0} 
                                y1={centroid.y} 
                                x2={width} 
                                y2={centroid.y} 
                                stroke="rgba(255,255,255,0.6)" 
                                strokeWidth={dotSize * 0.5} 
                                strokeDasharray="5,5" 
                              />
                              <line 
                                x1={centroid.x} 
                                y1={0} 
                                x2={centroid.x} 
                                y2={height} 
                                stroke="rgba(255,255,255,0.6)" 
                                strokeWidth={dotSize * 0.5} 
                                strokeDasharray="5,5" 
                              />
                            </>
                          )}
                          
                          {/* Draw the dot */}
                          {/* Special rendering for FCT and Nasarawa */}
                          {(regionName === "Federal Capital Territory" || regionName === "FCT" || regionName === "Nasarawa") ? (
                            <>
                              {/* Special outer ring indicator for circular regions */}
                              <circle 
                                cx={centroid.x} 
                                cy={centroid.y} 
                                r={dotSize * 3.5} 
                                fill="none" 
                                stroke={dotColor} 
                                strokeWidth={dotSize * 0.4}
                                strokeDasharray="3,3"
                                data-centroid-for={regionName}
                                style={{ 
                                  opacity: opacity * 0.8
                                }}
                              />
                              
                              {/* Larger halo for special regions */}
                              <circle 
                                cx={centroid.x} 
                                cy={centroid.y} 
                                r={dotSize * 2.5} 
                                fill="none" 
                                stroke={outlineColor} 
                                strokeWidth={dotSize * 0.5}
                                data-centroid-for={regionName}
                                style={{ 
                                  opacity: opacity * 0.7
                                }}
                              />
                              
                              {/* Larger white outline */}
                              <circle 
                                cx={centroid.x} 
                                cy={centroid.y} 
                                r={dotSize * 1.6} 
                                fill={outlineColor} 
                                style={{ 
                                  opacity: opacity * 0.9
                                }}
                              />
                              
                              {/* Colored center */}
                              <circle 
                                cx={centroid.x} 
                                cy={centroid.y} 
                                r={dotSize * 1.2} 
                                fill={dotColor} 
                                data-centroid-for={regionName}
                                style={{ 
                                  filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.9))',
                                  opacity: opacity
                                }}
                              />
                              
                              {/* Labels removed as requested */}
                            </>
                          ) : ENHANCED_DOTS ? (
                            // Standard enhanced dots for regular regions
                            <>
                              {/* Outer halo effect */}
                              <circle 
                                cx={centroid.x} 
                                cy={centroid.y} 
                                r={dotSize * 2} 
                                fill="none" 
                                stroke={outlineColor} 
                                strokeWidth={dotSize * 0.3}
                                data-centroid-for={regionName}
                                style={{ 
                                  opacity: opacity * 0.5
                                }}
                              />
                              
                              {/* White outline */}
                              <circle 
                                cx={centroid.x} 
                                cy={centroid.y} 
                                r={dotSize * 1.3} 
                                fill={outlineColor} 
                                style={{ 
                                  opacity: opacity * 0.8
                                }}
                              />
                              
                              {/* Colored center */}
                              <circle 
                                cx={centroid.x} 
                                cy={centroid.y} 
                                r={dotSize} 
                                fill={dotColor}
                                data-centroid-for={regionName} 
                                style={{ 
                                  filter: isPrimary ? 'drop-shadow(0 0 4px rgba(255,255,255,0.7))' : 'none',
                                  opacity: opacity
                                }}
                              />
                            </>
                          ) : (
                            // Simple dot for non-enhanced mode
                            <circle 
                              cx={centroid.x} 
                              cy={centroid.y} 
                              r={dotSize} 
                              fill={dotColor} 
                              data-centroid-for={regionName}
                              opacity={opacity}
                            />
                          )}
                        </g>
                      );
                    };
                    
                    // If region highlighting is enabled, and we have a dragged piece,
                    // highlight the target region on the map
                    if (HIGHLIGHT_TARGET_REGION && draggedRegion && isEasy ) {
                      const matchingRegion = findMatchingRegion(draggedRegion);
                      if (matchingRegion && matchingRegion.id) {
                        guidanceElements.push(
                          <use 
                            key={`highlight-${draggedRegion.id}`}
                            href={`#${matchingRegion.id}`} 
                            fill="rgba(255,0,0,0.15)" 
                            stroke="rgba(255,0,0,0.3)"
                            strokeWidth="1.5"
                            className="pointer-events-none"
                          />
                        );
                      }
                       
                    } 
                    if (isMedium || isHard ) {
                      unplacedRegions
                      .filter(region => region.id !== draggedPieceId) // 👈 Skip the dropped piece
                      .forEach(region => {
                      const dot = renderGuidanceDot(region, true);
                      if (dot) guidanceElements.push(
                        React.cloneElement(dot, { key: `guide-dot-${region.id}` }) // ✅ Ensure unique key
                      );
                     });
                    }
                    
                    // If we have a dragged piece, render its guidance dot
                    //if (draggedRegion) {
                    if (draggedRegion && !draggedRegion.isPlaced ) {

                      const dot = renderGuidanceDot(draggedRegion, true);
                      if (dot) guidanceElements.push(
                        React.cloneElement(dot, { key: `guide-dot-${draggedRegion.id}` }) // ✅ Unique key

                      );
                    }
                    
                    // Always show dots for all regions (both placed and unplaced)
                    if (SHOW_ALL_POSITION_DOTS) {
                      // Get all regions (including placed ones)
                      const allRegions = gameState.regions;
                      
                      // Add dots for ALL regions (both placed and unplaced)
                      allRegions
                        .filter(r => r.id !== draggedPieceId) // Don't show dot for the dragged piece (already shown)
                        .forEach(region => {
                          const dot = renderGuidanceDot(region, false);
                          if (dot) guidanceElements.push(dot);
                        });
                    }
                    
                    // Return all guidance elements
                    if (guidanceElements.length > 0) {
                      return <g className="guidance-elements">{guidanceElements}</g>;
                    }
                    
                    return null;
                  }
                ) : undefined
              }

            
            />
          ) : (
            <svg className="w-full h-full" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid meet">
              {/* Draw thick border first */}
              <path 
                d={outlinePath} 
                fill="none" 
                stroke="#666666"
                strokeWidth="12"
                style={{
                  filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.3))'
                }}
              />
              {/* Then draw the filled area on top */}
              <path 
                d={outlinePath} 
                fill="#e5e5e5" 
                stroke="#e5e5e5"
                strokeWidth="2"
              />
              {/* Draw region guidelines (dashed) */}
              <path 
                d={outlinePath} 
                fill="none" 
                stroke="#cccccc"
                strokeWidth="1.5"
                strokeDasharray="2,2"
              />
            </svg>
          )}
        </div>

        {showPopup && currentTarget && isMedium && (
       <div className="fixed down-10 left-6 bg-white shadow-2xl rounded-2xl p-5 z-50 w-70 border border-gray-200 animate-fade-in space-y-4">
       <h3 className="text-lg font-semibold text-gray-800">🎯 Find and place:</h3>
       <p className="text-base text-blue-600 font-medium">{currentTarget.name}</p>

    {/* Countdown Label */}
    <div className="text-sm text-gray-500 font-medium text-center">⏳ Time Left</div>

    {/* Stylized Countdown Timer */}
    <div className="flex justify-center">
      <div className="relative w-14 h-14">
        {/* Circular background with ring */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-300 via-yellow-400 to-yellow-600 shadow-inner shadow-yellow-400 animate-pulse" />
        
        {/* Zooming Timer Text */}
        <div className="absolute inset-0 flex items-center justify-center text-3xl font-extrabold text-green animate-bounce-slow">
          {countdown}s
        </div>

        {/* Glowing ring effect */}
        <div className="absolute inset-0 rounded-full ring-3 ring-yellow-300 animate-ping-slow" />
      </div>
    </div>
  </div>
)}


      {errorPopup.visible && (
       <div className="fixed bottom-6 left-6 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in">
       {errorPopup.message}
      </div>
      )}


        {!gameStarted && (
          <StartScreen 
            countryName={countryName}
            countryId={countryId}
            onStart={handleStartPuzzle}
          />
        )}
            
            </div>
    </div>
  );
};

// Sub-components for better readability
const FallbackMap = ({ outlinePath }: { outlinePath: string }) => (
  <svg className="w-full h-full" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid meet">
    <path 
      d={outlinePath} 
      fill="none" 
      stroke="#666"
      strokeWidth="12"
      style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
    />
     <path d={outlinePath} fill="#e5e5e5" stroke="#e5e5e5" strokeWidth="2" />
    <path 
      d={outlinePath} 
      fill="none" 
      stroke="#ccc" 
      strokeWidth="1.5"
      strokeDasharray="2,2"
    />
  </svg>
);




const StartScreen = ({ 
  countryName, 
  countryId,
  onStart 
}: { 
  countryName: string;
  countryId: number;
  onStart: () => void;
}) => (
  <div className="text-center p-6 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg max-w-md z-10">
    <h3 className="font-heading font-bold text-2xl mb-3 text-gray-800">
      Memorize the Map of {countryName}
    </h3>
    <p className="text-gray-600 mb-4">
      Drag and place all {countryId === 1 ? 37 : 47} states of {countryName}
      <span className="block mt-1 text-sm text-emerald-600">
        Click map areas for hints!
      </span>
    </p>
    <Button 
      onClick={onStart}
      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6"
    >
      Start Puzzle
    </Button>
  </div>
);