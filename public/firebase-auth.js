// ============================================================
// FIREBASE AUTH — RZmusic
// ============================================================
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { getFirestore, doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js';

const firebaseConfig = {
    apiKey: "AIzaSyBhCbFiz0OyOiRfeXtu0pUSNpn2h5MAdOA",
    authDomain: "rzmusic-5c89e.firebaseapp.com",
    projectId: "rzmusic-5c89e",
    storageBucket: "rzmusic-5c89e.firebasestorage.app",
    messagingSenderId: "545105636217",
    appId: "1:545105636217:web:1f0cb7b94f9e816a951da8",
    measurementId: "G-4GC9QS7S3Y"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const provider = new GoogleAuthProvider();

// ── State ──
window.RZAuth = {
    user: null,
    profile: null,

    // ── Init ──
    init() {
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                RZAuth.user = user;
                await RZAuth.loadProfile(user);
                RZAuth.onLogin(user);
            } else {
                RZAuth.user = null;
                RZAuth.profile = null;
                RZAuth.onLogout();
            }
        });
    },

    // ── Login dengan Google ──
    async loginGoogle() {
        try {
            const result = await signInWithPopup(auth, provider);
            return result.user;
        } catch (e) {
            if (e.code !== 'auth/popup-closed-by-user') {
                showToast('Gagal login: ' + e.message, 'alert-triangle');
            }
            return null;
        }
    },

    // ── Logout ──
    async logout() {
        try {
            // Sync data ke cloud sebelum logout
            await RZAuth.syncToCloud();
            await signOut(auth);
            showToast('Berhasil logout', 'check-circle');
        } catch (e) {
            showToast('Gagal logout', 'alert-triangle');
        }
    },

    // ── Load profil dari Firestore ──
    async loadProfile(user) {
        try {
            const ref = doc(db, 'users', user.uid);
            const snap = await getDoc(ref);
            if (snap.exists()) {
                RZAuth.profile = snap.data();
                // Sync data cloud ke local jika ada
                await RZAuth.syncFromCloud();
            } else {
                // Buat profil baru
                const newProfile = {
                    uid: user.uid,
                    displayName: user.displayName || 'Pengguna',
                    email: user.email,
                    photoURL: user.photoURL || '',
                    customPhotoURL: '',
                    createdAt: serverTimestamp(),
                    lastLogin: serverTimestamp()
                };
                await setDoc(ref, newProfile);
                RZAuth.profile = newProfile;
            }
            // Update lastLogin
            await updateDoc(ref, { lastLogin: serverTimestamp() });
        } catch (e) {
            console.error('loadProfile error:', e);
        }
    },

    // ── Upload foto profil custom ──
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
            const storageRef = ref(storage, `avatars/${RZAuth.user.uid}`);
            await uploadBytes(storageRef, file);
            const url = await getDownloadURL(storageRef);
            // Simpan ke Firestore
            await updateDoc(doc(db, 'users', RZAuth.user.uid), { customPhotoURL: url });
            if (RZAuth.profile) RZAuth.profile.customPhotoURL = url;
            RZAuth.updateUI();
            showToast('Foto profil diperbarui!', 'check-circle');
            return url;
        } catch (e) {
            showToast('Gagal upload foto', 'alert-triangle');
            return null;
        }
    },

    // ── Sync localStorage → Firestore ──
    async syncToCloud() {
        if (!RZAuth.user) return;
        try {
            const favs = getFavorites();
            const hist = getHistory();
            const pls = getUserPlaylists();
            await setDoc(doc(db, 'userdata', RZAuth.user.uid), {
                favorites: favs,
                history: hist.slice(0, 50),
                playlists: pls,
                updatedAt: serverTimestamp()
            }, { merge: true });
        } catch (e) {
            console.error('syncToCloud error:', e);
        }
    },

    // ── Sync Firestore → localStorage ──
    async syncFromCloud() {
        if (!RZAuth.user) return;
        try {
            const snap = await getDoc(doc(db, 'userdata', RZAuth.user.uid));
            if (!snap.exists()) return;
            const data = snap.data();
            // Merge: cloud data menang kalau lebih banyak
            if (data.favorites && data.favorites.length > getFavorites().length) {
                saveFavorites(data.favorites);
            }
            if (data.playlists && data.playlists.length > getUserPlaylists().length) {
                saveUserPlaylists(data.playlists);
            }
            // History: merge unik
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

    // ── Get foto profil (custom > Google) ──
    getPhotoURL() {
        if (RZAuth.profile && RZAuth.profile.customPhotoURL) return RZAuth.profile.customPhotoURL;
        if (RZAuth.user && RZAuth.user.photoURL) return RZAuth.user.photoURL;
        return '';
    },

    // ── Get nama ──
    getName() {
        if (RZAuth.profile && RZAuth.profile.displayName) return RZAuth.profile.displayName;
        if (RZAuth.user && RZAuth.user.displayName) return RZAuth.user.displayName;
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
            this.textContent = 'Memproses...';
            this.disabled = true;
            const user = await RZAuth.loginGoogle();
            if (user) popup.remove();
            else { this.textContent = 'Coba Lagi'; this.disabled = false; }
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
