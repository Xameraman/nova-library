// ============================================================
// nova-themes.js – Seasonal / Event Theme Engine for Nova’s Library
// Include this file AFTER your main script in index.html
// e.g. <script src="nova-themes.js"></script>
// ============================================================

(function () {
  'use strict';

  const STORAGE_THEME = 'nova_event_theme';
  const STORAGE_FULL = 'nova_event_full';

  const THEMES = {
    none: {
      name: 'None (base theme)',
      emoji: '🎨',
      vars: {},
      particleClass: null,
      particleCount: 0
    },

    christmas: {
      name: 'Christmas',
      emoji: '🎄',
      vars: {
        '--gold': '#d12c2c',
        '--cyan': '#2b8c5a',
        '--purple': '#8f1f4a',
        '--surprise-bg': '#d12c2c',
        '--surprise-text': '#ffffff',
        '--support-btn-bg': '#8f1f4a',
        '--support-btn-text': '#ffffff'
      },
      particleClass: 'nova-snow',
      particleCount: 26,
      overlayClass: 'nova-winter-overlay'
    },

    halloween: {
      name: 'Halloween',
      emoji: '🎃',
      vars: {
        '--gold': '#ff7a18',
        '--cyan': '#7f3fbf',
        '--purple': '#1c1c1c',
        '--surprise-bg': '#ff7a18',
        '--surprise-text': '#ffffff',
        '--support-btn-bg': '#7f3fbf',
        '--support-btn-text': '#ffffff'
      },
      particleClass: 'nova-ember',
      particleCount: 22,
      overlayClass: 'nova-halloween-overlay'
    },

    easter: {
      name: 'Easter',
      emoji: '🐣',
      vars: {
        '--gold': '#ffb7d5',
        '--cyan': '#d9a4ff',
        '--purple': '#f6e9ff',
        '--surprise-bg': '#ffb7d5',
        '--surprise-text': '#2a2a2a',
        '--support-btn-bg': '#b56adf',
        '--support-btn-text': '#ffffff'
      },
      particleClass: 'nova-petal',
      particleCount: 20,
      overlayClass: 'nova-easter-overlay'
    },

    newyear: {
      name: 'New Year',
      emoji: '🎆',
      vars: {
        '--gold': '#ffd700',
        '--cyan': '#c0c0c0',
        '--purple': '#111111',
        '--surprise-bg': '#ffd700',
        '--surprise-text': '#111111',
        '--support-btn-bg': '#111111',
        '--support-btn-text': '#ffffff'
      },
      particleClass: 'nova-spark',
      particleCount: 28,
      overlayClass: 'nova-newyear-overlay'
    },

    valentine: {
      name: 'Valentine’s Day',
      emoji: '❤️',
      vars: {
        '--gold': '#ff4d8d',
        '--cyan': '#ff7eb6',
        '--purple': '#fff0f6',
        '--surprise-bg': '#ff4d8d',
        '--surprise-text': '#ffffff',
        '--support-btn-bg': '#c61f5a',
        '--support-btn-text': '#ffffff'
      },
      particleClass: 'nova-heartdust',
      particleCount: 20,
      overlayClass: 'nova-valentine-overlay'
    },

    patrick: {
      name: 'St. Patrick’s Day',
      emoji: '☘️',
      vars: {
        '--gold': '#1f9d55',
        '--cyan': '#f6c445',
        '--purple': '#f7fff9',
        '--surprise-bg': '#1f9d55',
        '--surprise-text': '#ffffff',
        '--support-btn-bg': '#1f9d55',
        '--support-btn-text': '#ffffff'
      },
      particleClass: 'nova-cloverdust',
      particleCount: 18,
      overlayClass: 'nova-patrick-overlay'
    }
  };

  const state = {
    currentTheme: localStorage.getItem(STORAGE_THEME) || 'none',
    fullEffects: localStorage.getItem(STORAGE_FULL) === 'true',
    themeStyleTag: null,
    effectStyleTag: null,
    overlay: null,
    observer: null
  };

  const ALL_VARS = [...new Set(
    Object.values(THEMES).flatMap(t => Object.keys(t.vars || {}))
  )];

  function getAutoEvent() {
    const now = new Date();
    const m = now.getMonth() + 1;
    const d = now.getDate();

    if (m === 12 && d >= 20) return 'christmas';
    if (m === 1 && d <= 3) return 'newyear';
    if (m === 10 && d >= 25) return 'halloween';
    if (m === 3 && d >= 15 && d <= 17) return 'patrick';
    if (m === 4 && d >= 1 && d <= 20) return 'easter';
    if (m === 2 && d >= 10 && d <= 18) return 'valentine';
    return 'none';
  }

  function removeActiveTheme() {
    if (state.themeStyleTag) {
      state.themeStyleTag.remove();
      state.themeStyleTag = null;
    }

    if (state.effectStyleTag) {
      state.effectStyleTag.remove();
      state.effectStyleTag = null;
    }

    if (state.overlay) {
      state.overlay.remove();
      state.overlay = null;
    }

    if (state.observer) {
      state.observer.disconnect();
      state.observer = null;
    }

    const root = document.documentElement;
    ALL_VARS.forEach(v => root.style.removeProperty(v));
    root.removeAttribute('data-nova-event-theme');
  }

  function applyVars(vars) {
    const root = document.documentElement;
    ALL_VARS.forEach(v => root.style.removeProperty(v));

    for (const [key, value] of Object.entries(vars || {})) {
      root.style.setProperty(key, value);
    }
  }

  function buildThemeBaseCSS(themeKey) {
    return `
      html[data-nova-event-theme="${themeKey}"] {
        transition: background-color 0.25s ease, color 0.25s ease, filter 0.25s ease;
      }

      html[data-nova-event-theme="${themeKey}"] .btn-support,
      html[data-nova-event-theme="${themeKey}"] .btn-modal-support,
      html[data-nova-event-theme="${themeKey}"] .btn-archive,
      html[data-nova-event-theme="${themeKey}"] .btn-modal-archive {
        background: var(--support-btn-bg) !important;
        color: var(--support-btn-text) !important;
        text-shadow: none !important;
      }

      html[data-nova-event-theme="${themeKey}"] .btn-support:hover,
      html[data-nova-event-theme="${themeKey}"] .btn-modal-support:hover,
      html[data-nova-event-theme="${themeKey}"] .btn-archive:hover,
      html[data-nova-event-theme="${themeKey}"] .btn-modal-archive:hover {
        filter: brightness(1.06);
      }

      html[data-nova-event-theme="${themeKey}"] .discord-btn {
        box-shadow: 0 8px 18px rgba(0,0,0,0.12);
      }

      html[data-nova-event-theme="${themeKey}"] .search-box,
      html[data-nova-event-theme="${themeKey}"] .pack-card,
      html[data-nova-event-theme="${themeKey}"] .modal {
        backdrop-filter: blur(3px);
      }
    `;
  }

  function ensureEffectCSS() {
    if (state.effectStyleTag) return;

    const style = document.createElement('style');
    style.id = 'nova-event-effect-style';
    style.textContent = `
      .nova-theme-overlay {
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 9998;
        overflow: hidden;
      }

      .nova-theme-particle {
        position: absolute;
        user-select: none;
        pointer-events: none;
        will-change: transform, opacity;
        opacity: 0.8;
      }

      @keyframes novaFall {
        0%   { transform: translate3d(0, -12vh, 0) rotate(0deg); opacity: 0; }
        10%  { opacity: 1; }
        100% { transform: translate3d(18px, 112vh, 0) rotate(360deg); opacity: 0; }
      }

      @keyframes novaRise {
        0%   { transform: translate3d(0, 112vh, 0) rotate(0deg); opacity: 0; }
        10%  { opacity: 1; }
        100% { transform: translate3d(-18px, -12vh, 0) rotate(-360deg); opacity: 0; }
      }

      .nova-snow {
        width: 6px;
        height: 6px;
        border-radius: 999px;
        background: rgba(255,255,255,0.95);
        box-shadow: 0 0 12px rgba(255,255,255,0.35);
        animation: novaFall linear infinite;
      }

      .nova-ember {
        width: 10px;
        height: 10px;
        border-radius: 2px;
        background: rgba(255,122,24,0.95);
        box-shadow: 0 0 16px rgba(255,122,24,0.3);
        animation: novaRise linear infinite;
      }

      .nova-petal {
        width: 10px;
        height: 14px;
        border-radius: 50% 50% 50% 0;
        background: rgba(255,182,213,0.95);
        box-shadow: 0 0 12px rgba(255,182,213,0.25);
        animation: novaFall linear infinite;
      }

      .nova-spark {
        width: 4px;
        height: 4px;
        border-radius: 999px;
        background: rgba(255,215,0,0.98);
        box-shadow:
          0 0 8px rgba(255,215,0,0.45),
          0 0 18px rgba(255,215,0,0.15);
        animation: novaFall linear infinite;
      }

      .nova-heartdust {
        width: 8px;
        height: 8px;
        transform: rotate(45deg);
        background: rgba(255,95,143,0.95);
        box-shadow: 0 0 12px rgba(255,95,143,0.28);
        animation: novaRise linear infinite;
      }

      .nova-heartdust::before,
      .nova-heartdust::after {
        content: '';
        position: absolute;
        width: 8px;
        height: 8px;
        border-radius: 999px;
        background: inherit;
      }
      .nova-heartdust::before { top: -4px; left: 0; }
      .nova-heartdust::after { top: 0; left: -4px; }

      .nova-cloverdust {
        width: 10px;
        height: 10px;
        background:
          radial-gradient(circle at 30% 30%, rgba(80,200,120,0.95) 0 46%, transparent 47%),
          radial-gradient(circle at 70% 30%, rgba(80,200,120,0.95) 0 46%, transparent 47%),
          radial-gradient(circle at 30% 70%, rgba(80,200,120,0.95) 0 46%, transparent 47%),
          radial-gradient(circle at 70% 70%, rgba(80,200,120,0.95) 0 46%, transparent 47%);
        filter: drop-shadow(0 0 8px rgba(80,200,120,0.22));
        animation: novaFall linear infinite;
      }

      html[data-nova-event-theme="christmas"] body::before,
      html[data-nova-event-theme="halloween"] body::before,
      html[data-nova-event-theme="easter"] body::before,
      html[data-nova-event-theme="newyear"] body::before,
      html[data-nova-event-theme="valentine"] body::before,
      html[data-nova-event-theme="patrick"] body::before {
        content: '';
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 0;
        background:
          radial-gradient(circle at top, rgba(255,255,255,0.05), transparent 45%);
      }

      html[data-nova-event-theme="christmas"] header {
        box-shadow: inset 0 -1px 0 rgba(255,255,255,0.08);
      }

      html[data-nova-event-theme="halloween"] header {
        box-shadow: inset 0 -1px 0 rgba(255,255,255,0.04);
      }

      html[data-nova-event-theme="newyear"] .aurora-text,
      html[data-nova-event-theme="christmas"] .aurora-text {
        filter: saturate(1.08);
      }
    `;
    document.head.appendChild(style);
    state.effectStyleTag = style;
  }

  function spawnParticles(themeKey) {
    const theme = THEMES[themeKey];
    if (!theme || !theme.particleClass || !theme.particleCount) return;

    ensureEffectCSS();

    const overlay = document.createElement('div');
    overlay.className = 'nova-theme-overlay';
    overlay.id = 'nova-event-overlay';

    const frag = document.createDocumentFragment();

    for (let i = 0; i < theme.particleCount; i++) {
      const el = document.createElement('div');
      el.className = `nova-theme-particle ${theme.particleClass}`;

      el.style.left = Math.random() * 100 + 'vw';
      el.style.animationDelay = (Math.random() * 4) + 's';
      el.style.animationDuration = (Math.random() * 5 + 6) + 's';

      if (themeKey === 'newyear') {
        el.style.transform = `scale(${(Math.random() * 0.7 + 0.7).toFixed(2)})`;
      } else {
        el.style.transform = `scale(${(Math.random() * 0.8 + 0.5).toFixed(2)})`;
      }

      frag.appendChild(el);
    }

    overlay.appendChild(frag);
    document.body.appendChild(overlay);
    state.overlay = overlay;
  }

  function applyTheme(themeKey, withFull) {
    removeActiveTheme();

    if (!themeKey || themeKey === 'none' || !THEMES[themeKey]) {
      return;
    }

    const theme = THEMES[themeKey];
    document.documentElement.setAttribute('data-nova-event-theme', themeKey);

    applyVars(theme.vars);

    const style = document.createElement('style');
    style.id = 'nova-event-theme-style';
    style.textContent = buildThemeBaseCSS(themeKey);
    document.head.appendChild(style);
    state.themeStyleTag = style;

    if (withFull) {
      spawnParticles(themeKey);
    }
  }

  function createThemeSettingsSection() {
    const section = document.createElement('div');
    section.className = 'settings-section';
    section.id = 'nova-event-theme-section';

    section.innerHTML = `
      <h4>Event Theme</h4>

      <select id="eventThemeSelect" style="width:100%; margin-bottom:8px;">
        ${Object.entries(THEMES).map(([key, theme]) =>
          `<option value="${key}">${theme.emoji} ${theme.name}</option>`
        ).join('')}
      </select>

      <label class="toggle-label" style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
        <input type="checkbox" id="fullEffectsToggle">
        <span>Full visual effects (lighter on low-end devices)</span>
      </label>

      <button id="autoEventThemeBtn" type="button" style="width:100%; margin-bottom:8px;">
        Auto-detect current event
      </button>

      <p style="font-size:0.75rem; color:var(--muted);">
        Auto-detect picks the nearest seasonal theme. Manual selection still works.
      </p>
    `;

    return section;
  }

  function bindSettingsSection(section) {
    const select = section.querySelector('#eventThemeSelect');
    const fullToggle = section.querySelector('#fullEffectsToggle');
    const autoBtn = section.querySelector('#autoEventThemeBtn');

    if (!select || !fullToggle || !autoBtn) return;

    select.value = state.currentTheme;
    fullToggle.checked = state.fullEffects;

    select.addEventListener('change', () => {
      state.currentTheme = select.value;
      localStorage.setItem(STORAGE_THEME, state.currentTheme);
      applyTheme(state.currentTheme, state.fullEffects);
    });

    fullToggle.addEventListener('change', () => {
      state.fullEffects = fullToggle.checked;
      localStorage.setItem(STORAGE_FULL, String(state.fullEffects));
      applyTheme(state.currentTheme, state.fullEffects);
    });

    autoBtn.addEventListener('click', () => {
      const autoTheme = getAutoEvent();
      state.currentTheme = autoTheme;
      localStorage.setItem(STORAGE_THEME, state.currentTheme);
      select.value = autoTheme;
      applyTheme(state.currentTheme, state.fullEffects);
    });
  }

  function injectSettingsUI() {
    const existing = document.getElementById('nova-event-theme-section');
    if (existing) return;

    const attach = () => {
      const settingsBody = document.querySelector('#settingsOverlay .modal-body');
      if (!settingsBody) return false;

      const section = createThemeSettingsSection();
      const lastSection = settingsBody.querySelector('.settings-section:last-of-type');

      if (lastSection) {
        settingsBody.insertBefore(section, lastSection);
      } else {
        settingsBody.appendChild(section);
      }

      bindSettingsSection(section);
      return true;
    };

    if (attach()) return;

    const observer = new MutationObserver(() => {
      if (attach()) observer.disconnect();
    });

    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  function initDefaults() {
    const hasStoredTheme = localStorage.getItem(STORAGE_THEME) !== null;
    if (!hasStoredTheme) {
      const auto = getAutoEvent();
      state.currentTheme = auto;
      localStorage.setItem(STORAGE_THEME, auto);
    }

    state.fullEffects = localStorage.getItem(STORAGE_FULL) === 'true';
  }

  function start() {
    initDefaults();
    injectSettingsUI();
    applyTheme(state.currentTheme, state.fullEffects);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
