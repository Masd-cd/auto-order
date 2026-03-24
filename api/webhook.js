export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ message: 'Hanya menerima POST' });

    const dataPakasir = req.body;

    if (dataPakasir.status === 'completed') {
        const orderId = dataPakasir.order_id;
        console.log(`[LUNAS] Memproses pesanan: ${orderId}`);

        if (orderId.startsWith('SSH-')) {
            const potong = orderId.split('-'); 
            const durasi = parseInt(potong[1]);
            const user = potong[2];
            const pass = potong[3];
            
            const dataKeVPS = {
                expired: durasi,
                limitip: 2,
                password: pass,
                username: user
            };

            try {
                // 1. TEMBAK VPS (Tanpa Port 81)
                const responseVPS = await fetch('http://167.172.73.230/vps/sshvpn', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${process.env.POTATO_API_KEY}` 
                    },
                    body: JSON.stringify(dataKeVPS)
                });
                
                const textBalasan = await responseVPS.text();
                let hasilVPS = JSON.parse(textBalasan);

                if (responseVPS.ok && hasilVPS.data) {
                    // 2. SIMPAN KE VERCEL KV (Gunakan KV_URL bawaan Vercel)
                    const kvUrl = process.env.KV_REST_API_URL;
                    const kvToken = process.env.KV_REST_API_TOKEN;
                    
                    if (!kvUrl || !kvToken) {
                        console.error("❌ KV DATABASE BELUM TERSAMBUNG!");
                        return res.status(500).json({ error: 'KV Config Missing' });
                    }

                    // Kirim ke Redis
                    await fetch(`${kvUrl}/set/${orderId}`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${kvToken}` },
                        body: JSON.stringify({
                           result: JSON.stringify(hasilVPS.data) // Bungkus agar sesuai dengan api/cek_akun.js
                        })
                    });
                    
                    // Set Expired data di KV (agar tidak menumpuk)
                    await fetch(`${kvUrl}/expire/${orderId}/3600`, {
                        headers: { 'Authorization': `Bearer ${kvToken}` }
                    });

                    console.log(`✅ AKUN JADI & DISIMPAN!`);
                }
            } catch (error) {
                console.error("❌ ERROR FINAL:", error.message);
            }
        }
        return res.status(200).json({ message: 'Webhook sukses' });
    }
    return res.status(200).json({ message: 'Belum lunas' });
}
