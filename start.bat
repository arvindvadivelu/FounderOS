@echo off
cd /d "%~dp0"
title FounderOS Server

echo Starting FounderOS Development Server...
echo Opening http://localhost:5173/ in your browser...

start http://localhost:5173/
npm run dev

