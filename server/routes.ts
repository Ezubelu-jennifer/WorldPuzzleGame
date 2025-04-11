import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertCountrySchema, insertRegionSchema, insertGameSessionSchema, type InsertGameSession } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all available countries
  app.get("/api/countries", async (req, res) => {
    try {
      const countries = await storage.getAllCountries();
      res.json(countries);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Internal Server Error";
      res.status(500).json({ message });
    }
  });

  // Get a specific country by ID
  app.get("/api/countries/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const country = await storage.getCountry(id);
      if (!country) {
        return res.status(404).json({ message: "Country not found" });
      }
      
      res.json(country);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Internal Server Error";
      res.status(500).json({ message });
    }
  });

  // Get regions for a specific country
  app.get("/api/countries/:id/regions", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const regions = await storage.getRegionsByCountry(id);
      res.json(regions);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Internal Server Error";
      res.status(500).json({ message });
    }
  });

  // Start a new game session
  app.post("/api/game-sessions", async (req, res) => {
    try {
      // Define a custom schema with string date handling
      const gameSessionRequestSchema = z.object({
        userId: z.number().nullable().optional(),
        countryId: z.number(),
        startedAt: z.string().transform(str => new Date(str)),
        hintsUsed: z.number().default(0)
      });
      
      // Validate and transform the data
      const validatedData = gameSessionRequestSchema.parse(req.body);
      
      // Create the game session
      const gameSession = await storage.createGameSession(validatedData as InsertGameSession);
      res.status(201).json(gameSession);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      const message = error instanceof Error ? error.message : "Internal Server Error";
      res.status(500).json({ message });
    }
  });

  // Complete a game session
  app.put("/api/game-sessions/:id/complete", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      const { hintsUsed, score } = req.body;
      if (typeof hintsUsed !== 'number' || typeof score !== 'number') {
        return res.status(400).json({ message: "hintsUsed and score must be numbers" });
      }

      const gameSession = await storage.completeGameSession(id, hintsUsed, score);
      if (!gameSession) {
        return res.status(404).json({ message: "Game session not found" });
      }

      res.json(gameSession);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Internal Server Error";
      res.status(500).json({ message });
    }
  });

  // Get top scores for a country
  app.get("/api/countries/:id/scores", async (req, res) => {
    try {
      const countryId = parseInt(req.params.id);
      if (isNaN(countryId)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const scores = await storage.getTopScoresByCountry(countryId, limit);
      res.json(scores);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Internal Server Error";
      res.status(500).json({ message });
    }
  });

  // Only for initialization/admin purposes - add a new country
  app.post("/api/countries", async (req, res) => {
    try {
      const validatedData = insertCountrySchema.parse(req.body);
      const country = await storage.createCountry(validatedData);
      res.status(201).json(country);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      const message = error instanceof Error ? error.message : "Internal Server Error";
      res.status(500).json({ message });
    }
  });

  // Only for initialization/admin purposes - add a new region
  app.post("/api/regions", async (req, res) => {
    try {
      const validatedData = insertRegionSchema.parse(req.body);
      const region = await storage.createRegion(validatedData);
      res.status(201).json(region);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      const message = error instanceof Error ? error.message : "Internal Server Error";
      res.status(500).json({ message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
