"use client";

import { createContext, useContext, useState } from "react";

type UploadProviderProps = {
  children: React.ReactNode;
};

type UploadProviderState = {
  showUploadModal: boolean;
  setShowUploadModal: (show: boolean) => void;
};

const initialState: UploadProviderState = {
  showUploadModal: false,
  setShowUploadModal: () => null,
};

const UploadProviderContext = createContext<UploadProviderState>(initialState);

export function UploadProvider({ children, ...props }: UploadProviderProps) {
  const [showUploadModal, setShowUploadModal] = useState(false);

  const value = { showUploadModal, setShowUploadModal };

  return (
    <UploadProviderContext.Provider {...props} value={value}>
      {children}
    </UploadProviderContext.Provider>
  );
}

export const useUpload = () => {
  const context = useContext(UploadProviderContext);

  if (context === undefined)
    throw new Error("useUpload must be used within an UploadProvider");

  return context;
};
