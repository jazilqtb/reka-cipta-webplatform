-- CP4 ronde 3 — tugas & follow-up terjadwal.
--
-- KLASIFIKASI: ADDITIVE murni. Satu tabel baru.
--
-- KENAPA KOLOM FK TERPISAH, BUKAN (entity_type, entity_id) POLIMORFIK:
-- pola polimorfik tidak bisa dijaga foreign key. Hapus satu perusahaan,
-- dan tugas-tugasnya menjadi baris yatim yang menunjuk ke UUID yang sudah
-- tidak ada — tidak error, tidak terlihat, dan baru ketahuan saat daftar
-- tugas menampilkan "(tidak diketahui)" tanpa ada yang bisa menjelaskan
-- kenapa. Dengan lima kolom nullable + CHECK "tepat satu terisi", database
-- yang menjaga integritasnya dan ON DELETE CASCADE membersihkan sendiri.
--
-- Harganya: satu kolom tambahan setiap kali ada jenis entitas baru. Itu
-- pertukaran yang layak — jenis entitas bertambah beberapa tahun sekali,
-- sementara baris yatim merusak kepercayaan pada seluruh daftar.

CREATE TABLE IF NOT EXISTS public.tasks (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title        VARCHAR(200) NOT NULL CHECK (length(btrim(title)) > 0),
    notes        TEXT,

    -- Jatuh tempo. NULLABLE dengan sengaja: memaksa tanggal membuat orang
    -- mengisi tanggal asal-asalan supaya formulirnya lolos, dan tanggal
    -- asal-asalan lebih buruk daripada tidak ada tanggal — ia memenuhi
    -- daftar "terlewat" dengan hal yang sebenarnya tidak mendesak.
    due_on       DATE,
    status       VARCHAR(20) NOT NULL DEFAULT 'open',

    -- Penanggung jawab. Menunjuk ke allowlist admin, bukan teks bebas,
    -- supaya tidak ada tugas yang ditugaskan ke nama yang tidak pernah
    -- bisa masuk sistem.
    assignee_id  UUID REFERENCES public.admin_users(user_id) ON DELETE SET NULL,

    -- ── Lampiran ke entitas. TEPAT SATU harus terisi. ──
    company_id   UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    contact_id   UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
    rfq_id       UUID REFERENCES public.rfqs(id) ON DELETE CASCADE,
    supplier_id  UUID REFERENCES public.supplier_registrations(id) ON DELETE CASCADE,
    shipment_id  UUID REFERENCES public.shipments(id) ON DELETE CASCADE,

    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,

    CONSTRAINT tasks_status_check CHECK (status IN ('open','done','cancelled')),

    -- Tugas TIDAK BOLEH mengambang. Tugas tanpa induk adalah tugas yang
    -- tidak punya konteks: "hubungi lagi" tanpa menyebut siapa.
    CONSTRAINT tasks_exactly_one_parent CHECK (
      (company_id  IS NOT NULL)::int +
      (contact_id  IS NOT NULL)::int +
      (rfq_id      IS NOT NULL)::int +
      (supplier_id IS NOT NULL)::int +
      (shipment_id IS NOT NULL)::int = 1
    ),
    -- Selesai wajib bertanggal, dan yang belum selesai tidak boleh punya
    -- tanggal selesai. Tanpa ini keduanya bisa berselisih diam-diam.
    CONSTRAINT tasks_completed_consistency CHECK (
      (status = 'done' AND completed_at IS NOT NULL) OR
      (status <> 'done' AND completed_at IS NULL)
    )
);

-- Index parsial: yang dibaca berulang kali hanyalah tugas yang MASIH
-- terbuka. Tugas selesai menumpuk selamanya dan tidak perlu ikut diindeks.
CREATE INDEX IF NOT EXISTS idx_tasks_open_due
    ON public.tasks(due_on NULLS LAST) WHERE status = 'open';
CREATE INDEX IF NOT EXISTS idx_tasks_company  ON public.tasks(company_id)  WHERE company_id  IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_rfq      ON public.tasks(rfq_id)      WHERE rfq_id      IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_supplier ON public.tasks(supplier_id) WHERE supplier_id IS NOT NULL;

COMMENT ON TABLE public.tasks IS
  'Tugas & follow-up. Selalu melekat pada TEPAT SATU entitas — tugas '
  'mengambang tanpa konteks tidak bisa ditindaklanjuti.';

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin can read tasks"   ON public.tasks FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admin can insert tasks" ON public.tasks FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admin can update tasks" ON public.tasks FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin can delete tasks" ON public.tasks FOR DELETE TO authenticated USING (public.is_admin());

CREATE TRIGGER trigger_tasks_set_updated_at BEFORE UPDATE ON public.tasks
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
