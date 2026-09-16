# React + Vite

## Jurnal

Fitur jurnal tersedia di `/jurnal`. Halaman admin tersedia di `/admin/jurnal` dan menggunakan Supabase Auth.

1. Buat project Supabase, lalu jalankan isi `supabase/schema.sql` di SQL Editor.
2. Buat satu user admin di Supabase Authentication > Users.
3. Salin `.env.example` menjadi `.env.local`, lalu isi `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` dari project Supabase.
4. Jalankan `npm run dev`, buka `/admin/jurnal`, lalu masuk memakai user tersebut.

Jurnal hanya tampil di `/jurnal` jika checkbox `Tampilkan untuk Rara / publik` aktif. Row Level Security di schema juga memastikan pengunjung anonim hanya dapat membaca jurnal public.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
