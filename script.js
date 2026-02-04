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

const downloadPaystubButton = document.getElementById("downloadPaystubPdf");

if (downloadPaystubButton && paystubForm) {
  downloadPaystubButton.addEventListener("click", (event) => {
    event.preventDefault();

    const employeeName = document.getElementById("employeeName")?.value || "Employee";
    const payPeriod = document.getElementById("payPeriod")?.value || "Weekly";
    const previewGross = document.getElementById("previewGross")?.textContent || "$0.00";
    const previewDeductions = document.getElementById("previewDeductions")?.textContent || "$0.00";
    const previewNet = document.getElementById("previewNet")?.textContent || "$0.00";
    const previewFederal = document.getElementById("previewFederal")?.textContent || "$0.00";
    const previewState = document.getElementById("previewState")?.textContent || "$0.00";
    const previewBenefits = document.getElementById("previewBenefits")?.textContent || "$0.00";

    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) {
      return;
    }

    printWindow.document.write(`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Pay Stub - ${employeeName}</title>
    <style>
      body { font-family: "Inter", Arial, sans-serif; margin: 40px; color: #0f172a; }
      h1 { font-size: 24px; margin-bottom: 8px; }
      .meta { color: #5b677a; margin-bottom: 24px; }
      .grid { display: grid; gap: 12px; }
      .row { display: flex; justify-content: space-between; padding-bottom: 8px; border-bottom: 1px solid #e2e8f0; }
      .total { background: #f1f5ff; padding: 12px 16px; border-radius: 10px; font-weight: 600; }
      .deductions { margin-top: 16px; padding: 12px 16px; background: #f8fafc; border-radius: 10px; }
    </style>
  </head>
  <body>
    <h1>Pay Stub</h1>
    <p class="meta">${employeeName} • ${payPeriod}</p>
    <div class="grid">
      <div class="row"><span>Gross pay</span><strong>${previewGross}</strong></div>
      <div class="row"><span>Total deductions</span><strong>${previewDeductions}</strong></div>
      <div class="row total"><span>Net pay</span><strong>${previewNet}</strong></div>
    </div>
    <div class="deductions">
      <div class="row"><span>Federal tax</span><strong>${previewFederal}</strong></div>
      <div class="row"><span>State tax</span><strong>${previewState}</strong></div>
      <div class="row"><span>Benefits</span><strong>${previewBenefits}</strong></div>
    </div>
  </body>
</html>`);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  });
}
