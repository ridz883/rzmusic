// Rate limiter sederhana pakai in-memory store
const store = new Map();
const LIMIT = 40; // max request per window
const WINDOW = 60 * 1000; // 1 menit

module.exports = function rateLimit(req, res) {
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
    const now = Date.now();
    const key = ip;
    
    if (!store.has(key)) {
        store.set(key, { count: 1, start: now });
        return true;
    }
    
    const data = store.get(key);
    
    // Reset window jika sudah lewat
    if (now - data.start > WINDOW) {
        store.set(key, { count: 1, start: now });
        return true;
    }
    
    data.count++;
    
    if (data.count > LIMIT) {
        res.status(429).json({
            status: false,
            message: 'Terlalu banyak permintaan. Coba lagi dalam 1 menit.',
            retryAfter: Math.ceil((WINDOW - (now - data.start)) / 1000)
        });
        return false;
    }
    
    return true;
};

// Bersihkan store lama setiap 5 menit biar tidak memory leak
setInterval(function() {
    const now = Date.now();
    for (const [key, data] of store.entries()) {
        if (now - data.start > WINDOW * 2) store.delete(key);
    }
}, 5 * 60 * 1000);
