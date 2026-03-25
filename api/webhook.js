const { createClient } = require('redis');

// Fungsi manual pembuat UUID yang 100% aman di Vercel
function buatUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    const dataPakasir = req.body;
    if (dataPakasir.status === 'completed') {
        const orderId = dataPakasir.order_id;
        const potong = orderId.split('-'); 
        const protokol = potong[0]; 

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
            const password = potong[4]; 

            // ==========================================
            // LOGIKA 1: SSH
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
            // LOGIKA 2: VMESS
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
                            kuota: 300, 
                            limitip: 2,
                            username: username,
                            uuidv2: buatUUID()
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
                            quota: 300, 
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
                    vpsUrl = 'http://167.172.73.230/vps/vlessall';
                    fetchOptions = {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.POTATO_API_KEY}` },
                        body: JSON.stringify({ expired: durasi, kuota: 300, limitip: 2, username: username, uuidv2: buatUUID() })
                    };
                } else if (serverDipilih === 'IDTECH') {
                    vpsUrl = 'https://www.agung-store.my.id/api/addvless';
                    fetchOptions = {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.AGUNG_API_KEY || '899e75f3d792d75954e05db23c76103809e084ebc0788a57a05f9d9dbe656aad' },
                        body: JSON.stringify({ server: "MASDVPN", username: username, quota: 300, ipLimit: 2, days: durasi })
                    };
                }
            }
            // ==========================================
            // LOGIKA 4: TROJAN
            // ==========================================
            else if (protokol === 'TROJAN') {
                if (serverDipilih === 'SGDO') {
                    vpsUrl = 'http://167.172.73.230/vps/trojanall'; // Asumsi Potato API untuk Trojan
                    fetchOptions = {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.POTATO_API_KEY}` },
                        body: JSON.stringify({ expired: durasi, kuota: 300, limitip: 2, username: username, uuidv2: buatUUID() })
                    };
                } else if (serverDipilih === 'IDTECH') {
                    vpsUrl = 'https://www.agung-store.my.id/api/addtrojan'; // Asumsi Agung API
                    fetchOptions = {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.AGUNG_API_KEY || '899e75f3d792d75954e05db23c76103809e084ebc0788a57a05f9d9dbe656aad' },
                        body: JSON.stringify({ server: "MASDVPN", username: username, quota: 300, ipLimit: 2, days: durasi })
                    };
                }
            }

            if (!vpsUrl) {
                console.error("❌ URL VPS Kosong");
                return res.status(200).send('OK'); 
            }

            const resVPS = await fetch(vpsUrl, fetchOptions);
            const teksHasil = await resVPS.text(); 
            
            try {
                const hasilVPS = JSON.parse(teksHasil);
                let dataDisimpan = hasilVPS.data || hasilVPS;

                if (resVPS.ok) {
                    await client.connect();
                    await client.set(orderId, JSON.stringify(dataDisimpan), { EX: 3600 });
                    await client.quit();
                    console.log(`✅ Sukses: ${protokol} - ${username}`);
                } else {
                    console.error("❌ VPS Menolak:", hasilVPS);
                }
            } catch(e) {
                console.error("❌ Balasan VPS bukan JSON:", teksHasil);
            }

        } catch (err) {
            if (client.isOpen) await client.quit();
            console.error("❌ Gagal Webhook:", err.message);
        }
        return res.status(200).send('OK');
    }
    return res.status(200).send('Pending');
};
