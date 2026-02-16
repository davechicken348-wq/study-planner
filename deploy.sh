#!/bin/bash

# StudyPlanner - GitHub Pages Deployment Script
# Run this script to deploy your app to GitHub Pages

echo "🚀 StudyPlanner - GitHub Pages Deployment"
echo "=========================================="
echo ""

# Step 1: Configure Git (if not already done)
echo "📝 Step 1: Configure Git"
echo "Enter your name:"
read -r git_name
echo "Enter your email:"
read -r git_email

git config --global user.name "$git_name"
git config --global user.email "$git_email"
echo "✅ Git configured"
echo ""

# Step 2: Commit changes
echo "📦 Step 2: Creating initial commit"
git add .
git commit -m "Initial commit: StudyPlanner - Spaced Repetition Learning App"
echo "✅ Changes committed"
echo ""

# Step 3: Rename branch to main
echo "🔄 Step 3: Renaming branch to main"
git branch -M main
echo "✅ Branch renamed"
echo ""

# Step 4: Add remote repository
echo "🔗 Step 4: Connect to GitHub"
echo "Enter your GitHub username:"
read -r github_username
echo "Enter repository name (e.g., study-planner):"
read -r repo_name

git remote add origin "https://github.com/$github_username/$repo_name.git"
echo "✅ Remote added"
echo ""

# Step 5: Push to GitHub
echo "⬆️  Step 5: Pushing to GitHub"
echo "You may be prompted for your GitHub credentials..."
git push -u origin main
echo ""

if [ $? -eq 0 ]; then
    echo "✅ SUCCESS! Your app is now on GitHub!"
    echo ""
    echo "📋 Next Steps:"
    echo "1. Go to: https://github.com/$github_username/$repo_name"
    echo "2. Click 'Settings' → 'Pages'"
    echo "3. Under 'Source', select 'main' branch"
    echo "4. Click 'Save'"
    echo "5. Wait 1-2 minutes"
    echo "6. Your site will be live at:"
    echo "   https://$github_username.github.io/$repo_name/"
    echo ""
    echo "🎉 Congratulations! Your StudyPlanner is ready to share!"
else
    echo "❌ Push failed. Please check your credentials and try again."
    echo ""
    echo "💡 Make sure you:"
    echo "1. Created a repository on GitHub first"
    echo "2. Have the correct username and repo name"
    echo "3. Have push access to the repository"
fi
