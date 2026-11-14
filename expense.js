export class Expense {
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

/*
 * ExpenseManager class to manage expenses
 * Do not create multiple instances of this class, instead use the single instance exported below
 */
class ExpenseManager {
    constructor() {
        this.expenses = [];
        this.deletedExpenses = []; // Store deleted expenses
        // Load expenses from database
    }

    addExpense(expense) {
        this.expenses.push(expense);
        //Database logic here
    }
    // Definitely a better way to do it than passing the whole object
    removeExpense(expense) {
        this.expenses = this.expenses.filter(item => item !== expense);
        //Database logic here
        this.deletedExpenses.push(expense); // Store the deleted expense
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
    getDeletedExpenses() {
        return this.deletedExpenses;
    }
}

/* 
 * Central Expense Manager 
 * Use this instance  across the application
 * Use import { expenseManager } from './expense.js' to access this instance in other modules
 */
export const expenseManager = new ExpenseManager();


// Add some sample expenses for testing
expenseManager.addExpense(new Expense("Groceries", 150.00, "2026-06-01", "food"));
expenseManager.addExpense(new Expense("Bus Pass", 50.00, "2026-06-02", "transportation"));
expenseManager.addExpense(new Expense("Movie Tickets", 30.00, "2026-06-03", "entertainment"));
expenseManager.addExpense(new Expense("Electricity Bill", 100.00, "2026-06-04", "utilities"));
expenseManager.addExpense(new Expense("Gym Membership", 60.00, "2026-06-05", "other"));

// Remove to test history page
expenseManager.getAllExpenses().forEach(expense => {
    expenseManager.removeExpense(expense);
});

// Add them back to test normal functionality
expenseManager.addExpense(new Expense("Groceries", 150.00, "2026-06-01", "food"));
expenseManager.addExpense(new Expense("Bus Pass", 50.00, "2026-06-02", "transportation"));
expenseManager.addExpense(new Expense("Movie Tickets", 30.00, "2026-06-03", "entertainment"));
expenseManager.addExpense(new Expense("Electricity Bill", 100.00, "2026-06-04", "utilities"));
expenseManager.addExpense(new Expense("Gym Membership", 60.00, "2026-06-05", "other"));


