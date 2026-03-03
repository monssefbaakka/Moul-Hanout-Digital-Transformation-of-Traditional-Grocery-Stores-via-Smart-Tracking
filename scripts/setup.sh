#!/usr/bin/env sh
# scripts/setup.sh
# Bootstrap the monorepo for a new developer in one command.

set -e

echo "╔═══════════════════════════════════════════╗"
echo "║   Moul Hanout — Dev Environment Setup    ║"
echo "╚═══════════════════════════════════════════╝"

# 1. Copy .env files if they don't exist
echo "\n📄 Setting up environment files..."
[ -f .env ] || cp .env.example .env && echo "  ✅ Root .env created"
[ -f backend/.env ] || cp backend/.env.example backend/.env && echo "  ✅ Backend .env created"
[ -f frontend/.env.local ] || cp frontend/.env.example frontend/.env.local && echo "  ✅ Frontend .env.local created"

echo "\n⚠️  Remember to update .env files with your actual secrets before running!"

# 2. Install backend dependencies
echo "\n📦 Installing backend dependencies..."
cd backend && npm ci && cd ..

# 3. Install frontend dependencies
echo "\n📦 Installing frontend dependencies..."
cd frontend && npm ci && cd ..

# 4. Run Prisma migrations
echo "\n🗄️  Running Prisma database migrations..."
cd backend && npx prisma migrate dev --name init && cd ..

# 5. Seed the database
echo "\n🌱 Seeding database..."
cd backend && npx ts-node prisma/seeds/seed.ts && cd ..

echo "\n✅ Setup complete!"
echo "   → Backend:  cd backend && npm run start:dev"
echo "   → Frontend: cd frontend && npm run dev"
echo "   → Docker:   docker-compose up -d"
