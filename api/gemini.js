export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Hanya POST dibenarkan' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API Key tiada dalam sistem backend!' });
  }

  const { action, payload } = req.body;

  try {
    // ==========================================
    // 1. OTAK TEKS: GUNA GOOGLE GEMINI (Bijak Karang Cerita)
    // ==========================================
    if (action === 'analyze') {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error(await response.text());
      return res.status(200).json(await response.json());
    } 
    
    // ==========================================
    // 2. TUKANG LUKIS: GUNA ENJIN AI TERBUKA PERCUMA
    // (Bypass sekatan Google, Tiada Limit Kuota Imej!)
    // ==========================================
    else if (action === 'imagen') {
      const prompt = payload.instances.prompt;
      // Panggil AI Pelukis Percuma (gaya Pixar)
      const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt + ", 3D Pixar style, highly detailed, beautiful lighting")}?width=1024&height=1024&nologo=true`;
      
      const imgRes = await fetch(imageUrl);
      if (!imgRes.ok) throw new Error("Gagal menjana gambar dari AI Pelukis");
      
      // Tukar gambar jadi format yang difahami oleh frontend Vercel kita
      const arrayBuffer = await imgRes.arrayBuffer();
      const base64Data = Buffer.from(arrayBuffer).toString('base64');
      
      // Hantar balik ke apps Abang ND
      return res.status(200).json({ predictions: [{ bytesBase64Encoded: base64Data }] });
    }
    
    // ==========================================
    // 3. EDIT GAMBAR (Bypass Google juga)
    // ==========================================
    else if (action === 'edit') {
      const promptText = payload.contents[0].parts[0].text;
      const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(promptText + ", 3D Pixar style, highly detailed")}?width=1024&height=1024&nologo=true`;
      
      const imgRes = await fetch(imageUrl);
      if (!imgRes.ok) throw new Error("Gagal mengedit gambar");
      
      const arrayBuffer = await imgRes.arrayBuffer();
      const base64Data = Buffer.from(arrayBuffer).toString('base64');
      
      return res.status(200).json({
        candidates: [{ content: { parts: [{ inlineData: { data: base64Data } }] } }]
      });
    }
    
    else {
      return res.status(400).json({ error: 'Aksi tidak sah' });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}