import './CustomModel.css';
import { useEffect, useRef, useState } from 'react';

const CustomModal = ({ isOpen, onClose, children }) => {
    const modalRef = useRef(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen)
            setTimeout(() => setIsVisible(true), 50);
        else
            setIsVisible(false);
    }, [isOpen]);

    useEffect(() => {
        const modal = modalRef.current;
        if (!modal) return;

        const closeModal = (e) => {
            if (e.target === modal) {
                setIsVisible(false);
                setTimeout(() => onClose(), 300);
            }
        };

        modal.addEventListener("click", closeModal);
        return () => modal.removeEventListener("click", closeModal);
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <section ref={modalRef} className={`modal-overlay ${isVisible ? 'show' : ''}`}>
            <div className="modal-content">
                <div className='modal-close'>
                    <button className="modal-close-btn" onClick={() => {
                        setIsVisible(false);
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

export default CustomModal;