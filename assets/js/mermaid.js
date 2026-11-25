import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';

const wraps = Array.from(document.querySelectorAll('[data-mermaid-wrap]'));
if (wraps.length) {
  const scriptEl = document.querySelector('[data-mermaid-script]');
  const lightTheme = scriptEl?.dataset.themeLight || 'neutral';
  const darkTheme = scriptEl?.dataset.themeDark || 'dark';
  const systemMedia = window.matchMedia('(prefers-color-scheme: dark)');

  const isDarkMode = () => {
    const explicit = document.documentElement.dataset.theme;
    return explicit ? explicit === 'dark' : systemMedia.matches;
  };

  const getThemeConfig = () => {
    const dark = isDarkMode();
    return {
      theme: dark ? darkTheme : lightTheme,
      themeVariables: dark
        ? {
            darkMode: true,
            background: '#181d27',
            primaryColor: '#212733',
            primaryTextColor: '#edf1f7',
            primaryBorderColor: '#3b465b',
            lineColor: '#8f99ab',
            secondaryColor: '#28303e',
            tertiaryColor: '#1b212d',
            textColor: '#edf1f7',
            mainBkg: '#212733',
            nodeBorder: '#44516a',
            clusterBkg: '#1b212d',
            clusterBorder: '#323c4e',
            accentColor: '#539bf5',
          }
        : {
            darkMode: false,
            background: '#f7f8fa',
            primaryColor: '#ffffff',
            primaryTextColor: '#252933',
            primaryBorderColor: '#d3d7e0',
            lineColor: '#515767',
            secondaryColor: '#eef3ff',
            tertiaryColor: '#f2f3f5',
            textColor: '#252933',
            mainBkg: '#ffffff',
            nodeBorder: '#c5ccd8',
            clusterBkg: '#f2f3f5',
            clusterBorder: '#d3d7e0',
            accentColor: '#1e80ff',
          },
    };
  };

  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

  const copyText = async (text) => {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0;';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    document.execCommand('copy');
    ta.remove();
  };

  const entries = wraps
    .map((wrap, index) => {
      const pre = wrap.querySelector('pre.mermaid');
      const viewport = wrap.querySelector('[data-mermaid-viewport]');
      if (!pre || !viewport) return null;

      const source = pre.textContent.trim();
      const zoomLabel = wrap.querySelector('[data-mermaid-zoom-label]');
      const zoomInBtn = wrap.querySelector('[data-mermaid-zoom-in]');
      const zoomOutBtn = wrap.querySelector('[data-mermaid-zoom-out]');
      const resetBtn = wrap.querySelector('[data-mermaid-reset]');
      const copyBtn = wrap.querySelector('[data-mermaid-copy]');
      const fullscreenBtn = wrap.querySelector('[data-mermaid-fullscreen]');

      const state = { scale: 1, tx: 0, ty: 0 };

      const applyTransform = () => {
        pre.style.transform = `translate3d(${state.tx}px, ${state.ty}px, 0) scale(${state.scale})`;
        viewport.classList.toggle('is-zoomed', state.scale > 1.01);
        if (zoomLabel) zoomLabel.textContent = `${Math.round(state.scale * 100)}%`;
      };

      const setScale = (nextScale) => {
        const clamped = clamp(Number(nextScale.toFixed(2)), 0.5, 3);
        state.scale = clamped;
        if (clamped <= 1.01) {
          state.tx = 0;
          state.ty = 0;
        }
        applyTransform();
      };

      const resetView = () => {
        state.scale = 1;
        state.tx = 0;
        state.ty = 0;
        applyTransform();
      };

      zoomInBtn?.addEventListener('click', () => setScale(state.scale + 0.25));
      zoomOutBtn?.addEventListener('click', () => setScale(state.scale - 0.25));
      resetBtn?.addEventListener('click', resetView);

      let copyTimer = 0;
      copyBtn?.addEventListener('click', async () => {
        try {
          await copyText(source);
          copyBtn.textContent = '已复制';
          copyBtn.classList.add('is-copied');
          clearTimeout(copyTimer);
          copyTimer = window.setTimeout(() => {
            copyBtn.textContent = '源码';
            copyBtn.classList.remove('is-copied');
          }, 1600);
        } catch {
          copyBtn.textContent = '失败';
        }
      });

      const openFullscreen = () => {
        const svg = pre.querySelector('svg');
        if (!svg) return;
        window.dispatchEvent(new CustomEvent('open-lightbox-mermaid', { detail: { svg } }));
      };

      fullscreenBtn?.addEventListener('click', openFullscreen);
      viewport.addEventListener('dblclick', (event) => {
        if (event.target.closest('button')) return;
        openFullscreen();
      });

      viewport.addEventListener(
        'wheel',
        (event) => {
          if (!(event.ctrlKey || event.metaKey)) return;
          event.preventDefault();
          const factor = event.deltaY < 0 ? 0.15 : -0.15;
          setScale(state.scale + factor);
        },
        { passive: false }
      );

      let dragPointerId = null;
      let startX = 0;
      let startY = 0;
      let originTx = 0;
      let originTy = 0;

      viewport.addEventListener('pointerdown', (event) => {
        if (state.scale <= 1.01 || event.button !== 0) return;
        dragPointerId = event.pointerId;
        startX = event.clientX;
        startY = event.clientY;
        originTx = state.tx;
        originTy = state.ty;
        viewport.classList.add('is-dragging');
        viewport.setPointerCapture?.(event.pointerId);
      });

      viewport.addEventListener('pointermove', (event) => {
        if (dragPointerId !== event.pointerId) return;
        state.tx = originTx + (event.clientX - startX);
        state.ty = originTy + (event.clientY - startY);
        applyTransform();
      });

      const endDrag = (event) => {
        if (dragPointerId !== event.pointerId) return;
        dragPointerId = null;
        viewport.classList.remove('is-dragging');
        viewport.releasePointerCapture?.(event.pointerId);
      };

      viewport.addEventListener('pointerup', endDrag);
      viewport.addEventListener('pointercancel', endDrag);

      return { wrap, pre, source, id: `mermaid-diagram-${index}` };
    })
    .filter(Boolean);

  let renderGeneration = 0;
  const renderAll = async () => {
    const generation = ++renderGeneration;
    const { theme, themeVariables } = getThemeConfig();
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'loose',
      theme,
      themeVariables,
    });

    for (const entry of entries) {
      entry.wrap.classList.add('is-rendering');
      try {
        const result = await mermaid.render(`${entry.id}-${generation}`, entry.source);
        if (generation !== renderGeneration) continue;
        const fragment = document.createRange().createContextualFragment(result.svg);
        const svg = fragment.querySelector('svg');
        if (svg) {
          svg.style.maxWidth = '100%';
          svg.style.height = 'auto';
        }
        entry.pre.replaceChildren(fragment);
        result.bindFunctions?.(entry.pre);
      } catch (error) {
        console.error('Mermaid rendering failed:', error);
        if (!entry.pre.querySelector('svg')) entry.pre.textContent = entry.source;
      } finally {
        if (generation === renderGeneration) entry.wrap.classList.remove('is-rendering');
      }
    }
  };

  window.addEventListener('theme-changed', renderAll);
  const onSystemChange = () => {
    if (!document.documentElement.dataset.theme) renderAll();
  };
  if (systemMedia.addEventListener) {
    systemMedia.addEventListener('change', onSystemChange);
  } else {
    systemMedia.addListener(onSystemChange);
  }

  renderAll();
}
