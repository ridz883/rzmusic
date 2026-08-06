// MOODS dengan variasi query biar lagu ganti-ganti setiap klik
const MOODS=[
  {label:'😊 Happy',queries:['lagu happy vibes indonesia','lagu bahagia ceria indonesia','lagu semangat happy indonesia','lagu pop ceria indonesia 2024'],color:'from-yellow-600/30 to-orange-600/20'},
  {label:'😢 Sedih',queries:['lagu sedih galau indonesia','lagu galau patah hati indonesia','lagu sedih menyentuh hati','lagu galau terbaru indonesia 2024'],color:'from-blue-700/30 to-indigo-700/20'},
  {label:'🔥 Semangat',queries:['lagu semangat motivasi indonesia','lagu energik semangat kerja','lagu hype indonesia 2024','lagu semangat pagi indonesia'],color:'from-red-600/30 to-pink-600/20'},
  {label:'😌 Santai',queries:['lagu santai relax indonesia','lagu slow santai indonesia','lagu akustik santai indonesia','lagu lo-fi santai indonesia'],color:'from-green-700/30 to-teal-700/20'},
  {label:'🌙 Malam',queries:['lagu malam romantis indonesia','lagu malam sunyi indonesia','lagu slow malam hari','lagu romantis malam indonesia 2024'],color:'from-purple-700/30 to-violet-700/20'},
  {label:'☀️ Pagi',queries:['lagu pagi hari segar indonesia','lagu pagi semangat indonesia','lagu morning vibes indonesia','lagu pagi ceria indonesia'],color:'from-amber-600/30 to-yellow-600/20'}
];

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
      var queries=['lagu viral indonesia 2024','top hits indonesia','lagu terbaru indonesia','lagu populer indonesia 2025','hits musik indonesia'];
      var q=queries[Math.floor(Math.random()*queries.length)];
      var r=await fetch(API.search+'?query='+encodeURIComponent(q));
      var d=await r.json();
      if(d.status&&d.result.songs){
        S.ht=d.result.songs.map(function(s){return{id:s.videoId,videoId:s.videoId,title:cn(s.title),artist:cn(s.artist),artistId:s.artistId||'',cover:s.thumbnail||FI,ytUrl:s.url};});
        // Acak urutan biar tidak monoton
        S.ht.sort(function(){return Math.random()-0.5;});
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
      // Pilih query acak dari daftar agar lagu berbeda setiap klik
      var queries=mood.queries;
      var q=queries[Math.floor(Math.random()*queries.length)];
      var r=await fetch(API.search+'?query='+encodeURIComponent(q)+'&_='+Date.now());
      var d=await r.json();
      if(d.status&&d.result.songs&&d.result.songs.length>0){
        var songs=d.result.songs.map(function(s){return{id:s.videoId,videoId:s.videoId,title:cn(s.title),artist:cn(s.artist),artistId:s.artistId||'',cover:s.thumbnail||FI,ytUrl:s.url};});
        // Acak urutan lagu biar berbeda setiap klik
        songs.sort(function(){return Math.random()-0.5;});
        S.pl=songs;S.pi=0;S.ps='playlist';S.ct=songs[0];
        UU();MP.show();S.il=true;UB();saveHistory(S.ct);saveLastTrack();updateFavBtn();resetLyricsUI(S.ct.videoId);loadTrack(S.ct);
        showToast('Playlist '+mood.label+' siap! 🎵','check-circle');
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
