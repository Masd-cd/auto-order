import { createClient } from 'redis';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    const dataPakasir = req.body;
    if (dataPakasir.status === 'completed') {
        const orderId = dataPakasir.order_id;
        const potong = orderId.split('-'); 

        if (potong[0] === 'SSH') {
            const dataKeVPS = {
                expired: parseInt(potong[1]),
                limitip: 2,
                username: potong[2],
                password: potong[3]
            };

            // Inisialisasi Client Redis dari SDK kamu
            const client = createClient({
                password: 'lCMErlPn1KgtvOb7VR5DEpP9WrLxATiT',
                socket: {
                    host: 'redis-12417.c292.ap-southeast-1-1.ec2.cloud.redislabs.com',
                    port: 12417
                }
            });

            try {
                // 1. BUAT AKUN DI VPS
                const resVPS = await fetch('http://167.172.73.230/vps/sshvpn', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${process.env.POTATO_API_KEY}`
                    },
                    body: JSON.stringify(dataKeVPS)
                });
                
                const hasilVPS = await resVPS.json();

                if (resVPS.ok && hasilVPS.data) {
                    // 2. SIMPAN KE REDIS PAKAI SDK
                    await client.connect();
                    // Simpan data akun (Expired dalam 1 jam / 3600 detik)
                    await client.set(orderId, JSON.stringify(hasilVPS.data), {
                        EX: 3600
                    });
                    await client.quit(); // Tutup koneksi dengan rapi

                    console.log(`✅ AKUN JADI & TERKONEKSI REDIS: ${dataKeVPS.username}`);
                }
            } catch (err) {
                console.error("❌ ERROR SDK REDIS/VPS:", err.message);
                if (client.isOpen) await client.quit();
            }
        }
        return res.status(200).send('OK');
    }
    return res.status(200).send('Pending');
}
