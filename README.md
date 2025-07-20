# 🎯 ATS-Scan Resume Analyzer

[![Watch the demo](https://img.youtube.com/vi/jMdxsvkSbd4/maxresdefault.jpg)](https://youtu.be/jMdxsvkSbd4)

> **Smart AI-powered resume analysis for better ATS compatibility**

Transform your resume into an ATS-friendly powerhouse. Upload, analyze, and optimize your resume with AI-driven insights to pass through Applicant Tracking Systems effortlessly.

---

## ✨ Key Features

🔍 **Smart Analysis** - AI-powered content evaluation  
📊 **ATS Scoring** - Format compatibility assessment  
🎯 **Keyword Matching** - Job description optimization  
💡 **Action Items** - Personalized improvement suggestions  
🎤 **Interview Prep** - AI-generated practice questions  

---

## 🚀 Tech Stack

**Frontend**
- React 18 + TypeScript
- Vite + Tailwind CSS
- shadcn/ui + Framer Motion

**Backend**
- Node.js + Express
- PostgreSQL + Drizzle ORM
- AI Integration (OpenAI/MoonshotAI)

---

## ⚡ Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL
- OpenAI or MoonshotAI API key

### Installation

```bash
# Clone & setup
git clone <repository-url>
cd ATS-Scan
npm install

# Environment setup
cp .env.example .env
# Edit .env with your API keys and database URL

# Database setup // Make sure you have PostgreSQL installed on machine locally !!
npm run db:create
npm run db:init

# Start development
npm run dev
```

🎉 **That's it!** Visit `http://localhost:5000`

---

## 🛠️ Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run db:create` | Create PostgreSQL database |
| `npm run db:init` | Initialize database schema |
| `npm run db:check` | Test database connection |

---

## 🤝 Contributing

We welcome contributions! Feel free to submit issues and pull requests. We need to fix some bugs :) ...

📄 License & Copyright
© 2025 ATS-Scan Resume Analyzer. All rights reserved.
⚠️ Do not copy, distribute, or reproduce this code without explicit permission.

---

<div align="center">
  <strong>Made with ❤️</strong>
</div>