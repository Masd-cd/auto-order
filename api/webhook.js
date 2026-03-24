export default async function handler(req, res) {
    if (req.method === 'POST') {
        const dataPakasir = req.body;

        if (dataPakasir.status === 'completed') {
            const orderId = dataPakasir.order_id;
            console.log(`[PESANAN LUNAS] Order ID: ${orderId}`);

            // Mengecek apakah ini pesanan SSH
            if (orderId.startsWith('SSH-')) {
                // Membelah order_id (Misal "SSH-15-12345" dibelah jadi [SSH, 15, 12345])
                const potongString = orderId.split('-');
                const durasi = parseInt(potongString[1]); // Mengambil angka 15 atau 30

                // Membuat Username & Password Random (Misal: masd_7482)
                const randomAngka = Math.floor(1000 + Math.random() * 9000);
                const usernameBuatan = `masd_${randomAngka}`;
                const passwordBuatan = `pass${randomAngka}`;

                // Menyusun Data JSON sesuai permintaan API Potato
                const dataKeVPS = {
                    expired: durasi,
                    limitip: 2, // Bisa kamu ubah limit IP-nya
                    password: passwordBuatan,
                    username: usernameBuatan
                };

                // Mengambil API Key dari brankas Vercel
                const apiKey = process.env.POTATO_API_KEY; 

                try {
                    // Mengirim perintah ke VPS Singapore kamu
                    const responseVPS = await fetch('http://167.172.73.230:81/vps/sshvpn', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            // Format otorisasi standar (bisa disesuaikan jika API minta format lain)
                            'Authorization': `Bearer ${apiKey}` 
                        },
                        body: JSON.stringify(dataKeVPS)
                    });

                    const hasilVPS = await responseVPS.json();

                    if (responseVPS.ok) {
                        console.log("✅ SUKSES! Akun SSH berhasil dibuat di server.");
                        console.log("Detail Akun:", JSON.stringify(hasilVPS.data));
                        
                        // CATATAN:
                        // Data JSON akun sudah siap. Nanti ini bisa kita lempar
                        // ke script Bot WhatsApp kamu biar otomatis dikirim ke nomor pembeli!
                        
                    } else {
                        console.error("❌ GAGAL DARI VPS:", hasilVPS);
                    }
                } catch (error) {
                    console.error("❌ ERROR KONEKSI KE VPS:", error);
                }
            }
            
            return res.status(200).json({ message: 'Webhook selesai diproses' });
        }
        return res.status(200).json({ message: 'Pembayaran belum selesai' });
    }
    return res.status(405).json({ message: 'Hanya menerima request POST' });
}
