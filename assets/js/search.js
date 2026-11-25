(() => {
  const themeButton = document.querySelector("[data-theme-toggle]");
  const searchRoot = document.querySelector("[data-search-root]");
  const searchToggle = document.querySelector("[data-search-toggle]");
  const searchBackdrop = document.querySelector("[data-search-backdrop]");
  const searchPanel = document.querySelector("[data-search-panel]");
  const searchInput = document.querySelector("[data-search-input]");
  const searchResults = document.querySelector("[data-search-results]");
  const searchCloseBtn = document.querySelector("[data-search-close]");

  // ── 亮暗主题切换 ──
  const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");

  const currentTheme = () => {
    const explicit = document.documentElement.dataset.theme;
    if (explicit) return explicit;
    return systemTheme.matches ? "dark" : "light";
  };

  const updateThemeButton = () => {
    if (!themeButton) return;
    const isDark = currentTheme() === "dark";
    const sun = themeButton.querySelector(".icon-sun");
    const moon = themeButton.querySelector(".icon-moon");
    if (sun && moon) {
      sun.style.display = isDark ? "block" : "none";
      moon.style.display = isDark ? "none" : "block";
    }
  };

  const setTheme = (theme, persist = false) => {
    const previousTheme = currentTheme();
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.removeProperty("background");
    if (persist) localStorage.setItem("theme", theme);
    updateThemeButton();
    if (previousTheme !== theme) {
      window.dispatchEvent(new CustomEvent("theme-changed", { detail: { theme } }));
    }
  };

  if (themeButton) {
    updateThemeButton();
    themeButton.addEventListener("click", () => {
      const nextTheme = currentTheme() === "dark" ? "light" : "dark";
      setTheme(nextTheme, true);
    });
  }

  const syncSystemTheme = () => {
    if (localStorage.getItem("theme")) return;
    setTheme(systemTheme.matches ? "dark" : "light");
  };
  if (systemTheme.addEventListener) {
    systemTheme.addEventListener("change", syncSystemTheme);
  } else {
    systemTheme.addListener(syncSystemTheme);
  }

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

  // ── Header 滚动状态 & 阅读进度条 ──
  const siteHeader = document.querySelector(".site-header");
  const progressBar = document.querySelector("[data-reading-progress]");
  const postArticle = document.querySelector(".post");
  const varHeaderOffset = () => (siteHeader ? siteHeader.offsetHeight + 16 : 68);

  let rafPending = false;
  const updateScrollEffects = () => {
    rafPending = false;
    if (siteHeader) {
      siteHeader.classList.toggle("is-scrolled", window.scrollY > 8);
    }
    if (progressBar && postArticle) {
      if (window.scrollY <= 4) {
        progressBar.style.width = "0%";
      } else {
        const rect = postArticle.getBoundingClientRect();
        const total = Math.max(1, postArticle.offsetHeight - window.innerHeight * 0.7);
        const read = Math.max(0, -rect.top + varHeaderOffset());
        const pct = Math.min(100, (read / total) * 100);
        progressBar.style.width = `${pct.toFixed(2)}%`;
      }
    }
  };

  updateScrollEffects();
  window.addEventListener(
    "scroll",
    () => {
      if (!rafPending) {
        rafPending = true;
        requestAnimationFrame(updateScrollEffects);
      }
    },
    { passive: true }
  );

  // ── 回到顶部按钮 ──
  const scrollTopBtn = document.querySelector("[data-scroll-top]");
  if (scrollTopBtn) {
    const toggleScrollBtn = () => {
      scrollTopBtn.hidden = window.scrollY < 360;
    };
    toggleScrollBtn();
    window.addEventListener("scroll", toggleScrollBtn, { passive: true });
    scrollTopBtn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  // ── 移动端导航菜单 ──
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

    const mobileNavMedia = window.matchMedia("(max-width: 640px)");
    const syncNavMode = () => {
      setNavOpen(false);
      nav.dataset.navMode = mobileNavMedia.matches ? "mobile" : "desktop";
      nav.querySelectorAll(".nav-dropdown").forEach((dropdown) => {
        dropdown.classList.remove("is-collapsed");
      });
    };
    syncNavMode();
    mobileNavMedia.addEventListener("change", syncNavMode);
  }

  document.querySelectorAll(".nav-dropdown-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!nav || !nav.classList.contains("is-open")) return;
      const dropdown = btn.closest(".nav-dropdown");
      if (dropdown) dropdown.classList.toggle("is-collapsed");
    });
  });

  // ── 社交账号复制（邮箱 / 微信号） ──
  document.querySelectorAll("[data-copy-value]").forEach((button) => {
    const label = button.dataset.copyLabel || "内容";
    const defaultTitle = button.title;

    button.addEventListener("click", async () => {
      const value = button.dataset.copyValue;
      if (!value) return;

      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(value);
        } else {
          const input = document.createElement("textarea");
          input.value = value;
          input.setAttribute("readonly", "");
          input.style.position = "fixed";
          input.style.opacity = "0";
          document.body.appendChild(input);
          input.select();
          document.execCommand("copy");
          input.remove();
        }

        button.dataset.copyState = "copied";
        button.title = `${label}已复制`;
        showToast(`${label}已复制：${value}`);
        window.setTimeout(() => {
          delete button.dataset.copyState;
          button.title = defaultTitle;
        }, 1600);
      } catch {
        showToast(`无法复制${label}`);
      }
    });
  });

  // ── 文章表格横向滚动包裹 ──
  document.querySelectorAll(".post-content table").forEach((table) => {
    if (table.closest(".table-scroll")) return;
    const wrapper = document.createElement("div");
    wrapper.className = "table-scroll";
    table.parentNode.insertBefore(wrapper, table);
    wrapper.appendChild(table);
  });

  // ── Spotlight 全站搜索（⌘K / Ctrl+K） ──
  if (searchRoot && searchToggle && searchPanel && searchInput && searchResults) {
    let fuse;
    let loaded = false;
    let activeIndex = -1;

    const setEmpty = (message) => {
      searchResults.innerHTML = "";
      activeIndex = -1;
      const empty = document.createElement("p");
      empty.className = "search-empty";
      empty.textContent = message;
      searchResults.appendChild(empty);
    };

    const setActiveResult = (index) => {
      const items = searchResults.querySelectorAll(".search-result");
      if (!items.length) {
        activeIndex = -1;
        return;
      }
      activeIndex = ((index % items.length) + items.length) % items.length;
      items.forEach((item, i) => {
        item.classList.toggle("is-active", i === activeIndex);
      });
      items[activeIndex].scrollIntoView({ block: "nearest" });
    };

    const openPanel = async () => {
      searchPanel.hidden = false;
      if (searchBackdrop) {
        searchBackdrop.hidden = false;
        searchBackdrop.setAttribute("aria-hidden", "false");
      }
      searchToggle.setAttribute("aria-expanded", "true");
      document.body.style.overflow = "hidden";
      requestAnimationFrame(() => searchInput.focus());

      if (loaded) return;
      loaded = true;
      try {
        const response = await fetch(searchRoot.dataset.searchIndex || "/index.json");
        const pages = await response.json();
        fuse = new Fuse(pages, {
          keys: [
            { name: "title", weight: 2.2 },
            { name: "tags", weight: 1.5 },
            { name: "categories", weight: 1.2 },
            { name: "summary", weight: 1 },
            { name: "content", weight: 0.7 },
          ],
          threshold: 0.32,
          ignoreLocation: true,
        });
        if (searchInput.value.trim()) {
          renderResults(fuse.search(searchInput.value.trim()));
        } else {
          setEmpty("输入关键词，即时检索所有文章与笔记。");
        }
      } catch {
        setEmpty("搜索索引加载失败，请稍后重试。");
      }
    };

    const closePanel = () => {
      if (searchPanel.hidden) return;
      searchPanel.hidden = true;
      if (searchBackdrop) {
        searchBackdrop.hidden = true;
        searchBackdrop.setAttribute("aria-hidden", "true");
      }
      searchToggle.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
    };

    const renderResults = (items) => {
      searchResults.innerHTML = "";
      activeIndex = -1;
      if (!items.length) {
        setEmpty("没有找到相关内容，换个关键词试试。");
        return;
      }

      items.slice(0, 8).forEach(({ item }, index) => {
        const link = document.createElement("a");
        link.className = "search-result";
        if (index === 0) link.classList.add("is-active");
        link.href = item.permalink;

        const top = document.createElement("div");
        top.className = "search-result-top";

        const title = document.createElement("span");
        title.className = "search-result-title";
        title.textContent = item.title;
        top.appendChild(title);

        const category = Array.isArray(item.categories) && item.categories[0];
        if (category) {
          const badge = document.createElement("span");
          badge.className = "search-result-badge";
          badge.textContent = category;
          top.appendChild(badge);
        }

        const summary = document.createElement("p");
        summary.className = "search-result-summary";
        summary.textContent = item.summary || item.date || "";

        link.append(top, summary);
        searchResults.appendChild(link);
      });
      activeIndex = 0;
    };

    searchToggle.addEventListener("click", () => {
      if (searchPanel.hidden) openPanel();
      else closePanel();
    });

    searchBackdrop?.addEventListener("click", closePanel);
    searchCloseBtn?.addEventListener("click", closePanel);

    searchInput.addEventListener("input", () => {
      const query = searchInput.value.trim();
      if (!query) {
        setEmpty("输入关键词，即时检索所有文章与笔记。");
        return;
      }
      if (!fuse) {
        setEmpty("搜索索引加载中...");
        return;
      }
      renderResults(fuse.search(query));
    });

    searchInput.addEventListener("keydown", (event) => {
      const items = searchResults.querySelectorAll(".search-result");
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveResult(activeIndex + 1);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveResult(activeIndex - 1);
      } else if (event.key === "Enter" && activeIndex >= 0 && items[activeIndex]) {
        event.preventDefault();
        window.location.href = items[activeIndex].href;
      }
    });

    document.addEventListener("keydown", (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (searchPanel.hidden) openPanel();
        else closePanel();
        return;
      }
      if (event.key === "Escape" && !searchPanel.hidden) {
        closePanel();
      }
    });
  }

  // ── TOC 滚动高亮 ──
  const tocLinks = document.querySelectorAll(".toc-nav a");
  if (tocLinks.length) {
    const headings = Array.from(
      document.querySelectorAll(".post-content h2, .post-content h3")
    );

    const onScroll = () => {
      const threshold = 110;
      let current = headings[0];
      for (const h of headings) {
        if (h.getBoundingClientRect().top <= threshold) {
          current = h;
        }
      }
      tocLinks.forEach((a) => {
        const href = a.getAttribute("href");
        const isActive = Boolean(current && href === "#" + current.id);
        a.classList.toggle("toc-active", isActive);
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

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && mobDrawer.classList.contains("is-open")) {
        closeDrawer();
      }
    });
  }

  // ── 标签页实时筛选 ──
  const tagFilterInput = document.querySelector("[data-tag-filter]");
  const tagCloud = document.querySelector("[data-tag-cloud]");
  const tagEmpty = document.querySelector("[data-tag-empty]");

  if (tagFilterInput && tagCloud) {
    const tagChips = Array.from(tagCloud.querySelectorAll(".tag-chip"));
    tagFilterInput.addEventListener("input", () => {
      const q = tagFilterInput.value.trim().toLowerCase();
      let visible = 0;
      tagChips.forEach((chip) => {
        const name = chip.dataset.tagName || "";
        const match = !q || name.includes(q);
        chip.hidden = !match;
        if (match) visible++;
      });
      if (tagEmpty) tagEmpty.hidden = visible > 0;
    });
  }

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

    document.querySelectorAll(".post-content img").forEach((img) => {
      if (img.closest("a")) return;
      img.classList.add("zoomable");
      img.addEventListener("click", () => {
        const clone = document.createElement("img");
        clone.src = img.src;
        clone.alt = img.alt;
        if (img.classList.contains("diagram-image-auto-dark")) {
          clone.classList.add("diagram-image-auto-dark");
        }
        openLightbox(clone);
      });
    });

    document.querySelectorAll(".mermaid-wrap").forEach((wrap) => {
      wrap.classList.add("zoomable");
      wrap.addEventListener("click", () => {
        const svg = wrap.querySelector("svg");
        if (!svg) return;
        const clone = svg.cloneNode(true);
        if (!clone.getAttribute("viewBox")) {
          const r = svg.getBoundingClientRect();
          if (r.width && r.height) {
            clone.setAttribute("viewBox", `0 0 ${r.width} ${r.height}`);
          }
        }
        clone.setAttribute("width", "100%");
        clone.removeAttribute("height");
        clone.style.cssText = "display:block;max-height:80vh;height:auto;";
        openLightbox(clone);
      });
    });
  }
})();
