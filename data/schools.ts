import type { School } from "./types";

export const schools: School[] = [
  {
    id: "juilliard",
    name: "The Juilliard School",
    country: "US",
    city: "New York",
    website_url: "https://www.juilliard.edu",
    status: "published",
    data_quality: {
      confidence: "high",
      status: "published",
      missing_fields: [],
      review_notes: "Official-source school sample.",
    },
  },
  {
    id: "royal-northern-college",
    name: "Royal Northern College of Music London",
    country: "GB",
    city: "London",
    website_url: null,
    status: "extracted_awaiting_review",
    data_quality: {
      confidence: "medium",
      status: "extracted_awaiting_review",
      missing_fields: ["website_url"],
      review_notes: "Fictional UK school sample.",
    },
  },
  {
    id: "vienna-music-academy",
    name: "Vienna Academy of Music and Performing Arts",
    country: "AT",
    city: "Vienna",
    website_url: null,
    status: "extracted_awaiting_review",
    data_quality: {
      confidence: "low",
      status: "extracted_awaiting_review",
      missing_fields: ["website_url"],
      review_notes: "Fictional European school sample.",
    },
  },
];
