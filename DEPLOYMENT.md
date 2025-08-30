# 🚀 ShagMe Dating App - Supabase + Vercel Deployment Guide

## 📋 Pre-Deployment Checklist

✅ All 6 Epics implemented (112+ story points)  
✅ Supabase client configured  
✅ Database schema ready  
✅ Environment variables template created  
✅ Vercel configuration setup  
✅ Production API service created  

## 🏗️ **Step 1: Set Up Supabase Backend**

### 1.1 Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Sign up/login and create a new project
3. Choose a name: `shagme-dating-app`
4. Set a strong database password
5. Choose your region (closest to your users)

### 1.2 Run Database Schema
1. In Supabase dashboard, go to **SQL Editor**
2. Copy and paste the entire content from `supabase/schema.sql`
3. Click **Run** to create all tables, indexes, and policies
4. Verify tables are created in **Table Editor**

### 1.3 Configure Storage
1. Go to **Storage** in Supabase dashboard
2. Create a new bucket called `photos`
3. Set bucket to **Public** (for user profile photos)
4. Configure upload policies as needed

### 1.4 Get API Keys
1. Go to **Settings** → **API**
2. Copy your **Project URL** and **anon public** key
3. Keep these secure - you'll need them for environment variables

## 🌐 **Step 2: Deploy to Vercel**

### 2.1 Prepare Environment Variables
1. Copy `.env.template` to `.env.local`
2. Fill in your Supabase credentials:
```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 2.2 Build and Test Locally
```bash
# Install dependencies
npm install

# Build for web
npm run build:web

# Test the build
npx serve dist
```

### 2.3 Deploy to Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy (first time)
vercel

# Follow prompts:
# - Link to existing project? No
# - Project name: shagme-dating-app
# - Directory: ./
# - Build command: npm run build:web
# - Output directory: dist

# Set environment variables in Vercel dashboard
# Or via CLI:
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY

# Deploy to production
vercel --prod
```

### 2.4 Configure Custom Domain (Optional)
1. In Vercel dashboard, go to your project
2. Go to **Settings** → **Domains**
3. Add your custom domain (e.g., `app.shagme.com`)
4. Configure DNS records as instructed

## 📱 **Step 3: Mobile App Deployment**

### 3.1 Configure for App Stores
```bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Configure EAS
eas build:configure

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```

### 3.2 Update App Configuration
Update `app.json`:
```json
{
  "expo": {
    "name": "ShagMe",
    "slug": "shagme-dating-app",
    "version": "1.0.0",
    "bundleIdentifier": "com.shagme.app",
    "package": "com.shagme.app",
    "extra": {
      "eas": {
        "projectId": "your-eas-project-id"
      }
    }
  }
}
```

## 🔐 **Step 4: Security Configuration**

### 4.1 Row Level Security (RLS)
The database schema includes comprehensive RLS policies:
- ✅ Users can only access their own data
- ✅ Discoverable profiles visible to potential matches
- ✅ Messages restricted to conversation participants
- ✅ Secure handling of sensitive information

### 4.2 Environment Security
- ✅ Never commit `.env.local` to git
- ✅ Use Vercel environment variables for production
- ✅ Rotate API keys regularly
- ✅ Monitor Supabase usage and logs

## 🧪 **Step 5: Testing Your Deployment**

### 5.1 Test Core Features
Visit your deployed app and test:
- ✅ User registration/login
- ✅ Profile creation
- ✅ Photo upload
- ✅ Matching system
- ✅ Messaging (real-time)
- ✅ Premium subscriptions

### 5.2 Mobile Testing
- ✅ Test on iOS/Android devices
- ✅ Verify offline functionality
- ✅ Test push notifications
- ✅ Validate app store guidelines compliance

## 📊 **Step 6: Monitoring & Analytics**

### 6.1 Supabase Monitoring
- Monitor database performance
- Track API usage and limits
- Set up alerts for errors
- Review security logs

### 6.2 Vercel Analytics
- Enable Vercel Analytics
- Monitor web performance
- Track user engagement
- Set up custom metrics

## 🚀 **Quick Deploy Commands**

```bash
# Complete deployment in one go
npm install
npm run build:web
vercel --prod

# For mobile builds
eas build --platform all
```

## 🎯 **Epic Features Deployed**

✅ **Epic 001**: User Verification System  
✅ **Epic 002**: Profile Management  
✅ **Epic 003**: Matching Engine  
✅ **Epic 004**: Real-time Messaging  
✅ **Epic 005**: Safety & Security  
✅ **Epic 006**: Premium Payments  

## 🔧 **Troubleshooting**

### Common Issues:
1. **Build fails**: Check TypeScript errors with `npm run typecheck`
2. **Environment variables not working**: Ensure proper prefix (`EXPO_PUBLIC_` or `NEXT_PUBLIC_`)
3. **Database connection fails**: Verify Supabase URL and keys
4. **RLS blocking queries**: Check your database policies
5. **Photos not uploading**: Verify storage bucket permissions

### Support Resources:
- [Supabase Documentation](https://supabase.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Expo Documentation](https://docs.expo.dev)

## 🎉 **You're Live!**

Your ShagMe dating app is now deployed with:
- 🏢 Production Supabase backend
- 🌐 Vercel web hosting
- 📱 Mobile app builds ready
- 🔒 Enterprise-grade security
- 📈 Scalable architecture

**Next Steps**: Monitor performance, gather user feedback, and iterate on features!

---

*Built with ❤️ using React Native, Supabase, and Vercel*
