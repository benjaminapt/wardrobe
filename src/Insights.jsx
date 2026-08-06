import React, { useMemo } from 'react';

export function Insights({ items, outfits }) {
  const stats = useMemo(() => {
    const totalItems = items.length;
    const totalOutfits = outfits.length;
    
    // Calculate category breakdown
    const categoryCounts = items.reduce((acc, item) => {
      acc[item.part] = (acc[item.part] || 0) + 1;
      return acc;
    }, {});

    // Calculate color distribution
    const colorCounts = items.reduce((acc, item) => {
      if (item.color) {
        const c = item.color.toLowerCase();
        acc[c] = (acc[c] || 0) + 1;
      }
      return acc;
    }, {});

    const topColors = Object.entries(colorCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

    // Calculate most used items in outfits
    const itemUsage = {};
    outfits.forEach(outfit => {
      (outfit.garmentIds || []).forEach(id => {
        itemUsage[id] = (itemUsage[id] || 0) + 1;
      });
    });

    const mostUsedItems = Object.entries(itemUsage)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, count]) => {
        const item = items.find(i => i.id === id);
        return { item, count };
      })
      .filter(x => x.item);

    return { totalItems, totalOutfits, categoryCounts, topColors, mostUsedItems };
  }, [items, outfits]);

  return (
    <div style={{ padding: '40px 56px', maxWidth: '1200px', margin: '0 auto', animation: 'viewer-in 300ms ease' }}>
      <header style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 600, margin: '0 0 10px 0', letterSpacing: '-0.03em' }}>Wardrobe Insights</h1>
        <p style={{ color: 'var(--muted)', fontSize: '1.1rem', margin: 0 }}>Your personal style analytics.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '40px' }}>
        <div style={{ background: 'var(--surface)', padding: '24px', borderRadius: '20px', border: '1px solid var(--line)' }}>
          <h3 style={{ margin: '0 0 10px 0', color: 'var(--muted)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Total Items</h3>
          <div style={{ fontSize: '3rem', fontWeight: 700, color: 'var(--accent)' }}>{stats.totalItems}</div>
        </div>
        
        <div style={{ background: 'var(--surface)', padding: '24px', borderRadius: '20px', border: '1px solid var(--line)' }}>
          <h3 style={{ margin: '0 0 10px 0', color: 'var(--muted)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Curated Outfits</h3>
          <div style={{ fontSize: '3rem', fontWeight: 700, color: 'var(--accent)' }}>{stats.totalOutfits}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
        {/* Color Palette */}
        <div style={{ background: 'var(--surface)', padding: '30px', borderRadius: '24px', border: '1px solid var(--line)' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '1.2rem', fontWeight: 500 }}>Dominant Colors</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            {stats.topColors.map(([color, count]) => (
              <div key={color} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <div 
                  style={{ 
                    width: '60px', height: '60px', borderRadius: '50%', backgroundColor: color, 
                    border: '2px solid rgba(255,255,255,0.1)', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' 
                  }} 
                  title={`${color} (${count} items)`}
                />
                <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{count} items</span>
              </div>
            ))}
          </div>
        </div>

        {/* Most Worn Items */}
        <div style={{ background: 'var(--surface)', padding: '30px', borderRadius: '24px', border: '1px solid var(--line)' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '1.2rem', fontWeight: 500 }}>Most Used in Outfits</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {stats.mostUsedItems.map(({ item, count }) => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px', background: 'var(--surface-hover)', borderRadius: '12px' }}>
                <img src={item.thumbnail || item.image} alt={item.name} style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, fontSize: '0.95rem' }}>{item.name || 'Unnamed Item'}</div>
                  <div style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>Used in {count} outfits</div>
                </div>
              </div>
            ))}
            {stats.mostUsedItems.length === 0 && <p style={{ color: 'var(--muted)' }}>No items used in outfits yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
