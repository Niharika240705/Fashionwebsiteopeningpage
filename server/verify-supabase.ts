
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load env from current directory
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const bucketName = process.env.SUPABASE_BUCKET || 'processed-images';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase credentials missing in .env');
  console.error(`URL: ${supabaseUrl ? 'Set' : 'Missing'}`);
  console.error(`Key: ${supabaseKey ? 'Set' : 'Missing'}`);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSupabase() {
  console.log(`Testing connection to ${supabaseUrl}...`);
  try {
    const { data, error } = await supabase.storage.getBucket(bucketName);

    if (error) {
      console.error(`❌ Error accessing bucket '${bucketName}':`, error.message);
      console.log('TIP: If the bucket needs to be public, please check your Supabase dashboard.');
    } else {
      console.log(`✅ Bucket '${bucketName}' found and accessible.`);
    }
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

checkSupabase();
