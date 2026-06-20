import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, Copy, Check, Loader2, Download, RefreshCw, AlertTriangle, Sparkles, ScanLine, FileWarning, UserCheck, Edit3, PlayCircle, Square, Wand2, Lock, Key, ArrowRight, KeyRound, BookOpen } from 'lucide-react';

export default function App() {
  // --- STATE UNTUK PAYWALL / GATEKEEPER --- //
  const [hasAccess, setHasAccess] = useState(false);
  const [showUnlockInput, setShowUnlockInput] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [passcodeError, setPasscodeError] = useState("");
  const CORRECT_PASSCODE = "2905"; 

  // --- STATE UNTUK API KEY PENGGUNA (BYOK) --- //
  const [userApiKey, setUserApiKey] = useState(localStorage.getItem('geminiUserApiKey') || "");
  const [isApiSetup, setIsApiSetup] = useState(!!localStorage.getItem('geminiUserApiKey'));

  // --- STATE UNTUK APLIKASI UTAMA --- //
  const [uploadedImages, setUploadedImages] = useState([]); 
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isUpdatingCharacter, setIsUpdatingCharacter] = useState(false);
  const [analyzedData, setAnalyzedData] = useState(null);
  const [storyboard, setStoryboard] = useState([]);
  const [editedCharacter, setEditedCharacter] = useState("");
  const [error, setError] = useState('');
  const [copiedStates, setCopiedStates] = useState({});
  const [playingAudioIndex, setPlayingAudioIndex] = useState(null);
  const [selectedVisualStyle, setSelectedVisualStyle] = useState("hologram");
  const fileInputRef = useRef(null);

  const visualStyles = [
    { id: "hologram", name: "Hologram Futuristik", desc: "Watak memancarkan skrin hologram 3D bercahaya." },
    { id: "xray", name: "Visi X-Ray (Imbasan Dalaman)", desc: "Imbasan cahaya menembusi kulit/permukaan mendedahkan masalah dalaman." },
    { id: "mikroskopik", name: "Dunia Mikroskopik (Lawan Raksasa)", desc: "Kamera zoom jauh ke dalam. Kuman/masalah jadi raksasa kecil yang dilawan watak." },
    { id: "elemen", name: "Kuasa Elemen Alam", desc: "Watak guna kuasa air, ais, atau magik cahaya menyelesaikan masalah." },
    { id: "fantasi", name: "Magik Fantasi (Debu Pari-Pari)", desc: "Transformasi pantas menggunakan debu emas atau kilauan bersinar." },
    { id: "gaming", name: "Antaramuka Gaming (HUD & Level Up)", desc: "Muncul Health Bar, teks 'LEVEL UP' terapung, dan bunyi arcade." },
    { id: "pembinaan", name: "Pembinaan Pantas (Fast-Forward)", desc: "Robot mini/sel pantas menyusun sel-sel rosak atau menumbuhkan sesuatu." }
  ];

  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleUnlock = () => {
    if (passcode === CORRECT_PASSCODE) {
      setHasAccess(true);
      setPasscodeError("");
    } else {
      setPasscodeError("Kod rahsia tidak sah. Sila hubungi Admin.");
    }
  };

  const processAndResizeImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 1024; 
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; }
          } else {
            if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85); 
          resolve({ base64: dataUrl.split(',')[1], mimeType: 'image/jpeg', dataUrl });
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (uploadedImages.length + files.length > 5) {
      setError("Maksimum 5 gambar sahaja dibenarkan.");
      return;
    }

    try {
      const processedImages = await Promise.all(files.map(processAndResizeImage));
      setUploadedImages(prev => [...prev, ...processedImages]);
      setError('');
    } catch (err) {
      setError("Gagal memproses gambar. Sila cuba gambar lain.");
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (index) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleCopy = (text, id) => {
    document.execCommand('copy'); 
    navigator.clipboard.writeText(text).catch(() => {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    });
    
    setCopiedStates({ ...copiedStates, [id]: true });
    setTimeout(() => { setCopiedStates({ ...copiedStates, [id]: false }); }, 2000);
  };

  const downloadImage = (dataUrl, filename) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePlayVoiceover = (text, index) => {
    if (!window.speechSynthesis) {
      setError("Pelayar anda tidak menyokong fungsi Text-to-Speech.");
      return;
    }

    if (playingAudioIndex === index) {
      window.speechSynthesis.cancel();
      setPlayingAudioIndex(null);
      return;
    }

    window.speechSynthesis.cancel();
    setPlayingAudioIndex(index);

    let dialogToRead = "Tiada dialog dijumpai.";
    const dialogMatch = text.match(/🗣️\s*Dialog.*?:\s*"(.*?)"/s) || text.match(/Dialog.*?:\s*"(.*?)"/s);
    
    if (dialogMatch && dialogMatch[1]) {
      dialogToRead = dialogMatch[1];
    } else {
      const fallbackMatch = text.split(/🗣️\s*Dialog.*?:|Dialog.*?:/);
      if (fallbackMatch.length > 1) {
        dialogToRead = fallbackMatch[1].replace(/["']/g, '').trim();
      }
    }

    const utterance = new SpeechSynthesisUtterance(dialogToRead);
    utterance.lang = 'ms-MY'; 
    utterance.rate = 1.0; 
    utterance.pitch = 1.0; 

    const voices = window.speechSynthesis.getVoices();
    const msVoice = voices.find(voice => voice.lang.includes('ms') || voice.lang.includes('id'));
    if (msVoice) { utterance.voice = msVoice; }

    utterance.onend = () => setPlayingAudioIndex(null);
    utterance.onerror = () => setPlayingAudioIndex(null);

    window.speechSynthesis.speak(utterance);
  };

  // --- FUNGSI PANGGIL BACKEND VERCEL --- //
  const fetchFromBackend = async (action, payload) => {
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // UBAH DI SINI: Hantar userApiKey sekali ke backend
      body: JSON.stringify({ action, payload, apiKey: userApiKey })
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Ralat Server Backend: ${response.status}`);
    }
    return await response.json();
  };

  const generateImageForScene = async (sceneIndex, imagePrompt, isScene1, isScene5) => {
    setStoryboard(prev => prev.map((scene, i) => 
      i === sceneIndex ? { ...scene, isGeneratingImage: true, imageError: false, errorMessage: '' } : scene
    ));

    try {
      let result;
      let base64Data = null;

      if (uploadedImages.length > 0 && !isScene1) {
        const specificInstruction = isScene5 
          ? "PENTING BABAK 5: Tampilkan juga PRODUK ASLI (tanpa mata/tangan animasi) yang diekstrak bersih dari latar belakang lamanya, diletakkan bersebelahan dengan karakter produk Pixar dan karakter manusia."
          : "Ubah produk yang diekstrak ini menjadi karakter hidup dengan menambahkan mata besar ala Pixar dan kaki/tangan kecil yang menyatu dengan tubuh produk.";
          
        const promptPayload = `Tugas manipulasi foto (Image-to-Image). INSTRUKSI SANGAT KETAT: 
        1. HAPUS DAN ABAIKAN 100% latar belakang (background) asli, teks di luar produk, bayangan, atau logo eksternal dari gambar referensi. HANYA AMBIL PRODUKNYA SAJA!
        2. Pertahankan 100% bentuk, label kemasan, tulisan di produk, warna, dan corak asli produk tersebut. Jangan ubah tulisan di badan produk.
        3. ${specificInstruction} 
        4. Letakkan produk yang sudah dibersihkan ini ke dalam Latar Belakang (Background) BARU berikut (Serta pastikan watak manusia yang digambarkan di sini tepat rupa parasnya): ${imagePrompt}. 
        5. Gunakan pencahayaan sinematik Unreal Engine 5.`;
        
        const payload = {
          contents: [{
            parts: [
              { text: promptPayload },
              { inlineData: { mimeType: uploadedImages[0].mimeType, data: uploadedImages[0].base64 } }
            ]
          }],
          generationConfig: { responseModalities: ['TEXT', 'IMAGE'] }
        };

        // PANGGIL BACKEND
        result = await fetchFromBackend('edit', payload);
        base64Data = result.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
      } else {
        const scene1Instruction = isScene1 ? "Tugasan: Jana imej 3D Pixar berkualiti tinggi. PENTING: JANGAN tunjukkan produk jenama sebenar. Jika ada produk dalam gambar ini, ia MESTILAH produk generik, tidak berjenama, atau produk pesaing yang nampak murah dan gagal. " : "";
        
        // PENTING: Untuk gemini-3.1-flash-image, struktur prompt berbeza sikit dari Imagen
        const payload = {
          contents: [{ parts: [{ text: scene1Instruction + imagePrompt }] }]
        };

        // PANGGIL BACKEND
        result = await fetchFromBackend('imagen', payload);
        base64Data = result.predictions?.[0]?.bytesBase64Encoded;
      }
      
      if (!base64Data) throw new Error("Tiada data imej dipulangkan oleh pelayan.");
      const imageUrl = `data:image/jpeg;base64,${base64Data}`;

      setStoryboard(prev => prev.map((scene, i) => 
        i === sceneIndex ? { ...scene, generatedImage: imageUrl, isGeneratingImage: false } : scene
      ));

    } catch (err) {
      console.error("Ralat penjanaan imej:", err);
      setStoryboard(prev => prev.map((scene, i) => 
        i === sceneIndex ? { ...scene, isGeneratingImage: false, imageError: true, errorMessage: err.message } : scene
      ));
    }
  };

  const getVisualDescription = () => {
    const style = visualStyles.find(s => s.id === selectedVisualStyle);
    return style ? style.desc : visualStyles[0].desc;
  };

  const handleAnalyzeAndGenerate = async () => {
    if (uploadedImages.length === 0) {
      setError("Sila muat naik sekurang-kurangnya 1 gambar produk terlebih dahulu.");
      return;
    }

    setIsAnalyzing(true);
    setError('');
    setAnalyzedData(null);
    setStoryboard([]);
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setPlayingAudioIndex(null);

    const imageParts = uploadedImages.map(img => ({
      inlineData: { mimeType: img.mimeType, data: img.base64 }
    }));

    const visualRule = getVisualDescription();

    try {
      const payload = {
        contents: [{
          parts: [
            { text: `Kaji gambar produk ini secara terperinci.
Langkah 1: Kenal pasti Nama Produk, Kategori, Masalah Pelanggan (Pain Points), Kelebihan Utama, dan cipta SATU profil watak manusia berdasarkan logik kegunaan produk.
Langkah 2: Hasilkan 5 babak (scene) storyboard.

KONSISTENSI WATAK MANUSIA (SANGAT PENTING): 
Cipta ciri-cirinya dengan jelas di dalam 'humanCharacterDescription'. Jika produk sesuai untuk lelaki atau uniseks, utamakan watak lelaki. MESTI ulang deskripsi TEPAT ini ke dalam 'imagePrompt' dan 'combinedVideoPrompt' untuk babak yang memaparkan manusia ini.

ARAHAN KHUSUS SETIAP BABAK:
Babak 1: 3-Second Hook (Masalah/Agitasi). WAJIB UNTUK BABAK 1: DILARANG menggunakan watak produk sebenar yang di-upload. Jika scene ini memaparkan masalah produk, gunakan watak Pixar dari "produk generik / produk jenama lain" yang sedang rosak atau gagal. JANGAN sebut nama produk sebenar di dalam 'imagePrompt' Babak 1.
Babak 2 hingga 4: Mekanisme penyelesaian. Produk sebenar muncul di sini sebagai wira Pixar. WAJIB UNTUK BABAK 2-4: Terapkan gaya visual ini -> "${visualRule}" ketika watak produk menyelesaikan masalah pelanggan.
Babak 5: Kejayaan. WAJIB UNTUK BABAK 5: Memaparkan Watak Manusia Pixar + Watak Produk Pixar + PRODUK REAL secara serentak.

PENTING: JANGAN gunakan atau sebut sebarang harga, diskaun, atau promosi murahan. Elakkan overclaim untuk produk kesihatan.
SYARAT WAJIB BAHASA & DURASI AUDIO (SANGAT PENTING): 
Dialog MESTI ditulis seperti format ini: 🗣️ Dialog: "Teks dialog di sini". 
Gunakan 100% Bahasa Melayu gaya sempoi.
DURASI: Dialog bagi SETIAP babak MESTI cukup panjang untuk menampung durasi bacaan audio selama 8 hingga 10 saat. Oleh itu, WAJIB tulis dialog sekurang-kurangnya 20 hingga 35 patah perkataan untuk setiap babak. Jangan buat dialog pendek!` },
            ...imageParts
          ]
        }],
        generationConfig: { 
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              analysis: {
                type: "OBJECT",
                properties: {
                  productName: { type: "STRING" },
                  category: { type: "STRING" },
                  painPoints: { type: "STRING" },
                  benefits: { type: "STRING" },
                  humanCharacterDescription: { type: "STRING" }
                }
              },
              scenes: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    sceneNumber: { type: "NUMBER" },
                    title: { type: "STRING" },
                    imagePrompt: { type: "STRING" },
                    combinedVideoPrompt: { type: "STRING" }
                  }
                }
              }
            }
          }
        }
      };

      // PANGGIL BACKEND
      const result = await fetchFromBackend('analyze', payload);

      let textResponse = result.candidates?.[0]?.content?.parts?.[0]?.text;
      textResponse = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
      let parsedData = JSON.parse(textResponse);
      
      setAnalyzedData(parsedData.analysis);
      setEditedCharacter(parsedData.analysis.humanCharacterDescription || "Tiada watak manusia spesifik.");

      const initializedStoryboard = parsedData.scenes.map(scene => ({
        ...scene,
        generatedImage: null,
        isGeneratingImage: false,
        imageError: false,
        errorMessage: '',
        isRegeneratingPrompt: false
      }));

      setStoryboard(initializedStoryboard);
      setIsAnalyzing(false);

      initializedStoryboard.forEach((scene, index) => {
        generateImageForScene(index, scene.imagePrompt, scene.sceneNumber === 1, scene.sceneNumber === 5);
      });

    } catch (err) {
      console.error(err);
      setError(`Ralat: ${err.message || "Gagal menganalisis gambar. Sila cuba lagi."}`);
      setIsAnalyzing(false);
    }
  };

  const regenerateScenePrompt = async (sceneIndex) => {
    const sceneToUpdate = storyboard[sceneIndex];
    
    setStoryboard(prev => prev.map((scene, i) => 
      i === sceneIndex ? { ...scene, isRegeneratingPrompt: true } : scene
    ));

    const visualRule = getVisualDescription();
    const extraRule = sceneToUpdate.sceneNumber === 1
      ? "WAJIB BABAK 1: DILARANG menggunakan watak produk sebenar. Jika ada produk bermasalah, ia mestilah produk generik/pesaing. JANGAN sebut nama produk sebenar dalam deskripsi visual."
      : sceneToUpdate.sceneNumber === 5 
      ? "WAJIB BABAK 5: Aksi mesti menunjukkan Watak Produk Pixar, Watak Manusia Pixar, DAN Produk Real (sebenar) serentak." 
      : (sceneToUpdate.sceneNumber >= 2 && sceneToUpdate.sceneNumber <= 4)
      ? `WAJIB BABAK 2-4: Terapkan elemen visual ini semasa menerangkan penyelesaian masalah -> "${visualRule}"`
      : "";

    const userPrompt = `
      Produk: ${analyzedData?.productName}
      Profil Watak Manusia TERKINI: ${editedCharacter}
      Tajuk Babak (${sceneToUpdate.sceneNumber}): ${sceneToUpdate.title}
      
      Tugasan: Jana semula "combinedVideoPrompt" untuk babak ini. 
      ${extraRule}
      PENTING: Pastikan deskripsi visual pergerakan watak manusia menepati Profil Watak Manusia TERKINI. JANGAN masukkan elemen harga/diskaun.
      SYARAT WAJIB BAHASA & DURASI: Dialog MESTI 100% dalam Bahasa Melayu gaya sempoi, menggunakan format 🗣️ Dialog: "teks disini". Dialog WAJIB panjang (sekurang-kurangnya 20 hingga 35 patah perkataan) supaya cukup untuk durasi audio 8 saat. JANGAN BUAT DIALOG PENDEK.
    `;

    try {
      const payload = {
        contents: [{ parts: [{ text: userPrompt }] }],
        generationConfig: { 
          responseMimeType: "application/json",
          responseSchema: { type: "OBJECT", properties: { combinedVideoPrompt: { type: "STRING" } } }
        }
      };

      // PANGGIL BACKEND
      const result = await fetchFromBackend('analyze', payload);

      let textResponse = result.candidates?.[0]?.content?.parts?.[0]?.text;
      textResponse = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsedData = JSON.parse(textResponse);

      setStoryboard(prev => prev.map((scene, i) => 
        i === sceneIndex ? { ...scene, combinedVideoPrompt: parsedData.combinedVideoPrompt, isRegeneratingPrompt: false } : scene
      ));
      
      if (playingAudioIndex === sceneIndex) {
         window.speechSynthesis.cancel();
         setPlayingAudioIndex(null);
      }

    } catch (err) {
      console.error(err);
      setStoryboard(prev => prev.map((scene, i) => 
        i === sceneIndex ? { ...scene, isRegeneratingPrompt: false } : scene
      ));
    }
  };

  const handleUpdateGlobalCharacter = async () => {
    if (!editedCharacter.trim()) return;
    setIsUpdatingCharacter(true);

    const visualRule = getVisualDescription();
    const userPrompt = `
      TUGASAN KEMAS KINI WATAK:
      Pengguna telah menukar Profil Watak Manusia kepada: "${editedCharacter}".
      
      Sila tulis semula 'imagePrompt' dan 'combinedVideoPrompt' bagi KESEMUA 5 babak supaya menggunakan watak baru ini. 
      Kekalkan jalan cerita asal.
      Babak 1: Kekalkan elemen watak produk generik/pesaing yang gagal. Dilarang guna produk sebenar.
      Babak 2-4: Kekalkan elemen gaya visual -> "${visualRule}".
      Babak 5: Kekalkan elemen Produk Real + Watak Manusia + Watak Produk Pixar.
      PENTING: Dilarang memasukkan harga atau diskaun. MESTI format dialog: 🗣️ Dialog: "teks disini". Pastikan panjang dialog sekurang-kurangnya 20-35 patah perkataan (durasi 8 saat).
    `;

    try {
      const payload = {
        contents: [{ parts: [{ text: userPrompt }] }],
        generationConfig: { 
          responseMimeType: "application/json",
          responseSchema: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                sceneNumber: { type: "NUMBER" },
                imagePrompt: { type: "STRING" },
                combinedVideoPrompt: { type: "STRING" }
              }
            }
          }
        }
      };

      // PANGGIL BACKEND
      const result = await fetchFromBackend('analyze', payload);

      let textResponse = result.candidates?.[0]?.content?.parts?.[0]?.text;
      textResponse = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
      const updatedScenes = JSON.parse(textResponse);

      const newStoryboard = storyboard.map(oldScene => {
        const newData = updatedScenes.find(s => s.sceneNumber === oldScene.sceneNumber);
        return newData ? { ...oldScene, imagePrompt: newData.imagePrompt, combinedVideoPrompt: newData.combinedVideoPrompt } : oldScene;
      });

      setStoryboard(newStoryboard);
      setAnalyzedData(prev => ({ ...prev, humanCharacterDescription: editedCharacter }));
      setIsUpdatingCharacter(false);
      
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      setPlayingAudioIndex(null);

      newStoryboard.forEach((scene, index) => {
        generateImageForScene(index, scene.imagePrompt, scene.sceneNumber === 1, scene.sceneNumber === 5);
      });

    } catch (err) {
      console.error(err);
      setError("Gagal mengemaskini watak. Sila cuba lagi.");
      setIsUpdatingCharacter(false);
    }
  };

  const waUrl = "https://wa.me/601135019981?text=Saya%20Berminat%20dengan%20Apps%20BRO%20ND%20PIXAR%20CHARACTER%20%26%20PRODUCT%20ni..";

  const bgStyles = {
    background: "radial-gradient(circle at 15% 50%, rgba(16, 185, 129, 0.15), transparent 25%), radial-gradient(circle at 85% 30%, rgba(6, 182, 212, 0.15), transparent 25%), #020617"
  };

  // === RENDER PAYWALL KETIKA TIADA AKSES ===
  if (!hasAccess) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 selection:bg-emerald-900 selection:text-emerald-50" style={bgStyles}>
        
        <div className="absolute top-10 left-10 w-64 h-64 bg-cyan-600/10 rounded-full blur-3xl mix-blend-screen animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-emerald-600/10 rounded-full blur-3xl mix-blend-screen animate-pulse" style={{ animationDelay: '2s' }}></div>

        <div className="relative z-10 bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl flex flex-col items-center animate-in zoom-in-95 duration-500 overflow-hidden">
          
          <div className="bg-emerald-500/10 p-5 rounded-3xl mb-6 border border-emerald-500/20 backdrop-blur-md shadow-inner">
            <Lock className="w-10 h-10 text-emerald-400" strokeWidth={1.5} />
          </div>
          
          <h2 className="text-3xl font-bold text-white mb-3 tracking-tight">Akses Eksklusif</h2>
          <p className="text-slate-300 text-sm mb-8 text-center leading-relaxed">
            Click Whatsapp Icon to get Access, <br/>
            <span className="text-emerald-300 font-bold text-base bg-emerald-500/10 border border-emerald-500/20 px-4 py-1.5 rounded-xl inline-block mt-3 shadow-lg">Hanya RM10</span>
          </p>
          
          <a 
            href={waUrl} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-4 rounded-2xl shadow-[0_10px_20px_rgba(37,211,102,0.2)] hover:shadow-[0_10px_25px_rgba(37,211,102,0.3)] hover:-translate-y-1 transition-all duration-300 flex items-center justify-center space-x-3 mb-8 group"
          >
            <svg className="w-6 h-6 fill-current group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
              <path d="M12.031 0C5.385 0 0 5.388 0 12.038c0 2.128.552 4.195 1.6 6.02L.037 24l6.105-1.602A11.97 11.97 0 0 0 12.031 24c6.646 0 12.031-5.388 12.031-12.038C24.062 5.388 18.677 0 12.031 0zm7.11 17.202c-.318.898-1.583 1.705-2.52 1.838-.707.1-1.614.168-4.733-1.077-3.753-1.493-6.16-5.334-6.347-5.584-.187-.25-1.517-2.023-1.517-3.864 0-1.84.954-2.738 1.295-3.088.34-.35.744-.438.992-.438.249 0 .497 0 .714.012.23.013.535-.088.835.641.318.763 1.054 2.573 1.147 2.76.094.188.156.413.03.663-.124.25-.187.412-.374.625-.186.212-.39.462-.56.625-.186.188-.385.394-.174.75.212.35 1.052 1.734 2.298 2.825 1.608 1.408 3.125 1.847 3.468 2.035.342.188.544.156.748-.063.204-.212.87-1.011 1.103-1.36.233-.35.467-.287.795-.175.328.112 2.072.975 2.43 1.162.359.188.598.288.685.45.088.163.088.925-.23 1.823z" />
            </svg>
            <span className="tracking-wide">Hubungi WhatsApp</span>
          </a>

          <div className="w-full border-t border-slate-700/50 pt-6">
            {!showUnlockInput ? (
              <button 
                onClick={() => setShowUnlockInput(true)}
                className="text-[13px] text-slate-400 hover:text-white underline underline-offset-4 flex items-center justify-center transition-colors w-full tracking-wide"
              >
                <Key className="w-4 h-4 mr-2" /> Saya sudah bayar & ada kod akses
              </button>
            ) : (
              <div className="flex flex-col space-y-3 animate-in fade-in slide-in-from-bottom-2">
                <input 
                  type="password" 
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="Kod Rahsia..."
                  className="bg-slate-950/80 border border-slate-700/50 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-emerald-500 text-center tracking-[0.3em] font-mono shadow-inner text-lg"
                  onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                />
                <button 
                  onClick={handleUnlock}
                  className="bg-slate-800/80 hover:bg-slate-700 text-white font-medium py-3.5 rounded-xl transition-all flex items-center justify-center border border-slate-700"
                >
                  Masuk Sekarang <ArrowRight className="w-4 h-4 ml-2" />
                </button>
                {passcodeError && (
                  <p className="text-red-400 text-xs mt-2 font-medium flex items-center justify-center bg-red-900/20 py-2 rounded-lg border border-red-500/20">
                    <AlertTriangle className="w-3.5 h-3.5 mr-1.5" /> {passcodeError}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // === RENDER SKRIN MASUKKAN API KEY (BYOK) JIKA BELUM ADA ===
  if (hasAccess && !isApiSetup) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 selection:bg-emerald-900 selection:text-emerald-50" style={bgStyles}>
        <div className="max-w-2xl w-full bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 md:p-10 shadow-2xl animate-in zoom-in-95 duration-500">
          <div className="flex items-center space-x-4 mb-8 border-b border-slate-800 pb-6">
            <div className="bg-cyan-500/20 p-3 rounded-2xl border border-cyan-500/30">
              <KeyRound className="w-8 h-8 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Sistem Kunci API Tersendiri (BYOK)</h2>
              <p className="text-slate-400 text-sm mt-1">Sila masukkan kunci API Google Gemini anda untuk menghidupkan enjin AI.</p>
            </div>
          </div>

          <div className="bg-slate-950/50 p-6 rounded-2xl border border-slate-800 mb-8">
            <h3 className="text-emerald-400 font-bold flex items-center mb-4">
              <BookOpen className="w-5 h-5 mr-2" /> Tutorial Pantas: Cara Dapatkan Kunci API
            </h3>
            <ol className="list-decimal list-inside text-slate-300 space-y-3 text-sm leading-relaxed">
              <li>Pergi ke laman web rasmi <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline font-semibold">Google AI Studio</a> dan log masuk guna akaun Google/Gmail anda.</li>
              <li>Sila setuju (Tick) pada terma dan syarat jika diminta.</li>
              <li>Klik pada butang biru besar <strong>"Get API key"</strong> atau <strong>"Create API key"</strong> di menu sebelah kiri.</li>
              <li>Pilih <strong>"Create API key in new project"</strong>. Tunggu sebentar sehingga kod panjang dijana.</li>
              <li>Salin (Copy) kod rahsia tersebut dan tampal (Paste) di dalam kotak di bawah.</li>
              <li className="text-amber-400/90 mt-2"><em>*Nota: Jika anda ingin jana gambar berkualiti Pixar (Image-to-Image), pastikan akaun Google Cloud anda telah disetkan "Billing" (akaun berbayar Pay-as-you-go).</em></li>
            </ol>
          </div>

          <div className="space-y-4">
            <label className="text-sm font-bold text-slate-300 block uppercase tracking-wider">Kunci API Google (API Key)</label>
            <input 
              type="password" 
              value={userApiKey}
              onChange={(e) => setUserApiKey(e.target.value)}
              placeholder="AIzaSyA..."
              className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-cyan-500 font-mono"
            />
            <button 
              onClick={() => {
                if(userApiKey.trim().length > 20) {
                  localStorage.setItem('geminiUserApiKey', userApiKey.trim());
                  setIsApiSetup(true);
                } else {
                  alert("Sila masukkan kunci API yang sah (biasanya bermula dengan 'AIza...').");
                }
              }}
              className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center"
            >
              Simpan Kunci & Mula Menggunakan Apps <ArrowRight className="w-5 h-5 ml-2" />
            </button>
            <p className="text-center text-xs text-slate-500 mt-4">
              Kunci API anda disimpan dengan selamat di dalam pelayar (browser) peranti anda sahaja dan tidak dikongsi dengan sesiapa.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // === RENDER APLIKASI SEBENAR JIKA ADA AKSES & API KEY ===
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans pb-24 selection:bg-emerald-900 selection:text-emerald-50 animate-in fade-in duration-1000">
      
      <header className="bg-slate-900/80 border-b border-slate-800 backdrop-blur-md sticky top-0 z-30 shadow-lg">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-emerald-500/20 p-2 rounded-xl border border-emerald-500/30">
              <Sparkles className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                BRO ND PIXAR CHARACTER & PRODUCT
              </h1>
            </div>
          </div>
          {/* UBAH DI SINI: Butang reset API Key */}
          <button 
            onClick={() => {
              localStorage.removeItem('geminiUserApiKey');
              setUserApiKey("");
              setIsApiSetup(false);
            }}
            className="text-xs text-slate-400 hover:text-red-400 flex items-center px-3 py-1.5 rounded-lg border border-transparent hover:border-red-500/30 hover:bg-red-500/10 transition-all"
          >
            <KeyRound className="w-3.5 h-3.5 mr-1.5" /> Tukar API Key
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row items-start gap-8">
            <div className="w-full md:w-2/3 space-y-5">
              
              <div>
                <h2 className="text-xl font-bold text-slate-100 mb-4">1. Muat Naik Gambar Produk (Max 5)</h2>
                <div className="flex flex-wrap gap-4 items-center bg-slate-950/50 p-4 rounded-2xl border border-slate-800/80">
                  {uploadedImages.map((img, idx) => (
                    <div key={idx} className="relative group w-20 h-20 rounded-xl overflow-hidden border-2 border-slate-700">
                      <img src={img.dataUrl} alt={`Produk ${idx}`} className="w-full h-full object-cover" />
                      <button 
                        onClick={() => removeImage(idx)}
                        className="absolute inset-0 bg-red-500/80 hidden group-hover:flex items-center justify-center transition-all backdrop-blur-sm"
                      >
                        <X className="w-6 h-6 text-white" />
                      </button>
                    </div>
                  ))}
                  
                  {uploadedImages.length < 5 && (
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-20 h-20 rounded-xl border-2 border-dashed border-emerald-500/50 hover:border-emerald-400 hover:bg-emerald-500/10 flex flex-col items-center justify-center transition-all text-emerald-500/70 hover:text-emerald-400"
                    >
                      <Upload className="w-6 h-6 mb-1" />
                    </button>
                  )}
                  <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" multiple className="hidden" />
                </div>
              </div>

              <div className="bg-slate-800/30 p-4 rounded-2xl border border-slate-700/50">
                <label className="text-cyan-400 text-sm font-bold uppercase tracking-wider mb-2 flex items-center">
                  <Wand2 className="w-4 h-4 mr-2" /> 2. Pilih Gaya Metafora Visual (Babak 2-4)
                </label>
                <p className="text-xs text-slate-400 mb-3">Tentukan cara watak produk anda "menyelesaikan masalah" dalam video.</p>
                <div className="relative">
                  <select 
                    value={selectedVisualStyle}
                    onChange={(e) => setSelectedVisualStyle(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block p-3 appearance-none"
                  >
                    {visualStyles.map((style) => (
                      <option key={style.id} value={style.id}>
                        {style.name}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
                </div>
                <p className="text-xs text-emerald-400/80 mt-2 bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                  <span className="font-semibold">Kesan:</span> {getVisualDescription()}
                </p>
              </div>

              {error && (
                <div className="flex items-start text-red-400 text-sm bg-red-400/10 p-3 rounded-xl border border-red-400/20">
                  <FileWarning className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" /> 
                  <span className="leading-relaxed">{error}</span>
                </div>
              )}
            </div>

            <div className="w-full md:w-1/3 flex flex-col justify-center h-full pt-8">
              <button 
                onClick={handleAnalyzeAndGenerate}
                disabled={isAnalyzing || uploadedImages.length === 0}
                className="w-full bg-gradient-to-br from-emerald-500 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500 text-white font-bold py-6 rounded-2xl shadow-[0_0_30px_rgba(16,185,129,0.2)] transition-all duration-300 flex items-center justify-center space-x-3 disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <><Loader2 className="w-6 h-6 animate-spin" /><span>Sedang Menganalisis...</span></>
                ) : (
                  <><ScanLine className="w-6 h-6" /><span>Analisis & Jana AI</span></>
                )}
              </button>
            </div>
          </div>
        </div>

        {analyzedData && !isAnalyzing && (
          <div className="bg-slate-900/60 border border-cyan-900/30 rounded-2xl p-5 flex flex-col lg:flex-row gap-6 animate-in fade-in duration-500">
            <div className="flex lg:flex-col items-center justify-center text-cyan-400 font-semibold w-full lg:w-1/5 border-b lg:border-b-0 lg:border-r border-slate-800 pb-3 lg:pb-0 gap-2">
              <Check className="w-6 h-6" /> 
              <span className="text-center">Analisis Selesai</span>
            </div>
            <div className="w-full lg:w-4/5 grid grid-cols-1 gap-5 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><span className="text-slate-500 block text-[11px] font-bold uppercase tracking-wider mb-1">Nama Produk</span> <span className="text-slate-200 font-medium">{analyzedData.productName} ({analyzedData.category})</span></div>
                <div><span className="text-slate-500 block text-[11px] font-bold uppercase tracking-wider mb-1">Masalah</span> <span className="text-slate-200">{analyzedData.painPoints}</span></div>
              </div>
              
              <div className="col-span-1 bg-slate-950/80 p-4 rounded-xl border border-cyan-900/50 shadow-inner">
                <label className="text-cyan-400 block text-[11px] font-bold uppercase tracking-wider mb-2 flex items-center">
                  <UserCheck className="w-4 h-4 mr-1.5" /> Ruangan Profil Watak (Boleh Diedit)
                </label>
                <div className="flex flex-col md:flex-row gap-3">
                  <input 
                    type="text" 
                    value={editedCharacter}
                    onChange={(e) => setEditedCharacter(e.target.value)}
                    className="flex-grow bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                    placeholder="Contoh: Lelaki Asia berumur 30 tahun, berpakaian kemas..."
                  />
                  <button 
                    onClick={handleUpdateGlobalCharacter}
                    disabled={isUpdatingCharacter || editedCharacter === analyzedData.humanCharacterDescription}
                    className="bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 text-white font-medium px-5 py-2.5 rounded-lg transition-all flex items-center justify-center min-w-[180px]"
                  >
                    {isUpdatingCharacter ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Memproses...</> : <><Edit3 className="w-4 h-4 mr-2" /> Terapkan Watak Baru</>}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {storyboard.length > 0 && !isAnalyzing && (
          <div className="space-y-8 pt-4">
            {isUpdatingCharacter && (
               <div className="bg-cyan-900/20 border border-cyan-500/30 p-4 rounded-2xl flex items-center justify-center text-cyan-400 animate-pulse">
                 <Loader2 className="w-6 h-6 animate-spin mr-3" />
                 <span>Sedang menulis semula keseluruhan skrip & menjana visual baharu... Sila tunggu.</span>
               </div>
            )}
            
            {!isUpdatingCharacter && storyboard.map((scene, index) => (
              <div key={index} className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row">
                
                <div className="w-full md:w-5/12 lg:w-4/12 bg-slate-950 relative border-b md:border-b-0 md:border-r border-slate-800 min-h-[350px] flex items-center justify-center p-4">
                  <div className="absolute top-4 left-4 z-10">
                    <span className={`font-bold px-4 py-1.5 rounded-full text-xs uppercase tracking-wider shadow-lg ${scene.sceneNumber === 1 ? "bg-amber-500 text-amber-50" : "bg-emerald-500 text-emerald-50"}`}>
                      Babak {scene.sceneNumber}
                    </span>
                  </div>

                  {scene.isGeneratingImage ? (
                    <div className="flex flex-col items-center justify-center text-emerald-500/70">
                      <Loader2 className="w-10 h-10 animate-spin mb-3" />
                      <span className="text-[11px] font-bold uppercase tracking-widest text-center mt-2 text-emerald-400/80">
                        {scene.sceneNumber === 1 ? "Menjana Imej Produk Pesaing..." : "Mengasingkan Latar Belakang & Menjana Produk Asal..."}
                      </span>
                    </div>
                  ) : scene.imageError ? (
                    <div className="flex flex-col items-center justify-center text-red-400 text-center px-4">
                      <AlertTriangle className="w-8 h-8 mb-2" />
                      <p className="text-sm font-semibold">Gagal Menjana Imej</p>
                      <p className="text-xs text-red-400/70 mt-1 line-clamp-3">{scene.errorMessage}</p>
                      <button 
                        onClick={() => generateImageForScene(index, scene.imagePrompt, scene.sceneNumber === 1, scene.sceneNumber === 5)}
                        className="mt-3 text-xs bg-red-500/20 px-3 py-1.5 rounded-md hover:bg-red-500/40"
                      >
                        Cuba Lagi
                      </button>
                    </div>
                  ) : scene.generatedImage ? (
                    <div className="relative group w-full h-full">
                      <img 
                        src={scene.generatedImage} 
                        alt="Scene" 
                        className="w-full h-full object-cover rounded-2xl aspect-[9/16] md:aspect-auto md:h-full"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 backdrop-blur-sm rounded-2xl">
                        <button onClick={() => downloadImage(scene.generatedImage, `Babak_${scene.sceneNumber}.png`)} className="bg-emerald-500 hover:bg-emerald-400 text-white w-40 py-2.5 rounded-xl font-medium text-sm flex items-center justify-center"><Download className="w-4 h-4 mr-2" /> Muat Turun</button>
                        <button onClick={() => generateImageForScene(index, scene.imagePrompt, scene.sceneNumber === 1, scene.sceneNumber === 5)} className="bg-slate-800 hover:bg-slate-700 text-white w-40 py-2.5 rounded-xl font-medium text-sm flex items-center justify-center"><RefreshCw className="w-4 h-4 mr-2" /> Jana Semula</button>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="w-full md:w-7/12 lg:w-8/12 p-6 md:p-8 flex flex-col bg-gradient-to-br from-slate-900 to-slate-950">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-slate-100">{scene.title}</h3>
                    <button 
                      onClick={() => handleCopy(scene.combinedVideoPrompt, `vid-${index}`)}
                      className="bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white p-2.5 rounded-xl transition-all shadow-md group/copy"
                      title="Salin Prompt"
                    >
                      {copiedStates[`vid-${index}`] ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="flex-grow bg-slate-950/60 p-5 rounded-2xl border border-slate-800 text-slate-300 font-mono text-sm leading-relaxed whitespace-pre-wrap shadow-inner overflow-y-auto">
                    {scene.isRegeneratingPrompt ? (
                      <div className="flex items-center text-cyan-500 h-full"><Loader2 className="w-6 h-6 animate-spin mr-3" /> Menyusun semula aksi & dialog...</div>
                    ) : (
                      scene.combinedVideoPrompt
                    )}
                  </div>

                  <div className="mt-4 flex flex-wrap justify-end gap-3">
                    <button 
                      onClick={() => handlePlayVoiceover(scene.combinedVideoPrompt, index)} 
                      disabled={scene.isRegeneratingPrompt} 
                      className={`text-xs font-medium px-4 py-2 rounded-xl border flex items-center transition-all
                        ${playingAudioIndex === index 
                          ? 'bg-red-500/20 text-red-400 border-red-500/50 hover:bg-red-500/30' 
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'}`}
                    >
                      {playingAudioIndex === index ? (
                        <><Square className="w-3.5 h-3.5 mr-2 fill-current" /> Henti VO</>
                      ) : (
                        <><PlayCircle className="w-3.5 h-3.5 mr-2" /> Play VO</>
                      )}
                    </button>
                    
                    <button onClick={() => regenerateScenePrompt(index)} disabled={scene.isRegeneratingPrompt} className="text-xs font-medium px-4 py-2 rounded-xl bg-slate-800/50 text-slate-300 hover:bg-amber-500/20 hover:text-amber-400 border border-slate-700 flex items-center">
                      <RefreshCw className="w-3.5 h-3.5 mr-2" /> Tukar Dialog (Elak Overclaim)
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}