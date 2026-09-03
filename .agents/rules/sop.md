---
trigger: always_on
description: Standar Operasional Prosedur (SOP) Aturan Kerja AI untuk project Diasmu
---

# SOP Aturan Kerja AI (AI Working Rules)

Berikut adalah Standar Operasional Prosedur (SOP) Aturan Kerja AI yang wajib ditaati oleh agen AI setiap kali berinteraksi atau melakukan tugas, baik untuk perbaikan *bug* maupun pembuatan proyek baru. Aturan ini dirancang untuk memastikan kualitas, akurasi, dan efisiensi pekerjaan.

## 1. Analisis & Persetujuan Pra-Eksekusi (Tugas & Bug Fix)
* Sebelum menulis atau mengubah kode apa pun, agen **wajib** melakukan analisis mendalam dari *source code* dan memberikan rencana perbaikan (*Action Plan*) kepada *user*.
* **DILARANG KERAS** mengeksekusi perubahan (menulis ulang *file*) sebelum ada persetujuan (*approval*) eksplisit dari *user*.
* Jika terdapat log *error*, baca dan evaluasi log tersebut secara menyeluruh dari ujung ke ujung sebelum menyimpulkan tindakan.

## 2. Inisiasi Proyek Baru (WAJIB BLUEPRINT SEBELUM EKSEKUSI)
Saat diminta membuat proyek dari nol, agen **WAJIB** membuat dan mempresentasikan rancangan sistem (*blueprint*) terlebih dahulu. Rancangan ini harus mencakup:
* **Struktur Folder:** Arsitektur direktori yang modular (pemisahan *routes*, *controllers*, *services*, *models*, komponen UI, dll).
* **Proses Bisnis (Probis):** Deskripsi jelas tentang bagaimana aplikasi akan menyelesaikan masalah atau memproses transaksi.
* **Flow Sistem:** Alur navigasi pengguna dan pergerakan data dari *Client/Frontend* hingga ke *Database*.
* **Desain Database & ORM (Drizzle):** Pastikan skema relasi *database* sudah dirancang secara matang dan dipastikan benar-benar sesuai dengan kebutuhan bisnis serta alur proyek. Proyek **WAJIB menggunakan Drizzle ORM** untuk definisi skema (*schema definition*), migrasi, dan seluruh interaksi *query* ke *database*.
* **Kontrak API:** Daftar *endpoint* API utama beserta format *request/response payload*.
* **Strict Approval:** Agen **DILARANG** men-generate kode, membuat *file*, atau melakukan inisiasi *framework* (seperti `npm init`, *scaffolding*, dll) sebelum *user* memberikan persetujuan penuh terhadap *blueprint* di atas.

## 3. Anti-Halusinasi & Verifikasi Konteks (STRICT CONTEXT)
* **Dilarang berasumsi atau menebak.** Selalu gunakan fitur pencarian bawaan untuk memverifikasi nama variabel, struktur direktori, dan *dependency* sebelum memodifikasi kode.
* Jangan mengarang *library* atau API eksternal. Pastikan integrasi sesuai dengan daftar *dependency* yang ada di *workspace*.
* Pahami secara akurat pergerakan data dari sisi *Frontend* menuju ke *Backend* dan sebaliknya sebelum menyentuh logika *error*.

## 4. Fokus Ketat Pada Scope (NO UNSOLICITED IMPROVEMENTS & NO STRUCTURAL REFACTORING DURING FIXES)
* Jika *user* meminta perbaikan *bug*, perbaiki **HANYA** baris kode yang menjadi akar masalah.
* **TIDAK BOLEH** melakukan *refactoring*, merapikan format, atau menambah fitur di luar *scope* tugas kecuali diminta secara eksplisit. Ingat prinsip: *"If it ain't broke, don't fix it."*
* **DILARANG KERAS melakukan perombakan atau perubahan struktur modular saat melakukan perbaikan (bug fix/repair).**
* **DILARANG** menghapus atau mengubah kode stabil yang sudah berfungsi hanya karena alasan estetika.

## 5. Kepatuhan Pada Arsitektur & Logika Bisnis
* **Hormati Stack Teknologi yang Ada:** Jangan mengubah arsitektur *database*, ORM, metode *deployment*, atau bahasa pemrograman utama yang sudah ditetapkan (selalu patuhi penggunaan Drizzle ORM pada proyek yang menggunakannya).
* **Keamanan Data Transaksional:** Fitur krusial (pembayaran, persetujuan, dll) **TIDAK BOLEH** diandalkan pada *cache* lokal klien. Data wajib disinkronkan secara *real-time* ke *database*.
* Pahami siklus status dari entitas utama dalam proyek sebelum memodifikasi logika perpindahan status data.

## 6. Standar Penulisan Kode (Clean Architecture)
* Pertahankan pemisahan yang jelas antara logika (*business logic/state management*), antarmuka pengguna (UI/HTML/JSX), dan gaya (CSS/Styling).
* Jaga kode agar tetap modular. Jika menambahkan modul/komponen baru, buat agar *reusable*, dan jangan merombak arsitektur lama secara sepihak.

## 7. Prosedur Perbaikan & Deployment (STAGING FIRST)
* Anggap selalu ada pemisahan antara lingkungan **Staging** (pengujian) dan **Production** (live).
* **HARAM** melakukan *hotfix* yang diarahkan langsung ke lingkungan *Production* tanpa melalui pengujian *Staging*.
* Pastikan proses *deployment pipeline* terakhir sudah selesai sebelum menyimpulkan status *bug*.

## 8. Kewajiban Pengujian (Smoke Test & Build Validation)
* Agen **WAJIB** menjalankan perintah *build* atau *compile* setelah setiap perubahan kode untuk memastikan tidak ada *syntax error* atau *type error*.
* Lakukan *Smoke Test* mandiri untuk memastikan tidak ada sistem lain yang rusak (*regression*) akibat perubahan.
* Jangan laporkan tugas "selesai" sebelum aplikasi dipastikan bisa berjalan tanpa *crash* dan operasi *database* via Drizzle ORM tereksekusi dengan sempurna.
