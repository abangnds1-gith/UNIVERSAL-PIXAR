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
    // 1. OTAK TEKS: Guna Gemini 2.5 Flash untuk analisis & cerita
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
    
    // 2. TUKANG LUKIS: Guna model Google TERKINI (Gemini 3.1 Flash Image)
    else if (action === 'imagen') {
      const promptText = payload.instances.prompt;
      
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image:generateContent?key=${apiKey}`;
      
      // Format payload untuk model gemini-3.1-flash-image
      const newPayload = {
        contents: [
          {
            parts: [
              { text: promptText }
            ]
          }
        ]
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPayload)
      });
      
      if (!response.ok) throw new Error(await response.text());
      const data = await response.json();
      
      // Cari data imej (base64) dari response
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
      
      // Format balik supaya frontend kita faham
      return res.status(200).json({ predictions: [{ bytesBase64Encoded: base64Data }] });
    }
    
    // 3. EDIT GAMBAR (Image-to-Image)
    else if (action === 'edit') {
       // Kita guna model yang sama untuk edit gambar (perlu lulus payload dari frontend)
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) throw new Error(await response.text());
      return res.status(200).json(await response.json());
    }
    
    else {
      return res.status(400).json({ error: 'Aksi tidak sah' });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}