/**
 * Modal Service - Event-based modal system for non-React contexts
 * This allows stores and utilities to trigger modals without direct React dependencies
 */

type ModalEventType = 'alert' | 'error' | 'warning' | 'success' | 'confirm';

interface ModalEvent {
  type: ModalEventType;
  title: string;
  message: string;
  onConfirm?: () => void;
  confirmText?: string;
}

type ModalListener = (event: ModalEvent) => void;

class ModalService {
  private listeners: Set<ModalListener> = new Set();

  subscribe(listener: ModalListener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(event: ModalEvent) {
    this.listeners.forEach(listener => listener(event));
  }

  showAlert(message: string, title = 'Alert') {
    this.emit({ type: 'alert', title, message });
  }

  showError(message: string, title = 'Error') {
    this.emit({ type: 'error', title, message });
  }

  showSuccess(message: string, title = 'Success') {
    this.emit({ type: 'success', title, message });
  }

  showWarning(message: string, onConfirm: () => void, title = 'Warning', confirmText = 'Continue') {
    this.emit({ type: 'warning', title, message, onConfirm, confirmText });
  }

  showConfirm(message: string, onConfirm: () => void, title = 'Confirm', confirmText = 'Confirm') {
    this.emit({ type: 'confirm', title, message, onConfirm, confirmText });
  }
}

export const modalService = new ModalService();
