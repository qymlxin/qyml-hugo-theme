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

  if (themeButton) {
    updateThemeButton();
    themeButton.addEventListener("click", () => {
      const nextTheme = currentTheme() === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = nextTheme;
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

  // 代码块：注入语言标签 + 复制按钮
  document.querySelectorAll(".post-content .highlight").forEach((block) => {
    // 从 class 里提取语言（Hugo 生成的 class 形如 "language-go"）
    const pre = block.querySelector("pre");
    const code = pre?.querySelector("code");
    const langClass = code?.className.match(/language-(\w+)/);
    if (langClass) block.dataset.lang = langClass[1];

    // 插入复制按钮
    const btn = document.createElement("button");
    btn.className = "code-copy-btn";
    btn.setAttribute("aria-label", "复制代码");
    btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`;
    block.appendChild(btn);

    btn.addEventListener("click", async () => {
      const text = code?.innerText ?? pre?.innerText ?? "";
      try {
        await navigator.clipboard.writeText(text);
        btn.classList.add("copied");
        btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
        setTimeout(() => {
          btn.classList.remove("copied");
          btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`;
        }, 2000);
      } catch {
        // clipboard 不可用时静默失败
      }
    });
  });

  // TOC 滚动高亮
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
})();
