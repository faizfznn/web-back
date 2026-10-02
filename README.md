# 🌸 Rara Web

Website personal & interaktif yang dibuat dengan **React**, **Vite**, **Tailwind CSS**, dan **Supabase**.

---

## ✨ Fitur Utama

- 📌 **Poin Inti (`/poin-inti`)**: Halaman beranda dengan ringkasan & pesan utama.
- 📸 **Momen (`/momen`)**: Galeri momen berharga.
- 🎞️ **Memori (`/memori`)**: Kumpulan kenangan dan visual interaktif.
- 📖 **Jurnal (`/jurnal`)**: Catatan & cerita harian yang terhubung ke database Supabase.
- 🔒 **Admin Jurnal (`/admin/jurnal`)**: Dashboard kelola cerita & upload gambar jurnal dengan autentikasi admin.
- 📅 **Agenda (`/agenda`)**: Rencana kegiatan dan jadwal agenda.
- 🎵 **Music Player**: Background music player interaktif.

---

## 🛠️ Teknologi yang Digunakan

- **Frontend**: [React 19](https://react.dev/), [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Animasi & Interaksi**: [Framer Motion](https://www.framer.com/motion/)
- **Routing**: [React Router v7](https://reactrouter.com/)
- **Backend & Database**: [Supabase](https://supabase.com/) (Auth, Database PostgreSQL, Storage)

---

## 🚀 Panduan Menjalankan Project (Untuk Pemula / Non-Coder)

Jika Anda belum pernah ngoding, ikuti langkah mudah berikut:

### 1. Install Alat yang Dibutuhkan (Sekali Saja)
1. Download dan pasang **Node.js (versi LTS)** dari [nodejs.org](https://nodejs.org/).
2. Pasang **VS Code** dari [code.visualstudio.com](https://code.visualstudio.com/).

### 2. Dapatkan Project
- **Opsi Download ZIP**: Klik tombol hijau **Code** di repositori GitHub > pilih **Download ZIP** > lalu ekstrak filenya.
- **Opsi Git Clone**:
  ```bash
  git clone https://github.com/username/rara-web.git
  ```

### 3. Konfigurasi Environment (`.env`)
1. Buka folder project di **VS Code** (`File` > `Open Folder...`).
2. Buat file baru bernama `.env` (atau salin dari `.env.example`).
3. Masukkan URL dan Kunci Supabase Anda:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
4. Simpan file (`Ctrl + S`).

### 4. Install & Jalankan
1. Buka terminal di VS Code (tekan tombol `Ctrl + ~` atau menu `Terminal` > `New Terminal`).
2. Install dependensi:
   ```bash
   npm install
   ```
3. Jalankan server lokal:
   ```bash
   npm run dev
   ```
4. Buka tautan yang muncul di terminal (biasanya `http://localhost:5173/`) di browser Anda.

---

## 🗄️ Setup Database Supabase (Untuk Admin)

1. Buat project baru di [Supabase Dashboard](https://supabase.com/dashboard).
2. Buka **SQL Editor** di Supabase, lalu jalankan seluruh skrip yang ada di file [`supabase/schema.sql`](./supabase/schema.sql).
3. Buat satu akun admin melalui menu **Authentication** > **Users**.
4. Salin **Project URL** dan **anon public key** dari menu **Project Settings** > **API** ke file `.env` lokal Anda.
5. Buka rute `/admin/jurnal` di browser untuk masuk dan mulai mengelola jurnal.

---

## 📦 Script yang Tersedia

| Command | Fungsi |
|---|---|
| `npm run dev` | Menjalankan local development server |
| `npm run build` | Melakukan build aplikasi untuk produksi |
| `npm run preview` | Melihat preview hasil build secara lokal |
| `npm run lint` | Menjalankan linter ESLint untuk pengecekan kode |

---

## 🌐 Deployment

Project ini sudah dikonfigurasi dan siap di-deploy ke platform seperti [Vercel](https://vercel.com/) atau [Netlify](https://www.netlify.com/).
Pastikan untuk menambahkan Environment Variables (`VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY`) pada pengaturan platform hosting Anda.
