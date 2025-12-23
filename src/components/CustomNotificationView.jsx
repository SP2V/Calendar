import React, { useState } from 'react';
import { Calendar, Clock, Globe, MoreVertical, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { AlarmClock } from 'lucide-react';
import AddNotificationModal from './AddNotificationModal';
import './CustomNotificationView.css';

const CustomNotificationView = ({ notifications, onAddClick }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Mock Data if empty (matching the image)
    const displayData = notifications && notifications.length > 0 ? notifications : [
        { id: 1, title: 'กินยา', date: '26 พฤศจิกายน 2568', time: '09:00 น.', timezone: 'Asia/Bangkok (GMT+07:00)' },
        { id: 2, title: 'ไปรับลูก', date: '27 พฤศจิกายน 2568', time: '16:30 น.', timezone: 'Asia/Bangkok (GMT+07:00)' },
        { id: 3, title: 'ซื้อของ', date: '28 พฤศจิกายน 2568', time: '10:00 น.', timezone: 'Asia/Bangkok (GMT+07:00)' },
    ];

    const handleSaveNotification = (data) => {
        console.log("New Notification:", data);
        // Here we would call a prop function to actually save it to User.jsx state
        setIsModalOpen(false);
    };

    return (
        <div className="cn-container">
            <div className="cn-header">
                <div className="cn-header-left">
                    <AlarmClock size={30} strokeWidth={2.5} color="#2563eb" />
                    <h2 className="cn-title">การแจ้งเตือนของคุณ</h2>
                </div>
                <button className="cn-add-btn" onClick={() => setIsModalOpen(true)}>
                    <Plus size={24} strokeWidth={2.5} />
                </button>
            </div>

            <div className="cn-list">
                {displayData.map((item) => (
                    <div key={item.id} className="cn-card">
                        <div className="cn-content">
                            <h3 className="cn-card-title">{item.title}</h3>
                            <div className="cn-meta-row">
                                <div className="cn-meta-item">
                                    <Calendar className="cn-icon" />
                                    <span>{item.date}</span>
                                </div>
                                <div className="cn-meta-item">
                                    <Clock className="cn-icon" />
                                    <span>{item.time}</span>
                                </div>
                                <div className="cn-meta-item">
                                    <Globe className="cn-icon" />
                                    <span>{item.timezone}</span>
                                </div>
                            </div>
                        </div>
                        <div className="cn-actions">
                            <button className="cn-menu-btn">
                                <MoreVertical size={20} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="cn-footer">
                <div className="cn-footer-text">
                    แสดง {displayData.length} รายการจากทั้งหมด {displayData.length} รายการ
                </div>
                <div className="cn-pagination">
                    <button className="cn-page-btn"><ChevronLeft size={18} /></button>
                    <button className="cn-page-btn active">1</button>
                    <button className="cn-page-btn" disabled style={{ opacity: 0.5 }}>2</button>
                    <button className="cn-page-btn"><ChevronRight size={18} /></button>
                </div>
            </div>

            <AddNotificationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveNotification}
            />
        </div>
    );
};

export default CustomNotificationView;
