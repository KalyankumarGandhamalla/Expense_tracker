// #########################
// Dark / Light mode toggle
// #########################
const THEME_KEY = "expensesTheme";

// find the container to position the toggle at its top-right
const containerForToggle = document.querySelector(".container") || document.getElementById("container") || document.body;

// create the toggle button
const themeToggle = document.createElement("button");
themeToggle.id = "themeToggle";
themeToggle.setAttribute("aria-label", "Toggle dark/light theme");
themeToggle.title = "Toggle dark / light";
themeToggle.type = "button"; // safe default
themeToggle.style.fontSize = "16px";
themeToggle.style.lineHeight = "1";
themeToggle.style.display = "inline-flex";
themeToggle.style.alignItems = "center";
themeToggle.style.justifyContent = "center";
themeToggle.style.padding = "6px 8px";
themeToggle.style.borderRadius = "6px";
themeToggle.style.border = "none";
themeToggle.style.cursor = "pointer";
themeToggle.style.userSelect = "none";
themeToggle.style.zIndex = "9999";

// set icon (will be updated after applying saved theme)
themeToggle.innerHTML = "🌙";

// ensure container can position absolutely-placed children without changing layout
const computedPosition = window.getComputedStyle(containerForToggle).position;
if (computedPosition === "static") {
  containerForToggle.style.position = "relative";
}

// absolutely position the toggle top-right of the container
themeToggle.style.position = "absolute";
themeToggle.style.top = "10px";
themeToggle.style.right = "10px";

// add to DOM (insert as first child so it sits visually at top-right)
containerForToggle.insertBefore(themeToggle, containerForToggle.firstChild);

// helper functions
function applyTheme(theme) {
  // we toggle a class on <html> so CSS rules can target html.dark
  if (theme === "dark") {
    document.documentElement.classList.add("dark");
    themeToggle.innerHTML = "☀️";
    themeToggle.setAttribute("aria-pressed", "true");
  } else {
    document.documentElement.classList.remove("dark");
    themeToggle.innerHTML = "🌙";
    themeToggle.setAttribute("aria-pressed", "false");
  }
  localStorage.setItem(THEME_KEY, theme);
}

// load saved theme or prefer light by default
const savedTheme = localStorage.getItem(THEME_KEY) || "light";
applyTheme(savedTheme);

// toggle on click
themeToggle.addEventListener("click", () => {
  const current = document.documentElement.classList.contains("dark") ? "dark" : "light";
  applyTheme(current === "dark" ? "light" : "dark");
});

// #########################
// Your original app starts here
// #########################
const descInput = document.getElementById("desc");
const amountInput = document.getElementById("amount");
const categorySelect = document.getElementById("category");
const addBtn = document.getElementById("addBtn");
const expenseList = document.getElementById("expenseList");

let expenses = JSON.parse(localStorage.getItem("expenses")) || [];

const ctx = document.getElementById("expenseChart").getContext("2d");
let chart; // Chart.js instance

function renderExpenses() {
  expenseList.innerHTML = "";
  expenses.forEach((exp, idx) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span>${exp.description} - ₹${exp.amount} <strong>[${exp.category}]</strong></span>
      <span>
        <button class="edit-btn" data-index="${idx}">✏️</button>
        <button class="delete-btn" data-index="${idx}">🗑️</button>
      </span>
    `;
    expenseList.appendChild(li);
  });
}

function updateChart() {
  const categoryTotals = {};
  expenses.forEach(exp => {
    categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
  });

  const labels = Object.keys(categoryTotals);
  const data = Object.values(categoryTotals);

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "pie",
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#8BC34A", "#FF9800"]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "bottom" }
      }
    }
  });
}

function saveAndRender() {
  localStorage.setItem("expenses", JSON.stringify(expenses));
  renderExpenses();
  updateChart();
}

addBtn.addEventListener("click", () => {
  const description = descInput.value.trim();
  const amount = parseFloat(amountInput.value);
  const category = categorySelect.value;

  if (!description || isNaN(amount) || amount <= 0) return;

  expenses.push({ description, amount, category });
  descInput.value = "";
  amountInput.value = "";
  saveAndRender();
});

expenseList.addEventListener("click", (e) => {
  // Delete
  if (e.target.classList.contains("delete-btn")) {
    const idx = e.target.dataset.index;
    expenses.splice(idx, 1);
    saveAndRender();
  }

  // Start edit (inline)
  if (e.target.classList.contains("edit-btn")) {
    const idx = e.target.dataset.index;
    const exp = expenses[idx];
    const li = e.target.closest("li");
    li.classList.add("editing");
    li.innerHTML = `
      <input class="edit-desc" type="text" value="${exp.description}" />
      <input class="edit-amount" type="number" value="${exp.amount}" />
      <select class="edit-category">
        ${["Food","Transport","Shopping","Other"]
          .map(cat => `<option value="${cat}" ${cat===exp.category?"selected":""}>${cat}</option>`)
          .join("")}
      </select>
      <div class="edit-actions">
        <button class="cancel-edit">Cancel</button>
        <button class="save-edit" data-index="${idx}">Save</button>
      </div>
    `;
  }

  // Save edit
  if (e.target.classList.contains("save-edit")) {
    const idx = e.target.dataset.index;
    const li = e.target.closest("li");
    const newDesc = li.querySelector(".edit-desc").value.trim();
    const newAmount = parseFloat(li.querySelector(".edit-amount").value);
    const newCategory = li.querySelector(".edit-category").value;

    if (!newDesc || isNaN(newAmount) || newAmount <= 0) return;
    expenses[idx] = { description: newDesc, amount: newAmount, category: newCategory };
    saveAndRender();
  }

  // Cancel edit
  if (e.target.classList.contains("cancel-edit")) {
    renderExpenses();
  }
});

saveAndRender();
