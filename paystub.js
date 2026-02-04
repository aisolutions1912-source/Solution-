const builderForm = document.getElementById("paystubBuilder");

if (builderForm) {
  const STORAGE_KEY = "paystub-builder-state";
  const SNAPSHOT_KEY = "paystub-builder-snapshot";

  const defaultState = {
    company: {
      name: "",
      id: "",
      address: "",
      phone: "",
      email: "",
    },
    employee: {
      name: "",
      id: "",
      address: "",
    },
    period: {
      frequency: "Weekly",
      start: "",
      end: "",
      payDate: "",
    },
    earnings: [
      {
        id: crypto.randomUUID(),
        type: "Hourly",
        description: "Regular hours",
        rate: 25,
        hours: 40,
        multiplier: 1,
        amount: 0,
      },
    ],
    taxes: [
      {
        id: crypto.randomUUID(),
        name: "Federal withholding",
        mode: "amount",
        value: 120,
      },
      {
        id: crypto.randomUUID(),
        name: "Social Security",
        mode: "percent",
        value: 6.2,
      },
      {
        id: crypto.randomUUID(),
        name: "Medicare",
        mode: "percent",
        value: 1.45,
      },
    ],
    deductions: [
      {
        id: crypto.randomUUID(),
        name: "Health insurance",
        mode: "amount",
        value: 85,
        timing: "pre",
      },
    ],
    prior: {
      gross: 0,
      taxes: 0,
      deductions: 0,
    },
  };

  let state = structuredClone(defaultState);
  let autosaveTimer;

  const formatCurrency = (value) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(value);

  const formatDate = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const parseNumber = (value) => {
    const parsed = Number(value);
    if (Number.isNaN(parsed) || parsed < 0) return 0;
    return parsed;
  };

  const debounceSave = () => {
    clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }, 400);
  };

  const readForm = () => {
    const formData = new FormData(builderForm);
    state.company = {
      name: formData.get("companyName")?.trim() || "",
      id: formData.get("companyId")?.trim() || "",
      address: formData.get("companyAddress")?.trim() || "",
      phone: formData.get("companyPhone")?.trim() || "",
      email: formData.get("companyEmail")?.trim() || "",
    };
    state.employee = {
      name: formData.get("employeeName")?.trim() || "",
      id: formData.get("employeeId")?.trim() || "",
      address: formData.get("employeeAddress")?.trim() || "",
    };
    state.period = {
      frequency: formData.get("payFrequency") || "Weekly",
      start: formData.get("periodStart") || "",
      end: formData.get("periodEnd") || "",
      payDate: formData.get("payDate") || "",
    };
    state.prior = {
      gross: parseNumber(formData.get("priorGross")),
      taxes: parseNumber(formData.get("priorTaxes")),
      deductions: parseNumber(formData.get("priorDeductions")),
    };
  };

  const calculateEarningAmount = (earning) => {
    const rate = parseNumber(earning.rate);
    const hours = parseNumber(earning.hours);
    const multiplier = parseNumber(earning.multiplier) || 1;

    if (earning.type === "Hourly") {
      return rate * hours;
    }
    if (earning.type === "Overtime") {
      return rate * hours * multiplier;
    }
    return parseNumber(earning.amount);
  };

  const computeTotals = () => {
    const earnings = state.earnings.map((earning) => ({
      ...earning,
      amount: calculateEarningAmount(earning),
    }));

    const gross = earnings.reduce((total, row) => total + row.amount, 0);

    const preTaxDeductions = state.deductions.filter((row) => row.timing === "pre");
    const postTaxDeductions = state.deductions.filter((row) => row.timing === "post");

    const preTaxTotal = preTaxDeductions.reduce((total, row) => {
      const value = parseNumber(row.value);
      if (row.mode === "percent") {
        return total + (gross * value) / 100;
      }
      return total + value;
    }, 0);

    const taxableWages = Math.max(gross - preTaxTotal, 0);

    const taxesTotal = state.taxes.reduce((total, row) => {
      const value = parseNumber(row.value);
      if (row.mode === "percent") {
        return total + (taxableWages * value) / 100;
      }
      return total + value;
    }, 0);

    const postTaxTotal = postTaxDeductions.reduce((total, row) => {
      const value = parseNumber(row.value);
      if (row.mode === "percent") {
        return total + (taxableWages * value) / 100;
      }
      return total + value;
    }, 0);

    const totalDeductions = preTaxTotal + postTaxTotal;
    const netPay = Math.max(gross - taxesTotal - totalDeductions, 0);

    return {
      earnings,
      gross,
      taxableWages,
      taxesTotal,
      totalDeductions,
      netPay,
      ytd: {
        gross: state.prior.gross + gross,
        taxes: state.prior.taxes + taxesTotal,
        deductions: state.prior.deductions + totalDeductions,
      },
      preTaxTotal,
      postTaxTotal,
    };
  };

  const renderRows = () => {
    const earningsContainer = document.getElementById("earningsRows");
    const taxContainer = document.getElementById("taxRows");
    const deductionContainer = document.getElementById("deductionRows");

    earningsContainer.innerHTML = state.earnings
      .map((row) => {
        const isAuto = row.type === "Hourly" || row.type === "Overtime";
        return `
        <div class="table-row" data-type="earnings" data-id="${row.id}">
          <select data-field="type">
            ${["Hourly", "Salary", "Overtime", "Bonus", "Commission", "Tips", "Other"]
              .map(
                (type) =>
                  `<option value="${type}" ${row.type === type ? "selected" : ""}>${type}</option>`
              )
              .join("")}
          </select>
          <input type="text" data-field="description" placeholder="Description" value="${row.description}" />
          <input type="number" data-field="rate" min="0" step="0.01" placeholder="Rate" value="${row.rate}" />
          <input type="number" data-field="hours" min="0" step="0.1" placeholder="Hours" value="${row.hours}" />
          <input type="number" data-field="multiplier" min="0" step="0.1" placeholder="Mult" value="${row.multiplier}" />
          <input type="number" data-field="amount" min="0" step="0.01" placeholder="Amount" value="${row.amount}" ${
            isAuto ? "readonly" : ""
          } />
          <button type="button" class="icon-btn" data-remove-row aria-label="Remove">✕</button>
        </div>`;
      })
      .join("");

    taxContainer.innerHTML = state.taxes
      .map(
        (row) => `
        <div class="table-row" data-type="taxes" data-id="${row.id}">
          <input type="text" data-field="name" placeholder="Tax name" value="${row.name}" />
          <select data-field="mode">
            <option value="amount" ${row.mode === "amount" ? "selected" : ""}>Amount</option>
            <option value="percent" ${row.mode === "percent" ? "selected" : ""}>Percent</option>
          </select>
          <input type="number" data-field="value" min="0" step="0.01" placeholder="Value" value="${row.value}" />
          <button type="button" class="icon-btn" data-remove-row aria-label="Remove">✕</button>
        </div>`
      )
      .join("");

    deductionContainer.innerHTML = state.deductions
      .map(
        (row) => `
        <div class="table-row" data-type="deductions" data-id="${row.id}">
          <input type="text" data-field="name" placeholder="Deduction name" value="${row.name}" />
          <select data-field="timing">
            <option value="pre" ${row.timing === "pre" ? "selected" : ""}>Pre-tax</option>
            <option value="post" ${row.timing === "post" ? "selected" : ""}>Post-tax</option>
          </select>
          <select data-field="mode">
            <option value="amount" ${row.mode === "amount" ? "selected" : ""}>Amount</option>
            <option value="percent" ${row.mode === "percent" ? "selected" : ""}>Percent</option>
          </select>
          <input type="number" data-field="value" min="0" step="0.01" placeholder="Value" value="${row.value}" />
          <button type="button" class="icon-btn" data-remove-row aria-label="Remove">✕</button>
        </div>`
      )
      .join("");
  };

  const renderPreview = () => {
    const totals = computeTotals();

    document.getElementById("previewCompany").textContent =
      state.company.name || "Add company details";
    document.getElementById("previewEmployee").textContent =
      state.employee.name || "Add employee details";

    const periodLabel = `${state.period.frequency} · ${formatDate(state.period.start)} - ${formatDate(
      state.period.end
    )} · Pay date ${formatDate(state.period.payDate)}`.trim();
    document.getElementById("previewPeriod").textContent = periodLabel;

    const earningsRows = totals.earnings
      .map(
        (row) =>
          `<div><span>${row.description || row.type}</span><strong>${formatCurrency(
            row.amount
          )}</strong></div>`
      )
      .join("");
    document.getElementById("previewEarnings").innerHTML = earningsRows || "<p>—</p>";

    const taxRows = state.taxes
      .map((row) => {
        const value = row.mode === "percent" ? `${row.value}%` : formatCurrency(parseNumber(row.value));
        return `<div><span>${row.name}</span><strong>${value}</strong></div>`;
      })
      .join("");
    document.getElementById("previewTaxes").innerHTML = taxRows || "<p>—</p>";

    const deductionRows = state.deductions
      .map((row) => {
        const label = row.timing === "pre" ? "Pre-tax" : "Post-tax";
        const value = row.mode === "percent" ? `${row.value}%` : formatCurrency(parseNumber(row.value));
        return `<div><span>${row.name} <em>(${label})</em></span><strong>${value}</strong></div>`;
      })
      .join("");
    document.getElementById("previewDeductions").innerHTML = deductionRows || "<p>—</p>";

    document.getElementById("previewGross").textContent = formatCurrency(totals.gross);
    document.getElementById("previewTaxesTotal").textContent = formatCurrency(totals.taxesTotal);
    document.getElementById("previewDeductionsTotal").textContent = formatCurrency(totals.totalDeductions);
    document.getElementById("previewTaxable").textContent = formatCurrency(totals.taxableWages);
    document.getElementById("previewNet").textContent = formatCurrency(totals.netPay);
    document.getElementById("previewYtdGross").textContent = formatCurrency(totals.ytd.gross);
    document.getElementById("previewYtdTaxes").textContent = formatCurrency(totals.ytd.taxes);
    document.getElementById("previewYtdDeductions").textContent = formatCurrency(totals.ytd.deductions);

    const warningBadge = document.getElementById("warningBadge");
    const netBadge = document.getElementById("netBadge");

    if (totals.netPay === 0 && (totals.taxesTotal + totals.totalDeductions) > totals.gross) {
      warningBadge.textContent = "Net pay is $0.00 (deductions exceed earnings).";
      netBadge.classList.add("badge-warning");
    } else {
      warningBadge.textContent = "";
      netBadge.classList.remove("badge-warning");
    }
  };

  const syncForm = () => {
    builderForm.companyName.value = state.company.name;
    builderForm.companyId.value = state.company.id;
    builderForm.companyAddress.value = state.company.address;
    builderForm.companyPhone.value = state.company.phone;
    builderForm.companyEmail.value = state.company.email;
    builderForm.employeeName.value = state.employee.name;
    builderForm.employeeId.value = state.employee.id;
    builderForm.employeeAddress.value = state.employee.address;
    builderForm.payFrequency.value = state.period.frequency;
    builderForm.payDate.value = state.period.payDate;
    builderForm.periodStart.value = state.period.start;
    builderForm.periodEnd.value = state.period.end;
    builderForm.priorGross.value = state.prior.gross || "";
    builderForm.priorTaxes.value = state.prior.taxes || "";
    builderForm.priorDeductions.value = state.prior.deductions || "";
  };

  const render = () => {
    renderRows();
    readForm();
    renderPreview();
    debounceSave();
  };

  const addRow = (type) => {
    if (type === "earnings") {
      state.earnings.push({
        id: crypto.randomUUID(),
        type: "Hourly",
        description: "New earning",
        rate: 0,
        hours: 0,
        multiplier: 1,
        amount: 0,
      });
    }
    if (type === "taxes") {
      state.taxes.push({
        id: crypto.randomUUID(),
        name: "New tax",
        mode: "amount",
        value: 0,
      });
    }
    if (type === "deductions") {
      state.deductions.push({
        id: crypto.randomUUID(),
        name: "New deduction",
        mode: "amount",
        value: 0,
        timing: "post",
      });
    }
    render();
  };

  const removeRow = (type, id) => {
    state[type] = state[type].filter((row) => row.id !== id);
    render();
  };

  const updateRow = (type, id, field, value) => {
    const row = state[type].find((item) => item.id === id);
    if (!row) return;
    row[field] = field === "value" || field === "rate" || field === "hours" || field === "multiplier" || field === "amount"
      ? parseNumber(value)
      : value;
    renderPreview();
    debounceSave();
  };

  const loadState = (data) => {
    if (!data || typeof data !== "object") return;
    state = {
      company: { ...defaultState.company, ...data.company },
      employee: { ...defaultState.employee, ...data.employee },
      period: { ...defaultState.period, ...data.period },
      earnings: Array.isArray(data.earnings) && data.earnings.length ? data.earnings : defaultState.earnings,
      taxes: Array.isArray(data.taxes) && data.taxes.length ? data.taxes : defaultState.taxes,
      deductions: Array.isArray(data.deductions) && data.deductions.length ? data.deductions : defaultState.deductions,
      prior: { ...defaultState.prior, ...data.prior },
    };
    syncForm();
    render();
  };

  builderForm.addEventListener("input", (event) => {
    const row = event.target.closest(".table-row");
    if (row && event.target.dataset.field) {
      updateRow(row.dataset.type, row.dataset.id, event.target.dataset.field, event.target.value);
      return;
    }
    readForm();
    renderPreview();
    debounceSave();
  });

  builderForm.addEventListener("submit", (event) => {
    event.preventDefault();
  });

  builderForm.addEventListener("click", (event) => {
    const target = event.target.closest("[data-add-row]");
    if (target) {
      addRow(target.dataset.addRow);
      return;
    }

    const removeButton = event.target.closest("[data-remove-row]");
    if (removeButton) {
      const row = removeButton.closest(".table-row");
      if (!row) return;
      removeRow(row.dataset.type, row.dataset.id);
    }
  });

  builderForm.addEventListener("change", (event) => {
    const row = event.target.closest(".table-row");
    if (!row) return;
    const field = event.target.dataset.field;
    if (!field) return;
    updateRow(row.dataset.type, row.dataset.id, field, event.target.value);
  });

  document.getElementById("fillExample").addEventListener("click", () => {
    loadState({
      company: {
        name: "Summit Ridge Cafe",
        id: "12-3456789",
        address: "410 Market St, Denver, CO",
        phone: "(303) 555-2419",
        email: "payroll@summitridge.com",
      },
      employee: {
        name: "Jordan Ellis",
        id: "EMP-1042",
        address: "88 Willow Ave, Denver, CO",
      },
      period: {
        frequency: "Biweekly",
        start: "2026-01-12",
        end: "2026-01-25",
        payDate: "2026-01-28",
      },
      earnings: [
        {
          id: crypto.randomUUID(),
          type: "Hourly",
          description: "Regular hours",
          rate: 26,
          hours: 80,
          multiplier: 1,
          amount: 0,
        },
        {
          id: crypto.randomUUID(),
          type: "Overtime",
          description: "Overtime",
          rate: 26,
          hours: 6,
          multiplier: 1.5,
          amount: 0,
        },
        {
          id: crypto.randomUUID(),
          type: "Bonus",
          description: "Performance bonus",
          rate: 0,
          hours: 0,
          multiplier: 1,
          amount: 150,
        },
      ],
      taxes: [
        {
          id: crypto.randomUUID(),
          name: "Federal withholding",
          mode: "amount",
          value: 210,
        },
        {
          id: crypto.randomUUID(),
          name: "State tax",
          mode: "amount",
          value: 92,
        },
        {
          id: crypto.randomUUID(),
          name: "Social Security",
          mode: "percent",
          value: 6.2,
        },
        {
          id: crypto.randomUUID(),
          name: "Medicare",
          mode: "percent",
          value: 1.45,
        },
      ],
      deductions: [
        {
          id: crypto.randomUUID(),
          name: "401(k)",
          mode: "percent",
          value: 4,
          timing: "pre",
        },
        {
          id: crypto.randomUUID(),
          name: "Health insurance",
          mode: "amount",
          value: 75,
          timing: "pre",
        },
        {
          id: crypto.randomUUID(),
          name: "Transit pass",
          mode: "amount",
          value: 18,
          timing: "post",
        },
      ],
      prior: {
        gross: 21500,
        taxes: 4800,
        deductions: 2100,
      },
    });
  });

  document.getElementById("resetForm").addEventListener("click", () => {
    if (window.confirm("Reset the form and clear all fields?")) {
      loadState(structuredClone(defaultState));
      localStorage.removeItem(STORAGE_KEY);
    }
  });

  document.getElementById("saveSnapshot").addEventListener("click", () => {
    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(state));
  });

  document.getElementById("loadSnapshot").addEventListener("click", () => {
    const saved = localStorage.getItem(SNAPSHOT_KEY);
    if (saved) {
      loadState(JSON.parse(saved));
    }
  });

  document.getElementById("exportJson").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "paystub.json";
    link.click();
    URL.revokeObjectURL(url);
  });

  document.getElementById("importJson").addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        loadState(data);
      } catch (error) {
        alert("Invalid JSON file.");
      }
    };
    reader.readAsText(file);
  });

  document.getElementById("downloadPaystubPdf").addEventListener("click", () => {
    const totals = computeTotals();
    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) return;

    printWindow.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Pay Stub</title>
  <style>
    body { font-family: "Inter", Arial, sans-serif; color: #0f172a; margin: 40px; }
    h1 { font-size: 24px; margin-bottom: 8px; }
    .meta { color: #5b677a; margin-bottom: 24px; }
    .section { margin-bottom: 18px; }
    .row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #e2e8f0; }
    .total { background: #f1f5ff; padding: 10px 12px; border-radius: 8px; font-weight: 600; }
  </style>
</head>
<body>
  <h1>Pay Stub</h1>
  <p class="meta">${state.company.name || "Company"} • ${state.employee.name || "Employee"}</p>
  <div class="section">
    <div class="row"><span>Pay period</span><strong>${formatDate(state.period.start)} - ${formatDate(
      state.period.end
    )}</strong></div>
    <div class="row"><span>Pay date</span><strong>${formatDate(state.period.payDate)}</strong></div>
  </div>
  <div class="section">
    <h3>Earnings</h3>
    ${totals.earnings
      .map(
        (row) => `<div class="row"><span>${row.description || row.type}</span><strong>${formatCurrency(
          row.amount
        )}</strong></div>`
      )
      .join("")}
    <div class="row total"><span>Gross pay</span><strong>${formatCurrency(totals.gross)}</strong></div>
  </div>
  <div class="section">
    <h3>Taxes & deductions</h3>
    <div class="row"><span>Total taxes</span><strong>${formatCurrency(totals.taxesTotal)}</strong></div>
    <div class="row"><span>Total deductions</span><strong>${formatCurrency(
      totals.totalDeductions
    )}</strong></div>
    <div class="row total"><span>Net pay</span><strong>${formatCurrency(totals.netPay)}</strong></div>
  </div>
</body>
</html>`);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  });

  document.getElementById("duplicateStub").addEventListener("click", () => {
    if (!state.earnings.length) return;
    const last = state.earnings[state.earnings.length - 1];
    state.earnings.push({ ...last, id: crypto.randomUUID() });
    render();
  });

  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    loadState(JSON.parse(saved));
  } else {
    syncForm();
    render();
  }
}
