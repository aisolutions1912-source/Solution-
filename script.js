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

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);

const paystubForm = document.getElementById("paystubForm");

const updatePaystubPreview = () => {
  const employeeName = document.getElementById("employeeName")?.value || "Employee";
  const payPeriod = document.getElementById("payPeriod")?.value || "Weekly";
  const hourlyRate = Number(document.getElementById("hourlyRate")?.value || 0);
  const hoursWorked = Number(document.getElementById("hoursWorked")?.value || 0);
  const bonusPay = Number(document.getElementById("bonusPay")?.value || 0);
  const otherEarnings = Number(document.getElementById("otherEarnings")?.value || 0);
  const federalTax = Number(document.getElementById("federalTax")?.value || 0);
  const stateTax = Number(document.getElementById("stateTax")?.value || 0);
  const benefits = Number(document.getElementById("benefits")?.value || 0);
  const otherDeductions = Number(document.getElementById("otherDeductions")?.value || 0);

  const grossPay = hourlyRate * hoursWorked + bonusPay + otherEarnings;
  const totalDeductions = federalTax + stateTax + benefits + otherDeductions;
  const netPay = grossPay - totalDeductions;

  const previewEmployee = document.getElementById("previewEmployee");
  const previewPayPeriod = document.getElementById("previewPayPeriod");
  const previewGross = document.getElementById("previewGross");
  const previewDeductions = document.getElementById("previewDeductions");
  const previewNet = document.getElementById("previewNet");
  const previewFederal = document.getElementById("previewFederal");
  const previewState = document.getElementById("previewState");
  const previewBenefits = document.getElementById("previewBenefits");

  if (previewEmployee) previewEmployee.textContent = employeeName;
  if (previewPayPeriod) previewPayPeriod.textContent = `Weekly • ${payPeriod}`;
  if (previewGross) previewGross.textContent = formatCurrency(grossPay);
  if (previewDeductions) previewDeductions.textContent = formatCurrency(totalDeductions);
  if (previewNet) previewNet.textContent = formatCurrency(Math.max(netPay, 0));
  if (previewFederal) previewFederal.textContent = formatCurrency(federalTax);
  if (previewState) previewState.textContent = formatCurrency(stateTax);
  if (previewBenefits) previewBenefits.textContent = formatCurrency(benefits);
};

if (paystubForm) {
  paystubForm.addEventListener("submit", (event) => {
    event.preventDefault();
    updatePaystubPreview();
  });

  paystubForm.addEventListener("input", () => {
    updatePaystubPreview();
  });

  updatePaystubPreview();
}
