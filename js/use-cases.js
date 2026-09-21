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

function setupDeferredVideos() {
  const lazyVideos = [...document.querySelectorAll("video.lazy-video")];

  if (!lazyVideos.length) {
    return;
  }

  lazyVideos.forEach((video) => {
    if (video.dataset.deferredReady === "true") {
      return;
    }

    const frame = video.parentElement;
    const button = document.createElement("button");

    video.dataset.deferredReady = "true";
    video.removeAttribute("autoplay");

    if (frame) {
      frame.classList.add("deferred-video");
    }

    button.className = "video-load-button";
    button.type = "button";
    button.textContent = "Play Video";
    button.addEventListener("click", () => {
      loadVideo(video);
      frame?.classList.add("is-loaded");
    });

    frame?.appendChild(button);

  });
}

function setupPressReadMore() {
  const moreItems = document.querySelectorAll(".press-more");
  const lessButtons = document.querySelectorAll(".press-less");

  moreItems.forEach((item) => {
    if (item.dataset.pressMoreBound === "true") {
      return;
    }

    item.dataset.pressMoreBound = "true";
    item.addEventListener("toggle", () => {
      window.requestAnimationFrame(postIframeHeight);
    });
  });

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
      window.requestAnimationFrame(postIframeHeight);
    });
  });
}

function setupLogoMarquee() {
  const track = document.querySelector(".logo-track");

  if (
    !track ||
    track.dataset.marqueeReady === "true" ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    return;
  }

  const logos = [...track.children];
  const cloneSet = document.createDocumentFragment();

  logos.forEach((logo) => {
    const clone = logo.cloneNode(true);
    clone.setAttribute("aria-hidden", "true");
    clone.tabIndex = -1;
    cloneSet.appendChild(clone);
  });

  track.appendChild(cloneSet);
  track.dataset.marqueeReady = "true";
}

window.addEventListener("scroll", handleScroll, { passive: true });
window.addEventListener("load", () => {
  handleScroll();
  setupAnchorLinks();
  setupLogoMarquee();
  setupDeferredVideos();
  setupPressReadMore();
});
handleScroll();
setupAnchorLinks();
setupLogoMarquee();
setupDeferredVideos();
setupPressReadMore();

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
