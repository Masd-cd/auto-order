import { createClient } from 'redis';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    const dataPakasir = req.body;
    if (dataPakasir.status === 'completed') {
        const orderId = dataPakasir.order_id;
        const potong = orderId.split('-'); 

        // potong[0] = SSH, potong[1] = SGDO / IDTECH, potong[2] = Durasi
        if (potong[0] === 'SSH') {
            const serverDipilih = potong[1];
            const dataKeVPS = {
                expired: parseInt(potong[2]),
                limitip: 2,
                username: potong[3],
                password: potong[4]
            };

            let vpsUrl = '';
            // Pengecekan nama server yang SUDAH TANPA STRIP
            if (serverDipilih === 'SGDO') {
                vpsUrl = 'http://167.172.73.230/vps/sshvpn';
            } else if (serverDipilih === 'IDTECH') {
                // Masukkan IP VPS Indonesia kamu di sini nanti
                vpsUrl = 'http://IP-VPS-INDONESIA-KAMU/vps/sshvpn';
            }

            // Jika URL masih kosong (tidak cocok keduanya), batalkan eksekusi
            if (!vpsUrl) {
                console.error("❌ URL VPS Kosong, Server tidak dikenali:", serverDipilih);
                return res.status(200).send('OK'); 
            }

            const client = createClient({
                password: 'lCMErlPn1KgtvOb7VR5DEpP9WrLxATiT',
                socket: { host: 'redis-12417.c292.ap-southeast-1-1.ec2.cloud.redislabs.com', port: 12417 }
            });

            try {
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
                    await client.connect();
                    await client.set(orderId, JSON.stringify(hasilVPS.data), { EX: 3600 });
                    await client.quit();
                    console.log(`✅ Akun Premium Aktif: ${dataKeVPS.username} di Server ${serverDipilih}`);
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
