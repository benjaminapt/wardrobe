import { useMemo, useState } from "react";
import { OptimizedImage } from "./OptimizedImage.jsx";
import "./Builder.css";

const CATEGORIES = [
  { id: "upperbody", label: "Top" },
  { id: "wholebody_up", label: "Jacket" },
  { id: "lowerbody", label: "Bottom" },
  { id: "shoes", label: "Shoes" }
];

function DraggableItem({ item, positionProps, zIndex }) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [start, setStart] = useState({ x: 0, y: 0 });

  const handleDown = (clientX, clientY, e) => {
    if (e.cancelable) e.preventDefault();
    setIsDragging(true);
    setStart({ x: clientX - pos.x, y: clientY - pos.y });
    e.stopPropagation();
  };

  const handleMove = (clientX, clientY) => {
    if (!isDragging) return;
    setPos({ x: clientX - start.x, y: clientY - start.y });
  };

  const handleUp = () => setIsDragging(false);

  const onWheel = (e) => {
    if (e.cancelable) e.preventDefault();
    setScale(s => Math.max(0.3, Math.min(3, s - e.deltaY * 0.002)));
  };

  // Attach window events for dragging outside the element
  useMemo(() => {
    if (typeof window === 'undefined') return;
    const onMouseMove = (e) => handleMove(e.clientX, e.clientY);
    const onTouchMove = (e) => handleMove(e.touches[0].clientX, e.touches[0].clientY);
    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', handleUp);
      window.addEventListener('touchmove', onTouchMove, { passive: false });
      window.addEventListener('touchend', handleUp);
    } else {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', handleUp);
    }
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', handleUp);
    };
  }, [isDragging, start]);

  return (
    <div 
      style={{
        position: 'absolute',
        ...positionProps,
        transform: `translate(calc(-50% + ${pos.x}px), ${pos.y}px) scale(${scale})`,
        cursor: isDragging ? 'grabbing' : 'grab',
        zIndex: isDragging ? 100 : zIndex,
        touchAction: 'none'
      }}
      onMouseDown={(e) => handleDown(e.clientX, e.clientY, e)}
      onTouchStart={(e) => handleDown(e.touches[0].clientX, e.touches[0].clientY, e)}
      onWheel={onWheel}
    >
       <img src={item.thumbnail || item.image} alt={item.name} draggable="false" style={{ width: '100%', objectFit: 'contain', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.4))', pointerEvents: 'none', userSelect: 'none' }} />
       <div style={{position: 'absolute', bottom: '-20px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.6)', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', whiteSpace: 'nowrap', opacity: isDragging ? 1 : 0, transition: 'opacity 0.2s', pointerEvents: 'none'}}>Drag to move • Scroll to resize</div>
    </div>
  );
}

export function Builder({ items, onSaveOutfit }) {
  const [selections, setSelections] = useState({});
  const [activeSlot, setActiveSlot] = useState(null);
  const [isGeneratingPro, setIsGeneratingPro] = useState(false);
  const [proPreviewUrl, setProPreviewUrl] = useState(null);

  const handleSelect = (category, item) => {
    setSelections((prev) => ({ ...prev, [category]: item }));
    setActiveSlot(null);
  };

  const handleGenerateProPreview = async () => {
    setIsGeneratingPro(true);
    try {
      const outfitItems = Object.values(selections).filter(Boolean);
      const images = [];
      
      const base = selections.wholebody_up || selections.upperbody || selections.lowerbody;
      const backgroundIsModeled = !!base?.modeledImage;
      const baseImgUrl = backgroundIsModeled ? base.modeledImage : '/model-reference.png';
      images.push(baseImgUrl);
      
      outfitItems.forEach(item => {
        if (item && (!backgroundIsModeled || item !== base)) {
           images.push(item.image);
        }
      });
      
      const urlToBase64 = async (url) => {
        const response = await fetch(url);
        const blob = await response.blob();
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve({ data: reader.result, mimeType: blob.type });
          reader.readAsDataURL(blob);
        });
      };
      
      const base64Images = await Promise.all(images.map(url => urlToBase64(url)));
      
      const res = await fetch('/api/generate-outfit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: "Create a professional horizontal 3:2 editorial fashion photograph of the person in Image 1 wearing exactly the clothing items from the subsequent images. Preserve the person's face, build, skin, and the background style. Ensure the overlaid clothes perfectly fit, maintaining highly realistic lighting and shadows. Do not invent any logos or details.",
          images: base64Images
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate image');
      
      setProPreviewUrl(data.image);
    } catch (err) {
      alert("Error generating Pro Preview: " + err.message);
    } finally {
      setIsGeneratingPro(false);
    }
  };

  const calculateCompatibility = (item1, item2) => {
    if (!item1 || !item2) return 0;
    let score = 0;
    
    // Color logic
    if (item1.color && item2.color) {
      if (item1.color === item2.color) score += 1; // Monochromatic
      else score += 2; // Contrast is generally good
    }

    // Tag matching logic
    if (item1.tags && item2.tags) {
      const tags1 = item1.tags.map(t => t.toLowerCase());
      const tags2 = item2.tags.map(t => t.toLowerCase());
      
      const styles = ['athletic', 'casual', 'formal', 'streetwear', 'summer', 'winter'];
      let styleMatch = false;
      let styleClash = false;
      
      for (const style of styles) {
        if (tags1.includes(style) && tags2.includes(style)) {
          score += 3;
          styleMatch = true;
        } else if ((tags1.includes(style) && !tags2.includes(style) && tags2.some(t => styles.includes(t))) || 
                   (tags2.includes(style) && !tags1.includes(style) && tags1.some(t => styles.includes(t)))) {
          styleClash = true;
        }
      }
      
      if (styleClash && !styleMatch) score -= 2; // Penalty for clashing styles

      // Neutrals and versatile fabrics
      if (tags1.includes('denim') || tags2.includes('denim')) score += 1;
      
      // General tag overlap
      if (tags1.some(t => tags2.includes(t) && !styles.includes(t))) score += 1;
    }
    return score;
  };

  const getSuggestions = (category) => {
    const categoryItems = items.filter((i) => i.part === category);
    const currentSelection = Object.values(selections).filter(Boolean);
    
    if (currentSelection.length === 0) return categoryItems;

    return categoryItems
      .map(item => {
        const score = currentSelection.reduce((acc, selected) => acc + calculateCompatibility(item, selected), 0);
        return { item, score };
      })
      .sort((a, b) => b.score - a.score)
      .map(scored => scored.item);
  };

  // Determine the background image (prioritize modeled images of selected tops/jackets)
  const baseItem = selections.wholebody_up || selections.upperbody || selections.lowerbody;
  const backgroundIsModeled = !!baseItem?.modeledImage;
  const backgroundUrl = backgroundIsModeled ? baseItem.modeledImage : '/model-reference.png';

  const positioning = {
    wholebody_up: { top: '15%', left: '50%', width: '240px', zIndex: 3 },
    upperbody:    { top: '18%', left: '50%', width: '220px', zIndex: 2 },
    lowerbody:    { top: '45%', left: '50%', width: '220px', zIndex: 1 },
    shoes:        { bottom: '5%', left: '50%', width: '160px', zIndex: 4 }
  };

  return (
    <div className="builder-container">
      <div className="builder-layout">
        <div className="builder-slots">
          {CATEGORIES.map(({ id, label }) => {
            const selectedItem = selections[id];
            return (
              <div 
                key={id} 
                className={`builder-slot ${activeSlot === id ? 'active' : ''} ${selectedItem ? 'filled' : ''}`}
                onClick={() => setActiveSlot(activeSlot === id ? null : id)}
              >
                <div className="slot-label">{label}</div>
                {selectedItem ? (
                  <OptimizedImage
                    src={selectedItem.thumbnail || selectedItem.image}
                    alt={selectedItem.name}
                    sizes="120px"
                    breakpoints={[120, 240]}
                  />
                ) : (
                  <div className="slot-empty">Select {label}</div>
                )}
                {selectedItem && (
                  <button 
                    className="slot-clear" 
                    onClick={(e) => { e.stopPropagation(); handleSelect(id, null); }}
                  >
                    ✕
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="builder-preview-panel" style={{ flex: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <h4>Interactive Fitting Room</h4>
          <p style={{fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem'}}>Drag pieces to move them. Scroll over them to resize.</p>
          <div 
            className="builder-preview" 
            style={{ 
              position: 'relative', 
              width: '280px', 
              height: '420px', 
              backgroundImage: `url(${backgroundUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              touchAction: 'none'
            }}
          >
            {['shoes', 'lowerbody', 'upperbody', 'wholebody_up'].map(cat => {
               const item = selections[cat];
               if (item && (!backgroundIsModeled || item !== baseItem)) {
                 return (
                   <DraggableItem 
                     key={item.id} 
                     item={item} 
                     positionProps={positioning[cat]} 
                     zIndex={positioning[cat].zIndex} 
                   />
                 );
               }
               return null;
            })}
            {Object.keys(selections).length === 0 && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', color: 'white', textAlign: 'center', padding: '1rem' }}>
                <p>Select clothes to try them on</p>
              </div>
            )}
          </div>
          
          {Object.values(selections).filter(Boolean).length > 1 && (
            <button 
              className="secondary-button" 
              style={{marginTop: '1rem', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'linear-gradient(45deg, #FFD700, #FFA500)', color: 'black', border: 'none', fontWeight: 'bold'}}
              onClick={handleGenerateProPreview}
              disabled={isGeneratingPro}
            >
              {isGeneratingPro ? '✨ Generando con Nano Banana...' : '✨ Generar Preview Pro (IA)'}
            </button>
          )}

          {Object.values(selections).filter(Boolean).length > 0 && (
            <button 
              className="primary-button" 
              style={{marginTop: '0.5rem', width: '100%'}}
              onClick={() => {
                const outfitItems = Object.values(selections).filter(Boolean);
                if (outfitItems.length > 0 && onSaveOutfit) {
                  onSaveOutfit({
                    id: 'custom-outfit-' + Date.now(),
                    name: 'Custom Outfit',
                    garmentIds: outfitItems.map(i => i.id),
                    image: null,
                    occasion: []
                  });
                  setSelections({});
                  alert("Outfit saved!");
                }
              }}
            >
              Save Outfit ({Object.values(selections).filter(Boolean).length} items)
            </button>
          )}
        </div>

        <div className="builder-suggestions-panel" style={{ flex: '1.5', paddingLeft: '1.5rem' }}>
          {activeSlot ? (
            <>
              <h3>Select {CATEGORIES.find(c => c.id === activeSlot).label}</h3>
              <div className="suggestions-grid">
                {getSuggestions(activeSlot).map((item) => (
                  <div 
                    key={item.id} 
                    className="suggestion-card"
                    onClick={() => handleSelect(activeSlot, item)}
                  >
                    <OptimizedImage
                      src={item.thumbnail || item.image}
                      alt={item.name}
                      sizes="100px"
                      breakpoints={[100, 200]}
                    />
                    <div className="suggestion-name">{item.name}</div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="builder-welcome">
              <p>Select a slot on the left to browse items.</p>
            </div>
          )}
        </div>
      </div>

      {proPreviewUrl && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
           <h2 style={{ color: 'white', marginBottom: '1rem' }}>✨ Pro Preview</h2>
           <img src={proPreviewUrl} alt="Pro Preview" style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }} />
           <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
             <button className="primary-button" onClick={() => {
                const link = document.createElement('a');
                link.download = 'wardrobe-pro-preview.png';
                link.href = proPreviewUrl;
                link.click();
             }}>Download</button>
             <button className="secondary-button" onClick={() => setProPreviewUrl(null)}>Close</button>
           </div>
        </div>
      )}
    </div>
  );
}
