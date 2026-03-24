export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ message: 'Hanya menerima POST' });

    const dataPakasir = req.body;

    if (dataPakasir.status === 'completed') {
        const orderId = dataPakasir.order_id;
        console.log(`[LUNAS] Memproses pesanan: ${orderId}`);

        if (orderId.startsWith('SSH-')) {
            const potong = orderId.split('-'); 
            const durasi = parseInt(potong[1]);
            const usernameKetikan = potong[2];
            const passwordKetikan = potong[3];
            
            const dataKeVPS = {
                expired: durasi,
                limitip: 2,
                password: passwordKetikan,
                username: usernameKetikan
            };

            try {
                const responseVPS = await fetch('http://167.172.73.230/vps/sshvpn', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${process.env.POTATO_API_KEY}` 
                    },
                    body: JSON.stringify(dataKeVPS)
                });
                
                // KITA BACA BALASAN MENTAHNYA DI SINI
                const textBalasan = await responseVPS.text();
                console.log("➡️ Balasan Mentah dari VPS Potato:", textBalasan);

                // Baru kita coba jadikan JSON
                let hasilVPS;
                try {
                    hasilVPS = JSON.parse(textBalasan);
                } catch (e) {
                    console.error("❌ ERROR SYNTAX: VPS membalas dengan format yang bukan JSON!");
                    return res.status(200).json({ message: 'Gagal parse JSON' });
                }

                // Jika formatnya benar JSON dan ada isinya
                if (responseVPS.ok && hasilVPS.data) {
                    const kvUrl = process.env.KV_REST_API_URL;
                    const kvToken = process.env.KV_REST_API_TOKEN;
                    
                    await fetch(`${kvUrl}/set/${orderId}?EX=3600`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${kvToken}` },
                        body: JSON.stringify(hasilVPS.data)
                    });
                    console.log(`✅ Akun berhasil dibuat & disimpan di KV!`);
                } else {
                    console.error("❌ VPS Menolak Permintaan:", hasilVPS);
                }
            } catch (error) {
                console.error("❌ ERROR KONEKSI KE VPS:", error);
            }
        }
        return res.status(200).json({ message: 'Webhook sukses' });
    }
    return res.status(200).json({ message: 'Belum lunas' });
}
