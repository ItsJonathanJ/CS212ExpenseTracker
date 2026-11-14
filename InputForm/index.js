import { Expense, expenseManager } from '../expense.js';

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
                        <h4 class="expense-title h5 mb-2">${expense.description}</h4>
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
        card.data('expense', expense);
        expenseList.append(card);
    });
    // Update total expenses
    $('#total-expenses').text(currency.format(expenseManager.getTotalExpenses()));
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
    this.reset();
});

/* Modal Section */

let selectedExpense;
let editButton;

// Populate every field from the expense card whose Edit button was clicked.
$("#expense-list").on("click", ".edit-expense-btn", function () {
    editButton = this;
    selectedExpense = $(this).closest(".expense-card");

    $("#edit-expense-name").val(selectedExpense.find(".expense-title").text().trim());
    $("#edit-amount-amount").val(
        // Get all text, and remove anything that is not 0-9, ., or -. Then convert string to number
        Number(selectedExpense.find(".expense-amount").text().replace(/[^0-9.-]/g, "")) 
    );
    $("#edit-date-date").val(selectedExpense.find("time").attr("datetime"));
    $("#edit-category-category").val(selectedExpense.attr("data-category"));
    $("#edit-message").text("");

    $("#edit-modal").show().removeAttr("aria-hidden").attr("aria-modal", "true");
    $("#edit-expense-name").trigger("focus");
});

function closeEditModal() {
    $("#edit-modal").hide().removeAttr("aria-modal");
    if (editButton) editButton.focus();
    $("#edit-modal").attr("aria-hidden", "true");
}
// When clicking close or cancel, close the modal
$("#edit-modal .btn-close, #edit-modal .cancel-edit-btn").on("click", closeEditModal);

// Also close it when the user clicks the background
$("#edit-modal").on("click", function(event) {
    if (event.target === this) {
        closeEditModal();
    }
});
// Update the expense when the user submits the form in the modal
$("#edit-modal").on("submit", function (event) {
    event.preventDefault();
    const description = $("#edit-expense-name").val().trim();
    const amount = Number($("#edit-amount-amount").val());
    const date = $("#edit-date-date").val();
    const category = $("#edit-category-category").val();

    if (!description || isNaN(amount) || !date || !category) {
        $("#edit-message").text("Please fill in all fields correctly.");
        return;
    }

    const updatedExpense = new Expense(description, amount, date, category);
    const originalExpense = selectedExpense.data('expense');
    expenseManager.removeExpense(originalExpense);
    expenseManager.addExpense(updatedExpense);
    renderExpenses(expenseManager.getAllExpenses());
    closeEditModal();
});
// Delete the expense when the user clicks the delete button in the modal
$("#edit-modal #delete-expense-btn").on("click", function () {
    const originalExpense = selectedExpense.data('expense');

    expenseManager.removeExpense(originalExpense);
    renderExpenses(expenseManager.getAllExpenses());
    closeEditModal();
});

// Initial render of expenses when the page loads
$(function () {
    // Add some sample expenses for testing
    renderExpenses();
});