// ============================================================
// NANZZMUSIFY - CORE PLAYER (FULL FIX)
// ============================================================
const API={search:'/api/search',artist:'/api/artist',suggest:'/api/suggest',lyrics:'/api/lyrics',ytplay:'/api/ytplay'};
const FI='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><rect width="300" height="300" fill="%232a2a2a"/><g transform="translate(90,90) scale(5)" fill="none" stroke="%236b7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></g></svg>');
const S={ht:[],sr:[],ar:[],sq:'',filter:'all',ct:null,pl:[],pi:-1,ps:'',ip:false,il:false,rm:'off',autoNext:true,yp:null,yr:false,iv:null,pt:0,pd:0,at:'home',ld:{type:'none',lines:[]},cli:-1,lo:false,lyricOffset:0,server:'1'};
try{S.server=localStorage.getItem('nanzz_server')||'1';}catch(e){}
function fm(s){if(isNaN(s))return"0:00";const m=Math.floor(s/60),se=Math.floor(s%60);return m+':'+(se<10?'0':'')+se;}
function es(t){if(!t)return'';const d=document.createElement('div');d.textContent=t;return d.innerHTML;}
function cn(t){if(!t)return'Unknown';return t.replace(/[^\x20-\x7E\xA0-\xFF\u0100-\uFFFF]/g,'').replace(/\s*-\s*Topic$/i,'').trim()||'Unknown';}
function gid(id){return document.getElementById(id);}

function updateOG(title,image){
    var t=document.querySelector('meta[property="og:title"]');if(!t){t=document.createElement('meta');t.setAttribute('property','og:title');document.head.appendChild(t);}t.setAttribute('content',title+' | NanzzMusify');
    var i=document.querySelector('meta[property="og:image"]');if(!i){i=document.createElement('meta');i.setAttribute('property','og:image');document.head.appendChild(i);}i.setAttribute('content',image||FI);
    document.title=title+' - NanzzMusify';
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
}

function UU(){if(!S.ct)return;var mc=gid('mini-cover'),mt=gid('mini-title'),ma=gid('mini-artist'),fc=gid('full-cover'),ft=gid('full-title'),fa=gid('full-artist'),fh=gid('full-header-artist'),fb=gid('full-bg-blur');if(mc)mc.src=S.ct.cover;if(mt)mt.innerText=S.ct.title;if(ma)ma.innerText=S.ct.artist;if(fc)fc.src=S.ct.cover;if(ft)ft.innerText=S.ct.title;if(fa)fa.innerText=S.ct.artist;if(fh)fh.innerText=S.ct.artist;if(fb)fb.src=S.ct.cover;updateOG(S.ct.title,S.ct.cover);}

// PLAY TRACK - AUTO FETCH LYRICS
function PK(s,i){
    var l=[];if(s==='home1')l=S.ht.slice(0,6);else if(s==='home2')l=S.ht.slice(6,12);else if(s==='search')l=S.sr;else if(s==='playlist')l=S.pl;
    if(!l[i])return;S.ps=s;S.pl=l;S.pi=i;S.ct=l[i];
    var url=location.origin+'/?play='+S.ct.videoId;history.pushState({},'',url);
    UU();MP.show();S.il=true;UB();
    
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
function NX(){if(!S.pl.length)return;var ni=S.pi+1;if(ni>=S.pl.length){if(S.rm==='all')ni=0;else{S.ip=false;UB();return;}}PK(S.ps,ni);}
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