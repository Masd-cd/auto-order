import { createClient } from 'redis';

export default async function handler(req, res) {
    const { order_id } = req.query;
    if (!order_id) return res.status(400).json({ error: 'Order ID missing' });

    const client = createClient({
        password: 'lCMErlPn1KgtvOb7VR5DEpP9WrLxATiT',
        socket: {
            host: 'redis-12417.c292.ap-southeast-1-1.ec2.cloud.redislabs.com',
            port: 12417
        }
    });

    try {
        await client.connect();
        const data = await client.get(order_id);
        await client.quit();

        if (data) {
            return res.status(200).json({ 
                status: 'sukses', 
                akun: JSON.parse(data) 
            });
        }
        return res.status(200).json({ status: 'menunggu' });
    } catch (e) {
        if (client.isOpen) await client.quit();
        return res.status(500).json({ error: 'Gagal tarik data Redis' });
    }
}
