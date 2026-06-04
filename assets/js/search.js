(() => {
  const themeButton = document.querySelector("[data-theme-toggle]");
  const searchRoot = document.querySelector("[data-search-root]");
  const searchToggle = document.querySelector("[data-search-toggle]");
  const searchPanel = document.querySelector("[data-search-panel]");
  const searchInput = document.querySelector("[data-search-input]");
  const searchResults = document.querySelector("[data-search-results]");

  const currentTheme = () => {
    const explicit = document.documentElement.dataset.theme;
    if (explicit) return explicit;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  };

  const updateThemeButton = () => {
    if (!themeButton) return;
    const isDark = currentTheme() === "dark";
    const sun = themeButton.querySelector('.icon-sun');
    const moon = themeButton.querySelector('.icon-moon');
    if (sun && moon) {
      sun.style.display = isDark ? "block" : "none";
      moon.style.display = isDark ? "none" : "block";
    }
  };

  // 与 baseof.html 初始化脚本保持一致的背景色常量
  const BG_DARK = "#141312";
  const BG_LIGHT = "#f7f5f0";

  if (themeButton) {
    updateThemeButton();
    themeButton.addEventListener("click", () => {
      const nextTheme = currentTheme() === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = nextTheme;
      // 同步更新 html 的内联背景，保持两侧区域颜色正确
      document.documentElement.style.background = nextTheme === "dark" ? BG_DARK : BG_LIGHT;
      localStorage.setItem("theme", nextTheme);
      updateThemeButton();
    });
  }

  const scrollTopBtn = document.querySelector("[data-scroll-top]");
  if (scrollTopBtn) {
    const toggleScrollBtn = () => {
      scrollTopBtn.hidden = window.scrollY < 300;
    };
    toggleScrollBtn();
    window.addEventListener("scroll", toggleScrollBtn, { passive: true });
    scrollTopBtn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  const navToggle = document.querySelector("[data-nav-toggle]");
  const nav = document.querySelector("[data-nav]");

  if (navToggle && nav) {
    const menuIcon = navToggle.querySelector(".icon-menu");
    const closeIcon = navToggle.querySelector(".icon-close");

    const setNavOpen = (open) => {
      nav.classList.toggle("is-open", open);
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
      if (menuIcon && closeIcon) {
        menuIcon.style.display = open ? "none" : "block";
        closeIcon.style.display = open ? "block" : "none";
      }
    };

    navToggle.addEventListener("click", () => {
      setNavOpen(!nav.classList.contains("is-open"));
    });

    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => setNavOpen(false));
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") setNavOpen(false);
    });

    document.addEventListener("click", (event) => {
      if (!nav.contains(event.target) && !navToggle.contains(event.target)) {
        setNavOpen(false);
      }
    });
  }

  if (!searchRoot || !searchToggle || !searchPanel || !searchInput || !searchResults) return;

  let fuse;
  let loaded = false;

  const setEmpty = (message) => {
    searchResults.innerHTML = "";
    const empty = document.createElement("p");
    empty.className = "search-empty";
    empty.textContent = message;
    searchResults.appendChild(empty);
  };

  const openPanel = async () => {
    searchPanel.hidden = false;
    searchToggle.setAttribute("aria-expanded", "true");
    searchInput.focus();

    if (loaded) return;
    loaded = true;
    try {
      const response = await fetch(searchRoot.dataset.searchIndex || "/index.json");
      const pages = await response.json();
      fuse = new Fuse(pages, {
        keys: ["title", "summary", "content"],
        threshold: 0.32,
        ignoreLocation: true,
      });
      setEmpty("输入关键词后，结果会显示在这里。");
    } catch {
      setEmpty("搜索索引加载失败，请稍后重试。");
    }
  };

  const closePanel = () => {
    searchPanel.hidden = true;
    searchToggle.setAttribute("aria-expanded", "false");
  };

  const renderResults = (items) => {
    searchResults.innerHTML = "";
    if (!items.length) {
      setEmpty("没有找到相关内容。");
      return;
    }

    items.slice(0, 8).forEach(({ item }) => {
      const link = document.createElement("a");
      link.className = "search-result";
      link.href = item.permalink;

      const title = document.createElement("span");
      title.className = "search-result-title";
      title.textContent = item.title;

      const summary = document.createElement("p");
      summary.className = "search-result-summary";
      summary.textContent = item.summary || item.date || "";

      link.append(title, summary);
      searchResults.appendChild(link);
    });
  };

  searchToggle.addEventListener("click", () => {
    if (searchPanel.hidden) {
      openPanel();
    } else {
      closePanel();
    }
  });

  searchInput.addEventListener("input", () => {
    const query = searchInput.value.trim();
    if (!query) {
      setEmpty("输入关键词后，结果会显示在这里。");
      return;
    }
    if (!fuse) {
      setEmpty("搜索索引加载中...");
      return;
    }
    renderResults(fuse.search(query));
  });

  document.addEventListener("click", (event) => {
    if (!searchRoot.contains(event.target)) closePanel();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closePanel();
  });

  // ── Toast 提示 ──
  const showToast = (msg) => {
    let toast = document.querySelector(".copy-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "copy-toast";
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add("visible");
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove("visible"), 2000);
  };

  // ── 代码块：语言标签 + 复制按钮（带 fallback + toast）──
  const copyIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`;
  const checkIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;

  const copyText = async (text) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.cssText = "position:fixed;opacity:0;top:0;left:0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
  };

  document.querySelectorAll(".post-content .highlight").forEach((block) => {
    const pre = block.querySelector("pre");
    const code = pre?.querySelector("code");
    const langClass = code?.className.match(/language-(\w+)/);
    if (langClass) block.dataset.lang = langClass[1];

    const btn = document.createElement("button");
    btn.className = "code-copy-btn";
    btn.setAttribute("aria-label", "复制代码");
    btn.innerHTML = copyIconSvg;
    block.appendChild(btn);

    btn.addEventListener("click", async () => {
      const text = code?.innerText ?? pre?.innerText ?? "";
      try {
        await copyText(text);
        btn.classList.add("copied");
        btn.innerHTML = checkIconSvg;
        showToast("已复制到剪贴板");
        setTimeout(() => {
          btn.classList.remove("copied");
          btn.innerHTML = copyIconSvg;
        }, 2000);
      } catch {
        showToast("复制失败，请手动选择");
      }
    });
  });

  // ── TOC 滚动高亮 ──
  const tocLinks = document.querySelectorAll(".toc-nav a");
  if (tocLinks.length) {
    const headings = Array.from(
      document.querySelectorAll(".post-content h2, .post-content h3")
    );

    const onScroll = () => {
      const scrollY = window.scrollY + 100;
      let current = headings[0];
      for (const h of headings) {
        if (h.offsetTop <= scrollY) current = h;
      }
      tocLinks.forEach((a) => {
        const href = a.getAttribute("href");
        a.classList.toggle(
          "toc-active",
          current && href === "#" + current.id
        );
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  // ── 移动端侧滑抽屉 ──
  const mobDrawerToggle = document.querySelector("[data-mob-drawer-toggle]");
  const mobDrawer = document.getElementById("mob-drawer");

  if (mobDrawerToggle && mobDrawer) {
    const openDrawer = () => {
      mobDrawer.classList.add("is-open");
      document.body.style.overflow = "hidden";
    };
    const closeDrawer = () => {
      mobDrawer.classList.remove("is-open");
      document.body.style.overflow = "";
    };

    mobDrawerToggle.addEventListener("click", openDrawer);

    document.querySelectorAll("[data-mob-drawer-close]").forEach((el) => {
      el.addEventListener("click", closeDrawer);
    });

    mobDrawer.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeDrawer);
    });
  }

  // ── 移动端导航「更多」子菜单折叠切换 ──
  document.querySelectorAll(".nav-dropdown-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      // 仅当移动导航可见时（site-nav.is-open）才进行折叠切换
      const nav = document.querySelector("[data-nav]");
      if (!nav || !nav.classList.contains("is-open")) return;
      const dropdown = btn.closest(".nav-dropdown");
      if (dropdown) dropdown.classList.toggle("is-collapsed");
    });
  });

  // ── Lightbox：图片 & Mermaid 放大预览 ──
  const lightbox = document.getElementById("lightbox");
  const lightboxBody = document.getElementById("lightbox-body");
  const lightboxBg = document.getElementById("lightbox-bg");
  const lightboxCloseBtn = document.getElementById("lightbox-close");

  if (lightbox && lightboxBody) {
    const openLightbox = (content) => {
      lightboxBody.innerHTML = "";
      lightboxBody.appendChild(content);
      lightbox.hidden = false;
      document.body.style.overflow = "hidden";
    };

    const closeLightbox = () => {
      lightbox.hidden = true;
      lightboxBody.innerHTML = "";
      document.body.style.overflow = "";
    };

    lightboxBg?.addEventListener("click", closeLightbox);
    lightboxCloseBtn?.addEventListener("click", closeLightbox);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !lightbox.hidden) closeLightbox();
    });

    // 文章图片放大
    document.querySelectorAll(".post-content img").forEach((img) => {
      // 跳过已在链接里的图片
      if (img.closest("a")) return;
      img.classList.add("zoomable");
      img.addEventListener("click", () => {
        const clone = document.createElement("img");
        clone.src = img.src;
        clone.alt = img.alt;
        openLightbox(clone);
      });
    });

    // Mermaid 图表放大
    // 注意：Mermaid 是 ESM 异步渲染，初始化时 SVG 可能还不存在；
    // 将 querySelector("svg") 推迟到点击时执行，确保 SVG 已渲染完毕。
    document.querySelectorAll(".mermaid-wrap").forEach((wrap) => {
      wrap.classList.add("zoomable");
      wrap.addEventListener("click", () => {
        const svg = wrap.querySelector("svg");
        if (!svg) return;
        const clone = svg.cloneNode(true);
        // 确保 viewBox 存在（Mermaid 一般会设置，备用兜底）
        if (!clone.getAttribute("viewBox")) {
          const r = svg.getBoundingClientRect();
          if (r.width && r.height) {
            clone.setAttribute("viewBox", `0 0 ${r.width} ${r.height}`);
          }
        }
        // width="100%" + viewBox 让 SVG 自适应容器宽度并保持比例
        // 清掉 Mermaid 注入的 max-width 内联样式
        clone.setAttribute("width", "100%");
        clone.removeAttribute("height");
        clone.style.cssText = "display:block;max-height:80vh;height:auto;";
        openLightbox(clone);
      });
    });
  }
})();
