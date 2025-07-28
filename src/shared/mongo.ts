import { MongoClient } from 'mongodb';
import '@/shared/env';

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);
let connected = false;

/**
 * Returns a connected MongoDB database instance.
 * Ensures a single connection is reused across the application.
 * @param dbName - Name of the database to connect to
 * @returns The MongoDB database instance
 */
export async function getDb(dbName: string) {
  if (!connected) {
    await client.connect();
    connected = true;
  }
  return client.db(dbName);
}
