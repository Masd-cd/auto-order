export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Hanya POST' });

    try {
        // Generate Username acak agar tidak bentrok (contoh: trial829)
        const randomID = Math.floor(100 + Math.random() * 900); 
        const userTrial = "trial" + randomID;

        // Data yang dikirim ke VPS (Sesuaikan dengan menu di screenshot Mas)
        const payload = {
            username: userTrial,
            password: "1",
            timelimit: "15m", // Sesuai instruksi Mas (m = menit)
            limitip: 2
        };

        const responseVPS = await fetch('http://167.172.73.230/vps/trialsshvpn', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.POTATO_API_KEY}`
            },
            body: JSON.stringify(payload) 
        });
        
        const hasilVPS = await responseVPS.json();

        if (responseVPS.ok && hasilVPS.data) {
            return res.status(200).json({ status: 'sukses', akun: hasilVPS.data });
        } else {
            // Menampilkan pesan error detail dari VPS jika ada
            const pesanError = hasilVPS.meta?.message || "VPS menolak pembuatan akun trial.";
            return res.status(400).json({ status: 'gagal', alasan: pesanError });
        }
    } catch (error) {
        return res.status(500).json({ status: 'error', alasan: "Koneksi ke VPS Terputus: " + error.message });
    }
}
