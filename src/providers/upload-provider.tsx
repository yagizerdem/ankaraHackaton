"use client";

import { createContext, useContext, useState } from "react";
import type { UploadDocumentResponse } from "@/domain/document";
import type { ApiResponse } from "@/lib/api-response";
import HttpStatusCode from "@/lib/http-status-code";

export const UPLOAD_STEPS = ["upload", "chunking", "embedding", "dag"] as const;
export type UploadStep = (typeof UPLOAD_STEPS)[number] | "done";

type UploadProviderProps = {
  children: React.ReactNode;
};

type UploadProviderState = {
  showUploadModal: boolean;
  setShowUploadModal: (show: boolean) => void;
  isUploading: boolean;
  currentStep: UploadStep;
  setCurrentStep: (step: UploadStep) => void;
  uploadFile: (file: File) => Promise<ApiResponse<UploadDocumentResponse>>;
};

const initialState: UploadProviderState = {
  showUploadModal: false,
  setShowUploadModal: () => null,
  isUploading: false,
  currentStep: "upload",
  setCurrentStep: () => null,
  uploadFile: async () => {
    throw new Error("not implemented");
  },
};

const UploadProviderContext = createContext<UploadProviderState>(initialState);

export function UploadProvider({ children, ...props }: UploadProviderProps) {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [currentStep, setCurrentStep] = useState<UploadStep>("upload");

  async function uploadFile(
    file: File,
  ): Promise<ApiResponse<UploadDocumentResponse>> {
    const body = new FormData();
    body.append("file", file);

    setIsUploading(true);
    try {
      const response = await fetch("/api/upload", { method: "POST", body });
      const json = (await response
        .json()
        .catch(() => null)) as ApiResponse<UploadDocumentResponse> | null;

      return (
        json ?? {
          message: "Upload failed, try again",
          error: "Upload failed, try again",
          httpStatusCode: response.status,
          isSuccess: false,
        }
      );
    } catch {
      return {
        message: "Network error, check your connection",
        error: "Network error, check your connection",
        httpStatusCode: HttpStatusCode.SERVICE_UNAVAILABLE,
        isSuccess: false,
      };
    } finally {
      setIsUploading(false);
    }
  }

  const value = {
    showUploadModal,
    setShowUploadModal,
    isUploading,
    currentStep,
    setCurrentStep,
    uploadFile,
  };

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
