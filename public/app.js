import { auth, db, uploadToCloudinary } from './firebase-auth.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { ref, update, get } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            setupUserProfile(user);
        }
    });
}

function setupUserProfile(user) {
    const avatarImg = document.getElementById('user-avatar');
    const fileInput = document.getElementById('avatar-input');
    const uploadStatus = document.getElementById('upload-status');

    // 1. Ambil foto profil dari Database Firebase
    const userRef = ref(db, 'users/' + user.uid);
    get(userRef).then((snapshot) => {
        if (snapshot.exists() && snapshot.val().photoURL) {
            if (avatarImg) avatarImg.src = snapshot.val().photoURL;
        } else if (user.photoURL && avatarImg) {
            avatarImg.src = user.photoURL;
        }
    });

    // 2. Upload foto saat user memilih file
    if (fileInput) {
        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            showStatus(uploadStatus, 'Mengunggah foto...', 'info');

            try {
                // Upload foto ke Cloudinary
                const photoURL = await uploadToCloudinary(file);

                // Simpan URL dari Cloudinary ke Realtime Database
                await update(ref(db, 'users/' + user.uid), {
                    photoURL: photoURL,
                    updatedAt: new Date().toISOString()
                });

                // Update tampilan foto di UI
                if (avatarImg) avatarImg.src = photoURL;
                showStatus(uploadStatus, 'Foto berhasil diperbarui!', 'success');

            } catch (error) {
                console.error('Upload error:', error);
                showStatus(uploadStatus, 'Gagal upload foto', 'error');
            }
        });
    }
}

function showStatus(element, message, type) {
    if (!element) return;
    element.textContent = message;
    element.style.display = 'block';
    
    if (type === 'error') {
        element.style.backgroundColor = '#ff4d4d';
    } else if (type === 'success') {
        element.style.backgroundColor = '#2ecc71';
    } else {
        element.style.backgroundColor = '#3498db';
    }

    setTimeout(() => {
        if (type !== 'info') element.style.display = 'none';
    }, 3000);
}
