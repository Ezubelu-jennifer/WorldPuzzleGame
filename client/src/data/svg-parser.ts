import { RegionPiece } from "@shared/schema";

export function extractWorldRegions(svgData: string) {
  const regions: { id: string; name: string; path: string }[] = [];
  
  // Create standard region IDs for Nigeria (NG-AB, NG-AD, etc.)
  // These are standard ISO codes for Nigerian states we know should be in the SVG
  const stateIds = [
    "ID-AD","ID-AE","ID-AF","ID-AG","ID-AI","ID-AL","ID-AM","ID-AO","ID-AR","ID-AS",
    "ID-AT","ID-AU","ID-AW","ID-AX","ID-AZ","ID-BA","ID-BB","ID-BD","ID-BE","ID-BF",
    "ID-BG","ID-BH","ID-BI","ID-BJ","ID-BL","ID-BN","ID-BO","ID-BM","ID-BQ","ID-BR",
    "ID-BS","ID-BT","ID-BV","ID-BW","ID-BY","ID-BZ","ID-CA","ID-CC","ID-CD","ID-CF",
    "ID-CG","ID-CH","ID-CI","ID-CK","ID-CL","ID-CM","ID-CN","ID-CO","ID-CR","ID-CU",
    "ID-CV","ID-CW","ID-CX","ID-CY","ID-CZ","ID-DE","ID-DJ","ID-DK","ID-DM","ID-DO",
    "ID-DZ","ID-EC","ID-EG","ID-EE","ID-EH","ID-ER","ID-ES","ID-ET","ID-FI","ID-FJ",
    "ID-FK","ID-FM","ID-FO","ID-FR","ID-GA","ID-GB","ID-GE","ID-GD","ID-GF","ID-GG",
    "ID-GH","ID-GI","ID-GL","ID-GM","ID-GN","ID-GO","ID-GP","ID-GQ","ID-GR","ID-GS",
    "ID-GT","ID-GU","ID-GW","ID-GY","ID-HK","ID-HM","ID-HN","ID-HR","ID-HT","ID-HU",
    "ID-ID","ID-IE","ID-IL","ID-IM","ID-IN","ID-IO","ID-IQ","ID-IR","ID-IS","ID-IT",
    "ID-JE","ID-JM","ID-JO","ID-JP","ID-JU","ID-KE","ID-KG","ID-KH","ID-KI","ID-KM",
    "ID-KN","ID-KP","ID-KR","ID-XK","ID-KW","ID-KY","ID-KZ","ID-LA","ID-LB","ID-LC",
    "ID-LI","ID-LK","ID-LR","ID-LS","ID-LT","ID-LU","ID-LV","ID-LY","ID-MA","ID-MC",
    "ID-MD","ID-MG","ID-ME","ID-MF","ID-MH","ID-MK","ID-ML","ID-MO","ID-MM","ID-MN",
    "ID-MP","ID-MQ","ID-MR","ID-MS","ID-MT","ID-MU","ID-MV","ID-MW","ID-MX","ID-MY",
    "ID-MZ","ID-NA","ID-NC","ID-NE","ID-NF","ID-NG","ID-NI","ID-NL","ID-NO","ID-NP",
    "ID-NR","ID-NU","ID-NZ","ID-OM","ID-PA","ID-PE","ID-PF","ID-PG","ID-PH","ID-PK",
    "ID-PL","ID-PM","ID-PN","ID-PR","ID-PS","ID-PT","ID-PW","ID-PY","ID-QA","ID-RE",
    "ID-RO","ID-RS","ID-RU","ID-RW","ID-SA","ID-SB","ID-SC","ID-SD","ID-SE","ID-SG",
    "ID-SH","ID-SI","ID-SJ","ID-SK","ID-SL","ID-SM","ID-SN","ID-SO","ID-SR","ID-SS",
    "ID-ST","ID-SV","ID-SX","ID-SY","ID-SZ","ID-TC","ID-TD","ID-TF","ID-TG","ID-TH",
    "ID-TJ","ID-TK","ID-TL","ID-TM","ID-TN","ID-TO","ID-TR","ID-TT","ID-TV","ID-TW",
    "ID-TZ","ID-UA","ID-UG","ID-UMDQ","ID-UMFQ","ID-UMHQ","ID-UMJQ","ID-UMMQ","ID-UMWQ","ID-US",
    "ID-UY","ID-UZ","ID-VA","ID-VC","ID-VE","ID-VG","ID-VI","ID-VN","ID-VU","ID-WF",
    "ID-WS","ID-YE","ID-YT","ID-ZA","ID-ZM","ID-ZW"
  ];

  
  
  // Map state codes to full names for better UX
  const stateNames: Record<string, string> = {
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
  
  // First try to extract all path elements with id and title attributes, where title follows id
  const regex1 = /<path[^>]*id="([^"]+)"[^>]*title="([^"]+)"[^>]*d="([^"]+)"/g;
  let match1;
  
  while ((match1 = regex1.exec(svgData)) !== null) {
    regions.push({
      id: match1[1],
      name: match1[2],
      path: match1[3]
    });
  }
  
  // Try another pattern where title comes before id
  const regex2 = /<path[^>]*title="([^"]+)"[^>]*id="([^"]+)"[^>]*d="([^"]+)"/g;
  let match2;
  
  while ((match2 = regex2.exec(svgData)) !== null) {
    regions.push({
      id: match2[2],
      name: match2[1],
      path: match2[3]
    });
  }
  
  // Try another pattern with more flexible attribute ordering
  const regex3 = /<path[^>]*class="land"[^>]*id="([^"]+)"[^>]*d="([^"]+)"/g;
  let match3;
  
  while ((match3 = regex3.exec(svgData)) !== null) {
    const id = match3[1];
    if (stateIds.includes(id)) {
      // Extract the title if it exists
      const titleRegex = new RegExp(`<path[^>]*id="${id}"[^>]*title="([^"]+)"`, 'i');
      const titleMatch = svgData.match(titleRegex);
      const name = titleMatch ? titleMatch[1] : stateNames[id] || id.replace('ID-', '');
      
      regions.push({
        id: id,
        name: name,
        path: match3[2]
      });
    }
  }
  
  // If we still don't have all regions, try a simpler approach to extract remaining paths
  if (regions.length < stateIds.length) {
    //console.log(`Found ${regions.length} regions so far, trying simpler extraction for the rest`);
    
    // Try to get all path elements with any pattern
    const simpleRegex = /<path[^>]*id="([^"]+)"[^>]*d="([^"]+)"/g;
    let simpleMatch;
    
    const existingIds = regions.map(r => r.id);
    
    while ((simpleMatch = simpleRegex.exec(svgData)) !== null) {
      const id = simpleMatch[1];
      if (stateIds.includes(id) && !existingIds.includes(id)) {
        regions.push({
          id: id,
          name: stateNames[id] || id.replace('ID-', ''),
          path: simpleMatch[2]
        });
      }
    }
  }
  
  // If we still haven't found any regions, add fallback regions with empty paths
  if (regions.length === 0) {
    console.warn("Could not extract regions from Nigeria SVG data. Using fallback.");
    stateIds.forEach(id => {
      regions.push({
        id: id,
        name: stateNames[id] || id.replace('ID-', ''),
        path: ""  // Empty path, will be generated on the client
      });
    });
  }
  
  
  // Make sure we have the right count
  if (regions.length !== 256) {
    console.warn(`Expected 256 countries, but found ${regions.length}`);
  }
  
  //console.log(`Found ${regions.length} Nigeria regions from SVG data`);
  //console.log(`Sample region from SVG:`, regions);
  
  return regions;
}



/*

export function extractMoroccoRegions(svgData: string) {
  const regions: { id: string; name: string; path: string }[] = [];
  
  // Create standard region IDs for Kenya counties
  // These are county codes we expect to find in the SVG
  const countyIds = Array.from({length: 16}, (_, i) => `MA-${String(i+1).padStart(2, '0')}`);
  
  // Map county codes to names - full list of all 47 Kenya counties
  const countyNames: Record<string, string> = {
    "MA-01" : "Tanger-Tétouan", "MA-02" :"Gharb-Chrarda-Beni Hssen", "MA-03" :"Taza-Al Hoceima-Taounate",
    "MA-04" : "L'Oriental", "MA-05": "Fès-Boulemane", "MA-06" :"Meknès-Tafilalet",
    "MA-07" : "Rabat-Salé-Zemmour-Zaer", "MA-08" :"Grand Casablanca", "MA-09" :"Chaouia-Ouardigha",
    "MA-10" :"Doukhala-Abda","MA-11" :"Marrakech-Tensift-Al Haouz", "MA-12" :"Tadla-Azilal",
    "MA-13" :"Souss-Massa-Drâa", "MA-14" :"Guelmim-Es Smara", "MA-15" :"Laâyoune-Boujdour-Sakia el Hamra",
    "MA-16" :"Oued ed Dahab-Lagouira",
   
  };
  
  // First try to extract all path elements with id and title attributes - title follows id
  const regex1 = /<path[^>]*id="([^"]+)"[^>]*title="([^"]+)"[^>]*d="([^"]+)"/g;
  let match1;
  
  while ((match1 = regex1.exec(svgData)) !== null) {
    regions.push({
      id: match1[1],
      name: match1[2],
      path: match1[3]
    });
  }
  
  // Try another pattern where title comes before id
  const regex2 = /<path[^>]*title="([^"]+)"[^>]*id="([^"]+)"[^>]*d="([^"]+)"/g;
  let match2;
  
  while ((match2 = regex2.exec(svgData)) !== null) {
    regions.push({
      id: match2[2],
      name: match2[1],
      path: match2[3]
    });
  }
  
  // Try to extract with more flexible attribute ordering - class first
  const regex3 = /<path[^>]*class="land"[^>]*id="([^"]+)"[^>]*d="([^"]+)"/g;
  let match3;
  
  while ((match3 = regex3.exec(svgData)) !== null) {
    const id = match3[1];
    if (countyIds.includes(id)) {

    // Extract the title if it exists
    const titleRegex = new RegExp(`<path[^>]*id="${id}"[^>]*title="([^"]+)"`, 'i');
    const titleMatch = svgData.match(titleRegex);
    const name = titleMatch ? titleMatch[1] : countyNames[id] || id.replace('MA-', 'County ');
    
    regions.push({
      id: id,
      name: name,
      path: match3[2]
    });
  }
}
  
  // If we still don't have enough regions, use the very generic pattern
  if (regions.length < countyIds.length) {
  
    const simpleRegex = /<path[^>]*id="([^"]+)"[^>]*d="([^"]+)"/g;
    let simpleMatch;
    
    const existingIds = regions.map(r => r.id);
    
    while ((simpleMatch = simpleRegex.exec(svgData)) !== null) {
      const id = simpleMatch[1];
      //if (!existingIds.includes(id)) {
      if (countyIds.includes(id) && !existingIds.includes(id)) {

        regions.push({
          id: id,
          name: countyNames[id] || id.replace('MA-', 'County '),
          path: simpleMatch[2]
        });
      }
    }
  }
  

  
  // Create a "processed" array with unique entries by name (no duplicates)
  const uniqueRegionMap = new Map<string, { id: string; name: string; path: string }>();
  
  // First add all the extracted regions, ensuring no duplicates by name
  regions.forEach(region => {
    const normalizedName = region.name.trim().toLowerCase();
    if (!uniqueRegionMap.has(normalizedName)) {
      uniqueRegionMap.set(normalizedName, region);
    }
  });
 
  
  // Convert back to array and ensure exactly 47 counties
  const finalCounties = Array.from(uniqueRegionMap.values());
  return finalCounties;

}

*/


export function getViewBoxFromSVG(svgData: string): string {
  const viewBoxMatch = svgData.match(/viewBox="([^"]+)"/);
  return viewBoxMatch && viewBoxMatch[1] ? viewBoxMatch[1] : "0 0 800 600";
}

export function getMapBoundaries(svgData: string) {
  // Extract the viewBox to determine the map boundaries
  const viewBox = getViewBoxFromSVG(svgData);
  const [minX, minY, width, height] = viewBox.split(' ').map(Number);
  
  return {
    minX,
    minY,
    width,
    height, 
    maxX: minX + width,
    maxY: minY + height
  };
}