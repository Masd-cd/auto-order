const { createClient } = require('redis');

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Hanya POST' });

    const { serverId } = req.body;
    
    // 1. TANGKAP IP ADDRESS PEMBELI
    let ipPembeli = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    // Jika IP-nya berbentuk list (karena proxy), ambil yang pertama
    if (ipPembeli.includes(',')) ipPembeli = ipPembeli.split(',')[0].trim();

    // 2. KONEKSI KE REDIS
    const client = createClient({
        password: 'lCMErlPn1KgtvOb7VR5DEpP9WrLxATiT', // Password Redis MasD
        socket: { host: 'redis-12417.c292.ap-southeast-1-1.ec2.cloud.redislabs.com', port: 12417 }
    });

    try {
        await client.connect();

        // 3. CEK APAKAH IP INI SUDAH BIKIN TRIAL HARI INI
        const sudahTrial = await client.get(`limit_trial_${ipPembeli}`);
        if (sudahTrial) {
            await client.quit();
            // Jika ketahuan sudah bikin, langsung tolak mentah-mentah!
            return res.status(400).json({ status: 'gagal', alasan: 'Limit Trial Habis! IP Anda sudah membuat trial hari ini. Silakan coba besok atau beli Premium.' });
        }

        // 4. LOGIKA PEMBUATAN AKUN VPS SEPERTI BIASA
        let vpsUrl = '';
        let fetchOptions = {};

        if (serverId === 'SGDO') {
            vpsUrl = 'http://167.172.73.230/vps/trialvlessall'; 
            fetchOptions = {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.POTATO_API_KEY}` },
                body: JSON.stringify({ timelimit: "15m" }) 
            };
        } 
        else if (serverId === 'IDTECH') {
            vpsUrl = 'https://www.agung-store.my.id/api/trialvless';
            fetchOptions = {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.AGUNG_API_KEY || '899e75f3d792d75954e05db23c76103809e084ebc0788a57a05f9d9dbe656aad' },
                body: JSON.stringify({ server: "MASDVPN" }) 
            };
        }

        if (!vpsUrl) {
            await client.quit();
            return res.status(400).json({ status: 'gagal', alasan: 'Server tidak dikenali' });
        }

        const responseVPS = await fetch(vpsUrl, fetchOptions);
        const textVPS = await responseVPS.text();
        
        try {
            const hasilVPS = JSON.parse(textVPS);
            if (responseVPS.ok) {
                // 5. JIKA VPS SUKSES BIKIN AKUN, KITA GEMBOK IP-NYA SELAMA 24 JAM!
                // EX: 86400 artinya data akan otomatis terhapus dalam 86400 detik (24 Jam)
                await client.set(`limit_trial_${ipPembeli}`, 'TERKUNCI', { EX: 86400 });
                await client.quit();
                
                let dataAkun = hasilVPS.data || hasilVPS;
                return res.status(200).json({ status: 'sukses', akun: dataAkun });
            } else {
                await client.quit();
                const pesanError = hasilVPS.meta?.message || hasilVPS.message || "Ditolak oleh VPS.";
                return res.status(400).json({ status: 'gagal', alasan: pesanError });
            }
        } catch(e) {
            await client.quit();
            return res.status(400).json({ status: 'gagal', alasan: "Respon aneh dari VPS" });
        }
    } catch (error) {
        if (client.isOpen) await client.quit();
        return res.status(500).json({ status: 'error', alasan: error.message });
    }
}
