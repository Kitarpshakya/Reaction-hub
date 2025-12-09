/**
 * MongoDB Client for NextAuth
 *
 * This is a separate MongoDB client instance specifically for NextAuth.js adapter.
 * It uses the native MongoDB driver (not Mongoose) as required by @auth/mongodb-adapter.
 */

import { MongoClient, ServerApiVersion } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    "Please define the MONGODB_URI environment variable inside .env.local"
  );
}

interface GlobalWithMongo {
  _mongoClientPromise?: Promise<MongoClient>;
}

const globalWithMongo = global as GlobalWithMongo;

let clientPromise: Promise<MongoClient>;

const options = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
};

if (process.env.NODE_ENV === "development") {
  // In development mode, use a global variable to preserve the client across module reloads
  if (!globalWithMongo._mongoClientPromise) {
    const client = new MongoClient(MONGODB_URI, options);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production mode, create a new client for each instance
  const client = new MongoClient(MONGODB_URI, options);
  clientPromise = client.connect();
}

export default clientPromise;
