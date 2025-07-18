#!/usr/bin/env node

/**
 * PostgreSQL Database Creation Script for ATS-Scan
 * 
 * This script creates the PostgreSQL database for the application.
 * It extracts the database name from the DATABASE_URL in the .env file
 * and attempts to create the database if it doesn't exist.
 */

import { exec } from 'child_process';
import { resolve } from 'path';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import pg from 'pg';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env') });

if (!process.env.DATABASE_URL) {
  console.error(`${colors.red}❌ DATABASE_URL is not set in your .env file${colors.reset}`);
  console.error('Please configure your .env file with the correct database connection string');
  process.exit(1);
}

// Parse the database URL to extract components
function parseDatabaseUrl(url) {
  try {
    // Extract database name from the URL
    const dbNameMatch = url.match(/\/([^?]+)(\?.*)?$/);
    const dbName = dbNameMatch ? dbNameMatch[1] : null;
    
    // Create a modified URL for connecting to the default 'postgres' database
    const baseUrl = url.replace(/\/[^?/]+(?=\?|$)/, '/postgres');
    
    return { dbName, baseUrl };
  } catch (error) {
    console.error(`${colors.red}❌ Failed to parse DATABASE_URL: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

// Function to check if PostgreSQL is installed
function checkPostgresInstallation() {
  return new Promise((resolve, reject) => {
    exec('pg_isready', (error, stdout, stderr) => {
      if (error) {
        console.warn(`${colors.yellow}⚠️ PostgreSQL might not be installed or running${colors.reset}`);
        console.warn('Please make sure PostgreSQL is installed and running before proceeding.');
        resolve(false);
      } else {
        console.log(`${colors.green}✅ PostgreSQL is installed and running${colors.reset}`);
        resolve(true);
      }
    });
  });
}

// Function to create the database
async function createDatabase(dbName, baseUrl) {
  console.log(`${colors.blue}🔄 Attempting to create database '${dbName}'...${colors.reset}`);
  
  const client = new pg.Client({
    connectionString: baseUrl,
    connectionTimeoutMillis: 5000,
  });
  
  try {
    await client.connect();
    
    // Check if database already exists
    const checkResult = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [dbName]
    );
    
    if (checkResult.rows.length > 0) {
      console.log(`${colors.yellow}⚠️ Database '${dbName}' already exists${colors.reset}`);
    } else {
      // Create the database
      await client.query(`CREATE DATABASE ${dbName}`);
      console.log(`${colors.green}✅ Database '${dbName}' created successfully!${colors.reset}`);
    }
    
    await client.end();
    return true;
  } catch (err) {
    console.error(`${colors.red}❌ Failed to create database:${colors.reset}`);
    console.error(err.message);
    
    if (err.message.includes('permission denied')) {
      console.error('\nTroubleshooting tips:');
      console.error('1. Make sure your PostgreSQL user has permission to create databases');
      console.error('2. Try running this script with a user that has the necessary privileges');
    }
    
    await client.end();
    return false;
  }
}

// Main function
async function main() {
  try {
    console.log(`${colors.cyan}=== ATS-Scan Database Creation ===${colors.reset}\n`);
    
    // Step 1: Check PostgreSQL installation
    const pgInstalled = await checkPostgresInstallation();
    if (!pgInstalled) {
      console.error(`${colors.red}❌ Cannot proceed without PostgreSQL${colors.reset}`);
      process.exit(1);
    }
    
    // Step 2: Parse the database URL
    const { dbName, baseUrl } = parseDatabaseUrl(process.env.DATABASE_URL);
    if (!dbName) {
      console.error(`${colors.red}❌ Could not extract database name from DATABASE_URL${colors.reset}`);
      process.exit(1);
    }
    
    console.log(`Database name: ${dbName}`);
    console.log(`Base connection URL: ${baseUrl.replace(/:\/\/([^:]+):[^@]+@/, '://$1:****@')}`);
    
    // Step 3: Create the database
    const dbCreated = await createDatabase(dbName, baseUrl);
    
    if (dbCreated) {
      console.log(`\n${colors.green}✅ Database setup complete!${colors.reset}`);
      console.log(`${colors.cyan}You can now run 'npm run db:init' to initialize the database schema${colors.reset}`);
    } else {
      console.error(`${colors.red}❌ Database creation failed${colors.reset}`);
      process.exit(1);
    }
  } catch (error) {
    console.error(`${colors.red}❌ An unexpected error occurred: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

// Run the main function
main();