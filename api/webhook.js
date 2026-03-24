import { createClient } from 'redis';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    const dataPakasir = req.body;
    if (dataPakasir.status === 'completed') {
        const orderId = dataPakasir.order_id;
        const potong = orderId.split('-'); 

        // Logika Baru: SSH-[SERVER]-[DURASI]-[USER]-[PASS]
        // potong[0] = SSH, potong[1] = SG-DO / ID-TECH, potong[2] = Durasi
        if (potong[0] === 'SSH') {
            const serverDipilih = potong[1];
            const dataKeVPS = {
                expired: parseInt(potong[2]),
                limitip: 2,
                username: potong[3],
                password: potong[4]
            };

            let vpsUrl = '';
            // Tentukan IP VPS berdasarkan pilihan di web
            if (serverDipilih === 'SG-DO') {
                vpsUrl = 'http://167.172.73.230/vps/sshvpn';
            } else if (serverDipilih === 'ID-TECH') {
                // Masukkan IP VPS Indonesia kamu di sini nanti
                vpsUrl = 'http://IP-VPS-INDONESIA-KAMU/vps/sshvpn';
            }

            const client = createClient({
                password: 'lCMErlPn1KgtvOb7VR5DEpP9WrLxATiT',
                socket: { host: 'redis-12417.c292.ap-southeast-1-1.ec2.cloud.redislabs.com', port: 12417 }
            });

            try {
                // 1. TEMBAK VPS
                const resVPS = await fetch(vpsUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${process.env.POTATO_API_KEY}`
                    },
                    body: JSON.stringify(dataKeVPS)
                });
                
                const hasilVPS = await resVPS.json();

                if (resVPS.ok && hasilVPS.data) {
                    // 2. SIMPAN KE REDIS
                    await client.connect();
                    await client.set(orderId, JSON.stringify(hasilVPS.data), { EX: 3600 });
                    await client.quit();
                    console.log(`✅ Akun Premium Aktif: ${dataKeVPS.username}`);
                }
            } catch (err) {
                if (client.isOpen) await client.quit();
                console.error("❌ Gagal Webhook:", err.message);
            }
        }
        return res.status(200).send('OK');
    }
    return res.status(200).send('Pending');
}
