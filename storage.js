const STORAGE_KEY = "expenses";

export function loadExpenses() {
    const savedExpenses = localStorage.getItem(STORAGE_KEY);
    return savedExpenses ? JSON.parse(savedExpenses) : [];
}

export function saveExpenses(expenses) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
}