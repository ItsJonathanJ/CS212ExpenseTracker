// Shows the Spending Summary page:
//   - total spent and how many expenses there are
//   - the total for each category with a bar showing its share
//   - every expense grouped under its category

import { expenseManager } from "../expense.js";

// Turns numbers and dates into nice text, like $54.75 and November 14, 2026.
const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const dates = new Intl.DateTimeFormat("en-US", { dateStyle: "long" });

// Makes typed text safe to put inside HTML (so <b> shows as text, not bold).
function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

// "food" -> "Food"
function capitalize(text) {
    return text.charAt(0).toUpperCase() + text.slice(1);
}

// The two boxes at the top: total spent and number of expenses.
function renderOverview() {
    $("#total-spent").text(currency.format(expenseManager.getTotalExpenses()));
    $("#expense-count").text(expenseManager.getAllExpenses().length);
}

// One row per category: name, count, total, a share bar and the percent of all spending.
function renderCategoryTotals() {
    const container = $("#category-totals");
    container.empty();

    const totals = expenseManager.getCategoryTotals(); // { food: { total, count }, ... }
    const overall = expenseManager.getTotalExpenses();

    // Turn the object into a list of [name, data] pairs, biggest total first.
    const rows = Object.entries(totals).sort(function (a, b) {
        return b[1].total - a[1].total;
    });

    if (rows.length === 0) {
        container.append('<p class="text-body-secondary mb-0">No expenses logged yet.</p>');
        return;
    }

    rows.forEach(function (row) {
        const category = row[0];
        const total = row[1].total;
        const count = row[1].count;

        // What percent of all spending is this category?
        let percent = 0;
        if (overall > 0) {
            percent = (total / overall) * 100;
        }

        const word = count === 1 ? "expense" : "expenses";
        const name = escapeHtml(capitalize(category));

        container.append(
            '<div class="category-row" data-category="' + escapeHtml(category) + '">' +
                '<div class="d-flex justify-content-between gap-3">' +
                    '<span class="fw-semibold">' + name +
                        ' <span class="small text-body-secondary">(' + count + " " + word + ")</span>" +
                    "</span>" +
                    '<span class="fw-bold text-nowrap">' + currency.format(total) + "</span>" +
                "</div>" +
                '<div class="progress mt-1" role="progressbar" aria-label="' + name + ' share of spending" aria-valuenow="' + percent.toFixed(0) + '" aria-valuemin="0" aria-valuemax="100">' +
                    '<div class="progress-bar" style="width: ' + percent.toFixed(1) + '%"></div>' +
                "</div>" +
                '<div class="small text-body-secondary text-end">' + percent.toFixed(1) + "% of total</div>" +
            "</div>"
        );
    });
}

// One card per category, listing that category's expenses (newest first).
function renderCategoryGroups() {
    const container = $("#category-groups");
    container.empty();

    const groups = expenseManager.getExpensesGroupedByCategory(); // { food: [expense, ...], ... }
    const names = Object.keys(groups).sort(); // category names in A-Z order

    if (names.length === 0) {
        container.append('<p class="text-body-secondary">Add an expense on the expense form page to see it here.</p>');
        return;
    }

    names.forEach(function (category) {
        // Copy the list, then sort it so the newest date is first.
        const expenses = groups[category].slice().sort(function (a, b) {
            return b.date.localeCompare(a.date);
        });

        // Build one list item for each expense in this category.
        let items = "";
        expenses.forEach(function (expense) {
            items +=
                '<li class="list-group-item d-flex justify-content-between align-items-center gap-3">' +
                    "<div>" +
                        "<div>" + escapeHtml(expense.description) + "</div>" +
                        '<time class="small text-body-secondary" datetime="' + escapeHtml(expense.date) + '">' +
                            dates.format(new Date(expense.date + "T12:00:00")) +
                        "</time>" +
                    "</div>" +
                    '<span class="fw-bold text-nowrap">' + currency.format(expense.amount) + "</span>" +
                "</li>";
        });

        container.append(
            '<div class="category-group card mb-3" data-category="' + escapeHtml(category) + '">' +
                '<div class="card-header fw-semibold">' + escapeHtml(capitalize(category)) + "</div>" +
                '<ul class="list-group list-group-flush">' + items + "</ul>" +
            "</div>"
        );
    });
}

// Reload from localStorage and draw everything.
function render() {
    expenseManager.refresh();
    renderOverview();
    renderCategoryTotals();
    renderCategoryGroups();
}

// Run once when the page has finished loading.
$(function () {
    render();
});

// If an expense changes in ANOTHER browser tab, update this page too.
window.addEventListener("storage", render);
