export default async function handler(req, res) {
  // Hanya benarkan POST request dari frontend
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Hanya kaedah POST dibenarkan' });
  }

  // Tarik API Key dari Environment Variable Vercel (100% Rahsia)
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API Key tiada dalam server Vercel! Sila set dalam Environment Variables.' });
  }

  const { action, payload } = req.body;
  let url = '';

  // Tentukan URL AI berdasarkan jenis tugasan yang dihantar dari frontend
  if (action === 'analyze') {
    url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
  } else if (action === 'imagen') {
    url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${apiKey}`;
  } else if (action === 'edit') {
    url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${apiKey}`;
  } else {
    return res.status(400).json({ error: 'Aksi tidak sah' });
  }

  try {
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
    return res.status(200).json(data);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}