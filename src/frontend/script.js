const STORAGE_KEY = 'ipt_demo_v1';
const API_BASE_URL = 'http://localhost:4000';

window.db = {
    departments: [],
    employees: [],
    requests: []
};

let currentUser = null;

function loadFromStorage() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            Object.assign(window.db, parsed);
        } else {
            seedData();
        }
    } catch (e) {
        seedData();
    }
}

function seedData() {
    window.db.departments = [
        { id: genId(), name: 'Engineering', description: 'Software team' },
        { id: genId(), name: 'HR', description: 'Human Resources' }
    ];
    window.db.employees = [];
    window.db.requests = [];
    saveToStorage();
}

function saveToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(window.db));
}

function genId() {
    return Date.now() + '_' + Math.random().toString(36).slice(2, 11);
}

function navigateTo(hash) {
    window.location.hash = hash;
}

function handleRouting() {
    const path = window.location.hash.replace(/^#\/?/, '');

    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

    const protectedRoutes = ['profile', 'requests'];
    const adminRoutes = ['employees', 'accounts', 'departments'];

    if (protectedRoutes.includes(path) && !currentUser) {
        navigateTo('#/login');
        return;
    }

    if (adminRoutes.includes(path)) {
        if (!currentUser || currentUser.role !== 'Admin') {
            showToast('Admin access required', 'danger');
            navigateTo('#/');
            return;
        }
    }

    const pageMap = {
        '': 'home-page',
        'home': 'home-page',
        'register': 'register-page',
        'verify-email': 'verify-email-page',
        'login': 'login-page',
        'profile': 'profile-page',
        'employees': 'employees-page',
        'departments': 'departments-page',
        'accounts': 'accounts-page',
        'requests': 'requests-page'
    };

    const pageId = pageMap[path] || 'home-page';
    const page = document.getElementById(pageId);
    if (page) page.classList.add('active');

    if (path === 'profile') renderProfile();
    if (path === 'employees') renderEmployeesTable();
    if (path === 'departments') renderDepartmentsTable();
    if (path === 'accounts') renderAccountsTable();
    if (path === 'requests') renderRequestsTable();
    if (path === 'verify-email') {
        const email = localStorage.getItem('unverified_email') || '';
        document.getElementById('verify-email-display').textContent = email;
    }
}

function setAuthState(isAuth, user) {
    currentUser = isAuth ? user : null;
    const body = document.body;

    if (isAuth && user) {
        body.classList.remove('not-authenticated');
        body.classList.add('authenticated');
        body.classList.toggle('is-admin', user.role === 'Admin');
        document.getElementById('nav-username').textContent = user.firstName || 'User';
    } else {
        body.classList.remove('authenticated', 'is-admin');
        body.classList.add('not-authenticated');
        document.getElementById('nav-username').textContent = 'User';
    }
}

function checkAuth() {
    const savedUser = localStorage.getItem('auth_user');
    if (savedUser) {
        try {
            const user = JSON.parse(savedUser);
            setAuthState(true, user);
        } catch {
            localStorage.removeItem('auth_user');
            localStorage.removeItem('auth_token');
        }
    }
}

function showToast(message, type = 'success') {
    const toastEl = document.getElementById('app-toast');
    const toastBody = document.getElementById('toast-body');
    toastEl.className = `toast text-white border-0 bg-${type}`;
    toastBody.textContent = message;
    const toast = new bootstrap.Toast(toastEl, { delay: 3000 });
    toast.show();
}

async function fetchUsers() {
    const response = await fetch(`${API_BASE_URL}/users`);
    if (!response.ok) {
        throw new Error('Failed to load users');
    }
    return await response.json();
}

function renderProfile() {
    if (!currentUser) return;

    document.getElementById('profile-content').innerHTML = `
        <div class="card" style="max-width:400px">
            <div class="card-body">
                <h5>${currentUser.firstName} ${currentUser.lastName}</h5>
                <p><strong>Email:</strong> ${currentUser.email}</p>
                <p><strong>Role:</strong> ${currentUser.role}</p>
            </div>
        </div>
    `;
}

async function renderAccountsTable() {
    const container = document.getElementById('accounts-table');

    try {
        const accounts = await fetchUsers();

        if (accounts.length === 0) {
            container.innerHTML = '<p>No accounts.</p>';
            return;
        }

        container.innerHTML = `
            <table class="table table-bordered table-sm">
                <thead class="table-light">
                    <tr><th>Name</th><th>Email</th><th>Role</th></tr>
                </thead>
                <tbody>
                    ${accounts.map(a => `
                        <tr>
                            <td>${a.firstName} ${a.lastName}</td>
                            <td>${a.email}</td>
                            <td>${a.role}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        container.innerHTML = '<p class="text-danger">Failed to load accounts.</p>';
    }
}

function renderDepartmentsTable() {
    const container = document.getElementById('departments-table');
    if (window.db.departments.length === 0) {
        container.innerHTML = '<p>No departments.</p>';
        return;
    }

    container.innerHTML = `
        <table class="table table-bordered table-sm">
            <thead class="table-light">
                <tr><th>Name</th><th>Description</th><th>Actions</th></tr>
            </thead>
            <tbody>
                ${window.db.departments.map(d => `
                    <tr>
                        <td>${d.name}</td>
                        <td>${d.description}</td>
                        <td>
                            <button class="btn btn-sm btn-primary" onclick="editDepartment('${d.id}')">Edit</button>
                            <button class="btn btn-sm btn-danger" onclick="deleteDepartment('${d.id}')">Delete</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function renderEmployeesTable() {
    const container = document.getElementById('employees-table');
    if (window.db.employees.length === 0) {
        container.innerHTML = '<p>No employees.</p>';
        return;
    }

    container.innerHTML = `
        <table class="table table-bordered table-sm">
            <thead class="table-light">
                <tr><th>ID</th><th>Email</th><th>Position</th><th>Dept</th><th>Actions</th></tr>
            </thead>
            <tbody>
                ${window.db.employees.map(e => {
                    const dept = window.db.departments.find(d => d.id === e.deptId);
                    return `
                        <tr>
                            <td>${e.empId}</td>
                            <td>${e.email}</td>
                            <td>${e.position}</td>
                            <td>${dept ? dept.name : 'N/A'}</td>
                            <td>
                                <button class="btn btn-sm btn-primary" onclick="editEmployee('${e.id}')">Edit</button>
                                <button class="btn btn-sm btn-danger" onclick="deleteEmployee('${e.id}')">Delete</button>
                            </td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
}

function renderRequestsTable() {
    if (!currentUser) return;
    const myRequests = window.db.requests.filter(r => r.employeeEmail === currentUser.email);
    const container = document.getElementById('requests-table');

    if (myRequests.length === 0) {
        container.innerHTML = '<p>You have no requests yet.</p>';
        return;
    }

    const badgeMap = { Pending: 'warning', Approved: 'success', Rejected: 'danger' };

    container.innerHTML = `
        <table class="table table-bordered table-sm">
            <thead class="table-light">
                <tr><th>Type</th><th>Items</th><th>Date</th><th>Status</th></tr>
            </thead>
            <tbody>
                ${myRequests.map(r => `
                    <tr>
                        <td>${r.type}</td>
                        <td>${r.items.map(i => `${i.name} x${i.qty}`).join(', ')}</td>
                        <td>${new Date(r.date).toLocaleDateString()}</td>
                        <td><span class="badge bg-${badgeMap[r.status] || 'secondary'}">${r.status}</span></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function populateDeptDropdown(selectedId = '') {
    const select = document.getElementById('emp-dept');
    select.innerHTML = window.db.departments.map(d =>
        `<option value="${d.id}" ${d.id === selectedId ? 'selected' : ''}>${d.name}</option>`
    ).join('');
}

function addRequestItem() {
    const container = document.getElementById('req-items-container');
    const row = document.createElement('div');
    row.className = 'input-group mb-1';
    row.innerHTML = `
        <input type="text" class="form-control" placeholder="Item name" required>
        <input type="number" class="form-control" style="max-width:80px" value="1" min="1" required>
        <button type="button" class="btn btn-outline-danger" onclick="this.parentElement.remove()">×</button>
    `;
    container.appendChild(row);
}

document.getElementById('register-form').addEventListener('submit', async function(e) {
    e.preventDefault();

    const firstName = document.getElementById('reg-firstname').value.trim();
    const lastName = document.getElementById('reg-lastname').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;

    try {
        const response = await fetch(`${API_BASE_URL}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: 'Mr',
                firstName,
                lastName,
                email,
                password,
                confirmPassword: password,
                role: 'User'
            })
        });

        const data = await response.json();

        if (!response.ok) {
            showToast(data.message || 'Registration failed', 'danger');
            return;
        }

        localStorage.setItem('unverified_email', email);
        this.reset();
        showToast('Account created successfully', 'success');
        navigateTo('#/verify-email');
    } catch (error) {
        showToast('Cannot connect to backend', 'danger');
    }
});

document.getElementById('simulate-verify-btn').addEventListener('click', function() {
    navigateTo('#/login');
});

document.getElementById('login-form').addEventListener('submit', async function(e) {
    e.preventDefault();

    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    try {
        const response = await fetch(`${API_BASE_URL}/users/authenticate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            showToast(data.message || 'Login failed', 'danger');
            return;
        }

        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('auth_user', JSON.stringify(data));
        setAuthState(true, data);
        this.reset();
        navigateTo('#/profile');
    } catch (error) {
        showToast('Cannot connect to backend', 'danger');
    }
});

document.getElementById('logout-btn').addEventListener('click', function(e) {
    e.preventDefault();
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setAuthState(false);
    navigateTo('#/');
});

document.getElementById('add-department-btn').addEventListener('click', function() {
    document.getElementById('dept-hidden-id').value = '';
    document.getElementById('department-form-title').textContent = 'Add Department';
    document.getElementById('dept-name').value = '';
    document.getElementById('dept-desc').value = '';
    document.getElementById('department-form-container').style.display = 'block';
});

document.getElementById('save-department-btn').addEventListener('click', function() {
    const id = document.getElementById('dept-hidden-id').value;
    const name = document.getElementById('dept-name').value.trim();
    const desc = document.getElementById('dept-desc').value.trim();

    if (!name || !desc) {
        showToast('Please fill all fields', 'danger');
        return;
    }

    if (id) {
        const dept = window.db.departments.find(d => d.id === id);
        if (dept) Object.assign(dept, { name, description: desc });
    } else {
        window.db.departments.push({ id: genId(), name, description: desc });
    }

    saveToStorage();
    document.getElementById('department-form-container').style.display = 'none';
    renderDepartmentsTable();
    showToast('Department saved', 'success');
});

document.getElementById('cancel-department-btn').addEventListener('click', function() {
    document.getElementById('department-form-container').style.display = 'none';
});

document.getElementById('add-employee-btn').addEventListener('click', function() {
    document.getElementById('emp-hidden-id').value = '';
    document.getElementById('employee-form-title').textContent = 'Add Employee';
    document.getElementById('emp-empid').value = '';
    document.getElementById('emp-email').value = '';
    document.getElementById('emp-position').value = '';
    document.getElementById('emp-hiredate').value = '';
    populateDeptDropdown();
    document.getElementById('employee-form-container').style.display = 'block';
});

document.getElementById('save-employee-btn').addEventListener('click', function() {
    const id = document.getElementById('emp-hidden-id').value;
    const empId = document.getElementById('emp-empid').value.trim();
    const email = document.getElementById('emp-email').value.trim();
    const position = document.getElementById('emp-position').value.trim();
    const deptId = document.getElementById('emp-dept').value;
    const hireDate = document.getElementById('emp-hiredate').value;

    if (!empId || !email || !position || !deptId || !hireDate) {
        showToast('Please fill all fields', 'danger');
        return;
    }

    if (id) {
        const emp = window.db.employees.find(e => e.id === id);
        if (emp) Object.assign(emp, { empId, email, position, deptId, hireDate });
    } else {
        window.db.employees.push({ id: genId(), empId, email, position, deptId, hireDate });
    }

    saveToStorage();
    document.getElementById('employee-form-container').style.display = 'none';
    renderEmployeesTable();
    showToast('Employee saved', 'success');
});

document.getElementById('cancel-employee-btn').addEventListener('click', function() {
    document.getElementById('employee-form-container').style.display = 'none';
});

document.getElementById('new-request-btn').addEventListener('click', function() {
    document.getElementById('req-items-container').innerHTML = '';
    addRequestItem();
    document.getElementById('request-form-container').style.display = 'block';
});

document.getElementById('add-req-item-btn').addEventListener('click', addRequestItem);

document.getElementById('cancel-request-btn').addEventListener('click', function() {
    document.getElementById('request-form-container').style.display = 'none';
});

document.getElementById('submit-request-btn').addEventListener('click', function() {
    if (!currentUser) {
        showToast('You must be logged in', 'danger');
        return;
    }

    const items = [];
    document.querySelectorAll('#req-items-container .input-group').forEach(row => {
        const name = row.querySelector('input[type="text"]').value.trim();
        const qty = parseInt(row.querySelector('input[type="number"]').value, 10);
        if (name) items.push({ name, qty });
    });

    if (items.length === 0) {
        showToast('Add at least one item', 'danger');
        return;
    }

    window.db.requests.push({
        id: genId(),
        type: document.getElementById('req-type').value,
        items,
        status: 'Pending',
        date: new Date().toISOString(),
        employeeEmail: currentUser.email
    });

    saveToStorage();
    document.getElementById('request-form-container').style.display = 'none';
    renderRequestsTable();
    showToast('Request submitted!', 'success');
});

window.editDepartment = function(id) {
    const dept = window.db.departments.find(d => d.id === id);
    if (!dept) return;

    document.getElementById('dept-hidden-id').value = dept.id;
    document.getElementById('department-form-title').textContent = 'Edit Department';
    document.getElementById('dept-name').value = dept.name;
    document.getElementById('dept-desc').value = dept.description;
    document.getElementById('department-form-container').style.display = 'block';
};

window.deleteDepartment = function(id) {
    if (confirm('Delete this department?')) {
        window.db.departments = window.db.departments.filter(d => d.id !== id);
        saveToStorage();
        renderDepartmentsTable();
        showToast('Department deleted', 'success');
    }
};

window.editEmployee = function(id) {
    const emp = window.db.employees.find(e => e.id === id);
    if (!emp) return;

    document.getElementById('emp-hidden-id').value = emp.id;
    document.getElementById('employee-form-title').textContent = 'Edit Employee';
    document.getElementById('emp-empid').value = emp.empId;
    document.getElementById('emp-email').value = emp.email;
    document.getElementById('emp-position').value = emp.position;
    document.getElementById('emp-hiredate').value = emp.hireDate;
    populateDeptDropdown(emp.deptId);
    document.getElementById('employee-form-container').style.display = 'block';
};

window.deleteEmployee = function(id) {
    if (confirm('Delete this employee?')) {
        window.db.employees = window.db.employees.filter(e => e.id !== id);
        saveToStorage();
        renderEmployeesTable();
        showToast('Employee deleted', 'success');
    }
};

window.addEventListener('hashchange', handleRouting);

window.addEventListener('load', function() {
    loadFromStorage();
    checkAuth();

    if (!window.location.hash || window.location.hash === '#') {
        window.location.hash = '#/';
    }

    handleRouting();
});