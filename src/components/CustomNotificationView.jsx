import React, { useState } from 'react';
import { Calendar, Clock, Globe, MoreVertical, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { AlarmClock } from 'lucide-react';
import AddNotificationModal from './AddNotificationModal';
import './CustomNotificationView.css';

const CustomNotificationView = ({ notifications = [], onSaveNotification, onDeleteNotification }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeMenuId, setActiveMenuId] = useState(null);

    // Use passed notifications or empty array
    const displayData = notifications;

    const handleSaveNotification = (data) => {
        if (onSaveNotification) {
            onSaveNotification(data);
        }
        setIsModalOpen(false);
    };

    // Helper to format date to Thai: "YYYY-MM-DD" -> "D MMMM YYYY"
    const formatDateThai = (dateStr) => {
        if (!dateStr) return "";
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('th-TH', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
        } catch (e) {
            return dateStr;
        }
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
                {displayData.length > 0 ? (
                    displayData.map((item) => (
                        <div key={item.id} className="cn-card">
                            <div className="cn-content">
                                <h3 className="cn-card-title">{item.title}</h3>
                                <div className="cn-meta-row">
                                    <div className="cn-meta-item">
                                        <Calendar className="cn-icon" />
                                        <span>{formatDateThai(item.date)}</span>
                                    </div>
                                    <div className="cn-meta-item">
                                        <Clock className="cn-icon" />
                                        <span>{item.time} น.</span>
                                    </div>
                                    <div className="cn-meta-item">
                                        <Globe className="cn-icon" />
                                        <span>{item.timezone}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="cn-actions">
                                <div style={{ position: 'relative' }}>
                                    <button
                                        className="cn-menu-btn"
                                        onClick={() => setActiveMenuId(activeMenuId === item.id ? null : item.id)}
                                    >
                                        <MoreVertical size={20} />
                                    </button>
                                    {activeMenuId === item.id && (
                                        <div className="cn-card-menu" style={{
                                            position: 'absolute',
                                            right: 0,
                                            top: '100%',
                                            background: 'white',
                                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                            borderRadius: '8px',
                                            padding: '4px',
                                            zIndex: 10,
                                            minWidth: '100px',
                                            border: '1px solid #e5e7eb'
                                        }}>
                                            <button
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    width: '100%',
                                                    padding: '8px',
                                                    color: '#ef4444',
                                                    background: 'none',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    fontSize: '0.875rem'
                                                }}
                                                onClick={() => {
                                                    if (onDeleteNotification) onDeleteNotification(item.id);
                                                    setActiveMenuId(null);
                                                }}
                                            >
                                                <span>ลบรายการ</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                        ยังไม่มีรายการเตือน
                    </div>
                )}
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
