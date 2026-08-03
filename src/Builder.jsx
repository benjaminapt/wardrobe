import { useMemo, useState } from "react";
import { OptimizedImage } from "./OptimizedImage.jsx";
import "./Builder.css";

const CATEGORIES = [
  { id: "upperbody", label: "Top" },
  { id: "wholebody_up", label: "Jacket" },
  { id: "lowerbody", label: "Bottom" },
  { id: "shoes", label: "Shoes" }
];

export function Builder({ items }) {
  const [selections, setSelections] = useState({});
  const [activeSlot, setActiveSlot] = useState(null);

  const handleSelect = (category, item) => {
    setSelections((prev) => ({ ...prev, [category]: item }));
    setActiveSlot(null);
  };

  const calculateCompatibility = (item1, item2) => {
    // Simple mock logic for suggestions based on tags or colors
    if (!item1 || !item2) return 0;
    let score = 0;
    if (item1.color && item2.color && item1.color !== item2.color) score += 1;
    if (item1.tags && item2.tags) {
      const tags1 = item1.tags.map(t => t.toLowerCase());
      const tags2 = item2.tags.map(t => t.toLowerCase());
      if (tags1.some(t => tags2.includes(t))) score += 2;
    }
    return score;
  };

  const getSuggestions = (category) => {
    const categoryItems = items.filter((i) => i.part === category);
    const currentSelection = Object.values(selections).filter(Boolean);
    
    if (currentSelection.length === 0) return categoryItems.slice(0, 8);

    return categoryItems
      .map(item => {
        const score = currentSelection.reduce((acc, selected) => acc + calculateCompatibility(item, selected), 0);
        return { item, score };
      })
      .sort((a, b) => b.score - a.score)
      .map(scored => scored.item)
      .slice(0, 8);
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
                  <p>{Object.values(selections).filter(Boolean).length} items selected</p>
                  <button className="primary-button" style={{marginTop: '1rem'}}>
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
