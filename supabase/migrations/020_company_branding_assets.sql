-- 020_company_branding_assets.sql
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS logo_url text;
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS signatory_image_url text;
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS signatory_name text;

-- Storage setup for company-assets
insert into storage.buckets (id, name, public) values ('company-assets', 'company-assets', true)
on conflict (id) do nothing;

create policy "Public read company assets" on storage.objects
  for select using (bucket_id = 'company-assets');

create policy "SUPER_ADMIN upload company assets" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'company-assets' and public.get_auth_role() = 'SUPER_ADMIN'
  );

create policy "SUPER_ADMIN update/delete company assets" on storage.objects
  for update to authenticated using (bucket_id = 'company-assets' and public.get_auth_role() = 'SUPER_ADMIN');
