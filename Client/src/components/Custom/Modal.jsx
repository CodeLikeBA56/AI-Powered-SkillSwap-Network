import './Modal.css';
import { useEffect, useRef, useState } from 'react';

const Modal = ({ title = undefined, isOpen, onClose, modalType, children }) => {
    const modalRef = useRef(null);
    const contentRef = useRef(null);
    const [isVisible, setVisibility] = useState(false);

    useEffect(() => {
        if (isOpen)
            setTimeout(() => setVisibility(true), 50);
        else
            setVisibility(false);
    }, [isOpen]);

    useEffect(() => {
        const modal = modalRef.current;
        if (!modal) return;

        const closeModal = (e) => {
            if (e.target === modal) {
                setVisibility(false);
                setTimeout(() => onClose(), 300);
            }
        };

        modal.addEventListener("click", closeModal);
        return () => modal.removeEventListener("click", closeModal);
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <section ref={modalRef} className={`modal-overlay ${isVisible ? 'show' : ''}`}>
            <div
                ref={contentRef}
                className={`modal-content ${modalType}`}
            >
                <div className={`modal-header ${modalType}`}>
                    { !title && <button id='swipe-handle'></button> }
                    { title && <span className='modal-title'>{title}</span> }
                    <button className="modal-close-btn" onClick={() => {
                        setVisibility(false);
                        setTimeout(() => onClose(), 300);
                    }}>
                        <span className='material-symbols-outlined'>close</span>
                    </button>
                </div>
                {children}
            </div>
        </section>
    );
};

export default Modal;