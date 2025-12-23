import React, { useEffect } from 'react';
import { Trash } from 'lucide-react';
import './DeleteNotificationModal.css';

const DeleteNotificationModal = ({ isOpen, onClose, onConfirm, notification }) => {
    // Prevent background scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen || !notification) return null;

    const formatFullDate = (dateStr, timeStr) => {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        const thaiDate = date.toLocaleDateString('th-TH', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
        return `${thaiDate} ${timeStr}น.`;
    };

    return (
        <div className="dn-modal-overlay" onClick={onClose}>
            <div className="dn-modal-container" onClick={e => e.stopPropagation()}>
                <div className="dn-icon-wrapper">
                    <Trash size={32} color="white" strokeWidth={2.5} />
                </div>

                <h3 className="dn-title">ลบการแจ้งเตือน</h3>
                <p className="dn-subtitle">คุณต้องการลบการเตือนนี้หรือไหม?</p>

                <div className="dn-info-box">
                    <div className="dn-info-title">{notification.title}</div>
                    <div className="dn-info-date">
                        {formatFullDate(notification.date, notification.time)}
                    </div>
                </div>

                <div className="dn-actions">
                    <button className="dn-btn cancel" onClick={onClose}>
                        ปิด
                    </button>
                    <button className="dn-btn confirm" onClick={onConfirm}>
                        ยืนยัน
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteNotificationModal;
