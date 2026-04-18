const activityForm = document.getElementById('activity-form');
const listEl = document.getElementById('activity-list');
const listMessageEl = document.getElementById('list-message');
const formMessageEl = document.getElementById('form-message');
const paginationEl = document.getElementById('pagination');
const logoutBtn = document.getElementById('logout-btn');
const welcomeText = document.getElementById('welcome-text');

const categoryFilter = document.getElementById('filter-category');
const sortOrder = document.getElementById('sort-order');
const searchInput = document.getElementById('search-name');

const editModal = document.getElementById('edit-modal');
const editForm = document.getElementById('edit-form');
const cancelEditBtn = document.getElementById('cancel-edit');

const state = {
    currentPage: 1,
    search: '',
    category: 'All',
    sort: 'newest',
    loading: false,
};

let formMessageTimer;

function getAccessToken() {
    return sessionStorage.getItem('access_token');
}

function setAccessToken(token) {
    sessionStorage.setItem('access_token', token);
}

function clearAuth() {
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('username');
}

async function refreshAccessToken() {
    const response = await fetch('/api/token/refresh/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({}),
    });

    if (!response.ok) {
        clearAuth();
        throw new Error('Session expired. Please login again.');
    }

    const data = await response.json();
    setAccessToken(data.access);
    return data.access;
}

async function apiFetch(url, options = {}, retry = true) {
    const token = getAccessToken();

    const headers = {
        ...(options.headers || {}),
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include',
    });

    if (response.status === 401 && retry) {
        try {
            await refreshAccessToken();
            return apiFetch(url, options, false);
        } catch {
            window.location.href = '/login/';
            throw new Error('Unauthorized');
        }
    }

    return response;
}

function setMessage(el, text, type = '') {
    el.textContent = text;
    el.className = `message ${type}`.trim();
}

function setFormMessage(text, type = '', timeoutMs = 0) {
    setMessage(formMessageEl, text, type);
    if (formMessageTimer) {
        clearTimeout(formMessageTimer);
        formMessageTimer = null;
    }

    if (timeoutMs > 0) {
        formMessageTimer = setTimeout(() => {
            setMessage(formMessageEl, '');
            formMessageTimer = null;
        }, timeoutMs);
    }
}

function formatDate(value) {
    if (!value) return '-';
    return new Date(value).toLocaleDateString();
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function openEditModal(activity) {
    document.getElementById('edit-id').value = activity.id;
    document.getElementById('edit-name').value = activity.name;
    document.getElementById('edit-category').value = activity.category;
    document.getElementById('edit-date').value = activity.date;
    editModal.classList.remove('hidden');
    editModal.setAttribute('aria-hidden', 'false');
}

function closeEditModal() {
    editModal.classList.add('hidden');
    editModal.setAttribute('aria-hidden', 'true');
    editForm.reset();
}

async function fetchActivities() {
    state.loading = true;
    listEl.innerHTML = '<tr><td colspan="5">Loading activities...</td></tr>';
    setMessage(listMessageEl, '');

    const params = new URLSearchParams({
        page: String(state.currentPage),
        sort: state.sort,
    });

    if (state.category !== 'All') {
        params.append('category', state.category);
    }
    if (state.search) {
        params.append('search', state.search);
    }

    try {
        const response = await apiFetch(`/api/activities/?${params.toString()}`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data?.detail || 'Could not fetch activities.');
        }

        renderActivities(data.results || []);
        renderPagination(data);

        if (!data.results?.length) {
            const emptyText = state.search || state.category !== 'All'
                ? 'No matching activities found.'
                : 'No activities logged yet.';
            setMessage(listMessageEl, emptyText);
        }
    } catch (error) {
        listEl.innerHTML = '<tr><td colspan="5">-</td></tr>';
        setMessage(listMessageEl, error.message || 'Failed to load activities.', 'error');
    } finally {
        state.loading = false;
    }
}

function renderActivities(activities) {
    if (!activities.length) {
        listEl.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--muted); padding: 20px;">No activities found</td></tr>';
        return;
    }

    listEl.innerHTML = activities
        .map((item) => `
            <tr>
                <td>${escapeHtml(item.name)}</td>
                <td>${escapeHtml(item.category)}</td>
                <td>${formatDate(item.date)}</td>
                <td>${formatDate(item.created_at)}</td>
                <td class="actions">
                    <button class="btn small" data-action="edit" data-id="${item.id}">Edit</button>
                    <button class="btn small danger" data-action="delete" data-id="${item.id}">Delete</button>
                </td>
            </tr>
        `)
        .join('');
}

function renderPagination(data) {
    const totalPages = Math.ceil((data.count || 0) / 10);

    if (totalPages <= 1) {
        paginationEl.innerHTML = '';
        return;
    }

    paginationEl.innerHTML = `
        <button class="btn small" id="prev-page" ${data.previous ? '' : 'disabled'}>Previous</button>
        <span>Page ${state.currentPage} of ${totalPages}</span>
        <button class="btn small" id="next-page" ${data.next ? '' : 'disabled'}>Next</button>
    `;

    document.getElementById('prev-page')?.addEventListener('click', () => {
        if (state.currentPage > 1) {
            state.currentPage -= 1;
            fetchActivities();
        }
    });

    document.getElementById('next-page')?.addEventListener('click', () => {
        if (data.next) {
            state.currentPage += 1;
            fetchActivities();
        }
    });
}

activityForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    setFormMessage('Saving activity...');

    const payload = {
        name: activityForm.name.value.trim(),
        category: activityForm.category.value,
        date: activityForm.date.value,
    };

    try {
        const response = await apiFetch('/api/activities/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
            const firstError = data?.name?.[0] || data?.category?.[0] || data?.date?.[0] || data?.detail || 'Could not save activity.';
            throw new Error(firstError);
        }

        setFormMessage('Activity saved.', 'success', 3000);
        activityForm.reset();
        state.currentPage = 1;
        fetchActivities();
    } catch (error) {
        setFormMessage(error.message, 'error', 5000);
    }
});

listEl?.addEventListener('click', async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const action = target.getAttribute('data-action');
    const id = target.getAttribute('data-id');
    if (!action || !id) return;

    if (action === 'delete') {
        const confirmed = window.confirm('Delete this activity?');
        if (!confirmed) return;

        try {
            const response = await apiFetch(`/api/activities/${id}/`, { method: 'DELETE' });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data?.detail || 'Delete failed.');
            }
            setMessage(listMessageEl, 'Activity deleted.', 'success');
            fetchActivities();
        } catch (error) {
            setMessage(listMessageEl, error.message, 'error');
        }
    }

    if (action === 'edit') {
        try {
            const response = await apiFetch(`/api/activities/${id}/`);
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data?.detail || 'Could not load activity.');
            }
            openEditModal(data);
        } catch (error) {
            setMessage(listMessageEl, error.message, 'error');
        }
    }
});

editForm?.addEventListener('submit', async (event) => {
    event.preventDefault();

    const id = document.getElementById('edit-id').value;
    const payload = {
        name: document.getElementById('edit-name').value.trim(),
        category: document.getElementById('edit-category').value,
        date: document.getElementById('edit-date').value,
    };

    try {
        const response = await apiFetch(`/api/activities/${id}/`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        const data = await response.json();

        if (!response.ok) {
            const firstError = data?.name?.[0] || data?.category?.[0] || data?.date?.[0] || data?.detail || 'Update failed.';
            throw new Error(firstError);
        }

        closeEditModal();
        setMessage(listMessageEl, 'Activity updated.', 'success');
        fetchActivities();
    } catch (error) {
        setMessage(listMessageEl, error.message, 'error');
    }
});

cancelEditBtn?.addEventListener('click', closeEditModal);

logoutBtn?.addEventListener('click', async () => {
    try {
        await apiFetch('/api/logout/', { method: 'POST' }, false);
    } finally {
        clearAuth();
        window.location.href = '/login/';
    }
});

categoryFilter?.addEventListener('change', () => {
    state.category = categoryFilter.value;
    state.currentPage = 1;
    fetchActivities();
});

sortOrder?.addEventListener('change', () => {
    state.sort = sortOrder.value;
    state.currentPage = 1;
    fetchActivities();
});

let searchTimer;
searchInput?.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
        state.search = searchInput.value.trim();
        state.currentPage = 1;
        fetchActivities();
    }, 300);
});

async function initializeDashboard() {
    const username = sessionStorage.getItem('username');
    if (username) {
        welcomeText.textContent = `Logged in as ${username}`;
    }

    if (!getAccessToken()) {
        try {
            await refreshAccessToken();
        } catch {
            window.location.href = '/login/';
            return;
        }
    }

    fetchActivities();
}

initializeDashboard();
