#!/bin/bash

echo "ATS-Scan Setup Script"
echo "====================="

echo "Installing dependencies..."
npm install

echo ""
echo "Setting up environment..."
if [ ! -f .env ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    echo "Please update the .env file with your database and API credentials."
    echo ""
    read -p "Press enter to open the .env file for editing..."
    if [ "$(uname)" == "Darwin" ]; then
        # macOS
        open -t .env
    else
        # Linux
        if command -v nano &> /dev/null; then
            nano .env
        elif command -v vim &> /dev/null; then
            vim .env
        else
            echo "Please edit the .env file manually with your preferred text editor."
        fi
    fi
else
    echo ".env file already exists."
fi

echo ""
read -p "Would you like to initialize the database now? (y/N) " init

if [[ $init =~ ^[Yy]$ ]]; then
    echo ""
    echo "Initializing database..."
    npm run db:init
else
    echo ""
    echo "Skipping database initialization."
    echo "You can initialize the database later by running: npm run db:init"
fi

echo ""
echo "Setup complete!"
echo "To start the development server, run: npm run dev"
echo ""

read -p "Press enter to exit..."