const Search={
    getHistory(){try{return JSON.parse(localStorage.getItem('rz_search_history')||'[]');}catch(e){return[];}},
    saveHistory(q){if(!q)return;var h=Search.getHistory().filter(function(i){return i!==q;});h.unshift(q);if(h.length>20)h=h.slice(0,20);try{localStorage.setItem('rz_search_history',JSON.stringify(h));}catch(e){}},
    removeHistory(q){var h=Search.getHistory().filter(function(i){return i!==q;});try{localStorage.setItem('rz_search_history',JSON.stringify(h));}catch(e){}Search.renderHistory();},
    renderHistory(){
        var h=Search.getHistory();var c=gid('search-results');
        if(!c||S.sq)return;
        if(h.length===0){c.innerHTML='';return;}
        c.innerHTML='<p class="text-[#6b7280] text-xs font-semibold uppercase tracking-wider mb-2 px-1">Pencarian Terakhir</p>'+
        h.map(function(q){
            var safe=q.replace(/\\/g,'\\\\').replace(/'/g,"\\'");
            return '<div class="search-history-item">'+
                '<i data-lucide="clock" class="w-4 h-4 text-[#6b7280] flex-shrink-0"></i>'+
                '<span class="flex-1 text-sm text-white truncate" onclick="selectHistory(\''+safe+'\')">'+es(q)+'</span>'+
                '<button onclick="Search.removeHistory(\''+safe+'\')" class="text-[#6b7280] hover:text-white p-1 active:scale-90"><i data-lucide="x" class="w-4 h-4"></i></button>'+
                '</div>';
        }).join('');
        lucide.createIcons();
    },
    render(){
        gid('view-search').innerHTML=`
        <div class="pt-12 px-4">
            <h1 class="text-3xl font-black mb-4">Cari</h1>
            <form id="search-form" class="relative" autocomplete="off">
                <div class="absolute inset-y-0 left-0 pl-4 flex items-center text-[#6b7280]"><i data-lucide="search" class="h-5 w-5"></i></div>
                <input type="text" id="search-input" class="w-full glass-input text-white font-medium rounded-xl pl-12 pr-16 py-3.5 focus:outline-none placeholder:text-[#6b7280]" placeholder="Cari lagu, artis, lirik..." autocomplete="off" />
                <button type="submit" class="absolute right-2 top-1/2 -translate-y-1/2 btn-chrome font-bold px-4 py-1.5 rounded-lg active:scale-90">Cari</button>
            </form>
            <div id="suggestions" class="hidden mt-2 glass-strong rounded-xl shadow-2xl max-h-72 overflow-y-auto hide-scrollbar"></div>
            <div class="flex gap-2 mt-3 mb-1">
                <button onclick="Search.setMode('normal')" id="mode-normal" class="flex-1 py-2 rounded-full text-xs font-medium transition-all bg-white text-black">🎵 Lagu</button>
                <button onclick="Search.setMode('lyric')" id="mode-lyric" class="flex-1 py-2 rounded-full text-xs font-medium transition-all glass text-white">📝 Cari by Lirik</button>
            </div>
        </div>
        <div id="filter-tabs" class="hidden flex gap-2 px-4 pb-3 mt-2">
            <button onclick="setFilter('all')" id="f-all" class="filter-tab active px-4 py-2 rounded-full text-sm font-medium bg-white text-black">Semua</button>
        </div>
        <div class="px-4 mt-2" id="search-results"></div>`;
        lucide.createIcons();Search.events();Search.renderHistory();
        S._searchMode = 'normal';
    },
    setMode(mode){
        S._searchMode = mode;
        var n=gid('mode-normal'),l=gid('mode-lyric');
        if(mode==='normal'){n.className='flex-1 py-2 rounded-full text-xs font-medium transition-all bg-white text-black';l.className='flex-1 py-2 rounded-full text-xs font-medium transition-all glass text-white';}
        else{l.className='flex-1 py-2 rounded-full text-xs font-medium transition-all bg-white text-black';n.className='flex-1 py-2 rounded-full text-xs font-medium transition-all glass text-white';}
        var si=gid('search-input');
        if(si)si.placeholder = mode==='lyric' ? 'Ketik potongan lirik...' : 'Cari lagu, artis, atau album...';
    },
    events(){
        var sf=gid('search-form'),si=gid('search-input');if(!sf||!si)return;
        sf.addEventListener('submit',async function(e){
            e.preventDefault();S.sq=si.value.trim();gid('suggestions').classList.add('hidden');
            if(!S.sq){S.ar=[];S.sr=[];Search.renderHistory();return;}
            Search.saveHistory(S.sq);
            var url=location.origin+'/?search='+encodeURIComponent(S.sq);history.pushState({},'',url);
            Search.show(true);
            try{
                // Mode cari by lirik: tambah kata kunci "lirik" agar hasil lebih akurat
                var query=S.sq;
                if(S._searchMode==='lyric'){query=S.sq+' lirik lagu';}
                var r=await fetch(API.search+'?query='+encodeURIComponent(query));
                var d=await r.json();
                S.ar=d.status&&d.result.songs?d.result.songs.map(function(s){return{id:s.videoId,videoId:s.videoId,title:cn(s.title),artist:cn(s.artist),artistId:s.artistId||'',cover:s.thumbnail||FI,ytUrl:s.url};}):[];
                gid('filter-tabs').classList.remove('hidden');Search.apply();
            }catch(e){S.ar=[];Search.show();}
        });
        si.addEventListener('input',function(){
            var q=this.value.trim();
            if(!q){gid('suggestions').classList.add('hidden');if(!S.sq)Search.renderHistory();return;}
            if(S._searchMode==='lyric'){gid('suggestions').classList.add('hidden');return;}
            fetch(API.suggest+'?q='+encodeURIComponent(q)).then(function(r){return r.json();}).then(function(s){
                if(Array.isArray(s)&&s.length>0){
                    gid('suggestions').innerHTML=s.map(function(sg){return'<div onclick="selectSuggestion(\''+es(sg).replace(/'/g,"\\'")+'\')" class="px-4 py-3 hover:bg-white/5 cursor-pointer text-sm">'+es(sg)+'</div>';}).join('');
                    gid('suggestions').classList.remove('hidden');
                }else{gid('suggestions').classList.add('hidden');}
            });
        });
        document.addEventListener('click',function(e){if(!e.target.closest('#search-form')&&!e.target.closest('#suggestions'))gid('suggestions').classList.add('hidden');});
    },
    show(loading){
        var c=gid('search-results');if(!c)return;
        if(!S.sq){Search.renderHistory();return;}
        if(loading){
            var label=S._searchMode==='lyric'?'Mencari lagu berdasarkan lirik...':'Mencari...';
            c.innerHTML='<div class="text-center mt-10"><div class="w-8 h-8 border-3 border-[#cfd3d8] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div><p class="text-[#6b7280] text-sm">'+label+'</p></div>';
            return;
        }
        if(S.sr.length===0){
            c.innerHTML='<div class="text-center mt-10 text-[#6b7280]"><i data-lucide="search" class="w-12 h-12 mx-auto mb-3 opacity-30"></i><p>Tidak ada hasil</p>'+(S._searchMode==='lyric'?'<p class="text-xs mt-1">Coba ketik lirik yang lebih spesifik</p>':'')+'</div>';
            lucide.createIcons();return;
        }
        if(S._searchMode==='lyric'){
            c.innerHTML='<p class="text-[#6b7280] text-xs mb-3 px-1">Hasil pencarian lirik untuk "<b class="text-white">'+es(S.sq)+'</b>"</p>'+
            S.sr.map(function(t,i){
                return'<div onclick="PK(\'search\','+i+')" class="flex items-center gap-3 p-3 hover:bg-white/5 rounded-lg cursor-pointer active:scale-[0.98]">'+
                '<img src="'+t.cover+'" class="w-12 h-12 rounded-lg object-cover flex-shrink-0" loading="lazy" onerror="this.src=\''+FI+'\'" />'+
                '<div class="truncate"><h3 class="font-medium truncate text-white">'+es(t.title)+'</h3>'+
                '<p class="text-[#6b7280] text-sm truncate">'+es(t.artist)+'</p></div></div>';
            }).join('');
        } else {
            c.innerHTML=S.sr.map(function(t,i){
                return'<div onclick="PK(\'search\','+i+')" class="flex items-center gap-3 p-3 hover:bg-white/5 rounded-lg cursor-pointer active:scale-[0.98] animate-stagger" style="animation-delay:'+(i*30)+'ms">'+
                '<img src="'+t.cover+'" class="w-12 h-12 rounded-lg object-cover flex-shrink-0" loading="lazy" onerror="this.src=\''+FI+'\'" />'+
                '<div class="truncate"><h3 class="font-medium truncate '+(S.ct&&S.ct.id===t.id?'text-[#cfd3d8]':'text-white')+'">'+es(t.title)+'</h3>'+
                '<p class="text-[#6b7280] text-sm truncate">'+es(t.artist)+'</p></div></div>';
            }).join('');
        }
    },
    apply(){S.sr=S.ar;Search.show();}
};
function selectSuggestion(t){gid('suggestions').classList.add('hidden');gid('search-input').value=t;gid('search-form').dispatchEvent(new Event('submit'));}
function selectHistory(q){S.sq=q;var si=gid('search-input');if(si)si.value=q;gid('search-form').dispatchEvent(new Event('submit'));}
function setFilter(f){S.filter=f;document.querySelectorAll('.filter-tab').forEach(function(el){el.classList.remove('active','bg-white','text-black');el.classList.add('glass','text-white');});var a=gid('f-'+f);if(a){a.classList.add('active','bg-white','text-black');a.classList.remove('glass','text-white');}Search.apply();}
