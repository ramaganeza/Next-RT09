/* Pasang aplikasi: Android/Chrome (tombol Pasang) dan iPhone/iPad (petunjuk Tambahkan ke Layar Utama). */
(function(){
  const sa=()=>matchMedia("(display-mode: standalone)").matches||navigator.standalone===true;
  if("serviceWorker" in navigator&&/^https?:$/.test(location.protocol))addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));
  const K="rt-pwa-tutup",tutup=()=>{try{return Date.now()-(+localStorage.getItem(K)||0)<12096e5}catch(e){return false}};
  const ios=/iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1);
  let ev=null,bar=null;
  const st=document.createElement("style");st.textContent="#pwaBar{position:fixed;left:12px;right:12px;bottom:calc(84px + env(safe-area-inset-bottom,0px));z-index:35;max-width:520px;margin:0 auto;background:#2a2118;color:#fff;border-radius:16px;padding:12px 14px;display:flex;gap:10px;align-items:center;box-shadow:0 8px 28px rgba(0,0,0,.35);font:500 13px/1.35 system-ui,sans-serif}#pwaBar img{width:40px;height:40px;border-radius:10px;flex:none}#pwaBar b{display:block;font-size:14px}#pwaBar span{opacity:.85}#pwaBar button{border:0;border-radius:999px;padding:8px 14px;font:600 13px system-ui;cursor:pointer}#pwaGo{background:#d9b26b;color:#2a2118}#pwaX{background:transparent;color:#fff;opacity:.7;padding:6px 8px!important}@media(min-width:860px){#pwaBar{bottom:20px;left:auto;right:20px;margin:0}}";
  function tampil(){
    if(bar||sa()||tutup()||document.getElementById("demoBar"))return;
    if(!ev&&!ios)return;
    bar=document.createElement("div");bar.id="pwaBar";bar.setAttribute("role","dialog");bar.setAttribute("aria-label","Pasang aplikasi");
    bar.innerHTML='<img src="icons/icon-192.png" alt=""><div style="flex:1"><b>Pasang aplikasi RT 09</b><span>'+(ev?"Buka lebih cepat dari layar utama HP, tanpa toko aplikasi.":"Ketuk ikon Bagikan, lalu pilih &ldquo;Tambahkan ke Layar Utama&rdquo;.")+'</span></div>'+(ev?'<button id="pwaGo">Pasang</button>':"")+'<button id="pwaX" aria-label="Tutup">&#10005;</button>';
    document.head.appendChild(st);document.body.appendChild(bar);
    document.getElementById("pwaX").onclick=()=>{try{localStorage.setItem(K,Date.now())}catch(e){}bar.remove();bar=null};
    const g=document.getElementById("pwaGo");if(g)g.onclick=async()=>{ev.prompt();try{await ev.userChoice}catch(e){}ev=null;bar&&bar.remove();bar=null}}
  addEventListener("beforeinstallprompt",e=>{e.preventDefault();ev=e;setTimeout(tampil,2500)});
  addEventListener("appinstalled",()=>{bar&&bar.remove();bar=null;ev=null});
  if(ios)addEventListener("load",()=>setTimeout(tampil,4000));
  window.RT_PWA={pasang:()=>{if(ev){ev.prompt()}else tampil()}};
})();
