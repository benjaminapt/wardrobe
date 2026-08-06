import { useState, useMemo } from "react";
import { Plus, Suitcase, Trash, ArrowLeft } from "@phosphor-icons/react";
import { OptimizedImage } from "./OptimizedImage.jsx";

const STORAGE_KEY = "open-wardrobe-suitcases-v1";

export function readSuitcases() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function writeSuitcases(suitcases) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(suitcases));
}

export function PackingLists({ items, outfits, onBack, suitcases, setSuitcases, writeSuitcases }) {
  const [activeSuitcaseId, setActiveSuitcaseId] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newTripName, setNewTripName] = useState("");

  const activeSuitcase = useMemo(() => suitcases.find(s => s.id === activeSuitcaseId), [suitcases, activeSuitcaseId]);

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newTripName.trim()) return;
    
    const newSuitcase = {
      id: `trip-${Date.now()}`,
      name: newTripName.trim(),
      items: [],
      outfits: []
    };
    
    const updated = [...suitcases, newSuitcase];
    setSuitcases(updated);
    writeSuitcases(updated);
    setNewTripName("");
    setIsCreating(false);
  };

  const handleDelete = (id) => {
    const updated = suitcases.filter(s => s.id !== id);
    setSuitcases(updated);
    writeSuitcases(updated);
    if (activeSuitcaseId === id) setActiveSuitcaseId(null);
  };

  const renderSuitcaseList = () => (
    <div style={{ padding: '40px 52px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>Packing Lists</h2>
        <button className="primary-button" onClick={() => setIsCreating(true)}>
          <Plus size={16} weight="bold" /> New Trip
        </button>
      </div>

      {isCreating && (
        <form onSubmit={handleCreate} style={{ display: 'flex', gap: 12, marginBottom: 32, background: 'var(--surface)', padding: 24, borderRadius: 16, border: '1px solid var(--line)' }}>
          <input 
            type="text" 
            placeholder="Trip name (e.g. Paris 2026)" 
            value={newTripName} 
            onChange={e => setNewTripName(e.target.value)}
            style={{ flex: 1, padding: '10px 16px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--input-surface)', color: 'var(--ink)' }}
            autoFocus
          />
          <button type="submit" className="primary-button">Create</button>
          <button type="button" className="secondary-button" onClick={() => setIsCreating(false)}>Cancel</button>
        </form>
      )}

      {suitcases.length === 0 && !isCreating ? (
        <div className="status empty">No packing lists yet. Create a new trip to get started.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
          {suitcases.map(trip => (
            <div key={trip.id} onClick={() => setActiveSuitcaseId(trip.id)} style={{ cursor: 'pointer', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 16, padding: 24, transition: 'transform 200ms ease, box-shadow 200ms ease' }} className="outfit-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <Suitcase size={32} weight="light" color="var(--accent)" />
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 500 }}>{trip.name}</h3>
              </div>
              <p style={{ margin: 0, color: 'var(--muted)', fontSize: 14 }}>
                {trip.outfits.length} outfits, {trip.items.length} loose items
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderActiveSuitcase = () => {
    const tripOutfits = outfits.filter(o => activeSuitcase.outfits.includes(o.id));
    const tripItems = items.filter(i => activeSuitcase.items.includes(i.id));

    // Stats
    const tops = tripItems.filter(i => i.part === 'upperbody').length + tripOutfits.reduce((acc, o) => acc + o.garmentIds.filter(id => items.find(i => i.id === id)?.part === 'upperbody').length, 0);
    const bottoms = tripItems.filter(i => i.part === 'lowerbody').length + tripOutfits.reduce((acc, o) => acc + o.garmentIds.filter(id => items.find(i => i.id === id)?.part === 'lowerbody').length, 0);
    const shoes = tripItems.filter(i => i.part === 'shoes').length + tripOutfits.reduce((acc, o) => acc + o.garmentIds.filter(id => items.find(i => i.id === id)?.part === 'shoes').length, 0);

    return (
      <div style={{ padding: '40px 52px' }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 32 }}>
          <button className="secondary-button" onClick={() => setActiveSuitcaseId(null)} style={{ padding: 8 }}>
            <ArrowLeft size={20} />
          </button>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600, flex: 1 }}>{activeSuitcase.name}</h2>
          <button className="delete-button" onClick={() => handleDelete(activeSuitcase.id)}>
            <Trash size={16} /> Delete Trip
          </button>
        </div>

        <div style={{ display: 'flex', gap: 16, marginBottom: 48 }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', padding: '16px 24px', borderRadius: 12, flex: 1 }}>
            <div style={{ fontSize: 12, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tops packed</div>
            <div style={{ fontSize: 28, fontWeight: 600, marginTop: 4 }}>{tops}</div>
          </div>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', padding: '16px 24px', borderRadius: 12, flex: 1 }}>
            <div style={{ fontSize: 12, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bottoms packed</div>
            <div style={{ fontSize: 28, fontWeight: 600, marginTop: 4 }}>{bottoms}</div>
          </div>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', padding: '16px 24px', borderRadius: 12, flex: 1 }}>
            <div style={{ fontSize: 12, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Shoes packed</div>
            <div style={{ fontSize: 28, fontWeight: 600, marginTop: 4 }}>{shoes}</div>
          </div>
        </div>

        <h3 style={{ fontSize: 18, marginBottom: 24 }}>Packed Items</h3>
        <p style={{ color: 'var(--muted)' }}>To add items, go to your Wardrobe or Outfits, click an item, and use the "Pack" button.</p>
        
        <div className="gallery-masonry" style={{ padding: '24px 0' }}>
          {tripItems.map(item => (
            <div key={item.id} className="gallery-item-wrapper" style={{ position: 'relative' }}>
              <div className="gallery-item">
                <OptimizedImage
                  src={item.modeledImage || item.thumbnail || item.image}
                  alt=""
                  sizes="(max-width: 520px) calc(50vw - 16px), 180px"
                  breakpoints={[120, 180, 240, 320]}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return activeSuitcaseId ? renderActiveSuitcase() : renderSuitcaseList();
}
