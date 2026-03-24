export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ message: 'Hanya menerima POST' });

    const dataPakasir = req.body;

    if (dataPakasir.status === 'completed') {
        const orderId = dataPakasir.order_id;
        console.log(`[LUNAS] Memproses pesanan: ${orderId}`);

        if (orderId.startsWith('SSH-')) {
            const durasi = parseInt(orderId.split('-')[1]);
            const randomAngka = Math.floor(1000 + Math.random() * 9000);
            
            // Format Data JSON untuk Potato API
            const dataKeVPS = {
                expired: durasi,
                limitip: 2,
                password: `pass${randomAngka}`,
                username: `masd_${randomAngka}`
            };

            try {
                // 1. TEMBAK API POTATO KE VPS SINGAPORE
                const responseVPS = await fetch('http://167.172.73.230:81/vps/sshvpn', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${process.env.POTATO_API_KEY}` 
                    },
                    body: JSON.stringify(dataKeVPS)
                });
                const hasilVPS = await responseVPS.json();

                // 2. SIMPAN HASILNYA KE VERCEL KV (REDIS)
                if (responseVPS.ok && hasilVPS.data) {
                    const kvUrl = process.env.KV_REST_API_URL;
                    const kvToken = process.env.KV_REST_API_TOKEN;
                    
                    // Simpan data selama 1 Jam (3600 detik)
                    await fetch(`${kvUrl}/set/${orderId}?EX=3600`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${kvToken}` },
                        body: JSON.stringify(hasilVPS.data)
                    });
                    console.log(`✅ Akun berhasil dibuat & disimpan di KV!`);
                }
            } catch (error) {
                console.error("❌ ERROR:", error);
            }
        }
        return res.status(200).json({ message: 'Webhook sukses' });
    }
    return res.status(200).json({ message: 'Belum lunas' });
}
