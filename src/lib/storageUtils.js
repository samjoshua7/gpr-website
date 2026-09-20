import { supabase } from './supabaseClient.js';

/**
 * Validates if a URL belongs to this project's Supabase Storage bucket.
 * Prevents attempting to delete external assets (e.g. Unsplash, CDNs, data URIs).
 *
 * @param {string} url - The URL to inspect
 * @param {string} bucketName - Expected bucket name (e.g. 'product-images', 'hero-banners')
 * @returns {boolean}
 */
export const isSupabaseStorageUrl = (url, bucketName) => {
  if (!url || typeof url !== 'string') return false;
  if (!url.startsWith('http://') && !url.startsWith('https://')) return false;

  const expectedPrefix = `/storage/v1/object/public/${bucketName}/`;
  return url.includes(expectedPrefix);
};

/**
 * Safely extracts the relative object path within a Supabase Storage bucket.
 * Handles subfolders (e.g. 'banners/my_file.png'), URL query parameters, and URL encoding.
 *
 * @param {string} url - Full public Supabase Storage URL
 * @param {string} bucketName - Bucket name
 * @returns {string|null} - Storage path (e.g. 'prod_123.png' or 'banners/banner_123.png') or null if invalid
 */
export const extractStoragePath = (url, bucketName) => {
  if (!isSupabaseStorageUrl(url, bucketName)) return null;

  try {
    const expectedPrefix = `/storage/v1/object/public/${bucketName}/`;
    const prefixIndex = url.indexOf(expectedPrefix);
    if (prefixIndex === -1) return null;

    let pathWithPossibleQuery = url.substring(prefixIndex + expectedPrefix.length);
    // Strip query parameters (?t=...) and hash
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
  } catch (err) {
    console.error('Error extracting storage path from URL:', url, err);
    return null;
  }
};

/**
 * Checks whether an image URL is still actively referenced anywhere in the database:
 * - products (main_image_url)
 * - product_images (image_url)
 * - online_order_items (product_image_url) -- CRITICAL: Immutable customer order snapshots!
 * - hero_banners (image_url or mobile_image_url)
 *
 * @param {string} url - The image URL to check
 * @param {object} [exclude] - Optional record IDs to exclude from check (e.g. during an update)
 * @param {string} [exclude.productId] - Exclude this product_id
 * @param {string} [exclude.bannerId] - Exclude this banner_id
 * @returns {Promise<boolean>} - True if referenced, false if unreferenced (safe to delete)
 */
export const isFileReferencedInDatabase = async (url, exclude = {}) => {
  if (!url || typeof url !== 'string') return false;

  try {
    // 1. Check products (main_image_url)
    let prodQuery = supabase
      .from('products')
      .select('product_id', { count: 'exact', head: true })
      .eq('main_image_url', url);

    if (exclude.productId) {
      prodQuery = prodQuery.neq('product_id', exclude.productId);
    }
    const { count: prodCount, error: prodErr } = await prodQuery;
    if (prodErr) throw prodErr;
    if (prodCount && prodCount > 0) return true;

    // 2. Check product_images (gallery table)
    const { count: galleryCount, error: galleryErr } = await supabase
      .from('product_images')
      .select('image_id', { count: 'exact', head: true })
      .eq('image_url', url);

    if (galleryErr) throw galleryErr;
    if (galleryCount && galleryCount > 0) return true;

    // 3. CRITICAL: Check online_order_items (immutable customer order snapshot)
    // Never delete images that historical customer receipts or order histories depend on!
    const { count: orderItemCount, error: orderItemErr } = await supabase
      .from('online_order_items')
      .select('order_item_id', { count: 'exact', head: true })
      .eq('product_image_url', url);

    if (orderItemErr) throw orderItemErr;
    if (orderItemCount && orderItemCount > 0) return true;

    // 4. Check hero_banners (desktop image_url or mobile_image_url)
    let bannerQuery = supabase
      .from('hero_banners')
      .select('banner_id', { count: 'exact', head: true })
      .or(`image_url.eq.${url},mobile_image_url.eq.${url}`);

    if (exclude.bannerId) {
      bannerQuery = bannerQuery.neq('banner_id', exclude.bannerId);
    }
    const { count: bannerCount, error: bannerErr } = await bannerQuery;
    if (bannerErr) throw bannerErr;
    if (bannerCount && bannerCount > 0) return true;

    return false;
  } catch (err) {
    // If reference check fails due to network/RLS, assume it IS referenced for safety
    console.error('Reference check failed for image URL, aborting deletion for safety:', url, err);
    return true;
  }
};

/**
 * Deletes a file from Supabase Storage ONLY if it is not referenced anywhere in the database.
 * If the URL is external or still in use (e.g. historical orders), deletion is safely skipped.
 *
 * @param {string} url - The full image URL
 * @param {string} bucketName - Bucket name ('product-images' or 'hero-banners')
 * @param {object} [exclude] - Optional IDs to exclude from reference check
 * @returns {Promise<{ deleted: boolean, reason?: string }>}
 */
export const deleteStorageFileIfUnreferenced = async (url, bucketName, exclude = {}) => {
  if (!url || !bucketName) {
    return { deleted: false, reason: 'Invalid arguments' };
  }

  // Check if it belongs to our Supabase Storage bucket
  if (!isSupabaseStorageUrl(url, bucketName)) {
    return { deleted: false, reason: 'External URL or different bucket' };
  }

  const storagePath = extractStoragePath(url, bucketName);
  if (!storagePath) {
    return { deleted: false, reason: 'Could not resolve relative storage path' };
  }

  // Check if any database records still reference this URL
  const isReferenced = await isFileReferencedInDatabase(url, exclude);
  if (isReferenced) {
    return { deleted: false, reason: 'Image is still referenced in database or historical orders' };
  }

  try {
    const { error } = await supabase.storage
      .from(bucketName)
      .remove([storagePath]);

    if (error) {
      console.warn(`Supabase storage deletion failed for ${storagePath} in ${bucketName}:`, error.message);
      return { deleted: false, reason: error.message };
    }

    return { deleted: true };
  } catch (err) {
    console.warn(`Exception while deleting storage file ${storagePath}:`, err.message);
    return { deleted: false, reason: err.message };
  }
};

/**
 * Directly removes a file from Supabase Storage.
 * Used for immediate rollback when an upload succeeded but a subsequent database operation failed.
 *
 * @param {string} url - Uploaded URL to roll back
 * @param {string} bucketName - Target bucket
 * @returns {Promise<boolean>}
 */
export const deleteStorageFileDirectly = async (url, bucketName) => {
  const storagePath = extractStoragePath(url, bucketName);
  if (!storagePath) return false;

  try {
    const { error } = await supabase.storage
      .from(bucketName)
      .remove([storagePath]);

    return !error;
  } catch (err) {
    console.warn(`Failed to roll back uploaded file ${storagePath}:`, err.message);
    return false;
  }
};
