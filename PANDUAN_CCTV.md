# Panduan CCTV Hikvision untuk RT 09 / RW 01

## Cara paling aman: Hik-Connect + tautan berbagi
1. Pasang aplikasi **Hik-Connect** di HP pengurus, tambahkan DVR/NVR/kamera Hikvision (aktifkan *Hik-Connect* / *Platform Access* di perangkat, ganti kata sandi bawaan).
2. Di aplikasi: pilih perangkat/kamera > **Berbagi** (Share). Salin tautan berbagi.
3. Di sistem RT: **Aset & inventaris > CCTV > + Tambah kamera**. Tempel tautan (harus https), pilih akses:
   - **Pengurus saja**: hanya terlihat di Area Pengurus.
   - **Umum**: tampil di halaman depan.
4. Tautan berbagi bisa dicabut kapan saja dari aplikasi Hik-Connect.

## Jangan dilakukan
- Jangan membuka port / port forwarding ke DVR, dan jangan menaruh alamat IP, RTSP, atau kata sandi kamera di sistem ini (sistem menolak alamat IP/RTSP).
- Jangan memakai kata sandi bawaan Hikvision; pakai kata sandi kuat dan perbarui firmware.
- Jangan arahkan kamera ke dalam rumah, jendela, atau area privat.

## Etika dan aturan
- Kamera hanya untuk area umum (gerbang, jalan lorong, pos).
- Pasang papan "Area ini dipantau CCTV".
- Tayangan hidup yang dibuka umum sebaiknya terbatas (misalnya hanya cuplikan). Rekaman untuk keperluan kejadian diminta lewat pengurus.
- Data pribadi yang terekam termasuk data pribadi (UU PDP No. 27/2022): tetapkan siapa pengurus yang memegang akses dan catat setiap permintaan rekaman.

## Tahap berikutnya
Akses CCTV khusus warga yang sudah login (Tahap 9).
