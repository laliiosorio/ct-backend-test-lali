import { MongoClient } from 'mongodb';
// Ensures env vars are validated
import '@/shared/env';

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);
let connected = false;

/**
 * getDb — returns a connected MongoDB database instance.
 * It reuses the same connection for subsequent calls.
 */
export async function getDb(dbName: string) {
  if (!connected) {
    await client.connect();
    connected = true;
  }
  return client.db(dbName);
}
