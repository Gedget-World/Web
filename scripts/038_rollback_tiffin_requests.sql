-- Run manually in the Supabase SQL editor to remove the tiffin feature.
-- This permanently deletes all rows in public.tiffin_requests.
begin;

drop table if exists public.tiffin_requests;
drop function if exists public.prevent_customer_tiffin_status_change();
drop function if exists public.set_tiffin_requests_updated_at();

commit;
