const API_BASE = 'http://localhost:5000/api';

const getToken = () => localStorage.getItem('nexus_token');

const apiRequest = async (path, options = {}) => {
    const token = getToken();
    const response = await fetch(`${API_BASE}${path}`, {
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(options.headers || {})
        },
        ...options
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(data.error || 'ERROR_DE_API');
    }

    return data;
};

window.cyberHubApi = {
    async saveGameResult({ gameId, score, level, timeSeconds }) {
        return apiRequest('/games/report', {
            method: 'POST',
            body: JSON.stringify({ gameId, score, level, time_seconds: timeSeconds })
        });
    },

    async getProfile() {
        return apiRequest('/games/me', { method: 'GET' });
    }
};
