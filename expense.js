class Expense {
    constructor(description, amount, date, category) {
        this.description = description;
        this.amount = amount;
        this.date = date;
        this.category = category;
    }

    equals(otherExpense) {
        return this.description === otherExpense.description &&
            this.amount === otherExpense.amount &&
            this.date === otherExpense.date &&
            this.category === otherExpense.category;
    }
}

class ExpenseManager {
    constructor() {
        this.expenses = [];
        // Load expenses from database
    }

    addExpense(expense) {
        this.expenses.push(expense);
        //Database logic here
    }

    getAllExpenses() {
        return this.expenses;
    }

    getExpense(expense) {
        return this.expenses.find(e => e.equals(expense));
    }

    getExpensesByCategory(category) {
        return this.expenses.filter(expense => expense.category === category);
    }

    getTotalExpenses() {
        return this.expenses.reduce((total, expense) => total + expense.amount, 0);
    }
}

