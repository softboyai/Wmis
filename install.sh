#!/bin/bash
# WMIS Installation Script for Mac/Linux
# Run: chmod +x install.sh && ./install.sh

echo ""
echo "============================================"
echo "  WMIS - AGL Rwanda Installation Script    "
echo "============================================"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed!"
    echo "Download from: https://nodejs.org"
    exit 1
fi
echo "Node.js: $(node --version)"

# Create .env if not exists
if [ ! -f ".env" ]; then
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo ".env created. Edit MONGO_URI if needed."
fi

# Install dependencies
echo ""
echo "Installing all dependencies..."
npm install --no-audit --no-fund
cd server && npm install --no-audit --no-fund && cd ..
cd client && npm install --no-audit --no-fund && cd ..

echo ""
echo "============================================"
echo "  Installation Complete!"
echo "============================================"
echo ""
echo "Next steps:"
echo "  1. Start MongoDB:"
echo "     macOS: brew services start mongodb-community"
echo "     Linux: sudo systemctl start mongod"
echo ""
echo "  2. Seed the database:"
echo "     npm run seed"
echo ""
echo "  3. Start the app (browser opens automatically):"
echo "     npm run dev"
echo ""
echo "  App URL: http://localhost:5173"
echo ""
