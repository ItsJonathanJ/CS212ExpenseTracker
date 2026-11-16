import { expenseManager } from "../expense.js";
import { logOut, getCurrentUser } from "../auth.js";

const currency = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
});

const dateFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "long" });

const categories = [
    "food",
    "transportation",
    "entertainment",
    "utilities",
    "other"
];

function capitalize(text) {
    return text.charAt(0).toUpperCase() + text.slice(1);
}

function startPage() {
    const currentUser = getCurrentUser();

    if (!currentUser) {
        window.location.href = "../";
        return;
    }

    document.querySelector("#welcome-message").textContent =
        `Hi, ${currentUser.name}`;

    const expenses = expenseManager.getAllExpenses();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    function getExpenseDate(expense) {
        return new Date(`${expense.date}T00:00:00`);
    }

    function getExpensesUpToToday() {
        return expenses.filter(expense => getExpenseDate(expense) <= today);
    }

    function getTotal(expenseList) {
        return expenseList.reduce((total, expense) => {
            return total + expense.amount;
        }, 0);
    }

    function getStartOfWeek() {
        const start = new Date(today);
        const daysSinceMonday = (start.getDay() + 6) % 7;
        start.setDate(start.getDate() - daysSinceMonday);
        return start;
    }

    function getStartOfMonth() {
        return new Date(today.getFullYear(), today.getMonth(), 1);
    }

    function getStartOfYear() {
        return new Date(today.getFullYear(), 0, 1);
    }

    function getExpensesForPeriod(startDate) {
        return getExpensesUpToToday().filter(expense => {
            return getExpenseDate(expense) >= startDate;
        });
    }

    function showPeriodTotals() {
        const pastExpenses = getExpensesUpToToday();

        document.querySelector("#week-total").textContent =
            currency.format(getTotal(getExpensesForPeriod(getStartOfWeek())));

        document.querySelector("#month-total").textContent =
            currency.format(getTotal(getExpensesForPeriod(getStartOfMonth())));

        document.querySelector("#year-total").textContent =
            currency.format(getTotal(getExpensesForPeriod(getStartOfYear())));

        document.querySelector("#all-time-total").textContent =
            currency.format(getTotal(pastExpenses));
    }

    function getRangeStart(range) {
        if (range === "week") return getStartOfWeek();
        if (range === "month") return getStartOfMonth();
        if (range === "year") return getStartOfYear();
        return new Date(0);
    }

    function showCategories(range) {
        const startDate = getRangeStart(range);
        const filteredExpenses = getExpensesForPeriod(startDate);

        const totals = categories.map(category => {
            const categoryExpenses = filteredExpenses.filter(expense => {
                return expense.category === category;
            });

            return {
                name: category,
                amount: getTotal(categoryExpenses)
            };
        });

        const total = getTotal(filteredExpenses);
        const categoryList = document.querySelector("#category-list");

        let periodText = "All expenses up to today";

        if (range === "week") {
            periodText = "Expenses for this week";
        } else if (range === "month") {
            periodText = "Expenses for this month";
        } else if (range === "year") {
            periodText = "Expenses for this year";
        }

        document.querySelector("#category-period").textContent = periodText;
        document.querySelector("#category-total").textContent =
            currency.format(total);

        categoryList.replaceChildren();

        totals.forEach(category => {
            const row = document.createElement("div");
            row.className = "category-row";

            const name = document.createElement("span");
            name.className = "category-name";
            name.textContent = category.name;

            const bar = document.createElement("div");
            bar.className = "category-bar";

            const fill = document.createElement("div");
            fill.className = "category-bar-fill";

            let percent = 0;
            if (total > 0) {
                percent = (category.amount / total) * 100;
            }

            fill.style.width = `${percent}%`;
            bar.appendChild(fill);

            const amount = document.createElement("span");
            amount.className = "category-amount";
            amount.textContent = currency.format(category.amount);

            row.appendChild(name);
            row.appendChild(bar);
            row.appendChild(amount);

            categoryList.appendChild(row);
        });

        document.querySelector("#empty-message").hidden = total !== 0;
    }

    // From main: every expense listed under its category, newest first.
    function showGroupedExpenses() {
        const container = document.querySelector("#category-groups");
        container.replaceChildren();

        if (expenses.length === 0) {
            const message = document.createElement("p");
            message.className = "text-body-secondary";
            message.textContent = "Add an expense on the expense form page to see it here.";
            container.appendChild(message);
            return;
        }

        const groups = {};
        expenses.forEach(expense => {
            if (!groups[expense.category]) {
                groups[expense.category] = [];
            }
            groups[expense.category].push(expense);
        });

        Object.keys(groups).sort().forEach(category => {
            const sorted = groups[category].slice().sort((a, b) => {
                return b.date.localeCompare(a.date);
            });

            const card = document.createElement("div");
            card.className = "category-group card mb-3";

            const header = document.createElement("div");
            header.className = "card-header fw-semibold";
            header.textContent = capitalize(category);

            const list = document.createElement("ul");
            list.className = "list-group list-group-flush";

            sorted.forEach(expense => {
                const item = document.createElement("li");
                item.className = "list-group-item d-flex justify-content-between align-items-center gap-3";

                const details = document.createElement("div");

                const description = document.createElement("div");
                description.textContent = expense.description;

                const time = document.createElement("time");
                time.className = "small text-body-secondary";
                time.dateTime = expense.date;
                time.textContent = dateFormat.format(new Date(`${expense.date}T12:00:00`));

                details.append(description, time);

                const amount = document.createElement("span");
                amount.className = "fw-bold text-nowrap";
                amount.textContent = currency.format(expense.amount);

                item.append(details, amount);
                list.appendChild(item);
            });

            card.append(header, list);
            container.appendChild(card);
        });
    }

    document.querySelector("#logout-button").addEventListener("click", function() {
        logOut();
        window.location.href = "../";
    });

    document.querySelectorAll("[data-range]").forEach(button => {
        button.addEventListener("click", function() {
            document.querySelectorAll("[data-range]").forEach(filterButton => {
                if (filterButton === button) {
                    filterButton.classList.add("active");
                    filterButton.setAttribute("aria-pressed", "true");
                } else {
                    filterButton.classList.remove("active");
                    filterButton.setAttribute("aria-pressed", "false");
                }
            });

            showCategories(button.dataset.range);
        });
    });

    showPeriodTotals();
    showCategories("all");
    showGroupedExpenses();
}

startPage();