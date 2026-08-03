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

        <div className="builder-suggestions-panel">
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
              <p>Select a slot on the left to start building your outfit.</p>
              {Object.keys(selections).length > 0 && (
                <div className="builder-summary">
                  <h4>Current Outfit</h4>
                  
                  <div className="builder-preview" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', margin: '1.5rem 0' }}>
                    {['wholebody_up', 'upperbody', 'lowerbody', 'shoes'].map(cat => {
                       const item = selections[cat];
                       if (item) {
                         return (
                           <div key={cat} style={{ position: 'relative' }}>
                             <img 
                               src={item.thumbnail || item.image} 
                               alt={item.name} 
                               style={{ width: '160px', maxHeight: '160px', objectFit: 'contain', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))' }} 
                             />
                           </div>
                         );
                       }
                       return null;
                    })}
                  </div>

                  <p>{Object.values(selections).filter(Boolean).length} items selected</p>
                  <button 
                    className="primary-button" 
                    style={{marginTop: '1rem'}}
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
                    Save Outfit
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
