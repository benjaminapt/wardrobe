import { useMemo, useState } from "react";
import { OptimizedImage } from "./OptimizedImage.jsx";
import "./Builder.css";

const CATEGORIES = [
  { id: "upperbody", label: "Top" },
  { id: "wholebody_up", label: "Jacket" },
  { id: "lowerbody", label: "Bottom" },
  { id: "shoes", label: "Shoes" }
];

export function Builder({ items, onSaveOutfit }) {
  const [selections, setSelections] = useState({});
  const [activeSlot, setActiveSlot] = useState(null);

  const handleSelect = (category, item) => {
    setSelections((prev) => ({ ...prev, [category]: item }));
    setActiveSlot(null);
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
          <h4>Preview</h4>
          <div 
            className="builder-preview" 
            style={{ 
              position: 'relative', 
              width: '280px', 
              height: '420px', 
              margin: '1.5rem 0', 
              backgroundImage: 'url(/model-reference.png)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}
          >
            {['shoes', 'lowerbody', 'upperbody', 'wholebody_up'].map(cat => {
               const item = selections[cat];
               if (item) {
                 const positioning = {
                   wholebody_up: { top: '15%', left: '50%', transform: 'translateX(-50%)', width: '240px', zIndex: 3 },
                   upperbody:    { top: '18%', left: '50%', transform: 'translateX(-50%)', width: '220px', zIndex: 2 },
                   lowerbody:    { top: '45%', left: '50%', transform: 'translateX(-50%)', width: '220px', zIndex: 1 },
                   shoes:        { bottom: '5%', left: '50%', transform: 'translateX(-50%)', width: '160px', zIndex: 4 }
                 };
                 return (
                   <div key={cat} style={{ position: 'absolute', ...positioning[cat] }}>
                     <img 
                       src={item.thumbnail || item.image} 
                       alt={item.name} 
                       style={{ width: '100%', objectFit: 'contain', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.4))' }} 
                     />
                   </div>
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
          
          {Object.values(selections).filter(Boolean).length > 0 && (
            <button 
              className="primary-button" 
              style={{marginTop: '1rem', width: '100%'}}
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
    </div>
  );
}
