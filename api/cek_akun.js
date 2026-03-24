export default async function handler(req, res) {
    const orderId = req.query.order_id;
    const kvUrl = process.env.KV_REST_API_URL;
    const kvToken = process.env.KV_REST_API_TOKEN;

    if (!kvUrl || !kvToken) return res.status(500).json({ error: 'Database Config Missing' });

    try {
        const response = await fetch(`${kvUrl}/get/${orderId}`, {
            headers: { 'Authorization': `Bearer ${kvToken}` }
        });
        const data = await response.json();

        if (data.result) {
            // Karena kita simpan dalam bentuk { result: "JSON_STRING" }
            const parseLapis1 = JSON.parse(data.result);
            const dataAkunAsli = JSON.parse(parseLapis1.result);
            
            return res.status(200).json({ status: 'sukses', akun: dataAkunAsli });
        } else {
            return res.status(200).json({ status: 'menunggu' });
        }
    } catch (error) {
        return res.status(500).json({ error: 'Gagal ambil data' });
    }
}
