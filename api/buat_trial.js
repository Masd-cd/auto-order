export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Hanya menerima POST' });

    const { serverId } = req.body;

    try {
        // Tembak API Trial VPS SG
        const responseVPS = await fetch('http://167.172.73.230/vps/trialsshvpn', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.POTATO_API_KEY}`
            },
            body: JSON.stringify({ timelimit: "15" }) // Set trial 15 menit
        });
        
        const hasilVPS = await responseVPS.json();

        // Jika VPS merespon dengan data akun
        if (responseVPS.ok && hasilVPS.data) {
            return res.status(200).json({ status: 'sukses', akun: hasilVPS.data });
        } else {
            return res.status(400).json({ error: 'VPS menolak permintaan trial' });
        }
    } catch (error) {
        console.error("❌ Error API Trial:", error.message);
        return res.status(500).json({ error: 'Gagal terhubung ke server' });
    }
}
