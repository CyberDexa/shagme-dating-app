#!/bin/bash

# Commands to run after creating your GitHub repository
# Replace YOUR_USERNAME with your actual GitHub username

echo "🚀 Pushing ShagMe Dating App to GitHub..."

# Add the remote origin (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/shagme-dating-app.git

# Rename branch to main if needed
git branch -M main

# Push to GitHub
git push -u origin main

echo "✅ Successfully pushed to GitHub!"
echo "📱 Your complete dating app with all 6 Epics is now on GitHub"
echo "🔗 Repository: https://github.com/YOUR_USERNAME/shagme-dating-app"

# Next step instructions
echo ""
echo "🚀 Next Steps for Deployment:"
echo "1. Set up Supabase project at https://supabase.com"
echo "2. Run the database schema from supabase/schema.sql"
echo "3. Deploy to Vercel at https://vercel.com"
echo "4. Connect your GitHub repo for automatic deployments"
echo ""
echo "📖 Full deployment guide: ./DEPLOYMENT.md"
