import { RegionPiece } from "@shared/schema";

export interface CountryData {
  id: number;
  name: string;
  slug: string;
  imageUrl: string;
  difficulty: number; // 1-5 (stars)
  regionsCount: number;
  tagType?: "popular" | "new" | "beginner";
  tagText?: string;
  outlinePath: string;
}

// Sample countries data for initial loading
export const initialCountries: CountryData[] = [
  {
    id: 1,
    name: "Nigeria",
    slug: "nigeria",
    imageUrl: "https://images.unsplash.com/photo-1526721940322-10fb6e3ae94a?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&h=500&q=80",
    difficulty: 3,
    regionsCount: 36,
    tagType: "popular",
    tagText: "Popular",
    outlinePath: "M192.3,27.6l7.5-3.1l8.1,1.1l8.7,3.8l8.1,5.5l1.6,7.3l5.8,2.7l8.4,2.2l5.5-1.4l4.5-4.5l7.4,0.5l2.9,2.2l0.8,3.6l3.3,2.9 l2.6,4.9v4.9l-1.4,2.7l-2.5,2.1l-3.3,5.6l-4.3,2.3l-1.2,3l1.4,3l-0.2,4.7l-7.2,2.8l-4.9-0.3l-2.9,2.8l-4.5,0.5l-3.4,3 l-3.6,0.3l-3.8-1.9l-4.1,0.2L216,96l-6.1-0.1l-4.3-1.5l-5.1-5l-1.6-4.1l-3.7-2.2l-1.8-5.1l-3.9-3.2l-2-2.8l-0.1-3.4l-1.7-3.7 l-0.4-6.5l1.5-3.6l-1.8-3.9l0.5-5.4l2.1-7.5l0.6-2.9L192.3,27.6z",
  },
  {
    id: 2,
    name: "Kenya",
    slug: "kenya",
    imageUrl: "https://images.unsplash.com/photo-1489392191049-fc10c97e64b6?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&h=500&q=80",
    difficulty: 4,
    regionsCount: 47,
    tagType: "new",
    tagText: "New",
    outlinePath: "M191.1,43.3l5.2-2.8l1.9,1.1l1.3,4.7l2.6,3.4l1.7,5.9l1.9,3.1l-1.2,2.1l-3.1-1.3l-0.3,4.6l-2.3,4.8l-2.4,1.6 l-3.8-1.8l-9.1,2.8l-3.4-2.4l-2.1-4.8l-3.1-0.3l-1.9-5.9l2.9-7.5l1.7-3.9l3.9-3.2l2.6-4.9l1.9-0.2L191.1,43.3z",
  },
  {
    id: 3,
    name: "South Africa",
    slug: "south-africa",
    imageUrl: "https://images.unsplash.com/photo-1580060839134-75a5edca2e99?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&h=500&q=80",
    difficulty: 2,
    regionsCount: 9,
    tagType: "beginner",
    tagText: "Beginner",
    outlinePath: "M186.2,74.5l3.9,0.5l3.1,1.9l1.7,3.5l-0.3,3.5l-1.4,1.9l-3.5,0.5l-4-1.5l-2.5-3.1l-0.1-3.8L186.2,74.5z M196.9,62.8 l2.2-2.7l3.4,0.9l2.6,3.2l0.2,3.2l-1.7,2.3l-2.3,0.7l-3.1-1.8l-1.8-3.4L196.9,62.8z M211.3,45.2l5.6-1.1l2.9,1.5l0.9,3.6 l-0.8,3.3l-3.1,2.4l-3.6,0.3l-4.2-2.8l-1.5-3.1L211.3,45.2z",
  },
  {
    id: 4,
    name: "Egypt",
    slug: "egypt",
    imageUrl: "https://images.unsplash.com/photo-1539768942893-daf53e448371?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&h=500&q=80",
    difficulty: 3,
    regionsCount: 27,
    outlinePath: "M205.1,25.6l6.2-1.9l4.7,1.1l5.3,3.1l4.1,7.1l0.9,3.9l-3.1,3.8l-1.7,10.8l-1.3,5.5l-2.9,4.7l-14.8,0.3l-0.8-1.9 l-3.2-3.9l-2.4,2.1l-4.2-0.9l-0.8-3.5l1.7-5.4l-0.4-4.1l2.1-5.2l-1.2-3.6l-1.9-7.1l-2.4-3.9l3.4-1.1l5.5,1.5L205.1,25.6z",
  },
  {
    id: 5,
    name: "Morocco",
    slug: "morocco",
    imageUrl: "https://images.unsplash.com/photo-1528657249085-c73a0629561e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&h=500&q=80",
    difficulty: 3,
    regionsCount: 12,
    outlinePath: "M160.4,30.5l2.2-1.4l4.7-0.1l4.1,1.5l5.2,3.8l2.8,5.1l1.9,5.4l-0.9,5.8l-5.1,5.9l-6.1,1.3l-5.2-0.8l-7.8,1.5 l-2.3-4.8l-5.9-2.7l-3.8-6.1l-0.9-5.6l2.9-5.9l5.1-2.2L160.4,30.5z",
  },
];

// This would be a map of sample regions for each country 
// In a real app, these would be loaded from the backend
export const sampleRegions: { [key: number]: RegionPiece[] } = {
  1: [
    {
      id: 1,
      name: "Lagos",
      svgPath: "M189.8,72.5l3.1,1.2l1.5,2.1l-0.6,2.3l-2.1,0.8l-1.9-0.7l-1.7-2.9L189.8,72.5z",
      correctX: 189,
      correctY: 72,
      isPlaced: false,
      fillColor: "#2563EB",
      strokeColor: "#1E40AF"
    },
    {
      id: 2,
      name: "Abuja",
      svgPath: "M207.3,54.7l2.6,0.9l1.3,1.7l-0.9,1.8l-2.4,0.3l-1.8-1.2l-0.7-2.1L207.3,54.7z",
      correctX: 207,
      correctY: 54,
      isPlaced: false,
      fillColor: "#3B82F6",
      strokeColor: "#1E40AF"
    },
    {
      id: 3,
      name: "Kano",
      svgPath: "M215.1,37.2l3.5,1.3l1.7,2.2l-0.3,2.7l-2.9,1.1l-2.3-0.9l-1.5-2.6L215.1,37.2z",
      correctX: 215,
      correctY: 37,
      isPlaced: false,
      fillColor: "#60A5FA",
      strokeColor: "#1E40AF"
    },
    {
      id: 4,
      name: "Rivers",
      svgPath: "M198.5,82.1l2.9,1.1l1.5,1.9l-0.4,2.2l-1.9,0.6l-2.2-0.8l-1.5-2.3L198.5,82.1z",
      correctX: 198,
      correctY: 82,
      isPlaced: false,
      fillColor: "#93C5FD",
      strokeColor: "#1E40AF"
    },
    {
      id: 5,
      name: "Borno",
      svgPath: "M227.5,43.9l4.2,1.6l2.2,2.8l-0.5,3.4l-3.6,1.5l-2.7-1.2l-1.9-3.4L227.5,43.9z",
      correctX: 227,
      correctY: 43,
      isPlaced: false,
      fillColor: "#BFDBFE",
      strokeColor: "#1E40AF"
    },
    {
      id: 6,
      name: "Oyo",
      svgPath: "M181.2,64.7l2.8,1.1l1.4,1.9l-0.5,2.1l-1.8,0.7l-2.1-0.7l-1.4-2.2L181.2,64.7z",
      correctX: 181,
      correctY: 64,
      isPlaced: false,
      fillColor: "#4F46E5",
      strokeColor: "#312E81"
    }
  ],
  // Additional sample regions for other countries would be defined here
};
