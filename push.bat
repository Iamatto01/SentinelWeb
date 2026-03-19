@echo off
cd /d "F:\INI KALI LA\PROJECTxHADIF"

echo.
echo === Git Remote Updated to SentinelWeb ===
git remote -v

echo.
echo === Git Status Before ===
git status --short

echo.
echo === Adding all files ===
git add -A

echo.
echo === Git Status After Add ===
git status --short

echo.
echo === Committing changes ===
git commit -m "feat: Rebrand to SentinalWeb with professional UI and admin panel

- Changed branding from Iamatto Web Catalog to SentinalWeb
- Redesigned How to buy button (removed arrow, enhanced styling)
- Implemented glassmorphism design throughout the app
- Added professional admin dashboard with client editing capabilities
- Implemented secure email-based authentication
- Added real-time feedback and validation messages
- Enhanced admin panel UI with better typography and spacing
- Added keyboard shortcuts (Ctrl+S to save)
- Improved error handling and user experience
- Updated documentation and README

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"

echo.
echo === Pushing to GitHub (SentinelWeb) ===
git push -u origin main

echo.
echo === Push Complete ===
git log --oneline -1

echo.
echo === Verify Remote ===
git remote -v

pause

