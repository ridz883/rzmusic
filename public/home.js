const Home={
    render(){
        gid('view-home').innerHTML=`
        <div class="glass-pane border-b border-white/5 pt-12 pb-6 px-4 sticky top-0 z-10">
            <div class="flex justify-between items-center"><div><h1 class="text-3xl font-black chrome-text">NanzzMusify</h1><p class="text-[#b3b3b3] text-xs mt-1">Rekomendasi buat kamu</p></div><div class="flex items-center gap-2"><button onclick="openServerSettings()" class="glass glass-hover rounded-full p-2.5 text-[#b3b3b3] hover:text-white active:scale-90" title="Pengaturan Server"><i data-lucide="settings" class="w-4 h-4"></i></button><button onclick="Home.refresh()" class="glass glass-hover rounded-full p-2.5 text-[#b3b3b3] hover:text-white active:scale-90"><i data-lucide="refresh-cw" class="w-4 h-4"></i></button></div></div>
        </div>
        <div class="px-4 space-y-6 mt-4"><div id="home-grid" class="grid grid-cols-2 gap-3"></div><div><h2 class="text-lg font-bold mb-3">Playlist</h2><div id="home-scroll" class="flex gap-4 overflow-x-auto hide-scrollbar pb-4"></div></div></div>`;
        lucide.createIcons();
    },
    async fetch(){
        try{
            var q=['lagu viral indonesia 2024','top hits indonesia','lagu terbaru'][Math.floor(Math.random()*3)];
            var r=await fetch(API.search+'?query='+encodeURIComponent(q));
            var d=await r.json();
            if(d.status&&d.result.songs){S.ht=d.result.songs.map(function(s){return{id:s.videoId,videoId:s.videoId,title:cn(s.title),artist:cn(s.artist),artistId:s.artistId||'',cover:s.thumbnail||FI,ytUrl:s.url};});Home.show();}
        }catch(e){}
    },
    show(){
        var g=gid('home-grid'),s=gid('home-scroll');if(!g||!s)return;
        g.innerHTML=S.ht.slice(0,6).map(function(t,i){return'<div onclick="PK(\'home1\','+i+')" class="glass glass-hover rounded-xl flex items-center gap-3 p-2 cursor-pointer active:scale-95 animate-stagger" style="animation-delay:'+(i*50)+'ms"><img src="'+t.cover+'" class="w-14 h-14 rounded-lg object-cover shadow-lg" onerror="this.src=\''+FI+'\'" /><span class="font-bold text-sm line-clamp-2">'+es(t.title)+'</span></div>';}).join('');
        s.innerHTML=S.ht.slice(6,12).map(function(t,i){return'<div onclick="PK(\'home2\','+i+')" class="flex-shrink-0 w-40 cursor-pointer active:scale-95 animate-stagger" style="animation-delay:'+((i+6)*50)+'ms"><div class="w-40 h-40 mb-2 relative rounded-xl overflow-hidden glass-edge"><img src="'+t.cover+'" class="w-full h-full object-cover" onerror="this.src=\''+FI+'\'" /><div class="absolute bottom-2 right-2 btn-chrome rounded-full p-3 opacity-0 hover:opacity-100 transition-all shadow-lg shadow-black/40"><i data-lucide="play" class="w-5 h-5 fill-current ml-0.5"></i></div></div><h3 class="font-semibold text-sm truncate">'+es(t.title)+'</h3><p class="text-[#6b7280] text-xs truncate mt-1">'+es(t.artist)+'</p></div>';}).join('');
        lucide.createIcons();
    },
    refresh(){Home.fetch();gid('main-area').scrollTop=0;}
};