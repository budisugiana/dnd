# Akademi Learning Workspace — Phase 1 MVP

Prototype **End-to-End Learning Module Preparation, Delivery & Monitoring Platform**
untuk Corporate Academy. Bukan sekadar LMS untuk peserta: aplikasi ini juga menjadi
tools bagi SME untuk membuat dan mengelola modul, bagi Academy untuk menjaga mutu,
dan bagi Management untuk melihat dampak.

```
SME → Buat Modul → Academy Review → Readiness Check → Peserta Belajar
   → Assessment → Assignment → Post-Test → NPS → Analytics → Reporting
```

---

## 1. Berkas yang disertakan

| Berkas | Isi |
|---|---|
| `akademi-standalone.html` | Aplikasi lengkap dalam satu file. Buka langsung di browser — tidak perlu server, tidak perlu koneksi internet. React sudah di-inline. |
| Artifact (link privat) | Versi hosted yang sama, dapat dibuka ulang kapan saja dan dibagikan ke tim. |
| `AKADEMI-README.md` | Dokumen ini. |

Password seluruh akun demo: **`demo123`**

| Peran | Nama | Email |
|---|---|---|
| Academy Admin | Sari Nurhaliza | sari.nurhaliza@akademi.co.id |
| SME / Fasilitator | Iman Setiawan | iman.setiawan@akademi.co.id |
| Management | Hendrawan Susilo | hendrawan.susilo@akademi.co.id |
| Peserta | Budi Sugina | budi.sugina@akademi.co.id |

Di halaman login cukup klik kartu peran, lalu **Masuk**. Tombol **Reset data** pada
halaman login (dan di Settings) mengembalikan seluruh data demo ke kondisi awal.

---

## 2. Empat demo flow yang bisa langsung dicoba

**Flow 1 — SME.** Login sebagai Iman Setiawan → *Modul Saya* → **Buat Modul Baru**
(pilih salah satu dari 5 template; struktur section otomatis terbentuk) → wizard 10
langkah: Module Information → Learning Objective → Pre-Test → Learning Content →
Learning Activity → Assignment → Post-Test → NPS → Preview as Participant →
**Check My Readiness** → *Submit for Review*. Semua input ber-autosave; indikator
`✓ Saved 12:42:31` muncul di header wizard.

**Flow 2 — Academy.** Login sebagai Sari Nurhaliza → *Review Queue* → klik modul →
lihat Readiness Report + temuan otomatis sistem → pilih section yang dikomentari,
tulis catatan → **Request Revision** / **Approve** / **Approve & Ready to Deliver**.
SME langsung menerima notifikasi.

**Flow 3 — Peserta.** Login sebagai Budi Sugina (journey-nya sengaja kosong) →
Absensi (timestamp otomatis, status Present/Late) → Pre-Test 15 soal bertimer →
Learning Objective → Learning Content 7 section (tandai selesai per section) →
Pengumpulan Hasil Kerja → Post-Test → hasil Pre/Post/Learning Gain → NPS &
Feedback → Hasil Pembelajaran + sertifikat.

**Flow 4 — Management.** Login sebagai Hendrawan Susilo → Executive Dashboard →
Facilitator Readiness, Learning Performance, Feedback & NPS, Status Kelas, Reports.

---

## 3. Data demo yang sudah terisi

4 program · 13 modul · 5 SME · 8 kelas · 142 pendaftaran peserta · 1.100+ jawaban
assessment · 56 hasil kerja · 55 respons NPS.

Modul utama **MOD-001 “Introduction to Data Visualization”** (SME Iman Setiawan,
Operation Academy) terisi penuh dengan materi asli: 4 Learning Objective, 15 soal
(9 multiple choice, 3 true/false, 2 multiple response, 1 esai) yang seluruhnya
terpetakan ke objective, 7 section materi berisi paragraf, tabel, diagram SVG,
step-by-step, quiz sisipan, case study dan callout, 2 learning activity, serta
assignment *“Rancang dashboard sederhana dari data operasional unit Anda”*.

Modul lain sengaja dibuat pada berbagai tingkat kelengkapan agar Readiness
Dashboard menunjukkan sebaran nyata: READY, ALMOST READY, NEED REVISION, NOT READY.

---

## 4. Arsitektur kode

Empat lapisan terpisah tegas — inilah yang membuat prototype ini siap dihubungkan
ke backend sungguhan tanpa menyentuh UI.

```
┌──────────────────────────────────────────────────────────┐
│ UI (React)   halaman & komponen — tidak pernah menyentuh  │
│              storage, hanya memanggil svc.*               │
├──────────────────────────────────────────────────────────┤
│ svc          domain service: readiness, scoring, learning  │
│              gain, analytics, workflow, RBAC, notifikasi   │
├──────────────────────────────────────────────────────────┤
│ db           repository generik: list / one / get /        │
│              insert / update / upsert / remove / count     │
├──────────────────────────────────────────────────────────┤
│ StorageAdapter  LocalStorageAdapter  ←→  RestAdapter       │
└──────────────────────────────────────────────────────────┘
```

### Mengganti localStorage dengan backend sungguhan

Hanya satu baris yang berubah. `LocalStorageAdapter` mengekspos kontrak
`all(collection)` dan `replace(collection, rows)`. Stub `RestAdapter` sudah
disertakan sebagai komentar di bagian atas kode:

```js
class RestAdapter {
  constructor(base) { this.base = base }
  async all(c)           { return (await fetch(`${this.base}/${c}`)).json() }
  async replace(c, rows) { await fetch(`${this.base}/${c}`, { method: 'PUT', body: JSON.stringify(rows) }) }
}
const store = new RestAdapter('/api/v1');
```

Untuk produksi, langkah yang disarankan: ubah `db` menjadi async (setiap method
mengembalikan Promise), lalu ganti pemanggilan di `svc` dengan `await`. Seluruh
business rule di `svc` — perhitungan readiness, scoring, learning gain, analitik
LO — tidak perlu diubah sama sekali karena tidak pernah menyentuh storage.

Penulisan ke storage sudah di-*coalesce*: banyak operasi dalam satu tick browser
hanya menghasilkan satu kali serialisasi, sehingga seeding dan autosave tetap
ringan.

### Struktur tabel (27 koleksi)

`roles`, `users`, `employees`, `programs`, `classes`, `class_participants`,
`modules`, `module_versions`, `learning_objectives`, `questions`, `assessments`,
`assessment_attempts`, `assessment_answers`, `content_sections`, `activities`,
`assignments`, `submissions`, `submission_reviews`, `attendance`,
`nps_responses`, `module_reviews`, `notifications`, `audit_logs`, `templates`,
`journey`, `settings`.

Relasi utama:

```
programs 1─n modules 1─n {learning_objectives, questions, content_sections,
                          activities, assignments, assessments}
programs 1─n classes ─ n─n employees (class_participants)
classes 1─n {attendance, assessment_attempts, submissions, nps_responses, journey}
assessment_attempts 1─n assessment_answers ─ n─1 learning_objectives
questions n─1 learning_objectives      ← inilah kunci analitik LO
```

---

## 5. Rumus yang dipakai sistem

**Readiness Score** — jumlah berbobot dari 8 komponen, masing-masing dihitung
sebagai rasio kelengkapan 0–1:

| Komponen | Bobot | Rasio |
|---|---|---|
| Module Information | 10 | field terisi / field wajib |
| Learning Objective | 15 | jumlah LO / minimum LO |
| Pre-Test | 15 | jumlah soal / minimum soal |
| Learning Content | 20 | jumlah section / minimum section |
| Learning Activity | 10 | jumlah aktivitas / minimum aktivitas |
| Assignment | 10 | ada / tidak |
| Post-Test | 15 | ada / tidak |
| NPS | 5 | ada / tidak |

Ambang status: `≥90% READY` · `75–89% ALMOST READY` · `50–74% NEED REVISION` ·
`<50% NOT READY`. **Seluruh bobot, ambang, dan angka minimum dapat diubah Admin**
di menu *Settings* — perubahan langsung berlaku pada semua modul.

**Learning Gain** = Post-Test − Pre-Test
**Improvement** = (Post − Pre) / Pre × 100%
**Normalized Gain** = (Post − Pre) / (100 − Pre)
**NPS** = %Promoter (9–10) − %Detractor (0–6)

**Penguasaan Learning Objective** dihitung dari jawaban Post-Test: setiap soal
membawa `lo_id`, sehingga sistem dapat menjumlahkan poin yang diperoleh dibagi
poin maksimum per objective — inilah yang menjawab *“objective mana yang berhasil
dikuasai peserta dan mana yang belum”*.

---

## 6. Keamanan & akses

Role Based Access Control diterapkan pada tiga lapis: menu yang tampil, route yang
boleh dibuka (`Workspace.allowed`), dan data yang terlihat (`svc.visibleModules`,
`svc.visibleClasses`, `svc.can`).

* **Peserta** hanya melihat kelas dan data miliknya sendiri.
* **SME** hanya dapat mengedit modul yang menjadi tanggung jawabnya; modul milik
  SME lain terbuka dalam mode baca-saja dengan peringatan eksplisit.
* **Management** hanya membaca — tidak ada satupun aksi tulis di seluruh menunya.
* **Academy Admin** memiliki akses penuh, termasuk membuka Module Builder milik SME.

Setiap perubahan penting tercatat di **Audit Log** (login, pembuatan modul, submit,
review, penilaian, perubahan setting).

> Catatan produksi: pada prototype ini otentikasi bersifat simulasi (password
> tersimpan di data demo). Saat integrasi, ganti dengan SSO/LDAP perusahaan,
> pindahkan seluruh pengecekan otorisasi ke sisi server, dan tambahkan validasi
> serta pemindaian pada unggahan berkas.

---

## 7. Cakupan Phase 1 (selesai) dan Phase 2 (usulan berikutnya)

**Sudah ada:** login & role, SME dashboard, module builder wizard 10 langkah dengan
autosave, learning objective builder, pre-test builder (4 tipe soal, duplikat,
reorder, randomisasi, passing score, time limit, preview), content builder 14 jenis
blok tanpa coding, learning activity, assignment builder, post-test dua mode (Same
Question / Equivalent Question), NPS builder, preview as participant, validation &
Check My Readiness, review workflow, module library dengan duplikasi & versioning,
5 template modul, participant learning journey 8 tahap, gamifikasi progress +
sertifikat, executive dashboard, facilitator readiness dashboard dengan rule
configurable, learning analytics + analitik per Learning Objective, notification
center, audit log, dan reporting tiga jenis dengan filter lengkap serta ekspor
CSV / Excel / PDF.

**Belum ada (Phase 2):** question bank lintas modul untuk mode Equivalent Question
yang sebenarnya, integrasi SSO, unggah berkas ke object storage, video hosting,
penjadwalan otomatis & kalender, sertifikat ber-QR yang dapat diverifikasi, dan AI
Assistant untuk membantu SME menyusun draft modul.

---

## 8. Catatan teknis

* Satu file HTML, React 18 + JSX yang sudah dikompilasi (tidak ada build step saat
  runtime), CSS custom dengan token light/dark, seluruh chart digambar dengan SVG
  tanpa library.
* Mendukung tema terang dan gelap, mengikuti pengaturan sistem dan dapat diubah
  manual dari topbar.
* Responsif: desktop-first, tetapi seluruh halaman tetap terbaca di layar ponsel.
* Data demo tersimpan di `localStorage` browser masing-masing pembaca — perubahan
  Anda tidak terlihat oleh orang lain, dan dapat direset kapan saja.
