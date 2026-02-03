const toggleBtn = document.getElementById("toggleBtn");

if (toggleBtn) {
  toggleBtn.addEventListener("click", () => {
    const isActive = toggleBtn.classList.toggle("active");
    toggleBtn.setAttribute("aria-pressed", String(isActive));
  });
}

const backToTopBtn = document.querySelector(".site-footer .btn.ghost");

if (backToTopBtn) {
  backToTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}
