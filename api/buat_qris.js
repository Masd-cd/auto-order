module.exports = async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Hanya POST' });

    const { order_id, amount } = req.body;

    try {
        // Menembak API Pakasir sesuai dokumentasi
        const response = await fetch('https://app.pakasir.com/api/transactioncreate/qris', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                project: "masd", // Slug project kamu
                order_id: order_id,
                amount: parseInt(amount),
                api_key: process.env.PAKASIR_API_KEY // Memanggil API Key dari Vercel Environment
            })
        });

        const data = await response.json();

        // Kalau sukses, kirim string QRIS dan harga + kode unik ke frontend
        if (response.ok && data.payment) {
            return res.status(200).json({
                status: 'sukses',
                qris_string: data.payment.payment_number,
                total_bayar: data.payment.total_payment
            });
        } else {
            return res.status(400).json({ status: 'gagal', alasan: 'Gagal dari Pakasir' });
        }
    } catch (error) {
        return res.status(500).json({ status: 'error', alasan: error.message });
    }
};
