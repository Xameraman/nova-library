// =================================================================
// NovaEngine.js – The core library for Theme Engine
// =================================================================

(function () {
  'use strict';

  const STORAGE_THEME = 'nova_event_theme';

  const THEMES = {
    dark: {
      name: 'OLED Dark (Default)',
      vars: {
        '--bg': '#09090B',
        '--bg-surface': '#18181B',
        '--bg-surface-hover': '#27272A',
        '--border': '#27272A',
        '--border-light': '#3F3F46',
        '--text-main': '#FAFAFA',
        '--text-muted': '#A1A1AA',
        '--cyan': '#06B6D4'
      }
    },
    light: {
      name: 'Clean Light',
      vars: {
        '--bg': '#F8FAFC',
        '--bg-surface': '#FFFFFF',
        '--bg-surface-hover': '#F1F5F9',
        '--border': '#E2E8F0',
        '--border-light': '#CBD5E1',
        '--text-main': '#0F172A',
        '--text-muted': '#64748B',
        '--cyan': '#0284C7'
      }
    },
    midnight: {
      name: 'Midnight Blue',
      vars: {
        '--bg': '#020617',
        '--bg-surface': '#0F172A',
        '--bg-surface-hover': '#1E293B',
        '--border': '#1E293B',
        '--border-light': '#334155',
        '--text-main': '#F8FAFC',
        '--text-muted': '#94A3B8',
        '--cyan': '#38BDF8'
      }
    },
    cyber: {
      name: 'Cyberpunk Neon',
      vars: {
        '--bg': '#050505',
        '--bg-surface': '#111111',
        '--bg-surface-hover': '#222222',
        '--border': '#333333',
        '--border-light': '#E11D48',
        '--text-main': '#FCEE09',
        '--text-muted': '#999999',
        '--cyan': '#00F0FF'
      }
    }
  };

  function applyTheme(themeKey) {
    const theme = THEMES[themeKey] || THEMES.dark;
    const root = document.documentElement;
    
    Object.entries(theme.vars).forEach(([prop, val]) => {
      root.style.setProperty(prop, val);
    });

    localStorage.setItem(STORAGE_THEME, themeKey);
  }

  function createThemeSettingsSection() {
    const div = document.createElement('div');
    div.className = 'toggle-row';
    
    const current = localStorage.getItem(STORAGE_THEME) || 'dark';
    
    div.innerHTML = `
      <span style="font-weight: 600; font-size: 0.95rem;">Engine Theme</span>
      <select class="modern-select" id="themeEngineSelect" style="padding: 8px 32px 8px 16px;">
        ${Object.entries(THEMES).map(([k, v]) => `<option value="${k}" ${current === k ? 'selected' : ''}>${v.name}</option>`).join('')}
      </select>
    `;
    return div;
  }

  function start() {
    const savedTheme = localStorage.getItem(STORAGE_THEME) || 'dark';
    applyTheme(savedTheme);

    const settingsBody = document.querySelector('#settingsOverlay .modal-body');
    if (settingsBody) {
      // Overwrite the hardcoded theme toggle in HTML with this dynamic one
      const oldThemeRow = settingsBody.querySelector('.toggle-row');
      if(oldThemeRow) oldThemeRow.remove();
      
      settingsBody.insertBefore(createThemeSettingsSection(), settingsBody.firstChild);
      document.getElementById('themeEngineSelect').addEventListener('change', (e) => {
        applyTheme(e.target.value);
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
