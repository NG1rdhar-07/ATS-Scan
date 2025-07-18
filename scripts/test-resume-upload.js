#!/usr/bin/env node

/**
 * Resume Upload Test Script for ATS-Scan
 * 
 * This script tests the resume upload functionality by making a direct API call
 * to the /api/resumes/upload endpoint with a sample PDF file.
 * 
 * Usage: node scripts/test-resume-upload.js [path-to-pdf]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import FormData from 'form-data';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

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
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Get the port from environment variables or use default
const PORT = process.env.PORT || 5000;
const API_URL = `http://localhost:${PORT}/api/resumes/upload`;

// Get the PDF file path from command line arguments or use a default sample
let pdfPath = process.argv[2];

if (!pdfPath) {
  console.log(`${colors.yellow}⚠️ No PDF file specified, looking for a sample PDF...${colors.reset}`);
  
  // Look for PDF files in the project root
  const rootDir = path.resolve(process.cwd());
  const files = fs.readdirSync(rootDir);
  const pdfFiles = files.filter(file => file.toLowerCase().endsWith('.pdf'));
  
  if (pdfFiles.length > 0) {
    pdfPath = path.join(rootDir, pdfFiles[0]);
    console.log(`${colors.green}✅ Found sample PDF: ${pdfPath}${colors.reset}`);
  } else {
    console.error(`${colors.red}❌ No PDF files found in the project root directory${colors.reset}`);
    console.error('Please provide a path to a PDF file as an argument:');
    console.error('  node scripts/test-resume-upload.js path/to/resume.pdf');
    process.exit(1);
  }
}

// Check if the file exists
if (!fs.existsSync(pdfPath)) {
  console.error(`${colors.red}❌ File not found: ${pdfPath}${colors.reset}`);
  process.exit(1);
}

// Check if the file is a PDF
if (!pdfPath.toLowerCase().endsWith('.pdf')) {
  console.error(`${colors.red}❌ File is not a PDF: ${pdfPath}${colors.reset}`);
  console.error('Please provide a PDF file.');
  process.exit(1);
}

console.log(`${colors.cyan}=== ATS-Scan Resume Upload Test ===${colors.reset}\n`);
console.log(`Testing resume upload with file: ${pdfPath}`);
console.log(`API endpoint: ${API_URL}\n`);

// Create a form data object
const form = new FormData();
form.append('file', fs.createReadStream(pdfPath));

// Make the API request
async function uploadResume() {
  try {
    console.log(`${colors.blue}🔄 Uploading resume...${colors.reset}`);
    
    const response = await fetch(API_URL, {
      method: 'POST',
      body: form,
      headers: form.getHeaders(),
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log(`${colors.green}✅ Resume uploaded successfully!${colors.reset}`);
      console.log('Response:', JSON.stringify(data, null, 2));
      
      // If the upload was successful, provide next steps
      if (data.id) {
        console.log(`\n${colors.cyan}Next steps:${colors.reset}`);
        console.log(`1. Use the resume ID (${data.id}) to analyze against a job description`);
        console.log(`2. API endpoint: POST /api/resumes/${data.id}/analyze`);
      }
    } else {
      console.error(`${colors.red}❌ Resume upload failed with status: ${response.status}${colors.reset}`);
      console.error('Error details:', JSON.stringify(data, null, 2));
      
      // Provide troubleshooting tips based on the error
      console.error(`\n${colors.yellow}Troubleshooting tips:${colors.reset}`);
      
      if (response.status === 500) {
        console.error('1. Check if the PostgreSQL database is running');
        console.error('2. Verify your DATABASE_URL in the .env file');
        console.error('3. Run the database connection test: npm run db:check');
        console.error('4. Check the server logs for more details');
      } else if (response.status === 400) {
        console.error('1. Make sure the file is a valid PDF');
        console.error('2. Check if the file is not corrupted');
      } else if (response.status === 413) {
        console.error('1. The file is too large');
        console.error('2. Try with a smaller PDF file');
      }
    }
  } catch (error) {
    console.error(`${colors.red}❌ Error: ${error.message}${colors.reset}`);
    
    if (error.code === 'ECONNREFUSED') {
      console.error(`\n${colors.yellow}Troubleshooting tips:${colors.reset}`);
      console.error('1. Make sure the server is running (npm run dev)');
      console.error(`2. Check if the server is running on port ${PORT}`);
    }
  }
}

// Run the upload function
uploadResume();