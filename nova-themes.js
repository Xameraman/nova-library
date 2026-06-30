// ============================================================
//  nova-themes.js – Event / Holiday Theme Engine for Nova’s Library
//  Include this file AFTER your main script in index.html
//  e.g.  <script src="nova-themes.js"></script>
// ============================================================

(function () {
  'use strict';

  const STORAGE_THEME = 'nova_event_theme';
  const STORAGE_FULL = 'nova_event_full';

  const THEMES = {
    none: {
      name: 'None (use base theme)',
      emoji: '🎨',
      vars: {},
      decorations: []
    },

    christmas: {
      name: '🎄 Christmas',
      emoji: '🎄',
      vars: {
        '--gold': '#D7263D',
        '--cyan': '#2E8B57',
        '--purple': '#FFD700',
        '--surprise-bg': '#D7263D',
        '--surprise-text': '#ffffff'
      },
      decorations: ['❄️', '🎄', '✨']
    },

    halloween: {
      name: '🎃 Halloween',
      emoji: '🎃',
      vars: {
        '--gold': '#FF7A18',
        '--cyan': '#7B2CBF',
        '--purple': '#1B1B1B',
        '--surprise-bg': '#FF7A18',
        '--surprise-text': '#ffffff'
      },
      decorations: ['🎃', '🦇', '👻']
    },

    easter: {
      name: '🐣 Easter',
      emoji: '🐣',
      vars: {
        '--gold': '#FFB6C1',
        '--cyan': '#DDA0DD',
        '--purple': '#FFF6CC',
        '--surprise-bg': '#FFB6C1',
        '--surprise-text': '#2b2b2b'
      },
      decorations: ['🥚', '🐣', '🌸']
    },

    newyear: {
      name: '🎆 New Year',
      emoji: '🎆',
      vars: {
        '--gold': '#FFD700',
        '--cyan': '#C0C0C0',
        '--purple': '#121212',
        '--surprise-bg': '#FFD700',
        '--surprise-text': '#121212'
      },
      decorations: ['🎆', '✨', '🎇']
    },

    valentine: {
      name: '❤️ Valentine’s Day',
      emoji: '❤️',
      vars: {
        '--gold': '#FF4D8D',
        '--cyan': '#FF7EB6',
        '--purple': '#FFF0F6',
        '--surprise-bg': '#FF4D8D',
        '--surprise-text': '#ffffff'
      },
      decorations: ['❤️', '💘', '💕']
    },

    patrick: {
      name: '☘️ St. Patrick’s Day',
      emoji: '☘️',
      vars: {
        '--gold': '#1F9D55',
        '--cyan': '#FFD700',
        '--purple': '#F4FFF8',
        '--surprise-bg': '#1F9D55',
        '--surprise-text': '#ffffff'
      },
      decorations: ['☘️', '🍀', '✨']
    }
  };

  const state = {
    currentTheme: localStorage.getItem(STORAGE_THEME) || 'none',
    fullEffects: localStorage.getItem(STORAGE_FULL) === 'true',
    styleTag: null,
    decoStyleTag: null,
    decoContainer: null,
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

  function removeThemeEffects() {
    if (state.styleTag) {
      state.styleTag.remove();
      state.styleTag = null;
    }
    if (state.decoStyleTag) {
      state.decoStyleTag.remove();
      state.decoStyleTag = null;
    }
    if (state.decoContainer) {
      state.decoContainer.remove();
      state.decoContainer = null;
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

  function spawnDecorations(themeKey, container) {
    const theme = THEMES[themeKey];
    if (!theme || !theme.decorations || !theme.decorations.length) return;

    const count = 18;
    const frag = document.createDocumentFragment();

    for (let i = 0; i < count; i++) {
      const el = document.createElement('div');
      const symbol = theme.decorations[Math.floor(Math.random() * theme.decorations.length)];

      el.className = 'nova-theme-deco';
      el.textContent = symbol;
      el.style.left = Math.random() * 100 + 'vw';
      el.style.top = '-10vh';
      el.style.fontSize = (Math.random() * 0.9 + 0.9) + 'rem';
      el.style.animationDelay = (Math.random() * 4) + 's';
      el.style.animationDuration = (Math.random() * 5 + 6) + 's';
      el.style.opacity = String(Math.random() * 0.5 + 0.45);
      el.style.transform = `rotate(${Math.random() * 360}deg)`;

      frag.appendChild(el);
    }

    container.appendChild(frag);
  }

  function ensureDecorationStyles() {
    if (state.decoStyleTag) return;

    const style = document.createElement('style');
    style.id = 'nova-event-deco-style';
    style.textContent = `
      @keyframes novaFloatDown {
        0%   { transform: translateY(-10vh) translateX(0) rotate(0deg); opacity: 0; }
        10%  { opacity: 1; }
        100% { transform: translateY(110vh) translateX(16px) rotate(360deg); opacity: 0; }
      }

      @keyframes novaFloatUp {
        0%   { transform: translateY(110vh) translateX(0) rotate(0deg); opacity: 0; }
        10%  { opacity: 1; }
        100% { transform: translateY(-20vh) translateX(-16px) rotate(-360deg); opacity: 0; }
      }

      .nova-theme-overlay {
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 9998;
        overflow: hidden;
      }

      .nova-theme-deco {
        position: absolute;
        user-select: none;
        pointer-events: none;
        filter: drop-shadow(0 4px 10px rgba(0,0,0,0.15));
        animation-name: novaFloatDown;
        animation-timing-function: linear;
        animation-iteration-count: infinite;
      }

      .nova-theme-deco.nova-up {
        animation-name: novaFloatUp;
      }
    `;
    document.head.appendChild(style);
    state.decoStyleTag = style;
  }

  function applyTheme(themeKey, withFull) {
    removeThemeEffects();

    if (!themeKey || themeKey === 'none' || !THEMES[themeKey]) {
      return;
    }

    const theme = THEMES[themeKey];
    document.documentElement.setAttribute('data-nova-event-theme', themeKey);

    applyVars(theme.vars);

    state.styleTag = document.createElement('style');
    state.styleTag.id = 'nova-event-theme-style';
    state.styleTag.textContent = `
      /* Theme ${themeKey} */
      html[data-nova-event-theme="${themeKey}"] {
        transition: filter 0.25s ease, background-color 0.25s ease, color 0.25s ease;
      }
    `;
    document.head.appendChild(state.styleTag);

    if (withFull) {
      ensureDecorationStyles();

      const container = document.createElement('div');
      container.className = 'nova-theme-overlay';
      container.id = 'nova-event-overlay';
      document.body.appendChild(container);
      state.decoContainer = container;

      spawnDecorations(themeKey, container);
    }
  }

  function createThemeSettingsSection() {
    const section = document.createElement('div');
    section.className = 'settings-section';
    section.id = 'nova-event-theme-section';

    section.innerHTML = `
      <h4>🎨 Event Theme</h4>

      <select id="eventThemeSelect" style="width:100%; margin-bottom:8px;">
        ${Object.entries(THEMES).map(([key, theme]) =>
          `<option value="${key}">${theme.emoji} ${theme.name}</option>`
        ).join('')}
      </select>

      <label class="toggle-label" style="margin-bottom:8px; display:flex; gap:8px; align-items:center;">
        <input type="checkbox" id="fullEffectsToggle">
        <span>✨ Full visual effects (may lag on slow devices)</span>
      </label>

      <button id="autoEventThemeBtn" style="width:100%; margin-bottom:8px;">
        Auto-detect current event
      </button>

      <p style="font-size:0.75rem; color:var(--muted); margin-top:4px;">
        Auto-detect uses the nearest holiday. You can still override it manually.
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

    const tryInsert = () => {
      const settingsBody = document.querySelector('#settingsOverlay .modal-body');
      if (!settingsBody) return false;

      const section = createThemeSettingsSection();

      const marker = settingsBody.querySelector('.settings-section:last-of-type');
      if (marker && marker.parentNode === settingsBody) {
        settingsBody.insertBefore(section, marker);
      } else {
        settingsBody.appendChild(section);
      }

      bindSettingsSection(section);
      return true;
    };

    if (tryInsert()) return;

    const observer = new MutationObserver(() => {
      if (tryInsert()) observer.disconnect();
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
