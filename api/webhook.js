import { createClient } from 'redis';
import crypto from 'crypto'; // Fitur bawaan Node.js untuk membuat UUID acak

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    const dataPakasir = req.body;
    if (dataPakasir.status === 'completed') {
        const orderId = dataPakasir.order_id;
        const potong = orderId.split('-'); 
        const protokol = potong[0]; // Ini akan mendeteksi apakah SSH atau VMESS

        const client = createClient({
            password: 'lCMErlPn1KgtvOb7VR5DEpP9WrLxATiT',
            socket: { host: 'redis-12417.c292.ap-southeast-1-1.ec2.cloud.redislabs.com', port: 12417 }
        });

        try {
            let vpsUrl = '';
            let fetchOptions = {};
            const serverDipilih = potong[1];
            const durasi = parseInt(potong[2]);
            const username = potong[3];
            const password = potong[4]; // Hanya kepakai untuk SSH, VMess biasanya gak butuh

            // ==========================================
            // LOGIKA 1: JIKA YANG DIBELI ADALAH SSH
            // ==========================================
            if (protokol === 'SSH') {
                if (serverDipilih === 'SGDO') {
                    vpsUrl = 'http://167.172.73.230/vps/sshvpn';
                    fetchOptions = {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${process.env.POTATO_API_KEY}`
                        },
                        body: JSON.stringify({ expired: durasi, limitip: 2, username, password })
                    };
                } else if (serverDipilih === 'IDTECH') {
                    vpsUrl = 'https://www.agung-store.my.id/api/addssh';
                    fetchOptions = {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-api-key': process.env.AGUNG_API_KEY || '899e75f3d792d75954e05db23c76103809e084ebc0788a57a05f9d9dbe656aad'
                        },
                        body: JSON.stringify({ server: "MASDVPN", username, password, ipLimit: 2, days: durasi })
                    };
                }
            } 
            // ==========================================
            // LOGIKA 2: JIKA YANG DIBELI ADALAH VMESS
            // ==========================================
            else if (protokol === 'VMESS') {
                if (serverDipilih === 'SGDO') {
                    vpsUrl = 'http://167.172.73.230/vps/vmessall';
                    fetchOptions = {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${process.env.POTATO_API_KEY}`
                        },
                        body: JSON.stringify({
                            expired: durasi,
                            kuota: 300, // Asumsi 0 adalah unlimited
                            limitip: 2,
                            username: username,
                            uuidv2: crypto.randomUUID() // Buat UUID otomatis
                        })
                    };
                } else if (serverDipilih === 'IDTECH') {
                    vpsUrl = 'https://www.agung-store.my.id/api/addvmess';
                    fetchOptions = {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-api-key': process.env.AGUNG_API_KEY || '899e75f3d792d75954e05db23c76103809e084ebc0788a57a05f9d9dbe656aad'
                        },
                        body: JSON.stringify({
                            server: "MASDVPN",
                            username: username,
                            quota: 300, // Aku set 0 untuk unlimited (sesuaikan jika harus ada angka)
                            ipLimit: 2,
                            days: durasi
                        })
                    };
                }
            }
                        // ==========================================
            // LOGIKA 3: VLESS
            // ==========================================
            else if (protokol === 'VLESS') {
                if (serverDipilih === 'SGDO') {
                    vpsUrl = 'http://167.172.73.230/vps/vlessall'; // Asumsi Potato API
                    fetchOptions = {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.POTATO_API_KEY}` },
                        body: JSON.stringify({ expired: durasi, kuota: 300, limitip: 2, username: username, uuidv2: buatUUID() })
                    };
                } else if (serverDipilih === 'IDTECH') {
                    vpsUrl = 'https://www.agung-store.my.id/api/addvless'; // Asumsi Agung API
                    fetchOptions = {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.AGUNG_API_KEY },
                        body: JSON.stringify({ server: "MASDVPN", username: username, quota: 300, ipLimit: 2, days: durasi })
                    };
                }
            }
            

            if (!vpsUrl) {
                console.error("❌ URL VPS Kosong, Protokol/Server tidak dikenali:", protokol, serverDipilih);
                return res.status(200).send('OK'); 
            }

            // TEMBAK KE VPS DAN SIMPAN KE REDIS
            const resVPS = await fetch(vpsUrl, fetchOptions);
            const hasilVPS = await resVPS.json();
            let dataDisimpan = hasilVPS.data || hasilVPS;

            if (resVPS.ok) {
                await client.connect();
                await client.set(orderId, JSON.stringify(dataDisimpan), { EX: 3600 });
                await client.quit();
                console.log(`✅ Akun Premium Aktif: ${protokol} - ${username} di Server ${serverDipilih}`);
            }
        } catch (err) {
            if (client.isOpen) await client.quit();
            console.error("❌ Gagal Webhook:", err.message);
        }
        return res.status(200).send('OK');
    }
    return res.status(200).send('Pending');
}
