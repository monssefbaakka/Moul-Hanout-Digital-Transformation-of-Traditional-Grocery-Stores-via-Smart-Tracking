#!/usr/bin/env sh
# scripts/migrate.sh
# Safe Prisma migration workflow for team use.

set -e

echo "🗄️  Moul Hanout — Prisma Migration Helper"
echo "────────────────────────────────────────"

cd backend

case "$1" in
  dev)
    echo "Running: prisma migrate dev --name ${2:-'update'}"
    npx prisma migrate dev --name "${2:-update}"
    ;;
  deploy)
    echo "Running: prisma migrate deploy (production)"
    npx prisma migrate deploy
    ;;
  reset)
    echo "⚠️  WARNING: This will DROP all data!"
    echo "Press Ctrl+C to cancel, or Enter to continue..."
    read _
    npx prisma migrate reset
    ;;
  status)
    npx prisma migrate status
    ;;
  studio)
    echo "Opening Prisma Studio..."
    npx prisma studio
    ;;
  generate)
    npx prisma generate
    ;;
  *)
    echo "Usage: ./scripts/migrate.sh [dev|deploy|reset|status|studio|generate] [migration-name]"
    echo ""
    echo "  dev [name]   Create a new migration and apply it"
    echo "  deploy       Apply all pending migrations (production)"
    echo "  reset        ⚠️  Drop and recreate database"
    echo "  status       Show migration status"
    echo "  studio       Open Prisma Studio"
    echo "  generate     Regenerate Prisma client"
    ;;
esac
