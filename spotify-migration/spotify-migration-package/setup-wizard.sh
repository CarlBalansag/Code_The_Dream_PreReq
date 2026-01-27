#!/bin/bash

# Interactive Setup Wizard

echo "╔════════════════════════════════════════════════════════╗"
echo "║  Migration Setup Wizard                                ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install Node.js first."
    exit 1
fi

# Install dependencies
echo "📦 Step 1/5: Installing dependencies..."
npm install --silent
echo "✅ Dependencies installed"
echo ""

# Configure .env
echo "⚙️  Step 2/5: Database Configuration"
echo ""

if [ -f ".env" ]; then
    echo "Found existing .env file."
    read -p "Do you want to reconfigure? (y/N): " reconfigure
    if [[ ! $reconfigure =~ ^[Yy]$ ]]; then
        source .env
    fi
fi

if [ ! -f ".env" ] || [[ $reconfigure =~ ^[Yy]$ ]]; then
    echo ""
    echo "Let's configure your database connections..."
    echo ""
    
    read -p "Enter your MongoDB URI: " MONGODB_URI
    echo ""
    
    echo "Choose your PostgreSQL provider:"
    echo "  1) Supabase (500MB free)"
    echo "  2) Neon (512MB free)"
    echo "  3) Vercel Postgres (256MB free)"
    echo "  4) Other/Custom"
    echo ""
    read -p "Select option (1-4): " provider
    
    echo ""
    read -p "Enter your PostgreSQL connection string: " DATABASE_URL
    
    # Create .env
    cat > .env << EOL
# MongoDB Configuration
MONGODB_URI=$MONGODB_URI

# PostgreSQL Configuration
DATABASE_URL=$DATABASE_URL

# Migration Settings
BATCH_SIZE=1000
EOL
    
    echo "✅ Configuration saved to .env"
fi

echo ""
echo "🏗️  Step 3/5: Creating PostgreSQL schema..."
read -p "Press Enter to continue..."

npm run setup:postgres

if [ $? -ne 0 ]; then
    echo "❌ Schema creation failed. Check your DATABASE_URL"
    exit 1
fi

echo "✅ Schema created successfully"
echo ""

# Dry run
echo "🔍 Step 4/5: Running dry-run migration (no data will be written)"
read -p "Press Enter to continue..."
echo ""

npm run migrate:dry-run

if [ $? -ne 0 ]; then
    echo "❌ Dry run failed. Please check the errors above."
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Dry run completed successfully!"
echo ""
echo "🚀 Step 5/5: Ready for actual migration"
echo ""
echo "The dry run showed what would be migrated."
echo "Now you can run the actual migration."
echo ""
read -p "Do you want to run the full migration now? (y/N): " confirm

if [[ $confirm =~ ^[Yy]$ ]]; then
    echo ""
    echo "🚀 Starting full migration..."
    echo ""
    npm run migrate
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Migration completed!"
        echo ""
        echo "Running verification..."
        npm run verify
        
        echo ""
        echo "╔════════════════════════════════════════════════════════╗"
        echo "║  Migration Complete! 🎉                               ║"
        echo "╚════════════════════════════════════════════════════════╝"
        echo ""
        echo "Next steps:"
        echo "  1. Review the verification results above"
        echo "  2. Update your application code (see QUERY_GUIDE.md)"
        echo "  3. Test your application thoroughly"
        echo "  4. Keep MongoDB running until you're confident"
        echo "  5. Cancel MongoDB subscription when ready"
        echo ""
    fi
else
    echo ""
    echo "No problem! Run this when you're ready:"
    echo "  npm run migrate"
    echo ""
fi
