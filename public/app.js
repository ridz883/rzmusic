// ============================================================
// TEMA WARNA
// ============================================================
const THEMES = {
    chrome: { name: 'Chrome', accent: '#ffffff', btn: 'linear-gradient(135deg,#f2f3f4,#aab0b8)', text: 'chrome-text' },
    red:    { name: 'Merah',  accent: '#ef4444', btn: 'linear-gradient(135deg,#ef4444,#b91c1c)', text: '' },
    blue:   { name: 'Biru',   accent: '#3b82f6', btn: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', text: '' },
    purple: { name: 'Ungu',   accent: '#a855f7', btn: 'linear-gradient(135deg,#a855f7,#7c3aed)', text: '' },
    green:  { name: 'Hijau',  accent: '#22c55e', btn: 'linear-gradient(135deg,#22c55e,#15803d)', text: '' },
    gold:   { name: 'Emas',   accent: '#f59e0b', btn: 'linear-gradient(135deg,#f59e0b,#b45309)', text: '' }
};

var _curTheme = 'chrome';
try { _curTheme = localStorage.getItem('rz_theme') || 'chrome'; } catch(e){}

function applyTheme(key) {
    var t = THEMES[key] || THEMES.chrome;
    _curTheme = key;
    try { localStorage.setItem('rz_theme', key); } catch(e) {}
    var style = gid('rz-theme-style');
    if (!style) { style = document.createElement('style'); style.id = 'rz-theme-style'; document.head.appendChild(style); }
    if (key === 'chrome') {
        style.textContent = '';
    } else {
        style.textContent = `
            .btn-chrome { background: ${t.btn} !important; color: #fff !important; }
            .btn-chrome::after { display: none; }
            .chrome-text { background: none !important; -webkit-text-fill-color: ${t.accent} !important; color: ${t.accent} !important; animation: none !important; }
            .filter-tab.active { background: ${t.accent} !important; color: #fff !important; }
            #mini-progress { background: ${t.accent} !important; }
            .lyric-line.lyric-active { color: ${t.accent} !important; text-shadow: 0 0 20px ${t.accent}66 !important; }
        `;
    }
}
applyTheme(_curTheme);

// ============================================================
// ONBOARDING
// ============================================================
function checkOnboarding() {
    try { if (localStorage.getItem('rz_onboarded')) return; } catch(e) { return; }
    var ob = document.createElement('div');
    ob.id = 'onboarding';
    ob.className = 'fixed inset-0 z-[9998] flex flex-col items-center justify-center bg-[#050507]';
    var slides = [
        { icon: '🎵', title: 'Selamat Datang di RZmusic', desc: 'Streaming musik YouTube dengan lirik, playlist, dan banyak fitur keren lainnya — gratis!' },
        { icon: '❤️', title: 'Simpan Lagu Favorit', desc: 'Tap tombol ❤️ di player untuk menyukai lagu. Semua favorit tersimpan di Library.' },
        { icon: '📋', title: 'Buat Playlist Sendiri', desc: 'Buat playlist pribadi, bagikan ke teman, atau simpan playlist dari orang lain.' },
        { icon: '🎨', title: 'Sesuaikan Tampilanmu', desc: 'Ganti tema warna, lihat statistik musik, dan banyak lagi di halaman Info.' }
    ];
    var cur = 0;
    function renderSlide() {
        var s = slides[cur];
        ob.innerHTML = `
        <div class="flex flex-col items-center justify-center px-8 text-center flex-1 w-full max-w-sm mx-auto">
            <div class="text-7xl mb-6">${s.icon}</div>
            <h2 class="text-2xl font-black text-white mb-3">${s.title}</h2>
            <p class="text-[#b3b3b3] text-sm leading-relaxed">${s.desc}</p>
        </div>
        <div class="w-full px-8 pb-12">
            <div class="flex justify-center gap-2 mb-6">
                ${slides.map(function(_,i){ return '<div class="w-2 h-2 rounded-full transition-all '+(i===cur?'bg-white w-6':'bg-white/30')+'"></div>'; }).join('')}
            </div>
            <button id="ob-next" class="w-full btn-chrome font-bold py-4 rounded-full text-black active:scale-95">
                ${cur < slides.length-1 ? 'Lanjut' : 'Mulai Dengerin! 🎵'}
            </button>
            ${cur > 0 ? '<button id="ob-skip" class="w-full mt-3 text-[#6b7280] text-sm py-2">Lewati</button>' : '<button id="ob-skip" class="w-full mt-3 text-[#6b7280] text-sm py-2">Lewati</button>'}
        </div>`;
        gid('ob-next').onclick = function() {
            if (cur < slides.length-1) { cur++; renderSlide(); }
            else { finishOnboarding(); }
        };
        gid('ob-skip').onclick = finishOnboarding;
    }
    function finishOnboarding() {
        try { localStorage.setItem('rz_onboarded', '1'); } catch(e) {}
        ob.style.transition = 'opacity 0.5s';
        ob.style.opacity = '0';
        setTimeout(function() { if(ob.parentNode) ob.parentNode.removeChild(ob); }, 500);
    }
    renderSlide();
    document.body.appendChild(ob);
}

// ============================================================
// STATISTIK
// ============================================================
function getStats() {
    var h = getHistory();
    if (!h || h.length === 0) return null;
    var artists = {}, totalMs = 0;
    h.forEach(function(t) {
        if (t.artist) artists[t.artist] = (artists[t.artist]||0) + 1;
        totalMs += 210000; // estimasi 3.5 menit per lagu
    });
    var topArtist = Object.entries(artists).sort(function(a,b){return b[1]-a[1];})[0];
    var totalMin = Math.floor(totalMs/60000);
    return { total: h.length, topArtist: topArtist ? topArtist[0] : '-', topCount: topArtist ? topArtist[1] : 0, totalMin: totalMin, favCount: getFavorites().length };
}

function showStats() {
    var s = getStats();
    var popup = document.createElement('div');
    popup.className = 'fixed inset-0 z-[300] flex items-end justify-center bg-black/60';
    popup.onclick = function(e){if(e.target===popup)popup.remove();};
    if (!s) {
        popup.innerHTML = '<div class="glass-strong w-full max-w-md rounded-t-3xl p-6 border-t border-white/10" style="animation:slideUp 0.3s ease-out forwards;"><div class="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4"></div><p class="text-center text-[#6b7280] py-8">Belum ada data statistik.<br>Mulai dengerin lagu dulu!</p><button onclick="this.closest(\'.fixed\').remove()" class="w-full mt-3 py-3 glass text-white rounded-full">Tutup</button></div>';
    } else {
        popup.innerHTML = `<div class="glass-strong w-full max-w-md rounded-t-3xl p-6 border-t border-white/10" style="animation:slideUp 0.3s ease-out forwards;">
        <div class="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4"></div>
        <h3 class="font-black text-xl text-white mb-4 text-center">📊 Statistik Musikmu</h3>
        <div class="grid grid-cols-2 gap-3 mb-4">
            <div class="glass rounded-2xl p-4 text-center"><div class="text-3xl font-black text-white">${s.total}</div><div class="text-[#6b7280] text-xs mt-1">Lagu Diputar</div></div>
            <div class="glass rounded-2xl p-4 text-center"><div class="text-3xl font-black text-white">${s.favCount}</div><div class="text-[#6b7280] text-xs mt-1">Lagu Favorit</div></div>
            <div class="glass rounded-2xl p-4 text-center"><div class="text-2xl font-black text-white">${s.totalMin}m</div><div class="text-[#6b7280] text-xs mt-1">Total Durasi</div></div>
            <div class="glass rounded-2xl p-4 text-center"><div class="text-sm font-bold text-white truncate">${s.topArtist}</div><div class="text-[#6b7280] text-xs mt-1">Artis Favorit</div></div>
        </div>
        <button onclick="this.closest('.fixed').remove()" class="w-full py-3 glass text-white rounded-full">Tutup</button></div>`;
    }
    document.body.appendChild(popup);
}

// ============================================================
// ADUAN
// ============================================================
function showReport() {
    var popup = document.createElement('div');
    popup.className = 'fixed inset-0 z-[300] flex items-end justify-center bg-black/60';
    popup.onclick = function(e){if(e.target===popup)popup.remove();};
    popup.innerHTML = `<div class="glass-strong w-full max-w-md rounded-t-3xl p-6 border-t border-white/10" style="animation:slideUp 0.3s ease-out forwards;">
        <div class="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4"></div>
        <h3 class="font-bold text-white mb-1">📩 Kirim Aduan / Saran</h3>
        <p class="text-[#6b7280] text-xs mb-4">Pesan akan langsung diterima oleh pengembang RZmusic.</p>
        <select id="report-type" class="w-full glass-input text-white rounded-xl px-4 py-3 mb-3 focus:outline-none bg-transparent">
            <option value="Bug" class="bg-[#1a1a1a]">🐛 Bug / Error</option>
            <option value="Saran" class="bg-[#1a1a1a]">💡 Saran Fitur</option>
            <option value="Lagu" class="bg-[#1a1a1a]">🎵 Masalah Lagu</option>
            <option value="Lirik" class="bg-[#1a1a1a]">📝 Masalah Lirik</option>
            <option value="Lainnya" class="bg-[#1a1a1a]">📌 Lainnya</option>
        </select>
        <textarea id="report-msg" class="w-full glass-input text-white rounded-xl px-4 py-3 mb-4 focus:outline-none resize-none" rows="4" placeholder="Tulis pesanmu di sini..."></textarea>
        <div class="flex gap-3">
            <button id="report-send" class="flex-1 btn-chrome font-bold py-3 rounded-full active:scale-95">Kirim</button>
            <button onclick="this.closest('.fixed').remove()" class="px-6 py-3 glass text-white rounded-full">Batal</button>
        </div>
        <p id="report-status" class="text-center text-xs mt-3 hidden"></p>
    </div>`;
    document.body.appendChild(popup);
    gid('report-send').onclick = async function() {
        var msg = gid('report-msg').value.trim();
        var type = gid('report-type').value;
        var st = gid('report-status');
        var btn = gid('report-send');
        if (!msg) { st.textContent = '⚠️ Tulis pesan dulu ya!'; st.className = 'text-center text-xs mt-3 text-yellow-400'; st.classList.remove('hidden'); return; }
        btn.textContent = 'Mengirim...'; btn.disabled = true;
        try {
            var r = await fetch('/api/report', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({message: msg, type: type}) });
            var d = await r.json();
            if (d.status) {
                st.textContent = '✅ Pesan terkirim! Terima kasih.';
                st.className = 'text-center text-xs mt-3 text-green-400';
                st.classList.remove('hidden');
                gid('report-msg').value = '';
                btn.textContent = 'Terkirim!';
                setTimeout(function(){popup.remove();}, 2000);
            } else {
                st.textContent = '❌ Gagal mengirim. Coba lagi.';
                st.className = 'text-center text-xs mt-3 text-red-400';
                st.classList.remove('hidden');
                btn.textContent = 'Kirim'; btn.disabled = false;
            }
        } catch(e) {
            st.textContent = '❌ Koneksi gagal. Coba lagi.';
            st.className = 'text-center text-xs mt-3 text-red-400';
            st.classList.remove('hidden');
            btn.textContent = 'Kirim'; btn.disabled = false;
        }
    };
}

// ============================================================
// TEMA PICKER
// ============================================================
function showThemePicker() {
    var popup = document.createElement('div');
    popup.className = 'fixed inset-0 z-[300] flex items-end justify-center bg-black/60';
    popup.onclick = function(e){if(e.target===popup)popup.remove();};
    var btns = Object.entries(THEMES).map(function(entry) {
        var key = entry[0], t = entry[1];
        var active = key === _curTheme;
        return '<button onclick="applyTheme(\''+key+'\');document.querySelectorAll(\'.theme-btn\').forEach(function(b){b.classList.remove(\'ring-2\',\'ring-white\')});this.classList.add(\'ring-2\',\'ring-white\')" class="theme-btn flex flex-col items-center gap-2 p-3 rounded-2xl glass '+(active?'ring-2 ring-white':'')+'">'+
        '<div class="w-10 h-10 rounded-full" style="background:'+t.btn+'"></div>'+
        '<span class="text-xs text-white">'+t.name+'</span></button>';
    }).join('');
    popup.innerHTML = '<div class="glass-strong w-full max-w-md rounded-t-3xl p-6 border-t border-white/10" style="animation:slideUp 0.3s ease-out forwards;"><div class="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4"></div><h3 class="font-bold text-white mb-4">🎨 Tema Warna</h3><div class="grid grid-cols-3 gap-3 mb-4">'+btns+'</div><button onclick="this.closest(\'.fixed\').remove()" class="w-full py-3 glass text-white rounded-full">Selesai</button></div>';
    document.body.appendChild(popup);
}

// ============================================================
// APP MAIN
// ============================================================
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
        <div class="pt-12 px-4 pb-8">
            <div class="flex flex-col items-center text-center mb-6">
                <div id="info-avatar-wrap" class="relative w-24 h-24 rounded-full mx-auto mb-4 glass-strong shine-sweep flex items-center justify-center overflow-hidden shadow-2xl shadow-black/50 cursor-pointer" onclick="RZAuth.showAuthPopup()">
                    <i data-lucide="music" class="w-12 h-12 text-white/60 absolute"></i>
                    <img src="dev.png" id="info-dev-img" class="absolute inset-0 w-full h-full object-cover" onerror="this.style.display='none'" />
                </div>
                <h1 id="info-name" class="text-3xl font-black chrome-text mb-1">RZmusic</h1>
                <p id="info-sub" class="text-[#b3b3b3] text-sm">Streaming Musik YouTube dengan Lirik</p>
                <div id="info-login-hint" class="mt-2">
                    <button onclick="RZAuth.showAuthPopup()" class="text-xs text-[#6b7280] flex items-center gap-1 mx-auto hover:text-white transition-colors">
                        <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        Login untuk sinkronisasi data
                    </button>
                </div>
            </div>

            <div class="glass rounded-2xl p-5 max-w-sm mx-auto space-y-3 text-left mb-3">
                <h3 class="text-[#cfd3d8] font-bold text-sm uppercase tracking-wider mb-2 flex items-center gap-1.5"><i data-lucide="smartphone" class="w-3.5 h-3.5"></i>Aplikasi</h3>
                <div class="flex justify-between"><span class="text-[#6b7280] text-sm">Nama</span><span class="text-white font-medium text-sm">RZmusic</span></div>
                <div class="flex justify-between"><span class="text-[#6b7280] text-sm">Versi</span><span class="text-white font-medium text-sm">v3.0.0</span></div>
                <div class="flex justify-between"><span class="text-[#6b7280] text-sm">Framework</span><span class="text-white font-medium text-sm">HTML + Tailwind + JS</span></div>
                <div class="flex justify-between"><span class="text-[#6b7280] text-sm">Hosting</span><span class="text-white font-medium text-sm">Vercel</span></div>
            </div>

            <div class="max-w-sm mx-auto space-y-2 mb-3">
                <button onclick="showStats()" class="w-full glass glass-hover py-3 rounded-xl text-white font-medium flex items-center justify-center gap-2 active:scale-95"><i data-lucide="bar-chart-2" class="w-4 h-4"></i>Statistik Musikku</button>
                <button onclick="showThemePicker()" class="w-full glass glass-hover py-3 rounded-xl text-white font-medium flex items-center justify-center gap-2 active:scale-95"><i data-lucide="palette" class="w-4 h-4"></i>Tema Warna</button>
                <button onclick="showReport()" class="w-full glass glass-hover py-3 rounded-xl text-white font-medium flex items-center justify-center gap-2 active:scale-95"><i data-lucide="message-circle" class="w-4 h-4"></i>Kirim Aduan / Saran</button>
                <button onclick="openServerSettings()" class="w-full glass glass-hover py-3 rounded-xl text-white font-medium flex items-center justify-center gap-2 active:scale-95"><i data-lucide="settings" class="w-4 h-4"></i>Pengaturan Server</button>
            </div>

            <button id="pwa-install-btn" onclick="PWA.install()" class="hidden items-center justify-center gap-2 w-full max-w-sm mx-auto btn-chrome font-bold py-4 rounded-full active:scale-95 transition-all mt-2">
                <i data-lucide="download" class="w-4 h-4"></i>Install RZmusic
            </button>
            <p id="pwa-installed-txt" class="hidden text-[#6b7280] text-sm text-center mt-2">✅ RZmusic sudah terinstall</p>
        </div>`;

        MP.init();FullPlayer.init();Artist.init();Home.render();Search.render();
        lucide.createIcons();
        setTimeout(function(){
            App.checkUrl();
            var p=new URLSearchParams(location.search);
            if(!p.get('play')&&!p.get('sharedpl')){loadLastTrack();}
            checkOnboarding();
        },1000);
    },
    checkUrl(){
        var p=new URLSearchParams(location.search);
        var play=p.get('play'),search=p.get('search'),isShared=p.get('share')==='1',sharedpl=p.get('sharedpl');
        if(sharedpl){setTimeout(function(){App.switch('library');Library.openShared(sharedpl);},500);}
        else if(play){if(isShared){App.showSharePopup(play);}else{App.autoPlayTrack(play);}}
        else if(search){setTimeout(function(){var si=gid('search-input');if(si){si.value=decodeURIComponent(search);gid('search-form').dispatchEvent(new Event('submit'));}App.switch('search');},300);}
    },
    autoPlayTrack(videoId){
        fetch(API.search+'?query=https://youtube.com/watch?v='+videoId).then(function(r){return r.json();}).then(function(d){
            var title='Lagu',artist='RZmusic',cover=FI,artistId='';
            if(d.status&&d.result.songs&&d.result.songs.length>0){var song=d.result.songs[0];title=cn(song.title);artist=cn(song.artist);cover=song.thumbnail||FI;artistId=song.artistId||'';}
            S.ct={id:videoId,videoId:videoId,title:title,artist:artist,cover:cover,artistId:artistId,ytUrl:'https://youtube.com/watch?v='+videoId};
            S.ps='direct';S.pl=[S.ct];S.pi=0;UU();MP.show();resetLyricsUI(videoId);saveHistory(S.ct);saveLastTrack();updateFavBtn();
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
        popup.querySelector('#popup-play').onclick=function(){popup.remove();S.ct={id:videoId,videoId:videoId,title:title,artist:artist,cover:cover,artistId:'',ytUrl:'https://youtube.com/watch?v='+videoId};S.ps='direct';S.pl=[S.ct];S.pi=0;UU();MP.show();resetLyricsUI(videoId);saveHistory(S.ct);saveLastTrack();updateFavBtn();setTimeout(function(){FullPlayer.open();loadTrack(S.ct);},400);};
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

// ============================================================
// PROFIL PUBLIK USER
// ============================================================
function showPublicProfile(userId, userName, userPhoto) {
    var popup = document.createElement('div');
    popup.className = 'fixed inset-0 z-[300] flex flex-col bg-[#050507]';
    popup.style.animation = 'slideUp 0.3s ease-out forwards';
    popup.innerHTML = `
    <div class="flex items-center gap-3 p-4 pt-12 border-b border-white/5">
        <button onclick="this.closest('.fixed').remove()" class="text-white/60 p-2 active:scale-90">
            <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <h2 class="font-bold text-white text-lg">Profil</h2>
    </div>
    <div class="flex-1 overflow-y-auto">
        <div class="flex flex-col items-center pt-8 pb-6 px-6">
            <div class="w-24 h-24 rounded-full overflow-hidden border-2 border-white/20 bg-white/10 mb-4 flex items-center justify-center">
                ${userPhoto ? `<img src="${userPhoto}" class="w-full h-full object-cover" onerror="this.style.display='none'" />` : `<span class="text-3xl font-black">${(userName||'?')[0].toUpperCase()}</span>`}
            </div>
            <h2 class="text-xl font-bold text-white mb-1">${es(userName||'Pengguna')}</h2>
            <p class="text-[#6b7280] text-sm mb-4">Pengguna RZmusic</p>
        </div>
        <div id="public-profile-playlists" class="px-4">
            <p class="text-[#6b7280] text-xs uppercase tracking-wider mb-3">Playlist Publik</p>
            <div class="text-center py-8 text-[#6b7280]">
                <div class="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-3"></div>
                <p class="text-sm">Memuat...</p>
            </div>
        </div>
    </div>`;
    document.body.appendChild(popup);

    // Load playlist publik user (dari localStorage untuk sekarang)
    // Nanti bisa diambil dari Supabase kalau sudah ada tabel public_playlists
    setTimeout(function() {
        var container = document.getElementById('public-profile-playlists');
        if (!container) return;
        container.innerHTML = '<p class="text-[#6b7280] text-xs uppercase tracking-wider mb-3">Playlist Publik</p>' +
            '<div class="text-center py-8 text-[#6b7280] text-sm">Belum ada playlist publik</div>';
    }, 500);
}

// ── Update halaman Info saat login/logout ──
function updateInfoPage() {
    var wrap = document.getElementById('info-avatar-wrap');
    var nameEl = document.getElementById('info-name');
    var subEl = document.getElementById('info-sub');
    var hint = document.getElementById('info-login-hint');
    var devImg = document.getElementById('info-dev-img');
    if (!wrap) return;
    if (window.RZAuth && RZAuth.user) {
        var photo = RZAuth.getPhotoURL();
        var name = RZAuth.getName();
        var email = RZAuth.user.email;
        // Tampilkan foto user
        if (photo) {
            if (devImg) { devImg.src = photo; devImg.style.display = ''; }
        }
        if (nameEl) nameEl.textContent = name;
        if (subEl) subEl.textContent = email;
        if (hint) hint.innerHTML = `
            <button onclick="RZAuth.showAuthPopup()" class="text-xs text-green-400 flex items-center gap-1 mx-auto">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                Tersinkronisasi ke cloud
            </button>`;
    } else {
        if (devImg) { devImg.src = 'dev.png'; devImg.style.display = ''; }
        if (nameEl) nameEl.textContent = 'RZmusic';
        if (subEl) subEl.textContent = 'Streaming Musik YouTube dengan Lirik';
        if (hint) hint.innerHTML = `
            <button onclick="RZAuth.showAuthPopup()" class="text-xs text-[#6b7280] flex items-center gap-1 mx-auto hover:text-white transition-colors">
                <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                Login untuk sinkronisasi data
            </button>`;
    }
}

// ── Override RZAuth callbacks setelah App.init ──
document.addEventListener('DOMContentLoaded', function() {
    if (!window.RZAuth) return;
    var origLogin = RZAuth.onLogin.bind(RZAuth);
    var origLogout = RZAuth.onLogout.bind(RZAuth);
    RZAuth.onLogin = function(user) { origLogin(user); updateInfoPage(); };
    RZAuth.onLogout = function() { origLogout(); updateInfoPage(); };
});

(function(){
    var sp=gid('splash-screen');
    if(!sp)return;
    setTimeout(function(){
        sp.classList.add('hide');
        setTimeout(function(){if(sp&&sp.parentNode)sp.parentNode.removeChild(sp);},650);
    },1900);
})();

// ============================================================
// LIBRARY + PLAYLIST
// ============================================================
const Library={
    _tab:'playlist',
    render(){
        var tab=Library._tab||'playlist';
        var html='<div class="pt-12 px-4">'+
        '<h1 class="text-3xl font-black mb-4">Library</h1>'+
        '<div class="flex gap-2 mb-4 overflow-x-auto hide-scrollbar pb-1">'+
        '<button onclick="Library.switchTab(\'playlist\')" class="flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all '+(tab==='playlist'?'bg-white text-black':'glass text-white')+'">Playlist</button>'+
        '<button onclick="Library.switchTab(\'favorite\')" class="flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all '+(tab==='favorite'?'bg-white text-black':'glass text-white')+'">Favorit ❤️</button>'+
        '<button onclick="Library.switchTab(\'history\')" class="flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all '+(tab==='history'?'bg-white text-black':'glass text-white')+'">Riwayat</button>'+
        '</div>';
        if(tab==='playlist') html+=Library._renderPlaylist();
        else if(tab==='favorite') html+=Library._renderFavorite();
        else html+=Library._renderHistory();
        html+='</div>';
        gid('view-library').innerHTML=html;lucide.createIcons();
    },
    switchTab(t){Library._tab=t;Library.render();},
    _renderPlaylist(){
        var pls=getUserPlaylists();
        var html='<button onclick="Library.createNew()" class="w-full btn-chrome font-bold py-3 rounded-xl active:scale-95 mb-4">+ Buat Playlist Baru</button>';
        if(pls.length===0){return html+'<div class="text-center text-[#6b7280] mt-10"><i data-lucide="library" class="w-16 h-16 mx-auto mb-4 opacity-30"></i><p>Belum ada playlist</p></div>';}
        html+='<div class="grid grid-cols-2 gap-3">';
        pls.forEach(function(p){
            html+='<div class="glass rounded-xl p-3 cursor-pointer active:scale-95 relative">'+
            '<img src="'+(p.image||FI)+'" onclick="Library.open(\''+p.id+'\')" class="w-full aspect-square object-cover rounded-lg mb-2" loading="lazy" onerror="this.src=\''+FI+'\'" />'+
            '<h3 onclick="Library.open(\''+p.id+'\')" class="font-bold text-sm truncate">'+es(p.name)+'</h3>'+
            '<p onclick="Library.open(\''+p.id+'\')" class="text-[#6b7280] text-xs mb-2">'+p.songs.length+' lagu</p>'+
            '<div class="flex gap-1">'+
            '<button onclick="Library.share(\''+p.id+'\')" class="flex-1 glass glass-hover text-[#b3b3b3] text-xs py-1 rounded-lg flex items-center justify-center gap-1"><i data-lucide="share-2" class="w-3 h-3"></i>Bagikan</button>'+
            '<button onclick="Library.edit(\''+p.id+'\')" class="glass glass-hover text-[#b3b3b3] text-xs py-1 px-2 rounded-lg"><i data-lucide="pencil" class="w-3 h-3"></i></button>'+
            '<button onclick="Library.delete(\''+p.id+'\')" class="glass glass-hover text-red-400 text-xs py-1 px-2 rounded-lg"><i data-lucide="trash-2" class="w-3 h-3"></i></button>'+
            '</div></div>';
        });
        return html+'</div>';
    },
    _renderFavorite(){
        var favs=getFavorites();
        if(favs.length===0){return '<div class="text-center text-[#6b7280] mt-10"><i data-lucide="heart" class="w-16 h-16 mx-auto mb-4 opacity-30"></i><p>Belum ada lagu favorit</p><p class="text-xs mt-2">Tap ❤️ di player untuk menyukai lagu</p></div>';}
        var html='<div class="flex justify-between items-center mb-3"><p class="text-[#6b7280] text-xs">'+favs.length+' lagu</p><button onclick="Library._clearFavorites()" class="text-red-400 text-xs">Hapus Semua</button></div><div class="space-y-1">';
        favs.forEach(function(t,i){
            html+='<div class="flex items-center gap-3 p-3 hover:bg-white/5 rounded-lg cursor-pointer active:scale-[0.98]" onclick="Library._playFav('+i+')">'+
            '<img src="'+t.cover+'" class="w-12 h-12 rounded-lg object-cover flex-shrink-0" loading="lazy" onerror="this.src=\''+FI+'\'" />'+
            '<div class="flex-1 truncate"><p class="font-medium text-sm truncate">'+es(t.title)+'</p><p class="text-[#6b7280] text-xs truncate">'+es(t.artist)+'</p></div>'+
            '</div>';
        });
        return html+'</div>';
    },
    _renderHistory(){
        var h=getHistory();
        if(h.length===0){return '<div class="text-center text-[#6b7280] mt-10"><i data-lucide="clock" class="w-16 h-16 mx-auto mb-4 opacity-30"></i><p>Belum ada riwayat</p></div>';}
        var html='<div class="flex justify-between items-center mb-3"><p class="text-[#6b7280] text-xs">'+h.length+' lagu terakhir</p><button onclick="Library._clearHistory()" class="text-red-400 text-xs">Hapus Semua</button></div><div class="space-y-1">';
        h.forEach(function(t,i){
            var timeAgo=Library._timeAgo(t.playedAt);
            html+='<div class="flex items-center gap-3 p-3 hover:bg-white/5 rounded-lg cursor-pointer active:scale-[0.98]" onclick="Library._playHistory('+i+')">'+
            '<img src="'+t.cover+'" class="w-12 h-12 rounded-lg object-cover flex-shrink-0" loading="lazy" onerror="this.src=\''+FI+'\'" />'+
            '<div class="flex-1 truncate"><p class="font-medium text-sm truncate">'+es(t.title)+'</p><p class="text-[#6b7280] text-xs truncate">'+es(t.artist)+' • '+timeAgo+'</p></div>'+
            '</div>';
        });
        return html+'</div>';
    },
    _timeAgo(ts){
        if(!ts)return'';
        var d=Math.floor((Date.now()-ts)/1000);
        if(d<60)return'Baru saja';if(d<3600)return Math.floor(d/60)+' menit lalu';
        if(d<86400)return Math.floor(d/3600)+' jam lalu';return Math.floor(d/86400)+' hari lalu';
    },
    _playFav(i){var favs=getFavorites();if(!favs[i])return;S.pl=favs;S.pi=i;S.ps='playlist';S.ct=favs[i];UU();MP.show();S.il=true;UB();saveHistory(S.ct);saveLastTrack();updateFavBtn();resetLyricsUI(S.ct.videoId);loadTrack(S.ct);},
    _playHistory(i){var h=getHistory();if(!h[i])return;S.pl=h;S.pi=i;S.ps='playlist';S.ct=h[i];UU();MP.show();S.il=true;UB();saveHistory(S.ct);saveLastTrack();updateFavBtn();resetLyricsUI(S.ct.videoId);loadTrack(S.ct);},
    _clearFavorites(){saveFavorites([]);Library.render();showToast('Semua favorit dihapus','trash-2');},
    _clearHistory(){try{localStorage.removeItem('rz_history');}catch(e){}Library.render();showToast('Riwayat dihapus','trash-2');},
    createNew(){
        var popup=document.createElement('div');popup.className='fixed inset-0 z-[300] flex items-end justify-center bg-black/60';
        popup.onclick=function(e){if(e.target===popup)popup.remove();};
        popup.innerHTML='<div class="glass-strong w-full max-w-md rounded-t-3xl p-6 border-t border-white/10" style="animation:slideUp 0.3s ease-out forwards;"><div class="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4"></div><h3 class="font-bold text-white mb-4">Buat Playlist Baru</h3><input id="pl-name" class="w-full glass-input text-white rounded-xl px-4 py-3 mb-3 focus:outline-none" placeholder="Nama Playlist" /><input id="pl-image" type="file" accept="image/*" class="w-full text-sm text-[#6b7280] mb-4" /><div class="flex gap-3"><button id="pl-create" class="flex-1 btn-chrome font-bold py-3 rounded-full">Buat</button><button onclick="this.closest(\'.fixed\').remove()" class="px-6 py-3 glass glass-hover text-white rounded-full">Batal</button></div></div>';
        document.body.appendChild(popup);
        popup.querySelector('#pl-create').onclick=function(){
            var name=gid('pl-name').value.trim()||'Playlist Baru';
            var file=gid('pl-image').files[0];
            if(file){var reader=new FileReader();reader.onload=function(e){createPlaylist(name,e.target.result);popup.remove();Library.render();};reader.readAsDataURL(file);}
            else{createPlaylist(name,'');popup.remove();Library.render();}
        };
    },
    edit(id){
        var pls=getUserPlaylists();var pl=pls.find(function(p){return p.id===id;});if(!pl)return;
        var popup=document.createElement('div');popup.className='fixed inset-0 z-[300] flex items-end justify-center bg-black/60';
        popup.onclick=function(e){if(e.target===popup)popup.remove();};
        popup.innerHTML='<div class="glass-strong w-full max-w-md rounded-t-3xl p-6 border-t border-white/10" style="animation:slideUp 0.3s ease-out forwards;"><div class="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4"></div><h3 class="font-bold text-white mb-4">Edit Nama Playlist</h3><input id="pl-edit-name" class="w-full glass-input text-white rounded-xl px-4 py-3 mb-4 focus:outline-none" value="'+es(pl.name)+'" /><div class="flex gap-3"><button id="pl-save" class="flex-1 btn-chrome font-bold py-3 rounded-full">Simpan</button><button onclick="this.closest(\'.fixed\').remove()" class="px-6 py-3 glass glass-hover text-white rounded-full">Batal</button></div></div>';
        document.body.appendChild(popup);
        popup.querySelector('#pl-save').onclick=function(){
            var newName=gid('pl-edit-name').value.trim();if(!newName)return;
            var pls2=getUserPlaylists();var pl2=pls2.find(function(p){return p.id===id;});
            if(pl2){pl2.name=newName;saveUserPlaylists(pls2);popup.remove();Library.render();showToast('Nama playlist diubah','check-circle');}
        };
    },
    delete(id){
        var pls=getUserPlaylists();var pl=pls.find(function(p){return p.id===id;});if(!pl)return;
        var popup=document.createElement('div');popup.className='fixed inset-0 z-[300] flex items-end justify-center bg-black/60';
        popup.onclick=function(e){if(e.target===popup)popup.remove();};
        popup.innerHTML='<div class="glass-strong w-full max-w-md rounded-t-3xl p-6 border-t border-white/10" style="animation:slideUp 0.3s ease-out forwards;"><div class="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4"></div><h3 class="font-bold text-white mb-2">Hapus Playlist?</h3><p class="text-[#6b7280] text-sm mb-4">Playlist "<b class="text-white">'+es(pl.name)+'</b>" akan dihapus permanen.</p><div class="flex gap-3"><button id="pl-del-confirm" class="flex-1 bg-red-500 text-white font-bold py-3 rounded-full">Hapus</button><button onclick="this.closest(\'.fixed\').remove()" class="px-6 py-3 glass glass-hover text-white rounded-full">Batal</button></div></div>';
        document.body.appendChild(popup);
        popup.querySelector('#pl-del-confirm').onclick=function(){
            var pls2=getUserPlaylists().filter(function(p){return p.id!==id;});
            saveUserPlaylists(pls2);popup.remove();Library.render();showToast('Playlist dihapus','trash-2');
        };
    },
    share(id){
        var pls=getUserPlaylists();var pl=pls.find(function(p){return p.id===id;});if(!pl)return;
        var shareData={name:pl.name,songs:pl.songs.map(function(s){return{id:s.id,videoId:s.videoId,title:s.title,artist:s.artist,cover:s.cover,artistId:s.artistId||'',ytUrl:s.ytUrl||''};})};
        var encoded=btoa(unescape(encodeURIComponent(JSON.stringify(shareData))));
        var link=location.origin+'/?sharedpl='+encoded;
        if(navigator.clipboard){
            navigator.clipboard.writeText(link).then(function(){showToast('Link playlist disalin!','check-circle');}).catch(function(){Library._showSharePopup(link);});
        }else{Library._showSharePopup(link);}
    },
    _showSharePopup(link){
        var popup=document.createElement('div');popup.className='fixed inset-0 z-[300] flex items-end justify-center bg-black/60';
        popup.onclick=function(e){if(e.target===popup)popup.remove();};
        popup.innerHTML='<div class="glass-strong w-full max-w-md rounded-t-3xl p-6 border-t border-white/10" style="animation:slideUp 0.3s ease-out forwards;"><div class="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4"></div><h3 class="font-bold text-white mb-3">Bagikan Playlist</h3><div class="glass rounded-xl px-4 py-3 mb-4 text-xs text-[#b3b3b3] break-all select-all">'+link+'</div><div class="flex gap-3"><button onclick="navigator.clipboard&&navigator.clipboard.writeText(\''+link+'\').then(function(){showToast(\'Link disalin!\',\'check-circle\');})" class="flex-1 btn-chrome font-bold py-3 rounded-full">Salin Link</button><button onclick="this.closest(\'.fixed\').remove()" class="px-6 py-3 glass glass-hover text-white rounded-full">Tutup</button></div></div>';
        document.body.appendChild(popup);
    },
    openShared(encoded){
        try{
            var data=JSON.parse(decodeURIComponent(escape(atob(encoded))));
            if(!data.name||!Array.isArray(data.songs))return;
            var html='<div class="pt-12 px-4">'+
            '<div class="flex items-center gap-3 mb-4"><button onclick="App.switch(\'library\')" class="text-white p-2 active:scale-90"><i data-lucide="arrow-left" class="w-6 h-6"></i></button>'+
            '<div><h1 class="text-xl font-bold">'+es(data.name)+'</h1><p class="text-[#6b7280] text-xs">'+data.songs.length+' lagu • Playlist dibagikan</p></div></div>'+
            '<button onclick="Library._saveShared(\''+encoded+'\')" class="w-full btn-chrome font-bold py-3 rounded-xl active:scale-95 mb-4 flex items-center justify-center gap-2"><i data-lucide="download" class="w-4 h-4"></i>Simpan ke Library</button>'+
            '<div class="space-y-1">';
            data.songs.forEach(function(s,i){
                html+='<div onclick="Library._playSharedSong(\''+encoded+'\','+i+')" class="flex items-center gap-3 p-3 hover:bg-white/5 rounded-lg cursor-pointer active:scale-[0.98]">'+
                '<img src="'+s.cover+'" class="w-10 h-10 rounded object-cover" loading="lazy" onerror="this.src=\''+FI+'\'" />'+
                '<div class="truncate"><p class="font-medium text-sm truncate">'+es(s.title)+'</p>'+
                '<p class="text-[#6b7280] text-xs truncate">'+es(s.artist)+'</p></div></div>';
            });
            html+='</div></div>';
            gid('view-library').innerHTML=html;lucide.createIcons();
            App.switch('library');
        }catch(e){showToast('Link playlist tidak valid','alert-triangle');}
    },
    _saveShared(encoded){
        try{
            var data=JSON.parse(decodeURIComponent(escape(atob(encoded))));
            var pls=getUserPlaylists();
            var exists=pls.find(function(p){return p.name===data.name&&p.songs.length===data.songs.length;});
            if(exists){showToast('Playlist sudah ada di Library','alert-triangle');return;}
            var id='pl_'+Date.now();
            var img=data.songs.length>0?data.songs[0].cover:'';
            pls.push({id:id,name:data.name,image:img,songs:data.songs});
            saveUserPlaylists(pls);showToast('Playlist disimpan ke Library!','check-circle');Library.render();
        }catch(e){showToast('Gagal menyimpan playlist','alert-triangle');}
    },
    _playSharedSong(encoded,index){
        try{
            var data=JSON.parse(decodeURIComponent(escape(atob(encoded))));
            if(!data.songs[index])return;
            S.pl=data.songs;S.pi=index;S.ps='playlist';S.ct=S.pl[S.pi];
            UU();MP.show();S.il=true;UB();saveHistory(S.ct);saveLastTrack();updateFavBtn();resetLyricsUI(S.ct.videoId);loadTrack(S.ct);
        }catch(e){}
    },
    open(id){
        var pls=getUserPlaylists();var pl=pls.find(function(p){return p.id===id;});if(!pl)return;
        var html='<div class="pt-12 px-4">'+
        '<div class="flex items-center gap-3 mb-2">'+
        '<button onclick="Library.render()" class="text-white p-2 active:scale-90"><i data-lucide="arrow-left" class="w-6 h-6"></i></button>'+
        '<div class="flex-1"><h1 class="text-xl font-bold">'+es(pl.name)+'</h1><p class="text-[#6b7280] text-xs">'+pl.songs.length+' lagu</p></div>'+
        '<button onclick="Library.share(\''+id+'\')" class="text-[#b3b3b3] p-2 active:scale-90"><i data-lucide="share-2" class="w-5 h-5"></i></button>'+
        '<button onclick="Library.edit(\''+id+'\')" class="text-[#b3b3b3] p-2 active:scale-90"><i data-lucide="pencil" class="w-5 h-5"></i></button>'+
        '<button onclick="Library.delete(\''+id+'\')" class="text-red-400 p-2 active:scale-90"><i data-lucide="trash-2" class="w-5 h-5"></i></button>'+
        '</div>';
        if(pl.songs.length>0){
            html+='<button onclick="Library._shufflePlay(\''+id+'\')" class="w-full glass glass-hover py-2.5 rounded-xl text-white font-medium flex items-center justify-center gap-2 mb-3 active:scale-95"><i data-lucide="shuffle" class="w-4 h-4"></i>Shuffle Play</button>';
        }
        if(pl.songs.length===0){html+='<div class="text-center text-[#6b7280] mt-10"><p>Belum ada lagu</p></div>';}
        else{
            html+='<div class="space-y-1">';
            pl.songs.forEach(function(s,i){
                html+='<div class="flex items-center gap-3 p-3 hover:bg-white/5 rounded-lg cursor-pointer active:scale-[0.98]" onclick="Library.playSong(\''+id+'\','+i+')">'+
                '<img src="'+s.cover+'" class="w-10 h-10 rounded object-cover flex-shrink-0" loading="lazy" onerror="this.src=\''+FI+'\'" />'+
                '<div class="flex-1 truncate"><p class="font-medium text-sm truncate">'+es(s.title)+'</p><p class="text-[#6b7280] text-xs truncate">'+es(s.artist)+'</p></div>'+
                '<button onclick="event.stopPropagation();Library.removeSong(\''+id+'\','+i+')" class="text-[#6b7280] hover:text-red-400 p-2 flex-shrink-0"><i data-lucide="x" class="w-4 h-4"></i></button>'+
                '</div>';
            });
            html+='</div>';
        }
        html+='</div>';gid('view-library').innerHTML=html;lucide.createIcons();
    },
    _shufflePlay(id){
        var pls=getUserPlaylists();var pl=pls.find(function(p){return p.id===id;});if(!pl||!pl.songs.length)return;
        var shuffled=pl.songs.slice().sort(function(){return Math.random()-0.5;});
        S.pl=shuffled;S.pi=0;S.ps='playlist';S.ct=shuffled[0];
        UU();MP.show();S.il=true;UB();saveHistory(S.ct);saveLastTrack();updateFavBtn();resetLyricsUI(S.ct.videoId);loadTrack(S.ct);
        showToast('Shuffle play dimulai!','shuffle');
    },
    removeSong(plId,index){
        var pls=getUserPlaylists();var pl=pls.find(function(p){return p.id===plId;});if(!pl)return;
        pl.songs.splice(index,1);saveUserPlaylists(pls);Library.open(plId);showToast('Lagu dihapus dari playlist','check-circle');
    },
    playSong(plId,index){
        var pls=getUserPlaylists();var pl=pls.find(function(p){return p.id===plId;});if(!pl||!pl.songs[index])return;
        S.pl=pl.songs;S.pi=index;S.ps='playlist';S.ct=S.pl[S.pi];UU();MP.show();S.il=true;UB();saveHistory(S.ct);saveLastTrack();updateFavBtn();resetLyricsUI(S.ct.videoId);loadTrack(S.ct);
    }
};
