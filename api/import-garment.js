export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Fetch the image
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch image');
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    const mimeType = response.headers.get('content-type') || 'image/jpeg';
    
    // Mocking background removal by returning the base64 image directly.
    res.status(200).json({
      success: true,
      image: `data:${mimeType};base64,${base64}`,
      part: "upperbody",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
