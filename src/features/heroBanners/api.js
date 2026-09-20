import { supabase } from '../../lib/supabaseClient';
import { deleteStorageFileIfUnreferenced, deleteStorageFileDirectly } from '../../lib/storageUtils';

// ==========================================
// Admin Hero Banners Management API
// ==========================================

export const getHeroBannersAdmin = async () => {
  const { data, error } = await supabase
    .from('hero_banners')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) throw new Error(error.message);
  return data || [];
};

export const createHeroBanner = async (bannerData) => {
  const payload = {
    banner_name: bannerData.banner_name?.trim() || bannerData.title?.trim() || 'Untitled Banner',
    image_url: bannerData.image_url?.trim(),
    mobile_image_url: bannerData.mobile_image_url?.trim() || null,
    alt_text: bannerData.alt_text?.trim() || null,
    banner_type: bannerData.banner_type || 'image_text',
    eyebrow: bannerData.eyebrow?.trim() || null,
    title: bannerData.title?.trim() || null,
    subtitle: bannerData.subtitle?.trim() || null,
    text_align: bannerData.text_align || 'left',
    text_position: bannerData.text_position || 'center-left',
    btn1_label: bannerData.btn1_label?.trim() || null,
    btn1_action_type: bannerData.btn1_action_type || 'catalog',
    btn1_url: bannerData.btn1_url?.trim() || null,
    btn2_label: bannerData.btn2_label?.trim() || null,
    btn2_action_type: bannerData.btn2_action_type || 'none',
    btn2_url: bannerData.btn2_url?.trim() || null,
    link_url: bannerData.btn1_url?.trim() || bannerData.link_url?.trim() || null,
    display_order: Number(bannerData.display_order) || 0,
    is_active: bannerData.is_active !== undefined ? bannerData.is_active : true,
    start_date: bannerData.start_date || null,
    end_date: bannerData.end_date || null,
  };

  const { data, error } = await supabase
    .from('hero_banners')
    .insert([payload])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
};

export const updateHeroBanner = async (bannerId, bannerData) => {
  const payload = {
    banner_name: bannerData.banner_name?.trim() || bannerData.title?.trim() || 'Untitled Banner',
    image_url: bannerData.image_url?.trim(),
    mobile_image_url: bannerData.mobile_image_url?.trim() || null,
    alt_text: bannerData.alt_text?.trim() || null,
    banner_type: bannerData.banner_type || 'image_text',
    eyebrow: bannerData.eyebrow?.trim() || null,
    title: bannerData.title?.trim() || null,
    subtitle: bannerData.subtitle?.trim() || null,
    text_align: bannerData.text_align || 'left',
    text_position: bannerData.text_position || 'center-left',
    btn1_label: bannerData.btn1_label?.trim() || null,
    btn1_action_type: bannerData.btn1_action_type || 'catalog',
    btn1_url: bannerData.btn1_url?.trim() || null,
    btn2_label: bannerData.btn2_label?.trim() || null,
    btn2_action_type: bannerData.btn2_action_type || 'none',
    btn2_url: bannerData.btn2_url?.trim() || null,
    link_url: bannerData.btn1_url?.trim() || bannerData.link_url?.trim() || null,
    display_order: Number(bannerData.display_order) || 0,
    is_active: bannerData.is_active !== undefined ? bannerData.is_active : true,
    start_date: bannerData.start_date || null,
    end_date: bannerData.end_date || null,
  };

  const { data, error } = await supabase
    .from('hero_banners')
    .update(payload)
    .eq('banner_id', bannerId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
};

export const deleteHeroBanner = async (bannerId) => {
  // 1. Fetch current image URLs before deleting record
  const { data: banner } = await supabase
    .from('hero_banners')
    .select('image_url, mobile_image_url')
    .eq('banner_id', bannerId)
    .maybeSingle();

  // 2. Delete banner record from database
  const { error } = await supabase
    .from('hero_banners')
    .delete()
    .eq('banner_id', bannerId);

  if (error) throw new Error(error.message);

  // 3. Clean up storage files if they are not referenced elsewhere
  if (banner?.image_url) {
    await deleteStorageFileIfUnreferenced(banner.image_url, 'hero-banners');
  }
  if (banner?.mobile_image_url) {
    await deleteStorageFileIfUnreferenced(banner.mobile_image_url, 'hero-banners');
  }

  return true;
};

export const toggleHeroBannerActive = async (bannerId, currentStatus) => {
  const { data, error } = await supabase
    .from('hero_banners')
    .update({ is_active: !currentStatus })
    .eq('banner_id', bannerId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
};

export const uploadHeroBannerImage = async (file) => {
  if (!file) throw new Error('No file provided for upload.');

  const fileExt = file.name.split('.').pop();
  const fileName = `banner_${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
  const filePath = `banners/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('hero-banners')
    .upload(filePath, file, { cacheControl: '3600', upsert: false });

  if (uploadError) throw new Error(`Image upload failed: ${uploadError.message}`);

  const { data } = supabase.storage
    .from('hero-banners')
    .getPublicUrl(filePath);

  return data.publicUrl;
};

export const deleteHeroBannerImageFromStorage = async (url, exclude = {}) => {
  return await deleteStorageFileIfUnreferenced(url, 'hero-banners', exclude);
};

export const rollbackUploadedHeroBannerImage = async (url) => {
  return await deleteStorageFileDirectly(url, 'hero-banners');
};

// ==========================================
// Hero Carousel Autoplay Duration Setting
// ==========================================

export const getHeroCarouselDuration = async () => {
  try {
    const { data, error } = await supabase
      .from('company_settings')
      .select('hero_autoplay_duration')
      .limit(1)
      .maybeSingle();

    if (error || !data || data.hero_autoplay_duration == null) {
      return 6;
    }
    return Number(data.hero_autoplay_duration) || 6;
  } catch {
    return 6;
  }
};

export const updateHeroCarouselDuration = async (durationSeconds) => {
  const duration = Math.min(Math.max(Number(durationSeconds) || 6, 2), 20);

  const { data: existing, error: checkError } = await supabase
    .from('company_settings')
    .select('setting_id')
    .limit(1)
    .maybeSingle();

  if (checkError) {
    throw new Error(checkError.message);
  }

  if (existing?.setting_id) {
    const { data, error } = await supabase
      .from('company_settings')
      .update({ hero_autoplay_duration: duration })
      .eq('setting_id', existing.setting_id)
      .select('hero_autoplay_duration')
      .single();

    if (error) throw new Error(error.message);
    return Number(data?.hero_autoplay_duration) || duration;
  } else {
    const { data, error } = await supabase
      .from('company_settings')
      .insert([{ hero_autoplay_duration: duration }])
      .select('hero_autoplay_duration')
      .single();

    if (error) throw new Error(error.message);
    return Number(data?.hero_autoplay_duration) || duration;
  }
};

