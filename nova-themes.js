// =================================================================
// NovaEngine.js – Premium Theme Engine
// =================================================================
(function () {
  'use strict';

  const STORAGE_THEME = 'nova_event_theme';

  const THEMES = {
    dark: { name: 'OLED Dark', vars: { '--bg': '#09090B', '--bg-surface': '#18181B', '--bg-surface-hover': '#27272A', '--border': '#27272A', '--border-light': '#3F3F46', '--text-main': '#FAFAFA', '--text-muted': '#A1A1AA', '--cyan': '#06B6D4', '--cyan-glow': 'rgba(6, 182, 212, 0.25)', '--gold': '#F59E0B', '--gold-glow': 'rgba(245, 158, 11, 0.2)', '--purple': '#8B5CF6', '--featured-pink': '#EC4899', '--overlay-rgb': '0, 0, 0' } },
    pureblack: { name: 'Pure Black', vars: { '--bg': '#000000', '--bg-surface': '#0A0A0A', '--bg-surface-hover': '#1A1A1A', '--border': '#262626', '--border-light': '#404040', '--text-main': '#FFFFFF', '--text-muted': '#A0A0A0', '--cyan': '#22D3EE', '--cyan-glow': 'rgba(34, 211, 238, 0.25)', '--gold': '#F59E0B', '--gold-glow': 'rgba(245, 158, 11, 0.2)', '--purple': '#8B5CF6', '--featured-pink': '#EC4899', '--overlay-rgb': '0, 0, 0' } },
    midnight: { name: 'Midnight Blue', vars: { '--bg': '#020617', '--bg-surface': '#0F172A', '--bg-surface-hover': '#1E293B', '--border': '#1E293B', '--border-light': '#334155', '--text-main': '#F8FAFC', '--text-muted': '#94A3B8', '--cyan': '#38BDF8', '--cyan-glow': 'rgba(56, 189, 248, 0.25)', '--gold': '#F59E0B', '--gold-glow': 'rgba(245, 158, 11, 0.2)', '--purple': '#8B5CF6', '--featured-pink': '#EC4899', '--overlay-rgb': '2, 6, 23' } },
    aurora: { name: 'Aurora Teal', vars: { '--bg': '#042F2E', '--bg-surface': '#134E4A', '--bg-surface-hover': '#1E6F6B', '--border': '#115E59', '--border-light': '#2DD4BF', '--text-main': '#ECFDF5', '--text-muted': '#99F6E4', '--cyan': '#2DD4BF', '--cyan-glow': 'rgba(45, 212, 191, 0.25)', '--gold': '#F59E0B', '--gold-glow': 'rgba(245, 158, 11, 0.2)', '--purple': '#8B5CF6', '--featured-pink': '#EC4899', '--overlay-rgb': '4, 47, 46' } },
    cyber: { name: 'Cyber Neon', vars: { '--bg': '#050505', '--bg-surface': '#111111', '--bg-surface-hover': '#222222', '--border': '#333333', '--border-light': '#E11D48', '--text-main': '#FCEE09', '--text-muted': '#999999', '--cyan': '#00F0FF', '--cyan-glow': 'rgba(0, 240, 255, 0.3)', '--gold': '#FCEE09', '--gold-glow': 'rgba(252, 238, 9, 0.3)', '--purple': '#8B5CF6', '--featured-pink': '#EC4899', '--overlay-rgb': '5, 5, 5' } },
    sunset: { name: 'Sunset Luxe', vars: { '--bg': '#1A0C0C', '--bg-surface': '#2D1A1A', '--bg-surface-hover': '#3E2626', '--border': '#3E2626', '--border-light': '#FB923C', '--text-main': '#FFFBEB', '--text-muted': '#FED7AA', '--cyan': '#F97316', '--cyan-glow': 'rgba(249, 115, 22, 0.25)', '--gold': '#F59E0B', '--gold-glow': 'rgba(245, 158, 11, 0.2)', '--purple': '#8B5CF6', '--featured-pink': '#EC4899', '--overlay-rgb': '26, 12, 12' } },
    forest: { name: 'Forest Elite', vars: { '--bg': '#0B1E11', '--bg-surface': '#1A3B27', '--bg-surface-hover': '#2B543A', '--border': '#2B543A', '--border-light': '#4ADE80', '--text-main': '#F0FDF4', '--text-muted': '#BBF7D0', '--cyan': '#4ADE80', '--cyan-glow': 'rgba(74, 222, 128, 0.25)', '--gold': '#F59E0B', '--gold-glow': 'rgba(245, 158, 11, 0.2)', '--purple': '#8B5CF6', '--featured-pink': '#EC4899', '--overlay-rgb': '11, 30, 17' } },
    rosegold: { name: 'Rose Gold', vars: { '--bg': '#1C0F13', '--bg-surface': '#2D1F23', '--bg-surface-hover': '#3E2E32', '--border': '#3E2E32', '--border-light': '#FDA4AF', '--text-main': '#FFF1F2', '--text-muted': '#FECDD3', '--cyan': '#FB7185', '--cyan-glow': 'rgba(251, 113, 133, 0.25)', '--gold': '#F59E0B', '--gold-glow': 'rgba(245, 158, 11, 0.2)', '--purple': '#8B5CF6', '--featured-pink': '#EC4899', '--overlay-rgb': '28, 15, 19' } },
    light: { name: 'Clean Light', vars: { '--bg': '#F8FAFC', '--bg-surface': '#FFFFFF', '--bg-surface-hover': '#F1F5F9', '--border': '#E2E8F0', '--border-light': '#CBD5E1', '--text-main': '#0F172A', '--text-muted': '#64748B', '--cyan': '#0284C7', '--cyan-glow': 'rgba(2, 132, 199, 0.25)', '--gold': '#F59E0B', '--gold-glow': 'rgba(245, 158, 11, 0.2)', '--purple': '#8B5CF6', '--featured-pink': '#EC4899', '--overlay-rgb': '15, 23, 42' } }
  };

  const root = document.documentElement;

  function applyTheme(themeKey) {
    const theme = THEMES[themeKey] || THEMES.dark;
    
    // Prevent FOUC during transition by ensuring the root applies swiftly
    requestAnimationFrame(() => {
      Object.entries(theme.vars).forEach(([prop, val]) => {
        root.style.setProperty(prop, val);
      });
      root.setAttribute('data-theme', themeKey === 'light' ? 'light' : 'dark');
    });
    
    localStorage.setItem(STORAGE_THEME, themeKey);
  }

  function createThemeSettingsSection() {
    const div = document.createElement('div');
    div.className = 'toggle-row';
    const current = localStorage.getItem(STORAGE_THEME) || 'dark';
    
    // Premium select box UI injection
    div.innerHTML = `
      <span style="font-weight:700;font-size:1.05rem;">Engine Theme</span>
      <select class="modern-select" id="themeEngineSelect" style="padding:10px 40px 10px 20px;">
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
      const oldThemeRow = document.getElementById('themeSelect')?.closest('.toggle-row');
      if (oldThemeRow) oldThemeRow.remove();

      if (!document.getElementById('themeEngineSelect')) {
        settingsBody.insertBefore(createThemeSettingsSection(), settingsBody.firstChild);
      }

      const engineSelect = document.getElementById('themeEngineSelect');
      if (engineSelect) {
        engineSelect.addEventListener('change', (e) => applyTheme(e.target.value));
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
