// ============================================================
// SUPABASE AUTH — RZmusic
// ============================================================
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://hyfneapsswalkvafepji.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5Zm5lYXBzc3dhbGt2YWZlcGppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5MTI5OTQsImV4cCI6MjEwMTQ4ODk5NH0.yvW56vhGQRJHha7YeUIFwHf2ymKKP7wnldmpphwIQ6g';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

window.RZAuth = {
    user: null,
    profile: null,
    _syncInterval: null,

    // ── Init — cek session yang tersimpan ──
    async init() {
        // Cek session aktif
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            RZAuth.user = session.user;
            await RZAuth.loadProfile(session.user);
            RZAuth.onLogin(session.user);
        }

        // Listen perubahan auth
        supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session) {
                RZAuth.user = session.user;
                await RZAuth.loadProfile(session.user);
                RZAuth.onLogin(session.user);
            } else if (event === 'SIGNED_OUT') {
                RZAuth.user = null;
                RZAuth.profile = null;
                RZAuth.onLogout();
            }
        });
    },

    // ── Login Google ──
    async loginGoogle() {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin,
                    queryParams: { access_type: 'offline', prompt: 'consent' }
                }
            });
            if (error) throw error;
        } catch (e) {
            showToast('Gagal login: ' + e.message, 'alert-triangle');
        }
    },

    // ── Logout ──
    async logout() {
        try {
            await RZAuth.syncToCloud();
            await supabase.auth.signOut();
            showToast('Berhasil logout', 'check-circle');
        } catch (e) {
            showToast('Gagal logout', 'alert-triangle');
        }
    },

    // ── Load profil dari database ──
    async loadProfile(user) {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (error || !data) {
                // Buat profil baru
                const newProfile = {
                    user_id: user.id,
                    display_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Pengguna',
                    email: user.email,
                    photo_url: user.user_metadata?.avatar_url || '',
                    custom_photo_url: '',
                    created_at: new Date().toISOString(),
                    last_login: new Date().toISOString()
                };
                const { data: created } = await supabase.from('profiles').insert(newProfile).select().single();
                RZAuth.profile = created || newProfile;
            } else {
                RZAuth.profile = data;
                // Update last login
                await supabase.from('profiles').update({ last_login: new Date().toISOString() }).eq('user_id', user.id);
            }
            // Sync data cloud ke local
            await RZAuth.syncFromCloud();
        } catch (e) {
            console.error('loadProfile error:', e);
        }
    },

    // ── Upload foto profil ke Supabase Storage ──
    async uploadPhoto(file) {
        if (!RZAuth.user) {
            showToast('Login dulu untuk upload foto', 'alert-triangle');
            return null;
        }
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
            const ext = file.name.split('.').pop().toLowerCase();
            // Gunakan path dengan user_id agar RLS policy terpenuhi
            const path = `public/${RZAuth.user.id}.${ext}`;

            // Coba upload
            const { data: upData, error: upErr } = await supabase.storage
                .from('avatars')
                .upload(path, file, { 
                    upsert: true, 
                    contentType: file.type,
                    cacheControl: '3600'
                });

            if (upErr) {
                console.error('Upload error:', upErr);
                // Jika RLS error, coba cara alternatif
                if (upErr.message && upErr.message.includes('row-level security')) {
                    showToast('Aktifkan Storage policy dulu di Supabase', 'alert-triangle');
                    RZAuth._showStorageGuide();
                    return null;
                }
                throw upErr;
            }

            // Ambil public URL
            const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
            const url = urlData.publicUrl + '?v=' + Date.now();

            // Update profil di database
            const { error: updateErr } = await supabase
                .from('profiles')
                .update({ custom_photo_url: url })
                .eq('user_id', RZAuth.user.id);

            if (updateErr) throw updateErr;

            if (RZAuth.profile) RZAuth.profile.custom_photo_url = url;
            RZAuth.updateUI();
            showToast('Foto profil diperbarui! ✅', 'check-circle');
            return url;
        } catch (e) {
            console.error('uploadPhoto error:', e);
            showToast('Gagal upload: ' + (e.message || 'Error tidak diketahui'), 'alert-triangle');
            return null;
        }
    },

    _showStorageGuide() {
        const popup = document.createElement('div');
        popup.className = 'fixed inset-0 z-[400] flex items-end justify-center bg-black/60';
        popup.onclick = function(e) { if (e.target === popup) popup.remove(); };
        popup.innerHTML = `
        <div class="glass-strong w-full max-w-md rounded-t-3xl p-6 border-t border-white/10" style="animation:slideUp 0.3s ease-out forwards;">
            <div class="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4"></div>
            <h3 class="font-bold text-white mb-3">⚙️ Setup Storage (1x saja)</h3>
            <p class="text-[#6b7280] text-sm mb-4">Jalankan SQL ini di Supabase SQL Editor:</p>
            <div class="glass rounded-xl p-3 mb-4 text-xs text-green-400 font-mono overflow-x-auto">
                <p>-- Buat bucket avatars (kalau belum ada)</p>
                <p>insert into storage.buckets (id, name, public)</p>
                <p>values ('avatars', 'avatars', true)</p>
                <p>on conflict do nothing;</p>
                <br/>
                <p>-- Policy upload</p>
                <p>create policy "Public avatar upload"</p>
                <p>on storage.objects for insert</p>
                <p>with check (bucket_id = 'avatars');</p>
                <br/>
                <p>-- Policy lihat</p>
                <p>create policy "Public avatar view"</p>
                <p>on storage.objects for select</p>
                <p>using (bucket_id = 'avatars');</p>
                <br/>
                <p>-- Policy update</p>
                <p>create policy "Public avatar update"</p>
                <p>on storage.objects for update</p>
                <p>using (bucket_id = 'avatars');</p>
            </div>
            <button onclick="this.closest('.fixed').remove()" class="w-full btn-chrome font-bold py-3 rounded-full">Mengerti</button>
        </div>`;
        document.body.appendChild(popup);
    },
            showToast('Gagal upload foto: ' + e.message, 'alert-triangle');
            return null;
        }
    },

    // ── Sync localStorage → Supabase ──
    async syncToCloud() {
        if (!RZAuth.user) return;
        try {
            const favs = getFavorites() || [];
            const hist = (getHistory() || []).slice(0, 50);
            const pls = getUserPlaylists() || [];

            const { data: existing } = await supabase
                .from('user_data')
                .select('id')
                .eq('user_id', RZAuth.user.id)
                .single();

            if (existing) {
                await supabase.from('user_data').update({
                    favorites: favs,
                    history: hist,
                    playlists: pls,
                    updated_at: new Date().toISOString()
                }).eq('user_id', RZAuth.user.id);
            } else {
                await supabase.from('user_data').insert({
                    user_id: RZAuth.user.id,
                    favorites: favs,
                    history: hist,
                    playlists: pls,
                    updated_at: new Date().toISOString()
                });
            }
        } catch (e) {
            console.error('syncToCloud error:', e);
        }
    },

    // ── Sync Supabase → localStorage ──
    async syncFromCloud() {
        if (!RZAuth.user) return;
        try {
            const { data } = await supabase
                .from('user_data')
                .select('*')
                .eq('user_id', RZAuth.user.id)
                .single();

            if (!data) return;

            // Merge favorit
            if (data.favorites && data.favorites.length > getFavorites().length) {
                saveFavorites(data.favorites);
            }
            // Merge playlist
            if (data.playlists && data.playlists.length > getUserPlaylists().length) {
                saveUserPlaylists(data.playlists);
            }
            // Merge history
            if (data.history && data.history.length > 0) {
                const localH = getHistory();
                const localIds = new Set(localH.map(t => t.videoId));
                const merged = [...localH];
                data.history.forEach(t => { if (!localIds.has(t.videoId)) merged.push(t); });
                try { localStorage.setItem('rz_history', JSON.stringify(merged.slice(0, 50))); } catch(e) {}
            }
            showToast('Data tersinkronisasi ☁️', 'check-circle');
        } catch (e) {
            console.error('syncFromCloud error:', e);
        }
    },

    // ── Helpers ──
    getPhotoURL() {
        if (RZAuth.profile?.custom_photo_url) return RZAuth.profile.custom_photo_url;
        if (RZAuth.profile?.photo_url) return RZAuth.profile.photo_url;
        if (RZAuth.user?.user_metadata?.avatar_url) return RZAuth.user.user_metadata.avatar_url;
        return '';
    },
    getName() {
        if (RZAuth.profile?.display_name) return RZAuth.profile.display_name;
        if (RZAuth.user?.user_metadata?.full_name) return RZAuth.user.user_metadata.full_name;
        if (RZAuth.user?.email) return RZAuth.user.email.split('@')[0];
        return 'Pengguna';
    },

    // ── Update tombol auth di header ──
    updateUI() {
        const btn = document.getElementById('auth-btn');
        if (!btn) return;
        if (RZAuth.user) {
            const photo = RZAuth.getPhotoURL();
            const initial = RZAuth.getName()[0]?.toUpperCase() || '?';
            btn.innerHTML = photo
                ? `<img src="${photo}" class="w-8 h-8 rounded-full object-cover border border-white/20" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" /><span class="w-8 h-8 rounded-full bg-white/20 items-center justify-center text-xs font-bold hidden">${initial}</span>`
                : `<span class="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">${initial}</span>`;
        } else {
            btn.innerHTML = `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
        }
        if (typeof updateInfoPage === 'function') updateInfoPage();
    },

    onLogin(user) {
        RZAuth.updateUI();
        if (RZAuth._syncInterval) clearInterval(RZAuth._syncInterval);
        RZAuth._syncInterval = setInterval(() => RZAuth.syncToCloud(), 5 * 60 * 1000);
    },

    onLogout() {
        RZAuth.updateUI();
        if (RZAuth._syncInterval) { clearInterval(RZAuth._syncInterval); RZAuth._syncInterval = null; }
    },

    showAuthPopup() {
        if (RZAuth.user) RZAuth.showProfilePopup();
        else RZAuth.showLoginPopup();
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
                <div class="text-5xl mb-3">🎵</div>
                <h3 class="font-black text-xl text-white mb-2">Masuk ke RZmusic</h3>
                <p class="text-[#6b7280] text-sm leading-relaxed">Simpan playlist & favorit di cloud<br>Tidak hilang meski ganti HP</p>
            </div>
            <div class="space-y-3">
                <button id="login-google" class="w-full flex items-center justify-center gap-3 bg-white text-black font-bold py-4 rounded-2xl active:scale-95 transition-all text-sm">
                    <img src="https://www.google.com/favicon.ico" class="w-5 h-5" />
                    Lanjutkan dengan Google
                </button>
                <button onclick="this.closest('.fixed').remove()" class="w-full py-3 glass text-white/40 rounded-2xl text-sm">
                    Nanti saja
                </button>
            </div>
            <p class="text-center text-[#374151] text-xs mt-4">Data kamu aman dan tidak dibagikan ke siapapun</p>
        </div>`;
        document.body.appendChild(popup);
        popup.querySelector('#login-google').onclick = async function() {
            this.innerHTML = '<div class="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto"></div>';
            this.disabled = true;
            await RZAuth.loginGoogle();
            // Popup akan tutup otomatis setelah redirect balik
        };
    },

    // ── Popup Profil ──
    showProfilePopup() {
        const photo = RZAuth.getPhotoURL();
        const name = RZAuth.getName();
        const email = RZAuth.user?.email || '';
        const popup = document.createElement('div');
        popup.className = 'fixed inset-0 z-[300] flex items-end justify-center bg-black/60';
        popup.onclick = function(e) { if (e.target === popup) popup.remove(); };
        popup.innerHTML = `
        <div class="glass-strong w-full max-w-md rounded-t-3xl p-6 border-t border-white/10" style="animation:slideUp 0.3s ease-out forwards;">
            <div class="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5"></div>
            <div class="flex items-center gap-4 mb-5">
                <div class="relative flex-shrink-0">
                    <div class="w-16 h-16 rounded-full overflow-hidden border-2 border-white/20 bg-white/10 flex items-center justify-center">
                        ${photo
                            ? `<img id="prof-img" src="${photo}" class="w-full h-full object-cover" onerror="this.style.display='none'" />`
                            : `<span class="text-2xl font-black">${name[0]?.toUpperCase()}</span>`}
                    </div>
                    <button id="change-photo-btn" class="absolute -bottom-1 -right-1 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-lg active:scale-90">
                        <svg width="13" height="13" fill="none" stroke="#000" stroke-width="2.5" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <input id="photo-input" type="file" accept="image/*" class="hidden" />
                </div>
                <div class="flex-1 min-w-0">
                    <h3 class="font-bold text-white text-lg truncate">${name}</h3>
                    <p class="text-[#6b7280] text-sm truncate">${email}</p>
                    <span class="inline-flex items-center gap-1 text-xs text-green-400 mt-1">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                        Tersinkronisasi ☁️
                    </span>
                </div>
            </div>
            <div class="space-y-2 mb-4">
                <button id="sync-btn" class="w-full flex items-center gap-3 glass glass-hover py-3 px-4 rounded-xl text-white font-medium text-sm active:scale-95">
                    <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>
                    Sinkronisasi Sekarang
                </button>
                <button id="public-profile-btn" class="w-full flex items-center gap-3 glass glass-hover py-3 px-4 rounded-xl text-white font-medium text-sm active:scale-95">
                    <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    Lihat Profil Publik
                </button>
                <button id="logout-btn" class="w-full flex items-center gap-3 glass glass-hover py-3 px-4 rounded-xl text-red-400 font-medium text-sm active:scale-95">
                    <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    Logout
                </button>
            </div>
            <button onclick="this.closest('.fixed').remove()" class="w-full py-2.5 text-[#6b7280] text-sm">Tutup</button>
        </div>`;
        document.body.appendChild(popup);

        popup.querySelector('#change-photo-btn').onclick = () => popup.querySelector('#photo-input').click();
        popup.querySelector('#photo-input').onchange = async function() {
            const file = this.files[0]; if (!file) return;
            const url = await RZAuth.uploadPhoto(file);
            if (url) {
                const img = popup.querySelector('#prof-img');
                if (img) img.src = url;
                else {
                    const wrap = popup.querySelector('.w-16.h-16');
                    if (wrap) wrap.innerHTML = `<img src="${url}" class="w-full h-full object-cover" />`;
                }
                updateInfoPage();
            }
        };
        popup.querySelector('#sync-btn').onclick = async function() {
            const orig = this.innerHTML;
            this.innerHTML = '<div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Menyinkronkan...';
            this.disabled = true;
            await RZAuth.syncToCloud();
            await RZAuth.syncFromCloud();
            this.innerHTML = '✅ Berhasil!';
            setTimeout(() => { this.innerHTML = orig; this.disabled = false; }, 2500);
        };
        popup.querySelector('#public-profile-btn').onclick = function() {
            popup.remove();
            if (typeof showPublicProfile === 'function') {
                showPublicProfile(RZAuth.user.id, RZAuth.getName(), RZAuth.getPhotoURL());
            }
        };
        popup.querySelector('#logout-btn').onclick = async function() {
            this.innerHTML = '<div class="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div> Logout...';
            this.disabled = true;
            popup.remove();
            await RZAuth.logout();
        };
    }
};

RZAuth.init();
