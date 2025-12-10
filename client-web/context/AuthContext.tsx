'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/axios';
import { useRouter } from 'next/navigation';

// Definir la interfaz del Usuario decodificado del token (o almacenado)
export interface User {
    UsuarioId: number;
    Nombre: string;
    Rol: string;
    // Otros campos si es necesario
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (dni: string, password: string) => Promise<void>;
    logout: () => void;
    isLoading: boolean;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Cargar usuario del localStorage al iniciar
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
        }
        setIsLoading(false);
    }, []);

    const login = async (dni: string, password: string) => {
        try {
            const response = await api.post('/auth/login', { DNI: dni, Password: password });
            const { token } = response.data;

            // PARSE JWT PAYLOAD MANUALLY
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));

            const decoded = JSON.parse(jsonPayload);

            const userData: User = {
                UsuarioId: parseInt(decoded?.nameid || decoded?.sub), // ClaimTypes.NameIdentifier suele mapearse a 'nameid' o 'sub'
                Nombre: decoded?.unique_name || decoded?.name, // ClaimTypes.Name maps to 'unique_name' usually
                Rol: decoded?.role
            };

            setToken(token);
            setUser(userData);

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(userData));

            router.push('/');
        } catch (error) {
            console.error("Login Error:", error);
            throw error;
        }
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isLoading, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
