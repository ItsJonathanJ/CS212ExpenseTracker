import { loadExpenses, saveExpenses } from "./storage.js";
import { getCurrentUser } from "./auth.js";

const EXPENSE_CATEGORIES = [
    "food",
    "transportation",
    "entertainment",
    "utilities",
    "other"
];

function isValidDate(date) {
    const parsedDate = new Date(date);
    return !isNaN(parsedDate.getTime());
}

export class Expense {
    constructor(description, amount, date, category) {
        if (!description || description.trim() === "") {
            throw new Error("Please enter a description.");
        }

        if (isNaN(amount) || amount <= 0) {
            throw new Error("Please enter a valid amount.");
        }

        if (!isValidDate(date)) {
            throw new Error("Please enter a valid date.");
        }

        if (!EXPENSE_CATEGORIES.includes(category)) {
            throw new Error("Please select a valid category.");
        }

        this.description = description;
        this.amount = Number(amount);
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
        const user = getCurrentUser();
        if (!user) {
            window.location.replace("../");
            this.userId = null;
            this.expenses = [];
            this.deletedExpenses = [];
            return;
        }

        this.userId = user.id;
        this.expenses = loadExpenses(this.userId).map(expense =>
            new Expense(expense.description, expense.amount, expense.date, expense.category)
        );
        this.deletedExpenses = []; // Store deleted expenses
    }

    addExpense(expense) {
        this.expenses.push(expense);
        saveExpenses(this.userId, this.expenses);
    }
    // Definitely a better way to do it than passing the whole object
    removeExpense(expense) {
        this.expenses = this.expenses.filter(item => item !== expense);
        saveExpenses(this.userId, this.expenses);
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
