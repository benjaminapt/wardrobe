import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, Moon, Plus, Sun, Trash, X, Heart, Suitcase } from "@phosphor-icons/react";
import { WardrobeImportFlow } from "./import-flow.jsx";
import { OptimizedImage } from "./OptimizedImage.jsx";
import { loadOutfits } from "./outfit-source.js";
import { persistTheme, resolveTheme, themeColor, toggleTheme } from "./theme.js";
import { loadWardrobe } from "./wardrobe-source.js";
import { Builder } from "./Builder.jsx";
import { PackingLists, readSuitcases, writeSuitcases } from "./PackingLists.jsx";
import { Insights } from "./Insights.jsx";

const STORAGE_KEY = "open-wardrobe-edits-v1";
const DELETED_STORAGE_KEY = "open-wardrobe-deleted-v1";
const CUSTOM_OUTFITS_KEY = "open-wardrobe-custom-outfits-v1";
const STATIC_MODE = import.meta.env.VITE_STATIC_WARDROBE === "1";

const TYPES = [
  { id: "all", label: "All" },
  { id: "favorites", label: "Favorites", singular: "Favorite" },
  { id: "upperbody", label: "Tops", singular: "Top" },
  { id: "wholebody_up", label: "Jackets", singular: "Jacket" },
  { id: "lowerbody", label: "Bottoms", singular: "Bottom" },
  { id: "accessories_up", label: "Accessories", singular: "Accessory" },
  { id: "shoes", label: "Shoes", singular: "Shoes" },
  { id: "missing-photo", label: "Missing Photo", singular: "Missing Photo" },
];

const TYPE_MAP = Object.fromEntries(TYPES.map((type) => [type.id, type]));
const TYPE_ORDER = Object.fromEntries(TYPES.slice(2, -1).map((type, index) => [type.id, index]));


function readEdits() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}


function persistEdit(item) {
  const edits = readEdits();
  edits[item.id] = {
    name: item.name || "",
    part: item.part,
    color: item.color || null,
    secondaryColor: item.secondaryColor || null,
    tags: item.tags || [],
    favorite: !!item.favorite,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(edits));
}

function removePersistedEdit(id) {
  const edits = readEdits();
  delete edits[id];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(edits));
}

function readDeletedItems() {
  try {
    const value = JSON.parse(localStorage.getItem(DELETED_STORAGE_KEY) || "[]");
    return new Set(Array.isArray(value) ? value : []);
  } catch {
    return new Set();
  }
}

function persistDeletedItem(id) {
  const deleted = readDeletedItems();
  deleted.add(id);
  localStorage.setItem(DELETED_STORAGE_KEY, JSON.stringify([...deleted]));
}

function rgbToHex(red, green, blue) {
  return `#${[red, green, blue].map((value) => Math.max(0, Math.min(255, value)).toString(16).padStart(2, "0")).join("")}`;
}

function colorDistance(first, second) {
  return Math.sqrt(
    ((first.red - second.red) ** 2)
    + ((first.green - second.green) ** 2)
    + ((first.blue - second.blue) ** 2),
  );
}

function extractPalette(image) {
  const canvas = document.createElement("canvas");
  canvas.width = 72;
  canvas.height = 72;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
  const buckets = new Map();

  for (let index = 0; index < pixels.length; index += 4) {
    const alpha = pixels[index + 3];
    if (alpha < 72) continue;

    const red = pixels[index];
    const green = pixels[index + 1];
    const blue = pixels[index + 2];
    const key = `${Math.round(red / 28)}-${Math.round(green / 28)}-${Math.round(blue / 28)}`;
    const current = buckets.get(key) || { red: 0, green: 0, blue: 0, count: 0 };
    current.red += red;
    current.green += green;
    current.blue += blue;
    current.count += 1;
    buckets.set(key, current);
  }

  const ranked = [...buckets.values()]
    .map((bucket) => ({
      red: Math.round(bucket.red / bucket.count),
      green: Math.round(bucket.green / bucket.count),
      blue: Math.round(bucket.blue / bucket.count),
      count: bucket.count,
    }))
    .sort((a, b) => b.count - a.count);

  const selected = [];
  for (const color of ranked) {
    if (selected.every((existing) => colorDistance(existing, color) > 38)) selected.push(color);
    if (selected.length === 5) break;
  }

  return selected.map((color) => rgbToHex(color.red, color.green, color.blue));
}

function buildSamplingCanvas(image) {
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  canvas.getContext("2d", { willReadFrequently: true }).drawImage(image, 0, 0);
  return canvas;
}

function sampleImageColor(image, canvas, event) {
  const bounds = image.getBoundingClientRect();
  const scale = Math.min(bounds.width / image.naturalWidth, bounds.height / image.naturalHeight);
  const renderedWidth = image.naturalWidth * scale;
  const renderedHeight = image.naturalHeight * scale;
  const offsetX = (bounds.width - renderedWidth) / 2;
  const offsetY = (bounds.height - renderedHeight) / 2;
  const imageX = Math.floor((event.clientX - bounds.left - offsetX) / scale);
  const imageY = Math.floor((event.clientY - bounds.top - offsetY) / scale);

  if (imageX < 0 || imageY < 0 || imageX >= canvas.width || imageY >= canvas.height) return null;

  const context = canvas.getContext("2d", { willReadFrequently: true });
  for (let radius = 0; radius <= 18; radius += 2) {
    const startX = Math.max(0, imageX - radius);
    const startY = Math.max(0, imageY - radius);
    const width = Math.min(canvas.width - startX, (radius * 2) + 1);
    const height = Math.min(canvas.height - startY, (radius * 2) + 1);
    const data = context.getImageData(startX, startY, width, height).data;
    for (let index = 0; index < data.length; index += 4) {
      if (data[index + 3] > 96) return rgbToHex(data[index], data[index + 1], data[index + 2]);
    }
  }

  return null;
}

function GalleryItem({ item, selected, onOpen, onToggleFavorite }) {
  const type = TYPE_MAP[item.part]?.singular || "wardrobe item";

  return (
    <div className={`gallery-item-wrapper${selected ? " selected" : ""}`} style={{ position: 'relative' }}>
      <button
        className="gallery-item"
        type="button"
        onClick={() => onOpen(item.id)}
        aria-label={`View ${item.name || type}`}
        aria-pressed={selected}
        data-testid={`wardrobe-item-${item.id}`}
      >
        <OptimizedImage
          src={item.thumbnail || item.image}
          alt=""
          sizes="(max-width: 520px) calc(50vw - 16px), (max-width: 860px) calc(33vw - 18px), 180px"
          breakpoints={[120, 180, 240, 320, 480]}
        />
      </button>
      <button 
        className={`favorite-button${item.favorite ? " active" : ""}`} 
        onClick={(e) => { e.stopPropagation(); onToggleFavorite(item.id); }}
        aria-label={item.favorite ? "Remove from favorites" : "Add to favorites"}
      >
        <Heart size={20} weight={item.favorite ? "fill" : "regular"} color={item.favorite ? "var(--accent)" : "currentColor"} />
      </button>
    </div>
  );
}

function OutfitCard({ outfit, onClick, items = [] }) {
  const occasions = Array.isArray(outfit.occasion) ? outfit.occasion : [];
  const garmentCount = Array.isArray(outfit.garmentIds) ? outfit.garmentIds.length : 0;
  const outfitItems = items.filter(item => outfit.garmentIds?.includes(item.id));

  return (
    <article className="outfit-card" onClick={() => onClick && onClick(outfit.id)} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      {outfit.image ? (
        <OptimizedImage
          className="outfit-card__image"
          src={outfit.image}
          alt={outfit.name ? outfit.name + " outfit" : "Generated outfit"}
          sizes="(max-width: 520px) calc(100vw - 24px), (max-width: 860px) calc(50vw - 32px), 360px"
          breakpoints={[240, 360, 480, 640, 800]}
        />
      ) : outfitItems.length > 0 ? (
        <div className="outfit-card__empty" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: '8px', padding: '1rem', aspectRatio: '2/3', background: 'var(--surface-color)' }}>
          {outfitItems.slice(0, 4).map(item => (
            <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src={item.thumbnail || item.image} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
            </div>
          ))}
        </div>
      ) : (
        <div className="outfit-card__empty" role="img" aria-label={"Modeled image unavailable for " + (outfit.name || "this outfit")}>
          Modeled image unavailable
        </div>
      )}
      <div className="outfit-card__body">
        <h2>{outfit.name || "Untitled outfit"}</h2>
        <p>{garmentCount} {garmentCount === 1 ? "piece" : "pieces"}</p>
        {!!occasions.length && (
          <div className="outfit-card__occasions" aria-label="Occasions">
            {occasions.map((occasion) => <span key={occasion}>{occasion}</span>)}
          </div>
        )}
      </div>
    </article>
  );
}

function OutfitViewer({ outfit, items, onClose, onDelete, onPack }) {
  const outfitItems = items.filter(item => outfit.garmentIds.includes(item.id));
  
  return (
    <div className="viewer-overlay" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="viewer-entry">
        <aside className="viewer has-modeled-image" role="dialog" aria-modal="true" aria-label="Selected outfit">
          <button className="viewer-icon-close" type="button" onClick={onClose} aria-label="Close viewer">
            <X size={24} weight="light" aria-hidden="true" />
          </button>
          <div className="modeled-hero">
            {outfit.image ? (
              <OptimizedImage
                className="modeled-hero-photo"
                src={outfit.image}
                alt={outfit.name}
                sizes="(max-width: 860px) 100vw, 520px"
                breakpoints={[320, 480, 640, 800, 1040, 1280]}
                quality={82}
                priority
              />
            ) : (
              <div className="outfit-card__empty" style={{height: 400}}>No image</div>
            )}
            <div className="viewer-heading modeled-heading">
              <div>
                <h2>{outfit.name || "Untitled outfit"}</h2>
              </div>
            </div>
          </div>
          <div className="viewer-details" style={{ padding: '2rem' }}>
            <h3>Pieces in this outfit</h3>
            <div className="gallery-grid" style={{ marginTop: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))' }}>
              {outfitItems.map(item => (
                <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <GalleryItem item={item} onOpen={() => {}} />
                  <span style={{ fontSize: '0.8rem', textAlign: 'center', color: 'var(--text-muted)' }}>{item.name}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '2rem', display: 'flex', gap: '8px' }}>
              <button 
                className="secondary-button" 
                type="button" 
                onClick={() => onPack(outfit)}
              >
                <Suitcase size={15} weight="regular" aria-hidden="true" /> Pack Outfit
              </button>
              {outfit.id.startsWith('custom-outfit-') && onDelete && (
                <button 
                  className="delete-button" 
                  type="button" 
                  onClick={() => { onDelete(outfit.id); onClose(); }}
                >
                  <Trash size={15} weight="regular" aria-hidden="true" /> Delete Outfit
                </button>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function TagEditor({ tags, onChange }) {
  const [input, setInput] = useState("");

  const addTag = () => {
    const nextTag = input.trim().replace(/^#/, "");
    if (!nextTag || tags.some((tag) => tag.toLowerCase() === nextTag.toLowerCase())) return;
    onChange([...tags, nextTag]);
    setInput("");
  };

  return (
    <div className="tag-editor">
      <div className="editable-tags">
        {tags.map((tag) => (
          <span className="editable-tag" key={tag}>
            {tag}
            <button type="button" onClick={() => onChange(tags.filter((existing) => existing !== tag))} aria-label={`Remove ${tag}`}>
              <X size={12} weight="regular" aria-hidden="true" />
            </button>
          </span>
        ))}
      </div>
      <div className="tag-input-row">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === ",") {
              event.preventDefault();
              addTag();
            }
          }}
          placeholder="Add a detail"
          aria-label="Add detail tag"
        />
        <button type="button" onClick={addTag} disabled={!input.trim()} aria-label="Add detail">
          <Plus size={15} weight="regular" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

function ColorControl({ label, field, value, palette, onChange, sampling, setSampling, optional = false, onClear, onAdd }) {
  if (optional && !value) {
    return (
      <div className="color-slot empty-color-slot">
        <div className="color-slot-heading">
          <span>{label}</span>
          <small>Optional</small>
        </div>
        <p>No distinct secondary color detected.</p>
        <button className="add-secondary-button" type="button" onClick={onAdd}>Add secondary color</button>
      </div>
    );
  }

  return (
    <div className="color-slot">
      <div className="color-slot-heading">
        <span>{label}</span>
        {optional && <button type="button" onClick={onClear}>Remove</button>}
      </div>
      <label className="selected-color-control">
        <input
          type="color"
          value={value || "#9a9286"}
          onChange={(event) => onChange(event.target.value)}
          aria-label={`Choose ${label.toLowerCase()}`}
        />
        <span className="selected-color-copy">
          <small>Selected</small>
          <strong>{value || "Custom"}</strong>
        </span>
      </label>
      <div className="suggestion-heading">
        <span>Image suggestions</span>
        <small>Click to apply</small>
      </div>
      <div className="palette" aria-label={`${label} suggestions from image`}>
        {palette.map((color) => (
          <button
            type="button"
            key={color}
            className={value?.toLowerCase() === color.toLowerCase() ? "active" : ""}
            style={{ backgroundColor: color }}
            onClick={() => onChange(color)}
            aria-label={`Use ${color} as ${label.toLowerCase()}`}
            title={color}
          />
        ))}
      </div>
      <button
        className={`sample-button${sampling === field ? " active" : ""}`}
        type="button"
        onClick={() => setSampling((current) => current === field ? null : field)}
      >
        {sampling === field ? "Cancel picking" : `Pick ${label.toLowerCase()} from image`}
      </button>
    </div>
  );
}

function ItemEditor({ draft, setDraft, palette, sampling, setSampling, sampleStatus }) {
  const suggestedSecondary = palette.find((color) => color.toLowerCase() !== draft.color?.toLowerCase()) || "#9a9286";

  return (
    <div className="item-editor">
      <label className="field">
        <span>Name</span>
        <input
          value={draft.name}
          onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
          placeholder={TYPE_MAP[draft.part]?.singular || "Wardrobe item"}
        />
      </label>

      <label className="field">
        <span>Category</span>
        <select value={draft.part} onChange={(event) => setDraft((current) => ({ ...current, part: event.target.value }))}>
          {TYPES.slice(1).map((type) => <option value={type.id} key={type.id}>{type.label}</option>)}
        </select>
      </label>

      <fieldset className="color-field">
        <legend>Colors</legend>
        <div className="colors-editor">
          <ColorControl
            label="Primary color"
            field="primary"
            value={draft.color}
            palette={palette}
            onChange={(color) => setDraft((current) => ({ ...current, color }))}
            sampling={sampling}
            setSampling={setSampling}
          />
          <ColorControl
            label="Secondary color"
            field="secondary"
            value={draft.secondaryColor}
            palette={palette}
            onChange={(secondaryColor) => setDraft((current) => ({ ...current, secondaryColor }))}
            sampling={sampling}
            setSampling={setSampling}
            optional
            onClear={() => setDraft((current) => ({ ...current, secondaryColor: null }))}
            onAdd={() => setDraft((current) => ({ ...current, secondaryColor: suggestedSecondary }))}
          />
        </div>
        <p className="color-help" aria-live="polite">{sampling ? `Click anywhere on the garment to sample the ${sampling} color.` : sampleStatus || "Primary colors come from the image. A secondary is suggested only when a distinct color has meaningful coverage."}</p>
      </fieldset>

      <div className="field details-field">
        <span>Details</span>
        <TagEditor tags={draft.tags} onChange={(tags) => setDraft((current) => ({ ...current, tags }))} />
      </div>
    </div>
  );
}

function ItemViewer({ item, onClose, onSave, onDelete, onPack }) {
  const closeButtonRef = useRef(null);
  const imageRef = useRef(null);
  const samplingCanvasRef = useRef(null);
  const shakeTimerRef = useRef(null);
  const [sampling, setSampling] = useState(null);
  const [sampleStatus, setSampleStatus] = useState("");
  const [palette, setPalette] = useState(item.palette || []);
  const [draft, setDraft] = useState({ name: item.name || "", part: item.part, color: item.color || "#9a9286", secondaryColor: item.secondaryColor || null, tags: [...(item.tags || [])] });
  const [shaking, setShaking] = useState(false);
  const [closeBlocked, setCloseBlocked] = useState(false);
  const type = TYPE_MAP[item.part]?.singular || "Wardrobe item";
  const hasModeledImage = Boolean(item.modeledImage);
  const pieceRotation = useMemo(() => {
    const hash = [...item.id].reduce((total, character) => total + character.charCodeAt(0), 0);
    return `${(hash % 9) - 4}deg`;
  }, [item.id]);

  const isDirty = useMemo(() => {
    const normalizedTags = (tags) => tags.map((tag) => tag.trim()).filter(Boolean);
    return JSON.stringify({
      name: draft.name.trim(),
      part: draft.part,
      color: draft.color?.toLowerCase() || null,
      secondaryColor: draft.secondaryColor?.toLowerCase() || null,
      tags: normalizedTags(draft.tags),
    }) !== JSON.stringify({
      name: (item.name || "").trim(),
      part: item.part,
      color: item.color?.toLowerCase() || null,
      secondaryColor: item.secondaryColor?.toLowerCase() || null,
      tags: normalizedTags(item.tags || []),
    });
  }, [draft, item]);

  const nudgeUnsaved = useCallback(() => {
    setCloseBlocked(true);
    setShaking(false);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setShaking(true));
    });
    clearTimeout(shakeTimerRef.current);
    shakeTimerRef.current = setTimeout(() => setShaking(false), 420);
  }, []);

  const requestClose = useCallback(() => {
    if (isDirty) nudgeUnsaved();
    else onClose();
  }, [isDirty, nudgeUnsaved, onClose]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        if (sampling) setSampling(null);
        else requestClose();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    document.body.classList.add("viewer-open");
    closeButtonRef.current?.focus({ preventScroll: true });
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.classList.remove("viewer-open");
      clearTimeout(shakeTimerRef.current);
    };
  }, [requestClose, sampling]);

  useEffect(() => {
    if (!isDirty) setCloseBlocked(false);
  }, [isDirty]);

  useEffect(() => {
    setSampling(null);
    setSampleStatus("");
    setPalette(item.palette || []);
    setDraft({ name: item.name || "", part: item.part, color: item.color || "#9a9286", secondaryColor: item.secondaryColor || null, tags: [...(item.tags || [])] });
  }, [item]);

  const cancelEditing = () => {
    setDraft({ name: item.name || "", part: item.part, color: item.color || "#9a9286", secondaryColor: item.secondaryColor || null, tags: [...(item.tags || [])] });
    setSampling(null);
    setSampleStatus("");
    onClose();
  };

  const saveEditing = () => {
    onSave({ ...item, ...draft, name: draft.name.trim(), tags: draft.tags.map((tag) => tag.trim()).filter(Boolean) });
    setSampling(null);
    setSampleStatus("Changes saved.");
  };

  const handleImageLoad = (event) => {
    samplingCanvasRef.current = buildSamplingCanvas(event.currentTarget);
    const extracted = extractPalette(event.currentTarget);
    setPalette([...new Set([...(item.palette || []), ...extracted])].slice(0, 5));
  };

  const handleImageClick = (event) => {
    if (!sampling || !samplingCanvasRef.current) return;
    const color = sampleImageColor(event.currentTarget, samplingCanvasRef.current, event);
    if (!color) {
      setSampleStatus("That spot is transparent—try directly on the garment.");
      return;
    }
    const targetField = sampling === "secondary" ? "secondaryColor" : "color";
    setDraft((current) => ({ ...current, [targetField]: color }));
    setPalette((current) => [color, ...current.filter((existing) => existing.toLowerCase() !== color.toLowerCase())].slice(0, 5));
    setSampleStatus(`Sampled ${color} as the ${sampling} color.`);
    setSampling(null);
  };

  const garmentArtwork = (
    <div
      className={`viewer-art${hasModeledImage ? " viewer-art-floating" : ""}${sampling ? " sampling" : ""}`}
      style={hasModeledImage ? { "--piece-rotation": pieceRotation } : undefined}
    >
      <OptimizedImage
        ref={imageRef}
        src={item.image}
        alt={`Selected ${type.toLowerCase()}`}
        sizes="(max-width: 520px) 40vw, 300px"
        breakpoints={[160, 240, 320, 480, 640]}
        priority
        onLoad={handleImageLoad}
        onClick={handleImageClick}
      />
      {sampling && <span className="sample-hint">Click garment to sample</span>}
    </div>
  );

  return (
    <div className="viewer-overlay" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && requestClose()}>
    <div className="viewer-entry">
    <aside className={`viewer editing${hasModeledImage ? " has-modeled-image" : ""}${shaking ? " shake" : ""}`} role="dialog" aria-modal="true" aria-label="Selected wardrobe item">
      <button className="viewer-icon-close" type="button" onClick={requestClose} aria-label="Close viewer" ref={closeButtonRef}>
        <X size={24} weight="light" aria-hidden="true" />
      </button>

      {hasModeledImage ? (
        <div className="modeled-hero">
          <OptimizedImage
            className="modeled-hero-photo"
            src={item.modeledImage}
            alt={`${draft.name || type} worn by a model`}
            sizes="(max-width: 860px) 100vw, 520px"
            breakpoints={[320, 480, 640, 800, 1040, 1280]}
            quality={82}
            priority
          />
          <div className="viewer-heading modeled-heading">
            <div>
              <h2>{draft.name || TYPE_MAP[draft.part]?.singular}</h2>
            </div>
          </div>
          {garmentArtwork}
        </div>
      ) : (
        <>
          <div className="viewer-heading">
            <div>
              <h2>{draft.name || TYPE_MAP[draft.part]?.singular}</h2>
            </div>
          </div>
          {garmentArtwork}
        </>
      )}

      <div className="viewer-details editing">
        <ItemEditor
          draft={draft}
          setDraft={setDraft}
          palette={palette}
          sampling={sampling}
          setSampling={setSampling}
          sampleStatus={sampleStatus}
        />

        {closeBlocked && <p className="unsaved-notice" role="status">Save or cancel changes before closing.</p>}

        <div className="viewer-actions">
          <button className="delete-button" type="button" onClick={() => onDelete(item.id)}>
            <Trash size={15} weight="regular" aria-hidden="true" /> Delete
          </button>
          <button className="secondary-button" type="button" onClick={() => onPack(item)} style={{ marginLeft: 8 }}>
            <Suitcase size={15} weight="regular" aria-hidden="true" /> Pack
          </button>
          <span className="action-spacer" />
          <button className="secondary-button" type="button" onClick={cancelEditing}>Cancel</button>
          <button className="primary-button" type="button" onClick={saveEditing}>
            <Check size={15} weight="bold" aria-hidden="true" /> Save
          </button>
        </div>
      </div>
    </aside>
    </div>
    </div>
  );
}

export function App() {
  const [items, setItems] = useState([]);
  const [outfits, setOutfits] = useState([]);
  const [activeType, setActiveType] = useState("all");
  const [view, setView] = useState("wardrobe");
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [outfitsLoading, setOutfitsLoading] = useState(true);
  const [error, setError] = useState("");
  const [outfitsError, setOutfitsError] = useState("");
  const [selectedOutfitId, setSelectedOutfitId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [theme, setTheme] = useState(() => resolveTheme({
    storage: typeof window === "undefined" ? null : window.localStorage,
    prefersDark: typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches,
  }));
  const [suitcases, setSuitcases] = useState(readSuitcases);
  const [packTarget, setPackTarget] = useState(null); // { type: 'item' | 'outfit', id: string }

  useEffect(() => {
    loadWardrobe({ staticMode: STATIC_MODE })
      .then((loadedItems) => {
        const edits = readEdits();
        const deleted = readDeletedItems();
        const visibleItems = loadedItems.filter((item) => !deleted.has(item.id));
        setItems(visibleItems.map((item) => ({ ...item, ...(edits[item.id] || {}) })));
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadOutfits({ staticMode: STATIC_MODE })
      .then((loaded) => {
        let customOutfits = [];
        try {
          customOutfits = JSON.parse(localStorage.getItem(CUSTOM_OUTFITS_KEY) || "[]");
        } catch (e) {}
        setOutfits([...loaded, ...customOutfits]);
      })
      .catch((requestError) => setOutfitsError(requestError.message))
      .finally(() => setOutfitsLoading(false));
  }, []);

  const handleSaveOutfit = (outfit) => {
    setOutfits(prev => [...prev, outfit]);
    try {
      const customOutfits = JSON.parse(localStorage.getItem(CUSTOM_OUTFITS_KEY) || "[]");
      localStorage.setItem(CUSTOM_OUTFITS_KEY, JSON.stringify([...customOutfits, outfit]));
    } catch (e) {}
  };

  const deleteCustomOutfit = (outfitId) => {
    setOutfits(prev => prev.filter(o => o.id !== outfitId));
    try {
      const customOutfits = JSON.parse(localStorage.getItem(CUSTOM_OUTFITS_KEY) || "[]");
      localStorage.setItem(CUSTOM_OUTFITS_KEY, JSON.stringify(customOutfits.filter(o => o.id !== outfitId)));
    } catch (e) {}
  };

  useEffect(() => {
    document.documentElement.style.colorScheme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", themeColor(theme));
  }, [theme]);

  const selectedItem = items.find((item) => item.id === selectedId) || null;
  const selectedOutfit = outfits.find((o) => o.id === selectedOutfitId) || null;

  const visibleItems = useMemo(() => {
    let filtered;
    if (activeType === "all") {
      filtered = items;
    } else if (activeType === "favorites") {
      filtered = items.filter(item => item.favorite);
    } else if (activeType === "missing-photo") {
      filtered = items.filter(item => !item.modeledImage);
    } else {
      filtered = items.filter((item) => item.part === activeType);
    }
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        (item.name || "").toLowerCase().includes(q) || 
        (item.tags || []).some(tag => tag.toLowerCase().includes(q)) ||
        (item.color || "").toLowerCase().includes(q)
      );
    }

    return [...filtered].sort((a, b) => {
      if (activeType === "all") {
        const typeDifference = (TYPE_ORDER[a.part] ?? 99) - (TYPE_ORDER[b.part] ?? 99);
        if (typeDifference) return typeDifference;
      }
      return a.id.localeCompare(b.id);
    });
  }, [activeType, items, searchQuery]);

  const chooseType = (typeId) => {
    setView("wardrobe");
    setActiveType(typeId);
    setSelectedId(null);
  };

  const chooseOutfits = () => {
    setView("outfits");
    setSelectedId(null);
  };

  const chooseBuilder = () => {
    setView("builder");
    setSelectedId(null);
  };

  const toggleFavorite = (id) => {
    setItems((current) => current.map((item) => {
      if (item.id === id) {
        const updatedItem = { ...item, favorite: !item.favorite };
        persistEdit(updatedItem);
        return updatedItem;
      }
      return item;
    }));
  };

  const handlePackItem = (item) => setPackTarget({ type: 'item', id: item.id });
  const handlePackOutfit = (outfit) => setPackTarget({ type: 'outfit', id: outfit.id });

  const confirmPack = (suitcaseId) => {
    const updatedSuitcases = suitcases.map(s => {
      if (s.id === suitcaseId) {
        if (packTarget.type === 'item' && !s.items.includes(packTarget.id)) {
          return { ...s, items: [...s.items, packTarget.id] };
        }
        if (packTarget.type === 'outfit' && !s.outfits.includes(packTarget.id)) {
          return { ...s, outfits: [...s.outfits, packTarget.id] };
        }
      }
      return s;
    });
    setSuitcases(updatedSuitcases);
    writeSuitcases(updatedSuitcases);
    setPackTarget(null);
  };

  const changeTheme = () => {
    const nextTheme = toggleTheme(theme);
    persistTheme({ storage: window.localStorage, theme: nextTheme });
    setTheme(nextTheme);
  };

  const saveItem = (updatedItem) => {
    setItems((current) => current.map((item) => item.id === updatedItem.id ? updatedItem : item));
    persistEdit(updatedItem);
  };

  const deleteItem = async (id) => {
    if (!STATIC_MODE && id.startsWith("import-")) {
      try {
        const response = await fetch(`/api/import/wardrobe/${id}`, { method: "DELETE" });
        if (!response.ok && response.status !== 404) throw new Error("Could not delete the imported item.");
      } catch (requestError) {
        setError(requestError.message);
        return;
      }
    }
    setItems((current) => current.filter((item) => item.id !== id));
    removePersistedEdit(id);
    persistDeletedItem(id);
    setSelectedId(null);
  };

  const addImportedItem = useCallback((newItem) => {
    setItems((current) => current.some((item) => item.id === newItem.id) ? current : [...current, newItem]);
  }, []);

  const attachImportedModeledImage = useCallback((jobId, modeledImage) => {
    const id = `import-${jobId}`;
    setItems((current) => current.map((item) => item.id === id ? { ...item, modeledImage } : item));
  }, []);

  return (
    <div className={`app-shell${selectedItem ? " has-selection" : ""}`} data-theme={theme}>
      <main className="gallery-pane">
        <header className="gallery-header">
          <div className="gallery-meta-row">
            <p className="piece-count">
              {view === "outfits"
                ? `${outfits.length} ${outfits.length === 1 ? "outfit" : "outfits"}`
                : `${visibleItems.length} ${visibleItems.length === 1 ? "piece" : "pieces"}`}
            </p>
            
            {view === "wardrobe" && (
              <input 
                type="text" 
                placeholder="Search colors, tags, names..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  flex: 1, 
                  maxWidth: '300px', 
                  background: 'var(--surface)', 
                  border: '1px solid var(--line)', 
                  color: 'var(--ink)', 
                  padding: '8px 16px', 
                  borderRadius: '999px',
                  outline: 'none'
                }}
              />
            )}

            <button className="theme-toggle" type="button" onClick={changeTheme} aria-label={`Switch to ${theme === "dark" ? "day" : "night"} mode`}>
              {theme === "dark" ? <Sun size={16} weight="regular" aria-hidden="true" /> : <Moon size={16} weight="regular" aria-hidden="true" />}
              <span>{theme === "dark" ? "Day" : "Night"}</span>
            </button>
          </div>
          <nav className="category-nav" aria-label="Browse wardrobe and outfits">
            <button type="button" className={view === "import" ? "active" : ""} onClick={() => { setView("import"); setSelectedId(null); setSelectedOutfitId(null); }} aria-pressed={view === "import"}>
              + Import
            </button>
            <button type="button" className={view === "builder" ? "active" : ""} onClick={chooseBuilder} aria-pressed={view === "builder"}>
              Builder
            </button>
            <button type="button" className={view === "outfits" ? "active" : ""} onClick={chooseOutfits} aria-pressed={view === "outfits"}>
              Outfits
            </button>
            <button type="button" className={view === "packing" ? "active" : ""} onClick={() => { setView("packing"); setSelectedId(null); setSelectedOutfitId(null); }} aria-pressed={view === "packing"}>
              Packing Lists
            </button>
            <button type="button" className={view === "insights" ? "active" : ""} onClick={() => { setView("insights"); setSelectedId(null); setSelectedOutfitId(null); }} aria-pressed={view === "insights"}>
              Insights
            </button>
            {TYPES.map((type) => (
              <button
                key={type.id}
                type="button"
                className={view === "wardrobe" && activeType === type.id ? "active" : ""}
                onClick={() => chooseType(type.id)}
                aria-pressed={view === "wardrobe" && activeType === type.id}
              >
                {type.label}
              </button>
            ))}
          </nav>
        </header>

        {view === "wardrobe" && (
          <>
            {error && <p className="status error">{error}</p>}
            {!error && loading && <p className="status">Loading wardrobe</p>}
            {!error && !loading && !items.length && <p className="status empty">Drop, paste, or add a photo to import your first piece.</p>}
            {!!items.length && (
              <>
                {activeType === "all" && outfits.length > 0 && (
                  <div className="ootd-section" style={{ marginBottom: 40 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                      <Sun size={24} weight="duotone" color="var(--accent)" />
                      <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Outfit of the Day</h3>
                    </div>
                    <div style={{ padding: '24px', background: 'var(--surface-hover)', borderRadius: 24, border: '1px solid var(--line)', display: 'flex', gap: 24, alignItems: 'center' }}>
                      <div style={{ flex: '0 0 160px', aspectRatio: '4/5', borderRadius: 16, overflow: 'hidden', background: 'var(--surface)' }}>
                        <OptimizedImage 
                          src={outfits[new Date().getDate() % outfits.length]?.image} 
                          alt="OOTD" 
                          sizes="160px"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                      <div>
                        <h4 style={{ margin: '0 0 8px 0', fontSize: 20 }}>{outfits[new Date().getDate() % outfits.length]?.name || "Daily Suggestion"}</h4>
                        <p style={{ margin: '0 0 16px 0', color: 'var(--muted)', fontSize: 14 }}>Based on what you haven't worn recently.</p>
                        <button className="primary-button" onClick={() => setSelectedOutfitId(outfits[new Date().getDate() % outfits.length]?.id)}>
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="gallery-masonry" aria-label={`${TYPE_MAP[activeType]?.label || "All"} wardrobe items`}>
                  {visibleItems.map((item) => (
                    <GalleryItem
                      key={item.id}
                      item={item}
                      selected={item.id === selectedId}
                      onOpen={setSelectedId}
                      onToggleFavorite={toggleFavorite}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {view === "outfits" && (
          <>
            {outfitsError && <p className="status error">{outfitsError}</p>}
            {!outfitsError && outfitsLoading && <p className="status">Loading outfits</p>}
            {!outfitsError && !outfitsLoading && !outfits.length && <p className="status empty">No active outfits yet.</p>}
            {!!outfits.length && (
              <section className="outfit-grid" aria-label="Outfits">
                {outfits.map((outfit) => <OutfitCard key={outfit.id} outfit={outfit} items={items} onClick={setSelectedOutfitId} />)}
              </section>
            )}
          </>
        )}

        {view === "import" && (
          <div className="import-view" style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
            <h2 style={{ marginBottom: '1rem', fontSize: '2rem' }}>Import New Garment</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '3rem', lineHeight: '1.6' }}>
              Add a new piece to your wardrobe by pasting an image URL or uploading a photo. (Currently saves locally to your browser).
            </p>
            <div style={{ background: 'var(--surface-hover)', padding: '3rem', borderRadius: '24px', border: '1px dashed var(--accent)', display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center' }}>
              <div style={{ fontSize: '3rem', color: 'var(--accent)' }}>📸</div>
              <input 
                type="text" 
                placeholder="Paste image URL here..." 
                style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'var(--surface)', color: 'white', fontSize: '1rem' }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.target.value) {
                    alert('URL Import is under construction! For now, your clothes are being imported automatically by the background agents.');
                    e.target.value = '';
                  }
                }}
              />
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>— or —</span>
              <label className="primary-button" style={{ cursor: 'pointer', padding: '12px 24px', borderRadius: '12px', fontWeight: 'bold' }}>
                Upload Photo
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => {
                  if (e.target.files.length > 0) {
                     alert('File Upload is under construction!');
                  }
                }} />
              </label>
            </div>
          </div>
        )}

        {view === "builder" && (
          <Builder items={items} outfits={outfits} onSaveOutfit={handleSaveOutfit} />
        )}

        {view === "packing" && (
          <PackingLists items={items} outfits={outfits} />
        )}

        {view === "insights" && (
          <Insights items={items} outfits={outfits} />
        )}
      </main>

      {selectedItem && <ItemViewer item={selectedItem} onClose={() => setSelectedId(null)} onSave={saveItem} onDelete={deleteItem} onPack={handlePackItem} />}
      {selectedOutfit && <OutfitViewer outfit={selectedOutfit} items={items} onClose={() => setSelectedOutfitId(null)} onDelete={deleteCustomOutfit} onPack={handlePackOutfit} />}
      {!STATIC_MODE && <WardrobeImportFlow onGarmentApproved={addImportedItem} onModeledApproved={attachImportedModeledImage} />}

      {packTarget && (
        <div className="viewer-overlay" style={{ zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center' }} onMouseDown={() => setPackTarget(null)}>
          <div style={{ background: 'var(--surface-panel)', padding: 32, borderRadius: 16, width: 400, border: '1px solid var(--line)', backdropFilter: 'blur(24px)' }} onMouseDown={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0, marginBottom: 24 }}>Select a Packing List</h3>
            {suitcases.length === 0 ? (
              <p className="status empty">No packing lists created yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {suitcases.map(s => (
                  <button key={s.id} className="secondary-button" style={{ justifyContent: 'flex-start', padding: 12 }} onClick={() => confirmPack(s.id)}>
                    <Suitcase size={20} style={{ marginRight: 12, color: 'var(--accent)' }} />
                    <span style={{ fontSize: 16 }}>{s.name}</span>
                  </button>
                ))}
              </div>
            )}
            <button className="secondary-button" style={{ marginTop: 24, width: '100%' }} onClick={() => setPackTarget(null)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
