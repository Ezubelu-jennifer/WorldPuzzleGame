import { 
  users, type User, type InsertUser,
  countries, type Country, type InsertCountry,
  regions, type Region, type InsertRegion,
  gameSessions, type GameSession, type InsertGameSession,
  type RegionPiece
} from "@shared/schema";
// Import directly from the client directory
import { initialCountries } from "../client/src/data/countries";

// Helper function to transform SVG paths for more variety
function transformPath(path: string, scaleX: number = 1.0, scaleY: number = 1.0): string {
  // This is a simple path transformation that scales the path by adjusting coordinates
  
  // Parse commands from the path data
  const commands = path.match(/[a-zA-Z][^a-zA-Z]*/g) || [];
  let result = '';
  
  for (const cmd of commands) {
    const type = cmd[0]; // Command type (M, L, C, etc.)
    const rest = cmd.slice(1); // Coordinates
    
    // Extract numbers from the command
    const numbers = rest.trim().split(/[\s,]+/).map(parseFloat).filter(n => !isNaN(n));
    let transformed = type;
    
    // Apply scaling based on command type
    for (let i = 0; i < numbers.length; i++) {
      // Scale X coordinates (even indices) and Y coordinates (odd indices)
      if (i % 2 === 0) {
        transformed += ' ' + (numbers[i] * scaleX);
      } else {
        transformed += ' ' + (numbers[i] * scaleY);
      }
    }
    
    result += transformed;
  }
  
  return result;
}


// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Country methods
  getAllCountries(): Promise<Country[]>;
  getCountry(id: number): Promise<Country | undefined>;
  createCountry(country: InsertCountry): Promise<Country>;
  
  // Region methods
  getRegionsByCountry(countryId: number): Promise<Region[]>;
  createRegion(region: InsertRegion): Promise<Region>;
  
  // Game session methods
  createGameSession(session: InsertGameSession): Promise<GameSession>;
  completeGameSession(id: number, hintsUsed: number, score: number): Promise<GameSession | undefined>;
  getTopScoresByCountry(countryId: number, limit?: number): Promise<GameSession[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private countries: Map<number, Country>;
  private regions: Map<number, Region[]>;
  private gameSessions: Map<number, GameSession>;
  private userIdCounter: number;
  private countryIdCounter: number;
  private regionIdCounter: number;
  private gameSessionIdCounter: number;

  constructor() {
    this.users = new Map();
    this.countries = new Map();
    this.regions = new Map();
    this.gameSessions = new Map();
    
    this.userIdCounter = 1;
    this.countryIdCounter = 1;
    this.regionIdCounter = 1; // Start with a higher ID to avoid conflicts with sample regions
    this.gameSessionIdCounter = 1;
    
    // Initialize with sample data
    this.initializeSampleData();
  }
  
  // Generate dummy regions to fill up to the required count
  private generateDummyRegions(countryId: number,  targetCount: number): Region[] {
    const result: Region[] = []; // Initialize empty array 

    
    // Colors to use for the generated regions
    const colors = [
      { fill: "#EF4444", stroke: "#991B1B" }, // Red
      { fill: "#F97316", stroke: "#9A3412" }, // Orange
      { fill: "#FACC15", stroke: "#854D0E" }, // Yellow
      { fill: "#84CC16", stroke: "#3F6212" }, // Lime
      { fill: "#22C55E", stroke: "#166534" }, // Green
      { fill: "#10B981", stroke: "#065F46" }, // Emerald
      { fill: "#06B6D4", stroke: "#0E7490" }, // Cyan
      { fill: "#0EA5E9", stroke: "#0369A1" }, // Light Blue
      { fill: "#3B82F6", stroke: "#1D4ED8" }, // Blue
      { fill: "#6366F1", stroke: "#4338CA" }, // Indigo
      { fill: "#8B5CF6", stroke: "#5B21B6" }, // Violet
      { fill: "#A855F7", stroke: "#6B21A8" }, // Purple
      { fill: "#D946EF", stroke: "#86198F" }, // Fuchsia
      { fill: "#EC4899", stroke: "#9D174D" }, // Pink
      { fill: "#F43F5E", stroke: "#9F1239" }, // Rose
    ];
    
    // Create additional unique shapes for variety
    // Nigeria SVG paths for state shapes
    const nigeriaPaths = [
      "M100,100 C120,80 150,90 160,120 C170,150 160,180 130,190 C100,200 70,180 60,150 C50,120 70,90 100,100 Z", // Rounded shape
      "M80,80 L150,100 L160,150 L120,180 L60,150 L50,100 Z", // Hexagon-like
      "M100,70 L150,90 L170,130 L150,170 L100,190 L50,170 L30,130 L50,90 Z", // Octagon-like
      "M90,70 C140,80 160,120 150,160 C140,180 110,190 80,180 C40,160 30,120 60,90 C70,80 80,70 90,70 Z", // Organic shape
      "M80,60 L130,60 L170,90 L170,130 L130,160 L80,160 L40,130 L40,90 Z", // Octagon variation 1
      "M70,60 L120,70 L160,90 L180,130 L160,170 L120,190 L70,180 L30,130 L40,80 Z", // Octagon variation 2
      "M100,50 C150,60 180,100 170,150 C160,200 110,220 60,190 C20,160 10,110 50,70 C70,50 80,45 100,50 Z", // Large organic shape
      "M90,80 C130,60 180,70 200,110 C220,150 210,200 160,220 C110,240 60,220 40,170 C20,120 50,70 90,80 Z", // Curved shape
      "M100,80 L120,60 L150,60 L170,80 L180,110 L170,140 L150,160 L120,160 L100,140 L90,110 Z", // Decagon
      "M110,60 L150,80 L160,120 L140,150 L100,160 L60,150 L40,120 L50,80 L90,60 Z", // Nonagon
      "M100,60 L140,70 L170,100 L170,140 L140,170 L100,180 L60,170 L30,140 L30,100 L60,70 Z", // Decagon variation
      "M80,70 L120,50 L160,70 L180,110 L160,150 L120,170 L80,150 L60,110 Z", // Octagon variation 3
    ];
    
    
    
    // Region names for Nigeria states (total 37 including FCT)
     // Nigeria state names (37 total)
     const worldcountriesNames = [
      "Andorra","United Arab Emirates","Afghanistan","Antigua and Barbuda","Anguilla", "Albania","Armenia","Angola","Argentina","American Samoa",
      "Austria", "Australia", "Aruba", "Aland Islands","Azerbaijan","Bosnia and Herzegovina","Barbados","Bangladesh","Belgium","Burkina Faso",
      "Bulgaria", "Bahrain", "Burundi", "Benin","Saint Barthelemy","Brunei Darussalam","Bolivia","Bermuda","Bonaire, Sint Eustatius and Saba","Brazil",
      "Bahamas", "Bhutan", "Bouvet Island", "Botswana","Belarus","Belize","Canada","Cocos (Keeling) Islands","Democratic Republic of Congo","Central African Republic",
       "Republic of Congo", "Switzerland", "Côte d'Ivoire","Cook Islands","Chile","Cameroon","China","Colombia","Costa Rica","Cuba",
       "Cape Verde", "Curaçao", "Christmas Island", "Cyprus","Czechia","Germany","Djibouti","Denmark","Dominica","Dominican Republic",
      "Algeria", "Ecuador",  "Egypt", "Estonia","Western Sahara","Eritrea","Spain","Ethiopia","Finland","Fiji",
      "Falkland Islands", "Federated States of Micronesia", "Faroe Islands", "France","Gabon","United Kingdom","Georgia","Grenada","French Guiana","Guernsey",
      "Ghana","Gibraltar", "Greenland","Gambia", "Guinea","Glorioso Islands","Guadeloupe","Equatorial Guinea","Greece","South Georgia and South Sandwich Islands",
      "Guatemala", "Guam", "Guinea-Bissau", "Guyana","Hong Kong","Heard Island and McDonald Islands","Honduras" ,"Croatia","Haiti","Hungary",
      "Indonesia", "Ireland","Israel","Isle of Man","India","British Indian Ocean Territory","Iraq","Iran","Iceland","Italy",
      "Jersey","Jamaica","Jordan","Japan","Juan De Nova Island","Kenya","Kyrgyzstan","Cambodia","Kiribati","Comoros",
      "Saint Kitts and Nevis","North Korea","South Korea" ,"Kosovo","Kuwait" ,"Cayman Islands","Kazakhstan","Lao People's Democratic Republic","Lebanon","Saint Lucia",
      "Liechtenstein","Sri Lanka","Liberia","Lesotho","Lithuania","Luxembourg","Latvia","Libya","Morocco","Monaco",
      "Moldova","Madagascar","Montenegro","Saint Martin","Marshall Islands","North Macedonia" ,"Mali","Macau","Myanmar","Mongolia",
      "Northern Mariana Islands","Martinique","Mauritania","Montserrat","Malta" ,"Mauritius","Maldives", "Malawi","Mexico","Malaysia",
      "Mozambique","Namibia","New Caledonia","Niger","Norfolk Island","Nigeria","Nicaragua","Netherlands","Norway","Nepal",
      "Nauru","Niue","New Zealand","Oman","Panama","Peru","French Polynesia","Papua New Guinea","Philippines","Pakistan",
      "Poland","Saint Pierre and Miquelon","Pitcairn Islands","Puerto Rico","Palestinian Territories","Portugal","Palau","Paraguay","Qatar","Reunion",
      "Romania","Serbia","Russia","Rwanda","Saudi Arabia","Solomon Islands","Seychelles","Sudan","Sweden","Singapore",
      "Saint Helena","Slovenia","Svalbard and Jan Mayen","Slovakia","Sierra Leone","San Marino","Senegal","Somalia","Suriname","South Sudan",
      "Sao Tome and Principe","El Salvador","Sint Maarten","Syria","Swaziland","Turks and Caicos Islands","Chad","French Southern and Antarctic Lands","Togo","Thailand" ,
      "Tajikistan","Tokelau","Timor-Leste","Turkmenistan","Tunisia","Tonga","Turkey","Trinidad and Tobago","Tuvalu","Taiwan",
      "Tanzania","Ukraine","Uganda","Jarvis Island","Baker Island","Howland Island","Johnston Atoll","Midway Islands","Wake Island","United States",
      "Uruguay","Uzbekistan","Vatican City","Saint Vincent and the Grenadines","Venezuela","British Virgin Islands","US Virgin Islands","Vietnam","Vanuatu" ,"Wallis and Futuna",
      "Samoa","Yemen","Mayotte","South Africa","Zambia","Zimbabwe",
    ].sort(); // Ensure sorted
  
    
    
     // Use names and paths appropriate for the country 
     type CountryInfo = {
      regionNames: string[];
      basePaths?: string[]; // optional basePaths
    };
    
    const countryData: { [key: number]: CountryInfo } = {
      1: {
        regionNames: worldcountriesNames,
       // basePaths: nigeriaPaths
      },
      
    };
    
    const selectedCountry = countryData[countryId];
    
    const regionNames = selectedCountry?.regionNames || [];
    const basePaths = selectedCountry?.basePaths || [];
    
 
    if (regionNames.length !== targetCount) {
         console.warn(`Warning: Mismatch in expected region count for country ${countryId}. Expected ${targetCount}, but found ${regionNames.length} names.`);
         // Adjust targetCount if name list is definitive, or handle error appropriately
         // For now, we'll proceed but log the warning.
     }
 
    // Create a transformation function to make SVG paths unique 
    const transformPath = (path: string, scale: number, offsetX: number, offsetY: number): string => {
      if (!path || path.includes('matrix') || path.includes('scale') || path.includes('translate')) {
        return path;
      }
      return `${path} scale(${scale}) translate(${offsetX},${offsetY})`;
    };

   
 // Generate the regions needed 
 for (let i = 0; i < targetCount; i++) {
  const colorIndex = i % colors.length; 
  // Use the specific region name from the list 
  const regionName = regionNames[i] || (countryId === 1 ? `State ${i + 1}` : `County ${i + 1}`); // Fallback name

  // Get a base shape path 
  const pathIndex = i % basePaths.length;
  let svgPath = basePaths[pathIndex];
  
      
      // Make each path unique by applying different scaling and translation
      const scale = 0.8 + (Math.random() * 0.4); // Scale between 0.8 and 1.2
      const offsetX = Math.floor(Math.random() * 40) - 20; // Offset between -20 and 20
      const offsetY = Math.floor(Math.random() * 40) - 20; // Offset between -20 and 20
      
      //svgPath = basePaths[pathIndex];
      
      // Apply transformation to make the path unique
      svgPath = transformPath(svgPath, scale, offsetX, offsetY);
      
      // Create position variations - ensure they're well spread out
      let posX, posY;
      
      const cols = countryId === 1 ? 6 : 7; // Grid columns 
      const col = i % cols; 
      const row = Math.floor(i / cols); 
      const xBase = countryId === 1 ? 100 : 80;
      const yBase = countryId === 1 ? 100 : 80;
      const xSpacing = countryId === 1 ? 100 : 90;
      const ySpacing = countryId === 1 ? 100 : 90;
      const xRand = countryId === 1 ? 30 : 20;
      const yRand = countryId === 1 ? 30 : 20;

      posX = xBase + (col * xSpacing) + (Math.random() * xRand); 
      posY = yBase + (row * ySpacing) + (Math.random() * yRand); 
      
      // Create the new region with a unique shape and position
      const newRegion: Region = {
        id: this.regionIdCounter++,
        countryId: countryId,
        name: regionName,
        svgPath: svgPath,
        correctX: posX,
        correctY: posY,
        fillColor: colors[colorIndex].fill,
        strokeColor: colors[colorIndex].stroke
      };
      
      result.push(newRegion);
    }
    
    return result;
  }

  // MODIFIED: Initialize countries and generate regions dynamically
  private initializeSampleData() {
    // Add initial countries 
    initialCountries.forEach(country => {
      this.countries.set(country.id, {
        id: country.id,
        name: country.name,
        slug: country.slug,
        regionsCount: country.regionsCount,
        difficulty: country.difficulty,
        imageUrl: country.imageUrl || null,
        outlinePath: country.outlinePath
      });
       
      // Update country ID counter 
      if (country.id >= this.countryIdCounter) {
        this.countryIdCounter = country.id + 1;
      }
      
    
    
      // Determine target region count based on country data or defaults
      let targetCount = country.regionsCount; // Use count from initialCountries
      if (country.id === 1 && targetCount !== 256) { // Nigeria check 
          console.warn(`Mismatch: initialCountries data says world has ${targetCount} regions, expected 256. Using 256.`);
          targetCount = 256;
      } //else if (country.id === 2 && targetCount !== 47) { // Kenya check 
         //  console.warn(`Mismatch: initialCountries data says Kenya has ${targetCount} regions, expected 47. Using 47.`);
         // targetCount = 47;
      //}

     

      // Generate regions for this country 
      const generatedRegions = this.generateDummyRegions(country.id, targetCount);
      
       // Verify the generated count 
       if (generatedRegions.length !== targetCount) {
        console.warn(`Warning: Generated ${generatedRegions.length} regions for ${country.name}, expected ${targetCount}`);
       }

      this.regions.set(country.id, generatedRegions); 
  });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Country methods
  async getAllCountries(): Promise<Country[]> {
    return Array.from(this.countries.values());
  }
  
  async getCountry(id: number): Promise<Country | undefined> {
    return this.countries.get(id);
  }
  
  async createCountry(insertCountry: InsertCountry): Promise<Country> {
    const id = this.countryIdCounter++;
    const country: Country = { 
      ...insertCountry, 
      id,
      imageUrl: insertCountry.imageUrl || null 
    };
    this.countries.set(id, country);
    return country;
  }
  
  // Region methods
  async getRegionsByCountry(countryId: number): Promise<Region[]> {
    return this.regions.get(countryId) || [];
  }
  
  async createRegion(insertRegion: InsertRegion): Promise<Region> {
    const id = this.regionIdCounter++;
    const region: Region = { ...insertRegion, id };
    
    // Add to regions map
    const existingRegions = this.regions.get(region.countryId) || [];
    this.regions.set(region.countryId, [...existingRegions, region]);
    
    return region;
  }
  
  // Game session methods
  async createGameSession(insertSession: InsertGameSession): Promise<GameSession> {
    const id = this.gameSessionIdCounter++;
    const gameSession: GameSession = { 
      ...insertSession, 
      id,
      userId: insertSession.userId || null,
      hintsUsed: insertSession.hintsUsed || 0,
      completedAt: null,
      score: null,
      isCompleted: false
    };
    
    this.gameSessions.set(id, gameSession);
    return gameSession;
  }
  
  async completeGameSession(id: number, hintsUsed: number, score: number): Promise<GameSession | undefined> {
    const session = this.gameSessions.get(id);
    if (!session) {
      return undefined;
    }
    
    const updatedSession: GameSession = {
      ...session,
      completedAt: new Date(),
      hintsUsed,
      score,
      isCompleted: true
    };
    
    this.gameSessions.set(id, updatedSession);
    return updatedSession;
  }
  
  async getTopScoresByCountry(countryId: number, limit: number = 10): Promise<GameSession[]> {
    return Array.from(this.gameSessions.values())
      .filter(session => session.countryId === countryId && session.isCompleted && session.score !== null)
      .sort((a, b) => {
        // Sort by score (descending)
        if (a.score !== null && b.score !== null) {
          return b.score - a.score;
        }
        return 0;
      })
      .slice(0, limit);
  }
}

export const storage = new MemStorage();
