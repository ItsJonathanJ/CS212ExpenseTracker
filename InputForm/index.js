import { Expense, ExpenseManager } from '../expense.js';
const expenseManager = new ExpenseManager();

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const dates = new Intl.DateTimeFormat('en-US', { dateStyle: 'long' });

function renderExpenses() {
    const expenseList = $('#expense-list');
    expenseList.empty();
    expenseManager.getAllExpenses().forEach(expense => {
        const card = $(`<div class="expense-card card shadow-sm mb-3" data-category="${expense.category}">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-start gap-3">
                    <div>
                        <h4 class="card-title h5 mb-2">${expense.description}</h4>
                        <span class="badge rounded-pill text-bg-success">${expense.category.charAt(0).toUpperCase() + expense.category.slice(1)}</span>
                    </div>
                    <span class="expense-amount fs-5 fw-bold text-nowrap">${currency.format(expense.amount)}</span>
                </div>
                <div class="d-flex justify-content-between align-items-center gap-3 mt-3 pt-3 border-top">
                    <time class="small text-body-secondary" datetime="${expense.date}">
                        ${dates.format(new Date(`${expense.date}T12:00:00`))}
                    </time>
                    <button type="button" class="edit-expense-btn btn btn-outline-secondary btn-sm">Edit</button>
                </div>
            </div>
        </div>`);
        expenseList.append(card);
    });
}

$('#expense-form').on('submit', function (event) {
    event.preventDefault();
    const description = $('#description').val().trim();
    const amount = Number($('#amount').val());
    const date = $('#date').val();
    const category = $('#category').val();

    if (!description || isNaN(amount) || !date || !category) {
        alert('Please fill in all fields correctly.');
        return;
    }

    const expense = new Expense(description, amount, date, category);
    expenseManager.addExpense(expense);
    renderExpenses(expenseManager.getAllExpenses());
    finishEditing();
});