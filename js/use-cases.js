const header = document.querySelector(".site-header");
const navLinks = document.querySelectorAll(".nav-links a[href^='#']");

function setHeaderState() {
  if (!header) {
    return;
  }

  header.classList.toggle("is-scrolled", window.scrollY > 8);
}

function setActiveNavLink() {
  const sections = [...document.querySelectorAll("main section[id]")];
  const currentSection = sections.reverse().find((section) => {
    const bounds = section.getBoundingClientRect();
    return bounds.top <= 140;
  });

  navLinks.forEach((link) => {
    const isActive = currentSection && link.hash === `#${currentSection.id}`;
    if (isActive) {
      link.setAttribute("aria-current", "page");
      return;
    }

    link.removeAttribute("aria-current");
  });
}

function handleScroll() {
  setHeaderState();
  setActiveNavLink();
}

function setupAnchorLinks() {
  const anchorLinks = document.querySelectorAll("a[href^='#']");

  anchorLinks.forEach((link) => {
    if (link.dataset.anchorBound === "true") {
      return;
    }

    link.dataset.anchorBound = "true";
    link.addEventListener("click", (event) => {
      const target = document.querySelector(link.getAttribute("href"));

      if (!target) {
        return;
      }

      event.preventDefault();
      window.parent.postMessage(
        {
          source: "ciq-use-case",
          type: "anchor",
          target: link.getAttribute("href").slice(1),
          top: Math.round(target.getBoundingClientRect().top + window.scrollY),
        },
        "*",
      );
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      window.history.pushState(null, "", link.getAttribute("href"));
    });
  });
}

function loadVideo(video) {
  if (!video || video.dataset.loaded === "true") {
    return;
  }

  const sources = video.querySelectorAll("source[data-src]");

  sources.forEach((source) => {
    source.src = source.dataset.src;
    source.removeAttribute("data-src");
  });

  video.dataset.loaded = "true";
  video.load();

  const playPromise = video.play();
  if (playPromise) {
    playPromise.catch(() => {});
  }
}

function setupLazyVideos() {
  const lazyVideos = [...document.querySelectorAll("video.lazy-video")];

  if (!lazyVideos.length) {
    return;
  }

  if (!("IntersectionObserver" in window)) {
    lazyVideos.forEach(loadVideo);
    return;
  }

  const videoObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        loadVideo(entry.target);
        videoObserver.unobserve(entry.target);
      });
    },
    {
      rootMargin: "600px 0px",
      threshold: 0.01,
    },
  );

  lazyVideos.forEach((video) => videoObserver.observe(video));
}

function setupPressReadMore() {
  const lessButtons = document.querySelectorAll(".press-less");

  lessButtons.forEach((button) => {
    if (button.dataset.pressLessBound === "true") {
      return;
    }

    button.dataset.pressLessBound = "true";
    button.addEventListener("click", () => {
      const details = button.closest("details");

      if (!details) {
        return;
      }

      details.open = false;
      details.scrollIntoView({ behavior: "smooth", block: "center" });
      postIframeHeight();
    });
  });
}

function collapseOpenPressItems() {
  const openItems = document.querySelectorAll(".press-more[open]");

  if (!openItems.length) {
    return;
  }

  openItems.forEach((item) => {
    item.open = false;
  });

  postIframeHeight();
}

function collapsePressItemsAfterParentScroll(iframeViewportTop, parentViewportHeight) {
  const pressSection = document.querySelector(".press-section");

  if (!pressSection || !Number.isFinite(iframeViewportTop) || !Number.isFinite(parentViewportHeight)) {
    return;
  }

  const nextContent = document.querySelector(".press-section + .section-divider + .image-story");

  if (nextContent && iframeViewportTop >= nextContent.offsetTop - 120) {
    collapseOpenPressItems();
    return;
  }

  const sectionBottom = pressSection.offsetTop + pressSection.offsetHeight;
  if (iframeViewportTop > sectionBottom - 120) {
    collapseOpenPressItems();
  }
}

function setupPressAutoCollapse() {
  const pressSection = document.querySelector(".press-section");

  if (!pressSection || pressSection.dataset.autoCollapseBound === "true") {
    return;
  }

  pressSection.dataset.autoCollapseBound = "true";

  let isTicking = false;
  window.addEventListener(
    "scroll",
    () => {
      if (isTicking) {
        return;
      }

      isTicking = true;
      window.requestAnimationFrame(() => {
        isTicking = false;

        const bounds = pressSection.getBoundingClientRect();
        if (bounds.bottom <= 120) {
          collapseOpenPressItems();
        }
      });
    },
    { passive: true },
  );

  window.addEventListener(
    "wheel",
    (event) => {
      if (event.deltaY <= 0 || event.target.closest(".press-card-event")) {
        return;
      }

      collapseOpenPressItems();
    },
    { passive: true },
  );

  let touchStartY = null;
  window.addEventListener(
    "touchstart",
    (event) => {
      touchStartY = event.touches[0]?.clientY ?? null;
    },
    { passive: true },
  );

  window.addEventListener(
    "touchmove",
    (event) => {
      if (touchStartY === null || event.target.closest(".press-card-event")) {
        return;
      }

      const currentY = event.touches[0]?.clientY ?? touchStartY;
      if (touchStartY - currentY > 18) {
        collapseOpenPressItems();
      }
    },
    { passive: true },
  );

  window.addEventListener("message", (event) => {
    if (!event.data || event.data.source !== "ciq-wix-parent" || event.data.type !== "viewport") {
      return;
    }

    collapsePressItemsAfterParentScroll(event.data.iframeViewportTop, event.data.parentViewportHeight);
  });
}

window.addEventListener("scroll", handleScroll, { passive: true });
window.addEventListener("load", () => {
  handleScroll();
  setupAnchorLinks();
  setupLazyVideos();
  setupPressReadMore();
  setupPressAutoCollapse();
});
handleScroll();
setupAnchorLinks();
setupLazyVideos();
setupPressReadMore();
setupPressAutoCollapse();

function getDocumentHeight() {
  return Math.ceil(
    Math.max(
      document.body.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.clientHeight,
      document.documentElement.scrollHeight,
      document.documentElement.offsetHeight,
    ),
  );
}

function postIframeHeight() {
  if (window.parent === window) {
    return;
  }

  window.parent.postMessage(
    {
      source: "ciq-use-case",
      type: "resize",
      height: getDocumentHeight(),
    },
    "*",
  );
}

window.addEventListener("load", postIframeHeight);
window.addEventListener("resize", postIframeHeight);

if ("ResizeObserver" in window) {
  const resizeObserver = new ResizeObserver(postIframeHeight);
  resizeObserver.observe(document.body);
}

postIframeHeight();
