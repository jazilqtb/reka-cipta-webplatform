-- ============================================================
-- Seed: company_settings — Data Awal
-- Epic 2 · Slice 1 · CV Reka Cipta Indonesia
--
-- Nilai dikonfirmasi dari Fondasi Brand v1.0 (Fase 0):
--   partner_count           = 6   (aktual, bukan 50)
--   cities_served           = 9   (aktual, bukan 15)
--   total_distribution_tons = 353 (key baru — total TON distribusi)
--
-- Semua nilai dapat diubah via /admin/settings (Slice 3).
-- ============================================================

INSERT INTO public.company_settings (key, value, label, description) VALUES

  -- Kontak Langsung
  ('whatsapp_1',
   '082136096528',
   'Nomor WhatsApp 1',
   'Nomor WA utama untuk tombol kontak di halaman Kontak dan footer.'),

  ('whatsapp_2',
   '087839031378',
   'Nomor WhatsApp 2',
   'Nomor WA alternatif untuk tombol kontak.'),

  ('email',
   'rekaciptaindonesiaa@gmail.com',
   'Email Kontak',
   'Alamat email yang tampil di halaman Kontak dan penerima notifikasi form.'),

  ('address',
   'Jl. Bratang Gede III-I No. 16A, Ngagel Rejo, Wonokromo, Surabaya 60245',
   'Alamat Kantor',
   'Alamat lengkap kantor yang tampil di halaman Kontak.'),

  -- Integrasi
  ('gmaps_embed_url',
   '',
   'URL Embed Google Maps',
   'URL iframe embed peta. Format: https://www.google.com/maps/embed?pb=... Kosongkan jika belum siap.'),

  -- Pesan Otomatis
  ('wa_default_message',
   'Halo, saya ingin mengetahui lebih lanjut tentang produk garam CV Reka Cipta Indonesia.',
   'Pesan Default WhatsApp',
   'Teks yang muncul otomatis saat tombol WA diklik.'),

  -- Stats Beranda — nilai aktual dari Fondasi Brand v1.0
  ('partner_count',
   '6',
   'Jumlah Mitra Aktif',
   'Angka Mitra Aktif di Stats Bar Beranda. Update manual sampai CRM Epic 4 selesai.'),

  ('cities_served',
   '9',
   'Jumlah Kota Dilayani',
   'Angka Kota Dilayani di Stats Bar Beranda. Update manual sampai CRM Epic 4 selesai.'),

  ('total_distribution_tons',
   '353',
   'Total Distribusi (TON)',
   'Total volume distribusi kumulatif dalam ton. Stats Bar Beranda Slide 1.'),

  -- Referensi Klien
  ('client_list',
   'PT. Surabaya Mekabox,PT. Sejati Tritunggal Indah,PT. Cakrawala Cemerlang Box,Unit Pengolahan Garam KKP,Perusahaan Pengolah Limbah',
   'Daftar Klien Aktif',
   'Nama klien dipisah koma. Referensi admin. Marquee Beranda dibaca dari constants/clients.ts.')

ON CONFLICT (key) DO NOTHING;

-- Validasi: pastikan 10 rows berhasil masuk
DO $$
DECLARE v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM public.company_settings;
  ASSERT v_count >= 10,
    FORMAT('Seed gagal: hanya %s rows, expected 10', v_count);
  RAISE NOTICE 'Seed OK: % rows tersimpan di company_settings', v_count;
END $$;
