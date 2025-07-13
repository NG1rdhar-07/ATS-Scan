# ATS-Scan Resume Analyzer

A full-stack web application that analyzes resumes for ATS (Applicant Tracking System) compatibility. The application allows users to upload their resumes in PDF format, performs comprehensive analysis using AI, and provides detailed feedback on how to improve their resume's chances of passing through ATS systems.

## Features

- Resume upload and parsing
- AI-powered content analysis
- Format checking and scoring
- Keyword matching against job descriptions
- Personalized improvement suggestions
- Interview preparation questions

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for building
- shadcn/ui components with Radix UI
- Tailwind CSS for styling
- Framer Motion for animations

### Backend
- Node.js with Express
- TypeScript with ES modules
- PostgreSQL database with Neon serverless driver
- Drizzle ORM for database operations
- PDF parsing with pdf-parse
- AI integration with OpenAI or MoonshotAI

## Prerequisites

- Node.js (v18 or later)
- PostgreSQL database
- OpenAI API key or MoonshotAI Kimi K2 API key

## Setup Instructions

### 1. Clone the repository

```bash
git clone <repository-url>
cd ATS-Scan
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Copy the example environment file and update it with your values:

```bash
cp .env.example .env
```

Edit the `.env` file and update the following variables:
- `DATABASE_URL`: Your PostgreSQL connection string
- `OPENAI_API_KEY`: Your OpenAI API key or MoonshotAI Kimi K2 API key (Note: The application uses the MoonshotAI API endpoint by default, but the environment variable is still named `OPENAI_API_KEY` for compatibility)

### 4. Set up the database

#### Prerequisites

- PostgreSQL installed and running on your machine
- Ability to create a new database

#### Database Setup Steps

1. Create the PostgreSQL database using the provided script:

   ```bash
   npm run db:create
   ```

   This script will:
   - Check if PostgreSQL is installed and running
   - Connect to the default PostgreSQL database
   - Create the `ats_scan` database if it doesn't exist

2. Initialize the database schema:

   ```bash
   npm run db:init
   ```

   This script will:
   - Check if PostgreSQL is installed and running
   - Test the connection to the `ats_scan` database
   - Create all necessary tables and schema

#### Database Troubleshooting

- **Connection Refused Error**: Make sure PostgreSQL is installed and running on your machine
- **Database Not Found**: Create the `ats_scan` database manually using pgAdmin or command line
- **Authentication Failed**: Verify your PostgreSQL username and password in the `.env` file

For local development, the default connection string uses:
- Host: `localhost`
- Port: `5432`
- Username: `postgres`
- Password: `postgres`
- Database: `ats_scan`

#### Useful Database Commands

- **Check database connection**:
  ```bash
  npm run db:check
  ```
  This script will test the connection to your PostgreSQL database using the connection string from your `.env` file and provide troubleshooting tips if the connection fails.

- **Update database schema** (after making changes to the schema):
  ```bash
  npm run db:push
  ```

### 5. Start the development server

```bash
npm run dev
```

The application will be available at http://localhost:5000

## Complete Setup Guide (Quick Reference)

Here's a quick reference for setting up the application from scratch:

```bash
# 1. Clone the repository and navigate to the project directory
git clone <repository-url>
cd ATS-Scan

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env file with your API key and database settings

# 4. Create the PostgreSQL database
npm run db:create

# 5. Initialize the database schema
npm run db:init

# 6. Start the development server
npm run dev
```

After completing these steps, you can access the application at http://localhost:5000

## Building for Production

```bash
npm run build
npm run start
```

## Project Structure

- `client/` - React frontend application
- `server/` - Express.js backend application
- `shared/` - Shared TypeScript types and database schema

## License

MIT