const API_BASE_URL = 'http://localhost:5050/api';

class AuthService {
    async register(username, password) {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();
            
            if (data.success) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('username', data.username);
            }
            
            return data;
        } catch (error) {
            console.error('خطا در ثبت‌نام:', error);
            return {
                success: false,
                message: 'خطا در ارتباط با سرور'
            };
        }
    }

    async login(username, password) {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();
            
            if (data.success) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('username', data.username);
            }
            
            return data;
        } catch (error) {
            console.error('خطا در ورود:', error);
            return {
                success: false,
                message: 'خطا در ارتباط با سرور'
            };
        }
    }

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
    }

    getToken() {
        return localStorage.getItem('token');
    }

    getUsername() {
        return localStorage.getItem('username');
    }

    isAuthenticated() {
        const token = this.getToken();
        return token !== null && token !== undefined;
    }

    async validateToken() {
        const token = this.getToken();
        if (!token) {
            return false;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/auth/validate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(token),
            });

            const data = await response.json();
            return data.success;
        } catch (error) {
            console.error('خطا در اعتبارسنجی توکن:', error);
            return false;
        }
    }
}

export default new AuthService(); 