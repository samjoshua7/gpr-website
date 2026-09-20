import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && val) env[key.trim()] = val.join('=').trim();
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function deepCheck() {
  console.log('--- Deep Check of Storage Buckets ---');

  // Check product-images
  const { data: prodList } = await supabase.storage.from('product-images').list('', {
    limit: 1000,
    offset: 0,
    sortBy: { column: 'name', order: 'asc' }
  });
  console.log('product-images root items:', prodList?.map(f => ({ name: f.name, id: f.id, size: f.metadata?.size })));

  // Check hero-banners root
  const { data: heroRoot } = await supabase.storage.from('hero-banners').list('', {
    limit: 1000,
    offset: 0,
    sortBy: { column: 'name', order: 'asc' }
  });
  console.log('hero-banners root items:', heroRoot?.map(f => ({ name: f.name, id: f.id, size: f.metadata?.size })));

  // Check hero-banners / banners/
  const { data: heroBanners } = await supabase.storage.from('hero-banners').list('banners', {
    limit: 1000,
    offset: 0,
    sortBy: { column: 'name', order: 'asc' }
  });
  console.log('hero-banners/banners items:', heroBanners?.map(f => ({ name: f.name, id: f.id, size: f.metadata?.size })));

  // Check company-assets
  const { data: companyAssets } = await supabase.storage.from('company-assets').list('', { limit: 1000 });
  console.log('company-assets items:', companyAssets?.map(f => ({ name: f.name, id: f.id, size: f.metadata?.size })));
}

deepCheck().catch(console.error);
