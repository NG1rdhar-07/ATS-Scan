# ATS-Scan Resume Analyzer
#### Video Demo: https://youtu.be/jMdxsvkSbd4
#### Description:

ATS-Scan Resume Analyzer is a full-stack web application that analyzes resumes for ATS (Applicant Tracking System) compatibility. The application allows users to upload their resumes in PDF format, performs comprehensive analysis using AI, and provides detailed feedback on how to improve their resume's chances of passing through ATS systems.

## Features

- Resume upload and parsing
- AI-powered content analysis
- Format checking and scoring
- Keyword matching against job descriptions
- Personalized improvement suggestions
- Interview preparation questions

## Tech Stack

**Frontend**
- React 18 with TypeScript
- Vite for building
- shadcn/ui components with Radix UI
- Tailwind CSS for styling
- Framer Motion for animations

**Backend**
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
- `OPENAI_API_KEY`: Your OpenAI API key or MoonshotAI Kimi K2 API key

### 4. Set up the database

Create the PostgreSQL database:

```bash
npm run db:create
```

Initialize the database schema:

```bash
npm run db:init
```

### 5. Start the development server

```bash
npm run dev
```

The application will be available at http://localhost:5000

## Building for Production

```bash
npm run build
npm run start
```

## Project Structure

- `client/` - React frontend application
- `server/` - Express.js backend application
- `shared/` - Shared TypeScript types and database schema

## License & Copyright

© 2025 ATS-Scan Resume Analyzer. All rights reserved.

Do not copy, distribute, or reproduce this code without explicit permission.