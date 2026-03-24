export default async function handler(req, res) {
    const orderId = req.query.order_id;
    if (!orderId) return res.status(400).json({ error: 'Order ID kosong' });

    const kvUrl = process.env.KV_REST_API_URL;
    const kvToken = process.env.KV_REST_API_TOKEN;

    try {
        // Mengambil data dari Vercel KV berdasarkan Order ID
        const response = await fetch(`${kvUrl}/get/${orderId}`, {
            headers: { 'Authorization': `Bearer ${kvToken}` }
        });
        const data = await response.json();

        if (data.result) {
            return res.status(200).json({ status: 'sukses', akun: JSON.parse(data.result) });
        } else {
            return res.status(200).json({ status: 'menunggu' });
        }
    } catch (error) {
        return res.status(500).json({ error: 'Gagal mengambil data' });
    }
}
