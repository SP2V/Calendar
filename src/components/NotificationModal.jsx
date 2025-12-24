import React from 'react';
import './NotificationModal.css';
import { AlarmClock } from 'lucide-react';

const NotificationModal = ({ isOpen, onClose, title, time }) => {
    if (!isOpen) return null;

    return (
        <div className="notif-modal-overlay">
            <div className="notif-modal-container">
                <button className="notif-modal-close" onClick={onClose}>
                    &times;
                </button>

                <div className="notif-modal-icon-wrapper">
                    <div className="notif-modal-icon-circle">
                        <AlarmClock size={36} color="white"/>
                    </div>
                </div>

                <h2 className="notif-modal-header">ถึงเวลาต้อง "{title}" แล้ว!</h2>
                <p className="notif-modal-time">
                    นาฬิกาตั้งไว้เวลา <span className="notif-modal-time-value">{time}</span>
                </p>
            </div>
        </div>
    );
};

export default NotificationModal;
