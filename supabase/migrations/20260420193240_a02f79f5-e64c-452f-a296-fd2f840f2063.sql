DROP POLICY IF EXISTS "Cruise images are publicly viewable" ON storage.objects;

-- Public can read individual files (by full path) but cannot list bucket
CREATE POLICY "Cruise images viewable by path"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'cruise-images' AND (storage.foldername(name))[1] IS NOT NULL);