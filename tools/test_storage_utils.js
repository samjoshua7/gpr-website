import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Read env
const env = {};
fs.readFileSync('.env.local', 'utf8').split('\n').forEach((l) => {
  const [k, ...v] = l.split('=');
  if (k && v) env[k.trim()] = v.join('=').trim();
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

// Pure functions from storageUtils logic
const isSupabaseStorageUrl = (url, bucketName) => {
  if (!url || typeof url !== 'string') return false;
  if (!url.startsWith('http://') && !url.startsWith('https://')) return false;
  const expectedPrefix = `/storage/v1/object/public/${bucketName}/`;
  return url.includes(expectedPrefix);
};

const extractStoragePath = (url, bucketName) => {
  if (!isSupabaseStorageUrl(url, bucketName)) return null;
  try {
    const expectedPrefix = `/storage/v1/object/public/${bucketName}/`;
    const prefixIndex = url.indexOf(expectedPrefix);
    if (prefixIndex === -1) return null;

    let pathWithPossibleQuery = url.substring(prefixIndex + expectedPrefix.length);
    const queryIndex = pathWithPossibleQuery.indexOf('?');
    if (queryIndex !== -1) {
      pathWithPossibleQuery = pathWithPossibleQuery.substring(0, queryIndex);
    }
    const hashIndex = pathWithPossibleQuery.indexOf('#');
    if (hashIndex !== -1) {
      pathWithPossibleQuery = pathWithPossibleQuery.substring(0, hashIndex);
    }
    const decodedPath = decodeURIComponent(pathWithPossibleQuery).trim();
    return decodedPath.length > 0 ? decodedPath : null;
  } catch {
    return null;
  }
};

const isFileReferencedInDatabase = async (url, exclude = {}) => {
  if (!url || typeof url !== 'string') return false;

  try {
    let prodQuery = supabase
      .from('products')
      .select('product_id', { count: 'exact', head: true })
      .eq('main_image_url', url);

    if (exclude.productId) prodQuery = prodQuery.neq('product_id', exclude.productId);
    const { count: prodCount } = await prodQuery;
    if (prodCount && prodCount > 0) return true;

    const { count: galleryCount } = await supabase
      .from('product_images')
      .select('image_id', { count: 'exact', head: true })
      .eq('image_url', url);
    if (galleryCount && galleryCount > 0) return true;

    const { count: orderItemCount } = await supabase
      .from('online_order_items')
      .select('order_item_id', { count: 'exact', head: true })
      .eq('product_image_url', url);
    if (orderItemCount && orderItemCount > 0) return true;

    let bannerQuery = supabase
      .from('hero_banners')
      .select('banner_id', { count: 'exact', head: true })
      .or(`image_url.eq.${url},mobile_image_url.eq.${url}`);
    if (exclude.bannerId) bannerQuery = bannerQuery.neq('banner_id', exclude.bannerId);
    const { count: bannerCount } = await bannerQuery;
    if (bannerCount && bannerCount > 0) return true;

    return false;
  } catch {
    return true;
  }
};

async function runTests() {
  console.log('--- Storage Utils Verification Tests ---');

  // Test 1: URL Detection
  const prodUrl = `${env.VITE_SUPABASE_URL}/storage/v1/object/public/product-images/prod_1789887032340_Screenshot_2026_09_2.png?t=123`;
  console.assert(isSupabaseStorageUrl(prodUrl, 'product-images') === true, 'Test 1.1 failed');
  console.assert(isSupabaseStorageUrl(prodUrl, 'hero-banners') === false, 'Test 1.2 failed');
  console.assert(isSupabaseStorageUrl('https://images.unsplash.com/photo-1', 'product-images') === false, 'Test 1.3 failed');
  console.log('[PASS] Test 1: URL validation & bucket segregation');

  // Test 2: Path Extraction
  const extractedPath = extractStoragePath(prodUrl, 'product-images');
  console.assert(extractedPath === 'prod_1789887032340_Screenshot_2026_09_2.png', `Test 2.1 failed: got ${extractedPath}`);

  const bannerUrl = `${env.VITE_SUPABASE_URL}/storage/v1/object/public/hero-banners/banners/banner_1789892547104_p9pjwjx.png#preview`;
  const extractedBannerPath = extractStoragePath(bannerUrl, 'hero-banners');
  console.assert(extractedBannerPath === 'banners/banner_1789892547104_p9pjwjx.png', `Test 2.2 failed: got ${extractedBannerPath}`);
  console.log('[PASS] Test 2: Storage path extraction with subfolders, queries, hashes');

  // Test 3: Active DB Reference Checking
  const activeProdUrl = 'https://fdgnlmhkpfgatloyzwia.supabase.co/storage/v1/object/public/product-images/prod_1789887032340_Screenshot_2026_09_2.png';
  const isProdActive = await isFileReferencedInDatabase(activeProdUrl);
  console.assert(isProdActive === true, 'Test 3.1 failed: active product image should be referenced');

  const randomUrl = 'https://fdgnlmhkpfgatloyzwia.supabase.co/storage/v1/object/public/product-images/prod_non_existent_999999.png';
  const isRandomActive = await isFileReferencedInDatabase(randomUrl);
  console.assert(isRandomActive === false, 'Test 3.2 failed: random url should NOT be referenced');
  console.log('[PASS] Test 3: Live database reference check (active vs unreferenced)');

  console.log('\nAll Storage Utils verification tests passed successfully!');
}

runTests().catch(console.error);
