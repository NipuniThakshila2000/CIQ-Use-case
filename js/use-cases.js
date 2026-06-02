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

window.addEventListener("scroll", handleScroll, { passive: true });
window.addEventListener("load", handleScroll);
handleScroll();
