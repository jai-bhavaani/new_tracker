git init
git branch -M main
git remote remove origin 2>nul
git remote add origin https://github.com/jai-bhavaani/new_tracker.git
git add .
git commit -m "Updated code and added new features"
git push -u origin main --force


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
