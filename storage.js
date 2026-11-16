const OLD_STORAGE_KEY = "expenses";

function getStorageKey(userId) {
    return `expenses-${userId}`;
}

export function loadExpenses(userId) {
    const storageKey = getStorageKey(userId);
    let savedExpenses = localStorage.getItem(storageKey);

    // Move expenses saved before accounts were added to the first signed-in account.
    if (savedExpenses === null) {
        savedExpenses = localStorage.getItem(OLD_STORAGE_KEY);
        if (savedExpenses !== null) {
            localStorage.setItem(storageKey, savedExpenses);
            localStorage.removeItem(OLD_STORAGE_KEY);
        }
    }

    return savedExpenses ? JSON.parse(savedExpenses) : [];
}

export function saveExpenses(userId, expenses) {
    localStorage.setItem(getStorageKey(userId), JSON.stringify(expenses));
}