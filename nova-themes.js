// =================================================================
// NovaEngine.js – The core library for Theme & UI Interactivity
// =================================================================

(function () {
  'use strict';

  const STORAGE_THEME = 'nova_event_theme';
  const STORAGE_FULL = 'nova_event_full';

  // Expanded Theme Engine Options[span_12](start_span)[span_12](end_span)
  const THEMES = {
    default: {
      name: 'Standard Dark',
      vars: {
        '--gold': '#FFD700',
        '--cyan': '#00E5FF',
        '--purple': '#9B59B6'
      }
    },
    winter: {
      name: 'Winter',
      vars: {
        '--gold': '#C62828',
        '--cyan': '#2E7D32',
        '--purple': '#1565C0'
      }
    },
    spooky: {
      name: 'Spooky',
      vars: {
        '--gold': '#FF9800',
        '--cyan': '#7E57C2',
        '--purple': '#4E342E'
      }
    },
    ocean: {
      name: 'Ocean Depths',
      vars: {
        '--gold': '#00B4D8',
        '--cyan': '#0077B6',
        '--purple': '#03045E'
      }
    },
    cyberpunk: {
      name: 'Cyberpunk',
      vars: {
        '--gold': '#FCEE09',
        '--cyan': '#00F0FF',
        '--purple': '#FF003C'
      }
    },
    forest: {
      name: 'Enchanted Forest',
      vars: {
        '--gold': '#A7C957',
        '--cyan': '#386641',
        '--purple': '#6A994E'
      }
    },
    sunset: {
      name: 'Neon Sunset',
      vars: {
        '--gold': '#FFB703',
        '--cyan': '#FB8500',
        '--purple': '#8ECAE6'
      }
    }
  };

  const state = {
    currentTheme: 'default',
    fullEffects: true
  };

  // --- Theme Application ---
  function applyTheme(themeKey, useEffects) {
    const theme = THEMES[themeKey] || THEMES.default;
    const root = document.documentElement;
    
    Object.entries(theme.vars).forEach(([prop, val]) => {
      root.style.setProperty(prop, val);
    });

    state.currentTheme = themeKey;
    state.fullEffects = useEffects;
    localStorage.setItem(STORAGE_THEME, themeKey);
    localStorage.setItem(STORAGE_FULL, useEffects);
  }

  // --- UI Engine Logic ---
  function initUIEngine() {
    console.log("NovaEngine: UI Interactivity Initialized.");
    
    document.addEventListener('click', (e) => {
      if (e.target.matches('.btn-retry-img')) {
        const parent = e.target.closest('.card-img');
        const img = parent.querySelector('img');
        if (img) {
          img.style.display = 'block';
          img.src = img.src.split('?')[0] + '?t=' + Date.now();
          e.target.parentElement.remove();
        }
      }
    });

    const overlays = document.querySelectorAll('.overlay');
    overlays.forEach(o => {
      o.addEventListener('click', (e) => {
        if (e.target === o) o.classList.remove('open');
      });
    });
  }

  function createThemeSettingsSection() {
    const div = document.createElement('div');
    div.className = 'toggle-row';
    div.innerHTML = `
      <span class="toggle-label"><i class="fa-solid fa-palette"></i> Seasonal Theme</span>
      <select class="modern-select" id="themeEngineSelect" style="padding: 8px 30px 8px 12px;">
        ${Object.entries(THEMES).map(([k, v]) => `<option value="${k}" ${state.currentTheme === k ? 'selected' : ''}>${v.name}</option>`).join('')}
      </select>
    `;
    return div;
  }

  function start() {
    state.currentTheme = localStorage.getItem(STORAGE_THEME) || 'default';
    state.fullEffects = localStorage.getItem(STORAGE_FULL) !== 'false';
    
    applyTheme(state.currentTheme, state.fullEffects);
    initUIEngine();

    const settingsBody = document.querySelector('#settingsOverlay .modal-body');
    if (settingsBody) {
      settingsBody.insertBefore(createThemeSettingsSection(), settingsBody.firstChild);
      document.getElementById('themeEngineSelect').addEventListener('change', (e) => {
        applyTheme(e.target.value, state.fullEffects);
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
