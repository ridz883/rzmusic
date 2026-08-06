// ============================================================
// NANZZMUSIFY - CORE PLAYER (FULL FIX)
// ============================================================
const API={search:'/api/search',artist:'/api/artist',suggest:'/api/suggest',lyrics:'/api/lyrics',ytplay:'/api/ytplay'};
const FI='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><rect width="300" height="300" fill="%232a2a2a"/><g transform="translate(90,90) scale(5)" fill="none" stroke="%236b7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></g></svg>');
const S={ht:[],sr:[],ar:[],sq:'',filter:'all',ct:null,pl:[],pi:-1,ps:'',ip:false,il:false,rm:'off',autoNext:true,yp:null,yr:false,iv:null,pt:0,pd:0,at:'home',ld:{type:'none',lines:[]},cli:-1,lo:false,lyricOffset:0,server:'1',radioMode:false,smartQueue:false};
try{S.server=localStorage.getItem('nanzz_server')||'1';}catch(e){}
function fm(s){if(isNaN(s))return"0:00";const m=Math.floor(s/60),se=Math.floor(s%60);return m+':'+(se<10?'0':'')+se;}
function es(t){if(!t)return'';const d=document.createElement('div');d.textContent=t;return d.innerHTML;}
function cn(t){if(!t)return'Unknown';return t.replace(/[^\x20-\x7E\xA0-\xFF\u0100-\uFFFF]/g,'').replace(/\s*-\s*Topic$/i,'').trim()||'Unknown';}
function gid(id){return document.getElementById(id);}

function updateOG(title,image){
    var t=document.querySelector('meta[property="og:title"]');if(!t){t=document.createElement('meta');t.setAttribute('property','og:title');document.head.appendChild(t);}t.setAttribute('content',title+' | RZmusic');
    var i=document.querySelector('meta[property="og:image"]');if(!i){i=document.createElement('meta');i.setAttribute('property','og:image');document.head.appendChild(i);}i.setAttribute('content',image||FI);
    document.title=title+' - RZmusic';
}

const yt=document.createElement('script');yt.src="https://www.youtube.com/iframe_api";document.head.appendChild(yt);
function onYouTubeIframeAPIReady(){S.yp=new YT.Player('yt-player',{height:'0',width:'0',playerVars:{autoplay:1,controls:0,enablejsapi:1,playsinline:1},events:{onReady:function(){S.yr=true;},onStateChange:ys}});}
function ys(e){if(S.server!=='1')return;if(e.data===1){S.ip=true;S.il=false;UB();SP();}else if(e.data===2){S.ip=false;UB();ST();}else if(e.data===0){ST();if(S.rm==='one'){S.yp.seekTo(0);S.yp.playVideo();}else if(S.autoNext){NX();}}else if(e.data===3){S.il=true;UB();}}

// ---- AUDIO ENGINE SERVER 2 (elemen <audio> native, sumber stream dari /api/ytplay) ----
var AU=gid('audio-player');
if(!AU){AU=document.createElement('audio');AU.id='audio-player';AU.preload='auto';AU.style.display='none';document.body.appendChild(AU);}
AU.addEventListener('play',function(){if(S.server==='2'){S.ip=true;S.il=false;UB();SP();}});
AU.addEventListener('pause',function(){if(S.server==='2'&&!AU.ended){S.ip=false;UB();ST();}});
AU.addEventListener('waiting',function(){if(S.server==='2'){S.il=true;UB();}});
AU.addEventListener('playing',function(){if(S.server==='2'){S.il=false;UB();}});
AU.addEventListener('ended',function(){if(S.server!=='2')return;ST();if(S.rm==='one'){AU.currentTime=0;AU.play().catch(function(){});}else if(S.autoNext){NX();}else{S.ip=false;UB();}});
AU.addEventListener('error',function(){if(S.server==='2'&&AU.src){S.il=false;S.ip=false;UB();showToast('Server 2 gagal memutar lagu ini','alert-triangle');}});

function SP(){
    ST();
    S.iv=setInterval(function(){
        if(S.server==='2'){
            if(!AU.paused){S.pt=AU.currentTime||0;S.pd=AU.duration||0;renderProgress();}
        }else if(S.yp&&S.yr&&S.ip){
            S.pt=S.yp.getCurrentTime()||0;S.pd=S.yp.getDuration()||0;renderProgress();
        }
    },200);
}
function ST(){if(S.iv){clearInterval(S.iv);S.iv=null;}}
function renderProgress(){
    var p=S.pd>0?(S.pt/S.pd)*100:0;
    var mp=gid('mini-progress'),fp=gid('full-progress'),sb=gid('seek-bar'),tc=gid('time-curr'),td=gid('time-dur');
    if(mp)mp.style.width=p+'%';if(fp)fp.style.width=p+'%';if(sb)sb.value=p;if(tc)tc.innerText=fm(S.pt);if(td)td.innerText=fm(S.pd);ULH(S.pt);
}

function UB(){
    var mi=gid('mini-play-btn'),fu=gid('full-play-btn');
    if(!mi||!fu)return;
    if(S.il){mi.innerHTML='<div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>';fu.innerHTML='<div class="w-6 h-6 border-3 border-black border-t-transparent rounded-full animate-spin"></div>';}
    else if(S.ip){mi.innerHTML='<i data-lucide="pause" class="w-6 h-6 fill-current"></i>';fu.innerHTML='<i data-lucide="pause" class="w-7 h-7 fill-current"></i>';}
    else{mi.innerHTML='<i data-lucide="play" class="w-6 h-6 fill-current"></i>';fu.innerHTML='<i data-lucide="play" class="w-7 h-7 fill-current ml-0.5"></i>';}
    lucide.createIcons();
    // Vinyl rotation
    var vc=gid('full-cover');
    if(vc){
        if(S.ip){vc.classList.add('vinyl-playing');vc.classList.remove('vinyl-paused');}
        else{vc.classList.remove('vinyl-playing');vc.classList.add('vinyl-paused');}
    }
    // Update mini EQ
    if(MP&&MP._updateEq)MP._updateEq();
    // Update lyric widget di home
    if(Home&&Home.updateLyricWidget)Home.updateLyricWidget();
    // Update Media Session
    updateMediaSession();
}

function UU(){if(!S.ct)return;var mc=gid('mini-cover'),mt=gid('mini-title'),ma=gid('mini-artist'),fc=gid('full-cover'),ft=gid('full-title'),fa=gid('full-artist'),fh=gid('full-header-artist'),fb=gid('full-bg-blur');if(mc)mc.src=S.ct.cover;if(mt)mt.innerText=S.ct.title;if(ma)ma.innerText=S.ct.artist;if(fc)fc.src=S.ct.cover;if(ft)ft.innerText=S.ct.title;if(fa)fa.innerText=S.ct.artist;if(fh)fh.innerText=S.ct.artist;if(fb)fb.src=S.ct.cover;updateOG(S.ct.title,S.ct.cover);DynBG.update(S.ct.cover);}

var DynBG={
  _el:null,
  _last:'',
  init:function(){
    if(DynBG._el)return;
    var el=document.createElement('div');
    el.id='dynbg-layer';
    el.style.cssText='position:fixed;inset:0;z-index:-1;pointer-events:none;transition:opacity 1.2s ease;opacity:0;overflow:hidden;';
    var img=document.createElement('img');
    img.id='dynbg-img';
    img.style.cssText='width:100%;height:100%;object-fit:cover;filter:blur(80px) brightness(0.25) saturate(2.5);transform:scale(1.3);';
    el.appendChild(img);
    document.body.appendChild(el);
    DynBG._el=el;
  },
  update:function(coverUrl){
    if(!coverUrl||coverUrl===DynBG._last)return;
    DynBG._last=coverUrl;
    DynBG.init();
    var el=DynBG._el;
    var img=gid('dynbg-img');
    el.style.opacity='0';
    setTimeout(function(){
      img.onload=function(){el.style.opacity='1';};
      img.onerror=function(){el.style.opacity='0';};
      img.src=coverUrl;
    },300);
  }
};

// PLAY TRACK - AUTO FETCH LYRICS
function PK(s,i){
    var l=[];if(s==='home1')l=S.ht.slice(0,6);else if(s==='home2')l=S.ht.slice(6,12);else if(s==='search')l=S.sr;else if(s==='playlist')l=S.pl;
    if(!l[i])return;S.ps=s;S.pl=l;S.pi=i;S.ct=l[i];
    var url=location.origin+'/?play='+S.ct.videoId;history.pushState({},'',url);
    UU();MP.show();S.il=true;UB();
    saveHistory(S.ct);
    saveLastTrack();
    updateFavBtn();
    // RESET & FETCH LYRICS BARU (langsung pas miniplayer muncul)
    resetLyricsUI(S.ct.videoId);
    
    loadTrack(S.ct);
}

// MUAT TRACK SESUAI SERVER PEMUTAR YANG AKTIF
function loadTrack(track,resumeAt){
    if(!track)return;
    ST();
    if(S.server==='2'){
        if(S.yp&&S.yr){try{S.yp.stopVideo();}catch(e){}}
        playViaServer2(track,resumeAt);
    }else{
        try{AU.pause();}catch(e){}
        if(S.yp&&S.yr&&track.videoId){
            S.yp.loadVideoById({videoId:track.videoId});
            if(resumeAt)try{S.yp.seekTo(resumeAt,true);}catch(e){}
        }
    }
}
// SERVER 2 - ambil direct audio stream dari /api/ytplay lalu putar via elemen <audio>
async function playViaServer2(track,resumeAt){
    S.il=true;UB();
    try{
        var ytUrl=track.ytUrl||('https://youtube.com/watch?v='+track.videoId);
        var r=await fetch(API.ytplay,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query:ytUrl})});
        var d=await r.json();
        if(S.ct!==track)return; // user udah pindah lagu sebelum fetch ini selesai
        if(d&&d.status&&d.result&&d.result.download&&d.result.download.audio){
            AU.src=d.result.download.audio;
            if(resumeAt){
                var onMeta=function(){AU.currentTime=resumeAt;AU.removeEventListener('loadedmetadata',onMeta);};
                AU.addEventListener('loadedmetadata',onMeta);
            }
            AU.play().catch(function(){});
        }else{
            S.il=false;S.ip=false;UB();showToast('Server 2 gagal memuat lagu ini','alert-triangle');
        }
    }catch(e){
        if(S.ct===track){S.il=false;S.ip=false;UB();showToast('Server 2 gagal memuat lagu ini','alert-triangle');}
    }
}

function TP(){
    if(!S.ct)return;
    if(S.server==='2'){
        if(!AU.src)return;
        if(AU.paused)AU.play().catch(function(){});else AU.pause();
    }else{
        if(!S.yp||!S.yr)return;
        S.ip?S.yp.pauseVideo():S.yp.playVideo();
    }
}
function NX(){
    if(!S.pl.length)return;
    var ni=S.pi+1;
    if(ni<S.pl.length){
        PK(S.ps,ni);
    } else if(S.rm==='all'){
        PK(S.ps,0);
    } else if(S.radioMode){
        // Radio Mode: cari lagu serupa terus-menerus
        NX_radio();
    } else if(S.smartQueue){
        // Smart Queue: cari lagu serupa tapi tidak dari hasil search
        NX_smartQueue();
    } else {
        S.ip=false;UB();
    }
}

// RADIO MODE — cari lagu baru terus-menerus berdasarkan yang sedang diputar
async function NX_radio(){
    if(!S.ct)return;
    showToast('🎙️ Radio: mencari lagu serupa...','music');
    try{
        // Cari berdasarkan artis dan genre
        var queries=[
            S.ct.artist,
            S.ct.artist+' lagu terbaik',
            S.ct.title+' genre serupa'
        ];
        var q=queries[Math.floor(Math.random()*queries.length)];
        var r=await fetch(API.search+'?query='+encodeURIComponent(q));
        var d=await r.json();
        if(d.status&&d.result.songs&&d.result.songs.length>0){
            // Filter lagu yang sudah pernah diputar di sesi ini
            var played=new Set(S.pl.map(function(t){return t.videoId;}));
            var fresh=d.result.songs
                .map(function(s){return{id:s.videoId,videoId:s.videoId,title:cn(s.title),artist:cn(s.artist),artistId:s.artistId||'',cover:s.thumbnail||FI,ytUrl:s.url};})
                .filter(function(s){return!played.has(s.videoId);});
            if(fresh.length===0)fresh=d.result.songs.map(function(s){return{id:s.videoId,videoId:s.videoId,title:cn(s.title),artist:cn(s.artist),artistId:s.artistId||'',cover:s.thumbnail||FI,ytUrl:s.url};});
            // Ambil 1 lagu acak dari hasil
            var pick=fresh[Math.floor(Math.random()*Math.min(fresh.length,5))];
            // Tambah ke playlist
            S.pl.push(pick);
            S.pi=S.pl.length-1;
            S.ct=pick;
            UU();S.il=true;UB();saveHistory(S.ct);saveLastTrack();updateFavBtn();
            resetLyricsUI(S.ct.videoId);loadTrack(S.ct);
        }else{S.ip=false;UB();}
    }catch(e){S.ip=false;UB();}
}

// SMART QUEUE — rekomendasi lagu baru (bukan lanjut search result)
async function NX_smartQueue(){
    if(!S.ct)return;
    showToast('✨ Mencari rekomendasi...','music');
    try{
        // Gunakan history user untuk rekomendasi lebih personal
        var hist=getHistory();
        var recentArtists=hist.slice(0,5).map(function(t){return t.artist;}).filter(Boolean);
        var q;
        if(recentArtists.length>0){
            // Rekomendasikan berdasarkan artis yang sering didengar
            var randomArtist=recentArtists[Math.floor(Math.random()*recentArtists.length)];
            q=randomArtist+' lagu terbaik';
        }else{
            q=S.ct.artist+' '+S.ct.title;
        }
        var r=await fetch(API.search+'?query='+encodeURIComponent(q));
        var d=await r.json();
        if(d.status&&d.result.songs&&d.result.songs.length>1){
            var played=new Set(S.pl.map(function(t){return t.videoId;}));
            var candidates=d.result.songs
                .map(function(s){return{id:s.videoId,videoId:s.videoId,title:cn(s.title),artist:cn(s.artist),artistId:s.artistId||'',cover:s.thumbnail||FI,ytUrl:s.url};})
                .filter(function(s){return!played.has(s.videoId);});
            if(candidates.length>0){
                // Acak dari 5 kandidat teratas
                candidates.sort(function(){return Math.random()-0.5;});
                var pick=candidates[0];
                S.pl.push(pick);
                S.pi=S.pl.length-1;
                S.ct=pick;
                UU();S.il=true;UB();saveHistory(S.ct);saveLastTrack();updateFavBtn();
                resetLyricsUI(S.ct.videoId);loadTrack(S.ct);
                return;
            }
        }
        S.ip=false;UB();
    }catch(e){S.ip=false;UB();}
}

// Toggle Radio Mode
function toggleRadioMode(){
    S.radioMode=!S.radioMode;
    if(S.radioMode){S.smartQueue=false;}
    showToast(S.radioMode?'🎙️ Radio Mode ON':'Radio Mode OFF', S.radioMode?'radio':'x-circle');
    updateRadioBtns();
}

// Toggle Smart Queue
function toggleSmartQueue(){
    S.smartQueue=!S.smartQueue;
    if(S.smartQueue){S.radioMode=false;}
    showToast(S.smartQueue?'✨ Smart Queue ON':'Smart Queue OFF', S.smartQueue?'sparkles':'x-circle');
    updateRadioBtns();
}

function updateRadioBtns(){
    var rb=gid('radio-btn'),sq=gid('smart-queue-btn');
    if(rb)rb.classList.toggle('text-[#1ed760]',!!S.radioMode);
    if(sq)sq.classList.toggle('text-[#1ed760]',!!S.smartQueue);
}
function PV(){
    if(!S.pl.length)return;
    if(S.pt>3){
        if(S.server==='2'){AU.currentTime=0;}else if(S.yp&&S.yr){S.yp.seekTo(0);}
        return;
    }
    var pi=S.pi-1;if(pi<0)pi=S.pl.length-1;PK(S.ps,pi);
}
function SK(v){
    if(S.server==='2'){
        if(AU.duration)AU.currentTime=(parseFloat(v)/100)*AU.duration;
    }else{
        if(S.yp&&S.yr&&S.pd>0)S.yp.seekTo((parseFloat(v)/100)*S.pd,true);
    }
}
function TR(){var b=gid('btn-repeat'),d=gid('repeat-dot'),o=gid('repeat-one');if(S.rm==='off'){S.rm='all';b.classList.add('text-[#cfd3d8]');d.classList.remove('hidden');}else if(S.rm==='all'){S.rm='one';o.classList.remove('hidden');}else{S.rm='off';b.classList.remove('text-[#cfd3d8]');d.classList.add('hidden');o.classList.add('hidden');}}
function SF(){if(S.pl.length)PK(S.ps,Math.floor(Math.random()*S.pl.length));}
function toggleAutoNext(){S.autoNext=!S.autoNext;showToast(S.autoNext?'Putar Berikutnya: ON':'Putar Berikutnya: OFF',S.autoNext?'check-circle':'pause');}

function shareTrack(){if(!S.ct||!S.ct.videoId)return;var url=location.origin+'/?play='+S.ct.videoId+'&share=1';updateOG(S.ct.title,S.ct.cover);if(navigator.share){navigator.share({title:S.ct.title,text:S.ct.title+' - '+S.ct.artist,url:url}).catch(function(){});}}

// ============================================================
// PENGATURAN SERVER PEMUTAR
// ============================================================
function setServer(v){
    if(S.server===v){closeServerSettings();return;}
    var prevTime=S.pt||0,hadTrack=!!S.ct;
    S.server=v;
    try{localStorage.setItem('nanzz_server',v);}catch(e){}
    if(v==='1'&&'Notification' in window&&Notification.permission==='default'){
        Notification.requestPermission().then(function(perm){
            if(perm==='granted')showToast('Izin notifikasi diberikan','check-circle');
            else showToast('Tanpa izin notifikasi, pemutaran di background bisa terhenti','alert-triangle');
        }).catch(function(){});
    }
    closeServerSettings();
    showToast('Server pemutar diganti ke Server '+v,'repeat');
    if(hadTrack){S.il=true;UB();loadTrack(S.ct,prevTime);}
}
function openServerSettings(){
    closeServerSettings();
    var s1=S.server==='1',s2=S.server==='2';
    var popup=document.createElement('div');
    popup.id='server-settings-popup';
    popup.className='fixed inset-0 z-[300] flex items-end justify-center bg-black/60';
    popup.onclick=function(e){if(e.target===popup)closeServerSettings();};
    popup.innerHTML='<div class="bg-[#1a1a1a] w-full max-w-md rounded-t-3xl p-6 border-t border-white/10" style="animation:slideUp 0.3s ease-out forwards;">'+
        '<div class="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4"></div>'+
        '<h3 class="font-bold text-white mb-1">Pengaturan Server</h3>'+
        '<p class="text-[#6b7280] text-xs mb-4">Pilih server pemutaran yang sesuai kebutuhanmu</p>'+
        '<button onclick="setServer(\'1\')" class="w-full text-left p-4 rounded-2xl mb-3 border '+(s1?'border-white/40 bg-white/10':'border-white/10 hover:bg-white/5')+' transition-all">'+
            '<div class="flex items-center justify-between"><span class="font-bold text-white">Server 1</span>'+(s1?'<i data-lucide="check-circle" class="w-5 h-5 text-[#1ed760]"></i>':'')+'</div>'+
            '<p class="text-[#b3b3b3] text-xs mt-1 flex items-center gap-1.5"><i data-lucide="zap" class="w-3.5 h-3.5 flex-shrink-0"></i>Lebih cepat, tapi perlu izin notifikasi agar tetap jalan saat aplikasi di background.</p>'+
        '</button>'+
        '<button onclick="setServer(\'2\')" class="w-full text-left p-4 rounded-2xl mb-2 border '+(s2?'border-white/40 bg-white/10':'border-white/10 hover:bg-white/5')+' transition-all">'+
            '<div class="flex items-center justify-between"><span class="font-bold text-white">Server 2</span>'+(s2?'<i data-lucide="check-circle" class="w-5 h-5 text-[#1ed760]"></i>':'')+'</div>'+
            '<p class="text-[#b3b3b3] text-xs mt-1 flex items-center gap-1.5"><i data-lucide="turtle" class="w-3.5 h-3.5 flex-shrink-0"></i>Sedikit lebih lambat memuat lagu, tapi tidak perlu izin notifikasi untuk tetap jalan di background.</p>'+
        '</button>'+
        '<button onclick="closeServerSettings()" class="w-full mt-3 py-3 border border-white/20 text-white rounded-full">Tutup</button>'+
    '</div>';
    document.body.appendChild(popup);
    lucide.createIcons();
}
function closeServerSettings(){var p=gid('server-settings-popup');if(p)p.remove();}

// RESET TAMPILAN LIRIK + FETCH BARU - dipanggil di SEMUA jalur play (klik lagu, share link, dll)
// biar lirik selalu fetch persis saat miniplayer pertama kali muncul
function resetLyricsUI(vid){
    S.ld={type:'none',lines:[]};S.cli=-1;S.lyricOffset=0;
    var lc=gid('lyrics-loading'),cc=gid('lyrics-content'),ec=gid('lyrics-empty');
    if(lc)lc.classList.remove('hidden');
    if(cc){cc.classList.add('hidden');cc.innerHTML='';}
    if(ec)ec.classList.add('hidden');
    updateSyncBadge();
    if(vid)FL(vid);
}

// LYRICS - AUTO FETCH + NO CACHE
async function FL(vid){
    var l=gid('lyrics-loading'),c=gid('lyrics-content'),e=gid('lyrics-empty');
    l.classList.remove('hidden');c.classList.add('hidden');e.classList.add('hidden');
    S.ld={type:'none',lines:[]};S.cli=-1;S.lyricOffset=0;updateSyncBadge();
    try{
        // Tambah timestamp biar gak cache
        var r=await fetch(API.lyrics+'?id='+vid+'&t='+Date.now());
        var d=await r.json();
        if(d.status&&d.result.lyrics&&d.result.lyrics.lines.length>0){
            S.ld=d.result.lyrics;var html='';
            S.ld.lines.forEach(function(li,i){
                html+='<p class="lyric-line text-left px-2" data-time="'+li.time+'" onclick="SLT('+li.time+')">'+es(li.text)+'</p>';
            });
            html+='<p class="text-center text-[#4b5563] text-xs mt-8 mb-4 opacity-50 tracking-widest">——— end ———</p>';
            c.innerHTML=html;l.classList.add('hidden');c.classList.remove('hidden');
        }else{l.classList.add('hidden');e.classList.remove('hidden');}
    }catch(er){l.classList.add('hidden');e.classList.remove('hidden');}
}

function ULH(ct){
    if(S.ld.lines.length===0)return;
    var ni=-1;for(var i=0;i<S.ld.lines.length;i++){if(ct>=S.ld.lines[i].time){ni=i;}}
    // Terapkan offset sinkronisasi manual (tombol +/-) di atas hasil deteksi otomatis
    var off=S.lyricOffset||0;
    var ei=ni+off;
    if(ei<-1)ei=-1;
    if(ei>S.ld.lines.length-1)ei=S.ld.lines.length-1;
    if(ei===S.cli)return;
    var ls=document.querySelectorAll('.lyric-line');
    ls.forEach(function(l,i){
        l.classList.remove('lyric-past','lyric-active');
        if(i<ei)l.classList.add('lyric-past');
        else if(i===ei){l.classList.add('lyric-active');l.scrollIntoView({behavior:'smooth',block:'center'});}
    });
    S.cli=ei;
    // Update preview lirik di atas nama artis
    var prev=gid('full-lyric-preview');
    if(prev){
        var txt=ei>=0&&S.ld.lines[ei]?S.ld.lines[ei].text:'';
        if(txt){prev.textContent=txt;prev.classList.remove('hidden');}
        else{prev.classList.add('hidden');}
    }
}
function SLT(t){if(S.yp&&S.yr)S.yp.seekTo(t,true);}

// SINKRONISASI MANUAL LIRIK - tombol + maju 1 lirik, tombol - mundur 1 lirik
function adjustLyricSync(delta){
    if(!S.ld||!S.ld.lines||S.ld.lines.length===0){showToast('Lirik belum tersedia','alert-triangle');return;}
    var max=S.ld.lines.length-1;
    S.lyricOffset=(S.lyricOffset||0)+delta;
    if(S.lyricOffset>max)S.lyricOffset=max;
    if(S.lyricOffset<-max)S.lyricOffset=-max;
    S.cli=-2; // pastikan ULH re-render walau index hasil hitungan sama
    ULH(S.pt);
    updateSyncBadge();
    showToast((delta>0?'Lirik maju':'Lirik mundur')+' 1 baris',delta>0?'skip-forward':'skip-back');
}
function lyricSyncNext(){adjustLyricSync(1);}
function lyricSyncPrev(){adjustLyricSync(-1);}
function updateSyncBadge(){
    var b=gid('lyric-sync-badge');if(!b)return;
    var o=S.lyricOffset||0;
    if(o===0){b.classList.add('hidden');b.innerText='';}
    else{b.classList.remove('hidden');b.innerText=(o>0?'+':'')+o;}
}

function toggleLyrics(){
    var o=gid('lyrics-overlay');
    if(S.lo){
        o.classList.add('fp-animating');
        o.style.transform='translateY(100%)';
        setTimeout(function(){o.style.display='none';o.classList.remove('fp-animating');},400);
        S.lo=false;MP.show();
    }else{
        o.classList.add('fp-animating');
        o.style.display='flex';
        // Inject dynbg clone ke lyrics overlay
        var existBg=o.querySelector('#lyrics-dynbg');
        if(!existBg&&S.ct&&S.ct.cover){
            var bgDiv=document.createElement('div');
            bgDiv.id='lyrics-dynbg';
            bgDiv.style.cssText='position:absolute;inset:0;z-index:0;pointer-events:none;overflow:hidden;';
            var bgImg=document.createElement('img');
            bgImg.src=S.ct.cover;
            bgImg.style.cssText='width:100%;height:100%;object-fit:cover;filter:blur(80px) brightness(0.2) saturate(2.5);transform:scale(1.3);';
            bgDiv.appendChild(bgImg);
            o.insertBefore(bgDiv,o.firstChild);
        } else if(existBg&&S.ct&&S.ct.cover){
            var bi=existBg.querySelector('img');if(bi)bi.src=S.ct.cover;
        }
        requestAnimationFrame(function(){requestAnimationFrame(function(){o.style.transform='translateY(0)';});});
        setTimeout(function(){o.classList.remove('fp-animating');},380);
        S.lo=true;MP.hide();
        if(S.ct&&S.ct.videoId&&S.ld.lines.length===0)FL(S.ct.videoId);
    }
}

// PLAYLIST SYSTEM
function getUserPlaylists(){try{return JSON.parse(localStorage.getItem('nanzz_playlists')||'[]');}catch(e){return[];}}
function saveUserPlaylists(pls){try{localStorage.setItem('nanzz_playlists',JSON.stringify(pls));}catch(e){}}
function createPlaylist(name,image){var pls=getUserPlaylists();var id='pl_'+Date.now();pls.push({id:id,name:name,image:image||'',songs:[]});saveUserPlaylists(pls);return id;}
function addToPlaylistById(playlistId,track){var pls=getUserPlaylists();var pl=pls.find(function(p){return p.id===playlistId;});if(!pl)return;var exists=pl.songs.find(function(s){return s.videoId===track.videoId;});if(!exists){pl.songs.push({id:track.id,videoId:track.videoId,title:track.title,artist:track.artist,cover:track.cover,artistId:track.artistId||'',ytUrl:track.ytUrl});if(!pl.image&&pl.songs.length===1){pl.image=track.cover;}saveUserPlaylists(pls);showToast('Ditambahkan ke '+pl.name,'check-circle');}else{showToast('Sudah ada di playlist','alert-triangle');}}
function showToast(msg,icon){var toast=document.createElement('div');toast.className='fixed bottom-24 left-1/2 -translate-x-1/2 bg-[#1ed760] text-black font-bold px-5 py-2.5 rounded-full shadow-2xl z-[999] flex items-center gap-2';toast.style.animation='slideUp 0.3s ease-out forwards';toast.innerHTML=(icon?'<i data-lucide="'+icon+'" class="w-4 h-4 flex-shrink-0"></i>':'')+'<span>'+es(msg)+'</span>';document.body.appendChild(toast);lucide.createIcons();setTimeout(function(){toast.remove();},2000);}
function addCurrentToPlaylist(){if(!S.ct)return;var pls=getUserPlaylists();if(pls.length===0){showToast('Belum ada playlist! Buat di Library dulu','alert-triangle');return;}showPlaylistPicker(S.ct);}
function showPlaylistPicker(track){var pls=getUserPlaylists();var popup=document.createElement('div');popup.className='fixed inset-0 z-[300] flex items-end justify-center bg-black/60';popup.onclick=function(e){if(e.target===popup)popup.remove();};var listHtml=pls.map(function(p){return'<button onclick="addToPlaylistById(\''+p.id+'\',S.ct);this.parentElement.parentElement.remove();" class="w-full text-left p-4 hover:bg-white/5 flex items-center gap-3 border-b border-white/5"><img src="'+(p.image||FI)+'" class="w-10 h-10 rounded object-cover" /><div><p class="font-medium text-white">'+p.name+'</p><p class="text-[#6b7280] text-xs">'+p.songs.length+' lagu</p></div></button>';}).join('');popup.innerHTML='<div class="bg-[#1a1a1a] w-full max-w-md rounded-t-3xl p-6 border-t border-white/10" style="animation:slideUp 0.3s ease-out forwards;"><div class="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4"></div><h3 class="font-bold text-white mb-3">Tambah ke Playlist</h3><div class="max-h-72 overflow-y-auto hide-scrollbar">'+listHtml+'</div><button onclick="this.parentElement.parentElement.remove()" class="w-full mt-3 py-3 border border-white/20 text-white rounded-full">Batal</button></div>';document.body.appendChild(popup);}
// ============================================================
// FAVORIT SYSTEM
// ============================================================
function getFavorites(){try{return JSON.parse(localStorage.getItem('rz_favorites')||'[]');}catch(e){return[];}}
function saveFavorites(favs){try{localStorage.setItem('rz_favorites',JSON.stringify(favs));}catch(e){}}
function isFavorite(videoId){return getFavorites().some(function(f){return f.videoId===videoId;});}
function toggleFavorite(){
    if(!S.ct)return;
    var favs=getFavorites();
    var idx=favs.findIndex(function(f){return f.videoId===S.ct.videoId;});
    if(idx>=0){favs.splice(idx,1);saveFavorites(favs);showToast('Dihapus dari Favorit','heart');updateFavBtn();}
    else{
        favs.unshift({id:S.ct.id,videoId:S.ct.videoId,title:S.ct.title,artist:S.ct.artist,cover:S.ct.cover,artistId:S.ct.artistId||'',ytUrl:S.ct.ytUrl||''});
        if(favs.length>200)favs=favs.slice(0,200);
        saveFavorites(favs);showToast('Ditambahkan ke Favorit ❤️','heart');updateFavBtn();
    }
}
function updateFavBtn(){
    var btn=gid('fav-btn');if(!btn)return;
    var liked=S.ct&&isFavorite(S.ct.videoId);
    btn.innerHTML='<i data-lucide="heart" class="w-6 h-6 '+(liked?'fill-current text-red-500':'text-white/60')+'"></i>';
    lucide.createIcons();
}

// ============================================================
// RIWAYAT PUTAR
// ============================================================
function getHistory(){try{return JSON.parse(localStorage.getItem('rz_history')||'[]');}catch(e){return[];}}
function saveHistory(track){
    if(!track||!track.videoId)return;
    var h=getHistory().filter(function(t){return t.videoId!==track.videoId;});
    h.unshift({id:track.id,videoId:track.videoId,title:track.title,artist:track.artist,cover:track.cover,artistId:track.artistId||'',ytUrl:track.ytUrl||'',playedAt:Date.now()});
    if(h.length>50)h=h.slice(0,50);
    try{localStorage.setItem('rz_history',JSON.stringify(h));}catch(e){}
}

// ============================================================
// LANJUT LAGU TERAKHIR
// ============================================================
function saveLastTrack(){
    if(!S.ct)return;
    try{localStorage.setItem('rz_last_track',JSON.stringify({track:S.ct,ps:S.ps,pt:S.pt}));}catch(e){}
}
function loadLastTrack(){
    try{
        var d=JSON.parse(localStorage.getItem('rz_last_track')||'null');
        if(!d||!d.track)return;
        S.ct=d.track;S.ps=d.ps||'direct';S.pl=[d.track];S.pi=0;
        UU();MP.show();S.il=false;S.ip=false;UB();
        resetLyricsUI(d.track.videoId);
        updateFavBtn();
    }catch(e){}
}

// ============================================================
// MEDIA SESSION API — fix nama di notifikasi HP
// ============================================================
function updateMediaSession(){
    if(!('mediaSession' in navigator)||!S.ct)return;
    navigator.mediaSession.metadata=new MediaMetadata({
        title:S.ct.title||'RZmusic',
        artist:S.ct.artist||'RZmusic',
        album:'RZmusic',
        artwork:[{src:S.ct.cover||'',sizes:'512x512',type:'image/jpeg'}]
    });
    navigator.mediaSession.setActionHandler('play',function(){TP();});
    navigator.mediaSession.setActionHandler('pause',function(){TP();});
    navigator.mediaSession.setActionHandler('nexttrack',function(){NX();});
    navigator.mediaSession.setActionHandler('previoustrack',function(){PV();});
}

// ============================================================
// SHUFFLE PLAYLIST
// ============================================================
var S_shuffled=false;
var S_origPl=[];
function toggleShuffle(){
    S_shuffled=!S_shuffled;
    var btn=gid('btn-shuffle');
    if(S_shuffled){
        S_origPl=S.pl.slice();
        var cur=S.pl.splice(S.pi,1)[0];
        var rest=S.pl.slice();
        for(var i=rest.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var tmp=rest[i];rest[i]=rest[j];rest[j]=tmp;}
        S.pl=[cur].concat(rest);S.pi=0;
        if(btn){btn.classList.add('text-[#cfd3d8]');}
        showToast('Shuffle ON','shuffle');
    }else{
        if(S_origPl.length){
            var curId=S.ct?S.ct.videoId:null;
            S.pl=S_origPl.slice();
            S.pi=curId?S.pl.findIndex(function(t){return t.videoId===curId;}):0;
            if(S.pi<0)S.pi=0;
            S_origPl=[];
        }
        if(btn){btn.classList.remove('text-[#cfd3d8]');}
        showToast('Shuffle OFF','shuffle');
    }
}

// ============================================================
// CROSSFADE
// ============================================================
var CF_DURATION=2.5; // detik crossfade
var CF_active=false;
function checkCrossfade(){
    if(!S.ip||CF_active)return;
    var remaining=S.pd-S.pt;
    if(remaining>0&&remaining<=CF_DURATION&&S.pd>10){
        CF_active=true;
        // Fade out audio current
        if(S.server==='2'&&AU){
            var vol=1;var fi=setInterval(function(){
                vol-=0.1;if(vol<=0){vol=0;clearInterval(fi);}
                try{AU.volume=vol;}catch(e){}
            },CF_DURATION*100);
        }
        // Load next track
        setTimeout(function(){
            CF_active=false;
            if(S.server==='2'&&AU)try{AU.volume=1;}catch(e){}
            NX();
        },CF_DURATION*1000);
    }
}

// Tambah crossfade check di renderProgress
var _origRenderProgress=renderProgress;
function renderProgress(){
    _origRenderProgress();
    checkCrossfade();
    if(Home&&Home.updateLyricWidget)Home.updateLyricWidget();
}

// ============================================================
// STATISTIK MUSIK
// ============================================================
function getStats(){
    try{return JSON.parse(localStorage.getItem('rz_stats')||'{}');}catch(e){return{};}
}
function updateStats(track){
    if(!track||!track.videoId)return;
    var s=getStats();
    if(!s.songs)s.songs={};
    if(!s.totalPlays)s.totalPlays=0;
    if(!s.totalMinutes)s.totalMinutes=0;
    if(!s.songs[track.videoId])s.songs[track.videoId]={title:track.title,artist:track.artist,cover:track.cover,plays:0};
    s.songs[track.videoId].plays++;
    s.totalPlays++;
    s.totalMinutes+=Math.floor((S.pd||0)/60);
    try{localStorage.setItem('rz_stats',JSON.stringify(s));}catch(e){}
}

// Panggil updateStats saat track berganti
var _origPK=PK;

// ============================================================
// SHARE TO STORY — Generate gambar untuk dibagikan
// ============================================================
function shareToStory(){
    if(!S.ct){showToast('Tidak ada lagu yang diputar','alert-triangle');return;}
    var popup=document.createElement('div');
    popup.className='fixed inset-0 z-[350] flex items-center justify-center bg-black/80';
    popup.onclick=function(e){if(e.target===popup)popup.remove();};

    // Buat canvas untuk generate gambar story
    var canvas=document.createElement('canvas');
    canvas.width=1080;canvas.height=1920;
    var ctx=canvas.getContext('2d');

    // Background gradient
    ctx.fillStyle='#050507';
    ctx.fillRect(0,0,1080,1920);

    // Gradient overlay
    var grad=ctx.createRadialGradient(540,700,0,540,700,800);
    grad.addColorStop(0,'rgba(30,215,96,0.3)');
    grad.addColorStop(1,'rgba(5,5,7,0)');
    ctx.fillStyle=grad;
    ctx.fillRect(0,0,1080,1920);

    // Load cover art
    var img=new Image();
    img.crossOrigin='anonymous';
    img.onload=function(){
        // Cover art bulat di tengah
        ctx.save();
        ctx.beginPath();
        ctx.arc(540,700,320,0,Math.PI*2);
        ctx.clip();
        ctx.drawImage(img,220,380,640,640);
        ctx.restore();

        // Border cover
        ctx.strokeStyle='rgba(255,255,255,0.15)';
        ctx.lineWidth=4;
        ctx.beginPath();
        ctx.arc(540,700,320,0,Math.PI*2);
        ctx.stroke();

        // Judul lagu
        ctx.fillStyle='#ffffff';
        ctx.font='bold 72px system-ui, -apple-system, sans-serif';
        ctx.textAlign='center';
        var title=S.ct.title;
        if(title.length>20)title=title.substring(0,20)+'...';
        ctx.fillText(title,540,1120);

        // Nama artis
        ctx.fillStyle='rgba(255,255,255,0.6)';
        ctx.font='48px system-ui, -apple-system, sans-serif';
        ctx.fillText(S.ct.artist,540,1190);

        // Watermark RZmusic
        ctx.fillStyle='rgba(30,215,96,0.8)';
        ctx.font='bold 42px system-ui, -apple-system, sans-serif';
        ctx.fillText('🎵 RZmusic',540,1320);

        ctx.fillStyle='rgba(255,255,255,0.3)';
        ctx.font='32px system-ui, -apple-system, sans-serif';
        ctx.fillText('rzmusic.vercel.app',540,1375);

        // Convert ke blob dan tampilkan
        canvas.toBlob(function(blob){
            var url=URL.createObjectURL(blob);
            popup.innerHTML='<div class="glass-strong rounded-3xl p-5 max-w-xs w-full mx-4">'+
                '<div class="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4"></div>'+
                '<h3 class="font-bold text-white text-center mb-3">Bagikan ke Story</h3>'+
                '<img src="'+url+'" class="w-full rounded-2xl mb-4 shadow-2xl" style="max-height:50vh;object-fit:contain;" />'+
                '<div class="space-y-2">'+
                '<button id="story-download" class="w-full btn-chrome font-bold py-3 rounded-full flex items-center justify-center gap-2 active:scale-95">'+
                    '<i data-lucide="download" class="w-4 h-4"></i>Download Gambar'+
                '</button>'+
                '<button id="story-share" class="w-full glass glass-hover text-white font-bold py-3 rounded-full flex items-center justify-center gap-2 active:scale-95">'+
                    '<i data-lucide="share-2" class="w-4 h-4"></i>Bagikan'+
                '</button>'+
                '<button onclick="this.closest(\'.fixed\').remove()" class="w-full text-[#6b7280] py-2 text-sm">Tutup</button>'+
                '</div></div>';
            document.body.appendChild(popup);
            lucide.createIcons();

            popup.querySelector('#story-download').onclick=function(){
                var a=document.createElement('a');
                a.href=url;a.download='rzmusic-story.png';a.click();
            };
            popup.querySelector('#story-share').onclick=function(){
                if(navigator.share&&navigator.canShare){
                    fetch(url).then(function(r){return r.blob();}).then(function(b){
                        var file=new File([b],'rzmusic-story.png',{type:'image/png'});
                        if(navigator.canShare({files:[file]})){
                            navigator.share({files:[file],title:S.ct.title+' - RZmusic'}).catch(function(){});
                        }else{
                            navigator.share({title:S.ct.title,text:'Lagi dengerin '+S.ct.title+' di RZmusic',url:location.origin+'/?play='+S.ct.videoId}).catch(function(){});
                        }
                    });
                }else{
                    showToast('Share tidak didukung browser ini','alert-triangle');
                }
            };
        },'image/png');
    };
    img.onerror=function(){
        // Kalau cover gagal load, generate tanpa cover
        ctx.fillStyle='rgba(255,255,255,0.05)';
        ctx.beginPath();ctx.arc(540,700,320,0,Math.PI*2);ctx.fill();
        ctx.fillStyle='rgba(255,255,255,0.2)';
        ctx.font='120px system-ui';ctx.textAlign='center';
        ctx.fillText('🎵',540,730);
        img.onload(null);
    };
    img.src=S.ct.cover;

    // Tampilkan loading dulu
    popup.innerHTML='<div class="glass-strong rounded-3xl p-8 text-center"><div class="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-3"></div><p class="text-white text-sm">Membuat gambar...</p></div>';
    document.body.appendChild(popup);
}
