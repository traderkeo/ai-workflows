import React, { createContext, useContext, ReactNode } from 'react';

interface NotificationContextValue {
  showAlert: (message: string, title?: string) => Promise<void>;
  showConfirm: (message: string, title?: string) => Promise<boolean>;
  showPrompt: (message: string, defaultValue?: string) => Promise<string | null>;
  showToast: (message: string, variant?: 'default' | 'destructive' | 'success') => void;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    // Fallback to native dialogs if no provider
    return {
      showAlert: async (message: string) => {
        alert(message);
      },
      showConfirm: async (message: string) => {
        return confirm(message);
      },
      showPrompt: async (message: string, defaultValue?: string) => {
        return prompt(message, defaultValue) || null;
      },
      showToast: (message: string) => {
        // No-op fallback
      },
    };
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
  value: NotificationContextValue;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children, value }) => {
  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

