export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Hanya POST dibenarkan' });
  }

  // UBAH DI SINI: Kita ambil API Key yang dihantar dari Apps (pengguna)
  const { action, payload, apiKey } = req.body;

  if (!apiKey) {
    return res.status(400).json({ error: 'API Key tiada! Sila masukkan API Key Google anda di aplikasi.' });
  }

  let url = '';

  try {
    // Tentukan URL AI berdasarkan jenis tugasan yang dihantar dari frontend
    if (action === 'analyze') {
      url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    } else if (action === 'imagen') {
      url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image:generateContent?key=${apiKey}`;
    } else if (action === 'edit') {
      url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image:generateContent?key=${apiKey}`;
    } else {
      return res.status(400).json({ error: 'Aksi tidak sah' });
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: errText });
    }
    
    const data = await response.json();
    
    // Jika fungsi lukis gambar, kita perlu formatkan balik base64 supaya frontend faham
    if (action === 'imagen' || action === 'edit') {
      let base64Data = null;
      for (const candidate of data.candidates || []) {
         for (const part of candidate.content.parts || []) {
            if (part.inlineData) {
               base64Data = part.inlineData.data;
               break;
            }
         }
         if (base64Data) break;
      }
      
      if (!base64Data) throw new Error("Tiada imej dikembalikan dari Google.");
      
      if (action === 'imagen') {
        return res.status(200).json({ predictions: [{ bytesBase64Encoded: base64Data }] });
      } else {
         // return data asal untuk fungsi edit
        return res.status(200).json(data);
      }
    }

    // Untuk fungsi teks (analyze), pulangkan terus
    return res.status(200).json(data);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}