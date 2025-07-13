@echo off
echo ATS-Scan Setup Script
echo =====================

echo Installing dependencies...
npm install

echo.
echo Setting up environment...
if not exist .env (
    echo Creating .env file from template...
    copy .env.example .env
    echo Please update the .env file with your database and API credentials.
    echo.
    echo Press any key to open the .env file for editing...
    pause > nul
    notepad .env
) else (
    echo .env file already exists.
)

echo.
echo Would you like to initialize the database now? (Y/N)
set /p init=

if /i "%init%"=="Y" (
    echo.
    echo Initializing database...
    npm run db:init
) else (
    echo.
    echo Skipping database initialization.
    echo You can initialize the database later by running: npm run db:init
)

echo.
echo Setup complete!
echo To start the development server, run: npm run dev
echo.

pause