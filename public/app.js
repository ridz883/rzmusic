const App={
    init(){
        gid('nav-container').innerHTML=`
        <div class="nav-blur pb-safe h-[65px] flex items-center justify-around fixed bottom-0 w-full z-40">
            <button onclick="App.switch('home')" id="nav-home" class="flex flex-col items-center text-[#cfd3d8] active:scale-90"><i data-lucide="home" class="w-5 h-5 fill-current"></i><span class="text-[10px]">Home</span></button>
            <button onclick="App.switch('search')" id="nav-search" class="flex flex-col items-center text-[#6b7280] active:scale-90"><i data-lucide="search" class="w-5 h-5"></i><span class="text-[10px]">Search</span></button>
            <button onclick="App.switch('library')" id="nav-library" class="flex flex-col items-center text-[#6b7280] active:scale-90"><i data-lucide="library" class="w-5 h-5"></i><span class="text-[10px]">Library</span></button>
            <button onclick="App.switch('dev')" id="nav-dev" class="flex flex-col items-center text-[#6b7280] active:scale-90"><i data-lucide="info" class="w-5 h-5"></i><span class="text-[10px]">Info</span></button>
        </div>`;
        
        gid('view-dev').innerHTML=`
        <div class="pt-12 px-4 text-center">
            <div class="relative w-24 h-24 rounded-full mx-auto mb-6 glass-strong shine-sweep flex items-center justify-center overflow-hidden shadow-2xl shadow-black/50">
                <i data-lucide="music" class="w-12 h-12 text-white/60 absolute"></i>
                <img src="dev.png" class="absolute inset-0 w-full h-full object-cover" onerror="this.style.display='none'" />
            </div>
            <h1 class="text-3xl font-black chrome-text mb-1">RZmusic</h1>
            <p class="text-[#b3b3b3] text-sm mb-6">Streaming Musik YouTube dengan Lirik</p>
            
            <div class="glass rounded-2xl p-5 max-w-sm mx-auto space-y-3 text-left mb-4">
                <h3 class="text-[#cfd3d8] font-bold text-sm uppercase tracking-wider mb-2 flex items-center gap-1.5"><i data-lucide="smartphone" class="w-3.5 h-3.5"></i>Aplikasi</h3>
                <div class="flex justify-between"><span class="text-[#6b7280] text-sm">Nama</span><span class="text-white font-medium text-sm">RZmusic</span></div>
                <div class="flex justify-between"><span class="text-[#6b7280] text-sm">Versi</span><span class="text-white font-medium text-sm">v2.0.0</span></div>
                <div class="flex justify-between"><span class="text-[#6b7280] text-sm">Dirilis</span><span class="text-white font-medium text-sm">Januari 2025</span></div>
                <div class="flex justify-between"><span class="text-[#6b7280] text-sm">Framework</span><span class="text-white font-medium text-sm">HTML + Tailwind + JS</span></div>
                <div class="flex justify-between"><span class="text-[#6b7280] text-sm">Hosting</span><span class="text-white font-medium text-sm">Vercel</span></div>
            </div>
            

        </div>`;
        
        MP.init();FullPlayer.init();Artist.init();Home.render();Search.render();
        lucide.createIcons();
        setTimeout(function(){ App.checkUrl(); }, 1000);
    },
    checkUrl(){
        var p=new URLSearchParams(location.search);
        var play=p.get('play'),search=p.get('search'),isShared=p.get('share')==='1';
        if(play){if(isShared){App.showSharePopup(play);}else{App.autoPlayTrack(play);}}
        else if(search){setTimeout(function(){var si=gid('search-input');if(si){si.value=decodeURIComponent(search);gid('search-form').dispatchEvent(new Event('submit'));}App.switch('search');},300);}
    },
    autoPlayTrack(videoId){
        fetch(API.search+'?query=https://youtube.com/watch?v='+videoId).then(function(r){return r.json();}).then(function(d){
            var title='Lagu',artist='RZmusic',cover=FI,artistId='';
            if(d.status&&d.result.songs&&d.result.songs.length>0){var song=d.result.songs[0];title=cn(song.title);artist=cn(song.artist);cover=song.thumbnail||FI;artistId=song.artistId||'';}
            S.ct={id:videoId,videoId:videoId,title:title,artist:artist,cover:cover,artistId:artistId,ytUrl:'https://youtube.com/watch?v='+videoId};
            S.ps='direct';S.pl=[S.ct];S.pi=0;UU();MP.show();resetLyricsUI(videoId);
            setTimeout(function(){FullPlayer.open();loadTrack(S.ct);},400);
        }).catch(function(){
            S.ct={id:videoId,videoId:videoId,title:'Lagu',artist:'RZmusic',cover:FI,artistId:'',ytUrl:'https://youtube.com/watch?v='+videoId};
            S.ps='direct';S.pl=[S.ct];S.pi=0;UU();MP.show();resetLyricsUI(videoId);
            setTimeout(function(){FullPlayer.open();loadTrack(S.ct);},400);
        });
    },
    showSharePopup(videoId){
        fetch(API.search+'?query=https://youtube.com/watch?v='+videoId).then(function(r){return r.json();}).then(function(d){
            var title='Lagu',artist='RZmusic',cover=FI;
            if(d.status&&d.result.songs&&d.result.songs.length>0){var song=d.result.songs[0];title=cn(song.title);artist=cn(song.artist);cover=song.thumbnail||FI;}
            App.renderPopup(videoId,title,artist,cover);
        }).catch(function(){App.renderPopup(videoId,'Lagu','RZmusic',FI);});
    },
    renderPopup(videoId,title,artist,cover){
        var popup=document.createElement('div');popup.className='fixed inset-0 z-[300] flex items-end justify-center bg-black/60';
        popup.onclick=function(e){if(e.target===popup)popup.remove();};
        popup.innerHTML='<div class="glass-strong w-full max-w-md rounded-t-3xl p-6 border-t border-white/10" style="animation:slideUp 0.4s ease-out forwards;"><div class="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4"></div><div class="flex items-center gap-4 mb-4"><img src="'+cover+'" class="w-16 h-16 rounded-xl object-cover shadow-lg" onerror="this.src=\''+FI+'\'" /><div class="flex-1 truncate"><h3 class="font-bold text-white truncate">'+title+'</h3><p class="text-[#b3b3b3] text-sm truncate">'+artist+'</p></div></div><p class="text-[#6b7280] text-xs mb-4 text-center">Seseorang membagikan lagu ini kepadamu</p><div class="flex gap-3"><button id="popup-play" class="flex-1 btn-chrome font-bold py-3 rounded-full active:scale-95 flex items-center justify-center gap-2"><i data-lucide="music" class="w-4 h-4"></i>Putar Sekarang</button><button id="popup-later" class="px-6 py-3 glass glass-hover text-white rounded-full active:scale-95">Nanti</button></div></div>';
        document.body.appendChild(popup);
        lucide.createIcons();
        popup.querySelector('#popup-play').onclick=function(){popup.remove();S.ct={id:videoId,videoId:videoId,title:title,artist:artist,cover:cover,artistId:'',ytUrl:'https://youtube.com/watch?v='+videoId};S.ps='direct';S.pl=[S.ct];S.pi=0;UU();MP.show();resetLyricsUI(videoId);setTimeout(function(){FullPlayer.open();loadTrack(S.ct);},400);};
        popup.querySelector('#popup-later').onclick=function(){popup.remove();};
    },
    switch(t){
        S.at=t;['home','search','library','dev'].forEach(function(id){gid('view-'+id).style.display='none';});
        if(t==='library'){Library.render();}
        gid('view-'+t).style.display='block';
        ['home','search','library','dev'].forEach(function(n){var b=gid('nav-'+n);if(!b)return;b.classList.remove('text-[#cfd3d8]');b.classList.add('text-[#6b7280]');var i=b.querySelector('i');if(i)i.classList.remove('fill-current');});
        var ab=gid('nav-'+t);if(!ab)return;ab.classList.remove('text-[#6b7280]');ab.classList.add('text-[#cfd3d8]');if(t==='home')ab.querySelector('i').classList.add('fill-current');
        gid('main-area').scrollTop=0;lucide.createIcons();
    }
};
App.init();Home.fetch();

// SPLASH SCREEN - LOGO BULAT BESAR
(function(){
    var sp=gid('splash-screen');
    if(!sp)return;
    // Ganti logo jadi bulat besar
    var logoWrap=sp.querySelector('.logo-wrap');
    if(logoWrap){
        logoWrap.style.width='200px';
        logoWrap.style.height='200px';
        logoWrap.style.borderRadius='50%';
    }
    var logo=sp.querySelector('.logo');
    if(logo){
        logo.style.borderRadius='50%';
        logo.style.objectFit='cover';
    }
    setTimeout(function(){
        sp.classList.add('hide');
        setTimeout(function(){ if(sp&&sp.parentNode) sp.parentNode.removeChild(sp); },650);
    },1900);
})();

const Library={
    render(){
        var pls=getUserPlaylists();
        var html='<div class="pt-12 px-4"><h1 class="text-3xl font-black mb-4">Library</h1>';
        html+='<button onclick="Library.createNew()" class="w-full btn-chrome font-bold py-3 rounded-xl active:scale-95 mb-4">+ Buat Playlist Baru</button>';
        if(pls.length===0){html+='<div class="text-center text-[#6b7280] mt-10"><i data-lucide="library" class="w-16 h-16 mx-auto mb-4 opacity-30"></i><p>Belum ada playlist</p></div>';}
        else{html+='<div class="grid grid-cols-2 gap-3">';pls.forEach(function(p){html+='<div onclick="Library.open(\''+p.id+'\')" class="glass glass-hover rounded-xl p-3 cursor-pointer active:scale-95"><img src="'+(p.image||FI)+'" class="w-full aspect-square object-cover rounded-lg mb-2" /><h3 class="font-bold text-sm truncate">'+p.name+'</h3><p class="text-[#6b7280] text-xs">'+p.songs.length+' lagu</p></div>';});html+='</div>';}
        html+='</div>';gid('view-library').innerHTML=html;lucide.createIcons();
    },
    createNew(){
        var popup=document.createElement('div');popup.className='fixed inset-0 z-[300] flex items-end justify-center bg-black/60';
        popup.innerHTML='<div class="glass-strong w-full max-w-md rounded-t-3xl p-6 border-t border-white/10" style="animation:slideUp 0.3s ease-out forwards;"><div class="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4"></div><h3 class="font-bold text-white mb-4">Buat Playlist Baru</h3><input id="pl-name" class="w-full glass-input text-white rounded-xl px-4 py-3 mb-3 focus:outline-none" placeholder="Nama Playlist" /><input id="pl-image" type="file" accept="image/*" class="w-full text-sm text-[#6b7280] mb-4" /><div class="flex gap-3"><button id="pl-create" class="flex-1 btn-chrome font-bold py-3 rounded-full">Buat</button><button onclick="this.closest(\'.fixed\').remove()" class="px-6 py-3 glass glass-hover text-white rounded-full">Batal</button></div></div>';
        document.body.appendChild(popup);
        popup.querySelector('#pl-create').onclick=function(){
            var name=gid('pl-name').value.trim()||'Playlist Baru';
            var file=gid('pl-image').files[0];
            if(file){var reader=new FileReader();reader.onload=function(e){createPlaylist(name,e.target.result);popup.remove();Library.render();};reader.readAsDataURL(file);}
            else{createPlaylist(name,'');popup.remove();Library.render();}
        };
    },
    open(id){
        var pls=getUserPlaylists();var pl=pls.find(function(p){return p.id===id;});if(!pl)return;
        var html='<div class="pt-12 px-4"><div class="flex items-center gap-3 mb-4"><button onclick="Library.render();App.switch(\'library\')" class="text-white p-2 active:scale-90"><i data-lucide="arrow-left" class="w-6 h-6"></i></button><div><h1 class="text-xl font-bold">'+pl.name+'</h1><p class="text-[#6b7280] text-xs">'+pl.songs.length+' lagu</p></div></div>';
        if(pl.songs.length===0){html+='<div class="text-center text-[#6b7280] mt-10"><p>Belum ada lagu</p></div>';}
        else{html+='<div class="space-y-1">';pl.songs.forEach(function(s,i){html+='<div onclick="Library.playSong(\''+id+'\','+i+')" class="flex items-center gap-3 p-3 hover:bg-white/5 rounded-lg cursor-pointer active:scale-[0.98]"><img src="'+s.cover+'" class="w-10 h-10 rounded object-cover" /><div class="truncate"><p class="font-medium text-sm truncate">'+s.title+'</p><p class="text-[#6b7280] text-xs truncate">'+s.artist+'</p></div></div>';});html+='</div>';}
        html+='</div>';gid('view-library').innerHTML=html;lucide.createIcons();
    },
    playSong(plId,index){var pls=getUserPlaylists();var pl=pls.find(function(p){return p.id===plId;});if(!pl||!pl.songs[index])return;S.pl=pl.songs;S.pi=index;S.ps='playlist';S.ct=S.pl[S.pi];UU();MP.show();S.il=true;UB();resetLyricsUI(S.ct.videoId);loadTrack(S.ct);}
};