import type { NavigateOptions } from "react-router-dom";

import { HeroUIProvider } from "@heroui/system";
import { useHref, useNavigate } from "react-router-dom";
import { UserProvider } from './UserContext';
import {ToastProvider} from "@heroui/toast";

declare module '@react-types/shared' {
    interface RouterConfig {
        routerOptions: NavigateOptions;
    }
}

export function Provider({ children }: { children: React.ReactNode }) {
    const navigate = useNavigate();

    return (
        <UserProvider>
            <HeroUIProvider navigate={navigate} useHref={useHref}>
                    {children}
            </HeroUIProvider>
        </UserProvider>
    );
}
