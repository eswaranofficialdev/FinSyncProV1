import { AnimatePresence, motion } from 'framer-motion';
import { FaTimes } from 'react-icons/fa';
import './modal.css';

const Modal = ({ isOpen, onClose, title, children, footer }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        className="modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="modal-box glass-card"
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 26 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            <h3>{title}</h3>
            <button className="icon-btn" onClick={onClose}><FaTimes /></button>
          </div>
          <div className="modal-body">{children}</div>
          {footer && <div className="modal-footer">{footer}</div>}
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

export default Modal;
