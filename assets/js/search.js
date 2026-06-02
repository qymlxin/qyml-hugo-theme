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
})();
