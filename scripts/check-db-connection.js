/**
 * Database Connection Test Script
 * 
 * This script tests the connection to the PostgreSQL database
 * using the connection string from the .env file.
 * 
 * Usage: node scripts/check-db-connection.js
 */

import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file
const envPath = join(dirname(__dirname), '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log(`Loaded environment from ${envPath}`);
} else {
  console.error(`Error: .env file not found at ${envPath}`);
  process.exit(1);
}

// Get the DATABASE_URL from environment variables
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('Error: DATABASE_URL is not defined in the .env file');
  process.exit(1);
}

console.log('Testing database connection...');
console.log(`Database URL: ${databaseUrl.replace(/:\/\/([^:]+):[^@]+@/, '://$1:****@')}`);

// Create a new client
const client = new pg.Client({
  connectionString: databaseUrl,
  // Add connection timeout
  connectionTimeoutMillis: 5000,
});

// Connect to the database
client.connect()
  .then(() => {
    console.log('✅ Successfully connected to the database!');
    // Query to get PostgreSQL version
    return client.query('SELECT version();');
  })
  .then((result) => {
    console.log('Database version:', result.rows[0].version);
    // Close the connection
    return client.end();
  })
  .then(() => {
    console.log('Connection closed.');
  })
  .catch((err) => {
    console.error('❌ Failed to connect to the database:');
    console.error(err.message);
    
    // Provide troubleshooting tips based on error message
    if (err.message.includes('ECONNREFUSED')) {
      console.error('\nTroubleshooting tips:');
      console.error('1. Make sure PostgreSQL is installed and running');
      console.error('2. Check if the port (default: 5432) is correct');
      console.error('3. Verify that PostgreSQL is accepting connections');
    } else if (err.message.includes('database "ats_scan" does not exist')) {
      console.error('\nTroubleshooting tips:');
      console.error('1. Create the database using: CREATE DATABASE ats_scan;');
      console.error('2. Or use an existing database and update DATABASE_URL in .env');
    } else if (err.message.includes('password authentication failed')) {
      console.error('\nTroubleshooting tips:');
      console.error('1. Check your PostgreSQL username and password');
      console.error('2. Update the credentials in the DATABASE_URL in .env');
    }
    
    process.exit(1);
  });