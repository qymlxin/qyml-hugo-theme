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
  const tocProgressEls = document.querySelectorAll("[data-toc-progress]");
  const fabProgressEl = document.querySelector("[data-fab-progress]");
  const fabRingEl = document.querySelector("[data-fab-ring]");
  const postArticle = document.querySelector(".post");
  const FAB_RING_CIRCUMFERENCE = 2 * Math.PI * 21;
  const varHeaderOffset = () => (siteHeader ? siteHeader.offsetHeight + 16 : 68);

  let rafPending = false;
  const updateScrollEffects = () => {
    rafPending = false;
    if (siteHeader) {
      siteHeader.classList.toggle("is-scrolled", window.scrollY > 8);
    }
    if ((progressBar || tocProgressEls.length || fabProgressEl || fabRingEl) && postArticle) {
      let pct = 0;
      const nearBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      if (nearBottom) {
        pct = 100;
      } else if (window.scrollY > 4) {
        const rect = postArticle.getBoundingClientRect();
        const total = Math.max(1, postArticle.offsetHeight - window.innerHeight * 0.7);
        const read = Math.max(0, -rect.top + varHeaderOffset());
        pct = Math.min(100, (read / total) * 100);
      }
      const roundedPct = `${Math.round(pct)}%`;
      if (progressBar) progressBar.style.width = `${pct.toFixed(2)}%`;
      tocProgressEls.forEach((el) => {
        el.textContent = roundedPct;
      });
      if (fabProgressEl) fabProgressEl.textContent = roundedPct;
      if (fabRingEl) {
        fabRingEl.style.strokeDashoffset = (FAB_RING_CIRCUMFERENCE * (1 - pct / 100)).toFixed(2);
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
    const showThreshold = postArticle ? 80 : 360;
    const toggleScrollBtn = () => {
      scrollTopBtn.hidden = window.scrollY < showThreshold;
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
    const searchClearBtn = searchRoot.querySelector("[data-search-clear]");
    const searchStatusEl = searchRoot.querySelector("[data-search-status]");
    let fuse;
    let pages = [];
    let hotTags = [];
    let loaded = false;
    let loading = false;
    let activeIndex = -1;

    const createDocIcon = () => {
      const iconWrap = document.createElement("span");
      iconWrap.className = "search-result-icon";
      iconWrap.setAttribute("aria-hidden", "true");
      iconWrap.innerHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>';
      return iconWrap;
    };

    const appendHighlightedText = (parent, text, query) => {
      if (!text) return;
      const q = (query || "").trim();
      if (!q) {
        parent.textContent = text;
        return;
      }
      const tokens = q.split(/\s+/).filter(Boolean);
      if (!tokens.length) {
        parent.textContent = text;
        return;
      }
      const escaped = tokens.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
      const regex = new RegExp(`(${escaped.join("|")})`, "ig");
      const parts = text.split(regex);
      parts.forEach((part, idx) => {
        if (!part) return;
        if (idx % 2 === 1) {
          const mark = document.createElement("mark");
          mark.textContent = part;
          parent.appendChild(mark);
        } else {
          parent.appendChild(document.createTextNode(part));
        }
      });
    };

    const setStatus = (text) => {
      if (searchStatusEl) searchStatusEl.textContent = text;
    };

    const syncClearBtn = () => {
      if (searchClearBtn) searchClearBtn.hidden = !searchInput.value;
    };

    const setEmpty = (message) => {
      searchResults.innerHTML = "";
      activeIndex = -1;
      const empty = document.createElement("p");
      empty.className = "search-empty";
      empty.textContent = message;
      searchResults.appendChild(empty);
    };

    const setActiveResult = (index, scrollIntoView = true) => {
      const items = searchResults.querySelectorAll(".search-result");
      if (!items.length) {
        activeIndex = -1;
        return;
      }
      activeIndex = ((index % items.length) + items.length) % items.length;
      items.forEach((item, i) => {
        item.classList.toggle("is-active", i === activeIndex);
      });
      if (scrollIntoView) {
        items[activeIndex].scrollIntoView({ block: "nearest" });
      }
    };

    const buildSectionHead = (label, hint = "") => {
      const head = document.createElement("div");
      head.className = "search-section-head";
      const title = document.createElement("span");
      title.textContent = label;
      head.appendChild(title);
      if (hint) {
        const hintEl = document.createElement("span");
        hintEl.className = "search-section-hint";
        hintEl.textContent = hint;
        head.appendChild(hintEl);
      }
      return head;
    };

    const buildQuickTags = (limit = 8) => {
      if (!hotTags.length) return null;
      const box = document.createElement("div");
      box.className = "search-quick-tags";
      hotTags.slice(0, limit).forEach(([tag, count]) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "search-quick-tag";
        btn.textContent = `#${tag}`;
        const countEl = document.createElement("span");
        countEl.textContent = count;
        btn.appendChild(countEl);
        btn.addEventListener("click", () => {
          searchInput.value = tag;
          syncClearBtn();
          if (fuse) renderResults(fuse.search(tag), tag);
          searchInput.focus();
        });
        box.appendChild(btn);
      });
      return box;
    };

    const buildResultItem = (item, index, query = "") => {
      const link = document.createElement("a");
      link.className = "search-result";
      if (index === 0) link.classList.add("is-active");
      link.href = item.permalink;

      const main = document.createElement("div");
      main.className = "search-result-main";

      const top = document.createElement("div");
      top.className = "search-result-top";

      const title = document.createElement("span");
      title.className = "search-result-title";
      appendHighlightedText(title, item.title, query);
      top.appendChild(title);

      const category = Array.isArray(item.categories) && item.categories[0];
      if (category) {
        const badge = document.createElement("span");
        badge.className = "search-result-badge";
        badge.textContent = category;
        top.appendChild(badge);
      }

      const summaryText = item.summary || "";
      main.appendChild(top);
      if (summaryText) {
        const summary = document.createElement("p");
        summary.className = "search-result-summary";
        appendHighlightedText(summary, summaryText, query);
        main.appendChild(summary);
      }

      const metaParts = [];
      if (item.date) metaParts.push(item.date);
      if (Array.isArray(item.tags) && item.tags.length) {
        metaParts.push(
          item.tags
            .slice(0, 3)
            .map((t) => `#${t}`)
            .join("  ")
        );
      }
      if (metaParts.length) {
        const meta = document.createElement("div");
        meta.className = "search-result-meta";
        meta.textContent = metaParts.join("  ·  ");
        main.appendChild(meta);
      }

      const enterHint = document.createElement("span");
      enterHint.className = "search-result-enter";
      enterHint.setAttribute("aria-hidden", "true");
      enterHint.textContent = "↵";

      link.append(createDocIcon(), main, enterHint);
      link.addEventListener("mouseenter", () => {
        const items = Array.from(searchResults.querySelectorAll(".search-result"));
        const idx = items.indexOf(link);
        if (idx >= 0) setActiveResult(idx, false);
      });
      return link;
    };

    const renderDefaultState = () => {
      searchResults.innerHTML = "";
      activeIndex = -1;
      if (!pages.length) {
        setEmpty("暂无可检索的文章。");
        setStatus("0 篇文章");
        return;
      }

      if (hotTags.length) {
        searchResults.appendChild(buildSectionHead("热门标签", "点击快速检索"));
        const tagsRow = buildQuickTags(8);
        if (tagsRow) searchResults.appendChild(tagsRow);
      }

      const recent = [...pages]
        .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
        .slice(0, 5);
      if (recent.length) {
        searchResults.appendChild(buildSectionHead("最近文章"));
        recent.forEach((item, idx) => {
          searchResults.appendChild(buildResultItem(item, idx));
        });
        activeIndex = 0;
      }
      setStatus(`共 ${pages.length} 篇文章`);
    };

    const renderNoResults = (query) => {
      searchResults.innerHTML = "";
      activeIndex = -1;
      const box = document.createElement("div");
      box.className = "search-empty-box";
      box.innerHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>';

      const title = document.createElement("p");
      title.className = "search-empty-title";
      title.textContent = `未找到与「${query}」相关的文章`;

      const sub = document.createElement("p");
      sub.className = "search-empty-sub";
      sub.textContent = "可以换个关键词，或试试下面的热门标签";

      box.append(title, sub);
      const tagsRow = buildQuickTags(6);
      if (tagsRow) box.appendChild(tagsRow);
      searchResults.appendChild(box);
      setStatus("0 条结果");
    };

    const renderResults = (items, query) => {
      searchResults.innerHTML = "";
      activeIndex = -1;
      if (!items.length) {
        renderNoResults(query);
        return;
      }

      const list = items.slice(0, 8);
      searchResults.appendChild(
        buildSectionHead(`搜索结果`, `匹配 ${items.length} 篇`)
      );
      list.forEach(({ item }, index) => {
        searchResults.appendChild(buildResultItem(item, index, query));
      });
      activeIndex = 0;
      setStatus(`匹配 ${items.length} / ${pages.length} 篇`);
    };

    const openPanel = async () => {
      searchPanel.hidden = false;
      if (searchBackdrop) {
        searchBackdrop.hidden = false;
        searchBackdrop.setAttribute("aria-hidden", "false");
      }
      searchToggle.setAttribute("aria-expanded", "true");
      document.body.style.overflow = "hidden";
      syncClearBtn();
      requestAnimationFrame(() => searchInput.focus());

      if (loaded || loading) {
        if (loaded) {
          const q = searchInput.value.trim();
          if (q) renderResults(fuse.search(q), q);
          else renderDefaultState();
        }
        return;
      }
      loading = true;
      setEmpty("正在加载文章索引...");
      try {
        const response = await fetch(searchRoot.dataset.searchIndex || "/index.json");
        pages = await response.json();
        const tagCounts = new Map();
        pages.forEach((p) => {
          (p.tags || []).forEach((t) => {
            tagCounts.set(t, (tagCounts.get(t) || 0) + 1);
          });
        });
        hotTags = Array.from(tagCounts.entries()).sort((a, b) => b[1] - a[1]);

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
        loaded = true;
        const q = searchInput.value.trim();
        if (q) {
          renderResults(fuse.search(q), q);
        } else {
          renderDefaultState();
        }
      } catch {
        setEmpty("搜索索引加载失败，请稍后重试。");
        setStatus("加载失败");
      } finally {
        loading = false;
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

    searchToggle.addEventListener("click", () => {
      if (searchPanel.hidden) openPanel();
      else closePanel();
    });

    searchBackdrop?.addEventListener("click", closePanel);
    searchCloseBtn?.addEventListener("click", closePanel);
    searchClearBtn?.addEventListener("click", () => {
      searchInput.value = "";
      syncClearBtn();
      if (loaded) renderDefaultState();
      searchInput.focus();
    });

    searchInput.addEventListener("input", () => {
      syncClearBtn();
      const query = searchInput.value.trim();
      if (!query) {
        if (loaded) renderDefaultState();
        return;
      }
      if (!fuse) {
        setEmpty("搜索索引加载中...");
        return;
      }
      renderResults(fuse.search(query), query);
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

  // ── TOC 滚动高亮、容器自滚与折叠 ──
  const tocCard = document.querySelector("[data-toc-card]");
  const tocCollapseBtn = document.querySelector("[data-toc-collapse]");
  const tocBody = document.querySelector("[data-toc-body]");
  const tocLinks = document.querySelectorAll(".toc-nav a");
  const sidebarSticky = document.querySelector("[data-sidebar-sticky]");
  const sidebarEl = sidebarSticky?.closest(".article-sidebar");
  const overflowCard = sidebarSticky?.querySelector("[data-sidebar-overflow-card]");
  const footerEl = document.querySelector(".site-footer");

  let isTall = false;
  let isPinned = false;
  let pinY = 0;
  let unpinY = 0;

  const clearFixedStyles = () => {
    if (!sidebarSticky) return;
    sidebarSticky.classList.remove("is-fixed-pinned");
    sidebarSticky.style.removeProperty("top");
    sidebarSticky.style.removeProperty("left");
    sidebarSticky.style.removeProperty("width");
  };

  const syncSidebarPin = () => {
    if (!sidebarSticky || !sidebarEl || !isTall) return;
    const headerH = siteHeader ? siteHeader.offsetHeight : 60;

    if (!isPinned && window.scrollY >= pinY) {
      isPinned = true;
      const sbRect = sidebarEl.getBoundingClientRect();
      sidebarSticky.style.left = `${sbRect.left}px`;
      sidebarSticky.style.width = `${sbRect.width}px`;
      sidebarSticky.classList.add("is-fixed-pinned");
    } else if (isPinned && window.scrollY < unpinY) {
      isPinned = false;
      clearFixedStyles();
    }

    if (isPinned) {
      let topPx = headerH + 20;
      if (footerEl) {
        const footerTop = footerEl.getBoundingClientRect().top;
        const pinnedH = sidebarSticky.offsetHeight;
        topPx = Math.min(topPx, footerTop - pinnedH - 24);
      }
      sidebarSticky.style.top = `${topPx}px`;
    }
  };

  const measureSidebar = () => {
    if (!sidebarSticky || !sidebarEl || !overflowCard) return;
    isPinned = false;
    clearFixedStyles();
    sidebarSticky.classList.remove("is-tall");

    if (window.innerWidth <= 960) {
      isTall = false;
      return;
    }

    const headerH = siteHeader ? siteHeader.offsetHeight : 60;
    const availHeight = window.innerHeight - headerH - 36;
    const naturalHeight = sidebarSticky.scrollHeight;

    if (naturalHeight <= availHeight) {
      isTall = false;
      return;
    }

    const rect = sidebarSticky.getBoundingClientRect();
    const naturalDocTop = rect.top + window.scrollY;
    isTall = true;
    sidebarSticky.classList.add("is-tall");
    pinY = naturalDocTop + naturalHeight - headerH - 20;
    unpinY = Math.max(0, pinY - 60);
  };

  if (sidebarSticky && sidebarEl && overflowCard) {
    let scrollRaf = false;
    let resizeRaf = false;

    window.addEventListener(
      "scroll",
      () => {
        if (!scrollRaf) {
          scrollRaf = true;
          requestAnimationFrame(() => {
            scrollRaf = false;
            syncSidebarPin();
          });
        }
      },
      { passive: true }
    );

    window.addEventListener(
      "resize",
      () => {
        if (!resizeRaf) {
          resizeRaf = true;
          requestAnimationFrame(() => {
            resizeRaf = false;
            measureSidebar();
            syncSidebarPin();
          });
        }
      },
      { passive: true }
    );

    window.addEventListener("load", () => {
      measureSidebar();
      syncSidebarPin();
    });

    measureSidebar();
    syncSidebarPin();
  }

  if (tocCollapseBtn && tocCard) {
    tocCollapseBtn.addEventListener("click", () => {
      const collapsed = tocCard.classList.toggle("is-collapsed");
      tocCollapseBtn.setAttribute("aria-expanded", String(!collapsed));
      tocCollapseBtn.setAttribute("aria-label", collapsed ? "展开目录" : "收起目录");
      measureSidebar();
      syncSidebarPin();
    });
  }

  if (tocLinks.length) {
    tocLinks.forEach((a) => {
      const label = a.textContent.trim();
      if (label && !a.title) a.title = label;
    });

    const headings = Array.from(
      document.querySelectorAll(".post-content h2, .post-content h3, .post-content h4")
    );
    let lastActiveId = "";

    const updateToc = () => {
      const threshold = 112;
      let current = headings[0];
      for (const h of headings) {
        if (h.getBoundingClientRect().top <= threshold) {
          current = h;
        }
      }
      const currentId = current ? current.id : "";
      let activeDesktopLink = null;
      tocLinks.forEach((a) => {
        const href = a.getAttribute("href");
        const isActive = Boolean(currentId && href === "#" + currentId);
        a.classList.toggle("toc-active", isActive);
        if (isActive && tocBody && tocBody.contains(a)) {
          activeDesktopLink = a;
        }
      });

      if (activeDesktopLink && currentId !== lastActiveId) {
        lastActiveId = currentId;
        const bodyRect = tocBody.getBoundingClientRect();
        const linkRect = activeDesktopLink.getBoundingClientRect();
        const offsetTop = linkRect.top - bodyRect.top + tocBody.scrollTop;
        const targetScroll = offsetTop - tocBody.clientHeight * 0.35;
        if (linkRect.top < bodyRect.top + 24 || linkRect.bottom > bodyRect.bottom - 24) {
          tocBody.scrollTo({ top: Math.max(0, targetScroll), behavior: "smooth" });
        }
      }
    };

    let tocRaf = false;
    window.addEventListener(
      "scroll",
      () => {
        if (!tocRaf) {
          tocRaf = true;
          requestAnimationFrame(() => {
            tocRaf = false;
            updateToc();
          });
        }
      },
      { passive: true }
    );
    updateToc();
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

  // ── Lightbox：图片、流程图与 Mermaid 交互缩放预览 ──
  const lightbox = document.getElementById("lightbox");
  const lightboxStage = document.getElementById("lightbox-stage");
  const lightboxBody = document.getElementById("lightbox-body");
  const lightboxBg = document.getElementById("lightbox-bg");
  const lightboxCloseBtn = document.getElementById("lightbox-close");
  const lightboxReadout = document.querySelector(".lightbox-zoom-readout");
  const lightboxZoomInBtns = document.querySelectorAll("[data-lb-zoom-in]");
  const lightboxZoomOutBtns = document.querySelectorAll("[data-lb-zoom-out]");
  const lightboxResetBtns = document.querySelectorAll("[data-lb-reset]");

  if (lightbox && lightboxStage && lightboxBody) {
    const MIN_SCALE = 0.25;
    const MAX_SCALE = 5;
    let scale = 1;
    let tx = 0;
    let ty = 0;
    let dragMoved = false;
    let animTimer = 0;
    const pointers = new Map();
    let panOrigin = null;
    let pinchOrigin = null;

    const clampScale = (v) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, v));

    const applyTransform = (animate = false) => {
      if (animate) {
        lightboxBody.classList.add("is-animating");
        clearTimeout(animTimer);
        animTimer = window.setTimeout(() => {
          lightboxBody.classList.remove("is-animating");
        }, 200);
      } else {
        lightboxBody.classList.remove("is-animating");
      }
      lightboxBody.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(${scale})`;
      if (lightboxReadout) lightboxReadout.textContent = `${Math.round(scale * 100)}%`;
      lightboxStage.classList.toggle("is-zoomed", scale > 1.01);
    };

    const resetTransform = (animate = true) => {
      scale = 1;
      tx = 0;
      ty = 0;
      applyTransform(animate);
    };

    const zoomAt = (nextScale, clientX, clientY, animate = false) => {
      const targetScale = clampScale(Number(nextScale.toFixed(3)));
      if (targetScale === scale) return;
      if (clientX !== undefined && clientY !== undefined) {
        const rect = lightboxStage.getBoundingClientRect();
        const dx = clientX - rect.left - rect.width / 2;
        const dy = clientY - rect.top - rect.height / 2;
        tx = dx - ((dx - tx) / scale) * targetScale;
        ty = dy - ((dy - ty) / scale) * targetScale;
      }
      scale = targetScale;
      if (Math.abs(scale - 1) < 0.02 && Math.abs(tx) < 12 && Math.abs(ty) < 12) {
        tx = 0;
        ty = 0;
      }
      applyTransform(animate);
    };

    const openLightbox = (content, frameClass = "") => {
      lightboxBody.className = "lightbox-content" + (frameClass ? ` ${frameClass}` : "");
      lightboxBody.replaceChildren(content);
      pointers.clear();
      panOrigin = null;
      pinchOrigin = null;
      dragMoved = false;
      resetTransform(false);
      lightbox.hidden = false;
      document.body.style.overflow = "hidden";
    };

    const closeLightbox = () => {
      if (lightbox.hidden) return;
      lightbox.hidden = true;
      lightboxBody.replaceChildren();
      lightboxBody.className = "lightbox-content";
      pointers.clear();
      panOrigin = null;
      pinchOrigin = null;
      lightboxStage.classList.remove("is-dragging", "is-zoomed");
      document.body.style.overflow = "";
    };

    lightboxBg?.addEventListener("click", closeLightbox);
    lightboxCloseBtn?.addEventListener("click", closeLightbox);

    lightboxZoomInBtns.forEach((btn) =>
      btn.addEventListener("click", () => zoomAt(scale * 1.25, undefined, undefined, true))
    );
    lightboxZoomOutBtns.forEach((btn) =>
      btn.addEventListener("click", () => zoomAt(scale / 1.25, undefined, undefined, true))
    );
    lightboxResetBtns.forEach((btn) =>
      btn.addEventListener("click", () => resetTransform(true))
    );

    lightboxStage.addEventListener(
      "wheel",
      (e) => {
        if (lightbox.hidden) return;
        e.preventDefault();
        const step = e.deltaY < 0 ? 1.14 : 1 / 1.14;
        zoomAt(scale * step, e.clientX, e.clientY, false);
      },
      { passive: false }
    );

    lightboxStage.addEventListener("dblclick", (e) => {
      if (lightbox.hidden || e.target === lightboxStage) return;
      if (scale > 1.05) {
        resetTransform(true);
      } else {
        zoomAt(2, e.clientX, e.clientY, true);
      }
    });

    lightboxStage.addEventListener("pointerdown", (e) => {
      if (e.button !== 0 && e.pointerType === "mouse") return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      lightboxStage.setPointerCapture?.(e.pointerId);

      if (pointers.size === 1) {
        dragMoved = false;
        if (scale > 1.01 || e.target !== lightboxStage) {
          panOrigin = { x: e.clientX, y: e.clientY, tx, ty };
          lightboxStage.classList.add("is-dragging");
        }
      } else if (pointers.size === 2) {
        panOrigin = null;
        const pts = Array.from(pointers.values());
        const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y) || 1;
        pinchOrigin = {
          dist,
          scale,
          tx,
          ty,
          midX: (pts[0].x + pts[1].x) / 2,
          midY: (pts[0].y + pts[1].y) / 2,
        };
      }
    });

    lightboxStage.addEventListener("pointermove", (e) => {
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (pointers.size === 2 && pinchOrigin) {
        dragMoved = true;
        const pts = Array.from(pointers.values());
        const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y) || 1;
        const midX = (pts[0].x + pts[1].x) / 2;
        const midY = (pts[0].y + pts[1].y) / 2;
        const nextScale = clampScale(pinchOrigin.scale * (dist / pinchOrigin.dist));
        const rect = lightboxStage.getBoundingClientRect();
        const dx = pinchOrigin.midX - rect.left - rect.width / 2;
        const dy = pinchOrigin.midY - rect.top - rect.height / 2;
        tx =
          dx -
          ((dx - pinchOrigin.tx) / pinchOrigin.scale) * nextScale +
          (midX - pinchOrigin.midX);
        ty =
          dy -
          ((dy - pinchOrigin.ty) / pinchOrigin.scale) * nextScale +
          (midY - pinchOrigin.midY);
        scale = nextScale;
        applyTransform(false);
        return;
      }

      if (pointers.size === 1 && panOrigin) {
        const moveX = e.clientX - panOrigin.x;
        const moveY = e.clientY - panOrigin.y;
        if (Math.hypot(moveX, moveY) > 4) {
          dragMoved = true;
        }
        if (scale > 1.01) {
          tx = panOrigin.tx + moveX;
          ty = panOrigin.ty + moveY;
          applyTransform(false);
        }
      }
    });

    const releasePointer = (e) => {
      if (!pointers.has(e.pointerId)) return;
      pointers.delete(e.pointerId);
      lightboxStage.releasePointerCapture?.(e.pointerId);
      if (pointers.size < 2) pinchOrigin = null;
      if (pointers.size === 0) {
        panOrigin = null;
        lightboxStage.classList.remove("is-dragging");
      }
    };

    lightboxStage.addEventListener("pointerup", releasePointer);
    lightboxStage.addEventListener("pointercancel", releasePointer);

    lightboxStage.addEventListener("click", (e) => {
      if (dragMoved) {
        dragMoved = false;
        return;
      }
      if (e.target === lightboxStage) {
        closeLightbox();
      }
    });

    document.addEventListener("keydown", (e) => {
      if (lightbox.hidden) return;
      if (e.key === "Escape") {
        closeLightbox();
      } else if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        zoomAt(scale * 1.25, undefined, undefined, true);
      } else if (e.key === "-" || e.key === "_") {
        e.preventDefault();
        zoomAt(scale / 1.25, undefined, undefined, true);
      } else if (e.key === "0") {
        e.preventDefault();
        resetTransform(true);
      }
    });

    document.querySelectorAll(".post-content img").forEach((img) => {
      if (img.closest("a")) return;
      img.classList.add("zoomable");
      img.addEventListener("click", () => {
        const clone = document.createElement("img");
        clone.src = img.src;
        clone.alt = img.alt;
        clone.draggable = false;
        if (img.classList.contains("diagram-image-auto-dark")) {
          clone.classList.add("diagram-image-auto-dark");
        }
        const frameClass = img.closest(".diagram-excalidraw") ? "lightbox-diagram-frame" : "";
        openLightbox(clone, frameClass);
      });
    });

    window.addEventListener("open-lightbox-mermaid", (e) => {
      const svg = e.detail?.svg;
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
      clone.style.cssText = "display:block;width:min(86vw,68rem);max-height:78vh;height:auto;";
      openLightbox(clone, "lightbox-svg-frame");
    });
  }
})();
