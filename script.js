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

const openModalButtons = document.querySelectorAll("[data-open-modal]");
const closeModalButtons = document.querySelectorAll("[data-close-modal]");

const closeAllModals = () => {
  document.querySelectorAll(".modal.is-open").forEach((modal) => {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
  });
};

openModalButtons.forEach((button) => {
  button.addEventListener("click", (event) => {
    event.preventDefault();
    const target = button.getAttribute("data-open-modal");
    const modal = document.querySelector(`.modal[data-modal=\"${target}\"]`);
    if (modal) {
      closeAllModals();
      modal.classList.add("is-open");
      modal.setAttribute("aria-hidden", "false");
    }
  });
});

closeModalButtons.forEach((button) => {
  button.addEventListener("click", (event) => {
    event.preventDefault();
    closeAllModals();
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeAllModals();
  }
});
