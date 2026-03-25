const { createClient } = require('redis');

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Hanya POST' });
    const { serverId } = req.body;
    let ipPembeli = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    if (ipPembeli.includes(',')) ipPembeli = ipPembeli.split(',')[0].trim();

    const client = createClient({
        password: 'lCMErlPn1KgtvOb7VR5DEpP9WrLxATiT',
        socket: { host: 'redis-12417.c292.ap-southeast-1-1.ec2.cloud.redislabs.com', port: 12417 }
    });

    try {
        await client.connect();
        const sudahTrial = await client.get(`limit_trial_${ipPembeli}`);
        if (sudahTrial) {
            await client.quit();
            return res.status(400).json({ status: 'gagal', alasan: 'Limit Trial Habis! Anda sudah membuat trial hari ini.' });
        }

        let vpsUrl = '';
        let fetchOptions = {};

        if (serverId === 'SGDO') {
            vpsUrl = 'http://167.172.73.230/vps/trialsshvpn'; // Pastikan URL Potato SSH Trial
            fetchOptions = { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.POTATO_API_KEY}` }, body: JSON.stringify({ timelimit: "15m" }) };
        } else if (serverId === 'IDTECH') {
            vpsUrl = 'https://www.agung-store.my.id/api/trialssh'; // URL Agung SSH Trial
            fetchOptions = { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.AGUNG_API_KEY || '899e75f3d792d75954e05db23c76103809e084ebc0788a57a05f9d9dbe656aad' }, body: JSON.stringify({ server: "MASDVPN", minutes: 15 }) };
        }

        if (!vpsUrl) { await client.quit(); return res.status(400).json({ status: 'gagal', alasan: 'Server tidak dikenali' }); }

        const responseVPS = await fetch(vpsUrl, fetchOptions);
        const textVPS = await responseVPS.text();
        
        try {
            const hasilVPS = JSON.parse(textVPS);
            if (responseVPS.ok) {
                await client.set(`limit_trial_${ipPembeli}`, 'TERKUNCI', { EX: 86400 });
                await client.quit();
                return res.status(200).json({ status: 'sukses', akun: hasilVPS.data || hasilVPS });
            } else {
                await client.quit();
                return res.status(400).json({ status: 'gagal', alasan: hasilVPS.meta?.message || hasilVPS.message || "Ditolak VPS." });
            }
        } catch(e) { await client.quit(); return res.status(400).json({ status: 'gagal', alasan: "Respon aneh VPS" }); }
    } catch (error) {
        if (client.isOpen) await client.quit();
        return res.status(500).json({ status: 'error', alasan: error.message });
    }
}
