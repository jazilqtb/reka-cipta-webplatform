-- Test tabel untuk validasi RLS spike
CREATE TABLE IF NOT EXISTS _spike_test (
  id   uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  data text
);

-- Enable RLS
ALTER TABLE _spike_test ENABLE ROW LEVEL SECURITY;

-- Policy: hanya authenticated user bisa read
CREATE POLICY "auth_only_read" ON _spike_test
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Insert test data via service role (bypass RLS)
INSERT INTO _spike_test (data) VALUES ('test-row-1');