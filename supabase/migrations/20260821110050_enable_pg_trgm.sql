-- similarity() dipakai pendeteksi duplikat di migrasi berikutnya untuk
-- menangkap salah ketik ("maju jya" vs "maju jaya"). Tanpa ekstensi ini,
-- pencocokan hanya bisa persis-sama dan justru melewatkan kasus yang
-- paling sering terjadi.
CREATE EXTENSION IF NOT EXISTS pg_trgm;
