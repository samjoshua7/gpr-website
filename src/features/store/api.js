import { supabase } from '../../lib/supabaseClient';

// ==========================================
// Store Categories
// ==========================================

export const getStoreCategories = async () => {
  const { data, error } = await supabase
    .from('product_categories')
    .select('*')
    .eq('active', true)
    .order('display_order', { ascending: true })
    .order('name', { ascending: true });

  if (error) throw new Error(error.message);
  return data || [];
};

// ==========================================
// Store Products
// ==========================================

export const getStoreProducts = async ({
  categorySlug = null,
  searchQuery = '',
  sortBy = 'featured', // 'featured', 'price_asc', 'price_desc', 'name_asc'
  featuredOnly = false,
  limit = 50,
} = {}) => {
  let query = supabase
    .from('products')
    .select(`
      *,
      category:product_categories!inner(category_id, name, slug, icon)
    `)
    .eq('is_active', true);

  if (featuredOnly) {
    query = query.eq('is_featured', true);
  }

  if (categorySlug && categorySlug !== 'all') {
    query = query.eq('category.slug', categorySlug);
  }

  if (searchQuery && searchQuery.trim()) {
    const clean = searchQuery.trim();
    query = query.or(`name.ilike.%${clean}%,short_description.ilike.%${clean}%`);
  }

  switch (sortBy) {
    case 'price_asc':
      query = query.order('base_price', { ascending: true });
      break;
    case 'price_desc':
      query = query.order('base_price', { ascending: false });
      break;
    case 'name_asc':
      query = query.order('name', { ascending: true });
      break;
    case 'featured':
    default:
      query = query.order('display_order', { ascending: true }).order('created_at', { ascending: false });
      break;
  }

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data || [];
};

export const getProductBySlug = async (slug) => {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      category:product_categories(category_id, name, slug, icon),
      images:product_images(*),
      options:product_options(
        *,
        values:product_option_values(*)
      ),
      tiers:product_quantity_tiers(*)
    `)
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (error) throw new Error(error.message);

  // Sort options and values
  if (data.options) {
    data.options.sort((a, b) => a.display_order - b.display_order);
    data.options.forEach((opt) => {
      if (opt.values) {
        opt.values.sort((a, b) => a.display_order - b.display_order);
      }
    });
  }

  // Sort tiers by min_quantity
  if (data.tiers) {
    data.tiers.sort((a, b) => a.min_quantity - b.min_quantity);
  }

  return data;
};

// ==========================================
// Hero Banners
// ==========================================

export const getHeroBanners = async () => {
  const { data, error } = await supabase
    .from('hero_banners')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) throw new Error(error.message);
  return data || [];
};

// ==========================================
// Pricing Engine Helper
// ==========================================

export const calculateProductPricing = ({
  basePrice = 0,
  minQuantity = 1,
  quantity = 1,
  selectedOptionValues = [], // Array of option value objects { price_adjustment: number }
  quantityTiers = [],
}) => {
  const safeQty = Math.max(parseInt(quantity, 10) || minQuantity, minQuantity);

  // 1. Determine base unit rate: check if volume tier applies
  let unitRate = parseFloat(basePrice) || 0;
  if (quantityTiers && quantityTiers.length > 0) {
    const matchingTier = quantityTiers.find(
      (t) => safeQty >= t.min_quantity && (t.max_quantity === null || safeQty <= t.max_quantity)
    );
    if (matchingTier) {
      unitRate = parseFloat(matchingTier.price_per_unit);
    }
  }

  // 2. Sum option price adjustments
  let optionsAdjustmentTotal = 0;
  selectedOptionValues.forEach((val) => {
    if (val && val.price_adjustment) {
      optionsAdjustmentTotal += parseFloat(val.price_adjustment) || 0;
    }
  });

  const finalUnitPrice = unitRate + optionsAdjustmentTotal;
  const subtotal = Math.round(finalUnitPrice * safeQty * 100) / 100;

  return {
    quantity: safeQty,
    unitPrice: finalUnitPrice,
    subtotal,
    optionsAdjustmentTotal,
    hasTierDiscount: unitRate < (parseFloat(basePrice) || 0),
  };
};
