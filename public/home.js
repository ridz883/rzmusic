const MOODS=[
  {label:'😊 Happy',q:'lagu happy vibes indonesia',color:'from-yellow-600/30 to-orange-600/20'},
  {label:'😢 Sedih',q:'lagu sedih galau indonesia',color:'from-blue-700/30 to-indigo-700/20'},
  {label:'🔥 Semangat',q:'lagu semangat motivasi indonesia',color:'from-red-600/30 to-pink-600/20'},
  {label:'😌 Santai',q:'lagu santai relax indonesia',color:'from-green-700/30 to-teal-700/20'},
  {label:'🌙 Malam',q:'lagu malam romantis indonesia',color:'from-purple-700/30 to-violet-700/20'},
  {label:'☀️ Pagi',q:'lagu pagi hari segar indonesia',color:'from-amber-600/30 to-yellow-600/20'}
];

const Home={
  render(){
    gid('view-home').innerHTML=`
    <div class="glass-pane border-b border-white/5 pt-12 pb-4 px-4 sticky top-0 z-10">
      <div class="flex justify-between items-center">
        <div><h1 class="text-3xl font-black chrome-text">RZmusic</h1><p class="text-[#b3b3b3] text-xs mt-0.5">Halo, selamat mendengarkan 🎵</p></div>
        <div class="flex items-center gap-2">
          <button id="auth-btn" onclick="RZAuth&&RZAuth.showAuthPopup()" class="glass glass-hover rounded-full p-2 text-[#b3b3b3] hover:text-white active:scale-90 w-9 h-9 flex items-center justify-center overflow-hidden">
            <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </button>
          <button onclick="Home.refresh()" class="glass glass-hover rounded-full p-2.5 text-[#b3b3b3] hover:text-white active:scale-90"><i data-lucide="refresh-cw" class="w-4 h-4"></i></button>
        </div>
      </div>
    </div>
    <div id="lyric-widget" class="hidden mx-4 mt-3 glass rounded-2xl p-3 cursor-pointer active:scale-[0.99] transition-all" onclick="FullPlayer.open()">
      <div class="flex items-center gap-2 mb-1">
        <div class="flex gap-0.5 items-end h-3">
          <span class="w-0.5 bg-white/60 rounded-full" style="height:4px;animation:eq1 0.8s ease-in-out infinite"></span>
          <span class="w-0.5 bg-white/60 rounded-full" style="height:10px;animation:eq1 0.8s ease-in-out infinite 0.2s"></span>
          <span class="w-0.5 bg-white/60 rounded-full" style="height:6px;animation:eq1 0.8s ease-in-out infinite 0.4s"></span>
        </div>
        <span class="text-white/40 text-[10px] uppercase tracking-widest">Lirik Sekarang</span>
      </div>
      <p id="home-lyric-text" class="text-white font-semibold text-sm truncate"></p>
      <p id="home-lyric-song" class="text-white/40 text-xs truncate mt-0.5"></p>
    </div>
    <div class="px-4 mt-4 space-y-6">
      <div>
        <h2 class="text-lg font-bold mb-3">Pilih Mood</h2>
        <div class="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
          ${MOODS.map(function(m,i){return'<button onclick="Home.playMood('+i+')" class="flex-shrink-0 glass glass-hover rounded-xl px-4 py-2.5 text-sm font-medium bg-gradient-to-br '+m.color+' active:scale-95 transition-all whitespace-nowrap">'+m.label+'</button>';}).join('')}
        </div>
      </div>
      <div><h2 class="text-lg font-bold mb-3">Untukmu</h2><div id="home-grid" class="grid grid-cols-2 gap-3"></div></div>
      <div>
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-lg font-bold">🇮🇩 Trending Indonesia</h2>
          <div id="trend-id-loading" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
        </div>
        <div id="home-trending-id" class="flex gap-4 overflow-x-auto hide-scrollbar pb-4"></div>
      </div>
      <div>
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-lg font-bold">🌍 Trending Global</h2>
          <div id="trend-gl-loading" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
        </div>
        <div id="home-trending-gl" class="flex gap-4 overflow-x-auto hide-scrollbar pb-4"></div>
      </div>
      <div><h2 class="text-lg font-bold mb-3">Jelajahi Lebih</h2><div id="home-scroll" class="flex gap-4 overflow-x-auto hide-scrollbar pb-4"></div></div>
    </div>`;
    lucide.createIcons();
    Home._injectEqStyle();
  },
  _injectEqStyle(){
    if(gid('eq-style'))return;
    var s=document.createElement('style');s.id='eq-style';
    s.textContent='@keyframes eq1{0%,100%{height:3px}50%{height:10px}}';
    document.head.appendChild(s);
  },
  async fetch(){
    try{
      var q=['lagu viral indonesia 2025','top hits indonesia terbaru','lagu indonesia populer'][Math.floor(Math.random()*3)];
      var r=await fetch(API.search+'?query='+encodeURIComponent(q));
      var d=await r.json();
      if(d.status&&d.result.songs){
        S.ht=d.result.songs.map(function(s){return{id:s.videoId,videoId:s.videoId,title:cn(s.title),artist:cn(s.artist),artistId:s.artistId||'',cover:s.thumbnail||FI,ytUrl:s.url};});
        Home.show();
      }
    }catch(e){}
    // Fetch trending paralel
    Home.fetchTrending();
  },
  async fetchTrending(){
    // Trending Indonesia
    var queries_id=['lagu viral indonesia 2025','top chart indonesia 2025','lagu hits indonesia terbaru 2025'];
    var queries_gl=['top global hits 2025','viral songs worldwide 2025','billboard hot 100 2025'];
    try{
      var qi=queries_id[Math.floor(Math.random()*queries_id.length)];
      var ri=await fetch(API.search+'?query='+encodeURIComponent(qi));
      var di=await ri.json();
      if(di.status&&di.result.songs){
        var songs_id=di.result.songs.slice(0,8).map(function(s){return{id:s.videoId,videoId:s.videoId,title:cn(s.title),artist:cn(s.artist),artistId:s.artistId||'',cover:s.thumbnail||FI,ytUrl:s.url};});
        Home._renderTrendingCards('home-trending-id','trend-id-loading',songs_id,'trending_id');
      }
    }catch(e){var li=gid('trend-id-loading');if(li)li.remove();}
    try{
      var qg=queries_gl[Math.floor(Math.random()*queries_gl.length)];
      var rg=await fetch(API.search+'?query='+encodeURIComponent(qg));
      var dg=await rg.json();
      if(dg.status&&dg.result.songs){
        var songs_gl=dg.result.songs.slice(0,8).map(function(s){return{id:s.videoId,videoId:s.videoId,title:cn(s.title),artist:cn(s.artist),artistId:s.artistId||'',cover:s.thumbnail||FI,ytUrl:s.url};});
        Home._renderTrendingCards('home-trending-gl','trend-gl-loading',songs_gl,'trending_gl');
      }
    }catch(e){var lg=gid('trend-gl-loading');if(lg)lg.remove();}
  },
  _renderTrendingCards(containerId,loadingId,songs,psKey){
    var c=gid(containerId),l=gid(loadingId);
    if(l)l.remove();
    if(!c||!songs.length)return;
    // Simpan ke S untuk PK
    S[psKey]=songs;
    c.innerHTML=songs.map(function(t,i){
      return'<div onclick="Home._playTrending(\''+psKey+'\','+i+')" class="flex-shrink-0 w-36 cursor-pointer active:scale-95 animate-stagger" style="animation-delay:'+(i*40)+'ms">'+
      '<div class="w-36 h-36 mb-2 relative rounded-xl overflow-hidden">'+
      '<img src="'+t.cover+'" class="w-full h-full object-cover" loading="lazy" onerror="this.src=\''+FI+'\'" />'+
      '<div class="absolute top-2 left-2 bg-black/60 rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold">'+(i+1)+'</div>'+
      '<div class="absolute bottom-2 right-2 btn-chrome rounded-full p-2 shadow-lg"><i data-lucide="play" class="w-3 h-3 fill-current ml-0.5"></i></div></div>'+
      '<h3 class="font-semibold text-xs truncate">'+es(t.title)+'</h3>'+
      '<p class="text-[#6b7280] text-[11px] truncate mt-0.5">'+es(t.artist)+'</p></div>';
    }).join('');
    lucide.createIcons();
  },
  _playTrending(psKey,i){
    var songs=S[psKey];
    if(!songs||!songs[i])return;
    S.pl=songs;S.pi=i;S.ps=psKey;S.ct=songs[i];
    UU();MP.show();S.il=true;UB();saveHistory(S.ct);saveLastTrack();updateFavBtn();
    resetLyricsUI(S.ct.videoId);loadTrack(S.ct);
  },
  show(){
    var g=gid('home-grid'),sc=gid('home-scroll');if(!g||!sc)return;
    g.innerHTML=S.ht.slice(0,6).map(function(t,i){
      return'<div onclick="PK(\'home1\','+i+')" class="glass glass-hover rounded-xl flex items-center gap-3 p-2 cursor-pointer active:scale-95 animate-stagger" style="animation-delay:'+(i*50)+'ms">'+
      '<img src="'+t.cover+'" class="w-14 h-14 rounded-lg object-cover shadow-lg flex-shrink-0" loading="lazy" onerror="this.src=\''+FI+'\'" />'+
      '<span class="font-bold text-sm line-clamp-2">'+es(t.title)+'</span></div>';
    }).join('');
    sc.innerHTML=S.ht.slice(6,12).map(function(t,i){
      return'<div onclick="PK(\'home2\','+i+')" class="flex-shrink-0 w-40 cursor-pointer active:scale-95 animate-stagger" style="animation-delay:'+((i+6)*50)+'ms">'+
      '<div class="w-40 h-40 mb-2 relative rounded-xl overflow-hidden glass-edge">'+
      '<img src="'+t.cover+'" class="w-full h-full object-cover" loading="lazy" onerror="this.src=\''+FI+'\'" />'+
      '<div class="absolute bottom-2 right-2 btn-chrome rounded-full p-2.5 shadow-lg"><i data-lucide="play" class="w-4 h-4 fill-current ml-0.5"></i></div></div>'+
      '<h3 class="font-semibold text-sm truncate">'+es(t.title)+'</h3>'+
      '<p class="text-[#6b7280] text-xs truncate mt-0.5">'+es(t.artist)+'</p></div>';
    }).join('');
    lucide.createIcons();
  },
  async playMood(i){
    var mood=MOODS[i];if(!mood)return;
    showToast('Memuat playlist '+mood.label+'...','music');
    try{
      var r=await fetch(API.search+'?query='+encodeURIComponent(mood.q));
      var d=await r.json();
      if(d.status&&d.result.songs&&d.result.songs.length>0){
        var songs=d.result.songs.map(function(s){return{id:s.videoId,videoId:s.videoId,title:cn(s.title),artist:cn(s.artist),artistId:s.artistId||'',cover:s.thumbnail||FI,ytUrl:s.url};});
        S.pl=songs;S.pi=0;S.ps='playlist';S.ct=songs[0];
        UU();MP.show();S.il=true;UB();saveHistory(S.ct);saveLastTrack();updateFavBtn();resetLyricsUI(S.ct.videoId);loadTrack(S.ct);
        showToast('Playlist '+mood.label+' siap!','check-circle');
      }else{showToast('Lagu tidak ditemukan','alert-triangle');}
    }catch(e){showToast('Gagal memuat mood','alert-triangle');}
  },
  updateLyricWidget(){
    var w=gid('lyric-widget'),lt=gid('home-lyric-text'),ls=gid('home-lyric-song');
    if(!w||!lt||!ls)return;
    if(!S.ct||!S.ip){w.classList.add('hidden');return;}
    var prev=gid('full-lyric-preview');
    var lyric=prev&&!prev.classList.contains('hidden')?prev.textContent:'';
    if(lyric){
      lt.textContent=lyric;
      ls.textContent=S.ct.title+' — '+S.ct.artist;
      w.classList.remove('hidden');
    }else{
      w.classList.add('hidden');
    }
  },
  refresh(){Home.fetch();gid('main-area').scrollTop=0;}
};

const Home={
  render(){
    gid('view-home').innerHTML=`
    <div class="glass-pane border-b border-white/5 pt-12 pb-4 px-4 sticky top-0 z-10">
      <div class="flex justify-between items-center">
        <div><h1 class="text-3xl font-black chrome-text">RZmusic</h1><p class="text-[#b3b3b3] text-xs mt-0.5">Halo, selamat mendengarkan 🎵</p></div>
        <div class="flex items-center gap-2">
          <button id="auth-btn" onclick="RZAuth.showAuthPopup()" class="glass glass-hover rounded-full p-2 text-[#b3b3b3] hover:text-white active:scale-90 w-9 h-9 flex items-center justify-center overflow-hidden">
            <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </button>
          <button onclick="Home.refresh()" class="glass glass-hover rounded-full p-2.5 text-[#b3b3b3] hover:text-white active:scale-90"><i data-lucide="refresh-cw" class="w-4 h-4"></i></button>
        </div>
      </div>
    </div>
    <div id="lyric-widget" class="hidden mx-4 mt-3 glass rounded-2xl p-3 cursor-pointer active:scale-[0.99] transition-all" onclick="FullPlayer.open()">
      <div class="flex items-center gap-2 mb-1">
        <div class="flex gap-0.5 items-end h-3">
          <span class="w-0.5 bg-white/60 rounded-full animate-[eq1_0.8s_ease-in-out_infinite]" style="height:4px;animation:eq1 0.8s ease-in-out infinite"></span>
          <span class="w-0.5 bg-white/60 rounded-full" style="height:10px;animation:eq1 0.8s ease-in-out infinite 0.2s"></span>
          <span class="w-0.5 bg-white/60 rounded-full" style="height:6px;animation:eq1 0.8s ease-in-out infinite 0.4s"></span>
        </div>
        <span class="text-white/40 text-[10px] uppercase tracking-widest">Lirik Sekarang</span>
      </div>
      <p id="home-lyric-text" class="text-white font-semibold text-sm truncate"></p>
      <p id="home-lyric-song" class="text-white/40 text-xs truncate mt-0.5"></p>
    </div>
    <div class="px-4 mt-4 space-y-6">
      <div>
        <h2 class="text-lg font-bold mb-3">Pilih Mood</h2>
        <div class="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
          ${MOODS.map(function(m,i){return'<button onclick="Home.playMood('+i+')" class="flex-shrink-0 glass glass-hover rounded-xl px-4 py-2.5 text-sm font-medium bg-gradient-to-br '+m.color+' active:scale-95 transition-all whitespace-nowrap">'+m.label+'</button>';}).join('')}
        </div>
      </div>
      <div><h2 class="text-lg font-bold mb-3">Untukmu</h2><div id="home-grid" class="grid grid-cols-2 gap-3"></div></div>
      <div><h2 class="text-lg font-bold mb-3">Jelajahi Lebih</h2><div id="home-scroll" class="flex gap-4 overflow-x-auto hide-scrollbar pb-4"></div></div>
    </div>`;
    lucide.createIcons();
    Home._injectEqStyle();
  },
  _injectEqStyle(){
    if(gid('eq-style'))return;
    var s=document.createElement('style');s.id='eq-style';
    s.textContent='@keyframes eq1{0%,100%{height:3px}50%{height:10px}}';
    document.head.appendChild(s);
  },
  async fetch(){
    try{
      var q=['lagu viral indonesia 2024','top hits indonesia','lagu terbaru'][Math.floor(Math.random()*3)];
      var r=await fetch(API.search+'?query='+encodeURIComponent(q));
      var d=await r.json();
      if(d.status&&d.result.songs){
        S.ht=d.result.songs.map(function(s){return{id:s.videoId,videoId:s.videoId,title:cn(s.title),artist:cn(s.artist),artistId:s.artistId||'',cover:s.thumbnail||FI,ytUrl:s.url};});
        Home.show();
      }
    }catch(e){}
  },
  show(){
    var g=gid('home-grid'),sc=gid('home-scroll');if(!g||!sc)return;
    g.innerHTML=S.ht.slice(0,6).map(function(t,i){
      return'<div onclick="PK(\'home1\','+i+')" class="glass glass-hover rounded-xl flex items-center gap-3 p-2 cursor-pointer active:scale-95 animate-stagger" style="animation-delay:'+(i*50)+'ms">'+
      '<img src="'+t.cover+'" class="w-14 h-14 rounded-lg object-cover shadow-lg flex-shrink-0" loading="lazy" onerror="this.src=\''+FI+'\'" />'+
      '<span class="font-bold text-sm line-clamp-2">'+es(t.title)+'</span></div>';
    }).join('');
    sc.innerHTML=S.ht.slice(6,12).map(function(t,i){
      return'<div onclick="PK(\'home2\','+i+')" class="flex-shrink-0 w-40 cursor-pointer active:scale-95 animate-stagger" style="animation-delay:'+((i+6)*50)+'ms">'+
      '<div class="w-40 h-40 mb-2 relative rounded-xl overflow-hidden glass-edge">'+
      '<img src="'+t.cover+'" class="w-full h-full object-cover" loading="lazy" onerror="this.src=\''+FI+'\'" />'+
      '<div class="absolute bottom-2 right-2 btn-chrome rounded-full p-2.5 shadow-lg"><i data-lucide="play" class="w-4 h-4 fill-current ml-0.5"></i></div></div>'+
      '<h3 class="font-semibold text-sm truncate">'+es(t.title)+'</h3>'+
      '<p class="text-[#6b7280] text-xs truncate mt-0.5">'+es(t.artist)+'</p></div>';
    }).join('');
    lucide.createIcons();
  },
  async playMood(i){
    var mood=MOODS[i];if(!mood)return;
    showToast('Memuat playlist '+mood.label+'...','music');
    try{
      var r=await fetch(API.search+'?query='+encodeURIComponent(mood.q));
      var d=await r.json();
      if(d.status&&d.result.songs&&d.result.songs.length>0){
        var songs=d.result.songs.map(function(s){return{id:s.videoId,videoId:s.videoId,title:cn(s.title),artist:cn(s.artist),artistId:s.artistId||'',cover:s.thumbnail||FI,ytUrl:s.url};});
        S.pl=songs;S.pi=0;S.ps='playlist';S.ct=songs[0];
        UU();MP.show();S.il=true;UB();saveHistory(S.ct);saveLastTrack();updateFavBtn();resetLyricsUI(S.ct.videoId);loadTrack(S.ct);
        showToast('Playlist '+mood.label+' siap!','check-circle');
      }else{showToast('Lagu tidak ditemukan','alert-triangle');}
    }catch(e){showToast('Gagal memuat mood','alert-triangle');}
  },
  updateLyricWidget(){
    var w=gid('lyric-widget'),lt=gid('home-lyric-text'),ls=gid('home-lyric-song');
    if(!w||!lt||!ls)return;
    if(!S.ct||!S.ip){w.classList.add('hidden');return;}
    var prev=gid('full-lyric-preview');
    var lyric=prev&&!prev.classList.contains('hidden')?prev.textContent:'';
    if(lyric){
      lt.textContent=lyric;
      ls.textContent=S.ct.title+' — '+S.ct.artist;
      w.classList.remove('hidden');
    }else{
      w.classList.add('hidden');
    }
  },
  refresh(){Home.fetch();gid('main-area').scrollTop=0;}
};
