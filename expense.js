// expense.js
// This file is the "database" for the whole app. Every page imports it, so every
// page works with the same list of expenses.
//
// Where the data lives: the browser's localStorage, saved as JSON text.
// Each user gets their own save slot, so accounts never see each other's expenses.

import { getCurrentUser } from "./auth.js";

// The start of the key we save under. The user's id is added to the end of it.
const STORAGE_KEY_PREFIX = "expenseTracker.v1.";

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
    // id is optional. A new unique id is made when you leave it out. When we load
    // a saved expense, we pass its old id in so it keeps the same id.
    constructor(description, amount, date, category, id) {
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

        if (id) {
            this.id = id;
        } else {
            // Unique id made from the current time plus a random piece
            this.id = "exp-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
        }

        this.description = description;
        this.amount = Number(amount);
        this.date = date;
        this.category = category;
    }

    // True if both expenses have the same description, amount, date and category
    equals(otherExpense) {
        return this.description === otherExpense.description &&
            this.amount === otherExpense.amount &&
            this.date === otherExpense.date &&
            this.category === otherExpense.category;
    }
}

/* ------------------------------------------------------------------
 * The database schema: what we save in localStorage.
 * It is ONE object with three lists:
 *
 * {
 *   expenses:        [ { id, description, amount, date, category } ],   <- expenses you have now
 *   deletedExpenses: [ { id, description, amount, date, category } ],   <- expenses that were deleted
 *   history:         [ { action, timestamp, expense, previous } ]      <- a log of every change
 * }
 *
 * In "history", action is "created", "edited" or "deleted".
 * "previous" only exists for edits and holds the expense as it was before.
 * ------------------------------------------------------------------ */

// Turns an Expense object into a plain object that can be saved as JSON.
function toPlainObject(expense) {
    return {
        id: expense.id,
        description: expense.description,
        amount: expense.amount,
        date: expense.date,
        category: expense.category
    };
}

// Turns a plain object (from saved JSON) back into a real Expense object.
function toExpense(data) {
    return new Expense(data.description, Number(data.amount), data.date, data.category, data.id);
}

/*
 * ExpenseManager: the class that adds, edits, deletes and reads expenses.
 * Do not create more than one of these. Use the single one exported at the
 * bottom of this file:  import { expenseManager } from "../expense.js";
 */
class ExpenseManager {
    constructor() {
 const user = getCurrentUser();
        if (!user) {
            window.location.replace("../");
        }

        this.userId = user ? user.id : null;
        this.expenses = [];          // expenses you have now
        this.deletedExpenses = [];   // expenses that were deleted
        this.history = [];           // log of created, edited or deleted
        this.load();                 // fill the lists from localStorage
    }

    /* ---------- saving and loading ---------- */

    // The save slot for the current user.
    storageKey() {
        return STORAGE_KEY_PREFIX + this.userId;
    }

    // Read the saved data from localStorage into the three lists.
    load() {
        if (!this.userId) {
            return; // nobody is logged in, so there is nothing to load
        }
        let text = null;
        try {
            text = localStorage.getItem(this.storageKey());
        } catch (error) {
            return; // localStorage is not available, so just start empty
        }
        if (!text) {
            return; // nothing saved yet
        }
        try {
            const data = JSON.parse(text);
            this.expenses = (data.expenses || []).map(toExpense);
            this.deletedExpenses = (data.deletedExpenses || []).map(toExpense);
            this.history = data.history || [];
        } catch (error) {
            // The saved text was damaged. Log it and start empty instead of crashing.
            console.error("Could not read saved expenses, starting empty.", error);
        }
    }

    // Write the three lists to localStorage. Called after every change.
    save() {
        if (!this.userId) {
            return;
        }
        const data = {
            expenses: this.expenses.map(toPlainObject),
            deletedExpenses: this.deletedExpenses.map(toPlainObject),
            history: this.history
        };
        try {
            localStorage.setItem(this.storageKey(), JSON.stringify(data));
        } catch (error) {
            console.error("Could not save expenses.", error);
        }
    }

    // Throw away what is in memory and load again from localStorage.
    // Pages call this when they open, so they see changes made on other pages.
    refresh() {
        this.expenses = [];
        this.deletedExpenses = [];
        this.history = [];
        this.load();
    }

    // Add one line to the history log.
    logHistory(action, expense, previous) {
        const entry = {
            action: action,                          // "created", "edited" or "deleted"
            timestamp: new Date().toISOString(),     // when it happened
            expense: toPlainObject(expense)
        };
        if (previous) {
            entry.previous = toPlainObject(previous); // the old values (edits only)
        }
        this.history.push(entry);
    }

    /* ---------- add, edit, delete ---------- */

    // Add a new expense.
    addExpense(expense) {
        this.expenses.push(expense);
        this.logHistory("created", expense);
        this.save();
    }

    // Change an expense. "original" is the one being replaced and "updated" holds
    // the new values. This logs ONE "edited" entry (calling removeExpense and then
    // addExpense would log a delete and a create instead).
    // Returns true if it worked and false if the original was not found.
    updateExpense(original, updated) {
        for (let i = 0; i < this.expenses.length; i++) {
            const current = this.expenses[i];
            if (current === original || current.id === original.id) {
                updated.id = current.id;      // keep the same id
                this.expenses[i] = updated;
                this.logHistory("edited", updated, original);
                this.save();
                return true;
            }
        }
        return false;
    }

    // Delete an expense. It is moved to the deleted list, not forgotten.
    removeExpense(expense) {
        const countBefore = this.expenses.length;
        // Keep every expense EXCEPT the one being removed
        this.expenses = this.expenses.filter(function (item) {
            return item !== expense && item.id !== expense.id;
        });
        if (this.expenses.length === countBefore) {
            return; // it was not in the list, so there is nothing to do
        }
        this.deletedExpenses.push(expense);
        this.logHistory("deleted", expense);
        this.save();
    }

    /* ---------- reading ---------- */

    // The list of current expenses.
    getAllExpenses() {
        return this.expenses;
    }

    // Find an expense that has the same values as the one you pass in.
    getExpense(expense) {
        return this.expenses.find(function (e) {
            return e.equals(expense);
        });
    }

    // Only the expenses in one category, like "food".
    getExpensesByCategory(category) {
        return this.expenses.filter(function (expense) {
            return expense.category === category;
        });
    }

    // The sum of all expense amounts.
    getTotalExpenses() {
        return this.expenses.reduce(function (total, expense) {
            return total + expense.amount;
        }, 0);
    }

    // The total and count for each category, like:
    // { food: { total: 61, count: 2 }, transportation: { total: 30, count: 1 } }
    // Categories with no expenses are not included.
    getCategoryTotals() {
        const totals = {};
        this.expenses.forEach(function (expense) {
            if (!totals[expense.category]) {
                totals[expense.category] = { total: 0, count: 0 };
            }
            totals[expense.category].total += expense.amount;
            totals[expense.category].count += 1;
        });
        return totals;
    }

    // The expenses grouped by category, like:
    // { food: [expense, expense], transportation: [expense] }
    getExpensesGroupedByCategory() {
        const groups = {};
        this.expenses.forEach(function (expense) {
            if (!groups[expense.category]) {
                groups[expense.category] = [];
            }
            groups[expense.category].push(expense);
        });
        return groups;
    }

    // The expenses that were deleted.
    getDeletedExpenses() {
        return this.deletedExpenses;
    }

    // The log of everything that was created, edited or deleted (oldest first).
    getHistory() {
        return this.history;
    }
}

/*
 * The one shared ExpenseManager.
 * In any other file:  import { expenseManager } from "../expense.js";
 */
export const expenseManager = new ExpenseManager();
