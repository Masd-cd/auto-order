export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    
    const { pesan } = req.body;
    const token = process.env.TELEGRAM_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
        return res.status(500).json({ error: 'Token atau Chat ID belum disetting di Vercel' });
    }

    try {
        const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: pesan,
                parse_mode: 'HTML'
            })
        });
        const data = await response.json();
        res.status(200).json({ status: 'sukses', data });
    } catch (error) {
        res.status(500).json({ status: 'error', pesan: error.message });
    }
}
