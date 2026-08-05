// ============================================================
// SUPABASE AUTH — RZmusic
// (menggantikan firebase-auth.js sepenuhnya: Auth, Database, Storage)
// ============================================================
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://hyfneapsswalkvafepji.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5Zm5lYXBzc3dhbGt2YWZlcGppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5MTI5OTQsImV4cCI6MjEwMTQ4ODk5NH0.yvW56vhGQRJHha7YeUIFwHf2ymKKP7wnldmpphwIQ6g';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
    }
});

// ── State ──
window.RZAuth = {
    user: null,
    profile: null,
    supabase, // expose kalau ada bagian lain butuh akses langsung

    // ── Init ──
    init() {
        // Cek session yang sudah ada (mis. setelah redirect balik dari Google)
        supabase.auth.getSession().then(function(res) {
            var session = res.data.session;
            if (session && session.user) RZAuth._setUser(session.user);
        });

        // Dengarkan perubahan status login (login, logout, refresh token, dst)
        supabase.auth.onAuthStateChange(function(event, session) {
            if (session && session.user) {
                RZAuth._setUser(session.user);
            } else if (event === 'SIGNED_OUT') {
                RZAuth.user = null;
                RZAuth.profile = null;
                RZAuth.onLogout();
            }
        });
    },

    async _setUser(user) {
        var isNew = !RZAuth.user || RZAuth.user.id !== user.id;
        RZAuth.user = user;
        await RZAuth.loadProfile(user);
        if (isNew) RZAuth.onLogin(user);
        else RZAuth.updateUI();
    },

    // ── Login dengan Google (OAuth redirect — standar & paling stabil utk Supabase) ──
    async loginGoogle() {
        try {
            var redirectTo = window.location.origin + window.location.pathname + window.location.search;
            var { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: { redirectTo: redirectTo }
            });
            if (error) {
                showToast('Gagal login: ' + error.message, 'alert-triangle');
                return null;
            }
            // Browser akan redirect ke Google lalu balik lagi ke app; sesi otomatis
            // terdeteksi oleh onAuthStateChange di atas.
            return true;
        } catch (e) {
            showToast('Gagal login: ' + e.message, 'alert-triangle');
            return null;
        }
    },

    // ── Logout ──
    async logout() {
        try {
            // Sync data ke cloud sebelum logout
            await RZAuth.syncToCloud();
            await supabase.auth.signOut();
            showToast('Berhasil logout', 'check-circle');
        } catch (e) {
            showToast('Gagal logout', 'alert-triangle');
        }
    },

    // ── Load profil dari tabel `profiles` ──
    async loadProfile(user) {
        try {
            var { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
            if (error) throw error;
            if (data) {
                RZAuth.profile = data;
                // Sync data cloud ke local jika ada
                await RZAuth.syncFromCloud();
            } else {
                // Buat profil baru
                var meta = user.user_metadata || {};
                var newProfile = {
                    id: user.id,
                    display_name: meta.full_name || meta.name || 'Pengguna',
                    email: user.email,
                    photo_url: meta.avatar_url || meta.picture || '',
                    custom_photo_url: '',
                    created_at: new Date().toISOString(),
                    last_login: new Date().toISOString()
                };
                var { error: insErr } = await supabase.from('profiles').insert(newProfile);
                if (insErr) console.error('insert profile error:', insErr);
                RZAuth.profile = newProfile;
            }
            // Update lastLogin
            await supabase.from('profiles').update({ last_login: new Date().toISOString() }).eq('id', user.id);
        } catch (e) {
            console.error('loadProfile error:', e);
        }
    },

    // ── Upload foto profil custom ke Supabase Storage (bucket: avatars) ──
    async uploadPhoto(file) {
        if (!RZAuth.user) return null;
        if (!file || !file.type.startsWith('image/')) {
            showToast('File harus berupa gambar', 'alert-triangle');
            return null;
        }
        if (file.size > 5 * 1024 * 1024) {
            showToast('Ukuran file maksimal 5MB', 'alert-triangle');
            return null;
        }
        try {
            showToast('Mengupload foto...', 'upload');
            var ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
            var path = RZAuth.user.id + '/avatar.' + ext;
            var { error: upErr } = await supabase.storage.from('avatars').upload(path, file, {
                upsert: true,
                cacheControl: '3600',
                contentType: file.type
            });
            if (upErr) throw upErr;
            var pub = supabase.storage.from('avatars').getPublicUrl(path);
            var url = pub.data.publicUrl + '?t=' + Date.now(); // cache-bust biar foto baru langsung kepakai
            // Simpan ke tabel profiles
            var { error: updErr } = await supabase.from('profiles').update({ custom_photo_url: url }).eq('id', RZAuth.user.id);
            if (updErr) throw updErr;
            if (RZAuth.profile) RZAuth.profile.custom_photo_url = url;
            RZAuth.updateUI();
            showToast('Foto profil diperbarui!', 'check-circle');
            return url;
        } catch (e) {
            console.error('uploadPhoto error:', e);
            showToast('Gagal upload foto', 'alert-triangle');
            return null;
        }
    },

    // ── Sync localStorage → tabel `user_data` ──
    async syncToCloud() {
        if (!RZAuth.user) return;
        try {
            var favs = getFavorites();
            var hist = getHistory();
            var pls = getUserPlaylists();
            var { error } = await supabase.from('user_data').upsert({
                id: RZAuth.user.id,
                favorites: favs,
                history: hist.slice(0, 50),
                playlists: pls,
                updated_at: new Date().toISOString()
            });
            if (error) throw error;
        } catch (e) {
            console.error('syncToCloud error:', e);
        }
    },

    // ── Sync `user_data` → localStorage ──
    async syncFromCloud() {
        if (!RZAuth.user) return;
        try {
            var { data, error } = await supabase.from('user_data').select('*').eq('id', RZAuth.user.id).maybeSingle();
            if (error) throw error;
            if (!data) return;
            // Merge: cloud data menang kalau lebih banyak
            if (data.favorites && data.favorites.length > getFavorites().length) {
                saveFavorites(data.favorites);
            }
            if (data.playlists && data.playlists.length > getUserPlaylists().length) {
                saveUserPlaylists(data.playlists);
            }
            // History: merge unik
            if (data.history && data.history.length > 0) {
                var localH = getHistory();
                var localIds = new Set(localH.map(function(t) { return t.videoId; }));
                var merged = localH.slice();
                data.history.forEach(function(t) { if (!localIds.has(t.videoId)) merged.push(t); });
                try { localStorage.setItem('rz_history', JSON.stringify(merged.slice(0, 50))); } catch (e) {}
            }
            showToast('Data tersinkronisasi ☁️', 'check-circle');
        } catch (e) {
            console.error('syncFromCloud error:', e);
        }
    },

    // ── Get foto profil (custom > Google) ──
    getPhotoURL() {
        if (RZAuth.profile && RZAuth.profile.custom_photo_url) return RZAuth.profile.custom_photo_url;
        if (RZAuth.profile && RZAuth.profile.photo_url) return RZAuth.profile.photo_url;
        var meta = RZAuth.user && RZAuth.user.user_metadata;
        if (meta && (meta.avatar_url || meta.picture)) return meta.avatar_url || meta.picture;
        return '';
    },

    // ── Get nama ──
    getName() {
        if (RZAuth.profile && RZAuth.profile.display_name) return RZAuth.profile.display_name;
        var meta = RZAuth.user && RZAuth.user.user_metadata;
        if (meta && (meta.full_name || meta.name)) return meta.full_name || meta.name;
        return 'Pengguna';
    },

    // ── Update UI setelah login/logout ──
    updateUI() {
        const btn = document.getElementById('auth-btn');
        const avatar = document.getElementById('auth-avatar');
        if (!btn) return;
        if (RZAuth.user) {
            const photo = RZAuth.getPhotoURL();
            const name = RZAuth.getName().split(' ')[0];
            btn.innerHTML = photo
                ? `<img src="${photo}" class="w-8 h-8 rounded-full object-cover border border-white/20" onerror="this.style.display='none'" />`
                : `<div class="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold">${name[0]}</div>`;
            btn.title = name;
        } else {
            btn.innerHTML = `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
            btn.title = 'Login';
        }
    },

    // ── Handler login ──
    onLogin(user) {
        RZAuth.updateUI();
        // Auto sync setiap 5 menit
        if (RZAuth._syncInterval) clearInterval(RZAuth._syncInterval);
        RZAuth._syncInterval = setInterval(function() { RZAuth.syncToCloud(); }, 5 * 60 * 1000);
    },

    // ── Handler logout ──
    onLogout() {
        RZAuth.updateUI();
        if (RZAuth._syncInterval) clearInterval(RZAuth._syncInterval);
    },

    // ── Tampilkan popup auth ──
    showAuthPopup() {
        if (RZAuth.user) {
            RZAuth.showProfilePopup();
        } else {
            RZAuth.showLoginPopup();
        }
    },

    // ── Popup Login ──
    showLoginPopup() {
        const popup = document.createElement('div');
        popup.className = 'fixed inset-0 z-[300] flex items-end justify-center bg-black/60';
        popup.onclick = function(e) { if (e.target === popup) popup.remove(); };
        popup.innerHTML = `
        <div class="glass-strong w-full max-w-md rounded-t-3xl p-6 border-t border-white/10" style="animation:slideUp 0.3s ease-out forwards;">
            <div class="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5"></div>
            <div class="text-center mb-6">
                <div class="text-4xl mb-3">🎵</div>
                <h3 class="font-black text-xl text-white mb-1">Masuk ke RZmusic</h3>
                <p class="text-[#6b7280] text-sm">Login untuk menyimpan playlist & favorit di cloud — tidak hilang meski ganti HP</p>
            </div>
            <div class="space-y-3">
                <button id="login-google" class="w-full flex items-center justify-center gap-3 bg-white text-black font-bold py-3.5 rounded-2xl active:scale-95 transition-all">
                    <img src="https://www.google.com/favicon.ico" class="w-5 h-5" />
                    Lanjutkan dengan Google
                </button>
                <button onclick="this.closest('.fixed').remove()" class="w-full py-3 glass text-white/60 rounded-2xl text-sm">
                    Nanti saja, tetap tanpa login
                </button>
            </div>
            <p class="text-center text-[#4b5563] text-xs mt-4">Dengan login, kamu menyetujui penggunaan data untuk sinkronisasi</p>
        </div>`;
        document.body.appendChild(popup);
        popup.querySelector('#login-google').onclick = async function() {
            this.textContent = 'Mengalihkan ke Google...';
            this.disabled = true;
            const ok = await RZAuth.loginGoogle();
            // loginGoogle melakukan redirect penuh ke Google kalau sukses,
            // jadi popup tidak perlu ditutup manual di sini.
            if (!ok) { this.textContent = 'Coba Lagi'; this.disabled = false; }
        };
    },

    // ── Popup Profil ──
    showProfilePopup() {
        const photo = RZAuth.getPhotoURL();
        const name = RZAuth.getName();
        const email = RZAuth.user ? RZAuth.user.email : '';
        const popup = document.createElement('div');
        popup.className = 'fixed inset-0 z-[300] flex items-end justify-center bg-black/60';
        popup.onclick = function(e) { if (e.target === popup) popup.remove(); };
        popup.innerHTML = `
        <div class="glass-strong w-full max-w-md rounded-t-3xl p-6 border-t border-white/10" style="animation:slideUp 0.3s ease-out forwards;">
            <div class="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5"></div>
            <div class="flex items-center gap-4 mb-6">
                <div class="relative flex-shrink-0">
                    <div class="w-16 h-16 rounded-full overflow-hidden border-2 border-white/20">
                        ${photo
                            ? `<img id="prof-img" src="${photo}" class="w-full h-full object-cover" />`
                            : `<div class="w-full h-full bg-white/10 flex items-center justify-center text-2xl font-black">${name[0]}</div>`}
                    </div>
                    <button id="change-photo-btn" class="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg" title="Ganti foto">
                        <svg width="12" height="12" fill="none" stroke="#000" stroke-width="2.5" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <input id="photo-input" type="file" accept="image/*" class="hidden" />
                </div>
                <div class="flex-1 min-w-0">
                    <h3 class="font-bold text-white text-lg truncate">${name}</h3>
                    <p class="text-[#6b7280] text-sm truncate">${email}</p>
                    <span class="inline-flex items-center gap-1 text-xs text-green-400 mt-1">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                        Tersinkronisasi
                    </span>
                </div>
            </div>
            <div class="space-y-2 mb-4">
                <button id="sync-btn" class="w-full flex items-center gap-3 glass glass-hover py-3 px-4 rounded-xl text-white font-medium text-sm active:scale-95">
                    <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>
                    Sinkronisasi Sekarang
                </button>
                <button id="logout-btn" class="w-full flex items-center gap-3 glass glass-hover py-3 px-4 rounded-xl text-red-400 font-medium text-sm active:scale-95">
                    <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    Logout
                </button>
            </div>
            <button onclick="this.closest('.fixed').remove()" class="w-full py-2.5 text-[#6b7280] text-sm">Tutup</button>
        </div>`;
        document.body.appendChild(popup);

        // Ganti foto
        popup.querySelector('#change-photo-btn').onclick = function() {
            popup.querySelector('#photo-input').click();
        };
        popup.querySelector('#photo-input').onchange = async function() {
            const file = this.files[0];
            if (!file) return;
            const url = await RZAuth.uploadPhoto(file);
            if (url) {
                const img = popup.querySelector('#prof-img');
                if (img) img.src = url;
            }
        };

        // Sync
        popup.querySelector('#sync-btn').onclick = async function() {
            this.textContent = 'Menyinkronkan...';
            this.disabled = true;
            await RZAuth.syncToCloud();
            await RZAuth.syncFromCloud();
            this.textContent = '✅ Tersinkronisasi!';
            setTimeout(() => { this.textContent = 'Sinkronisasi Sekarang'; this.disabled = false; }, 2000);
        };

        // Logout
        popup.querySelector('#logout-btn').onclick = async function() {
            this.textContent = 'Logout...';
            this.disabled = true;
            popup.remove();
            await RZAuth.logout();
        };
    }
};

// Auto init
RZAuth.init();
