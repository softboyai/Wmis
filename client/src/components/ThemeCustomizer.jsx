import { useState, useEffect, useRef } from 'react';
import { Palette, X, RotateCcw, Check } from 'lucide-react';

// Convert hex to HSL
function hexToHsl(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      default: h = ((r - g) / d + 4) / 6;
    }
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function hslToHex(h, s, l) {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = n => { const k = (n + h / 30) % 12; const color = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); return Math.round(255 * color).toString(16).padStart(2, '0'); };
  return `#${f(0)}${f(8)}${f(4)}`;
}

const DEFAULT_COLORS = {
  accent: '#5b6af5',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
};

const COLOR_LABELS = {
  accent: 'Accent (Primary)',
  success: 'Success / In Stock',
  warning: 'Warning / Low Stock',
  danger: 'Danger / Error',
  info: 'Info / Pending',
};

const PRESETS = [
  { name: 'Indigo (Default)', accent: '#5b6af5' },
  { name: 'Blue', accent: '#2563eb' },
  { name: 'Violet', accent: '#7c3aed' },
  { name: 'Rose', accent: '#e11d48' },
  { name: 'Teal', accent: '#0d9488' },
  { name: 'Orange', accent: '#ea580c' },
  { name: 'Cyan', accent: '#0891b2' },
  { name: 'Green', accent: '#16a34a' },
];

function applyColor(name, hex) {
  const root = document.documentElement;
  const [h, s, l] = hexToHsl(hex);
  root.style.setProperty(`--color-${name}`, hex);
  // Generate hover (slightly lighter/darker) and subtle variants
  if (name === 'accent') {
    root.style.setProperty(`--color-accent-hover`, hslToHex(h, s, Math.min(l + 8, 95)));
    root.style.setProperty(`--color-accent-subtle`, `rgba(${parseInt(hex.slice(1,3),16)},${parseInt(hex.slice(3,5),16)},${parseInt(hex.slice(5,7),16)},0.12)`);
  }
  // Apply via CSS custom property + inline Tailwind override trick
  const style = document.getElementById('wmis-custom-colors') || (() => {
    const s = document.createElement('style');
    s.id = 'wmis-custom-colors';
    document.head.appendChild(s);
    return s;
  })();

  const all = JSON.parse(localStorage.getItem('wmis-colors') || '{}');
  all[name] = hex;
  localStorage.setItem('wmis-colors', JSON.stringify(all));

  const rules = Object.entries(all).map(([k, v]) => {
    const [h2,s2,l2] = hexToHsl(v);
    const r = parseInt(v.slice(1,3),16), g2 = parseInt(v.slice(3,5),16), b2 = parseInt(v.slice(5,7),16);
    if (k === 'accent') return `
      .bg-accent, [class~="bg-accent"] { background-color: ${v} !important; }
      .text-accent, [class~="text-accent"] { color: ${v} !important; }
      .border-accent, [class~="border-accent"] { border-color: ${v} !important; }
      .ring-accent, [class~="ring-accent"] { --tw-ring-color: ${v} !important; }
      .hover\\:bg-accent-hover:hover { background-color: ${hslToHex(h2,s2,Math.min(l2+8,95))} !important; }
      .bg-accent\\/10, .bg-accent\\/15, [class*="bg-accent/"] { background-color: rgba(${r},${g2},${b2},0.12) !important; }
      .sidebar-item-active { background-color: rgba(${r},${g2},${b2},0.12) !important; color: ${v} !important; }
      .focus\\:ring-accent\\/40:focus, .focus\\:ring-accent\\/60:focus { --tw-ring-color: rgba(${r},${g2},${b2},0.4) !important; }
    `;
    if (k === 'success') return `
      .text-success { color: ${v} !important; }
      .bg-success\\/10, [class*="bg-success/"] { background-color: rgba(${r},${g2},${b2},0.12) !important; }
      .badge-success { background-color: rgba(${r},${g2},${b2},0.15) !important; color: ${v} !important; }
    `;
    if (k === 'warning') return `
      .text-warning { color: ${v} !important; }
      .bg-warning\\/10, [class*="bg-warning/"] { background-color: rgba(${r},${g2},${b2},0.12) !important; }
      .badge-warning { background-color: rgba(${r},${g2},${b2},0.15) !important; color: ${v} !important; }
    `;
    if (k === 'danger') return `
      .text-danger { color: ${v} !important; }
      .bg-danger\\/10, [class*="bg-danger/"] { background-color: rgba(${r},${g2},${b2},0.12) !important; }
      .badge-danger { background-color: rgba(${r},${g2},${b2},0.15) !important; color: ${v} !important; }
      .input-error { border-color: rgba(${r},${g2},${b2},0.7) !important; }
      .btn-danger { background-color: ${v} !important; }
    `;
    if (k === 'info') return `
      .text-info { color: ${v} !important; }
      .badge-info { background-color: rgba(${r},${g2},${b2},0.15) !important; color: ${v} !important; }
    `;
    return '';
  });
  style.textContent = rules.join('\n');
}

export function loadSavedColors() {
  const saved = JSON.parse(localStorage.getItem('wmis-colors') || '{}');
  Object.entries(saved).forEach(([name, hex]) => applyColor(name, hex));
}

export default function ThemeCustomizer() {
  const [open, setOpen] = useState(false);
  const [colors, setColors] = useState(() => ({
    ...DEFAULT_COLORS,
    ...JSON.parse(localStorage.getItem('wmis-colors') || '{}'),
  }));
  const [appName, setAppName] = useState(() => localStorage.getItem('wmis-app-name') || 'AGL Rwanda');
  const [sidebarTitle, setSidebarTitle] = useState(() => localStorage.getItem('wmis-sidebar-title') || 'WMIS v1.0');
  const panelRef = useRef(null);

  // Load on mount
  useEffect(() => { loadSavedColors(); }, []);

  // Update app names in DOM (simple approach using CSS variable for text)
  useEffect(() => {
    localStorage.setItem('wmis-app-name', appName);
    document.querySelectorAll('[data-app-name]').forEach(el => { el.textContent = appName; });
  }, [appName]);

  useEffect(() => {
    localStorage.setItem('wmis-sidebar-title', sidebarTitle);
    document.querySelectorAll('[data-sidebar-title]').forEach(el => { el.textContent = sidebarTitle; });
  }, [sidebarTitle]);

  const handleColorChange = (name, hex) => {
    setColors(prev => ({ ...prev, [name]: hex }));
    applyColor(name, hex);
  };

  const handlePreset = (preset) => {
    handleColorChange('accent', preset.accent);
  };

  const handleReset = () => {
    setColors(DEFAULT_COLORS);
    localStorage.removeItem('wmis-colors');
    const style = document.getElementById('wmis-custom-colors');
    if (style) style.textContent = '';
  };

  const handleClose = () => setOpen(false);

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 w-10 h-10 rounded-full bg-accent text-white shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
        aria-label="Customize theme colors"
        title="Theme Customizer"
      >
        <Palette className="w-5 h-5" />
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={handleClose}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" aria-hidden />
          <div
            ref={panelRef}
            className="relative w-80 bg-white dark:bg-surface-1 border-l border-gray-100 dark:border-border h-full overflow-y-auto shadow-overlay p-5 space-y-5 animate-slide-in"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-accent" aria-hidden />
                <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Theme Customizer</h2>
              </div>
              <button onClick={handleClose} className="btn-ghost p-1" aria-label="Close customizer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* App name */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-500 uppercase tracking-wide">Branding</h3>
              <div>
                <label className="label">Organization Name</label>
                <input
                  type="text"
                  value={appName}
                  onChange={e => setAppName(e.target.value)}
                  className="input text-sm"
                  placeholder="AGL Rwanda"
                  maxLength={40}
                />
                <p className="text-xs text-gray-400 mt-1">Shown in sidebar and login screen</p>
              </div>
              <div>
                <label className="label">System Title</label>
                <input
                  type="text"
                  value={sidebarTitle}
                  onChange={e => setSidebarTitle(e.target.value)}
                  className="input text-sm"
                  placeholder="WMIS v1.0"
                  maxLength={30}
                />
                <p className="text-xs text-gray-400 mt-1">Sub-title shown in sidebar</p>
              </div>
            </div>

            {/* Preset colors */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-500 uppercase tracking-wide">Accent Presets</h3>
              <div className="grid grid-cols-4 gap-2">
                {PRESETS.map(preset => (
                  <button
                    key={preset.name}
                    onClick={() => handlePreset(preset)}
                    className="relative group flex flex-col items-center gap-1"
                    title={preset.name}
                    aria-label={`Set accent color to ${preset.name}`}
                  >
                    <div
                      className="w-8 h-8 rounded-full border-2 border-white dark:border-surface-2 shadow-sm transition-transform group-hover:scale-110"
                      style={{ backgroundColor: preset.accent }}
                    />
                    {colors.accent === preset.accent && (
                      <div className="absolute inset-0 flex items-start justify-end pr-0">
                        <Check className="w-3 h-3 text-white drop-shadow" />
                      </div>
                    )}
                    <span className="text-[9px] text-gray-400 text-center leading-tight w-full truncate">{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Color pickers — drag to change */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-500 uppercase tracking-wide">
                Colors — click or drag to change
              </h3>
              <p className="text-xs text-gray-400">Click the swatch to open a color picker or drag it to adjust hue.</p>
              {Object.entries(COLOR_LABELS).map(([name, label]) => (
                <ColorSwatch
                  key={name}
                  name={name}
                  label={label}
                  color={colors[name]}
                  onChange={(hex) => handleColorChange(name, hex)}
                />
              ))}
            </div>

            {/* Reset */}
            <div className="pt-2 border-t border-gray-100 dark:border-border">
              <button
                onClick={handleReset}
                className="btn-ghost w-full flex items-center justify-center gap-2 text-sm"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset to defaults
              </button>
            </div>

            <div className="text-xs text-gray-400 text-center">
              Changes apply instantly and persist across sessions.
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Draggable color swatch — drag left/right to change hue
function ColorSwatch({ name, label, color, onChange }) {
  const swatchRef = useRef(null);
  const dragRef = useRef(null);

  const handleDrag = (clientX) => {
    const rect = swatchRef.current?.getBoundingClientRect();
    if (!rect) return;
    const [h, s, l] = hexToHsl(color);
    // Dragging across the full swatch width maps to full hue range (0-360)
    // We use the delta from drag start
    const delta = clientX - dragRef.current.startX;
    const newH = ((h + delta * 1.5) % 360 + 360) % 360;
    onChange(hslToHex(Math.round(newH), s, l));
    dragRef.current.startX = clientX;
  };

  const startDrag = (clientX) => {
    dragRef.current = { startX: clientX };
    const onMove = (e) => handleDrag(e.type === 'touchmove' ? e.touches[0].clientX : e.clientX);
    const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); document.removeEventListener('touchmove', onMove); document.removeEventListener('touchend', onUp); };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    document.addEventListener('touchmove', onMove, { passive: true });
    document.addEventListener('touchend', onUp);
  };

  return (
    <div className="flex items-center gap-3">
      {/* Color swatch — drag to change hue, click for picker */}
      <div className="relative flex-shrink-0">
        <div
          ref={swatchRef}
          className="w-9 h-9 rounded-lg border-2 border-white dark:border-surface-2 shadow cursor-ew-resize transition-transform hover:scale-110"
          style={{ backgroundColor: color }}
          onMouseDown={(e) => { e.preventDefault(); startDrag(e.clientX); }}
          onTouchStart={(e) => startDrag(e.touches[0].clientX)}
          title="Drag left/right to change hue"
          aria-label={`${label} color swatch — drag to change hue`}
        />
        {/* Hidden native color picker triggered on click */}
        <input
          type="color"
          value={color}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          aria-label={`Pick ${label} color`}
          title="Click to open color picker"
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{label}</p>
        <p className="text-xs text-gray-400 font-mono uppercase">{color}</p>
      </div>
    </div>
  );
}
