
const HARI=["Minggu","Senin","Selasa","Rabu","Kamis","Jumat","Sabtu"];
const ROM=["I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII"];
const DEF={namaRT:"RT 09",rw:"RW 01",kelurahan:"Sudimara Pinang",kota:"Kota Tangerang",kodepos:"15145",
 ketua:"Ir. Rama Ganeza S, S.T.",sekretaris:"",bendahara:"Sutrisno",
 jadwal:{hari:"Sabtu",pekan:2,jam:"19.30"},
 iuran:"Kas RT = 10000\nSampah = 10000\nInfaq Masjid MBM = 5000\nKonsumsi = 5000",
 nomorSuratBerikut:358,kodeSurat:"SP.RT.09",kodeRW:"01",kecamatan:"Pinang",komplek:"",ketuaRW:"Sutrisno",giliranUrut:[],albumUrl:"",tema:{preset:"Perunggu (bawaan)",accent:"#6b4a1f",bg:"#f1efec",fs:"Normal"},reminderHari:7,reminderMaks:3,qris:"",catatanBayar:"Cantumkan nama dan blok/nomor rumah pada berita transfer, lalu konfirmasi ke Bendahara.",rekening:[{bank:"BCA",no:"310 114 5873",an:"Sutrisno"},{bank:"Mandiri",no:"1550 0151 952 36",an:"Sutrisno"}],
 struktur:[{jabatan:"Ketua RT",nama:"Ir. Rama Ganeza S, S.T.",tugas:"Pimpinan, tanda tangan surat, wakil RT ke RW",level:0},{jabatan:"Sekretaris",nama:"",tugas:"Surat, data warga, notulen",level:1},{jabatan:"Bendahara",nama:"Sutrisno",tugas:"Iuran, kas, laporan keuangan",level:1},{jabatan:"Seksi Keamanan & Lingkungan",nama:"",tugas:"Ronda, kebersihan, kerja bakti",level:2},{jabatan:"Seksi Sosial & Keagamaan",nama:"",tugas:"Santunan, qurban, kegiatan ibadah",level:2},{jabatan:"Seksi Humas, UMKM & Kegiatan",nama:"",tugas:"Informasi, UMKM, acara warga",level:2},{jabatan:"Koordinator Lorong",nama:"",tugas:"Penghubung pengurus dengan warga",level:3}],
 tpl:["Assalamu'alaikum Bapak/Ibu {nama} ({alamat}).\nKami dari pengurus RT 09/RW 01 mengingatkan dengan hormat bahwa iuran warga {bulan_tunggak} belum tercatat.\n\nTotal: {total}\nRincian: {rincian}\n\nPembayaran dapat diserahkan ke Bendahara atau pada pertemuan warga bulan ini. Jika sudah membayar, mohon abaikan pesan ini.\nTerima kasih. - Pengurus RT 09",
 "Assalamu'alaikum Bapak/Ibu {nama} ({alamat}).\nIuran RT 09 atas nama Bapak/Ibu masih belum diterima untuk {bulan_tunggak}. Total tagihan saat ini {total}.\nRincian: {rincian}\n\nMohon dapat diselesaikan sebelum pertemuan warga berikutnya. Bila ada kendala, silakan hubungi Bendahara agar bisa dibantu cicilan.\nTerima kasih. - Pengurus RT 09",
 "Yth. Bapak/Ibu {nama} ({alamat}).\nIni pengingat terakhir dari pengurus RT 09. Tunggakan iuran sebesar {total} ({rincian}) belum diselesaikan.\n\nPelayanan surat pengantar RT dapat ditunda sampai tunggakan dilunasi atau ada kesepakatan cicilan dengan Bendahara.\nTerima kasih atas pengertiannya. - Pengurus RT 09"]};
const HUB=["KK","Istri","Suami","Anak","Menantu","Cucu","Orang tua","Mertua","Famili lain","Pembantu","Lainnya"];
const AGAMA=["Islam","Kristen Protestan","Katolik","Hindu","Buddha","Konghucu","Lainnya"];
const KAWIN=["Belum Menikah","Menikah","Janda","Duda"];
const TABS=[["beranda","Beranda",0],["warga","Data warga",1],["surat","Surat",1],["keuangan","Keuangan",1],["reminder","Pengingat",1],["masuk","Kotak masuk",1],["sosial","Sosial & qurban",1],["aset","Aset & inventaris",1],["konten","Konten publik",1],["depan","Halaman depan",0],["kegiatan","Berita & notulen",0],["pertemuan","Pertemuan",0],["pengaturan","Pengaturan",1]];

const S={set:DEF,kel:[],keg:[],pert:[],tab:"beranda",admin:false,db:null,ready:false,slow:false,errs:{},q:"",fHun:"semua",fTipe:"semua",reveal:false};
const $=s=>document.querySelector(s);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const iso=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const fmtTgl=s=>s?new Date(s+"T00:00:00").toLocaleDateString("id-ID",{weekday:"long",day:"numeric",month:"long",year:"numeric"}):"-";
const fmtTglS=s=>s?new Date(s+"T00:00:00").toLocaleDateString("id-ID",{day:"numeric",month:"short",year:"numeric"}):"-";
const digits=v=>String(v||"").replace(/\D/g,"");
const mask=v=>{const d=String(v||"");if(!d)return "-";return S.reveal?d:"•".repeat(Math.max(0,d.length-4))+d.slice(-4)};
const jiwa=f=>(f.anggota||[]).filter(a=>(a.status||"Aktif")==="Aktif");
const lengkap=f=>f.alamat&&f.hp&&digits(f.kk).length>=10&&digits(f.nikKepala).length>=10;
const byAlamat=(a,b)=>(a.alamat?0:1)-(b.alamat?0:1)||(a.alamat||"").localeCompare(b.alamat||"","id",{numeric:true})||a.kepala.localeCompare(b.kepala);
function toast(m){const t=$("#toast");t.textContent=m;t.hidden=false;clearTimeout(toast.h);toast.h=setTimeout(()=>t.hidden=true,2800)}
function upsert(arr,o){const i=arr.findIndex(x=>x.id===o.id);i>=0?arr[i]=o:arr.push(o)}
async function put(path,data){try{await S.db.doc(path).set(data)}catch(e){throw new Error(e&&e.code==="invalid_argument"?"Anda tidak memiliki izin mengubah data (perlu akses Editor).":"Gagal menyimpan ("+(e&&e.code||"error")+"). Coba lagi.")}}
async function del(path){try{await S.db.doc(path).delete()}catch(e){throw new Error("Gagal menghapus.")}}

/* ---- jadwal pertemuan ---- */
function nthWeekday(y,m,wd,n){const first=new Date(y,m,1);const off=(wd-first.getDay()+7)%7;const d=new Date(y,m,1+off+(n-1)*7);if(d.getMonth()!==m)d.setDate(d.getDate()-7);return d}
function nextMeeting(from){const j=S.set.jadwal,wd=HARI.indexOf(j.hari);const t0=new Date(from.getFullYear(),from.getMonth(),from.getDate());let y=from.getFullYear(),m=from.getMonth();
  for(let i=0;i<14;i++){const d=nthWeekday(y,m,wd,+j.pekan||2);if(d>=t0)return d;m++;if(m>11){m=0;y++}}return t0}
function hosts(){const seen={},ord=S.set.giliranUrut||[],rk=f=>{const i=ord.indexOf(f.id);return i<0?1e6:i};return S.kel.filter(f=>f.aktif!==false&&f.alamat&&(f.ikutGiliran===true||(f.ikutGiliran!==false&&f.hunian==="Tetap"))).sort((x,y)=>rk(x)-rk(y)||byAlamat(x,y)).filter(f=>seen[f.alamat]?false:(seen[f.alamat]=1))}
function nextHost(){const hs=hosts();if(!hs.length)return null;
  const done=S.pert.filter(p=>p.status!=="batal"&&p.tuanRumahId).sort((a,b)=>a.tanggal.localeCompare(b.tanggal));
  if(!done.length)return hs[0];const last=done[done.length-1];let i=hs.findIndex(h=>h.id===last.tuanRumahId);if(i<0&&last.alamat)i=hs.findIndex(h=>h.alamat===last.alamat);return hs[(i+1)%hs.length]}
const upcoming=()=>S.pert.filter(p=>p.status==="terjadwal"&&p.tanggal>=iso(new Date())).sort((a,b)=>a.tanggal.localeCompare(b.tanggal))[0];

/* ---- dialog & formulir ---- */
function modal(html,wide){$("#modal").innerHTML=`<div class="ov"><div class="dlg ${wide?"wide":""}" role="dialog" aria-modal="true">${html}</div></div>`;$("#modal .ov").addEventListener("mousedown",e=>{if(e.target.classList.contains("ov"))closeM()})}
function closeM(){$("#modal").innerHTML=""}
function fieldHtml(f){const v=f.value??"",id="f_"+f.id,sh=f.showIf?` data-showif="${f.showIf[0]}=${f.showIf[1]}"`:"";let c;
  if(f.type==="select")c=`<select id="${id}">${f.options.map(o=>`<option ${o===v?"selected":""}>${esc(o)}</option>`).join("")}</select>`;
  else if(f.type==="textarea")c=`<textarea id="${id}" rows="${f.rows||4}" placeholder="${esc(f.ph||"")}">${esc(v)}</textarea>`;
  else if(f.type==="check")return `<div class="field"${sh}><label class="chk"><input type="checkbox" id="${id}" ${v?"checked":""}> ${esc(f.label)}</label></div>`;
  else c=`<input id="${id}" type="${f.type||"text"}" value="${esc(v)}" ${f.list?`list="${f.list}"`:""} ${f.inputmode?`inputmode="${f.inputmode}"`:""} placeholder="${esc(f.ph||"")}" autocomplete="off">`;
  return `<div class="field ${f.half?"half":""}"${sh}><label for="${id}">${esc(f.label)}</label>${c}${f.hint?`<p class="hint">${esc(f.hint)}</p>`:""}</div>`}
function openForm({title,fields,save,label="Simpan",wide}){
  modal(`<form id="mf" novalidate><h3>${esc(title)}</h3><div class="fgrid">${fields.map(fieldHtml).join("")}</div><p class="err" id="merr" role="alert"></p><div class="mact"><button type="button" class="btn" id="mc">Batal</button><button class="btn pri" type="submit" id="ms">${label}</button></div></form>`,wide);
  const tg=()=>document.querySelectorAll("#mf [data-showif]").forEach(d=>{const [k,v]=d.dataset.showif.split("=");d.hidden=$("#f_"+k).value!==v});tg();
  $("#mf").addEventListener("change",tg);$("#mc").onclick=closeM;
  $("#mf").onsubmit=async e=>{e.preventDefault();const v={};fields.forEach(f=>{const el=$("#f_"+f.id);v[f.id]=f.type==="check"?el.checked:el.value.trim()});
    const b=$("#ms");b.disabled=true;$("#merr").textContent="";
    try{const r=await save(v);if(r&&r.error){$("#merr").textContent=r.error;b.disabled=false;return}if(!r||!r.keep)closeM()}catch(x){$("#merr").textContent=x.message;b.disabled=false}}}
function confirmM(text,yes,label="Ya, lanjutkan"){modal(`<h3>Konfirmasi</h3><p style="margin:12px 0">${esc(text)}</p><div class="mact"><button class="btn" id="mc">Batal</button><button class="btn pri" id="my">${label}</button></div>`);
  $("#mc").onclick=closeM;$("#my").onclick=async()=>{try{await yes();closeM()}catch(x){toast(x.message)}}}

/* ---- tampilan ---- */
function head(){return `<div class="top"><div class="brand"><img class="logo" src="${LOGO}" alt="Logo RT 09"><div><b>Sistem Informasi ${esc(S.set.namaRT)} / ${esc(S.set.rw)}</b><span>Kel. ${esc(S.set.kelurahan)}, ${esc(S.set.kota)}</span></div></div>
 <span class="pill ${S.admin?"p-gold":"p-mute"}">${S.admin?"Pengurus (bisa mengubah)":"Hanya lihat"}</span>${MODE==="publik"&&S.admin&&window.RT_AUTH?`<button class="btn sm" data-signout="1">Keluar</button>`:""}</div>`}
function render(){
  const a=$("#app");applyTema();
  if(!S.db&&MODE==="pengurus"){a.innerHTML=vLogin();bind7();return}
  if(!S.db){a.innerHTML=head()+`<div class="card" style="margin-top:20px;max-width:560px"><h2>Belum bisa membuka data</h2><p class="muted" style="margin-top:8px">Halaman ini menyimpan data RT di basis data Claude. Buka lewat akun yang sudah diundang pengurus. Jika Anda sudah masuk dan pesan ini tetap muncul, minta pengurus memeriksa pengaturan berbagi.</p></div>`;return}
  if(MODE==="publik"&&!S.admin){a.innerHTML=`<div class="pub">${vDepan()}</div>`;bind7();return}
  if(MODE==="pengurus"&&!S.admin){a.innerHTML=vLogin();bind7();return}
  const tabs=TABS.filter(t=>!t[2]||S.admin);
  if(!tabs.some(t=>t[0]===S.tab))S.tab="beranda";
  const body=(S.slow&&!S.ready?`<div class="banner">Data belum terjangkau. Memeriksa koneksi...</div>`:"")+((S.db&&!S.ready&&!S.slow)?'<div class="sk"></div><div class="sk"></div><div class="sk"></div>':({beranda:vBeranda,warga:vWarga,kegiatan:vKegiatan,pertemuan:vPertemuan,surat:vSurat,keuangan:vKeuangan,reminder:vReminder,sosial:vSosial,pengaturan:vPengaturan,masuk:vMasuk,aset:vAset,konten:vKonten,depan:vDepan}[S.tab])());
  const ae=document.activeElement,keep=ae&&ae.id&&/^(q|qs)$/.test(ae.id)?ae.id:null;
  a.innerHTML=shellHtml(tabs,body);S.anim=false;
  bind();
  $("#alamatList").innerHTML=[...new Set(S.kel.map(f=>f.alamat).filter(Boolean))].sort((x,y)=>x.localeCompare(y,"id",{numeric:true})).map(x=>`<option value="${esc(x)}">`).join("");
}
function adminHero(){if(!S.admin)return "";const st=S.set,kk=S.kel.filter(f=>f.aktif!==false),n=kk.reduce((a,f)=>a+jiwa(f).length,0);
  const ids=["warga","surat","keuangan","sosial","masuk","reminder","aset","pengaturan"],lab=Object.fromEntries(TABS.map(t=>[t[0],t[1]]));
  return `<div class="clean"><section class="bhero"><div class="bh-top"><img class="hlogo" src="${LOGO}" alt="Logo RT 09"><div class="hmain"><p class="eyebrow">Area Pengurus</p><h1>${esc(st.namaRT)} / ${esc(st.rw)}</h1></div></div>
   <p class="hsub">Selamat bertugas, ${esc(st.ketua).replace(/\.$/,"")}</p><div class="bh-sum"><div><b>${kk.length}</b><span>KK aktif</span></div><div><b>${n}</b><span>Jiwa</span></div><div><b>${kk.filter(f=>!lengkap(f)).length}</b><span>Perlu dilengkapi</span></div></div></section>
  <nav class="qgrid" aria-label="Menu pengurus">${ids.map(i=>`<button class="qt" data-gt="${i}"><span class="qi">${ic(i)}</span><span>${esc(lab[i]||i)}</span></button>`).join("")}</nav></div>`}
function vBeranda(){
  const kk=S.kel.filter(f=>f.aktif!==false),n=kk.reduce((s,f)=>s+jiwa(f).length,0),tp=kk.filter(f=>f.hunian==="Tetap").length;
  const up=upcoming(),nm=nextMeeting(new Date()),nh=nextHost(),last=S.keg.slice().sort((a,b)=>b.tanggal.localeCompare(a.tanggal)).slice(0,3),s=S.set;
  return adminHero()+quick()+`<div class="grid g2"><div class="card lift"><p class="muted small">Pertemuan warga berikutnya</p>
   ${up?`<h2 style="margin:6px 0 4px">${fmtTgl(up.tanggal)}</h2><p>Di rumah <b>${esc(up.tuanRumahNama||"-")}</b>${up.alamat?" ("+esc(up.alamat)+")":""} · pukul ${esc(s.jadwal.jam)}</p>`:
   `<h2 style="margin:6px 0 4px">${fmtTgl(iso(nm))}</h2><p>Jadwal rutin: ${esc(s.jadwal.hari)}, pekan ke-${s.jadwal.pekan}, pukul ${esc(s.jadwal.jam)}.</p><p class="muted small" style="margin-top:4px">${nh?"Giliran tuan rumah berikutnya: "+esc(nh.kepala)+" ("+esc(nh.alamat)+")":"Data giliran tuan rumah belum ada."}</p>`}
   <p style="margin-top:12px"><a class="btn sm" href="#pertemuan" style="text-decoration:none;display:inline-block">Lihat giliran</a></p></div>
  ${albumCard()}</div>
  <div class="row" style="margin:26px 0 12px"><div><h2>Struktur pengurus RT</h2><p class="muted small">Sama dengan yang tampil di halaman depan</p></div>${S.admin?`<a class="btn sm" href="#pengaturan" style="text-decoration:none">Ubah</a>`:""}</div>${strukturHtml()}
  ${S.admin?`<div class="grid g4" style="margin-top:14px"><div class="card stat"><b>${kk.length}</b><span>Kartu Keluarga aktif</span></div><div class="card stat"><b>${n}</b><span>Jiwa tercatat</span></div><div class="card stat"><b>${tp}</b><span>KK tetap</span></div><div class="card stat"><b>${kk.filter(f=>!lengkap(f)).length}</b><span>Data perlu dilengkapi</span></div></div>`:""}
  <h3 class="sect">Kegiatan terbaru</h3>${last.length?`<div class="tl">${last.map(evHtml).join("")}</div>`:`<div class="card empty">Belum ada berita atau notulensi.</div>`}
  ${attention()}`;
}
function vWarga(){
  const kk=S.kel;const q=S.q.toLowerCase();
  let list=kk.filter(f=>{if(S.fHun==="nonaktif")return f.aktif===false;if(f.aktif===false)return false;if(S.fHun==="lengkap")return !lengkap(f);if(S.fHun!=="semua"&&f.hunian!==S.fHun)return false;return true})
   .filter(f=>!q||(f.kepala+" "+f.alamat+" "+(f.anggota||[]).map(a=>a.nama).join(" ")+" "+f.hp).toLowerCase().includes(q)||digits(f.kk).includes(q)||digits(f.nikKepala).includes(q)).sort(byAlamat);
  return `<div class="row" style="margin-bottom:12px"><div><h2>Data warga</h2><p class="muted small">${kk.filter(f=>f.aktif!==false).length} KK aktif · ${kk.filter(f=>f.aktif!==false).reduce((s,f)=>s+jiwa(f).length,0)} jiwa tercatat</p></div>
   <div style="display:flex;gap:8px;flex-wrap:wrap">${S.admin?'<button class="btn" id="shX">Google Sheets</button>':""}<button class="btn" id="rev">${S.reveal?"Sembunyikan nomor":"Tampilkan nomor"}</button><button class="btn pri" id="addKK">+ Tambah warga baru</button></div></div>
  <div class="tools"><input id="q" type="search" placeholder="Cari nama, alamat, No. KK, NIK, HP" value="${esc(S.q)}" aria-label="Cari"><select id="fh" aria-label="Filter">${[["semua","Semua KK aktif"],["Tetap","Tetap"],["Kontrak","Kontrak"],["lengkap","Perlu dilengkapi"],["nonaktif","Nonaktif / pindah"]].map(o=>`<option value="${o[0]}" ${S.fHun===o[0]?"selected":""}>${o[1]}</option>`).join("")}</select></div>
  <div class="card scroll" style="padding:6px">${list.length?`<table class="tbl"><thead><tr><th>Kepala keluarga</th><th>Alamat</th><th>No. HP</th><th>Hunian</th><th>Jiwa</th><th></th></tr></thead><tbody>
  ${list.map(f=>`<tr class="click" tabindex="0" data-kk="${esc(f.id)}"><td><b>${esc(f.kepala)}</b></td><td>${esc(f.alamat||"-")}</td><td class="mono">${esc(f.hp||"-")}</td><td><span class="pill ${f.hunian==="Tetap"?"p-good":"p-warn"}">${esc(f.hunian||"-")}</span></td><td class="num">${jiwa(f).length}</td><td>${f.aktif===false?'<span class="pill p-mute">Nonaktif</span>':lengkap(f)?"":'<span class="pill p-warn">Lengkapi</span>'}</td></tr>`).join("")}</tbody></table>`:`<div class="empty">${S.kel.length?"Tidak ada yang cocok.":"Belum ada data warga."}</div>`}</div>`;
}
function evHtml(e){const t={berita:"Berita",kegiatan:"Kegiatan",notulen:"Notulen"}[e.tipe]||e.tipe;
  return `<article class="ev ${e.tipe==="notulen"?"notulen":""}" data-ev="${esc(e.id)}"><div class="row"><span class="small muted">${fmtTglS(e.tanggal)} · <span class="pill ${e.tipe==="notulen"?"p-gold":"p-mute"}">${t}</span></span>${S.admin?`<span><button class="btn sm" data-editev="${esc(e.id)}">Ubah</button> <button class="btn sm bad" data-delev="${esc(e.id)}">Hapus</button></span>`:""}</div>
  <h3>${esc(e.judul)}</h3>${e.ringkasan?`<p class="small">${esc(e.ringkasan)}</p>`:""}
  ${e.tipe==="notulen"?`<dl class="kv" style="margin-top:8px">${e.tuanRumah?`<dt>Tempat</dt><dd>${esc(e.tuanRumah)}</dd>`:""}${e.hadir?`<dt>Hadir</dt><dd>${esc(e.hadir)} orang</dd>`:""}${e.agenda?`<dt>Agenda</dt><dd style="white-space:pre-wrap">${esc(e.agenda)}</dd>`:""}${e.keputusan?`<dt>Keputusan</dt><dd style="white-space:pre-wrap">${esc(e.keputusan)}</dd>`:""}${e.tindakLanjut?`<dt>Tindak lanjut</dt><dd style="white-space:pre-wrap">${esc(e.tindakLanjut)}</dd>`:""}</dl>`:""}
  ${e.isi?`<details style="margin-top:8px"><summary class="small" style="cursor:pointer;color:var(--accent);font-weight:600">Baca selengkapnya</summary><div class="body">${esc(e.isi)}</div></details>`:""}
  ${e.sumber?`<p class="hint" style="margin-top:8px">Sumber: ${esc(e.sumber)}</p>`:""}</article>`}
function vKegiatan(){
  const all=S.keg.slice().sort((a,b)=>b.tanggal.localeCompare(a.tanggal)),list=all.filter(e=>S.fTipe==="semua"||e.tipe===S.fTipe);let y="";
  return `<div class="row" style="margin-bottom:12px"><div><h2>Berita & notulen</h2><p class="muted small">Riwayat kegiatan RT 09, dari yang terbaru</p></div>${S.admin?`<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" id="addNot">+ Notulen rapat</button><button class="btn pri" id="addEv">+ Berita / kegiatan</button></div>`:""}</div>
  <div class="chips">${[["semua","Semua"],["berita","Berita"],["kegiatan","Kegiatan"],["notulen","Notulen"]].map(c=>`<button class="chipb" data-ft="${c[0]}" aria-pressed="${S.fTipe===c[0]}">${c[1]} (${c[0]==="semua"?all.length:all.filter(e=>e.tipe===c[0]).length})</button>`).join("")}</div>
  ${list.length?`<div class="tl">${list.map(e=>{const yy=e.tanggal.slice(0,4);const h=yy!==y?`<p class="yr">${yy}</p>`:"";y=yy;return h+evHtml(e)}).join("")}</div>`:`<div class="card empty">${S.fTipe==="notulen"?"Belum ada notulensi. Setelah pertemuan, pengurus dapat menambahkan lewat tombol Notulen rapat.":"Belum ada data."}</div>`}`;
}
function vPertemuan(){
  const hs=hosts(),nh=nextHost(),nm=nextMeeting(new Date()),pl=S.pert.slice().sort((a,b)=>b.tanggal.localeCompare(a.tanggal));
  const hosted=new Set(S.pert.filter(p=>p.status==="selesai").map(p=>p.tuanRumahId)),skipped=S.kel.filter(f=>f.aktif!==false&&f.alamat&&f.ikutGiliran===false).sort(byAlamat);
  return `<div class="row" style="margin-bottom:12px"><div><h2>Pertemuan rutin bulanan</h2><p class="muted small">${esc(S.set.jadwal.hari)}, pekan ke-${S.set.jadwal.pekan} tiap bulan, pukul ${esc(S.set.jadwal.jam)} · bergilir dari rumah ke rumah</p></div>${S.admin?`<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" data-set="jadwal">Ubah jadwal rutin</button><button class="btn pri" id="addPert">+ Jadwalkan pertemuan</button></div>`:""}</div>
  <div class="card" style="margin-bottom:14px"><p class="muted small">Usulan berikutnya</p><h3 style="margin-top:4px">${fmtTgl(iso(nm))}</h3><p>${nh?`Tuan rumah: <b>${esc(nh.kepala)}</b> (${esc(nh.alamat)})`:"Belum ada KK tetap beralamat untuk digilir."}</p></div>
  <div class="grid g2" style="align-items:start"><div class="card"><h3 style="margin-bottom:8px">Jadwal & riwayat</h3>${pl.length?`<div class="grid" style="gap:10px">${pl.map(p=>`<div class="row" style="border-bottom:1px solid var(--line);padding-bottom:8px"><div><b>${fmtTglS(p.tanggal)}</b><p class="small muted">${esc(p.tuanRumahNama||"-")}${p.alamat?" · "+esc(p.alamat):""}</p>${p.catatan?`<p class="small">${esc(p.catatan)}</p>`:""}</div>
   <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap"><span class="pill ${p.status==="selesai"?"p-good":p.status==="batal"?"p-bad":"p-warn"}">${p.status==="selesai"?"Selesai":p.status==="batal"?"Batal":"Terjadwal"}</span>${S.admin?`<button class="btn sm" data-editp="${esc(p.id)}">Ubah</button>`:""}${S.admin&&p.status==="terjadwal"?`<button class="btn sm pri" data-done="${esc(p.id)}">Selesai + notulen</button><button class="btn sm" data-cancelp="${esc(p.id)}">Batalkan</button>`:""}</div></div>`).join("")}</div>`:`<p class="muted small">Belum ada pertemuan tercatat di sistem.</p>`}</div>
  <div class="card"><div class="row"><h3>Urutan giliran tuan rumah</h3>${S.admin?`<span style="display:flex;gap:6px">${(S.set.giliranUrut||[]).length?`<button class="btn sm" id="gReset">Urut alamat</button>`:""}<button class="btn sm pri" id="gAdd">+ Tambah tuan rumah</button></span>`:""}</div><p class="hint" style="margin:4px 0 8px">${S.admin?"Geser dengan tombol panah, keluarkan KK dari giliran, atau tambahkan KK lain (termasuk yang mengontrak). Rumah yang sama dihitung satu giliran.":"Diurutkan menurut alamat."}</p>
   ${hs.length?`<ol class="gl">${hs.map((h,i)=>`<li><span class="gi">${i+1}. ${esc(h.kepala)} <span class="muted small">${esc(h.alamat)}</span> ${hosted.has(h.id)?'<span class="pill p-good">sudah</span>':""}${nh&&nh.id===h.id?' <span class="pill p-gold">berikutnya</span>':""}</span>${S.admin?`<button class="btn sm" data-gup="${i}" aria-label="Naikkan" ${i?"":"disabled"}>▲</button><button class="btn sm" data-gdn="${i}" aria-label="Turunkan" ${i<hs.length-1?"":"disabled"}>▼</button><button class="btn sm" data-gskip="${esc(h.id)}">Keluarkan</button>`:""}</li>`).join("")}</ol>`:`<p class="muted small">Belum ada data.</p>`}
   ${S.admin&&skipped.length?`<p class="small muted" style="margin-top:12px">Dikeluarkan dari giliran:</p><ol class="gl">${skipped.map(h=>`<li><span class="gi">${esc(h.kepala)} <span class="muted small">${esc(h.alamat)}</span></span><button class="btn sm" data-gin="${esc(h.id)}">Ikutkan</button></li>`).join("")}</ol>`:""}</div></div>`;
}
function vKeuanganLama(){return `<h2 style="margin-bottom:12px">Keuangan & surat</h2><div class="grid g2"><div class="card"><h3>Kas, iuran, piutang</h3><p class="muted small" style="margin-top:6px">Menunggu data terbaru dari bendahara (Sutrisno). Setelah data masuk, bagian ini menampilkan saldo kas, status iuran per KK, tunggakan, dan pengingat otomatis. Nominal iuran dan template pesan sudah bisa diatur di Pengaturan.</p></div>
 <div class="card"><h3>Surat pengantar RT</h3><p class="muted small" style="margin-top:6px">Pengajuan oleh warga, persetujuan Ketua RT, dan nomor otomatis disiapkan di tahap berikutnya. Nomor surat berikutnya sudah tercatat: <span class="mono">${esc(S.set.nomorSuratBerikut)} / SP.${esc(S.set.namaRT.replace(" ",""))}</span>.</p></div></div>`}
function vPengaturan(){const s=S.set,j=s.jadwal;
  return `<div class="row" style="margin-bottom:12px"><div><h2>Pengaturan</h2><p class="muted small">Semua isian ini mengubah tampilan di seluruh aplikasi.</p></div></div>
  <div class="grid g2" style="align-items:start">
  <div class="card"><div class="row"><h3>Identitas & pengurus</h3><button class="btn sm" data-set="id">Ubah</button></div><dl class="kv" style="margin-top:10px"><dt>Wilayah</dt><dd>${esc(s.namaRT)} / ${esc(s.rw)}, Kel. ${esc(s.kelurahan)}, ${esc(s.kota)} ${esc(s.kodepos)}</dd><dt>Ketua RT</dt><dd>${esc(s.ketua)}</dd><dt>Sekretaris</dt><dd>${esc(s.sekretaris||"Belum diisi")}</dd><dt>Bendahara</dt><dd>${esc(s.bendahara)}</dd></dl></div>
  <div class="card"><div class="row"><h3>Jadwal pertemuan</h3><button class="btn sm" data-set="jadwal">Ubah</button></div><dl class="kv" style="margin-top:10px"><dt>Hari</dt><dd>${esc(j.hari)}, pekan ke-${j.pekan}</dd><dt>Jam</dt><dd>${esc(j.jam)}</dd></dl></div>
  <div class="card"><div class="row"><h3>Iuran bulanan</h3><button class="btn sm" data-set="iuran">Ubah</button></div><div class="small" style="margin-top:10px;white-space:pre-wrap">${esc(s.iuran)}</div><p class="small muted" style="margin-top:8px">Total: Rp${iuranTotal(s.iuran).toLocaleString("id-ID")} per bulan</p></div>
  <div class="card"><div class="row"><h3>Penomoran surat</h3><span><button class="btn sm" id="ttdBtn">Tanda tangan</button> <button class="btn sm" data-set="surat">Ubah</button></span></div><p class="mono" style="margin-top:10px">${esc(s.nomorSuratBerikut)} / SP.${esc(s.namaRT.replace(" ",""))} / ${esc(s.rw.replace(/\D/g,""))} / ${ROM[new Date().getMonth()]} / ${new Date().getFullYear()}</p><p class="small muted">Nomor berikutnya, melanjutkan buku Surat Keluar (terakhir 357).</p></div>
  <div class="card"><div class="row"><h3>Tampilan</h3><button class="btn sm" data-set="tema">Ubah</button></div><dl class="kv" style="margin-top:10px"><dt>Warna</dt><dd><span class="sw" style="background:${esc((s.tema&&s.tema.preset==="Kustom"?s.tema.accent:(PRESET[(s.tema||{}).preset]||PRESET["Perunggu (bawaan)"]).accent))}"></span> ${esc((s.tema||{}).preset||"Perunggu (bawaan)")}</dd><dt>Ukuran huruf</dt><dd>${esc((s.tema||{}).fs||"Normal")}</dd></dl></div>
  <div class="card"><div class="row"><h3>Album foto</h3><button class="btn sm" data-set="album">Ubah</button></div><p class="small" style="margin-top:10px;overflow-wrap:anywhere">${albumOk(s.albumUrl)?esc(s.albumUrl):'<span class="muted">Belum diisi. Tempel tautan folder Google Drive.</span>'}</p></div>
  <div class="card" style="grid-column:1/-1"><div class="row"><h3>Template pesan pengingat</h3><button class="btn sm" data-set="tpl">Ubah</button></div>${s.tpl.map((t,i)=>`<details style="margin-top:8px"><summary class="small" style="cursor:pointer;font-weight:600">Pengingat ${i+1}</summary><div class="small" style="white-space:pre-wrap;margin-top:6px;background:var(--bg);padding:10px;border-radius:8px">${esc(t)}</div></details>`).join("")}<p class="hint" style="margin-top:8px">Kata kunci: {nama} {alamat} {bulan_tunggak} {total} {rincian}</p></div></div>`}
const iuranTotal=t=>String(t).split("\n").reduce((s,l)=>s+(parseInt(digits((l.split("=")[1]||"")))||0),0);

/* ---- detail KK ---- */
function openKK(id){
  const f=S.kel.find(x=>x.id===id);if(!f){closeM();return}
  const an=f.anggota||[];
  modal(`<div class="row"><div><h3>${esc(f.kepala)}</h3><p class="small muted">${esc(f.alamat||"Alamat belum tercatat")} · RT 09 / RW 01</p></div><button class="btn sm" id="mc">Tutup</button></div>
  ${f.aktif===false?`<div class="banner" style="margin-top:10px">KK nonaktif: ${esc(f.mutasi||"pindah / tidak tinggal lagi")}</div>`:""}
  <dl class="kv" style="margin:14px 0"><dt>No. KK</dt><dd class="mono">${mask(f.kk)}</dd><dt>NIK kepala</dt><dd class="mono">${mask(f.nikKepala)}</dd><dt>No. HP</dt><dd class="mono">${esc(f.hp||"-")}</dd><dt>Hunian</dt><dd>${esc(f.hunian||"-")}</dd><dt>Ikut giliran</dt><dd>${f.ikutGiliran===false?"Tidak":"Ya"}</dd>${f.catatan?`<dt>Catatan</dt><dd>${esc(f.catatan)}</dd>`:""}</dl>
  ${S.admin?`<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px"><button class="btn sm" id="eKK">Ubah data KK</button><button class="btn sm pri" id="aM">+ Tambah anggota</button>${f.aktif===false?`<button class="btn sm" id="reKK">Aktifkan kembali</button>`:`<button class="btn sm bad" id="offKK">Tandai pindah / nonaktif</button>`}</div>`:""}
  <div class="scroll"><table class="tbl"><thead><tr><th>Nama</th><th>Hubungan</th><th>NIK</th><th>Tgl lahir</th><th>Status</th>${S.admin?"<th></th>":""}</tr></thead><tbody>
  ${an.map((a,i)=>`<tr><td><b>${esc(a.nama)}</b><p class="small muted">${esc([a.pekerjaan,a.pendidikan].filter(Boolean).join(" · "))}</p></td><td>${esc(a.hub||"-")}</td><td class="mono">${mask(a.nik)}</td><td>${a.tglLahir?fmtTglS(a.tglLahir):"-"}</td><td><span class="pill ${(a.status||"Aktif")==="Aktif"?"p-good":"p-mute"}">${esc(a.status||"Aktif")}</span></td>${S.admin?`<td style="white-space:nowrap"><button class="btn sm" data-em="${i}">Ubah</button> <button class="btn sm bad" data-dm="${i}">Hapus</button></td>`:""}</tr>`).join("")}</tbody></table></div>
  ${(f.riwayat||[]).length?`<h3 style="margin:16px 0 6px;font-size:.95rem">Riwayat perubahan</h3><ul class="small muted" style="margin:0;padding-left:18px">${f.riwayat.slice(-6).reverse().map(r=>`<li>${fmtTglS(r.tgl)}: ${esc(r.ket)}</li>`).join("")}</ul>`:""}`,true);
  $("#mc").onclick=closeM;
  if(!S.admin)return;
  $("#eKK").onclick=()=>kkForm(f);
  $("#aM").onclick=()=>memberForm(f,null);
  document.querySelectorAll("[data-em]").forEach(b=>b.onclick=()=>memberForm(f,+b.dataset.em));
  document.querySelectorAll("[data-dm]").forEach(b=>b.onclick=()=>confirmM("Hapus "+an[+b.dataset.dm].nama+" dari KK ini? Jika orangnya pindah atau meninggal, lebih baik ubah statusnya agar riwayat tetap ada.",async()=>{const n=an.slice();const [x]=n.splice(+b.dataset.dm,1);await saveKK({...f,anggota:n},"Anggota dihapus: "+x.nama);openKK(f.id)},"Hapus"));
  const off=$("#offKK");if(off)off.onclick=()=>openForm({title:"Tandai KK nonaktif",fields:[{id:"alasan",label:"Alasan",type:"select",options:["Pindah keluar","Rumah dikosongkan","Meninggal dunia","Lainnya"]},{id:"tgl",label:"Tanggal",type:"date",value:iso(new Date()),half:true},{id:"ket",label:"Tujuan / keterangan",half:true}],save:async v=>{await saveKK({...f,aktif:false,mutasi:v.alasan+(v.ket?" - "+v.ket:"")+" ("+fmtTglS(v.tgl)+")"},"Dinonaktifkan: "+v.alasan);return{keep:true,after:openKK(f.id)}}});
  const re=$("#reKK");if(re)re.onclick=async()=>{await saveKK({...f,aktif:true,mutasi:""},"Diaktifkan kembali");openKK(f.id)};
}
async function saveKK(f,ket){const o={...f};delete o.id;o.riwayat=[...(f.riwayat||[]),...(ket?[{tgl:iso(new Date()),ket}]:[])];await put("keluarga/"+f.id,o);upsert(S.kel,{...o,id:f.id});render()}
function dupNik(nik,exceptKey){if(digits(nik).length<10)return null;const k=digits(nik).slice(-10);
  for(const f of S.kel)for(const [i,a] of (f.anggota||[]).entries()){if(f.id+":"+i===exceptKey)continue;if(digits(a.nik).slice(-10)===k)return f.kepala}return null}
function kkForm(f){
  const baru=!f;
  openForm({title:baru?"Tambah warga baru (keluarga)":"Ubah data KK",fields:[
   {id:"kepala",label:"Nama kepala keluarga",value:f?.kepala},{id:"nikKepala",label:"NIK kepala keluarga",value:f?.nikKepala,inputmode:"numeric",half:true,hint:"16 digit. Boleh dikosongkan dulu."},{id:"kk",label:"No. Kartu Keluarga",value:f?.kk,inputmode:"numeric",half:true,hint:"16 digit"},
   {id:"alamat",label:"Alamat",value:f?.alamat,list:"alamatList",half:true,ph:"Hidup Baru III / 22"},{id:"hp",label:"No. HP / WhatsApp",value:f?.hp,inputmode:"tel",half:true},
   {id:"hunian",label:"Status hunian",type:"select",options:["Tetap","Kontrak","Numpang"],value:f?.hunian||"Tetap",half:true},{id:"ikutGiliran",label:"Ikut giliran tuan rumah pertemuan",type:"check",value:f?f.ikutGiliran!==false:true},
   {id:"catatan",label:"Catatan",value:f?.catatan}],
   save:async v=>{if(!v.kepala)return{error:"Nama kepala keluarga wajib diisi."};
    for(const k of ["nikKepala","kk"])if(v[k]&&(digits(v[k]).length<10||digits(v[k]).length>16))return{error:(k==="kk"?"No. KK":"NIK")+" harus 10 sampai 16 digit angka."};
    const d=dupNik(v.nikKepala,f?f.id+":"+(f.anggota||[]).findIndex(a=>a.hub==="KK"):"");if(d&&baru)return{error:"NIK ini sudah terdaftar atas nama keluarga "+d+"."};
    const base={...(f||{aktif:true,anggota:[{nama:v.kepala,nik:digits(v.nikKepala),hub:"KK",status:"Aktif"}],riwayat:[]}),kepala:v.kepala,nikKepala:digits(v.nikKepala),kk:digits(v.kk),alamat:v.alamat,hp:digits(v.hp),hunian:v.hunian,ikutGiliran:v.ikutGiliran,catatan:v.catatan};
    if(f){base.anggota=(f.anggota||[]).map(a=>a.hub==="KK"?{...a,nama:v.kepala,nik:digits(v.nikKepala)||a.nik}:a)}
    base.id=f?f.id:(digits(v.kk)||"kk-"+Date.now());
    if(baru&&S.kel.some(x=>x.id===base.id))return{error:"No. KK ini sudah ada."};
    await saveKK(base,baru?"Warga baru terdaftar":"Data KK diubah");toast(baru?"Warga baru tersimpan":"Perubahan tersimpan");openKK(base.id);return{keep:true}}})}
function memberForm(f,idx){
  const a=idx==null?{}:f.anggota[idx];
  openForm({title:idx==null?"Tambah anggota keluarga":"Ubah anggota",wide:true,fields:[
   {id:"nama",label:"Nama lengkap",value:a.nama},{id:"nik",label:"NIK",value:a.nik,inputmode:"numeric",half:true},{id:"hub",label:"Hubungan dalam keluarga",type:"select",options:HUB,value:a.hub||"Anak",half:true},
   {id:"jk",label:"Jenis kelamin",type:"select",options:["L","P"],value:a.jk||"L",half:true},{id:"tglLahir",label:"Tanggal lahir",type:"date",value:a.tglLahir,half:true},
   {id:"tempatLahir",label:"Tempat lahir",value:a.tempatLahir,half:true},{id:"agama",label:"Agama",type:"select",options:AGAMA,value:a.agama||"Islam",half:true},
   {id:"statusKawin",label:"Status perkawinan",type:"select",options:KAWIN,value:a.statusKawin||"Belum Menikah",half:true},{id:"pendidikan",label:"Pendidikan",value:a.pendidikan,half:true},
   {id:"pekerjaan",label:"Pekerjaan",value:a.pekerjaan,half:true},{id:"status",label:"Status warga",type:"select",options:["Aktif","Pindah","Meninggal"],value:a.status||"Aktif",half:true}],
   save:async v=>{if(!v.nama)return{error:"Nama wajib diisi."};if(v.nik&&(digits(v.nik).length<10||digits(v.nik).length>16))return{error:"NIK harus 10 sampai 16 digit angka."};
    const d=dupNik(v.nik,f.id+":"+idx);if(d)return{error:"NIK ini sudah terdaftar di keluarga "+d+"."};
    const m={...a,...v,nik:digits(v.nik)};const n=(f.anggota||[]).slice();idx==null?n.push(m):n[idx]=m;
    await saveKK({...f,anggota:n},(idx==null?"Anggota ditambahkan: ":"Anggota diubah: ")+v.nama+(v.status!=="Aktif"?" ("+v.status+")":""));toast("Tersimpan");openKK(f.id);return{keep:true}}})}

/* ---- kegiatan, pertemuan, pengaturan ---- */
function evForm(e,tipe){
  const isN=(e?.tipe||tipe)==="notulen";
  openForm({title:e?"Ubah "+e.tipe:isN?"Notulen rapat baru":"Berita / kegiatan baru",wide:true,fields:[
   {id:"tipe",label:"Jenis",type:"select",options:["berita","kegiatan","notulen"],value:e?.tipe||tipe||"berita",half:true},{id:"tanggal",label:"Tanggal",type:"date",value:e?.tanggal||iso(new Date()),half:true},
   {id:"judul",label:"Judul",value:e?.judul},{id:"ringkasan",label:"Ringkasan singkat",value:e?.ringkasan},{id:"isi",label:"Uraian lengkap",type:"textarea",rows:5,value:e?.isi},
   {id:"tuanRumah",label:"Tempat / tuan rumah",value:e?.tuanRumah,showIf:["tipe","notulen"],half:true},{id:"hadir",label:"Jumlah hadir",value:e?.hadir,inputmode:"numeric",showIf:["tipe","notulen"],half:true},
   {id:"agenda",label:"Agenda",type:"textarea",rows:3,value:e?.agenda,showIf:["tipe","notulen"]},{id:"keputusan",label:"Keputusan / hasil pembahasan",type:"textarea",rows:4,value:e?.keputusan,showIf:["tipe","notulen"]},{id:"tindakLanjut",label:"Tindak lanjut (siapa, kapan)",type:"textarea",rows:3,value:e?.tindakLanjut,showIf:["tipe","notulen"]},
   {id:"sumber",label:"Sumber / catatan",value:e?.sumber}],
   save:async v=>{if(!v.judul||!v.tanggal)return{error:"Judul dan tanggal wajib diisi."};const id=e?.id||"ev-"+Date.now();const o={...v};await put("kegiatan/"+id,o);upsert(S.keg,{...o,id});render();toast("Tersimpan")}})}
function pertForm(p){
  const nm=nextMeeting(new Date()),nh=nextHost(),hs=hosts().slice(),lab=h=>h.kepala+" - "+h.alamat;
  if(p&&p.tuanRumahId&&!hs.some(h=>h.id===p.tuanRumahId)){const o=S.kel.find(f=>f.id===p.tuanRumahId);if(o)hs.push(o)}
  const opts=hs.map(lab),ST=[["terjadwal","Terjadwal"],["selesai","Selesai"],["batal","Batal"]],cur=p&&hs.find(h=>h.id===p.tuanRumahId);
  openForm({title:p?"Ubah pertemuan":"Jadwalkan pertemuan",fields:[{id:"tanggal",label:"Tanggal",type:"date",value:p?p.tanggal:iso(nm),half:true},{id:"status",label:"Status",type:"select",options:ST.map(x=>x[1]),value:p?ST.find(x=>x[0]===p.status)[1]:"Terjadwal",half:true},{id:"tuan",label:"Tuan rumah",type:"select",options:opts.length?opts:["(belum ada data)"],value:cur?lab(cur):(!p&&nh?lab(nh):(opts[0]||"")) },{id:"catatan",label:"Catatan",value:p?.catatan,ph:"Contoh: bahas kerja bakti"}],
   save:async v=>{const h=hs.find(x=>lab(x)===v.tuan),id=p?p.id:"p-"+Date.now(),st=ST.find(x=>x[1]===v.status)[0];if(!v.tanggal)return{error:"Tanggal wajib diisi."};
    const o={...(p||{}),tanggal:v.tanggal,tuanRumahId:h?h.id:(p?.tuanRumahId||""),tuanRumahNama:h?h.kepala:(p?.tuanRumahNama||""),alamat:h?h.alamat:(p?.alamat||""),status:st,catatan:v.catatan};delete o.id;await put("pertemuan/"+id,o);upsert(S.pert,{...o,id});render();toast(p?"Pertemuan diperbarui":"Pertemuan dijadwalkan")}})}
async function giliranSimpan(ids){const n={...S.set,giliranUrut:ids};await put("pengaturan/rt",n);S.set=n;render()}
function giliranTambah(){
  const hs=hosts(),adr=new Set(hs.map(h=>h.alamat)),cand=S.kel.filter(f=>f.aktif!==false&&f.alamat&&!adr.has(f.alamat)).sort(byAlamat);
  if(!cand.length){toast("Semua rumah beralamat sudah ada dalam giliran");return}
  const lb=cand.map(f=>f.kepala+" - "+f.alamat+" ("+(f.hunian||"-")+(f.ikutGiliran===false?", dikeluarkan":"")+")");
  openForm({title:"Tambah tuan rumah",fields:[{id:"kk",label:"Keluarga",type:"select",options:lb,value:lb[0],hint:"Ditempatkan di urutan paling akhir. Urutan bisa digeser sesudahnya."}],
   save:async v=>{const f=cand[lb.indexOf(v.kk)];if(adr.has(f.alamat))return{error:"Rumah di alamat ini sudah ada dalam giliran (satu rumah dihitung satu giliran)."};
    const o={...f,ikutGiliran:true};delete o.id;await put("keluarga/"+f.id,o);upsert(S.kel,{...o,id:f.id});
    const ids=hosts().map(h=>h.id).filter(i=>i!==f.id).concat(f.id);const n={...S.set,giliranUrut:ids};await put("pengaturan/rt",n);S.set=n;render();toast(f.kepala+" masuk giliran")}})}
async function giliranSkip(id,ikut){const f=S.kel.find(x=>x.id===id);if(!f)return;const o={...f,ikutGiliran:ikut};delete o.id;await put("keluarga/"+id,o);upsert(S.kel,{...o,id});render()}
function setForm(kind){
  const s=S.set,j=s.jadwal;
  const cfg={
   id:{title:"Identitas & pengurus",fields:[{id:"namaRT",label:"RT",value:s.namaRT,half:true},{id:"rw",label:"RW",value:s.rw,half:true},{id:"kelurahan",label:"Kelurahan",value:s.kelurahan,half:true},{id:"kota",label:"Kota",value:s.kota,half:true},{id:"kodepos",label:"Kode pos",value:s.kodepos,half:true},{id:"kecamatan",label:"Kecamatan",value:s.kecamatan,half:true},{id:"komplek",label:"Nama kompleks (kop surat)",value:s.komplek},{id:"ketuaRW",label:"Ketua RW (untuk tanda tangan surat; orang berbeda dari Bendahara RT)",value:s.ketuaRW},{id:"ketua",label:"Ketua RT",value:s.ketua},{id:"sekretaris",label:"Sekretaris",value:s.sekretaris},{id:"bendahara",label:"Bendahara",value:s.bendahara}],to:v=>v},
   jadwal:{title:"Jadwal pertemuan rutin",fields:[{id:"hari",label:"Hari",type:"select",options:HARI,value:j.hari,half:true},{id:"pekan",label:"Pekan ke-",type:"select",options:["1","2","3","4","5"],value:String(j.pekan),half:true},{id:"jam",label:"Jam",value:j.jam,half:true}],to:v=>({jadwal:{hari:v.hari,pekan:+v.pekan,jam:v.jam}})},
   iuran:{title:"Iuran bulanan",fields:[{id:"iuran",label:"Komponen iuran",type:"textarea",rows:6,value:s.iuran,hint:"Satu baris per komponen, format: Nama = nominal"}],to:v=>v},
   surat:{title:"Penomoran surat",fields:[{id:"nomorSuratBerikut",label:"Nomor surat berikutnya",value:s.nomorSuratBerikut,inputmode:"numeric"},{id:"kodeSurat",label:"Kode surat",value:s.kodeSurat,half:true},{id:"kodeRW",label:"Kode RW",value:s.kodeRW,half:true}],to:v=>({nomorSuratBerikut:+digits(v.nomorSuratBerikut)||s.nomorSuratBerikut,kodeSurat:v.kodeSurat||s.kodeSurat,kodeRW:v.kodeRW||s.kodeRW})},
   tpl:{title:"Template pesan pengingat",fields:[0,1,2].map(i=>({id:"t"+i,label:"Pengingat "+(i+1),type:"textarea",rows:7,value:s.tpl[i]})).concat([{id:"_h",label:"",type:"select",options:["Kata kunci: {sapaan} {alamat} {jenis} {bulan_tunggak} {total} {rincian}"]}]),to:v=>({tpl:[v.t0,v.t1,v.t2]})},
   tema:{title:"Tampilan",fields:[{id:"preset",label:"Warna dasar",type:"select",options:Object.keys(PRESET),value:(s.tema||{}).preset||"Perunggu (bawaan)"},{id:"accent",label:"Warna aksen (untuk Kustom)",type:"color",value:(s.tema||{}).accent||"#6b4a1f",half:true},{id:"bg",label:"Warna latar (untuk Kustom)",type:"color",value:(s.tema||{}).bg||"#f1efec",half:true},{id:"fs",label:"Ukuran huruf",type:"select",options:["Kecil","Normal","Besar"],value:(s.tema||{}).fs||"Normal"}],to:v=>({tema:{preset:v.preset,accent:v.accent,bg:v.bg,fs:v.fs}})},
   album:{title:"Tautan album foto",fields:[{id:"albumUrl",label:"Tautan folder Google Drive",value:albumU(),ph:"https://drive.google.com/drive/folders/...",hint:"Album hanya tampil di Area Warga setelah login (tidak di halaman depan). Atur berbagi folder menjadi 'Siapa saja yang memiliki link'. Kosongkan untuk menghapus."}],to:v=>{if(v.albumUrl&&!albumOk(v.albumUrl))throw new Error("Tautan harus diawali https://");S.albumU=v.albumUrl||"";put("rahasia/album",{url:S.albumU}).catch(e=>toast("Gagal menyimpan album: "+e.message));return {albumUrl:""}}}}[kind];
  openForm({title:cfg.title,fields:cfg.fields,wide:kind==="tpl",save:async v=>{if(kind==="id"&&(!v.namaRT||!v.ketua))return{error:"RT dan nama Ketua wajib diisi."};const n={...S.set,...cfg.to(v)};await put("pengaturan/rt",n);S.set=n;render();toast("Pengaturan tersimpan")}})}

/* ===================== TAHAP 3 & 4 ===================== */
Object.assign(S,{surat:[],kas:[],piu:[],rem:[],sos:[],qur:null,ver:[],ttd:null,kTab:"kas",sTab:"qurban",sSub:"semua",izinKirim:false,owner:false,dl:null});
const rp=n=>"Rp"+Number(n||0).toLocaleString("id-ID");
const BLNN=["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
const perLabel=p=>{const [y,m]=String(p).split("-");return (BLNN[+m-1]||"")+" "+y};
const rtNum=()=>digits(S.set.namaRT)||"09",rwNum=()=>digits(S.set.rw)||"01";
const fmtNik=v=>{const d=digits(v);return d.length===16?d.slice(0,6)+" "+d.slice(6,12)+" "+d.slice(12):d};
const tglPanjang=s=>s?new Date(s+"T00:00:00").toLocaleDateString("id-ID",{day:"numeric",month:"long",year:"numeric"}):"";
const JENIS=[["Surat Keterangan (umum)","ket",""],["Surat Keterangan Domisili","dom",""],["Pengantar KTP","ket","Mengurus KTP"],["Pengantar Kartu Keluarga","ket","Mengurus Kartu Keluarga"],["Pengantar SKCK","ket","Membuat SKCK"],["Keterangan Usaha","ket","Surat Keterangan Usaha"],["Keterangan Tidak Mampu","ket","Keterangan tidak mampu (SKTM)"],["Pengantar Akta Kelahiran","ket","Mengurus akta kelahiran"],["Keterangan Meninggal Dunia","ket","Mengurus keterangan / akta kematian"],["Pengantar Numpang Nikah","ket","Mengurus pernikahan"],["Surat Pindah Alamat","ket","Pindah alamat"],["Keterangan Kehilangan","ket","Laporan kehilangan"],["Keterangan Ahli Waris","ket","Mengurus hak ahli waris"],["Keterangan Penghasilan","ket","Keterangan penghasilan"]];
const SUB=(a,b)=>a.localeCompare(b,"id",{numeric:true});

/* ---------- surat ---------- */
function people(){const o=[],seen={};S.kel.filter(f=>f.aktif!==false).sort(byAlamat).forEach(f=>(f.anggota||[]).forEach(a=>{if((a.status||"Aktif")!=="Aktif")return;let l=a.nama+" - "+(f.alamat||f.kepala)+(a.hub&&a.hub!=="KK"?" ("+a.hub+")":"");seen[l]=(seen[l]||0)+1;if(seen[l]>1)l+=" #"+seen[l];o.push({label:l,f,a})}));return o}
function ttlOf(a){return [a.tempatLahir,a.tglLahir?tglPanjang(a.tglLahir):""].filter(Boolean).join(", ")}
function kopLines(){const s=S.set;return ["RUKUN TETANGGA "+rtNum()+", RUKUN WARGA "+rwNum(),s.komplek||"","KEL. "+s.kelurahan.toUpperCase()+" - KEC. "+(s.kecamatan||"Pinang").toUpperCase(),s.kota.toUpperCase()+". "+s.kodepos].filter(Boolean)}
function suratBody(x){
  const s=S.set,alamatFull="Jl. "+x.alamat+", RT "+rtNum()+" / "+rwNum()+", Kel. "+s.kelurahan+", Kec. "+(s.kecamatan||"Pinang")+", "+s.kota;
  const rows=[["Nama",x.nama],["Tempat, tgl lahir",x.ttl||"-"],["Kewarganegaraan","Indonesia"],["Agama",x.agama||"-"],["Jenis Kelamin",x.jk||"-"],["Status",x.statusKawin||"-"],["No NIK",fmtNik(x.nik)||"-"],["No. KK",fmtNik(x.kk)||"-"]];
  const intro="Yang bertanda tangan di bawah ini, Ketua RT "+rtNum()+" / "+rwNum()+", Kelurahan "+s.kelurahan+", Kec. "+(s.kecamatan||"Pinang")+", "+s.kota+", menerangkan bahwa:";
  let mid,outro,judul="SURAT KETERANGAN";
  if(x.layout==="dom"){judul="SURAT KETERANGAN DOMISILI";if(x.alamatAsal)rows.push(["Alamat asal",x.alamatAsal]);
    mid="Bahwa yang namanya tersebut di atas benar berdomisili di wilayah kami, tinggal"+(x.hunian==="Kontrak"?" dan mengontrak":"")+" di alamat:\n"+alamatFull+".\nDan surat keterangan domisili ini untuk keperluan: "+(x.keperluan||"-")+".\nSurat keterangan domisili ini berlaku selama yang bersangkutan bertempat tinggal di wilayah kami. Apabila yang bersangkutan pindah alamat agar melapor kepada pengurus RT.";
    outro="Demikian Surat Keterangan Domisili ini kami buat agar dapat dipergunakan sebagaimana mestinya."}
  else{rows.push(["Alamat",alamatFull],["Keperluan",x.keperluan||"-"]);mid="Yang bersangkutan adalah benar tercatat sebagai warga kami yang bertempat tinggal pada alamat tersebut di atas.";outro="Demikian Surat Keterangan ini kami buat dengan sebenarnya, untuk dapat dipergunakan sebagaimana mestinya."}
  return {judul,intro,rows,mid,outro,tgl:"Tangerang, "+tglPanjang(x.tanggal)}
}
function paperHtml(x){
  const b=suratBody(x),terbit=x.status==="terbit",k=kopLines();
  return `<div class="paper"><div class="kop"><img src="${LOGO}" alt=""><div>${k.map((l,i)=>`<div class="${i===0?"k1":""}">${esc(l)}</div>`).join("")}</div></div>
  <h4>${b.judul}</h4><div class="nom">Nomor : ${terbit?esc(x.nomor):"<i>(diberi nomor saat disetujui)</i>"}</div>
  <p>${esc(b.intro)}</p><table class="pt">${b.rows.map(r=>`<tr><td>${esc(r[0])}</td><td>: ${esc(r[1])}</td></tr>`).join("")}</table>
  <p style="white-space:pre-wrap">${esc(b.mid)}</p><p>${esc(b.outro)}</p>
  <div class="sig"><div></div><div>${esc(b.tgl)}</div></div>
  <div class="sig2"><div><div>Mengetahui,</div><div>KETUA RW. ${rwNum()}</div><div class="sp"></div><div><b>${esc(S.set.ketuaRW||"(nama Ketua RW belum diisi)")}</b></div></div>
  <div><div>&nbsp;</div><div>KETUA RT. ${rtNum()}</div><div class="sp">${terbit&&S.ttd?`<img src="${S.ttd.data}" alt="Tanda tangan" style="height:54px">`:""}</div><div><b>${esc(S.set.ketua)}</b></div></div></div>
  ${terbit?"":`<div class="draft">DRAF</div>`}</div>`}
function pdfSurat(x){
  const J=window.jspdf&&window.jspdf.jsPDF;if(!J)throw new Error("Pustaka PDF belum termuat. Periksa koneksi internet lalu coba lagi.");
  const d=new J({unit:"mm",format:"a4"}),b=suratBody(x),k=kopLines(),L=22,R=188;let y=14;
  try{d.addImage(LOGO,"PNG",L,y-3,24,24)}catch(e){}
  d.setFont("times","bold");d.setFontSize(12.5);const cx=(L+24+R)/2+2;
  k.forEach((l,i)=>{d.setFont("times",i===0?"bold":"normal");d.setFontSize(i===0?13:10.5);d.text(l,cx,y+i*5,{align:"center"})});
  y=38;d.setLineWidth(.9);d.line(L,y,R,y);d.setLineWidth(.25);d.line(L,y+1.3,R,y+1.3);
  y=49;d.setFont("times","bold");d.setFontSize(13);d.text(b.judul,105,y,{align:"center"});const w=d.getTextWidth(b.judul);d.setLineWidth(.4);d.line(105-w/2,y+1,105+w/2,y+1);
  y+=6;d.setFont("times","normal");d.setFontSize(11.5);d.text("Nomor : "+(x.status==="terbit"?x.nomor:"(draf, belum bernomor)"),105,y,{align:"center"});
  y+=9;d.setFontSize(11.5);let t=d.splitTextToSize(b.intro,R-L);d.text(t,L,y);y+=t.length*5.4+3;
  b.rows.forEach(r=>{const v=d.splitTextToSize(String(r[1]),R-L-50);d.text(r[0],L+4,y);d.text(":",L+42,y);d.text(v,L+46,y);y+=v.length*5.4+0.6});
  y+=3;t=d.splitTextToSize(b.mid,R-L);d.text(t,L,y);y+=t.length*5.4+3;t=d.splitTextToSize(b.outro,R-L);d.text(t,L,y);y+=t.length*5.4+9;
  if(y>230){d.addPage();y=25}
  d.text(b.tgl,R-62,y);y+=6;d.text("Mengetahui,",L+8,y);y+=5;d.text("KETUA RW. "+rwNum(),L+8,y);d.text("KETUA RT. "+rtNum(),R-62,y);
  if(x.status==="terbit"&&S.ttd){try{const h=18,wd=Math.min(40,h*(S.ttd.ratio||2));d.addImage(S.ttd.data,"PNG",R-62,y+1,wd,h)}catch(e){}}
  y+=26;d.setFont("times","bold");d.text(S.set.ketuaRW||"(nama Ketua RW)",L+8,y);d.text(S.set.ketua,R-62,y);
  if(x.status!=="terbit"){d.setTextColor(200,60,50);d.setFontSize(48);d.text("DRAF",105,150,{align:"center",angle:30});d.setTextColor(0)}
  return d.output("blob")}
async function unduhPdf(x){try{const blob=pdfSurat(x);if(!S.dl){toast("Fitur unduh tidak tersedia di tampilan ini");return}await S.dl.save({filename:"Surat-"+(x.no||"draf")+"-"+x.nama.replace(/[^A-Za-z0-9]+/g,"-")+".pdf",data:blob});toast("PDF disimpan")}catch(e){if(e&&e.code==="declined")return;toast(e.message||"Gagal membuat PDF")}}
function suratDoc(v,p,j,old){return {tanggal:v.tanggal,jenis:v.jenis,layout:j[1],status:old?.status||"menunggu",kkId:p.f.id,nama:p.a.nama,ttl:ttlOf(p.a),agama:p.a.agama||"",jk:p.a.jk==="P"?"Wanita":p.a.jk==="L"?"Pria":"",statusKawin:p.a.statusKawin||"",nik:digits(p.a.nik||(p.a.hub==="KK"?p.f.nikKepala:"")),kk:digits(p.f.kk),alamat:p.f.alamat||"",hunian:p.f.hunian||"",keperluan:v.keperluan||j[2],alamatAsal:v.alamatAsal||"",catatan:v.catatan||"",tglBuat:old?.tglBuat||iso(new Date()),no:old?.no||null,nomor:old?.nomor||"",tglSetuju:old?.tglSetuju||"",disetujuOleh:old?.disetujuOleh||""}}
function suratForm(x){
  const pp=people(),lb=pp.map(p=>p.label);if(!pp.length){toast("Belum ada data warga");return}
  const cur=x?pp.findIndex(p=>p.f.id===x.kkId&&p.a.nama===x.nama):-1;
  openForm({title:x?"Ubah surat":"Surat baru",wide:true,fields:[
   {id:"orang",label:"Pemohon",type:"select",options:lb,value:cur>=0?lb[cur]:lb[0]},{id:"jenis",label:"Jenis surat",type:"select",options:JENIS.map(j=>j[0]),value:x?.jenis||JENIS[0][0],half:true},{id:"tanggal",label:"Tanggal surat",type:"date",value:x?.tanggal||iso(new Date()),half:true},
   {id:"keperluan",label:"Keperluan",type:"textarea",rows:2,value:x?.keperluan,hint:"Kosongkan untuk memakai isian bawaan jenis surat."},{id:"alamatAsal",label:"Alamat asal (khusus domisili)",value:x?.alamatAsal,showIf:["jenis","Surat Keterangan Domisili"]},{id:"catatan",label:"Catatan internal (tidak dicetak)",value:x?.catatan}],
   save:async v=>{const p=pp[lb.indexOf(v.orang)],j=JENIS.find(a=>a[0]===v.jenis);if(!p.f.alamat)return{error:"Alamat keluarga ini belum diisi. Lengkapi di Data warga dulu."};
    const id=x?.id||"s-"+Date.now(),o=suratDoc(v,p,j,x);await put("surat/"+id,o);upsert(S.surat,{...o,id});render();toast("Surat tersimpan, menunggu persetujuan Ketua RT")}})}
async function terbitkan(x){
  const no=+S.set.nomorSuratBerikut||358,t=new Date(x.tanggal+"T00:00:00");
  const nomor=no+" / "+S.set.kodeSurat+" / "+S.set.kodeRW+" / "+ROM[t.getMonth()]+" / "+t.getFullYear();
  const n={...S.set,nomorSuratBerikut:no+1};await put("pengaturan/rt",n);S.set=n;
  const o={...x,no,nomor,status:"terbit",tglSetuju:iso(new Date()),disetujuOleh:S.set.ketua};delete o.id;await put("surat/"+x.id,o);upsert(S.surat,{...o,id:x.id});render();return {...o,id:x.id}}
function openSurat(id){const x=S.surat.find(s=>s.id===id);if(!x)return;
  modal(`<div class="row"><h3>${esc(x.jenis)}</h3><button class="btn sm" id="mc">Tutup</button></div><div style="margin:12px 0" class="scroll">${paperHtml(x)}</div>
  <div class="mact" style="justify-content:space-between"><span class="pill ${x.status==="terbit"?"p-good":x.status==="ditolak"?"p-bad":"p-warn"}">${x.status==="terbit"?"Terbit":x.status==="ditolak"?"Ditolak":"Menunggu persetujuan Ketua RT"}</span>
  <span style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn sm" id="pdf">Unduh PDF</button>${x.status==="menunggu"?`<button class="btn sm" id="eS">Ubah</button><button class="btn sm bad" id="nS">Tolak</button>${S.owner?`<button class="btn sm pri" id="aS">Setujui & beri nomor</button>`:`<span class="hint">Persetujuan oleh Ketua RT</span>`}`:""}${x.status!=="terbit"?`<button class="btn sm bad" id="dS">Hapus</button>`:""}</span></div>`,true);
  $("#mc").onclick=closeM;$("#pdf").onclick=()=>unduhPdf(x);
  const e=$("#eS");if(e)e.onclick=()=>suratForm(x);
  const a=$("#aS");if(a)a.onclick=async()=>{a.disabled=true;try{const n=await terbitkan(x);openSurat(n.id);toast("Surat terbit, nomor "+n.nomor)}catch(er){toast(er.message);a.disabled=false}};
  const n=$("#nS");if(n)n.onclick=async()=>{const o={...x,status:"ditolak"};delete o.id;try{await put("surat/"+x.id,o);upsert(S.surat,{...o,id:x.id});render();openSurat(x.id)}catch(er){toast(er.message)}};
  const d=$("#dS");if(d)d.onclick=()=>confirmM("Hapus surat ini?",async()=>{await del("surat/"+x.id);S.surat=S.surat.filter(s=>s.id!==x.id);render()},"Hapus")}
function vSurat(){
  const l=S.surat.slice().sort((a,b)=>(b.tanggal+b.tglBuat).localeCompare(a.tanggal+a.tglBuat)),q=S.q.toLowerCase();
  const list=l.filter(x=>!q||(x.nama+" "+x.jenis+" "+(x.nomor||"")+" "+x.keperluan).toLowerCase().includes(q)),mn=l.filter(x=>x.status==="menunggu").length;
  return `<div class="row" style="margin-bottom:12px"><div><h2>Surat pengantar & keterangan</h2><p class="muted small">Nomor berikutnya: <span class="mono">${esc(S.set.nomorSuratBerikut)} / ${esc(S.set.kodeSurat)} / ${esc(S.set.kodeRW)} / ${ROM[new Date().getMonth()]} / ${new Date().getFullYear()}</span></p></div><button class="btn pri" id="addSurat">+ Surat baru</button></div>
  ${mn?`<div class="banner">${mn} surat menunggu persetujuan Ketua RT${S.owner?".":". Hanya akun Ketua RT yang dapat menyetujui."}</div>`:""}
  <div class="tools"><input id="qs" type="search" placeholder="Cari nama, jenis, atau nomor surat" value="${esc(S.q)}" aria-label="Cari surat"></div>
  <div class="card scroll" style="padding:6px">${list.length?`<table class="tbl"><thead><tr><th>Tanggal</th><th>Nomor</th><th>Pemohon</th><th>Jenis</th><th>Status</th></tr></thead><tbody>${list.map(x=>`<tr class="click" tabindex="0" data-surat="${esc(x.id)}"><td>${fmtTglS(x.tanggal)}</td><td class="mono">${esc(x.nomor||"-")}</td><td><b>${esc(x.nama)}</b></td><td>${esc(x.jenis)}</td><td><span class="pill ${x.status==="terbit"?"p-good":x.status==="ditolak"?"p-bad":"p-warn"}">${x.status==="terbit"?"Terbit":x.status==="ditolak"?"Ditolak":"Menunggu"}</span></td></tr>`).join("")}</tbody></table>`:`<div class="empty">Belum ada surat di sistem ini. Buku surat keluar sebelumnya (no. 186 sampai 357) belum diimpor; nomor berikutnya sudah melanjutkan dari 358.</div>`}</div>
  <p class="hint" style="margin-top:8px">PDF memakai kop dan logo RT, siap dicetak lalu ditandatangani dan dicap. Tanda tangan digital Ketua RT dapat diunggah di Pengaturan.</p>`}

/* ---------- keuangan ---------- */
const kasLbl=k=>k.sampai?fmtTglS(k.sampai):perLabel(k.periode);
const kasList=j=>S.kas.filter(k=>k.jenis===j).sort((a,b)=>b.periode.localeCompare(a.periode));
const piuList=j=>S.piu.filter(k=>k.jenis===j).sort((a,b)=>b.periode.localeCompare(a.periode));
const dataSementara=()=>S.kas.concat(S.piu).some(d=>d.sementara);
function vKeuangan(){
  const kr=kasList("kasRT")[0],ki=kasList("kasIbu")[0],pw=piuList("warga")[0],pi=piuList("ibu")[0],s=S.set,ib=s.iuranBaru||{};
  const tabs=[["kas","Kas Bapak-Bapak"],["ibu","Kas ibu-ibu"],["grafik","Grafik arus kas"],["piutang","Piutang"],["iuran","Status iuran"],["ver","Catatan verifikasi"]];
  return `<div class="row" style="margin-bottom:10px"><div><h2>Keuangan</h2><p class="muted small">Iuran bulanan ${rp(iuranTotal(s.iuran))}${ib.total?`, menjadi ${rp(ib.total)} mulai ${perLabel(ib.mulai)}`:""}</p></div>${S.admin?`<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" id="addKas">+ Laporan kas bulan baru</button><button class="btn" id="addPiu">+ Perbarui piutang</button></div>`:""}</div>
  ${dataSementara()?`<div class="banner"><b>Data sementara.</b> Kas Bapak-Bapak tercatat sampai ${kr?kasLbl(kr):"-"}, kas ibu-ibu sampai ${ki?kasLbl(ki):"-"}, piutang sampai ${pw?perLabel(pw.periode):"-"}. Perbarui dengan data terbaru dari bendahara sebelum dipakai untuk menagih.</div>`:""}
  <div class="grid g4" style="margin-bottom:14px"><div class="card stat"><b>${kr?rp(kr.saldoAkhir):"-"}</b><span>Saldo kas Bapak-Bapak${kr?" ("+kasLbl(kr)+")":""}</span></div><div class="card stat"><b>${ki?rp(ki.saldoAkhir):"-"}</b><span>Saldo kas ibu-ibu${ki?" ("+kasLbl(ki)+")":""}</span></div><div class="card stat"><b>${pw?rp(pw.total):"-"}</b><span>Piutang warga, ${pw?pw.items.length:0} KK</span></div><div class="card stat"><b>${pi?rp(pi.total):"-"}</b><span>Piutang ibu-ibu, ${pi?pi.items.length:0} orang</span></div></div>
  <div class="chips">${tabs.map(t=>`<button class="chipb" data-kt="${t[0]}" aria-pressed="${S.kTab===t[0]}">${t[1]}</button>`).join("")}</div>`+({kas:()=>kasView("kasRT"),ibu:()=>kasView("kasIbu"),grafik:()=>{S.cAnim=S.cAnim||!S._g;S._g=1;return grafikView()},piutang:piutangView,iuran:iuranView,ver:verView}[S.kTab])();
}
function kasView(j){
  const l=kasList(j);if(!l.length)return `<div class="card empty">Belum ada laporan kas.</div>`;
  const mx=Math.max(...l.map(k=>k.saldoAkhir||0));
  return `<div class="card" style="margin-bottom:14px"><h3 style="margin-bottom:10px">Saldo akhir per periode</h3><div class="grid" style="gap:8px">${l.slice().reverse().map(k=>`<div style="display:grid;grid-template-columns:110px 1fr 110px;gap:10px;align-items:center;font-size:.85rem"><span class="muted">${kasLbl(k)}</span><span style="background:var(--accent-soft);border-radius:4px;height:14px;display:block"><span style="display:block;height:100%;border-radius:4px;background:var(--accent);width:${mx?Math.round(k.saldoAkhir/mx*100):0}%"></span></span><b class="num" style="text-align:right">${rp(k.saldoAkhir)}</b></div>`).join("")}</div></div>
  <div class="grid">${l.map((k,ix)=>{const pv=l[ix+1],gap=pv&&pv.saldoAkhir!==k.saldoAwal?k.saldoAwal-pv.saldoAkhir:0;return `<details class="card"${k===l[0]?" open":""}><summary style="cursor:pointer;font-weight:600">${esc(k.judul)} ${k.sementara?'<span class="pill p-warn">sementara</span>':""}</summary>${gap?`<p class="small" style="margin-top:8px"><span class="pill p-warn">Perlu dicek</span> Saldo awal berbeda ${rp(Math.abs(gap))} dari saldo akhir laporan sebelumnya. Laporan periode di antaranya belum ada.</p>`:""}
   <dl class="kv" style="margin-top:12px;grid-template-columns:1fr auto"><dt>Saldo awal</dt><dd class="num">${rp(k.saldoAwal)}</dd><dt>Setoran wajib (${(k.setoranWajib||[]).length||"-"} setoran)</dt><dd class="num">${rp(k.totalWajib)}</dd><dt>Setoran piutang</dt><dd class="num">${rp(k.totalPiutang)}</dd>${(k.pemasukanLain||[]).map(p=>`<dt>Masuk: ${esc(p.ket)}</dt><dd class="num">+ ${rp(p.jumlah)}</dd>`).join("")}${(k.pengeluaran||[]).map(p=>`<dt>Keluar: ${esc(p.ket)}</dt><dd class="num">- ${rp(p.jumlah)}</dd>`).join("")}<dt><b>Saldo akhir</b></dt><dd class="num"><b>${rp(k.saldoAkhir)}</b></dd></dl>
   ${(k.setoranWajib||[]).length?`<details style="margin-top:10px"><summary class="small" style="cursor:pointer;color:var(--accent);font-weight:600">Daftar setoran</summary><div class="scroll"><table class="tbl"><tbody>${k.setoranWajib.map(s=>`<tr><td>${esc(s.nama)}</td><td class="num">${rp(s.jumlah)}</td><td class="small muted">${esc(s.ket||"")}</td></tr>`).join("")}${(k.setoranPiutang||[]).map(s=>`<tr><td>${esc(s.nama)} <span class="pill p-gold">piutang</span></td><td class="num">${rp(s.jumlah)}</td><td></td></tr>`).join("")}</tbody></table></div></details>`:""}</details>`}).join("")}</div>`;
}
function piutangView(){
  return ["warga","ibu"].map(j=>{const l=piuList(j),cur=l[0];if(!cur)return "";const prev=l[1];
    const lunas=prev?prev.items.filter(p=>!cur.items.some(c=>(c.kkId&&c.kkId===p.kkId)||c.nama===p.nama)):[];
    return `<div class="card" style="margin-bottom:14px"><div class="row"><h3>Piutang ${j==="warga"?"warga RT":"kas ibu-ibu"} ${cur.sementara?'<span class="pill p-warn">sementara</span>':""}</h3><span class="small muted">${perLabel(cur.periode)} · total <b class="num">${rp(cur.total)}</b></span></div>
    <div class="scroll"><table class="tbl"><thead><tr><th>Nama</th><th>Keluarga</th><th class="r">Jumlah</th><th>Perubahan</th><th>Keterangan</th></tr></thead><tbody>${cur.items.map((it,i)=>{const f=S.kel.find(x=>x.id===it.kkId);const pv=prev&&prev.items.find(p=>(it.kkId&&p.kkId===it.kkId)||p.nama===it.nama);const dlt=pv?it.jumlah-pv.jumlah:null;
     return `<tr><td><b>${esc(it.nama)}</b></td><td class="small">${f?esc(f.kepala):`<span class="pill p-warn">belum ditautkan</span>`} ${S.admin?`<button class="btn sm" data-link="${esc(cur.id)}|${i}">Tautkan</button>`:""}</td><td class="num" style="text-align:right">${rp(it.jumlah)}</td><td class="small">${dlt==null?'<span class="pill p-gold">baru</span>':dlt<0?`<span class="pill p-good">turun ${rp(-dlt)}</span>`:dlt>0?`<span class="pill p-bad">naik ${rp(dlt)}</span>`:`<span class="pill p-mute">tetap</span>`}</td><td class="small muted" style="min-width:220px">${esc(it.keterangan||"")}</td></tr>`}).join("")}</tbody></table></div>
    ${lunas.length?`<p class="small" style="margin-top:10px"><span class="pill p-good">Lunas sejak ${perLabel(prev.periode)}</span> ${lunas.map(x=>esc(x.nama)).join(", ")}</p>`:""}</div>`}).join("")||`<div class="card empty">Belum ada data piutang.</div>`;
}
function verView(){const it=(S.ver||[]);return `<div class="card"><h3>Catatan verifikasi data</h3><p class="small muted" style="margin:6px 0 10px">Hal yang ditemukan saat data diimpor dan perlu dicek bendahara.</p><ol style="margin:0;padding-left:20px;display:grid;gap:8px">${it.map(v=>`<li><b class="small">${esc(v.sumber)}</b><p class="small">${esc(v.ket)}</p></li>`).join("")||"<li>Tidak ada catatan.</li>"}</ol></div>`}
function parseLines(t){return String(t).split("\n").map(l=>l.trim()).filter(Boolean)}
function kasForm(){
  openForm({title:"Laporan kas bulan baru",wide:true,fields:[
   {id:"jenis",label:"Jenis kas",type:"select",options:["Kas Bapak-Bapak","Kas ibu-ibu"],half:true},{id:"periode",label:"Periode (bulan)",type:"month",value:iso(new Date()).slice(0,7),half:true},
   {id:"judul",label:"Judul laporan",ph:"Contoh: Kas RT 20 Jan - 20 Feb 2026"},{id:"setoran",label:"Setoran wajib (satu baris per orang)",type:"textarea",rows:5,ph:"Nama = jumlah = keterangan\nSutrisno = 30000 = Iuran Januari",hint:"Boleh dikosongkan bila hanya mengisi total di bawah."},
   {id:"totWajib",label:"Total setoran wajib (jika daftar kosong)",inputmode:"numeric",half:true},{id:"totPiutang",label:"Total setoran piutang",inputmode:"numeric",half:true},
   {id:"keluar",label:"Pengeluaran (satu baris per item)",type:"textarea",rows:3,ph:"Konsumsi pertemuan = 150000"},{id:"awal",label:"Saldo awal (kosong = saldo akhir laporan sebelumnya)",inputmode:"numeric"}],
   save:async v=>{const j=v.jenis.startsWith("Kas Bapak")?"kasRT":"kasIbu";if(!v.periode)return{error:"Periode wajib diisi."};
    const sw=parseLines(v.setoran).map(l=>{const p=l.split("=").map(x=>x.trim());return {nama:p[0],jumlah:parseInt(digits(p[1]))||0,ket:p[2]||""}}),kl=parseLines(v.keluar).map(l=>{const p=l.split("=").map(x=>x.trim());return {ket:p[0],jumlah:parseInt(digits(p[1]))||0}});
    const prev=kasList(j).find(k=>k.periode<v.periode),awal=v.awal!==""?parseInt(digits(v.awal))||0:(prev?prev.saldoAkhir:0),tw=sw.length?sw.reduce((s,x)=>s+x.jumlah,0):parseInt(digits(v.totWajib))||0,tp=parseInt(digits(v.totPiutang))||0,tk=kl.reduce((s,x)=>s+x.jumlah,0);
    const id=(j==="kasRT"?"kas-rt-":"kas-ibu-")+v.periode,o={jenis:j,periode:v.periode,judul:v.judul||(j==="kasRT"?"Kas Bapak-Bapak ":"Kas ibu-ibu ")+perLabel(v.periode),setoranWajib:sw,setoranPiutang:[],pengeluaran:kl,saldoAwal:awal,totalMasuk:tw+tp,totalKeluar:tk,saldoAkhir:awal+tw+tp-tk,totalWajib:tw,totalPiutang:tp,sementara:false};
    await put("kas/"+id,o);upsert(S.kas,{...o,id});S.kTab=j==="kasRT"?"kas":"ibu";render();toast("Laporan tersimpan. Saldo akhir "+rp(o.saldoAkhir))}})}
function matchKK(n){const t=toks(n.replace(/^ibu\s+/i,""));if(!t.size)return "";let best=null,bs=0;S.kel.forEach(f=>{const c=toks(f.kepala+" "+(f.anggota||[]).map(a=>a.nama).join(" "));let sc=0;t.forEach(w=>{if(c.has(w))sc++});if(sc>bs){bs=sc;best=f}});return bs>=1?best.id:""}
function toks(s){return new Set((String(s).toLowerCase().match(/[a-z]{3,}/g)||[]).filter(w=>!["ibu","bapak","bpk","hej","hery"].includes(w)))}
function piuForm(){
  openForm({title:"Perbarui piutang",wide:true,fields:[{id:"jenis",label:"Jenis",type:"select",options:["Piutang warga RT","Piutang kas ibu-ibu"],half:true},{id:"periode",label:"Per bulan",type:"month",value:iso(new Date()).slice(0,7),half:true},
   {id:"items",label:"Daftar piutang (satu baris per orang)",type:"textarea",rows:8,ph:"Nama | jumlah | keterangan\nEdy Maryanto | 90000 | Tunggakan s.d November Rp150.000, bayar Desember",hint:"Nama akan ditautkan otomatis ke data warga bila cocok; yang belum cocok bisa ditautkan manual."}],
   save:async v=>{const j=v.jenis.includes("warga")?"warga":"ibu";const items=parseLines(v.items).map(l=>{const p=l.split("|").map(x=>x.trim());return {nama:p[0],jumlah:parseInt(digits(p[1]))||0,keterangan:p[2]||"",kkId:matchKK(p[0])}}).filter(x=>x.nama&&x.jumlah>0);if(!items.length)return{error:"Isi minimal satu baris dengan jumlah lebih dari 0."};
    const o={jenis:j,periode:v.periode,judul:"Piutang "+(j==="warga"?"warga RT":"kas ibu-ibu")+" s.d "+perLabel(v.periode),items,total:items.reduce((s,x)=>s+x.jumlah,0),sementara:false},id="piutang-"+j+"-"+v.periode;
    await put("piutang/"+id,o);upsert(S.piu,{...o,id});S.kTab="piutang";render();toast("Piutang diperbarui: "+rp(o.total))}})}
function linkForm(ref){
  const [id,i]=ref.split("|"),d=S.piu.find(x=>x.id===id),it=d.items[+i],ks=S.kel.filter(f=>f.aktif!==false).sort(byAlamat),lb=ks.map(f=>f.kepala+" - "+(f.alamat||"alamat kosong")),cur=ks.findIndex(f=>f.id===it.kkId);
  openForm({title:"Tautkan "+it.nama+" ke keluarga",fields:[{id:"kk",label:"Keluarga",type:"select",options:lb,value:cur>=0?lb[cur]:lb[0]}],save:async v=>{const k=ks[lb.indexOf(v.kk)],items=d.items.map((x,n)=>n===+i?{...x,kkId:k.id}:x),o={...d,items};delete o.id;await put("piutang/"+id,o);upsert(S.piu,{...o,id});render();toast("Tertaut")}})}

/* ---------- pengingat ---------- */
function remQueue(){
  const out=[];["warga","ibu"].forEach(j=>{const cur=piuList(j)[0];if(!cur)return;cur.items.forEach(it=>{if(!(it.jumlah>0))return;const f=S.kel.find(x=>x.id===it.kkId),key=j+":"+(it.kkId||it.nama),logs=S.rem.filter(r=>r.key===key).sort((a,b)=>b.tgl.localeCompare(a.tgl)),last=logs[0],max=+S.set.reminderMaks||3,gap=+S.set.reminderHari||7;
    let tahap=1,status="siap",info="";if(last){const days=Math.floor((new Date(iso(new Date())+"T00:00:00")-new Date(last.tgl+"T00:00:00"))/864e5);tahap=Math.min(last.tahap+1,max);if(last.tahap>=max){status="selesai";info="Sudah "+max+" kali, tindak lanjut oleh pengurus"}else if(days<gap){status="tunggu";info="Tunggu "+(gap-days)+" hari lagi (terakhir "+fmtTglS(last.tgl)+")"}else info="Terakhir tahap "+last.tahap+", "+fmtTglS(last.tgl)}
    const sapaan=/^ibu\b/i.test(it.nama)?it.nama:"Bapak/Ibu "+it.nama.replace(/^bp\.?\s*/i,"");
    const msg=fill2(S.set.tpl[Math.min(tahap,3)-1]||S.set.tpl[0],{sapaan,nama:it.nama,alamat:f&&f.alamat?"Hb "+f.alamat.replace("Hidup Baru ",""):"-",jenis:j==="warga"?"warga":"kas ibu-ibu",bulan_tunggak:"s.d "+perLabel(cur.periode),total:rp(it.jumlah),rincian:(it.keterangan||"-").replace(/\s+/g," ")});
    out.push({key,j,it,f,tahap,status,info,msg,hp:f?digits(f.hp):"",per:cur.periode,sementara:cur.sementara})})});return out}
const fill2=(t,m)=>t.replace(/\{(\w+)\}/g,(x,k)=>m[k]!=null?m[k]:x);
function waLink(hp,msg){let n=digits(hp);if(!n)return "";if(n.startsWith("0"))n="62"+n.slice(1);return "https://wa.me/"+n+"?text="+encodeURIComponent(msg)}
function vReminder(){
  const q=remQueue(),ready=q.filter(x=>x.status==="siap").length,sem=q.some(x=>x.sementara);
  return `<div class="row" style="margin-bottom:10px"><div><h2>Pengingat pembayaran</h2><p class="muted small">Jadwal: pengingat 1, lalu tiap ${S.set.reminderHari||7} hari sampai tahap ${S.set.reminderMaks||3}. Isi pesan diambil dari template di Pengaturan.</p></div><button class="btn" id="copyAll" ${ready&&S.izinKirim?"":"disabled"}>Salin semua pesan siap kirim (${ready})</button></div>
  ${sem?`<div class="banner"><b>Data piutang masih sementara</b> (per ${q.length?perLabel(q[0].per):"-"}). Perbarui data di menu Keuangan lebih dulu agar warga tidak ditagih nominal yang sudah usang. Tombol kirim terkunci sampai Anda mencentang di bawah.</div>
  <label class="chk" style="margin-bottom:14px"><input type="checkbox" id="izin" ${S.izinKirim?"checked":""}> Saya sudah memeriksa bahwa nominal di bawah masih berlaku</label>`:""}
  <div class="grid">${q.map((x,i)=>{const ok=!sem||S.izinKirim,wa=waLink(x.hp,x.msg);return `<div class="card"><div class="row"><div><b>${esc(x.it.nama)}</b> <span class="pill ${x.j==="warga"?"p-gold":"p-mute"}">${x.j==="warga"?"warga RT":"kas ibu-ibu"}</span><p class="small muted">${x.f?esc(x.f.kepala)+" · "+esc(x.f.alamat||"-"):"Belum ditautkan ke keluarga"} · ${x.hp?esc(x.hp):"HP belum ada"}</p></div><div style="text-align:right"><b class="num">${rp(x.it.jumlah)}</b><p><span class="pill ${x.status==="siap"?"p-warn":x.status==="selesai"?"p-bad":"p-mute"}">${x.status==="siap"?"Siap tahap "+x.tahap:x.status==="selesai"?"Selesai":"Tahap "+x.tahap+" menunggu"}</span></p></div></div>
   ${x.info?`<p class="small muted" style="margin-top:6px">${esc(x.info)}</p>`:""}<details style="margin-top:8px"><summary class="small" style="cursor:pointer;color:var(--accent);font-weight:600">Lihat pesan</summary><div class="wa">${esc(x.msg)}</div></details>
   <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px"><button class="btn sm" data-rcopy="${i}">Salin pesan</button>${wa&&x.status==="siap"&&ok?`<a class="btn sm pri" style="text-decoration:none;display:inline-flex;align-items:center" target="_blank" rel="noopener" href="${wa}">Buka WhatsApp</a>`:`<button class="btn sm" disabled>${!x.hp?"HP belum ada":x.status!=="siap"?"Belum waktunya":"Terkunci"}</button>`}<button class="btn sm" data-rsent="${i}" ${x.status==="siap"&&ok?"":"disabled"}>Tandai terkirim</button></div></div>`}).join("")||`<div class="card empty">Tidak ada piutang yang perlu diingatkan.</div>`}</div>
  <h3 class="sect">Riwayat pengingat</h3><div class="card scroll" style="padding:6px">${S.rem.length?`<table class="tbl"><tbody>${S.rem.slice().sort((a,b)=>b.tgl.localeCompare(a.tgl)).slice(0,30).map(r=>`<tr><td>${fmtTglS(r.tgl)}</td><td>${esc(r.nama)}</td><td>Tahap ${r.tahap}</td><td class="small muted">${esc(r.via||"")}</td></tr>`).join("")}</tbody></table>`:`<div class="empty">Belum ada pengingat yang dicatat terkirim.</div>`}</div>
  <p class="hint" style="margin-top:8px">Pesan dikirim lewat WhatsApp oleh pengurus. Pengiriman otomatis tanpa klik memerlukan server tersendiri (disiapkan saat penayangan untuk warga).</p>`}

/* ---------- sosial & qurban ---------- */
const SOSKAT={yatim:"Anak yatim",dhuafa:"Dhuafa & mustahiq",wakaf:"Infaq & wakaf MBM",infaq:"Infaq & wakaf MBM"};
function vSosial(){
  const tabs=[["qurban","Qurban 2027"],["yatim","Anak yatim"],["dhuafa","Dhuafa & mustahiq"],["wakaf","Infaq & wakaf"]];
  return `<div class="row" style="margin-bottom:10px"><div><h2>Sosial & qurban</h2><p class="muted small">Pendataan penerima untuk qurban 2027. Data ini sensitif, hanya terlihat oleh pengurus.</p></div></div>
  <div class="chips">${tabs.map(t=>`<button class="chipb" data-st="${t[0]}" aria-pressed="${S.sTab===t[0]}">${t[1]}</button>`).join("")}</div>`+(S.sTab==="qurban"?qurbanView():sosList(S.sTab))}
function sosList(k){
  const l=S.sos.filter(x=>k==="wakaf"?(x.kategori==="wakaf"||x.kategori==="infaq"):x.kategori===k).sort((a,b)=>SUB(a.alamat||"~",b.alamat||"~")),kat=k==="wakaf"?"wakaf":k;
  return `<div class="row" style="margin-bottom:10px"><p class="muted small">${l.length} data</p><button class="btn pri sm" data-sadd="${kat}">+ Tambah</button></div><div class="card scroll" style="padding:6px"><table class="tbl"><thead><tr><th>Nama</th><th>Alamat</th><th>Keterangan</th><th></th></tr></thead><tbody>${l.map(x=>`<tr><td><b>${esc(x.nama)}</b>${x.tglLahir?`<p class="small muted">Lahir ${fmtTglS(x.tglLahir)}</p>`:""}${x.perluTinjau?' <span class="pill p-warn">perlu ditinjau</span>':""}</td><td class="small">${esc(x.alamat||"-")}</td><td class="small" style="min-width:200px">${esc(x.ket||"")}${x.tahun?`<p class="muted">Tercatat: ${esc(x.tahun)}</p>`:""}<p class="hint">${esc(x.sumber||"")}</p></td><td style="white-space:nowrap"><button class="btn sm" data-sedit="${esc(x.id)}">Ubah</button> <button class="btn sm bad" data-sdel="${esc(x.id)}">Hapus</button></td></tr>`).join("")||`<tr><td colspan="4" class="empty">Belum ada data.</td></tr>`}</tbody></table></div>`}
function sosForm(x,kat){
  openForm({title:x?"Ubah data":"Tambah data",fields:[{id:"nama",label:"Nama",value:x?.nama},{id:"alamat",label:"Alamat",value:x?.alamat,list:"alamatList",half:true},{id:"tglLahir",label:"Tanggal lahir (bila anak yatim)",type:"date",value:x?.tglLahir,half:true},{id:"ket",label:"Keterangan",value:x?.ket},{id:"tahun",label:"Tahun tercatat",value:x?.tahun,half:true},{id:"sumber",label:"Sumber",value:x?.sumber,half:true}],
   save:async v=>{if(!v.nama)return{error:"Nama wajib diisi."};const id=x?.id||"s-"+Date.now(),o={...(x||{}),...v,kategori:x?.kategori||kat};delete o.id;await put("sosial/"+id,o);upsert(S.sos,{...o,id});render();toast("Tersimpan")}})}
function katOf(f){const k=new Set();S.sos.forEach(x=>{if(x.kkId===f.id)k.add(x.kategori)});return k}
function qurbanView(){
  const q=S.qur||{penerima:{},pequrban:[]},pn=q.penerima||{},ks=S.kel.filter(f=>f.aktif!==false).sort(byAlamat);
  const ikut=f=>pn[f.id]?pn[f.id].ikut!==false:f.hunian!=="Kontrak",bag=f=>pn[f.id]&&pn[f.id].bagian!=null?pn[f.id].bagian:1;
  const tot=ks.filter(ikut).length,tb=ks.filter(ikut).reduce((s,f)=>s+(+bag(f)||0),0),lepas=S.sos.filter(x=>(x.kategori==="yatim"||x.kategori==="dhuafa")&&!x.kkId);
  return `<div class="grid g4" style="margin-bottom:14px"><div class="card stat"><b>${tot}</b><span>KK penerima</span></div><div class="card stat"><b>${tb}</b><span>Total bagian</span></div><div class="card stat"><b>${S.sos.filter(x=>x.kategori==="yatim").length}</b><span>Anak yatim</span></div><div class="card stat"><b>${S.sos.filter(x=>x.kategori==="dhuafa").length}</b><span>Dhuafa / mustahiq</span></div></div>
  <p class="small muted" style="margin-bottom:10px">${esc(q.catatan||"")} Kontrak tidak ikut secara bawaan; ubah sesuai kesepakatan.</p>
  ${lepas.length?`<div class="banner">Penerima prioritas yang belum ditautkan ke KK: ${lepas.map(x=>esc(x.nama)+" ("+esc(x.alamat||"-")+")").join(", ")}. Tambahkan alamatnya agar muncul di tabel, atau pastikan ada di data warga.</div>`:""}
  <div class="card scroll" style="padding:6px"><table class="tbl"><thead><tr><th>Ikut</th><th>Keluarga</th><th>Alamat</th><th>Prioritas</th><th>Bagian</th></tr></thead><tbody>${ks.map(f=>{const k=katOf(f);return `<tr><td><input type="checkbox" style="width:auto;min-height:0" aria-label="Ikut ${esc(f.kepala)}" data-qik="${esc(f.id)}" ${ikut(f)?"checked":""}></td><td><b>${esc(f.kepala)}</b> <span class="pill ${f.hunian==="Tetap"?"p-good":"p-warn"}">${esc(f.hunian||"-")}</span></td><td class="small">${esc(f.alamat||"-")}</td><td>${[...k].map(c=>`<span class="pill p-gold">${c==="yatim"?"Yatim":c==="dhuafa"?"Dhuafa":"Wakaf"}</span>`).join(" ")}</td><td><input type="number" min="0" style="width:72px" value="${bag(f)}" aria-label="Bagian ${esc(f.kepala)}" data-qbg="${esc(f.id)}"></td></tr>`}).join("")}</tbody></table></div>
  <h3 class="sect">Calon pequrban</h3><div class="card"><div class="row"><p class="small muted">${(q.pequrban||[]).length?"":"Belum ada yang mendaftar."}</p><button class="btn sm pri" id="addPq">+ Tambah pequrban</button></div>${(q.pequrban||[]).length?`<table class="tbl"><tbody>${q.pequrban.map((p,i)=>`<tr><td><b>${esc(p.nama)}</b></td><td>${esc(p.hewan)}</td><td class="small muted">${esc(p.ket||"")}</td><td><button class="btn sm bad" data-pqd="${i}">Hapus</button></td></tr>`).join("")}</tbody></table>`:""}</div>`}
async function qWrite(patch){try{if(!S.qur)S.qur={tahun:2027,penerima:{},pequrban:[]};await S.db.doc("qurban/2027").update(patch)}catch(e){toast("Gagal menyimpan ("+(e&&e.code||"error")+")")}}

/* ---------- pengaturan tanda tangan ---------- */
function ttdForm(){
  modal(`<h3>Tanda tangan Ketua RT</h3><p class="small muted" style="margin:8px 0">Unggah gambar tanda tangan (PNG berlatar transparan paling baik). Gambar dikecilkan otomatis dan hanya tampil di surat yang sudah disetujui.</p>
  <div class="field"><input type="file" id="ttdf" accept="image/png,image/jpeg" aria-label="Berkas tanda tangan"></div>${S.ttd?`<div class="field"><p class="small muted">Saat ini:</p><img src="${S.ttd.data}" alt="Tanda tangan" style="height:60px;background:#fff;border:1px solid var(--line);border-radius:6px;padding:4px"></div>`:""}
  <p class="err" id="merr"></p><div class="mact">${S.ttd?`<button class="btn bad" id="ttdx">Hapus</button>`:""}<button class="btn" id="mc">Tutup</button></div>`);
  $("#mc").onclick=closeM;const x=$("#ttdx");if(x)x.onclick=async()=>{try{await del("rahasia/ttd");S.ttd=null;closeM();render()}catch(e){$("#merr").textContent=e.message}};
  $("#ttdf").onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=async()=>{const sc=Math.min(1,360/im.width),c=document.createElement("canvas");c.width=Math.round(im.width*sc);c.height=Math.round(im.height*sc);c.getContext("2d").drawImage(im,0,0,c.width,c.height);const data=c.toDataURL("image/png");try{await put("rahasia/ttd",{data,ratio:c.width/c.height});S.ttd={data,ratio:c.width/c.height};closeM();render();toast("Tanda tangan tersimpan")}catch(er){$("#merr").textContent=er.message}};im.onerror=()=>{$("#merr").textContent="Berkas bukan gambar yang valid."};im.src=r.result};r.readAsDataURL(f)}}

/* ---------- event tahap 3-4 ---------- */
function bind2(){
  const on=(s,ev,fn)=>document.querySelectorAll(s).forEach(e=>e.addEventListener(ev,fn));
  on("#addSurat","click",()=>suratForm(null));on("[data-surat]","click",e=>openSurat(e.currentTarget.dataset.surat));on("[data-surat]","keydown",e=>{if(e.key==="Enter")openSurat(e.currentTarget.dataset.surat)});
  on("#qs","input",e=>{S.q=e.target.value;const p=e.target.selectionStart;render();const q=$("#qs");q.focus();q.setSelectionRange(p,p)});
  on("[data-kt]","click",e=>{S.kTab=e.currentTarget.dataset.kt;render()});on("#addKas","click",kasForm);on("#addPiu","click",piuForm);on("[data-link]","click",e=>linkForm(e.currentTarget.dataset.link));
  on("#izin","change",e=>{S.izinKirim=e.target.checked;render()});
  on("[data-rcopy]","click",e=>{const x=remQueue()[+e.currentTarget.dataset.rcopy];(navigator.clipboard?navigator.clipboard.writeText(x.msg):Promise.reject()).then(()=>toast("Pesan disalin")).catch(()=>toast("Salin manual dari kotak pesan"))});
  on("[data-rsent]","click",async e=>{const x=remQueue()[+e.currentTarget.dataset.rsent],id="r-"+Date.now(),o={key:x.key,nama:x.it.nama,tahap:x.tahap,tgl:iso(new Date()),via:"WhatsApp",jenis:x.j};try{await put("reminder/"+id,o);upsert(S.rem,{...o,id});render();toast("Dicatat terkirim, tahap "+x.tahap)}catch(er){toast(er.message)}});
  on("#copyAll","click",()=>{const t=remQueue().filter(x=>x.status==="siap").map(x=>"Kepada: "+x.it.nama+(x.hp?" ("+x.hp+")":"")+"\n"+x.msg).join("\n\n-----\n\n");(navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(()=>toast("Semua pesan disalin")).catch(()=>toast("Gagal menyalin"))});
  on("[data-st]","click",e=>{S.sTab=e.currentTarget.dataset.st;render()});on("[data-sadd]","click",e=>sosForm(null,e.currentTarget.dataset.sadd));on("[data-sedit]","click",e=>sosForm(S.sos.find(x=>x.id===e.currentTarget.dataset.sedit)));
  on("[data-sdel]","click",e=>{const id=e.currentTarget.dataset.sdel;confirmM("Hapus data ini?",async()=>{await del("sosial/"+id);S.sos=S.sos.filter(x=>x.id!==id);render()},"Hapus")});
  on("[data-qik]","change",async e=>{const id=e.target.dataset.qik,cur=(S.qur&&S.qur.penerima&&S.qur.penerima[id])||{};const n={ikut:e.target.checked,bagian:cur.bagian!=null?cur.bagian:1};S.qur=S.qur||{penerima:{},pequrban:[]};S.qur.penerima={...S.qur.penerima,[id]:n};await qWrite({penerima:{[id]:n}});render()});
  on("[data-qbg]","change",async e=>{const id=e.target.dataset.qbg,k=S.kel.find(f=>f.id===id),cur=(S.qur&&S.qur.penerima&&S.qur.penerima[id])||{ikut:k.hunian!=="Kontrak"};const n={ikut:cur.ikut!==false,bagian:Math.max(0,parseInt(e.target.value)||0)};S.qur=S.qur||{penerima:{},pequrban:[]};S.qur.penerima={...S.qur.penerima,[id]:n};await qWrite({penerima:{[id]:n}});render()});
  on("#addPq","click",()=>openForm({title:"Tambah calon pequrban",fields:[{id:"nama",label:"Nama"},{id:"hewan",label:"Hewan",type:"select",options:["Kambing","Domba","Sapi (1 bagian dari 7)","Sapi (satu ekor)"],half:true},{id:"ket",label:"Keterangan",half:true}],save:async v=>{if(!v.nama)return{error:"Nama wajib diisi."};const l=[...((S.qur&&S.qur.pequrban)||[]),v];await qWrite({pequrban:l});S.qur={...(S.qur||{}),pequrban:l};render()}}));
  on("[data-pqd]","click",async e=>{const l=((S.qur&&S.qur.pequrban)||[]).filter((_,i)=>i!==+e.currentTarget.dataset.pqd);await qWrite({pequrban:l});S.qur={...S.qur,pequrban:l};render()});
  on("#ttdBtn","click",ttdForm);
}


const ICO={foto:'<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2"/><path d="M21 16l-5-5-8 8"/>',beranda:'<path d="M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10"/>',warga:'<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M16 5a3 3 0 010 6M18 14c2 .6 3 2.3 3 6"/>',surat:'<path d="M6 3h8l5 5v13H6zM14 3v5h5M9 13h7M9 17h7"/>',keuangan:'<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18M16 15h2"/>',reminder:'<path d="M6 17V11a6 6 0 0112 0v6l2 2H4zM10 21h4"/>',sosial:'<path d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.600-7 10-7 10z"/>',kegiatan:'<path d="M4 5h16v14H4zM8 9h8M8 13h8M8 16h4"/>',pertemuan:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',pengaturan:'<circle cx="12" cy="12" r="3"/><path d="M19.400 15a1.700 1.700 0 00.3 1.800l.1.1a2 2 0 11-2.800 2.800l-.1-.1a1.700 1.700 0 00-1.800-.3 1.700 1.700 0 00-1 1.500V21a2 2 0 11-4 0v-.1a1.700 1.700 0 00-1.100-1.500 1.700 1.700 0 00-1.800.3l-.1.100a2 2 0 11-2.800-2.800l.1-.1a1.700 1.700 0 00.3-1.800 1.700 1.700 0 00-1.500-1H3a2 2 0 110-4h.1a1.700 1.700 0 001.500-1.100 1.700 1.700 0 00-.3-1.800l-.1-.1a2 2 0 112.800-2.800l.1.100a1.700 1.700 0 001.800.3H9a1.700 1.700 0 001-1.500V3a2 2 0 114 0v.1a1.700 1.700 0 001 1.500 1.700 1.700 0 001.800-.3l.1-.1a2 2 0 112.800 2.800l-.1.100a1.700 1.700 0 00-.3 1.800V9a1.700 1.700 0 001.500 1H21a2 2 0 110 4h-.1a1.700 1.700 0 00-1.500 1z"/>',cari:'<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',plus:'<path d="M12 5v14M5 12h14"/>',qurban:'<path d="M4 20h16M6 20V10l6-6 6 6v10"/>'};
Object.assign(ICO,{kal:'<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>',org:'<circle cx="12" cy="5" r="2.5"/><circle cx="5" cy="18" r="2.5"/><circle cx="19" cy="18" r="2.5"/><path d="M12 8v4M5 15.5V12h14v3.5"/>',toko:'<path d="M4 9l1.5-5h13L20 9M4 9v11h16V9M4 9c0 2 3 2 4 0 1 2 3 2 4 0 1 2 3 2 4 0 1 2 4 2 4 0M10 20v-5h4v5"/>',kaos:'<path d="M8 3l-5 3 2 4 3-1v11h8V9l3 1 2-4-5-3c-1 2-5 2-8 0z"/>',cam:'<path d="M3 8h12v8H3zM15 11l6-3v8l-6-3"/>',lapor:'<path d="M4 10v4h3l7 4V6L7 10zM17 9a4 4 0 010 6"/>',dompet:'<path d="M3 7h16a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2zM3 7l12-3v3M17 14h2"/>',masuk:'<path d="M3 6h18v12H3zM3 7l9 7 9-7"/>',aset:'<path d="M3 8l9-5 9 5v12H3zM9 20v-7h6v7"/>',konten:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M8 14h8"/>',depan:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>'});
const ic=n=>`<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">${ICO[n]||""}</svg>`;
const tabBadge=id=>id==="surat"?(S.surat||[]).filter(x=>x.status==="menunggu").length:id==="reminder"?(S.admin&&S.piu&&S.piu.length?remQueue().filter(x=>x.status==="siap").length:0):0;
const bdgH=id=>{const n=tabBadge(id);return n?`<span class="bdg" aria-label="${n} perlu perhatian">${n}</span>`:""};
function shellHtml(tabs,content){
  const lk=(t,cls)=>`<a href="#${t[0]}" ${S.tab===t[0]?'aria-current="page"':""}>${ic(t[0])}<span>${t[1]}</span>${bdgH(t[0])}</a>`;
  const main=tabs.slice(0,S.admin?4:3),more=tabs.slice(main.length);
  return `<div class="shell"><aside class="side" aria-label="Menu utama"><div class="brand"><img class="logo" src="${LOGO}" alt="Logo RT 09"><div><b>${esc(S.set.namaRT)} / ${esc(S.set.rw)}</b><span>Kel. ${esc(S.set.kelurahan)}</span></div></div>
   ${S.admin?`<button class="sbtn" id="sbtn" aria-label="Cari">${ic("cari")}<span>Cari…</span><kbd>Ctrl K</kbd></button>`:""}
   <nav class="snav">${tabs.map(t=>lk(t)).join("")}</nav>${albumA("alb",1)}<span class="pill ${S.admin?"p-gold":"p-mute"}" style="align-self:flex-start">${S.admin?"Pengurus (bisa mengubah)":"Hanya lihat"}</span>${MODE==="publik"&&S.admin&&window.RT_AUTH?`<button class="btn sm" data-signout="1" style="align-self:flex-start">Keluar</button>`:""}</aside>
  <main class="mn ${S.anim?"anim":""}" id="mn"><div class="mtop"><div class="brand"><img class="logo" src="${LOGO}" alt="Logo RT 09"><div><b>${esc(S.set.namaRT)} / ${esc(S.set.rw)}</b><span>${S.admin?"Pengurus":"Hanya lihat"}</span></div></div><span style="display:flex;gap:8px">${albumU()&&albumOk(albumU())?`<a class="ib" href="${esc(albumU())}" target="_blank" rel="noopener noreferrer" aria-label="Album foto">${ic("foto")}</a>`:""}${S.admin?`<button class="ib" id="sbtn2" aria-label="Cari">${ic("cari")}</button>`:""}${MODE==="publik"&&S.admin&&window.RT_AUTH?`<button class="btn sm" data-signout="1">Keluar</button>`:""}</span></div>${content}</main></div>
  <nav class="bnav" aria-label="Menu bawah">${main.map(t=>lk(t)).join("")}${more.length?`<button id="menuBtn" aria-label="Menu lainnya">${ic("menu")}<span>Menu</span>${more.some(t=>tabBadge(t[0]))?'<span class="bdg">!</span>':""}</button>`:""}</nav>`}
function openMenu(){const tabs=TABS.filter(t=>!t[2]||S.admin);modal(`<div class="row"><h3>Menu</h3><button class="btn sm" id="mc">Tutup</button></div><div class="mgrid">${tabs.map(t=>`<a href="#${t[0]}" ${S.tab===t[0]?'aria-current="page"':""}>${ic(t[0])}<span>${t[1]}</span>${bdgH(t[0])}</a>`).join("")}${albumA("",1)}</div>${MODE==="publik"&&S.admin&&window.RT_AUTH?`<button class="btn" id="outM" style="width:100%;margin-top:12px">Keluar dari akun</button>`:""}`);$("#mc").onclick=closeM;const om=$("#outM");if(om)om.onclick=()=>window.RT_AUTH.signOut();document.querySelectorAll(".mgrid a").forEach(a=>a.addEventListener("click",()=>setTimeout(closeM,0)))}
function openSearch(){
  if(!S.admin)return;modal(`<h3>Cari</h3><input id="gs" type="search" placeholder="Nama warga, alamat, nomor surat" autocomplete="off" aria-label="Cari" style="margin-top:10px"><div class="sres" id="gsr"><p class="empty small">Ketik minimal 2 huruf.</p></div><div class="mact"><button class="btn" id="mc">Tutup</button></div>`);
  $("#mc").onclick=closeM;const gs=$("#gs");gs.focus();
  gs.oninput=()=>{const q=gs.value.trim().toLowerCase();if(q.length<2){$("#gsr").innerHTML='<p class="empty small">Ketik minimal 2 huruf.</p>';return}
   const w=S.kel.filter(f=>(f.kepala+" "+f.alamat+" "+(f.anggota||[]).map(a=>a.nama).join(" ")).toLowerCase().includes(q)||digits(f.kk).includes(q)).slice(0,8),
   su=(S.surat||[]).filter(x=>(x.nama+" "+(x.nomor||"")+" "+x.jenis).toLowerCase().includes(q)).slice(0,6);
   $("#gsr").innerHTML=(w.length?'<h5>Warga</h5>'+w.map(f=>`<button data-gk="${esc(f.id)}"><b>${esc(f.kepala)}</b><small>${esc(f.alamat||"alamat kosong")} · ${jiwa(f).length} jiwa</small></button>`).join(""):"")+(su.length?'<h5>Surat</h5>'+su.map(x=>`<button data-gs="${esc(x.id)}"><b>${esc(x.nama)}</b><small>${esc(x.jenis)} · ${esc(x.nomor||"menunggu")}</small></button>`).join(""):"")||'<p class="empty small">Tidak ditemukan.</p>';
   document.querySelectorAll("[data-gk]").forEach(b=>b.onclick=()=>{closeM();openKK(b.dataset.gk)});document.querySelectorAll("[data-gs]").forEach(b=>b.onclick=()=>{closeM();openSurat(b.dataset.gs)})}}
function stackTables(){document.querySelectorAll("table.tbl").forEach(t=>{const h=[...t.querySelectorAll("thead th")].map(x=>x.textContent.trim());if(!h.length)return;t.classList.add("stack");t.querySelectorAll("tbody tr").forEach(r=>[...r.children].forEach((c,i)=>{c.dataset.label=h[i]||""}))})}
function attention(){
  if(!S.admin)return "";const it=[];const mn=(S.surat||[]).filter(x=>x.status==="menunggu").length,rm=S.piu&&S.piu.length?remQueue().filter(x=>x.status==="siap").length:0,lg=S.kel.filter(f=>f.aktif!==false&&!lengkap(f)).length;
  if(mn)it.push(`<a href="#surat">${ic("surat")}${mn} surat menunggu persetujuan Ketua RT</a>`);
  if(rm)it.push(`<a href="#reminder">${ic("reminder")}${rm} pengingat pembayaran siap dikirim</a>`);
  if(dataSementara())it.push(`<a href="#keuangan">${ic("keuangan")}Data kas dan piutang masih sementara, perlu diperbarui</a>`);
  if(lg)it.push(`<a href="#warga" data-filt="lengkap">${ic("warga")}${lg} KK datanya belum lengkap</a>`);
  return `<h3 class="sect">Perlu perhatian</h3><div class="att">${it.join("")||'<a class="ok" href="#warga">Semua beres. Tidak ada yang perlu ditindak.</a>'}</div>`}
function quick(){return S.admin?`<div class="qa"><button data-qa="surat">${ic("surat")}Buat surat</button><button data-qa="warga">${ic("plus")}Tambah warga</button><button data-qa="kas">${ic("keuangan")}Laporan kas</button><button data-qa="cari">${ic("cari")}Cari warga</button></div>`:""}
function bind3(){
  const on=(s,ev,fn)=>document.querySelectorAll(s).forEach(e=>e.addEventListener(ev,fn));
  on("[data-gt]","click",e=>{S.tab=e.currentTarget.dataset.gt;location.hash=S.tab;render()});
  on("#sbtn,#sbtn2","click",openSearch);on("#menuBtn","click",openMenu);
  on("[data-filt]","click",e=>{S.fHun=e.currentTarget.dataset.filt});
  on("[data-qa]","click",e=>{const a=e.currentTarget.dataset.qa;if(a==="surat"){S.tab="surat";location.hash="surat";render();suratForm(null)}else if(a==="warga")kkForm(null);else if(a==="kas"){S.tab="keuangan";location.hash="keuangan";render();kasForm()}else openSearch()});
  on("[data-editp]","click",e=>pertForm(S.pert.find(x=>x.id===e.currentTarget.dataset.editp)));
  const mv=(i,d)=>{const ids=hosts().map(h=>h.id);const j=i+d;if(j<0||j>=ids.length)return;[ids[i],ids[j]]=[ids[j],ids[i]];giliranSimpan(ids).catch(x=>toast(x.message))};
  on("[data-gup]","click",e=>mv(+e.currentTarget.dataset.gup,-1));on("[data-gdn]","click",e=>mv(+e.currentTarget.dataset.gdn,1));
  on("[data-gskip]","click",e=>giliranSkip(e.currentTarget.dataset.gskip,false).catch(x=>toast(x.message)));on("[data-gin]","click",e=>giliranSkip(e.currentTarget.dataset.gin,true).catch(x=>toast(x.message)));
  on("#gAdd","click",giliranTambah);on("#gReset","click",()=>giliranSimpan([]).catch(x=>toast(x.message)));
  stackTables()}
document.addEventListener("keydown",e=>{const t=e.target&&e.target.tagName;if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();openSearch()}else if(e.key==="/"&&!/INPUT|TEXTAREA|SELECT/.test(t||"")&&S.admin){e.preventDefault();openSearch()}else if(e.key==="Escape"&&$("#modal").innerHTML)closeM()});


const PRESET={"Perunggu (bawaan)":{accent:"#6b4a1f",bg:"#f1efec"},"Hijau zaitun":{accent:"#2f5d3a",bg:"#eef1ec"},"Biru laut":{accent:"#1f4d7a",bg:"#edf1f5"},"Marun":{accent:"#7a2630",bg:"#f4eeee"},"Arang":{accent:"#383d45",bg:"#f0f0ef"},"Kustom":null};
const lumOf=h=>{const m=/^#?([0-9a-f]{6})$/i.exec(h||"");if(!m)return 0;const v=[0,2,4].map(i=>parseInt(m[1].substr(i,2),16)/255).map(c=>c<=.03928?c/12.92:Math.pow((c+.055)/1.055,2.4));return .2126*v[0]+.7152*v[1]+.0722*v[2]};
function applyTema(){
  const t=S.set.tema||{},p=t.preset==="Kustom"?t:(PRESET[t.preset]||null),fs={Kecil:13,Normal:14,Besar:16}[t.fs]||14;let css="";
  if(p&&t.preset!=="Perunggu (bawaan)"){const a=/^#[0-9a-f]{6}$/i.test(p.accent)?p.accent:"#6b4a1f",b=/^#[0-9a-f]{6}$/i.test(p.bg)?p.bg:"#f1efec",ink=lumOf(a)>.5?"#1a1208":"#ffffff";
   const dk=`--accent:color-mix(in srgb,${a} 55%,#fff);--accent-soft:color-mix(in srgb,${a} 28%,#15110d);--gold:color-mix(in srgb,${a} 60%,#fff);--accent-ink:#1a1208;`;
   css+=`:root:root{--accent:${a};--accent-ink:${ink};--accent-soft:color-mix(in srgb,${a} 13%,#fff);--gold:color-mix(in srgb,${a} 45%,#fff);--bg:${b};--chip:${b}}@media (prefers-color-scheme:dark){:root:root:not([data-theme="light"]){${dk}--chip:#efe8dc}}:root:root[data-theme="dark"]{${dk}--chip:#efe8dc}`}
  css+=`html body{font-size:${fs}px}`;
  let el=document.getElementById("tema");if(!el){el=document.createElement("style");el.id="tema";document.head.appendChild(el)}if(el.textContent!==css)el.textContent=css}
const albumU=()=>S.albumU||(S.set&&S.set.albumUrl)||"";
const albumOk=u=>/^https:\/\/[^\s]+$/i.test(u||"");
const albumA=(cls,ico)=>albumU()&&albumOk(albumU())?`<a class="${cls}" href="${esc(albumU())}" target="_blank" rel="noopener noreferrer" aria-label="Album foto (Google Drive, tab baru)">${ico?ic("foto"):""}<span>Album foto</span></a>`:"";
function albumCard(){const u=albumOk(albumU());return `<div class="card lift"><p class="muted small">Album foto kegiatan</p>${u?`<p style="margin:6px 0 10px">Dokumentasi pertemuan dan kegiatan warga tersimpan di Google Drive.</p><a class="btn pri sm" style="text-decoration:none;display:inline-flex;align-items:center" href="${esc(albumU())}" target="_blank" rel="noopener noreferrer">Buka album</a>`:`<p class="small muted" style="margin:6px 0 10px">Tautan album belum diisi.</p>${S.admin?`<button class="btn sm" data-set="album">Atur tautan</button>`:""}`}</div>`}

/* ===================== TAHAP 7 (a): data, kalender, foto, halaman depan ===================== */
Object.assign(S,{umkm:[],prod:[],kal:[],aset:[],inv:[],msk:[],sewa:[],cSel:"kasRT",aTab:"inv",pTab:"kalender",mTab:"semua",mSt:"aktif",kIdx:0,kView:"bulan",kDay:null,hide:{},cAnim:false,auth:null});
const MODE=window.RT_MODE||"app";
/* Sumber: SKB 3 Menteri 2027 (setneg.go.id). Perbarui tiap tahun setelah SKB terbit. [tanggal, nama, 1=cuti bersama] */
const HARI_LIBUR=[["2026-12-25","Natal"],["2027-01-01","Tahun Baru 2027"],["2027-01-05","Isra Mikraj"],["2027-02-05","Cuti bersama Imlek",1],["2027-02-06","Tahun Baru Imlek"],["2027-03-08","Hari Suci Nyepi"],["2027-03-09","Cuti bersama Idulfitri",1],["2027-03-10","Idulfitri 1448 H"],["2027-03-11","Idulfitri 1448 H (hari ke-2)"],["2027-03-12","Cuti bersama Idulfitri",1],["2027-03-15","Cuti bersama Idulfitri",1],["2027-03-25","Cuti bersama Wafat Yesus",1],["2027-03-26","Wafat Yesus Kristus"],["2027-03-28","Paskah"],["2027-05-01","Hari Buruh"],["2027-05-06","Kenaikan Yesus Kristus"],["2027-05-17","Iduladha 1448 H"],["2027-05-18","Cuti bersama Iduladha",1],["2027-05-19","Cuti bersama Waisak",1],["2027-05-20","Hari Raya Waisak"],["2027-06-01","Hari Lahir Pancasila"],["2027-06-06","1 Muharam 1449 H"],["2027-08-15","Maulid Nabi Muhammad SAW"],["2027-08-17","HUT Kemerdekaan RI"],["2027-12-24","Cuti bersama Natal",1],["2027-12-25","Natal"],["2027-12-26","Isra Mikraj"]];
const HDR=["Sen","Sel","Rab","Kam","Jum","Sab","Min"],BLN3=["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
const TIPE_K={libur:["Libur nasional","p-bad"],cuti:["Cuti bersama","p-warn"],rapat:["Pertemuan warga","p-gold"],kegiatan:["Kegiatan RT","p-info"],sewa:["Fasilitas terpakai","p-mute"]};
const KAT_K=["Kegiatan RT","Kerja bakti","Keagamaan","Olahraga & hiburan","Rapat khusus","Sewa fasilitas","Lainnya"];
const dd2=n=>String(n).padStart(2,"0");
const k7Base=()=>{const n=new Date();return new Date(n.getFullYear(),n.getMonth(),1)};
const k7Month=i=>{const b=k7Base();return new Date(b.getFullYear(),b.getMonth()+i,1)};
function k7Events(start,end){
  const ev=[],j=S.set.jadwal,wd=HARI.indexOf(j.hari);
  HARI_LIBUR.forEach(h=>ev.push({tgl:h[0],judul:h[1],tipe:h[2]?"cuti":"libur"}));
  const by={};(S.pert||[]).filter(p=>p.status!=="batal"&&p.tanggal).forEach(p=>{const k=p.tanggal.slice(0,7);(by[k]=by[k]||[]).push(p)});
  let d=new Date(start.slice(0,7)+"-01T00:00:00");const e=new Date(end+"T00:00:00");
  while(d<=e){const key=d.getFullYear()+"-"+dd2(d.getMonth()+1);
    if(by[key])by[key].forEach(p=>ev.push({tgl:p.tanggal,judul:"Pertemuan warga",tipe:"rapat",ket:[p.tuanRumahNama?"Tuan rumah: "+p.tuanRumahNama:"",p.alamat,j.jam?"pukul "+j.jam:""].filter(Boolean).join(" · ")}));
    else ev.push({tgl:iso(nthWeekday(d.getFullYear(),d.getMonth(),wd,+j.pekan||2)),judul:"Pertemuan warga",tipe:"rapat",ket:"Tuan rumah diumumkan kemudian"+(j.jam?" · pukul "+j.jam:"")});
    d=new Date(d.getFullYear(),d.getMonth()+1,1)}
  (S.kal||[]).forEach(k=>{if(!k.tanggal)return;if(k.publik===false&&!S.admin)return;let c=new Date(k.tanggal+"T00:00:00");const z=new Date((k.tanggalAkhir||k.tanggal)+"T00:00:00");let n=0;
    while(c<=z&&n<31){ev.push({tgl:iso(c),judul:k.judul,tipe:k.kategori==="Sewa fasilitas"?"sewa":"kegiatan",ket:[k.jam,k.tempat,k.ket].filter(Boolean).join(" · "),id:k.id,kat:k.kategori});c.setDate(c.getDate()+1);n++}});
  return ev.filter(x=>x.tgl>=start&&x.tgl<=end).sort((a,b)=>a.tgl.localeCompare(b.tgl)||a.judul.localeCompare(b.judul))}
const evRow=e=>{const d=new Date(e.tgl+"T00:00:00");return `<li class="ke"><span class="kd"><b>${d.getDate()}</b>${HDR[(d.getDay()+6)%7]}</span><div class="kt"><b>${esc(e.judul)}</b>${e.ket?`<small>${esc(e.ket)}</small>`:""}</div><span class="pill ${TIPE_K[e.tipe][1]}">${TIPE_K[e.tipe][0]}</span></li>`};
function kalHtml(){
  const chips=Array.from({length:12},(_,i)=>{const m=k7Month(i);return `<button class="chipb" data-kidx="${i}" aria-pressed="${S.kIdx===i&&S.kView==="bulan"}">${BLN3[m.getMonth()]}${m.getMonth()===0||i===0?" "+m.getFullYear():""}</button>`}).join("");
  const tog=`<div class="chips" style="margin:0"><button class="chipb" data-kview="bulan" aria-pressed="${S.kView==="bulan"}">Per bulan</button><button class="chipb" data-kview="agenda" aria-pressed="${S.kView==="agenda"}">Agenda 12 bulan</button></div>`;
  const legend=`<p class="klg">${Object.keys(TIPE_K).map(k=>`<span><u class="dt ${k}"></u>${TIPE_K[k][0]}</span>`).join("")}</p>`;
  if(S.kView==="agenda"){
    const a=iso(k7Month(0)),b=iso(new Date(k7Month(11).getFullYear(),k7Month(11).getMonth()+1,0)),ev=k7Events(a,b);let cur="";
    return `<div class="row" style="margin-bottom:10px">${tog}</div>${legend}<div class="card">${ev.map(e=>{const m=e.tgl.slice(0,7),h=m!==cur?`<h4 class="kmh">${BLNN[+m.slice(5)-1]} ${m.slice(0,4)}</h4>`:"";cur=m;return h+`<ul class="kl">${evRow(e)}</ul>`}).join("")||'<p class="empty">Belum ada agenda.</p>'}</div>`}
  const m=k7Month(S.kIdx),y=m.getFullYear(),mo=m.getMonth(),first=iso(new Date(y,mo,1)),last=iso(new Date(y,mo+1,0)),ev=k7Events(first,last),by={};ev.forEach(e=>(by[e.tgl]=by[e.tgl]||[]).push(e));
  const off=(m.getDay()+6)%7,dim=new Date(y,mo+1,0).getDate(),today=iso(new Date());let cells="";
  for(let i=0;i<off;i++)cells+='<span class="kc e"></span>';
  for(let d=1;d<=dim;d++){const ds=y+"-"+dd2(mo+1)+"-"+dd2(d),es=by[ds]||[],wk=(off+d-1)%7;
    cells+=`<button class="kc ${ds===today?"today":""} ${ds===S.kDay?"sel":""} ${wk===6||es.some(e=>e.tipe==="libur")?"red":""}" data-kday="${ds}" aria-label="${d} ${BLNN[mo]}${es.length?", "+es.length+" agenda":""}"><b>${d}</b><i>${es.slice(0,4).map(e=>`<u class="dt ${e.tipe}"></u>`).join("")}</i></button>`}
  const shown=S.kDay&&S.kDay.slice(0,7)===y+"-"+dd2(mo+1)?ev.filter(e=>e.tgl===S.kDay):ev;
  return `<div class="row" style="margin-bottom:10px">${tog}</div><div class="chips kmon">${chips}</div>${legend}
  <div class="card kcal"><div class="row"><h3>${BLNN[mo]} ${y}</h3><span class="muted small">${ev.filter(e=>e.tipe==="rapat"||e.tipe==="kegiatan").length} kegiatan RT</span></div>
  <div class="kg">${HDR.map((h,i)=>`<span class="kh ${i===6?"red":""}">${h}</span>`).join("")}${cells}</div></div>
  <div class="card" style="margin-top:12px"><div class="row"><h4>${S.kDay&&shown.length&&shown.length<ev.length?fmtTgl(S.kDay):"Agenda bulan ini"}</h4>${S.kDay?'<button class="btn sm" data-kday="">Tampilkan semua</button>':""}</div><ul class="kl">${shown.map(evRow).join("")||'<li class="empty small">Tidak ada agenda.</li>'}</ul></div>`}

/* ---------- foto: perkecil di browser, simpan sebagai data URI ---------- */
function shrinkImg(im,max,q,png){let sc=Math.min(1,max/Math.max(im.width,im.height)),out="";
  for(let i=0;i<5;i++){const c=document.createElement("canvas");c.width=Math.round(im.width*sc);c.height=Math.round(im.height*sc);const x=c.getContext("2d");if(!png){x.fillStyle="#fff";x.fillRect(0,0,c.width,c.height)}x.drawImage(im,0,0,c.width,c.height);out=png?c.toDataURL("image/png"):c.toDataURL("image/jpeg",q);if(out.length<190000)return out;sc*=.8;q=Math.max(.45,q-.08)}return out}
function fotoForm(title,cur,onSave,png){
  modal(`<h3>${esc(title)}</h3><p class="small muted" style="margin:8px 0">Pilih gambar (JPG atau PNG). Otomatis dikecilkan agar ringan.</p><div class="field"><input type="file" id="ff" accept="image/png,image/jpeg,image/webp" aria-label="Berkas gambar"></div>
  <div id="fp">${cur?`<img src="${cur}" alt="Gambar saat ini" style="max-width:100%;max-height:220px;border-radius:8px;border:1px solid var(--line)">`:""}</div><p class="err" id="merr"></p><div class="mact">${cur?`<button class="btn bad" id="fx">Hapus gambar</button>`:""}<button class="btn" id="mc">Tutup</button></div>`);
  $("#mc").onclick=closeM;const x=$("#fx");if(x)x.onclick=async()=>{try{await onSave("");closeM()}catch(e){$("#merr").textContent=e.message}};
  $("#ff").onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=async()=>{const d=shrinkImg(im,png?640:900,.74,png);try{await onSave(d);closeM();toast("Gambar tersimpan")}catch(er){$("#merr").textContent=er.message}};im.onerror=()=>{$("#merr").textContent="Berkas bukan gambar yang valid."};im.src=r.result};r.readAsDataURL(f)}}

/* ---------- kirim masukan publik ---------- */
async function kirimMasukan(jenis,isi){
  if(window.RT_PUBLIC_SUBMIT){const r=await window.RT_PUBLIC_SUBMIT(jenis,isi);if(r&&r.error)throw new Error({terlalu_sering:"Terlalu banyak kiriman saat ini. Coba lagi beberapa saat lagi.",data_tidak_valid:"Data terlalu panjang atau tidak valid.",jenis_tidak_valid:"Jenis tidak dikenal."}[r.error]||"Gagal mengirim. Coba lagi.");return r}
  await put("masukan/m-"+Date.now(),{jenis,status:"baru",dibuat:new Date().toISOString(),isi})}
const KAT_LAP=["Kebersihan & sampah","Keamanan","Jalan, lampu & drainase","Fasilitas umum rusak","Gangguan ketertiban","Pelayanan RT","Lainnya"];
function lapForm(){openForm({title:"Laporan & keluhan warga",fields:[{id:"kategori",label:"Jenis laporan",type:"select",options:KAT_LAP},{id:"lokasi",label:"Lokasi kejadian",ph:"Contoh: Hidup Baru I depan no. 10"},{id:"uraian",label:"Uraian",type:"textarea",rows:4,ph:"Ceritakan apa yang terjadi dan sejak kapan.",hint:"Laporan diterima pengurus RT. Nama dan nomor HP boleh dikosongkan, tetapi isi bila ingin dikabari."},{id:"nama",label:"Nama (opsional)",half:true},{id:"hp",label:"No. HP/WA (opsional)",inputmode:"tel",half:true}],label:"Kirim laporan",
  save:async v=>{if(v.uraian.length<10)return{error:"Uraian minimal 10 huruf."};await kirimMasukan("laporan",v);toast("Laporan terkirim. Terima kasih.")}})}
function pesanForm(p){const uk=(p&&p.ukuran)||["S","M","L","XL","XXL","3XL"];
  openForm({title:"Pesan "+(p?p.nama:"baju RT 09"),wide:true,fields:[{id:"nama",label:"Nama pemesan"},{id:"hp",label:"No. HP/WA",inputmode:"tel",half:true},{id:"alamat",label:"Alamat (blok/nomor)",half:true,ph:"Hidup Baru I / 10"},...uk.map(u=>({id:"u_"+u,label:"Jumlah ukuran "+u,inputmode:"numeric",value:"0",half:true})),{id:"catatan",label:"Catatan (nama di baju, lengan panjang/pendek, dll.)",type:"textarea",rows:2}],label:"Kirim pesanan",
  save:async v=>{const items=uk.map(u=>({ukuran:u,jumlah:parseInt(digits(v["u_"+u]))||0})).filter(x=>x.jumlah>0);if(!v.nama||digits(v.hp).length<8)return{error:"Isi nama dan nomor HP yang valid."};if(!items.length)return{error:"Isi jumlah pada minimal satu ukuran."};
   await kirimMasukan("pesanan",{produk:p?p.nama:"Baju RT 09",nama:v.nama,hp:v.hp,alamat:v.alamat,items,catatan:v.catatan,harga:p&&p.harga?+p.harga:null});toast("Pesanan terkirim. Pengurus akan menghubungi Anda.")}})}
function umkmDaftarForm(){openForm({title:"Daftarkan usaha warga",wide:true,fields:[{id:"nama",label:"Nama usaha"},{id:"pemilik",label:"Nama pemilik",half:true},{id:"kategori",label:"Kategori",type:"select",options:["Makanan & minuman","Toko & warung","Jasa","Fashion","Kerajinan","Pendidikan & kursus","Kesehatan & kecantikan","Lainnya"],half:true},{id:"deskripsi",label:"Deskripsi singkat",type:"textarea",rows:3,ph:"Apa yang dijual, jam buka, area antar."},{id:"alamat",label:"Alamat (blok/nomor)",half:true},{id:"wa",label:"No. WhatsApp usaha",inputmode:"tel",half:true},{id:"tautan",label:"Instagram / toko online (opsional)",ph:"https://"}],label:"Kirim pendaftaran",
  save:async v=>{if(!v.nama||!v.pemilik)return{error:"Nama usaha dan pemilik wajib diisi."};if(v.tautan&&!/^https:\/\//i.test(v.tautan))return{error:"Tautan harus diawali https://"};await kirimMasukan("umkm",v);toast("Terima kasih. Pengurus akan memeriksa lalu menayangkan usaha Anda.")}})}
function sewaForm(a){const pub=S.aset.filter(x=>x.aktif!==false);if(!pub.length){toast("Belum ada fasilitas yang bisa disewa");return}const lb=pub.map(x=>x.nama),cur=a?a.nama:lb[0];
  openForm({title:"Ajukan pemakaian fasilitas",wide:true,fields:[{id:"aset",label:"Fasilitas",type:"select",options:lb,value:cur},{id:"tanggal",label:"Tanggal",type:"date",half:true},{id:"jam1",label:"Mulai",type:"time",half:true},{id:"jam2",label:"Selesai",type:"time",half:true},{id:"nama",label:"Nama pemohon",half:true},{id:"hp",label:"No. HP/WA",inputmode:"tel",half:true},{id:"keperluan",label:"Keperluan",type:"textarea",rows:2}],label:"Kirim pengajuan",
  save:async v=>{if(!v.tanggal||!v.nama||digits(v.hp).length<8||!v.keperluan)return{error:"Lengkapi tanggal, nama, nomor HP, dan keperluan."};if(v.tanggal<iso(new Date()))return{error:"Tanggal tidak boleh sudah lewat."};const as=pub.find(x=>x.nama===v.aset);
   const bt=sewaBentrok(as&&as.id,v.tanggal,v.jam1,v.jam2);if(bt)return{error:"Pada tanggal dan jam itu sudah ada pemakaian lain ("+bt+"). Pilih waktu lain."};
   await kirimMasukan("sewa",{asetId:as?as.id:"",aset:v.aset,tanggal:v.tanggal,jam1:v.jam1,jam2:v.jam2,nama:v.nama,hp:v.hp,keperluan:v.keperluan});toast("Pengajuan terkirim. Pengurus akan mengonfirmasi.")}})}
function sewaBentrok(asetId,tgl,j1,j2){const a=S.aset.find(x=>x.id===asetId);if(!a)return "";const ov=(s1,e1,s2,e2)=>!(s1&&e1&&s2&&e2)||(s1<e2&&s2<e1);
  const bk=S.kal.find(k=>k.kategori==="Sewa fasilitas"&&k.asetId===asetId&&k.tanggal<=tgl&&(k.tanggalAkhir||k.tanggal)>=tgl&&ov(j1,j2,k.jam1,k.jam2));return bk?(bk.jam1?bk.jam1+"-"+bk.jam2:"seharian"):""}

/* ---------- halaman depan (publik) ---------- */
const tshirt='<svg viewBox="0 0 120 110" class="tsv" aria-hidden="true"><path d="M40 8l-30 16 10 22 14-7v58h52V39l14 7 10-22L80 8c-4 8-12 12-20 12S44 16 40 8z" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/></svg>';
const waLnk=(h,t)=>{let n=digits(h);if(!n)return "";if(n.startsWith("0"))n="62"+n.slice(1);return "https://wa.me/"+n+(t?"?text="+encodeURIComponent(t):"")};
function nextPert(){const t=iso(new Date());return (S.pert||[]).filter(p=>p.status==="terjadwal"&&p.tanggal>=t).sort((a,b)=>a.tanggal.localeCompare(b.tanggal))[0]}
function rekList(){return (S.set.rekening||[]).filter(r=>r.no)}
const fmtRek=(no)=>/\s/.test(String(no||"").trim())?String(no).trim():digits(no).replace(/(\d{4})(?=\d)/g,"$1 ").trim();
function salin(t,ok){(navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(()=>toast(ok||"Disalin")).catch(()=>toast("Salin manual: "+t))}
function secH(id,judul,sub,act){return `<div class="row" id="s-${id}" style="margin:22px 0 8px;scroll-margin-top:70px"><div><h2>${judul}</h2>${sub?`<p class="muted small">${sub}</p>`:""}</div>${act||""}</div>`}
function strukturHtml(){const L=[[],[],[],[]];(S.set.struktur||[]).forEach(n=>{(L[Math.min(3,+n.level||0)]).push(n)});
  const nd=n=>`<div class="nd"><b>${esc(n.jabatan)}</b><span>${esc(n.nama||"Belum diisi")}</span>${n.tugas?`<small>${esc(n.tugas)}</small>`:""}</div>`;
  return `<div class="org">${L.map((l,i)=>l.length?`<div class="lv l${i}">${l.map(nd).join("")}</div>`:"").join("")}</div>${S.set.ketuaRW?`<p class="muted small" style="margin-top:10px;text-align:center">Ketua ${esc(S.set.rw||"RW")}: <b>${esc(S.set.ketuaRW)}</b>${S.set.ketuaRWKet?" · "+esc(S.set.ketuaRWKet):""}</p>`:""}`}
function vDepan(){
  const pub=MODE==="publik"&&!S.admin,s=S.set,np=nextPert(),berita=(S.keg||[]).filter(e=>e.tipe!=="notulen").sort((a,b)=>b.tanggal.localeCompare(a.tanggal)).slice(0,3);
  const pr=S.prod.filter(p=>p.aktif!==false).sort((a,b)=>(a.urut||9)-(b.urut||9)),um=S.umkm.filter(u=>u.aktif!==false),as=S.aset.filter(a=>a.aktif!==false),pj=(S.inv||[]).filter(i=>i.pinjam);
  const nav=[["kalender","Kalender","kal"],["pengurus","Pengurus","org"],["umkm","UMKM","toko"],["produk","Produk RT","kaos"],as.length?["sewa","Fasilitas","aset"]:null,(S.cctv||[]).some(c=>c.aktif!==false&&c.akses==="umum")?["cctv","CCTV","cam"]:null,["lapor","Lapor","lapor"],["bayar","Bayar","dompet"]].filter(Boolean);
  const rek=rekList();
  return `<div class="clean"><section class="bhero"><div class="bh-top"><img class="hlogo" src="${LOGO}" alt="Logo RT 09"><div class="hmain"><p class="eyebrow">Kel. ${esc(s.kelurahan)} · Kec. ${esc(s.kecamatan||"Pinang")} · ${esc(s.kota)}</p><h1>${esc(s.namaRT)} / ${esc(s.rw)}</h1></div></div>
   <p class="hsub">Informasi, layanan, dan kegiatan warga. Ketua RT: ${esc(s.ketua).replace(/\.$/,"")}</p>
   <div class="hbtn">${pub&&window.RT_WARGA?`<button class="btn" data-area="warga">${ic("warga")} Area Warga</button>`:""}${pub&&window.RT_AUTH?`<button class="btn ghost" data-area="pengurus">${ic("pengaturan")} Area Pengurus</button>`:""}</div></section>
  <nav class="qgrid" aria-label="Menu cepat">${nav.map(n=>`<button class="qt" data-sc="${n[0]}"><span class="qi">${ic(n[2])}</span><span>${n[1]}</span></button>`).join("")}</nav>
  <div id="s-info" style="scroll-margin-top:70px"></div><div class="grid g2" style="margin-top:6px">
   <div class="card lift"><p class="muted small">Pertemuan warga berikutnya</p>${np?`<h3 style="margin:4px 0">${fmtTgl(np.tanggal)}</h3><p class="small">${esc(s.jadwal.hari)}${s.jadwal.jam?", pukul "+esc(s.jadwal.jam):""}</p><p class="small muted">${np.tuanRumahNama?"Tuan rumah: "+esc(np.tuanRumahNama)+(np.alamat?" ("+esc(np.alamat)+")":""):"Tuan rumah akan diumumkan"}</p>`:`<h3 style="margin:4px 0">${esc(s.jadwal.hari)} pekan ke-${esc(s.jadwal.pekan)}</h3><p class="small muted">Setiap bulan${s.jadwal.jam?", pukul "+esc(s.jadwal.jam):""}. Tuan rumah bergilir dari rumah ke rumah.</p>`}</div>
   <div class="card lift"><p class="muted small">Pengumuman terbaru</p>${berita.length?berita.map(b=>`<p style="margin:8px 0 0"><b>${esc(b.judul)}</b><br><span class="small muted">${fmtTglS(b.tanggal)}</span></p>`).join(""):`<p class="small muted" style="margin-top:6px">Belum ada pengumuman.</p>`}</div></div>
  ${secH("kalender","Kalender kegiatan 12 bulan","Pertemuan warga, kegiatan RT, dan hari libur nasional")}${kalHtml()}
  ${secH("pengurus","Struktur pengurus RT","Ramping: 1 ketua, 2 pengurus inti, 3 seksi, dan koordinator lorong")}${strukturHtml()}
  ${secH("umkm","UMKM warga RT 09","Dukung usaha tetangga sendiri","<button class=\"btn sm\" data-umkm=\"1\">+ Daftarkan usaha</button>")}
  ${um.length?`<div class="grid ug">${um.map(u=>`<div class="card lift ucard">${u.foto?`<img class="uimg" src="${u.foto}" alt="${esc(u.nama)}" loading="lazy">`:`<div class="uimg ph">${esc((u.nama||"?").slice(0,1))}</div>`}<div class="ubody"><span class="pill p-gold">${esc(u.kategori||"Usaha")}</span><h3>${esc(u.nama)}</h3><p class="small muted">${esc(u.pemilik||"")}${u.alamat?" · "+esc(u.alamat):""}</p>${u.deskripsi?`<p class="small">${esc(u.deskripsi)}</p>`:""}<div class="ulinks">${u.wa?`<a class="btn sm pri" target="_blank" rel="noopener noreferrer" href="${waLnk(u.wa,"Halo, saya warga RT 09 melihat "+u.nama+" di halaman RT.")}">WhatsApp</a>`:""}${u.tautan&&/^https:\/\//i.test(u.tautan)?`<a class="btn sm" target="_blank" rel="noopener noreferrer" href="${esc(u.tautan)}">Kunjungi</a>`:""}</div></div></div>`).join("")}</div>`:`<div class="card empty">Belum ada usaha yang ditayangkan.<br>Punya usaha di RT 09? Daftarkan gratis lewat tombol di atas.</div>`}
  ${secH("produk","Produk RT 09","Merchandise resmi warga")}
  ${pr.length?`<div class="grid g2">${pr.map(p=>`<div class="card pcard">${p.foto?`<img class="pimg" src="${p.foto}" alt="${esc(p.nama)}" loading="lazy">`:`<div class="pimg ph">${tshirt}<span>Foto menyusul</span></div>`}<div class="pbody"><span class="pill ${p.status&&/tutup|habis/i.test(p.status)?"p-bad":"p-good"}">${esc(p.status||"Tersedia")}</span><h3>${esc(p.nama)}</h3><p class="small">${esc(p.deskripsi||"")}</p><p class="small"><b>${p.harga?rp(p.harga):"Harga diumumkan"}</b>${p.ukuran&&p.ukuran.length?" · Ukuran "+esc(p.ukuran.join(", ")):""}</p><button class="btn pri" data-pesan="${esc(p.id)}" ${p.status&&/tutup|habis/i.test(p.status)?"disabled":""}>Pesan sekarang</button></div></div>`).join("")}</div>`:`<div class="card empty">Belum ada produk.</div>`}
  ${as.length?secH("sewa","Fasilitas & sewa","Aset RT/RW yang dapat dipakai warga","<button class=\"btn sm\" data-sewa=\"1\">Ajukan pemakaian</button>")+`<div class="grid g2">${as.map(a=>`<div class="card"><span class="pill p-info">${esc(a.jenis||"Fasilitas")}</span><h3 style="margin:6px 0 2px">${esc(a.nama)}</h3><p class="small muted">${esc(a.lokasi||"")}${a.kapasitas?" · kapasitas "+esc(a.kapasitas):""}</p><p style="margin:8px 0"><b>${+a.tarif?rp(a.tarif)+" / "+esc(a.satuan||"acara"):"Gratis untuk warga"}</b></p>${a.aturan?`<p class="small">${esc(a.aturan)}</p>`:""}<button class="btn sm" data-sewa="${esc(a.id)}">Ajukan pemakaian</button></div>`).join("")}</div>${pj.length?`<p class="small" style="margin-top:10px"><b>Barang yang dapat dipinjam warga:</b> ${pj.map(i=>esc(i.nama)+(i.jumlah?" ("+esc(i.jumlah)+")":"")).join(", ")}.</p>`:""}`:""}
  ${cctvPub()}
  ${secH("lapor","Laporan & keluhan warga","Sampaikan masalah lingkungan, keamanan, atau pelayanan")}
  <div class="card lapcta"><div><h3>Ada yang perlu ditangani pengurus?</h3><p class="small muted">Isi formulir singkat. Nama dan nomor HP boleh dikosongkan.</p></div><button class="btn pri" data-lap="1">Tulis laporan</button></div>
  ${secH("bayar","Pembayaran iuran & kegiatan","Transfer ke rekening atas nama Bendahara, lalu konfirmasi ke pengurus")}
  <div class="card payc"><div class="bank">${rek.map(r=>`<div class="br"><div><span class="bn mono">${esc(fmtRek(r.no))}</span><br><span class="bm">${esc(r.bank)} · a.n. ${esc(r.an)}</span></div><button class="btn sm" data-copy="${esc(digits(r.no))}">Salin</button></div>`).join("")}</div>${s.qris?`<img src="${s.qris}" alt="Kode QRIS RT 09" class="qth" data-qz="1" title="Ketuk untuk memperbesar">`:`<div class="qph2">QRIS menyusul</div>`}</div>
  <p class="small muted" style="margin:10px 0 0">${esc(s.catatanBayar||"Cantumkan nama dan blok/nomor rumah pada berita transfer, lalu konfirmasi ke Bendahara.")}</p>
  <p class="hint" style="margin:30px 0 8px;text-align:center">${esc(s.namaRT)} / ${esc(s.rw)} · Kel. ${esc(s.kelurahan)} · ${esc(s.kota)}</p></div>`}

/* ===================== TAHAP 7 (b): admin, grafik, pembayaran, login ===================== */
const JN={laporan:["Laporan","p-warn"],pesanan:["Pesanan baju","p-gold"],umkm:["Usulan UMKM","p-info"],sewa:["Pengajuan sewa","p-mute"]};
const ST_M={baru:["Baru","p-warn"],diproses:["Diproses","p-info"],selesai:["Selesai","p-good"],ditolak:["Ditolak","p-bad"]};
const tglJam=s=>{if(!s)return "";const d=new Date(s);return isNaN(d)?"":d.toLocaleString("id-ID",{day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"})};
const jmlItems=it=>(it||[]).map(x=>x.ukuran+" × "+x.jumlah).join(", ");
async function saveDoc(path,arr,id,o){const c={...o};delete c.id;await put(path+"/"+id,c);upsert(arr,{...c,id})}
const newId=p=>p+"-"+Date.now();
/* ---------- kotak masuk ---------- */
function pesananRekap(l){const act=l.filter(x=>x.jenis==="pesanan"&&x.status!=="ditolak"),t={};let tot=0,nom=0;act.forEach(x=>(x.isi.items||[]).forEach(i=>{t[i.ukuran]=(t[i.ukuran]||0)+i.jumlah;tot+=i.jumlah;nom+=(x.isi.harga||0)*i.jumlah}));
  return `<div class="card" style="margin-bottom:12px"><h3>Rekap pesanan baju</h3><p class="small muted">${act.length} pemesan · ${tot} potong${nom?" · perkiraan "+rp(nom):""}</p><div class="chips" style="margin:10px 0 0">${Object.keys(t).map(k=>`<span class="pill p-gold">${esc(k)}: ${t[k]}</span>`).join("")||'<span class="muted small">Belum ada pesanan.</span>'}</div></div>`}
function vMasuk(){
  const l=S.msk.slice().sort((a,b)=>(b.dibuat||"").localeCompare(a.dibuat||"")),aktif=x=>x.status==="baru"||x.status==="diproses";
  const cnt=j=>l.filter(x=>(j==="semua"||x.jenis===j)&&aktif(x)).length;
  const f=l.filter(x=>(S.mTab==="semua"||x.jenis===S.mTab)&&(S.mSt==="semua"||(S.mSt==="aktif"?aktif(x):x.status===S.mSt)));
  const isi=x=>{const v=x.isi||{};
    if(x.jenis==="laporan")return `<p><b>${esc(v.kategori||"")}</b>${v.lokasi?" · "+esc(v.lokasi):""}</p><p class="small" style="white-space:pre-wrap">${esc(v.uraian||"")}</p><p class="small muted">Pelapor: ${esc(v.nama||"tanpa nama")}${v.hp?" · "+esc(v.hp):""}</p>`;
    if(x.jenis==="pesanan")return `<p><b>${esc(v.nama)}</b> · ${esc(v.hp||"")}${v.alamat?" · "+esc(v.alamat):""}</p><p class="small">${esc(v.produk||"")}: ${esc(jmlItems(v.items))}</p>${v.catatan?`<p class="small muted">${esc(v.catatan)}</p>`:""}`;
    if(x.jenis==="umkm")return `<p><b>${esc(v.nama)}</b> · ${esc(v.kategori||"")}</p><p class="small">Pemilik: ${esc(v.pemilik||"")}${v.alamat?" · "+esc(v.alamat):""}${v.wa?" · "+esc(v.wa):""}</p><p class="small muted">${esc(v.deskripsi||"")}</p>`;
    const bt=sewaBentrok(v.asetId,v.tanggal,v.jam1,v.jam2);return `<p><b>${esc(v.aset||"")}</b> · ${fmtTgl(v.tanggal)}${v.jam1?" · "+esc(v.jam1)+"-"+esc(v.jam2||""):""}</p><p class="small">${esc(v.nama)} · ${esc(v.hp||"")}</p><p class="small muted">${esc(v.keperluan||"")}</p>${bt?`<p class="small"><span class="pill p-bad">Bentrok dengan pemakaian lain (${esc(bt)})</span></p>`:""}`};
  return `<div class="row" style="margin-bottom:10px"><div><h2>Kotak masuk</h2><p class="muted small">Laporan warga, pesanan baju, usulan UMKM, dan pengajuan sewa dari halaman depan</p></div></div>
  <div class="chips">${[["semua","Semua"],["laporan","Laporan"],["pesanan","Pesanan baju"],["umkm","UMKM"],["sewa","Sewa"]].map(c=>`<button class="chipb" data-mtab="${c[0]}" aria-pressed="${S.mTab===c[0]}">${c[1]}${cnt(c[0])?` (${cnt(c[0])})`:""}</button>`).join("")}</div>
  <div class="chips">${[["aktif","Perlu ditindak"],["selesai","Selesai"],["ditolak","Ditolak"],["semua","Semua status"]].map(c=>`<button class="chipb" data-mst2="${c[0]}" aria-pressed="${S.mSt===c[0]}">${c[1]}</button>`).join("")}</div>
  ${S.mTab==="pesanan"?pesananRekap(l):""}
  <div class="grid">${f.map(x=>`<div class="card"><div class="row"><span><span class="pill ${JN[x.jenis]?JN[x.jenis][1]:"p-mute"}">${esc(JN[x.jenis]?JN[x.jenis][0]:x.jenis)}</span> <span class="pill ${ST_M[x.status]?ST_M[x.status][1]:"p-mute"}">${esc(ST_M[x.status]?ST_M[x.status][0]:x.status)}</span></span><span class="small muted">${tglJam(x.dibuat)}</span></div><div style="margin-top:8px">${isi(x)}</div>
   <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px">${x.status==="baru"?`<button class="btn sm" data-mset="${esc(x.id)}|diproses">Tandai diproses</button>`:""}${x.jenis==="umkm"&&aktif(x)?`<button class="btn sm pri" data-mtay="${esc(x.id)}">Tayangkan</button>`:""}${x.jenis==="sewa"&&aktif(x)?`<button class="btn sm pri" data-msew="${esc(x.id)}">Setujui & jadwalkan</button>`:""}${aktif(x)?`<button class="btn sm" data-mset="${esc(x.id)}|selesai">Selesai</button><button class="btn sm bad" data-mset="${esc(x.id)}|ditolak">Tolak</button>`:`<button class="btn sm" data-mset="${esc(x.id)}|baru">Buka lagi</button>`}${(x.isi&&x.isi.hp)||(x.isi&&x.isi.wa)?`<a class="btn sm" target="_blank" rel="noopener noreferrer" style="text-decoration:none;display:inline-flex;align-items:center" href="${waLnk((x.isi.hp||x.isi.wa),"Halo, kami dari pengurus RT 09 menindaklanjuti "+(JN[x.jenis]?JN[x.jenis][0].toLowerCase():"pesan")+" Anda.")}">Hubungi WhatsApp</a>`:""}<button class="btn sm bad" data-mdel="${esc(x.id)}">Hapus</button></div></div>`).join("")||'<div class="card empty">Tidak ada kiriman di kategori ini.</div>'}</div>`}
async function mStatus(id,st){const m=S.msk.find(x=>x.id===id);await saveDoc("masukan",S.msk,id,{...m,status:st});render()}
async function mTayang(id){const v=S.msk.find(x=>x.id===id).isi,uid=newId("u");await saveDoc("umkm",S.umkm,uid,{nama:v.nama,pemilik:v.pemilik,kategori:v.kategori,deskripsi:v.deskripsi,alamat:v.alamat,wa:v.wa,tautan:v.tautan||"",foto:"",aktif:true});await mStatus(id,"selesai");toast("Usaha ditayangkan. Tambahkan foto di Konten publik > UMKM.")}
async function sewaKal(sid,bk){await saveDoc("kalender",S.kal,"kal-"+sid,{judul:bk.aset+" terpakai",kategori:"Sewa fasilitas",tanggal:bk.tanggal,jam:bk.jam1?bk.jam1+"-"+(bk.jam2||""):"",jam1:bk.jam1||"",jam2:bk.jam2||"",asetId:bk.asetId,ket:"",publik:true,sewaId:sid})}
async function mSewa(id){const v=S.msk.find(x=>x.id===id).isi,bt=sewaBentrok(v.asetId,v.tanggal,v.jam1,v.jam2);if(bt){toast("Bentrok dengan pemakaian lain ("+bt+")");return}
  const a=S.aset.find(x=>x.id===v.asetId),sid=newId("sw"),bk={asetId:v.asetId,aset:v.aset,tanggal:v.tanggal,jam1:v.jam1||"",jam2:v.jam2||"",nama:v.nama,hp:v.hp,keperluan:v.keperluan,tarif:a?+a.tarif||0:0,bayar:"Belum",status:"disetujui"};
  await saveDoc("sewa",S.sewa,sid,bk);await sewaKal(sid,bk);await mStatus(id,"selesai");toast("Disetujui dan masuk kalender")}

/* ---------- aset & inventaris ---------- */
const KOND=["Baik","Rusak ringan","Rusak berat","Hilang"],SAT_A=["per jam","per hari","per acara"];
function invForm(x){openForm({title:x?"Ubah barang":"Tambah barang",wide:true,fields:[{id:"nama",label:"Nama barang",value:x?.nama},{id:"jumlah",label:"Jumlah",inputmode:"numeric",value:x?.jumlah??"1",half:true},{id:"satuan",label:"Satuan",value:x?.satuan||"unit",half:true},{id:"kondisi",label:"Kondisi",type:"select",options:KOND,value:x?.kondisi||"Baik",half:true},{id:"tahun",label:"Tahun perolehan",inputmode:"numeric",value:x?.tahun,half:true},{id:"lokasi",label:"Disimpan di",value:x?.lokasi,half:true},{id:"pj",label:"Penanggung jawab",value:x?.pj,half:true},{id:"pinjam",label:"Boleh dipinjam warga",type:"check",value:x?.pinjam},{id:"catatan",label:"Catatan",value:x?.catatan}],
  save:async v=>{if(!v.nama)return{error:"Nama barang wajib diisi."};await saveDoc("inventaris",S.inv,x?.id||newId("i"),{...(x||{}),...v,jumlah:parseInt(digits(v.jumlah))||0,tahun:v.tahun});render();toast("Tersimpan")}})}
function asetForm(x){openForm({title:x?"Ubah fasilitas":"Tambah fasilitas",wide:true,fields:[{id:"nama",label:"Nama fasilitas",value:x?.nama,ph:"Contoh: Lapangan RT 09"},{id:"jenis",label:"Jenis",type:"select",options:["Gedung / balai warga","Lapangan","Taman","Pos & sarana lain","Lainnya"],value:x?.jenis||"Lapangan",half:true},{id:"lokasi",label:"Lokasi",value:x?.lokasi,half:true},{id:"kapasitas",label:"Kapasitas",value:x?.kapasitas,half:true},{id:"pengelola",label:"Pengelola",value:x?.pengelola,half:true},{id:"tarif",label:"Tarif sewa (Rp, 0 = gratis)",inputmode:"numeric",value:x?.tarif??"0",half:true},{id:"satuan",label:"Satuan tarif",type:"select",options:SAT_A,value:x?.satuan||"per acara",half:true},{id:"aturan",label:"Aturan pemakaian",type:"textarea",rows:3,value:x?.aturan,ph:"Jam, kebersihan, uang jaminan, dll."},{id:"aktif",label:"Tampilkan di halaman depan",type:"check",value:x?x.aktif!==false:true}],
  save:async v=>{if(!v.nama)return{error:"Nama fasilitas wajib diisi."};await saveDoc("aset",S.aset,x?.id||newId("a"),{...(x||{}),...v,tarif:parseInt(digits(v.tarif))||0});render();toast("Tersimpan")}})}
function sewaForm2(x){const lb=S.aset.map(a=>a.nama);if(!lb.length){toast("Tambahkan fasilitas lebih dulu");return}
  openForm({title:x?"Ubah pemakaian":"Catat pemakaian fasilitas",wide:true,fields:[{id:"aset",label:"Fasilitas",type:"select",options:lb,value:x?.aset||lb[0]},{id:"tanggal",label:"Tanggal",type:"date",value:x?.tanggal,half:true},{id:"jam1",label:"Mulai",type:"time",value:x?.jam1,half:true},{id:"jam2",label:"Selesai",type:"time",value:x?.jam2,half:true},{id:"nama",label:"Penyewa",value:x?.nama,half:true},{id:"hp",label:"No. HP",value:x?.hp,half:true},{id:"keperluan",label:"Keperluan",value:x?.keperluan},{id:"tarif",label:"Biaya (Rp)",inputmode:"numeric",value:x?.tarif??"0",half:true},{id:"bayar",label:"Pembayaran",type:"select",options:["Belum","DP","Lunas"],value:x?.bayar||"Belum",half:true},{id:"status",label:"Status",type:"select",options:["disetujui","selesai","batal"],value:x?.status||"disetujui"}],
  save:async v=>{if(!v.tanggal||!v.nama)return{error:"Tanggal dan penyewa wajib diisi."};const a=S.aset.find(z=>z.nama===v.aset);const id=x?.id||newId("sw");
   if(v.status!=="batal"){const bt=S.kal.find(k=>k.kategori==="Sewa fasilitas"&&k.asetId===a.id&&k.sewaId!==id&&k.tanggal===v.tanggal&&(!(v.jam1&&v.jam2&&k.jam1&&k.jam2)||(v.jam1<k.jam2&&k.jam1<v.jam2)));if(bt)return{error:"Bentrok dengan pemakaian lain pada tanggal itu."}}
   const bk={...(x||{}),...v,asetId:a.id,tarif:parseInt(digits(v.tarif))||0};await saveDoc("sewa",S.sewa,id,bk);
   if(v.status==="batal"){await del("kalender/kal-"+id);S.kal=S.kal.filter(k=>k.id!=="kal-"+id)}else await sewaKal(id,bk);render();toast("Tersimpan")}})}
function vAset(){
  const T=[["inv","Inventaris"],["aset","Fasum & fasos"],["sewa","Pemakaian & sewa"],["cctv","CCTV"]];
  const head=`<div class="row" style="margin-bottom:10px"><div><h2>Aset & inventaris</h2><p class="muted small">Barang milik RT dan fasilitas yang dikelola RT/RW</p></div></div><div class="chips">${T.map(t=>`<button class="chipb" data-atab="${t[0]}" aria-pressed="${S.aTab===t[0]}">${t[1]}</button>`).join("")}</div>`;
  if(S.aTab==="cctv")return vCctv(head);
  if(S.aTab==="inv"){const l=S.inv.slice().sort((a,b)=>a.nama.localeCompare(b.nama)),tot=l.reduce((s,x)=>s+(+x.jumlah||0),0),baik=l.filter(x=>x.kondisi==="Baik").length;
    return head+`<div class="grid g4" style="margin-bottom:12px"><div class="card stat"><b>${l.length}</b><span>Jenis barang</span></div><div class="card stat"><b>${tot}</b><span>Total unit</span></div><div class="card stat"><b>${l.length?Math.round(baik/l.length*100):0}%</b><span>Kondisi baik</span></div><div class="card stat"><b>${l.filter(x=>x.pinjam).length}</b><span>Dapat dipinjam</span></div></div>
    <div class="row" style="margin-bottom:8px"><span class="muted small">${l.length} barang tercatat</span><button class="btn pri sm" id="addInv">+ Tambah barang</button></div>
    <div class="card scroll" style="padding:6px">${l.length?`<table class="tbl"><thead><tr><th>Barang</th><th class="r">Jumlah</th><th>Kondisi</th><th>Disimpan di</th><th>Dipinjam?</th><th></th></tr></thead><tbody>${l.map(x=>`<tr><td><b>${esc(x.nama)}</b>${x.catatan?`<p class="small muted">${esc(x.catatan)}</p>`:""}</td><td class="num r">${esc(x.jumlah)} ${esc(x.satuan||"")}</td><td><span class="pill ${x.kondisi==="Baik"?"p-good":x.kondisi==="Rusak ringan"?"p-warn":"p-bad"}">${esc(x.kondisi||"-")}</span></td><td class="small">${esc(x.lokasi||"-")}${x.pj?`<br><span class="muted">PJ: ${esc(x.pj)}</span>`:""}</td><td>${x.pinjam?'<span class="pill p-info">Boleh</span>':'<span class="muted small">Tidak</span>'}</td><td style="white-space:nowrap"><button class="btn sm" data-iedit="${esc(x.id)}">Ubah</button> <button class="btn sm bad" data-idel="${esc(x.id)}">Hapus</button></td></tr>`).join("")}</tbody></table>`:'<div class="empty">Belum ada barang. Catat tenda, kursi, meja, pengeras suara, dan aset lain milik RT.</div>'}</div>`}
  if(S.aTab==="aset"){const l=S.aset.slice().sort((a,b)=>a.nama.localeCompare(b.nama));return head+`<div class="row" style="margin-bottom:8px"><span class="muted small">${l.length} fasilitas</span><button class="btn pri sm" id="addAset">+ Tambah fasilitas</button></div><div class="grid g2">${l.map(a=>`<div class="card"><div class="row"><span class="pill p-info">${esc(a.jenis||"")}</span>${a.aktif===false?'<span class="pill p-mute">Disembunyikan</span>':""}</div><h3 style="margin:6px 0 2px">${esc(a.nama)}</h3><p class="small muted">${esc(a.lokasi||"-")}${a.kapasitas?" · kapasitas "+esc(a.kapasitas):""}${a.pengelola?" · pengelola "+esc(a.pengelola):""}</p><p style="margin:6px 0"><b>${+a.tarif?rp(a.tarif)+" / "+esc(a.satuan||""):"Gratis"}</b></p>${a.aturan?`<p class="small">${esc(a.aturan)}</p>`:""}<div style="display:flex;gap:6px;margin-top:8px"><button class="btn sm" data-aedit="${esc(a.id)}">Ubah</button><button class="btn sm bad" data-adel="${esc(a.id)}">Hapus</button></div></div>`).join("")||'<div class="card empty">Belum ada fasilitas. Tambahkan gedung, lapangan, taman, atau pos yang dikelola RT/RW.</div>'}</div>`}
  const l=S.sewa.slice().sort((a,b)=>(b.tanggal||"").localeCompare(a.tanggal||"")),inc=l.filter(x=>x.status!=="batal"&&x.bayar==="Lunas").reduce((s,x)=>s+(+x.tarif||0),0),piu=l.filter(x=>x.status!=="batal"&&x.bayar!=="Lunas").reduce((s,x)=>s+(+x.tarif||0),0);
  return head+`<div class="grid g4" style="margin-bottom:12px"><div class="card stat"><b>${l.filter(x=>x.status==="disetujui").length}</b><span>Akan datang</span></div><div class="card stat"><b>${rp(inc)}</b><span>Sudah lunas</span></div><div class="card stat"><b>${rp(piu)}</b><span>Belum lunas</span></div></div><div class="row" style="margin-bottom:8px"><span class="muted small">Pengajuan dari warga masuk lewat Kotak masuk</span><button class="btn pri sm" id="addSewa">+ Catat pemakaian</button></div>
  <div class="card scroll" style="padding:6px">${l.length?`<table class="tbl"><thead><tr><th>Tanggal</th><th>Fasilitas</th><th>Penyewa</th><th class="r">Biaya</th><th>Bayar</th><th>Status</th><th></th></tr></thead><tbody>${l.map(x=>`<tr><td>${fmtTglS(x.tanggal)}${x.jam1?`<p class="small muted">${esc(x.jam1)}-${esc(x.jam2||"")}</p>`:""}</td><td><b>${esc(x.aset)}</b></td><td>${esc(x.nama)}<p class="small muted">${esc(x.keperluan||"")}</p></td><td class="num r">${x.tarif?rp(x.tarif):"Gratis"}</td><td><span class="pill ${x.bayar==="Lunas"?"p-good":x.bayar==="DP"?"p-warn":"p-mute"}">${esc(x.bayar||"-")}</span></td><td><span class="pill ${x.status==="batal"?"p-bad":x.status==="selesai"?"p-good":"p-info"}">${esc(x.status)}</span></td><td style="white-space:nowrap"><button class="btn sm" data-sedit2="${esc(x.id)}">Ubah</button> <button class="btn sm bad" data-sdel2="${esc(x.id)}">Hapus</button></td></tr>`).join("")}</tbody></table>`:'<div class="empty">Belum ada pemakaian tercatat.</div>'}</div>`}

/* ---------- konten publik ---------- */
function kalForm(x){openForm({title:x?"Ubah agenda":"Tambah agenda",wide:true,fields:[{id:"judul",label:"Nama kegiatan",value:x?.judul},{id:"kategori",label:"Jenis",type:"select",options:KAT_K,value:x?.kategori||KAT_K[0],half:true},{id:"tanggal",label:"Tanggal",type:"date",value:x?.tanggal,half:true},{id:"tanggalAkhir",label:"Sampai tanggal (bila lebih dari sehari)",type:"date",value:x?.tanggalAkhir,half:true},{id:"jam",label:"Jam",value:x?.jam,ph:"08.00 - selesai",half:true},{id:"tempat",label:"Tempat",value:x?.tempat},{id:"ket",label:"Keterangan",value:x?.ket},{id:"publik",label:"Tampilkan di halaman depan",type:"check",value:x?x.publik!==false:true}],
  save:async v=>{if(!v.judul||!v.tanggal)return{error:"Nama kegiatan dan tanggal wajib diisi."};if(v.tanggalAkhir&&v.tanggalAkhir<v.tanggal)return{error:"Tanggal akhir sebelum tanggal mulai."};await saveDoc("kalender",S.kal,x?.id||newId("kal"),{...(x||{}),...v});render();toast("Tersimpan")}})}
function umkmForm(x){openForm({title:x?"Ubah usaha":"Tambah usaha",wide:true,fields:[{id:"nama",label:"Nama usaha",value:x?.nama},{id:"pemilik",label:"Pemilik",value:x?.pemilik,half:true},{id:"kategori",label:"Kategori",type:"select",options:["Makanan & minuman","Toko & warung","Jasa","Fashion","Kerajinan","Pendidikan & kursus","Kesehatan & kecantikan","Lainnya"],value:x?.kategori||"Makanan & minuman",half:true},{id:"deskripsi",label:"Deskripsi",type:"textarea",rows:3,value:x?.deskripsi},{id:"alamat",label:"Alamat",value:x?.alamat,half:true},{id:"wa",label:"WhatsApp",value:x?.wa,inputmode:"tel",half:true},{id:"tautan",label:"Instagram / toko online",value:x?.tautan,ph:"https://"},{id:"aktif",label:"Tayangkan",type:"check",value:x?x.aktif!==false:true}],
  save:async v=>{if(!v.nama)return{error:"Nama usaha wajib diisi."};if(v.tautan&&!/^https:\/\//i.test(v.tautan))return{error:"Tautan harus diawali https://"};await saveDoc("umkm",S.umkm,x?.id||newId("u"),{...(x||{}),...v});render();toast("Tersimpan")}})}
function prodForm(x){openForm({title:x?"Ubah produk":"Tambah produk",wide:true,fields:[{id:"nama",label:"Nama produk",value:x?.nama},{id:"deskripsi",label:"Deskripsi",type:"textarea",rows:3,value:x?.deskripsi},{id:"harga",label:"Harga (Rp, kosong = belum ditentukan)",inputmode:"numeric",value:x?.harga||"",half:true},{id:"status",label:"Status",type:"select",options:["Pre-order dibuka","Tersedia","Pre-order ditutup","Habis"],value:x?.status||"Pre-order dibuka",half:true},{id:"ukuran",label:"Ukuran (pisahkan koma)",value:(x?.ukuran||["S","M","L","XL","XXL","3XL"]).join(", ")},{id:"aktif",label:"Tampilkan di halaman depan",type:"check",value:x?x.aktif!==false:true}],
  save:async v=>{if(!v.nama)return{error:"Nama produk wajib diisi."};await saveDoc("produk",S.prod,x?.id||newId("pr"),{...(x||{}),nama:v.nama,deskripsi:v.deskripsi,status:v.status,aktif:v.aktif,harga:parseInt(digits(v.harga))||null,ukuran:v.ukuran.split(",").map(s=>s.trim()).filter(Boolean),urut:x?.urut||9});render();toast("Tersimpan")}})}
async function strukturSimpan(l){const n={...S.set,struktur:l};await put("pengaturan/rt",n);S.set=n;render()}
function strForm(i){const l=(S.set.struktur||[]).slice(),x=i>=0?l[i]:null,LV=["Pimpinan","Pengurus inti","Seksi","Koordinator lapangan"];
  openForm({title:x?"Ubah jabatan":"Tambah jabatan",fields:[{id:"jabatan",label:"Jabatan",value:x?.jabatan},{id:"nama",label:"Nama",value:x?.nama},{id:"tugas",label:"Tugas utama",value:x?.tugas},{id:"level",label:"Tingkat",type:"select",options:LV,value:LV[x?+x.level||0:2]}],
  save:async v=>{if(!v.jabatan)return{error:"Jabatan wajib diisi."};const o={jabatan:v.jabatan,nama:v.nama,tugas:v.tugas,level:LV.indexOf(v.level)};if(x)l[i]=o;else l.push(o);await strukturSimpan(l);toast("Tersimpan")}})}
function vKonten(){
  const T=[["kalender","Kalender"],["umkm","UMKM"],["produk","Produk"],["struktur","Struktur"]];
  const head=`<div class="row" style="margin-bottom:10px"><div><h2>Konten halaman depan</h2><p class="muted small">Yang diatur di sini tampil untuk umum tanpa login</p></div><button class="btn sm" data-tab="depan">Lihat halaman depan</button></div><div class="chips">${T.map(t=>`<button class="chipb" data-ptab="${t[0]}" aria-pressed="${S.pTab===t[0]}">${t[1]}</button>`).join("")}</div>`;
  if(S.pTab==="kalender"){const l=S.kal.filter(k=>k.kategori!=="Sewa fasilitas").sort((a,b)=>a.tanggal.localeCompare(b.tanggal));return head+`<div class="row" style="margin-bottom:8px"><p class="muted small" style="max-width:520px">Pertemuan bulanan dan hari libur nasional terisi otomatis. Tambahkan kegiatan lain di sini. Pemakaian fasilitas masuk otomatis dari menu Aset.</p><button class="btn pri sm" id="addKal">+ Tambah agenda</button></div><div class="card scroll" style="padding:6px">${l.length?`<table class="tbl"><thead><tr><th>Tanggal</th><th>Kegiatan</th><th>Jenis</th><th></th></tr></thead><tbody>${l.map(k=>`<tr><td>${fmtTglS(k.tanggal)}${k.tanggalAkhir?` - ${fmtTglS(k.tanggalAkhir)}`:""}</td><td><b>${esc(k.judul)}</b><p class="small muted">${esc([k.jam,k.tempat,k.ket].filter(Boolean).join(" · "))}</p></td><td><span class="pill p-info">${esc(k.kategori||"")}</span>${k.publik===false?' <span class="pill p-mute">internal</span>':""}</td><td style="white-space:nowrap"><button class="btn sm" data-kedit="${esc(k.id)}">Ubah</button> <button class="btn sm bad" data-kdel="${esc(k.id)}">Hapus</button></td></tr>`).join("")}</tbody></table>`:'<div class="empty">Belum ada agenda tambahan. Contoh: kerja bakti, lomba 17 Agustus, bazar, qurban.</div>'}</div>`}
  if(S.pTab==="umkm"){const l=S.umkm.slice().sort((a,b)=>a.nama.localeCompare(b.nama));return head+`<div class="row" style="margin-bottom:8px"><span class="muted small">${l.length} usaha. Usulan warga masuk lewat Kotak masuk.</span><button class="btn pri sm" id="addUmkm">+ Tambah usaha</button></div><div class="grid g2">${l.map(u=>`<div class="card"><div class="row"><span class="pill p-gold">${esc(u.kategori||"")}</span>${u.aktif===false?'<span class="pill p-mute">Disembunyikan</span>':""}</div><h3 style="margin:6px 0 2px">${esc(u.nama)}</h3><p class="small muted">${esc(u.pemilik||"")}${u.alamat?" · "+esc(u.alamat):""}</p>${u.foto?`<img src="${u.foto}" alt="" style="width:100%;max-height:140px;object-fit:cover;border-radius:8px;margin:8px 0">`:""}<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px"><button class="btn sm" data-uedit="${esc(u.id)}">Ubah</button><button class="btn sm" data-ufoto="${esc(u.id)}">Foto</button><button class="btn sm bad" data-udel="${esc(u.id)}">Hapus</button></div></div>`).join("")||'<div class="card empty">Belum ada usaha tayang.</div>'}</div>`}
  if(S.pTab==="produk"){const l=S.prod.slice().sort((a,b)=>(a.urut||9)-(b.urut||9));return head+`<div class="row" style="margin-bottom:8px"><span class="muted small">Pesanan warga masuk di Kotak masuk, lengkap dengan rekap per ukuran.</span><button class="btn pri sm" id="addProd">+ Tambah produk</button></div><div class="grid g2">${l.map(p=>`<div class="card"><div class="row"><span class="pill p-good">${esc(p.status||"")}</span>${p.aktif===false?'<span class="pill p-mute">Disembunyikan</span>':""}</div><h3 style="margin:6px 0 2px">${esc(p.nama)}</h3><p class="small muted">${p.harga?rp(p.harga):"Harga belum ditentukan"} · ukuran ${esc((p.ukuran||[]).join(", "))}</p><div class="pimg ${p.foto?"":"ph"}" style="margin:8px 0;height:140px">${p.foto?`<img src="${p.foto}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:8px">`:tshirt+"<span>Foto menyusul</span>"}</div><div style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn sm" data-pedit="${esc(p.id)}">Ubah</button><button class="btn sm pri" data-pfoto="${esc(p.id)}">Unggah foto</button><button class="btn sm bad" data-pdel="${esc(p.id)}">Hapus</button></div></div>`).join("")||'<div class="card empty">Belum ada produk.</div>'}</div>`}
  const st=(S.set.struktur||[]);return head+`<div class="row" style="margin-bottom:8px"><p class="muted small" style="max-width:560px">Prinsip ramping: satu ketua, dua pengurus inti (sekretaris dan bendahara), tiga seksi yang memegang kegiatan, dan koordinator lorong sebagai penghubung ke warga. Satu orang boleh merangkap. Tanpa wakil ketua agar rantai keputusan pendek.</p><button class="btn pri sm" id="addStr">+ Tambah jabatan</button></div>${strukturHtml()}<div class="card scroll" style="padding:6px;margin-top:14px"><table class="tbl"><thead><tr><th>Jabatan</th><th>Nama</th><th>Tugas utama</th><th></th></tr></thead><tbody>${st.map((n,i)=>`<tr><td><b>${esc(n.jabatan)}</b></td><td>${esc(n.nama||"-")}</td><td class="small">${esc(n.tugas||"")}</td><td style="white-space:nowrap"><button class="btn sm" data-sup="${i}" ${i?"":"disabled"} aria-label="Naikkan">▲</button> <button class="btn sm" data-sdn="${i}" ${i<st.length-1?"":"disabled"} aria-label="Turunkan">▼</button> <button class="btn sm" data-sstr="${i}">Ubah</button> <button class="btn sm bad" data-sxs="${i}">Hapus</button></td></tr>`).join("")}</tbody></table></div>`}

/* ---------- pembayaran ---------- */
function bayarForm(){const s=S.set;openForm({title:"Rekening pembayaran",wide:true,fields:[{id:"rek",label:"Rekening (satu baris per bank)",type:"textarea",rows:4,value:(s.rekening||[]).map(r=>r.bank+" | "+fmtRek(r.no)+" | "+r.an).join("\n"),hint:"Format: Bank | Nomor rekening | Atas nama"},{id:"cat",label:"Catatan pembayaran",value:s.catatanBayar,ph:"Cantumkan nama dan blok/nomor rumah pada berita transfer"}],
  save:async v=>{const rek=parseLines(v.rek).map(l=>{const p=l.split("|").map(x=>x.trim());return {bank:p[0],no:(p[1]||"").replace(/[^\d ]/g,"").trim(),an:p[2]||""}}).filter(r=>r.bank&&r.no);const n={...s,rekening:rek,catatanBayar:v.cat};await put("pengaturan/rt",n);S.set=n;render();toast("Tersimpan")}})}
function qrisForm(){fotoForm("Gambar QRIS",S.set.qris,async d=>{const n={...S.set,qris:d};await put("pengaturan/rt",n);S.set=n;render()},true)}

/* ---------- grafik arus kas ---------- */
const kasSer=sel=>{const by={},src=S.kas.filter(k=>sel==="gab"||k.jenis===sel);src.forEach(k=>{const b=by[k.periode]||(by[k.periode]={p:k.periode,masuk:0,keluar:0,saldo:0,det:[]});b.masuk+=k.totalMasuk||0;b.keluar+=k.totalKeluar||0;(k.pengeluaran||[]).forEach(x=>b.det.push(x))});
  Object.values(by).forEach(b=>{b.saldo=["kasRT","kasIbu"].filter(j=>sel==="gab"||j===sel).reduce((t,j)=>{const l=src.filter(k=>k.jenis===j&&k.periode<=b.p).sort((x,y)=>y.periode.localeCompare(x.periode))[0];return t+(l?l.saldoAkhir||0:0)},0)});return Object.values(by).sort((a,b)=>a.p.localeCompare(b.p))};
const niceMax=v=>{if(v<=0)return 1;const p=Math.pow(10,Math.floor(Math.log10(v))),n=v/p;return (n<=1?1:n<=2?2:n<=2.5?2.5:n<=5?5:10)*p};
const rpS=n=>{n=Number(n||0);const a=Math.abs(n);return (n<0?"-":"")+(a>=1e6?(a/1e6).toFixed(a%1e6?1:0).replace(".",",")+" jt":a>=1e3?Math.round(a/1e3)+" rb":a)};
const chartW=()=>{const mw=innerWidth>=860?Math.min(innerWidth-300,1100):innerWidth-32;return mw>=900?Math.floor((mw-14)/2)-34:Math.max(260,mw-34)};
const cMon=p=>BLN3[+p.slice(5)-1]+" "+p.slice(2,4);
function barChart(ser,W){const H=250,pl=46,pr=8,pt=12,pb=32,iw=W-pl-pr,ih=H-pt-pb,keys=[["masuk","Pemasukan","var(--c1)"],["keluar","Pengeluaran","var(--c2)"]].filter(k=>!S.hide[k[0]]);
  const mx=niceMax(Math.max(1,...ser.flatMap(s=>keys.map(k=>s[k[0]])))),gw=iw/ser.length,bw=Math.max(8,Math.min(28,gw*.72/Math.max(1,keys.length)));let g="";
  for(let i=0;i<=4;i++){const y=pt+ih-ih*i/4;g+=`<line x1="${pl}" x2="${W-pr}" y1="${y}" y2="${y}" class="vg"/><text x="${pl-6}" y="${y+4}" class="vt" text-anchor="end">${rpS(mx*i/4)}</text>`}
  ser.forEach((s,i)=>{const cx=pl+gw*i+gw/2,tw=keys.length*bw+(keys.length-1)*3;keys.forEach((k,j)=>{const h=Math.max(2,ih*s[k[0]]/mx);g+=`<rect class="gb" x="${(cx-tw/2+j*(bw+3)).toFixed(1)}" y="${(pt+ih-h).toFixed(1)}" width="${bw}" height="${h.toFixed(1)}" rx="4" fill="${k[2]}" style="--d:${i*90+j*60}ms" data-tip="${esc(perLabel(s.p))}|${k[1]}|${rp(s[k[0]])}"/>`});g+=`<text x="${cx}" y="${H-10}" class="vt" text-anchor="middle">${cMon(s.p)}</text>`});
  return `<svg class="cs" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Pemasukan dan pengeluaran per bulan">${g}<line x1="${pl}" x2="${W-pr}" y1="${pt+ih}" y2="${pt+ih}" class="va"/></svg>`}
function lineChart(ser,W){const H=230,pl=46,pr=18,pt=16,pb=32,iw=W-pl-pr,ih=H-pt-pb,mx=niceMax(Math.max(1,...ser.map(s=>s.saldo))),X=i=>pl+(ser.length<2?iw/2:iw*i/(ser.length-1)),Y=v=>pt+ih-ih*Math.max(0,v)/mx;let g="";
  for(let i=0;i<=4;i++){const y=pt+ih-ih*i/4;g+=`<line x1="${pl}" x2="${W-pr}" y1="${y}" y2="${y}" class="vg"/><text x="${pl-6}" y="${y+4}" class="vt" text-anchor="end">${rpS(mx*i/4)}</text>`}
  const d=ser.map((s,i)=>(i?"L":"M")+X(i).toFixed(1)+" "+Y(s.saldo).toFixed(1)).join(" ");
  g+=`<path d="${d}" pathLength="1" class="gl" fill="none" stroke="var(--c3)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/><line id="xh" class="xh" y1="${pt}" y2="${pt+ih}" x1="0" x2="0" hidden/>`;
  ser.forEach((s,i)=>{g+=`<circle class="gd" cx="${X(i).toFixed(1)}" cy="${Y(s.saldo).toFixed(1)}" r="5" fill="var(--c3)" stroke="var(--surface)" stroke-width="2" style="--d:${500+i*90}ms"/><text x="${X(i)}" y="${H-10}" class="vt" text-anchor="middle">${cMon(s.p)}</text>`});
  const l=ser[ser.length-1];g+=`<text x="${X(ser.length-1)}" y="${Y(l.saldo)-11}" class="vl" text-anchor="${ser.length>1?"end":"middle"}">${rpS(l.saldo)}</text>`;
  const pts=ser.map((s,i)=>X(i).toFixed(1)+"~"+esc(perLabel(s.p))+"~Saldo akhir~"+rp(s.saldo)).join(";");
  return `<svg class="cs lc" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Saldo kas per bulan" data-pts="${pts}" data-top="${pt}">${g}<line x1="${pl}" x2="${W-pr}" y1="${pt+ih}" y2="${pt+ih}" class="va"/><rect x="${pl}" y="${pt}" width="${iw}" height="${ih}" fill="transparent" class="hit"/></svg>`}
function donutChart(items){const tot=items.reduce((s,x)=>s+x.v,0);if(!tot)return '<p class="empty small">Belum ada pengeluaran tercatat.</p>';const R=62,C=2*Math.PI*R;let cum=0,g="";
  items.forEach((x,i)=>{const p=x.v/tot*100,len=Math.max(0,p-.9);g+=`<circle class="ds" cx="95" cy="95" r="${R}" fill="none" stroke="${x.c}" stroke-width="28" stroke-dasharray="${len} ${100-len}" stroke-dashoffset="${-cum}" pathLength="100" transform="rotate(-90 95 95)" style="--d:${i*110}ms" data-i="${i}" data-tip="${esc(x.n)}|${Math.round(p)}%|${rp(x.v)}"/>`;cum+=p});
  return `<div class="dn"><svg class="cs" viewBox="0 0 190 190" width="190" height="190" role="img" aria-label="Komposisi pengeluaran">${g}<text x="95" y="90" class="dv" text-anchor="middle" id="dnv">${rpS(tot)}</text><text x="95" y="108" class="vt" text-anchor="middle" id="dnl">total keluar</text></svg><ul class="dleg">${items.map(x=>`<li><u style="background:${x.c}"></u><span>${esc(x.n)}</span><b class="num">${Math.round(x.v/tot*100)}%</b></li>`).join("")}</ul></div>`}
function piuBars(){const cur=piuList("warga")[0];if(!cur||!cur.items.length)return '<p class="empty small">Belum ada piutang.</p>';const it=cur.items.slice().sort((a,b)=>b.jumlah-a.jumlah).slice(0,8),mx=it[0].jumlah;
  return `<p class="small muted" style="margin-bottom:8px">Per ${perLabel(cur.periode)}, ${cur.items.length} KK, total ${rp(cur.total)}</p>${it.map((x,i)=>`<div class="hb"><span class="hn">${esc(x.nama)}</span><span class="ht"><i class="hbar" style="width:${Math.max(3,x.jumlah/mx*100)}%;--d:${i*70}ms" data-tip="${esc(x.nama)}|Piutang|${rp(x.jumlah)}"></i></span><b class="num">${rpS(x.jumlah)}</b></div>`).join("")}`}
function grafikView(){
  const sel=S.cSel,ser=kasSer(sel),COL=["var(--c1)","var(--c2)","var(--c3)","var(--c4)","var(--c5)"];
  const sw=[["gab","Gabungan"],["kasRT","Kas Bapak-Bapak"],["kasIbu","Kas ibu-ibu"]];
  const ctl=`<div class="row" style="margin-bottom:12px"><div class="chips" style="margin:0">${sw.map(c=>`<button class="chipb" data-csel="${c[0]}" aria-pressed="${sel===c[0]}">${c[1]}</button>`).join("")}</div><button class="btn sm" id="replay">Putar ulang animasi</button></div>`;
  if(!ser.length)return ctl+'<div class="card empty">Belum ada data kas untuk digrafikkan.</div>';
  const last=ser[ser.length-1],prev=ser[ser.length-2],sm=ser.reduce((s,x)=>s+x.masuk,0),sk=ser.reduce((s,x)=>s+x.keluar,0),dl=prev?last.saldo-prev.saldo:0,W=chartW();
  const ex={};ser.forEach(s=>s.det.forEach(x=>{const k=String(x.ket||"Lainnya").trim().toLowerCase();ex[k]=(ex[k]||{n:String(x.ket||"Lainnya").trim(),v:0});ex[k].v+=x.jumlah||0}));
  let ei=Object.values(ex).sort((a,b)=>b.v-a.v);if(ei.length>5){const rest=ei.slice(4).reduce((s,x)=>s+x.v,0);ei=ei.slice(0,4).concat([{n:"Lainnya",v:rest}])}ei=ei.map((x,i)=>({...x,c:x.n==="Lainnya"&&ei.length===5&&i===4?"var(--vmut)":COL[i]}));
  const tile=(v,l,x)=>`<div class="card stat"><b class="cnt" data-v="${Math.round(v)}">${rp(v)}</b><span>${l}</span>${x||""}</div>`;
  const tbl=`<details class="card" style="margin-top:14px"><summary style="cursor:pointer;font-weight:600">Lihat sebagai tabel</summary><div class="scroll"><table class="tbl"><thead><tr><th>Bulan</th><th class="r">Pemasukan</th><th class="r">Pengeluaran</th><th class="r">Saldo akhir</th></tr></thead><tbody>${ser.map(s=>`<tr><td>${perLabel(s.p)}</td><td class="num r">${rp(s.masuk)}</td><td class="num r">${rp(s.keluar)}</td><td class="num r">${rp(s.saldo)}</td></tr>`).join("")}</tbody></table></div></details>`;
  return ctl+`<div class="charts ${S.cAnim&&!matchMedia("(prefers-reduced-motion:reduce)").matches?"anim":"static"}"><div class="grid g4" style="margin-bottom:14px">${tile(last.saldo,"Saldo akhir "+cMon(last.p),prev?`<p class="small" style="margin-top:4px"><span class="pill ${dl>=0?"p-good":"p-bad"}">${dl>=0?"▲ naik ":"▼ turun "}${rp(Math.abs(dl))}</span> dari bulan lalu</p>`:"")}${tile(sm,"Total pemasukan ("+ser.length+" bulan)")}${tile(sk,"Total pengeluaran")}${tile(sm-sk,"Selisih pemasukan dikurangi pengeluaran")}</div>
  <div class="grid g2"><div class="card viz"><div class="row"><h3>Pemasukan dan pengeluaran</h3><span class="vleg">${[["masuk","Pemasukan","var(--c1)"],["keluar","Pengeluaran","var(--c2)"]].map(k=>`<button class="lg" data-hide="${k[0]}" aria-pressed="${!S.hide[k[0]]}"><u style="background:${k[2]}"></u>${k[1]}</button>`).join("")}</span></div>${barChart(ser,W)}</div>
  <div class="card viz"><h3>Saldo kas per bulan</h3>${lineChart(ser,W)}</div>
  <div class="card viz"><h3>Ke mana uang keluar</h3><p class="small muted" style="margin-bottom:6px">Komposisi seluruh pengeluaran. Arahkan kursor atau ketuk irisan.</p>${donutChart(ei)}</div>
  <div class="card viz"><h3>Piutang terbesar</h3>${piuBars()}</div></div>${tbl}</div>`}
function runCounters(){if(matchMedia("(prefers-reduced-motion:reduce)").matches)return;document.querySelectorAll(".cnt").forEach(el=>{const v=+el.dataset.v,t0=performance.now(),D=900;const f=t=>{const k=Math.min(1,(t-t0)/D),e=1-Math.pow(1-k,3);el.textContent=rp(Math.round(v*e));if(k<1)requestAnimationFrame(f)};requestAnimationFrame(f)})}
function tipShow(e,t){const el=$("#tip");if(!el)return;const p=t.split("|");el.innerHTML=`<b>${esc(p[0])}</b><span>${esc(p[1])}</span><em>${esc(p[2])}</em>`;el.hidden=false;const x=Math.min(innerWidth-el.offsetWidth-8,Math.max(8,e.clientX+12)),y=Math.max(8,e.clientY-el.offsetHeight-10);el.style.left=x+"px";el.style.top=y+"px"}

/* ---------- login pengurus ---------- */
function loginForm(){const A=window.RT_AUTH,st=A?A.state():{};
  return st.signedIn?`<p class="small" style="margin:10px 0">Anda masuk sebagai <b>${esc(st.email||"")}</b>, tetapi akun ini belum memiliki peran pengurus. Minta Ketua RT menetapkan peran lewat Supabase (Authentication, Users).</p><button class="btn" id="lgOut">Keluar</button>`:
  `<form id="lgf"><div class="field"><label for="lgE">Email</label><input id="lgE" type="email" autocomplete="username"></div><div class="field" id="lgPw"><label for="lgP">Kata sandi</label><input id="lgP" type="password" autocomplete="current-password"></div><p class="err" id="lgM" role="alert"></p><button class="btn pri" style="width:100%" id="lgB">Masuk</button></form><p style="text-align:center;margin-top:12px"><button class="btn sm" id="lgOtp" type="button">Kirim tautan masuk ke email (tanpa kata sandi)</button></p>`}
function vLogin(){return `<div class="top"><div class="brand"><img class="logo" src="${LOGO}" alt="Logo RT 09"><div><b>Pengurus ${esc(S.set.namaRT)} / ${esc(S.set.rw)}</b><span>Kel. ${esc(S.set.kelurahan)}</span></div></div></div><div class="card" style="margin:28px auto;max-width:420px"><h2>Masuk pengurus</h2>${loginForm()}</div>`}
function pengurusOpen(){modal(`<div class="row"><h3>Area Pengurus</h3><button class="btn sm" id="mc">Tutup</button></div><p class="muted small" style="margin:6px 0 12px">Khusus pengurus RT. Masuk dengan akun yang diberikan Ketua RT.</p>${loginForm()}`);$("#mc").onclick=closeM;bindLogin()}
function wargaOpen(){if(!window.RT_WARGA){toast("Portal warga belum tersedia");return}const ov=document.createElement("div");ov.className="ov wov";ov.innerHTML='<div class="wrap" style="max-width:640px"></div>';document.body.appendChild(ov);window.RT_WARGA.mount(ov.firstChild,()=>{ov.remove();if(location.hash.startsWith("#area-"))history.replaceState(null,"",location.pathname)})}
function bindLogin(){const A=window.RT_AUTH;if(!A)return;const o=$("#lgOut");if(o)o.onclick=()=>A.signOut();const f=$("#lgf");if(!f)return;
  f.onsubmit=async e=>{e.preventDefault();$("#lgM").textContent="";const em=$("#lgE").value.trim(),pw=$("#lgP").value;if(!em||!pw){$("#lgM").textContent="Isi email dan kata sandi.";return}$("#lgB").disabled=true;const r=await A.signInPassword(em,pw);if(r&&r.error){$("#lgM").textContent="Email atau kata sandi salah.";$("#lgB").disabled=false}};
  $("#lgOtp").onclick=async()=>{const em=$("#lgE").value.trim();if(!em){$("#lgM").textContent="Isi email lebih dulu.";return}const r=await A.signInOtp(em);$("#lgM").textContent=r&&r.error?"Gagal mengirim. Coba lagi.":"Tautan masuk dikirim. Buka email Anda.";$("#lgM").style.color=r&&r.error?"":"var(--good)"}}

/* ---------- pengikat acara tahap 7 ---------- */
function bind7(){
  const on=(s,ev,fn)=>document.querySelectorAll(s).forEach(e=>e.addEventListener(ev,fn)),ge=(a,i)=>a.find(x=>x.id===i),er=x=>toast(x&&x.message||"Gagal");
  on("[data-sc]","click",e=>{const el=document.getElementById("s-"+e.currentTarget.dataset.sc);if(el)el.scrollIntoView({behavior:matchMedia("(prefers-reduced-motion:reduce)").matches?"auto":"smooth",block:"start"})});
  on("[data-kidx]","click",e=>{S.kIdx=+e.currentTarget.dataset.kidx;S.kView="bulan";S.kDay=null;render()});on("[data-kview]","click",e=>{S.kView=e.currentTarget.dataset.kview;render()});on("[data-kday]","click",e=>{const d=e.currentTarget.dataset.kday;S.kDay=d&&S.kDay===d?null:(d||null);render()});
  on("[data-lap]","click",lapForm);on("[data-umkm]","click",umkmDaftarForm);on("[data-pesan]","click",e=>pesanForm(ge(S.prod,e.currentTarget.dataset.pesan)));on("[data-sewa]","click",e=>sewaForm(ge(S.aset,e.currentTarget.dataset.sewa)));
  on("[data-copy]","click",e=>salin(e.currentTarget.dataset.copy,"Nomor rekening disalin"));
  on("[data-qz]","click",()=>{modal(`<div class="row"><h3>QRIS RT 09</h3><button class="btn sm" id="mc">Tutup</button></div><img src="${S.set.qris}" alt="Kode QRIS" style="width:100%;max-width:420px;display:block;margin:12px auto;background:#fff;border-radius:8px">`);$("#mc").onclick=closeM});
  on("[data-tab]","click",e=>{location.hash=e.currentTarget.dataset.tab});
  on("[data-mtab]","click",e=>{S.mTab=e.currentTarget.dataset.mtab;render()});on("[data-mst2]","click",e=>{S.mSt=e.currentTarget.dataset.mst2;render()});
  on("[data-mset]","click",e=>{const [id,st]=e.currentTarget.dataset.mset.split("|");mStatus(id,st).catch(er)});on("[data-mtay]","click",e=>mTayang(e.currentTarget.dataset.mtay).catch(er));on("[data-msew]","click",e=>mSewa(e.currentTarget.dataset.msew).catch(er));
  on("[data-mdel]","click",e=>{const id=e.currentTarget.dataset.mdel;confirmM("Hapus kiriman ini?",async()=>{await del("masukan/"+id);S.msk=S.msk.filter(x=>x.id!==id);render()},"Hapus")});
  on("[data-atab]","click",e=>{S.aTab=e.currentTarget.dataset.atab;render()});on("#addInv","click",()=>invForm(null));on("[data-iedit]","click",e=>invForm(ge(S.inv,e.currentTarget.dataset.iedit)));
  const dl=(path,key,msg)=>e=>{const id=e.currentTarget.dataset[msg];confirmM("Hapus data ini?",async()=>{await del(path+"/"+id);S[key]=S[key].filter(x=>x.id!==id);if(path==="sewa"){await del("kalender/kal-"+id).catch(()=>{});S.kal=S.kal.filter(k=>k.id!=="kal-"+id)}render()},"Hapus")};
  on("[data-idel]","click",dl("inventaris","inv","idel"));on("#addAset","click",()=>asetForm(null));on("[data-aedit]","click",e=>asetForm(ge(S.aset,e.currentTarget.dataset.aedit)));on("[data-adel]","click",dl("aset","aset","adel"));
  on("#addSewa","click",()=>sewaForm2(null));on("[data-sedit2]","click",e=>sewaForm2(ge(S.sewa,e.currentTarget.dataset.sedit2)));on("[data-sdel2]","click",dl("sewa","sewa","sdel2"));
  on("[data-ptab]","click",e=>{S.pTab=e.currentTarget.dataset.ptab;render()});on("#addKal","click",()=>kalForm(null));on("[data-kedit]","click",e=>kalForm(ge(S.kal,e.currentTarget.dataset.kedit)));on("[data-kdel]","click",dl("kalender","kal","kdel"));
  on("#addUmkm","click",()=>umkmForm(null));on("[data-uedit]","click",e=>umkmForm(ge(S.umkm,e.currentTarget.dataset.uedit)));on("[data-udel]","click",dl("umkm","umkm","udel"));
  on("[data-ufoto]","click",e=>{const u=ge(S.umkm,e.currentTarget.dataset.ufoto);fotoForm("Foto "+u.nama,u.foto,async d=>{await saveDoc("umkm",S.umkm,u.id,{...u,foto:d});render()})});
  on("#addProd","click",()=>prodForm(null));on("[data-pedit]","click",e=>prodForm(ge(S.prod,e.currentTarget.dataset.pedit)));on("[data-pdel]","click",dl("produk","prod","pdel"));
  on("[data-pfoto]","click",e=>{const p=ge(S.prod,e.currentTarget.dataset.pfoto);fotoForm("Foto "+p.nama,p.foto,async d=>{await saveDoc("produk",S.prod,p.id,{...p,foto:d});render()})});
  on("#addStr","click",()=>strForm(-1));on("[data-sstr]","click",e=>strForm(+e.currentTarget.dataset.sstr));
  const mv=(i,d)=>{const l=(S.set.struktur||[]).slice(),j=i+d;if(j<0||j>=l.length)return;[l[i],l[j]]=[l[j],l[i]];strukturSimpan(l).catch(er)};on("[data-sup]","click",e=>mv(+e.currentTarget.dataset.sup,-1));on("[data-sdn]","click",e=>mv(+e.currentTarget.dataset.sdn,1));
  on("[data-sxs]","click",e=>{const i=+e.currentTarget.dataset.sxs;confirmM("Hapus jabatan ini dari struktur?",async()=>{await strukturSimpan((S.set.struktur||[]).filter((_,k)=>k!==i))},"Hapus")});
  on("#bayarBtn","click",bayarForm);on("#qrisBtn","click",qrisForm);
  on("[data-csel]","click",e=>{S.cSel=e.currentTarget.dataset.csel;S.cAnim=true;render()});on("#replay","click",()=>{S.cAnim=true;render()});on("[data-hide]","click",e=>{const k=e.currentTarget.dataset.hide,o={...S.hide,[k]:!S.hide[k]};if(o.masuk&&o.keluar)return;S.hide=o;S.cAnim=true;render()});
  /* tooltip */
  document.querySelectorAll("[data-tip]").forEach(el=>{el.addEventListener("pointermove",e=>tipShow(e,el.dataset.tip));el.addEventListener("pointerleave",()=>{const t=$("#tip");if(t)t.hidden=true});el.addEventListener("pointerdown",e=>tipShow(e,el.dataset.tip))});
  document.querySelectorAll(".ds").forEach(el=>{const h=()=>{const p=el.dataset.tip.split("|");$("#dnv").textContent=p[0];$("#dnl").textContent=p[1]+" · "+p[2]};el.addEventListener("pointerenter",h);el.addEventListener("pointerdown",h)});
  document.querySelectorAll("svg.lc").forEach(sv=>{const pts=sv.dataset.pts.split(";").map(p=>p.split("~")),hit=sv.querySelector(".hit"),xh=sv.querySelector("#xh");const mv=e=>{const r=sv.getBoundingClientRect(),vb=sv.viewBox.baseVal.width/r.width,x=(e.clientX-r.left)*vb;let b=0,bd=1e9;pts.forEach((p,i)=>{const d=Math.abs(+p[0]-x);if(d<bd){bd=d;b=i}});xh.setAttribute("x1",pts[b][0]);xh.setAttribute("x2",pts[b][0]);xh.removeAttribute("hidden");tipShow(e,pts[b][1]+"|"+pts[b][2]+"|"+pts[b][3])};hit.addEventListener("pointermove",mv);hit.addEventListener("pointerdown",mv);hit.addEventListener("pointerleave",()=>{xh.setAttribute("hidden","");const t=$("#tip");if(t)t.hidden=true})});
  if(S.cAnim){runCounters();S.cAnim=false}
  on("[data-area]","click",e=>e.currentTarget.dataset.area==="warga"?wargaOpen():pengurusOpen());on("[data-signout]","click",()=>window.RT_AUTH&&window.RT_AUTH.signOut());
  if(!S._h&&MODE==="publik"&&!S.admin){S._h=1;if(location.hash==="#area-warga")wargaOpen();else if(location.hash==="#area-pengurus")pengurusOpen()}
  bindLogin();
}
let _rs;window.addEventListener("resize",()=>{clearTimeout(_rs);_rs=setTimeout(()=>{if(S.tab==="keuangan"&&S.kTab==="grafik")render()},200)});
document.addEventListener("DOMContentLoaded",()=>{if(!$("#tip")){const t=document.createElement("div");t.id="tip";t.className="tip";t.hidden=true;document.body.appendChild(t)}});
if(document.readyState!=="loading"&&!$("#tip")){const t=document.createElement("div");t.id="tip";t.className="tip";t.hidden=true;document.body.appendChild(t)}

/* ===== TAHAP 8: Google Sheets (.xlsx), Status iuran, CCTV Hikvision ===== */
Object.assign(S,{cctv:[],iuranD:[]});
const XLSX_SRC="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
function loadXLSX(){return window.XLSX?Promise.resolve(window.XLSX):new Promise((ok,no)=>{const s=document.createElement("script");s.src=XLSX_SRC;s.onload=()=>ok(window.XLSX);s.onerror=()=>no(new Error("Pustaka Excel gagal dimuat. Periksa koneksi internet."));document.head.appendChild(s)})}
const normH=h=>String(h||"").toLowerCase().replace(/[^a-z0-9]/g,"");
const slug8=s=>String(s||"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,40);
const dig16=v=>digits(String(v==null?"":v));
const monthOk=v=>/^\d{4}-(0[1-9]|1[0-2])$/.test(v);
function monthIn(v){if(v==null||v==="")return"";if(v instanceof Date)return v.getFullYear()+"-"+String(v.getMonth()+1).padStart(2,"0");const t=String(v).trim();if(monthOk(t))return t;let m=t.match(/^(\d{4})-(\d{2})-\d{2}/);if(m)return m[1]+"-"+m[2];m=t.match(/^(\d{1,2})[\/-](\d{4})$/);if(m)return m[2]+"-"+m[1].padStart(2,"0");
  const i=BLNN.findIndex(b=>t.toLowerCase().startsWith(b.toLowerCase()));const y=t.match(/(\d{4})/);return i>=0&&y?y[1]+"-"+String(i+1).padStart(2,"0"):""}
function dateIn(v){if(v==null||v==="")return"";if(v instanceof Date)return iso(v);const t=String(v).trim();if(/^\d{4}-\d{2}-\d{2}$/.test(t))return t;const m=t.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);return m?m[3]+"-"+m[2].padStart(2,"0")+"-"+m[1].padStart(2,"0"):t}
const ALIAS={nokk:"kk",kk:"kk",kartukeluarga:"kk",nomorkk:"kk",nik:"nik",nikkepala:"nikKepala",kepala:"kepala",namakepala:"kepala",kepalakeluarga:"kepala",nama:"nama",alamat:"alamat",hp:"hp",nohp:"hp",telepon:"hp",hunian:"hunian",statushunian:"hunian",aktif:"aktif",catatan:"catatan",keterangan:"catatan",hubungan:"hub",hub:"hub",jk:"jk",jeniskelamin:"jk",tempatlahir:"tempatLahir",tanggallahir:"tglLahir",tgllahir:"tglLahir",agama:"agama",pendidikan:"pendidikan",pekerjaan:"pekerjaan",statuskawin:"statusKawin",status:"status",lunassdyyyymm:"lunasSd",lunassd:"lunasSd",lunassampai:"lunasSd",perlukonfirmasi:"konf",konfirmasi:"konf"};
function rowsOf(wb,name){const k=wb.SheetNames.find(n=>n.trim().toLowerCase()===name);if(!k)return null;const raw=XLSX.utils.sheet_to_json(wb.Sheets[k],{defval:"",raw:true,cellDates:true});
  return raw.map(r=>{const o={};Object.keys(r).forEach(h=>{const a=ALIAS[normH(h)];if(a)o[a]=r[h]});return o}).filter(o=>Object.values(o).some(v=>String(v).trim()!==""))}
const yes8=v=>/^(ya|y|true|1|ok|x)$/i.test(String(v).trim());
const ID16=f=>digits(f.kk||"");
function findKel(kk,kepala){return S.kel.find(f=>kk&&ID16(f)===kk)||(!kk?S.kel.find(f=>f.kepala&&kepala&&f.kepala.trim().toLowerCase()===String(kepala).trim().toLowerCase()):null)}

/* ---------- ekspor ---------- */
async function expSheets(blank){
  const X=await loadXLSX(),wb=X.utils.book_new();
  const W=[],A=[],I=[];
  if(blank){W.push({"No. KK":"3671000000000000","NIK Kepala":"3671000000000001","Kepala":"(contoh) Budi Santoso","Alamat":"Jl. Contoh No. 1","No. HP":"0812xxxxxxx","Hunian":"Tetap","Aktif":"ya","Catatan":""});
    A.push({"No. KK":"3671000000000000","NIK":"3671000000000001","Nama":"(contoh) Budi Santoso","Hubungan":"Kepala Keluarga","JK":"L","Tempat Lahir":"Tangerang","Tanggal Lahir":"1980-01-31","Agama":"Islam","Pendidikan":"S1","Pekerjaan":"Karyawan","Status Kawin":"Kawin","Status":"Aktif"});
    I.push({"No. KK":"3671000000000000","Kepala":"(contoh) Budi Santoso","Lunas s.d (YYYY-MM)":"2026-10","Perlu konfirmasi":"tidak","Catatan":""})}
  else S.kel.slice().sort(byAlamat).forEach(f=>{
    W.push({"No. KK":f.kk||"","NIK Kepala":f.nikKepala||"","Kepala":f.kepala||"","Alamat":f.alamat||"","No. HP":f.hp||"","Hunian":f.hunian||"","Aktif":f.aktif===false?"tidak":"ya","Catatan":f.catatan||""});
    (f.anggota||[]).forEach(a=>A.push({"No. KK":f.kk||"","NIK":a.nik||"","Nama":a.nama||"","Hubungan":a.hub||"","JK":a.jk||"","Tempat Lahir":a.tempatLahir||"","Tanggal Lahir":a.tglLahir||"","Agama":a.agama||"","Pendidikan":a.pendidikan||"","Pekerjaan":a.pekerjaan||"","Status Kawin":a.statusKawin||"","Status":a.status||"Aktif"}));
    const u=S.iuranD.find(x=>x.id===f.id);I.push({"No. KK":f.kk||"","Kepala":f.kepala||"","Lunas s.d (YYYY-MM)":u?.lunasSd||"","Perlu konfirmasi":u?.konf?"ya":"tidak","Catatan":u?.catatan||""})});
  [["Warga",W],["Anggota",A],["Iuran",I]].forEach(([n,r])=>{const ws=X.utils.json_to_sheet(r);ws["!cols"]=Object.keys(r[0]||{}).map(k=>({wch:Math.max(12,k.length+2)}));X.utils.book_append_sheet(wb,ws,n)});
  const data=new Blob([X.write(wb,{type:"array",bookType:"xlsx"})],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"});
  const fn=(blank?"Template-Data-Warga-RT09":"Data-Warga-RT09-"+iso(new Date()))+".xlsx";
  if(!S.dl){toast("Fitur unduh tidak tersedia di tampilan ini");return}
  try{await S.dl.save({filename:fn,data});toast("File disimpan. Buka di Google Sheets lewat File > Impor.")}catch(e){if(!(e&&e.code==="declined"))toast("Gagal menyimpan file")}}

/* ---------- impor ---------- */
function planImport(wb){
  const W=rowsOf(wb,"warga")||[],A=rowsOf(wb,"anggota")||[],I=rowsOf(wb,"iuran")||[],plan={kel:[],iu:[],warn:[]};
  const aggr={};A.forEach(a=>{const k=dig16(a.kk);if(!aggr[k])aggr[k]=[];aggr[k].push(a)});
  const seen=new Set();
  W.forEach((r,i)=>{const kk=dig16(r.kk),kepala=String(r.kepala||"").trim();
    if(!kepala){plan.warn.push("Baris Warga "+(i+2)+": nama kepala kosong, dilewati.");return}
    if(kk&&kk.length!==16)plan.warn.push("Baris Warga "+(i+2)+" ("+kepala+"): No. KK bukan 16 digit.");
    if(kk&&seen.has(kk)){plan.warn.push("No. KK ganda di file: "+kepala+", dilewati.");return}seen.add(kk);
    const old=findKel(kk,kepala),o={...(old||{})};delete o.id;
    const set=(k,v)=>{if(v!==undefined&&String(v).trim()!=="")o[k]=String(v).trim()};
    set("kk",kk);set("kepala",kepala);set("nikKepala",dig16(r.nikKepala));set("alamat",r.alamat);set("hp",r.hp);set("hunian",r.hunian);set("catatan",r.catatan);
    if(String(r.aktif||"").trim()!=="")o.aktif=!/^(tidak|t|false|0|nonaktif)$/i.test(String(r.aktif).trim());else if(o.aktif===undefined)o.aktif=true;
    const ag=aggr[kk||""];if(ag&&ag.length){const prev=old?.anggota||[];o.anggota=ag.map(a=>{const nik=dig16(a.nik),p=prev.find(x=>(nik&&digits(x.nik||"")===nik)||(!nik&&x.nama===a.nama))||{};const g={...p};
      [["nik",nik],["nama",a.nama],["hub",a.hub],["jk",a.jk],["tempatLahir",a.tempatLahir],["agama",a.agama],["pendidikan",a.pendidikan],["pekerjaan",a.pekerjaan],["statusKawin",a.statusKawin],["status",a.status]].forEach(([k,v])=>{if(String(v||"").trim()!=="")g[k]=String(v).trim()});
      const td=dateIn(a.tglLahir);if(td)g.tglLahir=td;if(!g.status)g.status="Aktif";return g})}
    else if(!old)o.anggota=[];
    if(!o.hunian)o.hunian="Tetap";
    const id=old?old.id:(kk.length===16?kk:"nokk-"+slug8(kepala));
    const same=old&&JSON.stringify({...old,id:undefined})===JSON.stringify({...o,id:undefined});
    plan.kel.push({id,o,baru:!old,sama:!!same,nama:kepala})});
  Object.keys(aggr).forEach(k=>{if(k&&!seen.has(k)&&!S.kel.some(f=>ID16(f)===k))plan.warn.push("Sheet Anggota: No. KK "+k+" tidak ada di sheet Warga atau data lama; anggotanya dilewati.")});
  I.forEach((r,i)=>{const kk=dig16(r.kk),f=findKel(kk,r.kepala);const pk=plan.kel.find(p=>kk&&p.o.kk===kk);const id=f?f.id:pk?pk.id:"";
    if(!id){plan.warn.push("Baris Iuran "+(i+2)+": KK tidak ditemukan ("+(r.kepala||kk||"?")+").");return}
    const ls=monthIn(r.lunasSd);if(r.lunasSd!==""&&r.lunasSd!=null&&!ls){plan.warn.push("Baris Iuran "+(i+2)+": 'Lunas s.d' tidak terbaca (pakai format 2026-10).");return}
    plan.iu.push({id,d:{lunasSd:ls,konf:yes8(r.konf),catatan:String(r.catatan||"").trim()}})});
  return plan}
function impPreview(plan){
  const b=plan.kel.filter(x=>x.baru).length,u=plan.kel.filter(x=>!x.baru&&!x.sama).length,s=plan.kel.filter(x=>x.sama).length;
  modal(`<h3>Pratinjau impor</h3><div class="grid g4" style="margin:10px 0"><div class="card stat"><b>${b}</b><span>KK baru</span></div><div class="card stat"><b>${u}</b><span>KK diperbarui</span></div><div class="card stat"><b>${s}</b><span>Tidak berubah</span></div><div class="card stat"><b>${plan.iu.length}</b><span>Status iuran</span></div></div>
  ${plan.warn.length?`<div class="banner"><b>${plan.warn.length} catatan:</b><ul style="margin:6px 0 0;padding-left:18px;max-height:140px;overflow:auto">${plan.warn.slice(0,30).map(w=>`<li class="small">${esc(w)}</li>`).join("")}</ul></div>`:""}
  <p class="small muted" style="margin-top:8px">Kolom yang dikosongkan di file <b>tidak</b> menghapus data lama. Data yang tidak ada di file tidak dihapus.</p>
  <p class="err" id="merr" role="alert"></p><div class="mact"><button class="btn" id="mc">Batal</button><button class="btn pri" id="my" ${b+u+plan.iu.length?"":"disabled"}>Terapkan</button></div>`,true);
  $("#mc").onclick=closeM;$("#my").onclick=async e=>{const bt=e.currentTarget;bt.disabled=true;bt.textContent="Menyimpan...";
    try{for(const x of plan.kel){if(x.sama)continue;await saveDoc("keluarga",S.kel,x.id,x.o)}for(const x of plan.iu)await saveDoc("iuran",S.iuranD,x.id,x.d);closeM();render();toast("Impor selesai: "+(b+u)+" KK, "+plan.iu.length+" status iuran")}
    catch(x){$("#merr").textContent=x.message;bt.disabled=false;bt.textContent="Coba lagi"}}}
async function pickImport(){
  const inp=document.createElement("input");inp.type="file";inp.accept=".xlsx,.xls,.csv";
  inp.onchange=async()=>{const f=inp.files[0];if(!f)return;if(f.size>8e6){toast("File terlalu besar (maks 8 MB)");return}
    try{const X=await loadXLSX(),wb=X.read(await f.arrayBuffer(),{cellDates:true});const plan=planImport(wb);if(!plan.kel.length&&!plan.iu.length&&!plan.warn.length){toast("Sheet 'Warga' / 'Iuran' tidak ditemukan. Unduh template dulu.");return}impPreview(plan)}catch(e){toast(e.message||"File tidak bisa dibaca")}};inp.click()}
function sheetsMenu(){modal(`<h3>Google Sheets</h3><p class="small muted" style="margin:6px 0 10px">Data warga dikelola di Google Sheets, lalu dimasukkan ke sistem lewat file .xlsx. Data tidak pernah dibuka untuk umum.</p>
  <ol class="small" style="padding-left:18px;display:grid;gap:6px;margin-bottom:12px"><li><b>Unduh template</b> (atau <b>ekspor data saat ini</b>) lalu buka di Google Sheets: File &gt; Impor.</li><li>Isi atau perbarui. Jangan ubah nama sheet (Warga, Anggota, Iuran) dan judul kolom.</li><li>Di Google Sheets: File &gt; Unduh &gt; Microsoft Excel (.xlsx).</li><li>Tekan <b>Impor dari file</b> di bawah, periksa pratinjau, lalu Terapkan.</li></ol>
  <div style="display:grid;gap:8px"><button class="btn" id="sx1">Unduh template kosong</button><button class="btn" id="sx2">Ekspor data saat ini</button><button class="btn pri" id="sx3">Impor dari file (.xlsx)</button></div><div class="mact"><button class="btn" id="mc">Tutup</button></div>`);
  $("#mc").onclick=closeM;$("#sx1").onclick=()=>expSheets(true).catch(e=>toast(e.message));$("#sx2").onclick=()=>expSheets(false).catch(e=>toast(e.message));$("#sx3").onclick=()=>{closeM();pickImport()}}

/* ---------- status iuran ---------- */
const bulanSkrg=()=>{const d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")};
const selisih=(a,b)=>(+b.slice(0,4)-+a.slice(0,4))*12+(+b.slice(5)-+a.slice(5));
function iuranView(){
  const now=bulanSkrg(),per=iuranTotal(S.set.iuran),rows=S.kel.filter(f=>f.aktif!==false).sort(byAlamat).map(f=>{const u=S.iuranD.find(x=>x.id===f.id)||{};const t=u.lunasSd?Math.max(0,selisih(u.lunasSd,now)-1):null;return{f,u,t}});
  const isi=rows.filter(r=>r.u.lunasSd).length,tg=rows.filter(r=>r.t>0),konf=rows.filter(r=>r.u.konf).length;
  return `<div class="banner"><b>Tanda:</b> kolom November (tulisan tangan, halaman 13 'Iuran Warna tahun 2026') belum dimasukkan. Pengurus akan mengisi; baris bertanda <span class="pill p-warn">Perlu konfirmasi</span> menunggu pengecekan.</div>
  <div class="grid g4" style="margin:12px 0"><div class="card stat"><b>${isi}/${rows.length}</b><span>KK sudah terisi</span></div><div class="card stat"><b>${tg.length}</b><span>KK menunggak</span></div><div class="card stat"><b>${rp(tg.reduce((s,r)=>s+r.t*per,0))}</b><span>Perkiraan tunggakan</span></div><div class="card stat"><b>${konf}</b><span>Perlu konfirmasi</span></div></div>
  <p class="small muted" style="margin-bottom:8px">Perkiraan = bulan tertunggak x iuran bulanan ${rp(per)}. Angka resmi tetap mengikuti daftar piutang bendahara.</p>
  <div class="card scroll" style="padding:6px"><table class="tbl"><thead><tr><th>Kepala keluarga</th><th>Alamat</th><th>Lunas s.d</th><th class="r">Tertunggak</th><th></th></tr></thead><tbody>${rows.map(r=>`<tr><td><b>${esc(r.f.kepala)}</b>${r.u.catatan?`<p class="small muted">${esc(r.u.catatan)}</p>`:""}</td><td class="small">${esc(r.f.alamat||"-")}</td><td>${r.u.lunasSd?perLabel(r.u.lunasSd):'<span class="muted small">Belum diisi</span>'} ${r.u.konf?'<span class="pill p-warn">Perlu konfirmasi</span>':""}</td><td class="num r">${r.t==null?"-":r.t?r.t+" bln":'<span class="pill p-good">Lancar</span>'}</td><td>${S.admin?`<button class="btn sm" data-uedit="${esc(r.f.id)}">Isi</button>`:""}</td></tr>`).join("")}</tbody></table></div>`}
function iuranForm(id){const f=S.kel.find(x=>x.id===id);if(!f)return;const u=S.iuranD.find(x=>x.id===id)||{};
  openForm({title:"Status iuran: "+f.kepala,fields:[{id:"lunasSd",label:"Lunas sampai bulan",type:"month",value:u.lunasSd||"",hint:"Kosongkan bila belum diketahui"},{id:"catatan",label:"Catatan",value:u.catatan||""},{id:"konf",label:"Perlu konfirmasi (data ragu / tulisan tangan)",type:"check",value:u.konf}],
   save:async v=>{if(v.lunasSd&&!monthOk(v.lunasSd))return{error:"Format bulan tidak valid."};await saveDoc("iuran",S.iuranD,id,{lunasSd:v.lunasSd,catatan:v.catatan,konf:!!v.konf});render();toast("Tersimpan")}})}

/* ---------- CCTV Hikvision ---------- */
const CTIPE=[["hikconnect","Hik-Connect (tautan berbagi)"],["web","Halaman web / HLS"],["gambar","Gambar snapshot (alamat https)"]];
const httpsOk=u=>{try{return new URL(u).protocol==="https:"}catch(e){return false}};
function cctvForm(x){openForm({title:x?"Ubah kamera":"Tambah kamera CCTV",wide:true,fields:[
  {id:"nama",label:"Nama kamera",value:x?.nama,ph:"Contoh: Gerbang masuk Lorong 1"},{id:"lokasi",label:"Lokasi",value:x?.lokasi,half:true},
  {id:"tipe",label:"Jenis tautan",type:"select",options:CTIPE.map(c=>c[1]),value:(CTIPE.find(c=>c[0]===x?.tipe)||CTIPE[0])[1],half:true},
  {id:"url",label:"Tautan tayangan (https)",value:x?.url,hint:"Tautan berbagi Hik-Connect atau halaman web. JANGAN isi alamat IP kamera, port, atau RTSP."},
  {id:"akses",label:"Siapa yang boleh melihat",type:"select",options:["Pengurus saja","Warga (setelah login Area Warga)","Umum (tampil di halaman depan)"],value:x?.akses==="umum"?"Umum (tampil di halaman depan)":x?.akses==="warga"?"Warga (setelah login Area Warga)":"Pengurus saja",half:true},
  {id:"catatan",label:"Catatan (bukan kata sandi)",value:x?.catatan,half:true},{id:"aktif",label:"Tampilkan",type:"check",value:x?x.aktif!==false:true}],
  save:async v=>{if(!v.nama)return{error:"Nama kamera wajib diisi."};if(v.url&&!httpsOk(v.url))return{error:"Tautan harus diawali https://"};if(/(rtsp:|\b\d{1,3}(\.\d{1,3}){3}\b)/.test(v.url||""))return{error:"Jangan memakai alamat IP atau RTSP. Gunakan tautan berbagi."};
   await saveDoc("cctv",S.cctv,x?.id||newId("cc"),{...(x||{}),nama:v.nama,lokasi:v.lokasi,tipe:(CTIPE.find(c=>c[1]===v.tipe)||CTIPE[0])[0],url:v.url,akses:/^Umum/.test(v.akses)?"umum":/^Warga/.test(v.akses)?"warga":"pengurus",catatan:v.catatan,aktif:!!v.aktif});render();toast("Tersimpan")}})}
function cctvKartu(c,adm){const ok=c.url&&httpsOk(c.url);return `<div class="card lift"><div class="row"><span class="pill ${c.akses==="umum"?"p-good":c.akses==="warga"?"p-info":"p-mute"}">${c.akses==="umum"?"Umum":c.akses==="warga"?"Warga login":"Pengurus"}</span>${c.aktif===false?'<span class="pill p-mute">Disembunyikan</span>':""}</div><h3 style="margin:6px 0 2px">${esc(c.nama)}</h3><p class="small muted">${esc(c.lokasi||"-")}</p>
  ${c.tipe==="gambar"&&ok?`<img class="uimg" style="margin-top:8px;aspect-ratio:16/9;object-fit:cover" src="${esc(c.url)}" alt="Cuplikan ${esc(c.nama)}" loading="lazy" referrerpolicy="no-referrer">`:ok?`<a class="btn pri sm" style="margin-top:8px;display:inline-block" href="${esc(c.url)}" target="_blank" rel="noopener noreferrer">Buka tayangan</a>`:`<p class="small muted" style="margin-top:8px">Tautan belum diisi.</p>`}
  ${adm?`<div style="display:flex;gap:6px;margin-top:8px"><button class="btn sm" data-cedit="${esc(c.id)}">Ubah</button><button class="btn sm bad" data-cdel="${esc(c.id)}">Hapus</button></div>`:""}</div>`}
function vCctv(head){const l=S.cctv.slice().sort((a,b)=>a.nama.localeCompare(b.nama));
  return head+`<div class="banner"><b>Hikvision.</b> Pakai fitur <b>Berbagi perangkat</b> di aplikasi Hik-Connect, lalu tempel tautannya di sini. Jangan membuka kamera langsung ke internet (alamat IP / port forwarding). Arahkan kamera hanya ke area umum dan pasang papan pemberitahuan CCTV. Panduan lengkap: <b>PANDUAN_CCTV.md</b>.</div>
  <div class="row" style="margin:10px 0"><span class="muted small">${l.length} kamera · ${l.filter(c=>c.akses==="umum"&&c.aktif!==false).length} tampil di halaman depan</span><button class="btn pri sm" id="addCctv">+ Tambah kamera</button></div>
  ${l.length?`<div class="grid g2">${l.map(c=>cctvKartu(c,true)).join("")}</div>`:'<div class="card"><p class="muted small">Belum ada kamera. Tekan "+ Tambah kamera".</p></div>'}`}
function cctvPub(){const l=(S.cctv||[]).filter(c=>c.aktif!==false&&c.akses==="umum");if(!l.length)return"";
  return secH("cctv","CCTV lingkungan","Pantauan area umum RT 09 / RW 01")+`<div class="grid g2">${l.map(c=>cctvKartu(c,false)).join("")}</div><p class="hint" style="margin-top:8px">Kamera hanya mengarah ke area umum untuk keamanan lingkungan. Dilarang merekam ulang atau menyebarkan tayangan tanpa izin pengurus.</p>`}
function bindMod8(on){on("#shX","click",sheetsMenu);on("[data-uedit]","click",e=>iuranForm(e.currentTarget.dataset.uedit));on("#addCctv","click",()=>cctvForm(null));on("[data-cedit]","click",e=>cctvForm(S.cctv.find(c=>c.id===e.currentTarget.dataset.cedit)));
  on("[data-cdel]","click",e=>{const id=e.currentTarget.dataset.cdel;confirmM("Hapus kamera ini?",async()=>{await del("cctv/"+id);S.cctv=S.cctv.filter(c=>c.id!==id);render()},"Hapus")})}

/* ---- event ---- */
function bind(){
  const on=(s,ev,fn)=>document.querySelectorAll(s).forEach(e=>e.addEventListener(ev,fn));
  on("[data-kk]","click",e=>openKK(e.currentTarget.dataset.kk));on("[data-kk]","keydown",e=>{if(e.key==="Enter")openKK(e.currentTarget.dataset.kk)});
  on("#q","input",e=>{S.q=e.target.value;const p=e.target.selectionStart;render();const q=$("#q");q.focus();q.setSelectionRange(p,p)});
  on("#fh","change",e=>{S.fHun=e.target.value;render()});on("#rev","click",()=>{S.reveal=!S.reveal;render()});
  on("#addKK","click",()=>kkForm(null));bindMod8(on);
  on("[data-ft]","click",e=>{S.fTipe=e.currentTarget.dataset.ft;render()});
  on("#addEv","click",()=>evForm(null,"berita"));on("#addNot","click",()=>evForm(null,"notulen"));
  on("[data-editev]","click",e=>evForm(S.keg.find(x=>x.id===e.currentTarget.dataset.editev)));
  on("[data-delev]","click",e=>{const id=e.currentTarget.dataset.delev;confirmM("Hapus catatan ini?",async()=>{await del("kegiatan/"+id);S.keg=S.keg.filter(x=>x.id!==id);render()},"Hapus")});
  on("#addPert","click",()=>pertForm());
  on("[data-cancelp]","click",e=>{const p=S.pert.find(x=>x.id===e.currentTarget.dataset.cancelp);confirmM("Batalkan pertemuan "+fmtTglS(p.tanggal)+"?",async()=>{const o={...p,status:"batal"};delete o.id;await put("pertemuan/"+p.id,o);upsert(S.pert,{...o,id:p.id});render()},"Batalkan")});
  on("[data-done]","click",e=>{const p=S.pert.find(x=>x.id===e.currentTarget.dataset.done);const o={...p,status:"selesai"};delete o.id;
    put("pertemuan/"+p.id,o).then(()=>{upsert(S.pert,{...o,id:p.id});render();evForm({tipe:"notulen",tanggal:p.tanggal,judul:"Notulen pertemuan warga "+fmtTglS(p.tanggal),tuanRumah:(p.tuanRumahNama||"")+(p.alamat?", "+p.alamat:"")},"notulen")}).catch(x=>toast(x.message))});
  on("[data-set]","click",e=>setForm(e.currentTarget.dataset.set));
  bind2();bind3();bind7();
}
function route(){const h=location.hash.slice(1);if(TABS.some(t=>t[0]===h)){if(S.tab!==h){S.anim=true;window.scrollTo(0,0);closeM()}S.tab=h}render()}
window.addEventListener("hashchange",route);

/* ---- mulai ---- */
(async()=>{
  render();
  try{const u=await window.claude?.use?.("user");if(window.RT_AUTH){window.RT_AUTH.onChange(()=>{S.admin=window.RT_AUTH.state().admin;S.owner=window.RT_AUTH.state().owner;render()})}S.admin=!!(u&&u.canEdit&&u.canEdit());S.owner=!!(u&&u.isOwner&&u.isOwner());try{S.dl=await window.claude?.use?.("downloads")}catch(e){S.dl=null}S.db=await window.claude?.use?.("db")}catch(e){S.db=null}
  route();if(!S.db)return;
  const timer=setTimeout(()=>{S.slow=true;render()},10000),got={};
  const sub=(name,fn)=>S.db.collection(name).onSnapshot(s=>{fn(s.docs.map(d=>({id:d.id,...d.data()})));got[name]=1;if(!s.metadata.fromCache){clearTimeout(timer);S.ready=true;S.slow=false}render()},e=>{S.errs[name]=e.code;clearTimeout(timer);render()});
  S.db.doc("pengaturan/rt").onSnapshot(s=>{if(s.exists)S.set={...DEF,...s.data(),jadwal:{...DEF.jadwal,...(s.data().jadwal||{})}};render()},()=>{});
  if(S.admin){sub("surat",a=>S.surat=a);sub("kas",a=>S.kas=a);sub("piutang",a=>S.piu=a);sub("reminder",a=>S.rem=a);sub("sosial",a=>S.sos=a);
    S.db.doc("verifikasi/data").onSnapshot(s=>{S.ver=s.exists?(s.data().items||[]):[];render()},()=>{});
    S.db.doc("qurban/2027").onSnapshot(s=>{S.qur=s.exists?s.data():null;render()},()=>{});
    S.db.doc("rahasia/ttd").onSnapshot(s=>{S.ttd=s.exists?s.data():null;render()},()=>{});S.db.doc("rahasia/album").onSnapshot(s=>{S.albumU=s.exists?(s.data().url||""):"";render()},()=>{});}
  if(MODE!=="publik"||S.admin)sub("keluarga",a=>S.kel=a);sub("kegiatan",a=>S.keg=a);sub("pertemuan",a=>S.pert=a);
  sub("umkm",a=>S.umkm=a);sub("produk",a=>S.prod=a);sub("kalender",a=>S.kal=a);sub("aset",a=>S.aset=a);sub("cctv",a=>S.cctv=a);
  if(S.admin){sub("iuran",a=>S.iuranD=a);sub("masukan",a=>S.msk=a);sub("sewa",a=>S.sewa=a);sub("inventaris",a=>S.inv=a)}
})();
