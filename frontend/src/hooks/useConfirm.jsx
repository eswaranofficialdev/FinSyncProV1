import { useState } from 'react';
import Modal from '../components/Modal';

export const useConfirm = () => {
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: 'Confirm Action',
    message: '',
    onConfirm: () => {},
  });

  const confirm = (message, onConfirm, title = 'Are you sure?') => {
    setConfirmConfig({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const close = () => {
    setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
  };

  const ConfirmationModal = () => (
    <Modal
      isOpen={confirmConfig.isOpen}
      onClose={close}
      title={confirmConfig.title}
      footer={
        <>
          <button className="btn btn-outline" onClick={close}>
            Cancel
          </button>
          <button className="btn btn-danger" onClick={confirmConfig.onConfirm}>
            Confirm
          </button>
        </>
      }
    >
      <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-main, #333)', lineHeight: 1.5 }}>
        {confirmConfig.message}
      </p>
    </Modal>
  );

  return { confirm, ConfirmationModal };
};