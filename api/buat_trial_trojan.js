module.exports = async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Hanya POST' });

    const { serverId } = req.body;

    try {
        let vpsUrl = '';
        let fetchOptions = {};

        if (serverId === 'SGDO') {
            vpsUrl = 'http://167.172.73.230/vps/trialtrojanall'; 
            fetchOptions = {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.POTATO_API_KEY}` },
                body: JSON.stringify({ timelimit: "15m" }) 
            };
        } 
        else if (serverId === 'IDTECH') {
            vpsUrl = 'https://www.agung-store.my.id/api/trialtrojan';
            fetchOptions = {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.AGUNG_API_KEY || '899e75f3d792d75954e05db23c76103809e084ebc0788a57a05f9d9dbe656aad' },
                body: JSON.stringify({ server: "MASDVPN" }) 
            };
        }

        if (!vpsUrl) return res.status(400).json({ status: 'gagal', alasan: 'Server tidak dikenali' });

        const responseVPS = await fetch(vpsUrl, fetchOptions);
        const textVPS = await responseVPS.text();
        
        try {
            const hasilVPS = JSON.parse(textVPS);
            if (responseVPS.ok) {
                let dataAkun = hasilVPS.data || hasilVPS;
                return res.status(200).json({ status: 'sukses', akun: dataAkun });
            } else {
                const pesanError = hasilVPS.meta?.message || hasilVPS.message || "Ditolak oleh VPS.";
                return res.status(400).json({ status: 'gagal', alasan: pesanError });
            }
        } catch(e) {
            return res.status(400).json({ status: 'gagal', alasan: "Respon aneh: " + textVPS });
        }
    } catch (error) {
        return res.status(500).json({ status: 'error', alasan: error.message });
    }
}
