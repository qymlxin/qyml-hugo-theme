// Shiki 代码高亮：亮色 GitHub Light / 暗色 GitHub Dark，随页面主题自动切换
(async () => {
  const pres = document.querySelectorAll('.post-content pre:not(.mermaid)');
  if (!pres.length) return;

  const LIGHT = 'github-light';
  const DARK  = 'github-dark';

  const SVG_COPY = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
  const SVG_CHECK = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>`;

  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const isDark = () =>
    document.documentElement.dataset.theme === 'dark' ||
    (!document.documentElement.dataset.theme &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  const langSet = new Set();
  pres.forEach(pre => {
    const m = pre.querySelector('code')?.className.match(/language-(\S+)/);
    if (m) langSet.add(m[1]);
  });

  const blocks = [];
  pres.forEach(pre => {
    const code = pre.querySelector('code');
    if (!code) return;
    const m = code.className.match(/language-(\S+)/);
    const lang = m ? m[1] : 'text';
    const rawCode = code.textContent.trimEnd();

    const wrap = document.createElement('div');
    wrap.className = 'code-wrap';

    wrap.innerHTML = `
      <div class="code-header">
        <span class="code-lang-label">${esc(lang)}</span>
        <button class="code-copy-btn" type="button" title="复制代码" aria-label="复制代码">${SVG_COPY}<span>复制</span></button>
      </div>
      <div class="code-body"><pre><code>${esc(rawCode)}</code></pre></div>`;

    pre.replaceWith(wrap);
    blocks.push({ wrap, lang, rawCode });

    const btn = wrap.querySelector('.code-copy-btn');
    let resetTimer;
    btn.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(rawCode); }
      catch {
        const ta = Object.assign(document.createElement('textarea'), { value: rawCode });
        Object.assign(ta.style, { position: 'fixed', opacity: '0' });
        document.body.append(ta); ta.select(); document.execCommand('copy'); ta.remove();
      }
      btn.innerHTML = `${SVG_CHECK}<span>已复制</span>`;
      btn.classList.add('is-copied');
      clearTimeout(resetTimer);
      resetTimer = setTimeout(() => {
        btn.innerHTML = `${SVG_COPY}<span>复制</span>`;
        btn.classList.remove('is-copied');
      }, 1800);
    });
  });

  const { createHighlighter } = await import('https://esm.sh/shiki@1/bundle/web');
  const langs = [...langSet].filter(Boolean);
  const hl = await createHighlighter({
    themes: [LIGHT, DARK],
    langs: langs.length ? langs : ['text'],
  });
  const loaded = new Set(hl.getLoadedLanguages());

  const applyTheme = () => {
    const theme = isDark() ? DARK : LIGHT;
    blocks.forEach(({ wrap, lang, rawCode }) => {
      const useLang = loaded.has(lang) ? lang : 'text';
      let html;
      try { html = hl.codeToHtml(rawCode, { lang: useLang, theme }); }
      catch { html = `<pre><code>${esc(rawCode)}</code></pre>`; }

      const rendered = document.createElement('div');
      rendered.innerHTML = html;
      const shikiPre = rendered.querySelector('pre');
      if (!shikiPre) return;

      shikiPre.style.cssText =
        'background:transparent;margin:0;border-radius:0;' +
        'padding:1rem 1.25rem;overflow-x:auto;' +
        'font-size:inherit;line-height:inherit;box-shadow:none;';
      wrap.dataset.codeTheme = theme === DARK ? 'dark' : 'light';
      wrap.querySelector('.code-body').replaceChildren(shikiPre);
    });
  };

  applyTheme();
  window.addEventListener('theme-changed', applyTheme);
})();
