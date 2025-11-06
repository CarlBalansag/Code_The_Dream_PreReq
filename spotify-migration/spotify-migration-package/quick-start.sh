#!/bin/bash

# Quick Start Script for Migration
# Run this after extracting the archive

echo "🚀 Spotify Migration Quick Start"
echo "================================="
echo ""

# Check if in correct directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Run this script from the spotify-migration-package directory"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check for .env
if [ ! -f ".env" ]; then
    echo "⚙️  Creating .env file..."
    cp .env.example .env
    echo ""
    echo "⚠️  IMPORTANT: Edit .env with your database connection strings:"
    echo "   - MONGODB_URI (your existing MongoDB)"
    echo "   - DATABASE_URL (your new PostgreSQL)"
    echo ""
    echo "Press Enter when you've updated .env..."
    read
fi

# Validate .env
source .env
if [ -z "$MONGODB_URI" ] || [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: .env file is not configured properly"
    echo "   Make sure MONGODB_URI and DATABASE_URL are set"
    exit 1
fi

echo ""
echo "✅ Configuration looks good!"
echo ""
echo "Available commands:"
echo "  npm run setup:postgres    - Create PostgreSQL schema"
echo "  npm run migrate:dry-run   - Test migration (no data written)"
echo "  npm run migrate           - Run full migration"
echo "  npm run verify            - Verify migration success"
echo ""
echo "Recommended next steps:"
echo "  1. npm run setup:postgres"
echo "  2. npm run migrate:dry-run"
echo "  3. npm run migrate"
echo "  4. npm run verify"
echo ""
