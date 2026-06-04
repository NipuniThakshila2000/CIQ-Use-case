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

window.addEventListener("scroll", handleScroll, { passive: true });
window.addEventListener("load", () => {
  handleScroll();
  setupLazyVideos();
});
handleScroll();
setupLazyVideos();

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
