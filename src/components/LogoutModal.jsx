import React from 'react';
import './LogoutModal.css';

const LogoutModal = ({ isOpen, onClose, onConfirm }) => {

    // Prevent body scroll when modal is open
    React.useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="logout-modal-overlay" onClick={onClose}>
            <div className="logout-modal-box" onClick={e => e.stopPropagation()}>
                <div className="logout-content-wrapper">
                    <h3 className="logout-title">ออกจากระบบบัญชีของคุณใช่ไหม</h3>
                </div>

                <div className="logout-actions-row">
                    <button className="btn-logout-action cancel" onClick={onClose}>
                        ยกเลิก
                    </button>
                    <button className="btn-logout-action confirm" onClick={onConfirm}>
                        ออกจากระบบ
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LogoutModal;
