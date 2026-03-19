const API_BASE_URL = typeof window !== 'undefined'
    ? "/api"
    : (process.env.NEXT_PUBLIC_API_URL || "https://najax-pos-production.up.railway.app/api");

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    // In a real app, we'd get the token from cookies or auth client
    // Better-Auth handles sessions via cookies, so fetch should include credentials.

    const defaultOptions: RequestInit = {
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
        ...options,
    };

    const response = await fetch(url, defaultOptions);

    if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        const clonedResponse = response.clone();
        try {
            const error = await response.json();
            errorMessage = error.error || error.message || errorMessage;
            if (error.details) {
                errorMessage += ` (${error.details})`;
            }
        } catch (e) {
            // Fallback for non-JSON errors
            const text = await clonedResponse.text().catch(() => 'Unknown error');
            errorMessage = text.slice(0, 100) || errorMessage;
        }
        throw new Error(errorMessage);
    }

    if (response.status === 204) return null;
    return response.json();
}

export const productsApi = {
    getAll: (businessId: string) => apiFetch(`/products?businessId=${businessId}`),
    create: (data: any) => apiFetch('/products', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => apiFetch(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    adjustStock: (id: string, data: { stockQuantity: number }) => apiFetch(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => apiFetch(`/products/${id}`, { method: 'DELETE' }),
};

export const staffApi = {
    getAll: (businessId: string) => apiFetch(`/staff?businessId=${businessId}`),
    getPerformance: (businessId: string) => apiFetch(`/staff/performance?businessId=${businessId}`),
    updateRole: (userId: string, role: string) => apiFetch(`/business/users/${userId}/role`, { method: 'PUT', body: JSON.stringify({ role }) }),
    remove: (id: string) => apiFetch(`/staff/${id}`, { method: 'DELETE' }),
};

export const expensesApi = {
    getAll: (businessId: string) => apiFetch(`/expenses?businessId=${businessId}`),
    create: (data: any) => apiFetch('/expenses', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => apiFetch(`/expenses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => apiFetch(`/expenses/${id}`, { method: 'DELETE' }),
};

export const salesApi = {
    getAll: () => apiFetch('/sales'),
    delete: (id: string) => apiFetch(`/sales/${id}`, { method: 'DELETE' }),
};

export const customersApi = {
    getAll: (businessId: string) => apiFetch(`/customers?businessId=${businessId}`),
    getOne: (id: string) => apiFetch(`/customers/${id}`),
    create: (data: any) => apiFetch('/customers', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => apiFetch(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => apiFetch(`/customers/${id}`, { method: 'DELETE' }),
};
export const businessApi = {
    get: () => apiFetch('/business'),
    getAllMyBusinesses: () => apiFetch('/business/my-businesses'),
    switchBusiness: (businessId: string) => apiFetch('/business/switch-business', { method: 'POST', body: JSON.stringify({ businessId }) }),
    create: (data: any) => apiFetch('/business', { method: 'POST', body: JSON.stringify(data) }),
    update: (data: any) => apiFetch('/business', { method: 'PUT', body: JSON.stringify(data) }),
};

export const categoriesApi = {
    getAll: (businessId: string) => apiFetch(`/categories?businessId=${businessId}`),
    create: (data: any) => apiFetch('/categories', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => apiFetch(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => apiFetch(`/categories/${id}`, { method: 'DELETE' }),
};

export const recurringExpensesApi = {
    getAll: () => apiFetch('/recurring-expenses'),
    create: (data: any) => apiFetch('/recurring-expenses', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => apiFetch(`/recurring-expenses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => apiFetch(`/recurring-expenses/${id}`, { method: 'DELETE' }),
};

export const invitationsApi = {
    send: (data: any) => apiFetch('/invitations', { method: 'POST', body: JSON.stringify(data) }),
    getAll: (businessId: string) => apiFetch(`/invitations?businessId=${businessId}`),
    getMyInvitations: () => apiFetch('/invitations/mine'),
    accept: (payload: { id?: string, token?: string }) => apiFetch('/invitations/accept', { method: 'POST', body: JSON.stringify(payload) }),
    delete: (id: string) => apiFetch(`/invitations/${id}`, { method: 'DELETE' }),
};

export const dashboardApi = {
    getStats: () => apiFetch('/dashboard'),
};

export const inventoryApi = {
    // Suppliers
    getSuppliers: () => apiFetch('/inventory/suppliers'),
    createSupplier: (data: any) => apiFetch('/inventory/suppliers', { method: 'POST', body: JSON.stringify(data) }),
    updateSupplier: (id: string, data: any) => apiFetch(`/inventory/suppliers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteSupplier: (id: string) => apiFetch(`/inventory/suppliers/${id}`, { method: 'DELETE' }),

    // Purchases
    getPurchases: () => apiFetch('/inventory/purchases'),
    createPurchase: (data: any) => apiFetch('/inventory/purchases', { method: 'POST', body: JSON.stringify(data) }),
    deletePurchase: (id: string) => apiFetch(`/inventory/purchases/${id}`, { method: 'DELETE' }),

    // Exchange Rates
    getExchangeRates: () => apiFetch('/inventory/exchange-rates'),
    updateExchangeRate: (data: any) => apiFetch('/inventory/exchange-rates', { method: 'POST', body: JSON.stringify(data) }),

    // Stock Logs
    getStockLogs: (productId?: string) => apiFetch(productId ? `/inventory/stock-logs/${productId}` : '/inventory/stock-logs'),
};
