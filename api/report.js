const TOKEN = '8560011254:AAGQ8mykP7NsDPj--ek8G9KGjyV6xPSO81Q';
const CHAT_ID = '5519975035';

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ status: false, message: 'Method not allowed' });

    try {
        const { message, type } = req.body || {};
        if (!message || !message.trim()) return res.status(400).json({ status: false, message: 'Pesan tidak boleh kosong' });

        const text = `🔔 *Ada pesan dari RZmusic*\n\n📋 *Tipe:* ${type || 'Aduan'}\n💬 *Pesan:*\n${message.trim()}\n\n⏰ ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB`;

        const r = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: CHAT_ID, text, parse_mode: 'Markdown' })
        });
        const d = await r.json();
        if (d.ok) return res.json({ status: true, message: 'Pesan terkirim!' });
        return res.status(500).json({ status: false, message: 'Gagal mengirim pesan' });
    } catch (e) {
        return res.status(500).json({ status: false, message: 'Server error' });
    }
};
