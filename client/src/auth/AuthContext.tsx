import {
    createContext,
    useContext,
    useState,
    type ReactNode,
} from "react";

import { logout as revokeSession } from "../api/auth";

type AuthContextType = {
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (token: string) => void;
    logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(
    undefined
);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [token, setToken] = useState<string | null>(() =>
        localStorage.getItem("token")
    );

    function login(newToken: string) {
        localStorage.setItem("token", newToken);
        setToken(newToken);
    }

    async function logout() {
        setToken(await revokeSession());
    }

    return (
        <AuthContext.Provider
            value={{
                isAuthenticated: token !== null,
                isLoading: false,
                login,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (context === undefined) {
        throw new Error(
            "useAuth must be used inside AuthProvider"
        );
    }

    return context;
}
