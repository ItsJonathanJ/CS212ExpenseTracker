import { Expense, expenseManager } from "../expense.js";
import { logOut } from "../auth.js";
const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const dates = new Intl.DateTimeFormat("en-US", { dateStyle: "long" });

$("#logout-button").on("click", function () {
    logOut();
    window.location.href = "../";
});

function renderExpenses() {
    const expenseList = $('#expense-history-list');
    expenseList.empty();
    expenseManager.getAllExpenses().forEach(expense => {
        const card = $(`<div class="expense-card card shadow-sm mb-3" data-category="${expense.category}">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-start gap-3">
                    <div>
                        <h4 class="expense-title h5 mb-2">${expense.description}</h4>
                        <span class="badge rounded-pill text-bg-success">${expense.category.charAt(0).toUpperCase() + expense.category.slice(1)}</span>
                    </div>
                    <span class="expense-amount fs-5 fw-bold text-nowrap">${currency.format(expense.amount)}</span>
                </div>
                <div class="d-flex justify-content-between align-items-center gap-3 mt-3 pt-3 border-top">
                    <time class="small text-body-secondary" datetime="${expense.date}">
                        ${dates.format(new Date(`${expense.date}T12:00:00`))}
                    </time>
                </div>
            </div>
        </div>`);
        card.data('expense', expense);
        expenseList.append(card);
    });
}
$(function() {
    renderExpenses();
});