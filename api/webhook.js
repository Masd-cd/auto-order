import { createClient } from 'redis';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    const dataPakasir = req.body;
    if (dataPakasir.status === 'completed') {
        const orderId = dataPakasir.order_id;
        const potong = orderId.split('-'); 

        if (potong[0] === 'SSH') {
            const serverDipilih = potong[1];
            const durasi = parseInt(potong[2]);
            const username = potong[3];
            const password = potong[4];

            let vpsUrl = '';
            let fetchOptions = {};

            // LOGIKA 1: JIKA SERVER SINGAPORE (POTATO API)
            if (serverDipilih === 'SGDO') {
                vpsUrl = 'http://167.172.73.230/vps/sshvpn';
                fetchOptions = {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${process.env.POTATO_API_KEY}`
                    },
                    body: JSON.stringify({
                        expired: durasi,
                        limitip: 2,
                        username: username,
                        password: password
                    })
                };
            } 
            // LOGIKA 2: JIKA SERVER INDONESIA (AGUNG API)
            else if (serverDipilih === 'IDTECH') {
                vpsUrl = 'https://www.agung-store.my.id/api/addssh';
                fetchOptions = {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': process.env.AGUNG_API_KEY || '899e75f3d792d75954e05db23c76103809e084ebc0788a57a05f9d9dbe656aad'
                    },
                    body: JSON.stringify({
                        server: "id.masdvpnstore.web.id", // Catatan: Ganti jika nama server di panelmu bukan WIJAYA
                        username: username,
                        password: password,
                        ipLimit: 2,
                        days: durasi
                    })
                };
            }

            if (!vpsUrl) {
                console.error("❌ URL VPS Kosong, Server tidak dikenali:", serverDipilih);
                return res.status(200).send('OK'); 
            }

            const client = createClient({
                password: 'lCMErlPn1KgtvOb7VR5DEpP9WrLxATiT',
                socket: { host: 'redis-12417.c292.ap-southeast-1-1.ec2.cloud.redislabs.com', port: 12417 }
            });

            try {
                const resVPS = await fetch(vpsUrl, fetchOptions);
                const hasilVPS = await resVPS.json();

                // Antisipasi perbedaan format output Potato dan Agung
                let dataDisimpan = hasilVPS.data || hasilVPS;

                if (resVPS.ok) {
                    await client.connect();
                    await client.set(orderId, JSON.stringify(dataDisimpan), { EX: 3600 });
                    await client.quit();
                    console.log(`✅ Akun Premium Aktif: ${username} di Server ${serverDipilih}`);
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
