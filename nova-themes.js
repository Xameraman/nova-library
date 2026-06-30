// ============================================================
//  nova-themes.js – Event / Holiday Theme Engine for Nova’s Library
//  Include this file AFTER your main script in index.html
//  e.g.  <script src="nova-themes.js"></script>
// ============================================================

(function () {
  'use strict';

  /* -----------------------------------------------
   | 1. Theme definitions (colours + decorations)
   ----------------------------------------------- */
  const THEMES = {
    none: {
      name: 'None (use base theme)',
      emoji: '🎨',
      // no overrides – returns empty string
      css: () => '',
      decorations: false
    },
    christmas: {
      name: '🎄 Christmas',
      emoji: '🎄',
      css: () => `
        /* Christmas colour overrides */
        :root {
          --gold: #B22222;        /* deep red */
          --cyan: #2E8B57;       /* forest green */
          --purple: #FFD700;     /* gold */
          --surprise-bg: #B22222;
          --surprise-text: #fff;
        }
        /* Snowflake background (full effects only) */
        .nova-snowflakes {
          position: fixed; top:0; left:0; width:100%; height:100%;
          pointer-events: none; z-index: 9999;
          background: transparent;
        }
      `,
      decorations: true,
      fullCSS: () => `
        @keyframes snow {
          0% { transform: translateY(-10vh) rotate(0deg); opacity:1; }
          100% { transform: translateY(110vh) rotate(360deg); opacity:0; }
        }
        .snowflake {
          position: absolute;
          color: #fff;
          font-size: 1.5rem;
          user-select: none;
          animation: snow linear infinite;
        }
      `
    },
    halloween: {
      name: '🎃 Halloween',
      emoji: '🎃',
      css: () => `
        :root {
          --gold: #FF6600;       /* orange */
          --cyan: #800080;      /* purple */
          --purple: #000000;
          --surprise-bg: #FF6600;
        }
      `,
      decorations: true,
      fullCSS: () => `
        @keyframes float {
          0% { transform: translateY(0) rotate(0deg); opacity:1; }
          100% { transform: translateY(-110vh) rotate(360deg); opacity:0; }
        }
        .bat {
          position: absolute;
          font-size: 2rem;
          animation: float linear infinite;
        }
        .pumpkin {
          position: absolute;
          font-size: 2rem;
          animation: float linear infinite;
        }
      `
    },
    easter: {
      name: '🐣 Easter',
      emoji: '🐣',
      css: () => `
        :root {
          --gold: #FFB6C1;       /* light pink */
          --cyan: #DDA0DD;      /* plum */
          --purple: #FFD700;    /* gold */
          --surprise-bg: #FFB6C1;
        }
      `,
      decorations: true,
      fullCSS: () => `
        @keyframes hop {
          0% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
          100% { transform: translateY(0); }
        }
        .easter-egg {
          position: absolute;
          font-size: 2rem;
          animation: hop 2s ease-in-out infinite;
        }
      `
    },
    newyear: {
      name: '🎆 New Year',
      emoji: '🎆',
      css: () => `
        :root {
          --gold: #FFD700;
          --cyan: #C0C0C0;      /* silver */
          --purple: #000000;
          --surprise-bg: #FFD700;
        }
      `,
      decorations: true,
      fullCSS: () => `
        @keyframes firework {
          0% { transform: scale(0); opacity:1; }
          100% { transform: scale(1.5); opacity:0; }
        }
        .firework {
          position: absolute;
          width: 8px; height: 8px;
          background: gold;
          border-radius: 50%;
          animation: firework 1.5s ease-out infinite;
        }
      `
    },
    valentine: {
      name: '❤️ Valentine’s Day',
      emoji: '❤️',
      css: () => `
        :root {
          --gold: #FF1493;       /* deep pink */
          --cyan: #FF69B4;      /* hot pink */
          --purple: #FFFFFF;
          --surprise-bg: #FF1493;
        }
      `,
      decorations: true,
      fullCSS: () => `
        @keyframes heartFloat {
          0% { transform: translateY(0) scale(1); opacity:1; }
          100% { transform: translateY(-100vh) scale(0.5); opacity:0; }
        }
        .heart {
          position: absolute;
          color: #ff4d6d;
          font-size: 2rem;
          animation: heartFloat 4s linear infinite;
        }
      `
    },
    patrick: {
      name: '☘️ St. Patrick’s Day',
      emoji: '☘️',
      css: () => `
        :root {
          --gold: #228B22;       /* forest green */
          --cyan: #FFD700;      /* gold */
          --purple: #FFFFFF;
          --surprise-bg: #228B22;
        }
      `,
      decorations: true,
      fullCSS: () => `
        @keyframes cloverSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .clover {
          position: absolute;
          font-size: 2rem;
          animation: cloverSpin 3s linear infinite;
        }
      `
    }
    // Add more themes here following the same structure
  };

  /* -----------------------------------------------
   | 2. State & helpers
   ----------------------------------------------- */
  let currentEventTheme = localStorage.getItem('nova_event_theme') || 'none';
  let fullEffects = localStorage.getItem('nova_event_full') === 'true';
  let activeStyleTag = null;
  let activeDecoContainer = null;

  function removeActiveTheme() {
    if (activeStyleTag) {
      activeStyleTag.remove();
      activeStyleTag = null;
    }
    if (activeDecoContainer) {
      activeDecoContainer.remove();
      activeDecoContainer = null;
    }
  }

  function applyTheme(themeKey, withFull) {
    removeActiveTheme();
    if (themeKey === 'none' || !THEMES[themeKey]) return;

    const theme = THEMES[themeKey];
    // Inject colour overrides
    const style = document.createElement('style');
    style.id = 'nova-event-theme';
    style.textContent = theme.css();
    document.head.appendChild(style);
    activeStyleTag = style;

    // Full effects (decorations) only if enabled AND theme supports it
    if (withFull && theme.decorations && theme.fullCSS) {
      // inject animations
      const fullStyle = document.createElement('style');
      fullStyle.id = 'nova-event-full';
      fullStyle.textContent = theme.fullCSS();
      document.head.appendChild(fullStyle);

      // create container for decorative elements
      const container = document.createElement('div');
      container.id = 'nova-deco-container';
      container.style.position = 'fixed';
      container.style.top = '0';
      container.style.left = '0';
      container.style.width = '100%';
      container.style.height = '100%';
      container.style.pointerEvents = 'none';
      container.style.zIndex = '9998';
      document.body.appendChild(container);
      activeDecoContainer = container;

      // spawn decorations
      spawnDecorations(themeKey, container);
    }
  }

  /* -----------------------------------------------
   | 3. Decoration spawners
   ----------------------------------------------- */
  function spawnDecorations(themeKey, container) {
    const count = 20; // number of elements
    const frag = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      const el = document.createElement('div');
      el.style.left = Math.random() * 100 + '%';
      el.style.animationDelay = Math.random() * 5 + 's';
      el.style.animationDuration = (Math.random() * 5 + 5) + 's'; // 5-10s

      switch (themeKey) {
        case 'christmas':
          el.className = 'snowflake';
          el.textContent = '❄️';
          break;
        case 'halloween':
          el.className = Math.random() > 0.5 ? 'bat' : 'pumpkin';
          el.textContent = Math.random() > 0.5 ? '🦇' : '🎃';
          break;
        case 'easter':
          el.className = 'easter-egg';
          el.textContent = '🥚';
          break;
        case 'newyear':
          el.className = 'firework';
          el.style.background = ['#FFD700','#FF6B6B','#4ECDC4','#FFE66D'][Math.floor(Math.random()*4)];
          break;
        case 'valentine':
          el.className = 'heart';
          el.textContent = '❤️';
          break;
        case 'patrick':
          el.className = 'clover';
          el.textContent = '🍀';
          break;
        default:
          continue;
      }
      frag.appendChild(el);
    }
    container.appendChild(frag);
  }

  /* -----------------------------------------------
   | 4. Auto‑detect event based on date
   ----------------------------------------------- */
  function getAutoEvent() {
    const now = new Date();
    const m = now.getMonth() + 1, d = now.getDate();
    // Rough date ranges (adjust as you like)
    if (m === 12 && d >= 20) return 'christmas';
    if (m === 1 && d <= 3) return 'newyear';
    if (m === 10 && d >= 25) return 'halloween';
    if (m === 3 && d >= 15 && d <= 17) return 'patrick';
    if (m === 4 && d >= 1 && d <= 20) return 'easter'; // approximate
    if (m === 2 && d >= 10 && d <= 18) return 'valentine';
    return 'none';
  }

  /* -----------------------------------------------
   | 5. Build settings UI for event themes
   ----------------------------------------------- */
  function injectSettingsUI() {
    // Wait for settings modal to exist
    const checkExist = setInterval(() => {
      const settingsBody = document.querySelector('#settingsOverlay .modal-body');
      if (!settingsBody) return;
      clearInterval(checkExist);

      // Insert event theme section before the infinite scroll toggle
      const section = document.createElement('div');
      section.className = 'settings-section';
      section.innerHTML = `
        <h4>🎨 Event Theme</h4>
        <select id="eventThemeSelect" style="width:100%; margin-bottom:8px;">
          ${Object.entries(THEMES).map(([key, t]) =>
            `<option value="${key}" ${key === currentEventTheme ? 'selected' : ''}>${t.emoji} ${t.name}</option>`
          ).join('')}
        </select>
        <label class="toggle-label" style="margin-bottom:8px;">
          <input type="checkbox" id="fullEffectsToggle" ${fullEffects ? 'checked' : ''}>
          <span>✨ Full visual effects (may cause lag on slow devices)</span>
        </label>
        <p style="font-size:0.75rem; color:var(--muted);">
          💡 <em>Auto‑detect chooses the nearest holiday. You can override it here.</em>
        </p>
      `;

      // Insert before the infinite scroll toggle section
      const infiniteSection = [...settingsBody.querySelectorAll('.settings-section')].pop();
      settingsBody.insertBefore(section, infiniteSection);

      // Event listeners
      document.getElementById('eventThemeSelect').addEventListener('change', function () {
        currentEventTheme = this.value;
        localStorage.setItem('nova_event_theme', currentEventTheme);
        applyTheme(currentEventTheme, fullEffects);
      });

      document.getElementById('fullEffectsToggle').addEventListener('change', function () {
        fullEffects = this.checked;
        localStorage.setItem('nova_event_full', fullEffects);
        // Reapply theme (will add/remove decorations accordingly)
        applyTheme(currentEventTheme, fullEffects);
      });

      // If auto theme is 'none' but user hasn't set one, use auto
      if (currentEventTheme === 'none' && !localStorage.getItem('nova_event_theme')) {
        const auto = getAutoEvent();
        if (auto !== 'none') {
          currentEventTheme = auto;
          document.getElementById('eventThemeSelect').value = auto;
          localStorage.setItem('nova_event_theme', auto);
        }
      }

      // Apply initial theme
      applyTheme(currentEventTheme, fullEffects);
    }, 300);
  }

  /* -----------------------------------------------
   | 6. Init
   ----------------------------------------------- */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectSettingsUI);
  } else {
    injectSettingsUI();
  }

})();
