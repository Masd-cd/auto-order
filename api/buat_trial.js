export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Hanya POST' });

    try {
        const responseVPS = await fetch('http://167.172.73.230/vps/trialsshvpn', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.POTATO_API_KEY}`
            },
            // Tambahkan limitip: 2 buat jaga-jaga VPS menolak karena tidak ada limit
            body: JSON.stringify({ timelimit: "15", limitip: 2 }) 
        });
        
        // Ambil balasan mentah dari VPS
        const textVPS = await responseVPS.text();
        
        try {
            const hasilVPS = JSON.parse(textVPS);
            if (responseVPS.ok && hasilVPS.data) {
                return res.status(200).json({ status: 'sukses', akun: hasilVPS.data });
            } else {
                // Tampilkan alasan penolakan dari VPS
                return res.status(400).json({ 
                    status: 'gagal', 
                    alasan: hasilVPS.meta?.message || "VPS menolak tanpa alasan jelas." 
                });
            }
        } catch(e) {
            return res.status(400).json({ status: 'gagal', alasan: "Respon VPS aneh: " + textVPS });
        }
    } catch (error) {
        return res.status(500).json({ status: 'error', alasan: error.message });
    }
}
