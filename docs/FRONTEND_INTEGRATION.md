# Integración del Sistema de Autenticación en el Frontend

Este documento proporciona ejemplos de código para integrar el sistema de autenticación JWT en aplicaciones frontend.

## 1. Servicio de Autenticación (React/TypeScript)

```typescript
// services/authService.ts
import axios, { AxiosInstance } from 'axios';

const API_URL = 'http://localhost:3000';

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
  lastName: string;
  role?: 'ADMIN' | 'OPERARIO';
}

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    lastName: string;
    role: string;
  };
}

class AuthService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Interceptor para agregar el token a todas las peticiones
    this.api.interceptors.request.use(
      (config) => {
        const token = this.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Interceptor para refrescar el token automáticamente
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Si el error es 401 y no hemos intentado refrescar
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const newTokens = await this.refreshToken();
            this.setTokens(newTokens.accessToken, newTokens.refreshToken);

            // Reintentar la petición original con el nuevo token
            originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
            return this.api(originalRequest);
          } catch (refreshError) {
            // Si falla el refresh, redirigir al login
            this.logout();
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await this.api.post('/auth/login', credentials);
    const data = response.data.data;
    this.setTokens(data.accessToken, data.refreshToken);
    return data;
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await this.api.post('/auth/register', data);
    const authData = response.data.data;
    this.setTokens(authData.accessToken, authData.refreshToken);
    return authData;
  }

  async refreshToken(): Promise<{ accessToken: string; refreshToken: string }> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await axios.post(`${API_URL}/auth/refresh`, {
      refreshToken,
    });

    return response.data.data;
  }

  async logout(): Promise<void> {
    const refreshToken = this.getRefreshToken();
    if (refreshToken) {
      try {
        await this.api.post('/auth/logout', { refreshToken });
      } catch (error) {
        console.error('Error during logout:', error);
      }
    }
    this.clearTokens();
  }

  async getCurrentUser(): Promise<any> {
    const response = await this.api.get('/auth/me');
    return response.data.data;
  }

  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  private setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }

  private clearTokens(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }
}

export const authService = new AuthService();
```

## 2. Context de Autenticación (React)

```typescript
// contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/authService';

interface User {
  id: string;
  email: string;
  name: string;
  lastName: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Cargar el usuario al iniciar la aplicación
    const loadUser = async () => {
      if (authService.isAuthenticated()) {
        try {
          const userData = await authService.getCurrentUser();
          setUser(userData);
        } catch (error) {
          console.error('Error loading user:', error);
          authService.logout();
        }
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authService.login({ email, password });
    setUser(response.user);
  };

  const register = async (data: any) => {
    const response = await authService.register(data);
    setUser(response.user);
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const hasRole = (role: string): boolean => {
    return user?.role === role;
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

## 3. Componente de Login

```typescript
// components/Login.tsx
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al iniciar sesión');
    }
  };

  return (
    <div className="login-container">
      <h2>Iniciar Sesión</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="password">Contraseña:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <div className="error">{error}</div>}
        <button type="submit">Iniciar Sesión</button>
      </form>
    </div>
  );
};
```

## 4. Ruta Protegida (React Router)

```typescript
// components/ProtectedRoute.tsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};
```

## 5. Configuración de Rutas

```typescript
// App.tsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { AdminPanel } from './components/AdminPanel';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* Rutas protegidas */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
          </Route>
          
          {/* Rutas solo para ADMIN */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
            <Route path="/admin" element={<AdminPanel />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
```

## 6. Hook Personalizado para Peticiones API

```typescript
// hooks/useApi.ts
import { useState, useCallback } from 'react';
import axios from 'axios';
import { authService } from '../services/authService';

const API_URL = 'http://localhost:3000';

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const api = axios.create({
    baseURL: API_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Agregar token a todas las peticiones
  api.interceptors.request.use((config) => {
    const token = authService.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  const request = useCallback(async (method: string, url: string, data?: any) => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.request({
        method,
        url,
        data,
      });
      setLoading(false);
      return response.data;
    } catch (err: any) {
      setLoading(false);
      const errorMessage = err.response?.data?.message || 'Error en la petición';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const get = useCallback((url: string) => request('GET', url), [request]);
  const post = useCallback((url: string, data: any) => request('POST', url, data), [request]);
  const put = useCallback((url: string, data: any) => request('PUT', url, data), [request]);
  const del = useCallback((url: string) => request('DELETE', url), [request]);

  return {
    loading,
    error,
    get,
    post,
    put,
    delete: del,
  };
};
```

## 7. Ejemplo de Uso del Hook

```typescript
// components/UserList.tsx
import React, { useEffect, useState } from 'react';
import { useApi } from '../hooks/useApi';

export const UserList: React.FC = () => {
  const [users, setUsers] = useState([]);
  const { get, loading, error } = useApi();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await get('/users');
        setUsers(data.data);
      } catch (err) {
        console.error('Error fetching users:', err);
      }
    };

    fetchUsers();
  }, [get]);

  if (loading) return <div>Cargando usuarios...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Lista de Usuarios</h2>
      <ul>
        {users.map((user: any) => (
          <li key={user.id}>
            {user.name} {user.lastName} - {user.role}
          </li>
        ))}
      </ul>
    </div>
  );
};
```

## 8. Almacenamiento Seguro de Tokens (Alternativa con Cookies)

Para mayor seguridad, puedes usar cookies httpOnly en lugar de localStorage:

### Backend (Express)

```typescript
// Agregar cookie-parser
import cookieParser from 'cookie-parser';
app.use(cookieParser());

// En el controlador de autenticación
res.cookie('refreshToken', refreshToken, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
});
```

### Frontend

```typescript
// El refresh token se envía automáticamente en las cookies
// Solo necesitas almacenar el access token
localStorage.setItem('accessToken', accessToken);
```

## Notas de Seguridad

1. **HTTPS**: Siempre usa HTTPS en producción
2. **CORS**: Configura CORS correctamente en el backend
3. **XSS**: Evita XSS sanitizando las entradas del usuario
4. **CSRF**: Implementa tokens CSRF si usas cookies
5. **Rate Limiting**: Limita las peticiones al endpoint de login

## Dependencias del Frontend

```bash
npm install axios react-router-dom
npm install --save-dev @types/react-router-dom
```
