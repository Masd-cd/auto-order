export default async function handler(req, res) {
    const { order_id } = req.query;
    const kvUrl = process.env.KV_REST_API_URL;
    const kvToken = process.env.KV_REST_API_TOKEN;

    if (!order_id) return res.status(400).json({ error: 'Order ID missing' });

    try {
        const response = await fetch(`${kvUrl}/GET/${order_id}`, {
            headers: { 'Authorization': `Bearer ${kvToken}` }
        });
        const data = await response.json();

        // RedisLabs mengembalikan data dalam field .result
        if (data && data.result) {
            return res.status(200).json({ 
                status: 'sukses', 
                akun: JSON.parse(data.result) 
            });
        }
        return res.status(200).json({ status: 'menunggu' });
    } catch (e) {
        return res.status(500).json({ error: 'Gagal mengambil data' });
    }
}
