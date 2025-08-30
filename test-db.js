// Test Supabase database connection
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function testConnection() {
  try {
    console.log('🔄 Testing Supabase connection...');
    
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test connection by querying subscription plans
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .limit(1);
    
    if (error) {
      throw error;
    }
    
    console.log('✅ Database connection successful!');
    console.log('📊 Found subscription plans:', data.length);
    console.log('🎯 Your database is ready for production!');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('\n📝 Make sure to:');
    console.log('1. Update .env with your real Supabase URL and keys');
    console.log('2. Check that your Supabase project is active');
    console.log('3. Verify the database schema was created successfully');
  }
}

testConnection();
