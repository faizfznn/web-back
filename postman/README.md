# Postman Documentation for Rara Web

Dokumentasi ini dibuat berdasarkan kode aplikasi web Anda yang menggunakan Supabase untuk fitur jurnal.

## Sumber yang dipakai

- `src/lib/journals.js`
- `src/lib/supabase.js`
- `supabase/schema.sql`
- `src/pages/AdminJurnal.jsx`

## Struktur data

Tabel `public.journals` memiliki field berikut:

- `id` : bigint
- `title` : text
- `content` : text
- `image_url` : text (opsional)
- `is_public` : boolean
- `published_at` : timestamptz (opsional)
- `created_at` : timestamptz

## Cara pakai

1. Buka Postman.
2. Import file `rara-web-jurnal.postman_collection.json`.
3. Isi variabel collection:
   - `baseUrl` -> `https://<project-ref>.supabase.co`
   - `anonKey` -> isi dari `VITE_SUPABASE_ANON_KEY`
   - `email` -> email admin Supabase
   - `password` -> password admin Supabase
4. Jalankan request `Auth - Login Admin`.
5. Setelah login berhasil, `accessToken` otomatis disimpan ke collection variable.
6. Gunakan request admin lainnya untuk create/update/delete.

## Endpoint penting

### Public

- `GET /rest/v1/journals?select=id,title,content,image_url,published_at,created_at&is_public=eq.true`
- `GET /rest/v1/journals?id=eq.{id}&select=id,title,content,image_url,published_at,created_at&is_public=eq.true`

### Admin

- `GET /rest/v1/journals?select=*&order=created_at.desc`
- `POST /rest/v1/journals`
- `PATCH /rest/v1/journals?id=eq.{id}`
- `DELETE /rest/v1/journals?id=eq.{id}`

## Header yang biasanya dipakai

### Public request

- `apikey: {{anonKey}}`
- `Accept: application/json`

### Admin request

- `apikey: {{anonKey}}`
- `Authorization: Bearer {{accessToken}}`
- `Content-Type: application/json`
- `Accept: application/json`

## Catatan keamanan

RLS pada `supabase/schema.sql` hanya memperbolehkan:

- guest/public dapat membaca jurnal yang `is_public = true`
- admin yang login dapat membaca semua jurnal, menambah, mengubah, dan menghapus data

Jadi untuk request admin, pastikan token dari Supabase Auth sudah valid.
