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

            try {
                // 1. BUAT AKUN DI VPS
                const responseVPS = await fetch('http://167.172.73.230/vps/sshvpn', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${process.env.POTATO_API_KEY}`
                    },
                    body: JSON.stringify(dataKeVPS)
                });
                
                const hasilVPS = await responseVPS.json();

                if (responseVPS.ok && hasilVPS.data) {
                    // 2. SIMPAN KE REDISLABS
                    const kvUrl = process.env.KV_REST_API_URL;
                    const kvToken = process.env.KV_REST_API_TOKEN;

                    // Mengirim perintah SET via REST API RedisLabs
                    await fetch(`${kvUrl}/SET/${orderId}`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${kvToken}` },
                        body: JSON.stringify(hasilVPS.data)
                    });
                    
                    // Set Expired 1 Jam
                    await fetch(`${kvUrl}/EXPIRE/${orderId}/3600`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${kvToken}` }
                    });

                    console.log(`✅ AKUN JADI & DISIMPAN: ${dataKeVPS.username}`);
                }
            } catch (err) {
                console.error("❌ ERROR:", err.message);
            }
        }
        return res.status(200).send('OK');
    }
    return res.status(200).send('Pending');
}
