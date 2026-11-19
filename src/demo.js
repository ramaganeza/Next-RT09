/* MODE DEMO: tampil lengkap dengan data FIKTIF, tanpa menyentuh Supabase / data warga asli.
   Buka: https://<situs>/?demo=1   (atau ?demo=KODE bila config.js berisi DEMO_KODE:"KODE")
   Semua perubahan hanya tersimpan di tab browser pengunjung (sessionStorage) dan hilang saat ditutup / disetel ulang. */
(function(){
  const C=window.RT_CONFIG||{},q=new URLSearchParams(location.search);
  if(!q.has("demo"))return;
  if(C.DEMO_KODE&&q.get("demo")!==C.DEMO_KODE)return;
  window.__DEMO=true;window.RT_CONFIG={};   /* putuskan Supabase sebelum shim.js & warga.js dimuat */

  const KEY="rt-demo-v1";
  const now=new Date(),Y=now.getFullYear(),M=now.getMonth();
  const pad=n=>String(n).padStart(2,"0"),ym=(y,m)=>{const d=new Date(y,m,1);return d.getFullYear()+"-"+pad(d.getMonth()+1)};
  const iso=(y,m,d)=>{const t=new Date(y,m,d);return t.getFullYear()+"-"+pad(t.getMonth()+1)+"-"+pad(t.getDate())};
  const svg=(t,c)=>"data:image/svg+xml;base64,"+btoa(unescape(encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320"><rect width="320" height="320" fill="'+c+'"/><text x="160" y="175" font-family="sans-serif" font-size="30" font-weight="700" fill="#fff" text-anchor="middle">'+t+'</text></svg>')));

  function seed(){
    const S={};
    const NM=[["Budi Santoso","Sri Wahyuni"],["Agus Pratama","Dewi Lestari"],["Hendra Wijaya","Ratna Sari"],["Slamet Riyadi","Siti Aminah"],["Joko Susilo","Yuni Astuti"],["Rahmat Hidayat","Nur Hasanah"],["Dedi Kurniawan","Fitri Handayani"],["Eko Prasetyo","Lina Marlina"],["Andi Saputra","Maya Puspita"],["Teguh Santosa","Wulan Sari"],["Bambang Irawan","Endang Susanti"],["Yusuf Maulana","Intan Permata"],["Ridwan Hakim","Aisyah Putri"],["Fajar Nugroho","Retno Wulandari"]];
    const JL=["Jl. Melati","Jl. Mawar","Jl. Kenanga","Jl. Anggrek"];
    S.keluarga={};S.iuran={};
    const kel=[];
    NM.forEach((p,i)=>{
      const id="demo-kk-"+pad(i+1),kk="3200000000"+pad(i+1)+"0001",alamat=JL[i%4]+" No. "+(i+3);
      const ang=[{nama:p[0],hub:"Kepala Keluarga",jk:"L",nik:"3200000000"+pad(i+1)+"1001",tempatLahir:"Kota Demo",tglLahir:(1972+i)+"-05-1"+(i%9),agama:"Islam",pendidikan:["SLTA/Sederajat","Diploma IV/Strata I (S1)","SLTP/Sederajat"][i%3],pekerjaan:["Karyawan Swasta","Wiraswasta","Guru","PNS"][i%4],statusKawin:"Menikah",status:"Aktif"},
        {nama:p[1],hub:"Istri",jk:"P",nik:"3200000000"+pad(i+1)+"1002",tempatLahir:"Kota Demo",tglLahir:(1975+i)+"-08-2"+(i%9),agama:"Islam",pendidikan:"SLTA/Sederajat",pekerjaan:["Ibu Rumah Tangga","Pedagang","Karyawan Swasta"][i%3],statusKawin:"Menikah",status:"Aktif"}];
      for(let a=0;a<i%3+(i%4?0:1);a++)ang.push({nama:["Anisa","Rizky","Dimas","Salsa"][(i+a)%4]+" "+p[0].split(" ")[1],hub:"Anak",jk:a%2?"P":"L",nik:"3200000000"+pad(i+1)+"20"+pad(a+1),tempatLahir:"Kota Demo",tglLahir:(2005+a*3+(i%4))+"-0"+(a+3)+"-1"+a,agama:"Islam",pendidikan:["Tidak/Belum Sekolah","Tamat SD/Sederajat","SLTP/Sederajat"][a%3],pekerjaan:a>1?"Pelajar/Mahasiswa":"Belum/Tidak Bekerja",statusKawin:"Belum Menikah",status:"Aktif"});
      S.keluarga[id]={kepala:p[0],alamat,alamatKK:alamat+", RT 05/RW 03, Kel. Contoh Makmur",kk,nikKepala:ang[0].nik,hunian:i%6===2?"Kontrak":"Tetap",hp:"08123450"+pad(i+10),anggota:ang,aktif:true,ikutGiliran:i<12,cek:false,catatanData:"",riwayat:[{ket:"Data contoh (fiktif)",tgl:iso(Y,M,1)}]};
      kel.push({id,nama:p[0]});
      /* iuran: sebagian lunas, sebagian menunggak 1-4 bulan */
      const nunggak=[0,0,1,0,2,0,0,3,0,1,0,4,0,2][i];
      S.iuran[id]={lunasSd:ym(Y,M-nunggak-(i%5===0?0:0)),bulan:{},konf:false,catatan:"",ibu:{lunasSd:ym(Y,M-(i%4===1?2:0)),bulan:{}}};
    });
    S.__kel=kel;
    /* piutang bulan berjalan dihitung dari status iuran */
    const rate=30000,rateI=50000,per=ym(Y,M),pw=[],pi=[];
    kel.forEach((k,i)=>{const u=S.iuran[k.id];const bw=Math.max(0,(Y*12+M)-(+u.lunasSd.slice(0,4)*12+ +u.lunasSd.slice(5)-1));const bi=Math.max(0,(Y*12+M)-(+u.ibu.lunasSd.slice(0,4)*12+ +u.ibu.lunasSd.slice(5)-1));
      if(bw>0)pw.push({nama:k.nama,kkId:k.id,jumlah:bw*rate,keterangan:"Iuran "+bw+" bulan (@ Rp 30.000)"});if(bi>0)pi.push({nama:"Ibu "+k.nama,kkId:k.id,jumlah:bi*rateI,keterangan:"Iuran Ibu-Ibu "+bi+" bulan (@ Rp 50.000)"})});
    const tot=a=>a.reduce((s,x)=>s+x.jumlah,0);
    S.piutang={};S.piutang["piutang-warga-"+per]={jenis:"warga",periode:per,judul:"Piutang iuran warga",items:pw,total:tot(pw),totalHitung:tot(pw)};
    S.piutang["piutang-ibu-"+per]={jenis:"ibu",periode:per,judul:"Piutang iuran ibu-ibu",items:pi,total:tot(pi),totalHitung:tot(pi)};
    /* kas 6 bulan */
    S.kas={};let sa=2500000,si=800000;
    for(let k=5;k>=0;k--){const p=ym(Y,M-k),lab=new Date(Y,M-k,1).toLocaleDateString("id-ID",{month:"long",year:"numeric"});
      const w=kel.length*rate-(k?0:tot(pw)),klr=[350000,420000,300000,500000,380000,450000][k];const sk=sa+w-klr;
      S.kas["kas-rt-"+p]={jenis:"kasRT",periode:p,judul:"Kas RT "+lab,saldoAwal:sa,totalWajib:w,totalPiutang:0,totalKeluar:klr,saldoAkhir:sk,totalMasuk:w,setoranWajib:[{nama:"Iuran warga",jumlah:w,ket:""}],setoranPiutang:[],pemasukanLain:[],pengeluaran:[{ket:"Konsumsi pertemuan",jumlah:Math.round(klr*.4)},{ket:"Kebersihan & ronda",jumlah:klr-Math.round(klr*.4)}]};sa=sk;
      const wi=kel.length*rateI-(k?0:tot(pi)),ki=60000,ski=si+wi-ki;
      S.kas["kas-ibu-"+p]={jenis:"kasIbu",periode:p,judul:"Kas ibu-ibu "+lab,saldoAwal:si,totalWajib:wi,totalPiutang:0,totalKeluar:ki,saldoAkhir:ski,totalMasuk:wi,setoranWajib:[{nama:"Iuran ibu-ibu",jumlah:wi,ket:""}],setoranPiutang:[],pemasukanLain:[],pengeluaran:[{ket:"Snack arisan",jumlah:ki}]};si=ski}
    /* pengumuman */
    const ag=[["RW 03","Kerja bakti lingkungan","Kerja bakti membersihkan saluran air, Minggu pagi pukul 07.00. Harap membawa alat kebersihan masing-masing."],["Puskesmas","Posyandu balita & lansia","Posyandu rutin bulan ini di pos RT. Bawa buku KIA / buku kontrol."],["RT 05","Pertemuan warga bulanan","Pertemuan rutin membahas iuran, keamanan, dan rencana 17 Agustus. Mohon hadir tepat waktu."],["Kelurahan","Pembaruan data kependudukan","Warga yang belum memperbarui KK / KTP diminta melapor ke pengurus RT."],["DKM / Masjid","Kajian & santunan yatim","Kajian ba'da Maghrib dan penyaluran santunan anak yatim akhir bulan."]];
    S.kegiatan={};ag.forEach((a,i)=>{S.kegiatan["demo-ann-"+(i+1)]={tipe:"pengumuman",asal:a[0],tanggal:iso(Y,M,Math.max(1,now.getDate()-i*2)),judul:a[1],ringkasan:a[2],isi:a[2],sumber:"Data contoh"}});
    /* UMKM, produk, aset, sosial, pertemuan, surat */
    S.umkm={u1:{nama:"Warung Bu Sri",kategori:"Toko & warung",pemilik:"Sri Wahyuni",wa:"081234500001",aktif:true,foto:svg("Warung","#a86b2d")},u2:{nama:"Katering Mawar",kategori:"Makanan & minuman",pemilik:"Dewi Lestari",wa:"081234500002",aktif:true,foto:svg("Katering","#7a4a8a")},u3:{nama:"Bengkel Pak Joko",kategori:"Jasa",pemilik:"Joko Susilo",wa:"081234500003",aktif:true,foto:svg("Bengkel","#2f5d7a")}};
    S.produk={p1:{nama:"Kaos RT 05",harga:85000,status:"Tersedia",ukuran:["M","L","XL"],aktif:true,urut:1,foto:svg("Kaos RT","#2f5d3a")},p2:{nama:"Tumbler RT 05",harga:55000,status:"Tersedia",ukuran:[],aktif:true,urut:2,foto:svg("Tumbler","#8a3a3a")}};
    S.aset={a1:{nama:"Balai warga",jenis:"Gedung / balai warga",kapasitas:"40",tarif:100000,satuan:"per acara",aturan:"Wajib menjaga kebersihan.",aktif:true},a2:{nama:"Tenda & kursi",jenis:"Peralatan",kapasitas:"",tarif:50000,satuan:"per hari",aturan:"",aktif:true}};
    S.inventaris={i1:{nama:"Tenda 3x3",jumlah:4,satuan:"unit",kondisi:"Baik",pinjam:true,lokasi:"Pos RT"},i2:{nama:"Kursi plastik",jumlah:60,satuan:"buah",kondisi:"Baik",pinjam:true,lokasi:"Pos RT"}};
    S.sosial={s1:{kategori:"yatim",nama:"Anak Contoh A",alamat:JL[0]+" No. 3",kkId:"demo-kk-01"},s2:{kategori:"dhuafa",nama:"Ibu Contoh B",alamat:JL[1]+" No. 5"},s3:{kategori:"wakaf",nama:"Bapak Contoh C",alamat:JL[2]+" No. 6"}};
    S.pertemuan={};for(let k=0;k<3;k++){const id=ym(Y,M+k);S.pertemuan[id]={tanggal:iso(Y,M+k,12),keluargaId:kel[k+1].id,jam:"19.30"}}
    S.surat={sr1:{jenis:"Surat Keterangan Domisili",nomor:"001/SP.RT.05/"+Y,tanggal:iso(Y,M,2),nama:kel[0].nama,kkId:kel[0].id}};
    S.verifikasi={data:{catatan:"Data contoh"}};S.reminder={};S.masukan={};S.cctv={};S.sewa={};S.kalender={};
    /* pengaturan */
    S.pengaturan={rt:{namaRT:"RT 05",rw:"RW 03",kelurahan:"Contoh Makmur",kecamatan:"Contoh",kota:"Kota Demo",kodepos:"00000",ketua:"Budi Santoso",sekretaris:"Siti Aminah",bendahara:"Agus Pratama",ketuaRW:"H. Darmawan",
      kodeSurat:"SP.RT.05",kodeRW:"03",nomorSuratBerikut:2,jadwal:{hari:"Sabtu",pekan:2,jam:"19.30"},iuran:"Kas RT = 10000\nSampah = 10000\nInfaq Masjid = 5000\nKonsumsi = 5000",iuranIbuK:"Iuran Ibu-Ibu = 50000",iuranIbu:50000,
      rekening:[{bank:"Bank Contoh",no:"0000 0000 00",an:"Agus Pratama"}],catatanBayar:"Contoh catatan pembayaran. Data demo, bukan rekening sungguhan.",
      visi:"Terwujudnya lingkungan yang rukun, aman, bersih, dan peduli.",misi:["Mempererat kerukunan warga.","Melayani administrasi warga dengan cepat dan tertib.","Mengelola kas secara transparan.","Menjaga keamanan dan kebersihan lingkungan."],
      sop:{teks:"1. Warga wajib melapor tamu menginap lebih dari 24 jam.\n2. Iuran dibayar paling lambat tanggal 10 tiap bulan.\n3. Menjaga kebersihan dan ketertiban lingkungan.",versi:"Contoh",tanggal:iso(Y,M,1),draf:false},
      tpl:["Assalamu'alaikum Bapak/Ibu {nama} ({alamat}). Iuran {bulan_tunggak} belum tercatat. Total: {total}. Terima kasih. - Pengurus RT 05","Pengingat kedua untuk {nama} ({alamat}): tagihan {total} ({rincian}). Terima kasih.","Pengingat terakhir untuk {nama} ({alamat}): tunggakan {total}. Mohon dapat diselesaikan."],
      struktur:[{jabatan:"Ketua RT",nama:"Budi Santoso",tugas:"Pimpinan dan wakil RT ke RW",level:0},{jabatan:"Sekretaris",nama:"Siti Aminah",tugas:"Surat, data warga, notulen",level:1},{jabatan:"Bendahara",nama:"Agus Pratama",tugas:"Iuran, kas, laporan keuangan",level:1},{jabatan:"Seksi Keamanan",nama:"Hendra Wijaya",tugas:"Ronda, kebersihan",level:2},{jabatan:"Seksi Sosial",nama:"Slamet Riyadi",tugas:"Santunan, qurban",level:2},{jabatan:"Seksi Humas & UMKM",nama:"Rahmat Hidayat",tugas:"Informasi, UMKM warga",level:2}],
      giliranUrut:kel.slice(0,12).map(k=>k.id),brand:{nama:"Aplikasi RT Demo",logo:"",heroJudul:"RT 05 / RW 03",heroSub:"Kel. Contoh Makmur · Kota Demo",tagline:"Contoh tampilan untuk calon pengguna. Semua data di sini fiktif."},
      tampilan:{}}};
    delete S.__kel;return S}

  let store=null;
  try{const r=sessionStorage.getItem(KEY);if(r)store=JSON.parse(r)}catch(e){}
  if(!store)store=seed();
  const lis=[];let tm=0;
  const clone=o=>JSON.parse(JSON.stringify(o));
  const save=()=>{clearTimeout(tm);tm=setTimeout(()=>{try{sessionStorage.setItem(KEY,JSON.stringify(store))}catch(e){}},300)};
  const notify=coll=>lis.filter(l=>l.coll===coll).forEach(l=>l.run());
  const merge=(a,b)=>{const o={...a};for(const k in b){o[k]=(b[k]&&typeof b[k]==="object"&&!Array.isArray(b[k])&&a&&typeof a[k]==="object"&&!Array.isArray(a[k]))?merge(a[k],b[k]):b[k]}return o};
  const split=p=>{const a=p.split("/");return {coll:a[0],id:a.slice(1).join("/")}};
  const db={
    collection:coll=>({onSnapshot(ok){const run=()=>ok({metadata:{fromCache:false},docs:Object.entries(store[coll]||{}).map(([id,d])=>({id,data:()=>clone(d)}))});const l={coll,run};lis.push(l);run();return()=>{const i=lis.indexOf(l);if(i>=0)lis.splice(i,1)}}}),
    doc:path=>{const {coll,id}=split(path);
      const put=async d=>{(store[coll]=store[coll]||{})[id]=clone(d);save();notify(coll)};
      return {onSnapshot(ok){const run=()=>{const d=(store[coll]||{})[id];ok({exists:!!d,data:()=>d?clone(d):{}})};const l={coll,run};lis.push(l);run();return()=>{const i=lis.indexOf(l);if(i>=0)lis.splice(i,1)}},
        set:put,update:async p=>put(merge((store[coll]||{})[id]||{},p)),delete:async()=>{if(store[coll])delete store[coll][id];save();notify(coll)}}}};
  const downloads={save:async({filename,data})=>{const b=data instanceof Blob?data:new Blob([data]);const a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=filename;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1000)}};

  /* dipanggil setelah shim.js dimuat: menimpa jembatan Supabase */
  window.__demoInstall=function(){
    window.claude={use:async n=>n==="db"?db:n==="downloads"?downloads:n==="user"?{canEdit:()=>true,isOwner:()=>true,id:async()=>"demo"}:null};
    window.RT_AUTH={onChange(){},state:()=>({signedIn:true,email:"demo@contoh.id",admin:true,owner:true}),signInPassword:async()=>({ok:true}),signInOtp:async()=>({ok:true}),signOut:async()=>{location.href=location.pathname}};
    window.RT_PUBLIC_SUBMIT=async()=>({ok:true});
    document.addEventListener("DOMContentLoaded",()=>{
      const st=document.createElement("style");st.textContent="#demoBar{position:fixed;top:0;left:0;right:0;z-index:90;background:#b3261e;color:#fff;font:600 12px/1.2 system-ui,sans-serif;padding:6px 10px;display:flex;gap:10px;align-items:center;justify-content:center;flex-wrap:wrap}#demoBar button{background:#fff;color:#b3261e;border:0;border-radius:999px;padding:3px 10px;font:600 12px system-ui;cursor:pointer}body{padding-top:30px}";document.head.appendChild(st);
      const b=document.createElement("div");b.id="demoBar";b.innerHTML="<span>MODE DEMO &middot; data fiktif &middot; perubahan hanya tersimpan di tab ini</span><button id='demoReset'>Setel ulang</button>";document.body.appendChild(b);
      document.getElementById("demoReset").onclick=()=>{try{sessionStorage.removeItem(KEY)}catch(e){}location.reload()}});
  };
})();
