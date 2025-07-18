#!/usr/bin/env node

/**
 * Database initialization script for ATS-Scan
 * 
 * This script performs the following tasks:
 * 1. Checks if PostgreSQL is installed and accessible
 * 2. Verifies the database connection using the DATABASE_URL from .env
 * 3. Creates the necessary database tables using drizzle-kit push
 * 
 * Run this script after setting up your PostgreSQL database and configuring
 * your .env file with the correct DATABASE_URL.
 */

import { exec } from 'child_process';
import { resolve } from 'path';
import * as dotenv from 'dotenv';
import pg from 'pg';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

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

const databaseUrl = process.env.DATABASE_URL;

// Function to check if PostgreSQL is installed
function checkPostgresInstallation() {
  return new Promise((resolve, reject) => {
    exec('pg_isready', (error, stdout, stderr) => {
      if (error) {
        console.warn(`${colors.yellow}⚠️ PostgreSQL might not be installed or running${colors.reset}`);
        console.warn('Continuing anyway, but this might cause issues if PostgreSQL is not properly set up.');
        resolve(false);
      } else {
        console.log(`${colors.green}✅ PostgreSQL is installed and running${colors.reset}`);
        resolve(true);
      }
    });
  });
}

// Function to test database connection
async function testDatabaseConnection() {
  console.log(`${colors.blue}🔄 Testing database connection...${colors.reset}`);
  console.log(`Database URL: ${databaseUrl.replace(/:\/\/([^:]+):[^@]+@/, '://$1:****@')}`);
  
  const client = new pg.Client({
    connectionString: databaseUrl,
    connectionTimeoutMillis: 5000,
  });
  
  try {
    await client.connect();
    console.log(`${colors.green}✅ Successfully connected to the database!${colors.reset}`);
    await client.end();
    return true;
  } catch (err) {
    console.error(`${colors.red}❌ Failed to connect to the database:${colors.reset}`);
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
    
    return false;
  }
}

// Function to initialize database schema
function initializeDatabase() {
  return new Promise((resolve, reject) => {
    console.log(`${colors.blue}🔄 Initializing database schema...${colors.reset}`);
    
    exec('npm run db:push', (error, stdout, stderr) => {
      if (error) {
        console.error(`${colors.red}❌ Error: ${error.message}${colors.reset}`);
        reject(error);
        return;
      }
      
      if (stderr && !stderr.includes('warn')) {
        console.error(`${colors.yellow}⚠️ Warning: ${stderr}${colors.reset}`);
      }
      
      console.log(stdout);
      console.log(`${colors.green}✅ Database schema initialized successfully!${colors.reset}`);
      resolve();
    });
  });
}

// Main function to run the initialization process
async function main() {
  try {
    console.log(`${colors.cyan}=== ATS-Scan Database Initialization ===${colors.reset}\n`);
    
    // Step 1: Check PostgreSQL installation
    await checkPostgresInstallation();
    
    // Step 2: Test database connection
    const connectionSuccessful = await testDatabaseConnection();
    if (!connectionSuccessful) {
      console.error(`${colors.red}❌ Cannot proceed with database initialization due to connection issues${colors.reset}`);
      process.exit(1);
    }
    
    // Step 3: Initialize database schema
    await initializeDatabase();
    
    console.log(`\n${colors.green}✅ Database setup complete!${colors.reset}`);
    console.log(`${colors.cyan}You can now start the application with: npm run dev${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}❌ Database initialization failed: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

// Run the main function
main();