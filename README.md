# PCM System (Personnel Career Management)

A comprehensive personnel management system built with Next.js 14, TypeScript, and Oracle Database.

## 📁 Project Structure

```
pcm-project/
├── apps/
│   └── web/                    # Next.js 14 web application
├── packages/
│   └── shared/                 # Shared TypeScript types and utilities
├── infrastructure/             # Infrastructure configuration
│   └── oracle/init/           # Oracle database initialization scripts
├── scripts/                    # Utility scripts
├── docs/                       # Project documentation
├── .env.example               # Environment variables template
├── docker-compose.yml         # Docker services configuration
└── package.json               # Root package.json for monorepo
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18.0.0 or higher
- npm 8.0.0 or higher
- Docker and Docker Compose

### Development Setup

1. **Clone and setup environment**
   ```bash
   git clone <repository-url>
   cd pcm-project
   cp .env.example .env
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development environment**
   ```bash
   # Start all services with Docker
   npm run docker:up
   
   # Or start development server only
   npm run dev
   ```

4. **Access the application**
   - Web App: http://localhost:3000
   - Oracle Database: localhost:1521

### Docker Commands

```bash
# Start all services
npm run docker:up

# Stop all services
npm run docker:down

# Build containers
npm run docker:build

# View logs
docker-compose logs -f
```

## 🛠️ Technology Stack

- **Frontend**: Next.js 14.x with App Router
- **UI Components**: shadcn/ui with Tailwind CSS
- **Language**: TypeScript 5.x
- **Database**: Oracle Database XE 21c
- **Testing**: Jest with Testing Library
- **Code Quality**: ESLint + Prettier
- **Containerization**: Docker & Docker Compose

## 📝 Development Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript compiler check
npm run test         # Run tests
```

## 🏗️ Monorepo Structure

This project uses npm workspaces to manage multiple packages:

- **@pcm/web**: Main Next.js application
- **@pcm/shared**: Shared types and utilities

## 🐳 Docker Services

- **web**: Next.js application (port 3000)
- **oracle**: Oracle Database XE (port 1521)

## 📋 Environment Variables

Copy `.env.example` to `.env` and configure:

```env
DATABASE_URL=oracle://pcm_user:PCMSystem123@localhost:1521/xe
DATABASE_SCHEMA=PCM
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
ORACLE_PWD=PCMSystem123
```

## 🔧 Development Guidelines

- Follow TypeScript strict mode
- Use ESLint and Prettier for code formatting
- Write tests for new features
- Follow conventional commits
- Use feature branches for development

## 📚 Documentation

- [Architecture Documentation](docs/architecture/)
- [API Documentation](docs/api/)
- [User Stories](docs/stories/)

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run tests: `npm test`
4. Run linting: `npm run lint`
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.