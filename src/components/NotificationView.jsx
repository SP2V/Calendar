import React, { useState } from 'react';
import { Calendar as CalendarLucide, Clock as ClockLucide } from 'lucide-react';
import './NotificationView.css';

const NotificationView = ({ notifications, onMarkAllRead }) => {
    const [activeTab, setActiveTab] = useState('All');

    const filteredNotifications = notifications.filter(n => {
        if (activeTab === 'All') return true;
        return n.type === activeTab.toLowerCase();
    });

    return (
        <div className="notification-view-container">
            <div className="nv-header">
                <h2 className="nv-title">การแจ้งเตือน</h2>
                <p className="nv-subtitle">อัปเดตเกี่ยวกับการจองและเขตเวลาของคุณ</p>
            </div>

            <div className="nv-tabs">
                {['All', 'Booking', 'Timezone'].map(tab => (
                    <button
                        key={tab}
                        className={`nv-tab-btn ${activeTab === tab ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab === 'All' ? 'ทั้งหมด' : tab === 'Booking' ? 'การจอง' : 'เขตเวลา'}
                    </button>
                ))}
            </div>

            <div className="nv-body">
                {filteredNotifications.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                        ไม่มีการแจ้งเตือนในขณะนี้
                    </div>
                ) : (
                    filteredNotifications.map(item => (
                        <div key={item.id} className={`nv-list-item ${!item.read ? 'unread' : ''}`}>
                            <div className="nv-icon-box" style={{
                                background: item.type === 'timezone' ? '#fef2f2' : '#f0f9ff',
                                color: item.type === 'timezone' ? '#ef4444' : '#3b82f6',
                            }}>
                                {item.type === 'timezone' ? <ClockLucide size={24} /> : (
                                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <CalendarLucide size={24} strokeWidth={2} />
                                        <span style={{ position: 'absolute', top: '6px', fontSize: '10px', fontWeight: 'bold' }}>{item.dayOfMonth}</span>
                                    </div>
                                )}
                                {!item.read && <div className="nv-unread-dot"></div>}
                            </div>

                            <div className="nv-content">
                                <div className="nv-header-row">
                                    <div className="nv-item-title">
                                        {item.title}
                                    </div>
                                    <div className="nv-timestamp">{item.footerTime}</div>
                                </div>
                                <div className="nv-desc">{item.desc}</div>
                                <div className="nv-sub-desc">{item.fullThaiInfo}</div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="nv-footer">
                <span className="nv-footer-count">แสดง {filteredNotifications.length} รายการจากทั้งหมด {notifications.length} รายการ</span>
                <button className="nv-mark-all-btn" onClick={onMarkAllRead}>
                    ทำเครื่องหมายอ่านทั้งหมด
                </button>
            </div>
        </div>
    );
};

export default NotificationView;
