export default async function handler(req, res) {
    const orderId = req.query.order_id;
    const redisUrl = process.env.masdvpnstore_REDIS_URL;

    if (!redisUrl) return res.status(500).json({ error: 'Config Missing' });

    try {
        // Mengambil data dari Redis Labs
        const restUrl = redisUrl.replace('redis://', 'https://').split('@')[1];
        const [host, token] = restUrl.split(':');

        const response = await fetch(`https://${restUrl}/get/${orderId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        if (data.result) {
            return res.status(200).json({ status: 'sukses', akun: JSON.parse(data.result) });
        } else {
            return res.status(200).json({ status: 'menunggu' });
        }
    } catch (error) {
        return res.status(500).json({ error: 'Gagal' });
    }
}
