"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import Modal, { ModalType } from "@/components/ui/Modal";
import { modalService } from "@/lib/utils/modal-service";

interface ModalOptions {
  title: string;
  message: string;
  type?: ModalType;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
  onConfirm?: () => void;
}

interface ModalContextValue {
  showModal: (options: ModalOptions) => void;
  showAlert: (message: string, title?: string) => void;
  showError: (message: string, title?: string) => void;
  showSuccess: (message: string, title?: string) => void;
  showConfirm: (
    message: string,
    onConfirm: () => void,
    title?: string,
    confirmText?: string
  ) => void;
  showWarning: (
    message: string,
    onConfirm: () => void,
    title?: string,
    confirmText?: string
  ) => void;
  hideModal: () => void;
}

const ModalContext = createContext<ModalContextValue | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    options: ModalOptions;
  }>({
    isOpen: false,
    options: {
      title: "",
      message: "",
      type: "alert",
    },
  });

  const showModal = (options: ModalOptions) => {
    setModalState({
      isOpen: true,
      options,
    });
  };

  // Subscribe to modal service events
  useEffect(() => {
    const unsubscribe = modalService.subscribe((event) => {
      setModalState({
        isOpen: true,
        options: {
          title: event.title,
          message: event.message,
          type: event.type,
          onConfirm: event.onConfirm,
          confirmText: event.confirmText,
          showCancel: event.type === 'confirm' || event.type === 'warning',
        },
      });
    });

    return unsubscribe;
  }, []);

  const hideModal = () => {
    setModalState((prev) => ({
      ...prev,
      isOpen: false,
    }));
  };

  const showAlert = (message: string, title = "Alert") => {
    showModal({
      title,
      message,
      type: "alert",
      showCancel: false,
    });
  };

  const showError = (message: string, title = "Error") => {
    showModal({
      title,
      message,
      type: "error",
      showCancel: false,
    });
  };

  const showSuccess = (message: string, title = "Success") => {
    showModal({
      title,
      message,
      type: "success",
      showCancel: false,
    });
  };

  const showConfirm = (
    message: string,
    onConfirm: () => void,
    title = "Confirm",
    confirmText = "Confirm"
  ) => {
    showModal({
      title,
      message,
      type: "confirm",
      confirmText,
      onConfirm,
      showCancel: true,
    });
  };

  const showWarning = (
    message: string,
    onConfirm: () => void,
    title = "Warning",
    confirmText = "Continue"
  ) => {
    showModal({
      title,
      message,
      type: "warning",
      confirmText,
      onConfirm,
      showCancel: true,
    });
  };

  return (
    <ModalContext.Provider
      value={{
        showModal,
        showAlert,
        showError,
        showSuccess,
        showConfirm,
        showWarning,
        hideModal,
      }}
    >
      {children}
      <Modal
        isOpen={modalState.isOpen}
        onClose={hideModal}
        onConfirm={modalState.options.onConfirm}
        title={modalState.options.title}
        message={modalState.options.message}
        type={modalState.options.type}
        confirmText={modalState.options.confirmText}
        cancelText={modalState.options.cancelText}
        showCancel={modalState.options.showCancel}
      />
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return context;
}
