import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// Konfigurasi Firebase
const firebaseConfig = {
  authDomain: "rzmusic-5c89e.firebaseapp.com",
  databaseURL: "https://rzmusic-5c89e-default-rtdb.asia-southeast1.firebasedatabase.app/",
  projectId: "rzmusic-5c89e",
  storageBucket: "rzmusic-5c89e.appspot.com"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
const provider = new GoogleAuthProvider();

// Konfigurasi Cloudinary
export const CLOUDINARY_CONFIG = {
  cloudName: "Cloudinary",
  uploadPreset: "ml_default"
};

// Fungsi Upload Foto ke Cloudinary
export async function uploadToCloudinary(file) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`, {
    method: 'POST',
    body: formData
  });

  if (!res.ok) {
    const errData = await res.json();
    throw new Error(errData.error?.message || 'Gagal upload ke Cloudinary');
  }

  const data = await res.json();
  return data.secure_url;
}

// Login Google
export async function loginWithGoogle() {
  const result = await signInWithPopup(auth, provider);
  const user = result.user;
  
  await set(ref(db, 'users/' + user.uid), {
    displayName: user.displayName,
    email: user.email,
    photoURL: user.photoURL,
    lastLogin: new Date().toISOString()
  });

  return user;
}

export async function logoutUser() {
  await signOut(auth);
}

export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}
