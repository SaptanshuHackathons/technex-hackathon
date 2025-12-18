export const mockScrapedContent = {
  title: "Database Fundamentals, Architecture, and NoSQL",
  summary:
    "The provided sources offer a comprehensive overview of Database System Concepts, primarily from a textbook perspective, detailing the fundamental aspects of Database Management Systems (DBMS). The material covers intricate topics such as data storage and querying, including indexing and hashing, query processing, and optimisation. Significant sections are dedicated to transaction management, explaining concepts like concurrency control and the recovery system, which ensures atomicity, consistency, isolation, and durability (ACID properties).",
  sources: 15,
  citation: "Database System Concepts - Silberschatz, Korth, Sudarshan",
};

export const mockCitations = [
  {
    id: "1",
    title: "Database System Concepts",
    url: "https://example.com/db-concepts",
  },
  {
    id: "2",
    title: "ACID Properties Explained",
    url: "https://example.com/acid",
  },
  {
    id: "3",
    title: "NoSQL vs SQL Comparison",
    url: "https://example.com/nosql-sql",
  },
];

export const mockIndexedPages = [
  { id: "1", title: "Introduction to DBMS", url: "/intro" },
  { id: "2", title: "Data Storage & Querying", url: "/storage" },
  { id: "3", title: "Transaction Management", url: "/transactions" },
  { id: "4", title: "Concurrency Control", url: "/concurrency" },
  { id: "5", title: "Recovery Systems", url: "/recovery" },
];

export const mockPreviousChats = [
  {
    id: "1",
    title: "Database Fundamentals Discussion",
    timestamp: "2 hours ago",
  },
  { id: "2", title: "ACID Properties Deep Dive", timestamp: "Yesterday" },
  { id: "3", title: "NoSQL Architecture Questions", timestamp: "3 days ago" },
];

export const mockChatHistory = [
  {
    id: "1",
    role: "user",
    content:
      "What are the foundational components necessary for a robust database management system?",
  },
  {
    id: "2",
    role: "ai",
    content:
      "A robust DBMS requires several key components: \n1. **Storage Manager**: Handles data storage and retrieval.\n2. **Query Processor**: Parse and optimize queries.\n3. **Transaction Manager**: Ensures ACID properties.\n4. **Concurrency Control Manager**: Manages multiple simultaneous transactions.",
  },
];

export const mockSuggestedQuestions = [
  "What are the foundational components necessary for a robust database management system?",
  "How do diverse data models and their languages influence modern database architecture?",
  "Explain the difference between SQL and NoSQL in terms of scalability.",
];
