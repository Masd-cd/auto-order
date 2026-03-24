export default async function handler(req, res) {
    // Pakasir akan mengirimkan data menggunakan metode POST
    if (req.method === 'POST') {
        const dataPakasir = req.body;

        // Memastikan status transaksinya berhasil
        if (dataPakasir.status === 'completed') {
            console.log(`[PESANAN LUNAS] Order ID: ${dataPakasir.order_id} sebesar Rp${dataPakasir.amount}`);
            
            // ==========================================
            // TEMPAT API AGUNG TUNNELING NANTI DITARUH
            // ==========================================
            // Di sini nanti kita buat kode HTTP Request ke IP VPS kamu
            // menggunakan API Key dari Mas Agung untuk otomatis membuat akun.
            
            
            // Memberikan respon sukses ke sistem Pakasir agar webhook tidak dikirim ulang
            return res.status(200).json({ message: 'Webhook sukses diterima oleh MasD VPNStore' });
        } else {
            return res.status(400).json({ message: 'Pembayaran belum selesai' });
        }
    } else {
        return res.status(405).json({ message: 'Hanya menerima request POST' });
    }
}
