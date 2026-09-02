-- Personal images are private and never overwrite the shared model catalog.
alter table public.user_vehicles add column if not exists photo_path text;
alter table public.user_vehicles add constraint user_vehicle_photo_own_path check (
 photo_path is null or (
 split_part(photo_path,'/',1) = user_id::text
 and split_part(photo_path,'/',2) = id::text
 and photo_path ~ '^[0-9a-f-]+/[0-9a-f-]+/[0-9a-f-]+\.(jpg|png|webp)$'
 ));
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('customer-vehicle-photos','customer-vehicle-photos',false,5242880,
array['image/jpeg','image/png','image/webp']);
create policy "Vehicle owners read personal photos" on storage.objects for select to authenticated
using (bucket_id='customer-vehicle-photos' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "Vehicle owners upload personal photos" on storage.objects for insert to authenticated
with check (bucket_id='customer-vehicle-photos'
and (storage.foldername(name))[1]=(select auth.uid())::text
and array_length(storage.foldername(name),1)=2
and exists(select 1 from public.user_vehicles v where v.user_id=(select auth.uid())
and v.id::text=(storage.foldername(name))[2]));
create policy "Vehicle owners delete personal photos" on storage.objects for delete to authenticated
using (bucket_id='customer-vehicle-photos' and (storage.foldername(name))[1]=(select auth.uid())::text);
-- Existing user_vehicles SELECT/UPDATE policies already enforce owner-only access.
notify pgrst, 'reload schema';
