const USERS_KEY = "expenseTrackerUsers";
const CURRENT_USER_KEY = "expenseTrackerCurrentUser";

// Get users from local storage
function getUsers() {
    return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
}

// Create a new account
export function createAccount(name, email, password) {
    if (!name.trim() || !email.trim() || !password) {
        throw new Error("Please fill in all fields.");
    }

    if (password.length < 8) {
        throw new Error("Password must be at least 8 characters.");
    }

    let users = getUsers();
    email = email.trim().toLowerCase();

    // Check if the email is already used
    if (users.some(user => user.email === email)) {
        throw new Error("An account with that email already exists.");
    }

    const user = {
        id: Date.now(),
        name: name.trim(),
        email: email,
        password: password
    };

    users.push(user);

    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    sessionStorage.setItem(CURRENT_USER_KEY, user.id);
}

// Log in
export function logIn(email, password) {
    email = email.trim().toLowerCase();

    const users = getUsers();

    const user = users.find(user =>
        user.email === email && user.password === password
    );

    if (!user) {
        throw new Error("Email or password is incorrect.");
    }

    sessionStorage.setItem(CURRENT_USER_KEY, user.id);
}

// Get the currently logged in user
export function getCurrentUser() {
    const userId = sessionStorage.getItem(CURRENT_USER_KEY);

    if (!userId) {
        return null;
    }

    const users = getUsers();

    const user = users.find(user => user.id == userId);

    if (!user) {
        return null;
    }

    return {
        id: user.id,
        name: user.name,
        email: user.email
    };
}

// Log out
export function logOut() {
    sessionStorage.removeItem(CURRENT_USER_KEY);
}
