import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';

export type AlertButton = {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
};

interface CustomAlertModalProps {
  visible: boolean;
  title: string;
  message?: string;
  icon?: string;
  type?: 'success' | 'danger' | 'info' | 'warning';
  buttons?: AlertButton[];
  onClose?: () => void;
}

export default function CustomAlertModal({
  visible,
  title,
  message,
  icon,
  type = 'info',
  buttons = [{ text: 'OK' }],
  onClose,
}: CustomAlertModalProps) {
  const getDefaultIcon = () => {
    if (icon) return icon;
    switch (type) {
      case 'success':
        return '🎉';
      case 'danger':
        return '🗑️';
      case 'warning':
        return '⚠️';
      default:
        return '💡';
    }
  };

  const getIconContainerStyle = () => {
    switch (type) {
      case 'success':
        return styles.iconSuccess;
      case 'danger':
      case 'warning':
        return styles.iconDanger;
      default:
        return styles.iconInfo;
    }
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalCard}>
              <View style={[styles.iconCircle, getIconContainerStyle()]}>
                <Text style={styles.iconText}>{getDefaultIcon()}</Text>
              </View>

              <Text style={styles.title}>{title}</Text>
              {message ? <Text style={styles.message}>{message}</Text> : null}

              <View style={[styles.buttonContainer, buttons.length > 1 && styles.buttonRow]}>
                {buttons.map((btn, index) => {
                  const isCancel = btn.style === 'cancel';
                  const isDestructive = btn.style === 'destructive';

                  let btnStyle = styles.primaryButton;
                  let btnTextStyle = styles.primaryButtonText;

                  if (isCancel) {
                    btnStyle = styles.cancelButton;
                    btnTextStyle = styles.cancelButtonText;
                  } else if (isDestructive) {
                    btnStyle = styles.destructiveButton;
                    btnTextStyle = styles.destructiveButtonText;
                  }

                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.baseButton,
                        btnStyle,
                        buttons.length > 1 && styles.flexButton,
                      ]}
                      activeOpacity={0.8}
                      onPress={() => {
                        if (btn.onPress) {
                          btn.onPress();
                        } else if (onClose) {
                          onClose();
                        }
                      }}
                    >
                      <Text style={[styles.baseButtonText, btnTextStyle]}>{btn.text}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconSuccess: {
    backgroundColor: '#eef2ff',
  },
  iconDanger: {
    backgroundColor: '#fee2e2',
  },
  iconInfo: {
    backgroundColor: '#f3f4f6',
  },
  iconText: {
    fontSize: 32,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  buttonContainer: {
    width: '100%',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  baseButton: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flexButton: {
    flex: 1,
  },
  primaryButton: {
    backgroundColor: '#6366f1',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
  },
  destructiveButton: {
    backgroundColor: '#ef4444',
  },
  baseButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  primaryButtonText: {
    color: '#ffffff',
  },
  cancelButtonText: {
    color: '#4b5563',
  },
  destructiveButtonText: {
    color: '#ffffff',
  },
});

