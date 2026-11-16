// ExpenseHistory/index.js
// Shows two things on the Expense History page:
//   1. a card for every expense you have now
//   2. an activity log of every expense that was created, edited or deleted

import { Expense, expenseManager } from "../expense.js";
import { logOut } from "../auth.js";

// These turn numbers and dates into nice text, like $54.75 and November 14, 2026.
const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const dates = new Intl.DateTimeFormat("en-US", { dateStyle: "long" });
const timestamps = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });

// The label and Bootstrap badge color for each kind of history entry.
const ACTION_STYLES = {
    created: { label: "Created", badge: "text-bg-success" },
    edited: { label: "Edited", badge: "text-bg-warning" },
    deleted: { label: "Deleted", badge: "text-bg-danger" }
};

// Expense text is typed by the user. If someone types <b> or other HTML, it should
// show as plain text, not become real HTML. This swaps the special characters.
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

$("#logout-button").on("click", function () {
    logOut();
    window.location.href = "../";
});

// "2026-11-14" -> "November 14, 2026"
// T12:00:00 (noon) stops the date from shifting to the day before in some time zones.
function formatDate(isoDate) {
    return dates.format(new Date(isoDate + "T12:00:00"));
}

// Draw the expense cards.
function renderExpenses() {
    const expenseList = $("#expense-history-list");
    expenseList.empty(); // clear whatever was there before

    const expenses = expenseManager.getAllExpenses();
    if (expenses.length === 0) {
        expenseList.append('<p class="text-body-secondary">No expenses logged yet.</p>');
        return;
    }

    // Copy the list and sort it so the newest date is first.
    // (We copy it with slice() so we do not change the real list.)
    const sorted = expenses.slice().sort(function (a, b) {
        return b.date.localeCompare(a.date);
    });

    sorted.forEach(function (expense) {
        const card = $(
            '<article class="expense-card card shadow-sm mb-3" data-category="' + escapeHtml(expense.category) + '">' +
                '<div class="card-body">' +
                    '<div class="d-flex justify-content-between align-items-start gap-3">' +
                        "<div>" +
                            '<h3 class="expense-title h5 mb-2">' + escapeHtml(expense.description) + "</h3>" +
                            '<span class="badge rounded-pill text-bg-success">' + escapeHtml(capitalize(expense.category)) + "</span>" +
                        "</div>" +
                        '<span class="expense-amount fs-5 fw-bold text-nowrap">' + currency.format(expense.amount) + "</span>" +
                    "</div>" +
                    '<div class="mt-3 pt-3 border-top">' +
                        '<time class="small text-body-secondary" datetime="' + escapeHtml(expense.date) + '">' + formatDate(expense.date) + "</time>" +
                    "</div>" +
                "</div>" +
            "</article>"
        );
        expenseList.append(card);
    });
}

// One line of text describing an expense, like: Lunch · $8.00 · Food · November 14, 2026
function summarize(expense) {
    return escapeHtml(expense.description) + " &middot; " +
        currency.format(expense.amount) + " &middot; " +
        escapeHtml(capitalize(expense.category)) + " &middot; " +
        formatDate(expense.date);
}

// Draw the activity log.
function renderActivityLog() {
    const log = $("#activity-log");
    log.empty();

    // Copy and reverse so the newest entry is first.
    const entries = expenseManager.getHistory().slice().reverse();
    if (entries.length === 0) {
        log.append('<li class="list-group-item text-body-secondary">No activity yet.</li>');
        return;
    }

    entries.forEach(function (entry) {
        const style = ACTION_STYLES[entry.action] || { label: entry.action, badge: "text-bg-secondary" };

        let text = summarize(entry.expense);
        // For edits, also show what the expense was before.
        if (entry.action === "edited" && entry.previous) {
            text += '<div class="small text-body-secondary">Was: ' + summarize(entry.previous) + "</div>";
        }

        log.append(
            '<li class="list-group-item d-flex justify-content-between align-items-start gap-3">' +
                "<div>" +
                    '<span class="badge ' + style.badge + ' me-2">' + style.label + "</span>" + text +
                "</div>" +
                '<time class="small text-body-secondary text-nowrap" datetime="' + escapeHtml(entry.timestamp) + '">' +
                    timestamps.format(new Date(entry.timestamp)) +
                "</time>" +
            "</li>"
        );
    });
}

// Reload from localStorage and draw everything.
function render() {
    expenseManager.refresh();
    renderExpenses();
    renderActivityLog();
}

// Run once when the page has finished loading.
$(function () {
    render();
});

// If an expense changes in ANOTHER browser tab, update this page too.
window.addEventListener("storage", render);
