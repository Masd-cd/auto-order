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
                expired: durasi, limitip: 2, password: pass, username: user
            };

            try {
                // 1. TEMBAK VPS
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
                    // 2. SIMPAN KE REDIS KAMU
                    // Kita pakai URL dari Upstash/RedisLabs kamu
                    const redisUrl = process.env.masdvpnstore_REDIS_URL; 
                    
                    if (!redisUrl) {
                        console.error("❌ Variabel masdvpnstore_REDIS_URL tidak ditemukan!");
                        return res.status(500).json({ error: 'Redis Config Missing' });
                    }

                    // Karena ini Redis Labs/Upstash via HTTP, kita kirim lewat jalur REST
                    // Kita asumsikan ini Upstash karena formatnya sering begini di Vercel
                    const restUrl = redisUrl.replace('redis://', 'https://').split('@')[1];
                    const [host, token] = restUrl.split(':'); // Ini cara teknis bypass

                    // Cara termudah: Kita simpan data akunnya
                    await fetch(`https://${restUrl}/set/${orderId}/${encodeURIComponent(JSON.stringify(hasilVPS.data))}/EX/3600`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });

                    console.log(`✅ AKUN JADI & DISIMPAN DI REDIS!`);
                }
            } catch (error) {
                console.error("❌ ERROR:", error.message);
            }
        }
        return res.status(200).json({ message: 'OK' });
    }
    return res.status(200).json({ message: 'Pending' });
}
