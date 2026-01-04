# NUS Mod Planner (Degree Autopilot)

A multi-service platform that automatically plans all remaining semesters for NUS students and optimizes for workload and risk using structured rules, constraint programming, and RAG-powered module similarity analysis.

## 🚀 Features

- **Automated Multi-Semester Planning**: Generate complete study plans for remaining semesters
- **Smart Optimization**: Balance workload and risk using constraint programming (OR-Tools CP-SAT)
- **Module Similarity Detection**: RAG + embeddings to detect conceptual collisions and module closeness
- **Workload & Risk Modeling**: Rules-based scoring with ML capabilities
- **Interactive Planning**: Pin modules, adjust constraints, and regenerate plans on-the-fly
- **NUS Module Integration**: Real-time sync with NUSMods data

## 📋 Table of Contents

- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## 🏗 Architecture

The system consists of three main services:

1. **Frontend** (Next.js)
   - Planner UI, onboarding flow, timeline visualization
   - Risk dashboard and module exploration
   - Calls Backend API exclusively

2. **Backend API** (Node.js/TypeScript)
   - Authentication and user profiles
   - Plan storage and module caching
   - Orchestrates AI service calls
   - Handles NUSMods sync and data ingestion

3. **AI Service** (Python/FastAPI)
   - Constraint-based planner optimization (CP-SAT)
   - Workload and risk scoring
   - RAG similarity and collision detection

### Data Stores

- **PostgreSQL**: Users, plans, cached modules, requirements
- **pgvector**: Vector embeddings for module similarity
- **Redis** (optional): Caching for heavy queries

For detailed architecture information, see [docs/architecture.md](docs/architecture.md).

## 🛠 Tech Stack

### Frontend
- **Framework**: Next.js 16 (React 19)
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **Drag & Drop**: dnd-kit
- **State Management**: TanStack Query (React Query)
- **Authentication**: Supabase Auth
- **PDF Export**: jsPDF, html2canvas

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Supabase
- **Vector Search**: pgvector
- **Authentication**: JWT + Supabase
- **Validation**: Zod
- **Testing**: Jest, Supertest
- **Logging**: Winston

### AI Service
- **Framework**: Python/FastAPI
- **Optimization**: OR-Tools CP-SAT
- **Embeddings**: OpenAI API
- **Vector Operations**: pgvector

## 🚀 Getting Started

### Prerequisites

- Node.js 20+ and npm/yarn
- PostgreSQL 14+
- Python 3.9+ (for AI service)
- Docker (optional, for containerized deployment)
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/nus-mod-planner.git
   cd nus-mod-planner
   ```

2. **Install Backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install Frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

### Environment Variables

#### Backend (.env)
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/nusmods
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key

# JWT
JWT_SECRET=your_jwt_secret

# OpenAI (for embeddings)
OPENAI_API_KEY=your_openai_api_key

# Server
PORT=3001
NODE_ENV=development
```

#### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Running the Application

#### Development Mode

1. **Start the Backend**
   ```bash
   cd backend
   npm run dev
   ```
   The backend will run on `http://localhost:3001`

2. **Start the Frontend**
   ```bash
   cd frontend
   npm run dev
   ```
   The frontend will run on `http://localhost:3000`

#### Production Build

1. **Build Backend**
   ```bash
   cd backend
   npm run build
   npm start
   ```

2. **Build Frontend**
   ```bash
   cd frontend
   npm run build
   npm start
   ```

#### Docker Deployment

```bash
# Backend
cd backend
docker-compose up -d
```

## 📁 Project Structure

```
nus-mod-planner/
├── backend/
│   ├── src/
│   │   ├── modules/          # Domain modules (module, plan, programme, user)
│   │   ├── middleware/       # Auth middleware
│   │   ├── lib/              # Supabase client
│   │   └── index.ts          # Express server
│   ├── tests/
│   └── package.json
├── frontend/
│   ├── app/                  # Next.js app router pages
│   │   ├── dashboard/
│   │   ├── planner/
│   │   ├── modules/
│   │   └── onboarding/
│   ├── components/           # React components
│   ├── hooks/                # Custom React hooks
│   ├── lib/                  # Utilities and API client
│   └── package.json
└── docs/
    ├── architecture.md       # System architecture
    └── api-spec.md          # API documentation
```

## 📖 API Documentation

See [docs/api-spec.md](docs/api-spec.md) for detailed API documentation.

### Key Endpoints

- `POST /plans/generate` - Generate a new multi-semester plan
- `GET /modules` - List and search NUS modules
- `GET /programmes` - List available degree programmes
- `POST /auth/login` - User authentication

## 🧪 Testing

### Backend Tests

```bash
cd backend

# Run all tests
npm test

# Run unit tests only
npm run test:unit
```

### Frontend Tests

```bash
cd frontend
npm run lint
```

## 🚢 Deployment

### Backend Deployment

The backend includes Docker configuration:

- `Dockerfile` - Container image definition
- `docker-compose.yml` - Local development setup
- `Dockerrun.aws.json` - AWS Elastic Beanstalk configuration

### Frontend Deployment

The frontend can be deployed to Vercel, Netlify, or any Node.js hosting platform:

```bash
npm run build
npm start
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [NUSMods](https://nusmods.com/) for module data
- NUS students and faculty for feedback
- Open source community for amazing tools and libraries

## 📞 Support

For questions or support, please open an issue in the GitHub repository.

---

Built with ❤️ for NUS students
