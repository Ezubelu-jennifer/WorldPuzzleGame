import { 
  users, type User, type InsertUser,
  countries, type Country, type InsertCountry,
  regions, type Region, type InsertRegion,
  gameSessions, type GameSession, type InsertGameSession
} from "@shared/schema";
// Import directly from the client directory
import { initialCountries, sampleRegions } from "../client/src/data/countries";

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
    this.regionIdCounter = 1;
    this.gameSessionIdCounter = 1;
    
    // Initialize with sample data
    this.initializeSampleData();
  }
  
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
      
      // Update counter to avoid ID conflicts
      if (country.id >= this.countryIdCounter) {
        this.countryIdCounter = country.id + 1;
      }
    });
    
    // Add initial regions for countries
    Object.entries(sampleRegions).forEach(([countryId, regionsList]) => {
      const countryIdNum = parseInt(countryId, 10);
      const regionsArray = regionsList.map(region => {
        const regionObj: Region = {
          id: region.id,
          countryId: countryIdNum,
          name: region.name,
          svgPath: region.svgPath,
          correctX: region.correctX,
          correctY: region.correctY,
          fillColor: region.fillColor,
          strokeColor: region.strokeColor
        };
        
        // Update counter to avoid ID conflicts
        if (region.id >= this.regionIdCounter) {
          this.regionIdCounter = region.id + 1;
        }
        
        return regionObj;
      });
      
      this.regions.set(countryIdNum, regionsArray);
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
    const country: Country = { ...insertCountry, id };
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
