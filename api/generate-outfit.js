export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(401).json({ error: 'GEMINI_API_KEY environment variable is missing.' });
  }

  try {
    const { images, prompt } = req.body;
    
    if (!images || images.length === 0) {
      return res.status(400).json({ error: 'No images provided.' });
    }

    // Format images for Gemini API
    const parts = [
      { text: prompt }
    ];

    for (let i = 0; i < images.length; i++) {
      // Remove data:image/png;base64, prefix if present
      const base64Data = images[i].data.replace(/^data:image\/\w+;base64,/, "");
      parts.push({
        inlineData: {
          mimeType: images[i].mimeType || 'image/png',
          data: base64Data
        }
      });
    }

    // Call Gemini Image API (Nano Banana)
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: parts
          }
        ],
        generationConfig: {
          outputMimeType: "image/png"
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Gemini API Error:", errorData);
      
      // Fallback to older model if 3.1 is not available in their tier
      if (response.status === 404) {
        return res.status(500).json({ error: 'Model gemini-3.1-flash-image not found. Please check your API tier.' });
      }
      return res.status(500).json({ error: `Gemini API failed: ${response.statusText}`, details: errorData });
    }

    const data = await response.json();
    
    // Extract base64 image from response (assuming standard GenerateContentResponse structure for image generation)
    // For gemini image models, the image is often returned as inlineData or as a generated file.
    // The google-genai response for images: part.inlineData.data
    let generatedImageBase64 = null;
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
      const imgPart = data.candidates[0].content.parts.find(p => p.inlineData);
      if (imgPart && imgPart.inlineData) {
        generatedImageBase64 = `data:${imgPart.inlineData.mimeType};base64,${imgPart.inlineData.data}`;
      }
    }

    if (!generatedImageBase64) {
      return res.status(500).json({ error: 'Failed to extract generated image from response.', raw: data });
    }

    return res.status(200).json({ image: generatedImageBase64 });

  } catch (error) {
    console.error("Error generating outfit:", error);
    return res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
}
