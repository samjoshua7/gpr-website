-- Migration 034: Configurable Hero Carousel Duration
-- Adds hero_autoplay_duration column to public.company_settings table (default: 6 seconds)

ALTER TABLE public.company_settings 
ADD COLUMN IF NOT EXISTS hero_autoplay_duration int DEFAULT 6;
