import React, { useState, useEffect } from 'react';
import './User.css';
import TimeDropdown from "../components/AdminDropdown";
import PopupModal from "../components/PopupModal";
import ErrorPopup from "../components/ErrorPopup";
import {
  subscribeSchedules,
  addScheduleDoc,
  deleteScheduleById,
  subscribeActivityTypes,
  addActivityType,
} from '../firebase';

// --- ICONS ---
const CalendarIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
);

const User = () => {
  // --- STATES ---
  const [schedules, setSchedules] = useState([]);
  const [types, setTypes] = useState(['เลือกกิจกรรม']);
  const [activityTypes, setActivityTypes] = useState([]);

  // Form State
  const [formData, setFormData] = useState({ type: '', days: [], startTime: '', endTime: '', duration: '', subject: '' });
  const [customDuration, setCustomDuration] = useState('');

  // UI States
  const [isViewMode, setIsViewMode] = useState(false);
  const [popupMessage, setPopupMessage] = useState({ type: '', message: '' });

  // Mock Data for Calendar UI
  const daysOfWeek = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
  // สร้างเลขวันที่จำลอง (1-30) เพื่อความสวยงามเหมือนในรูป
  const calendarDays = Array.from({ length: 30 }, (_, i) => i + 1);

  // สร้างเลขระยะเวลาที่ User อยากจอง
  const duration = ['30 นาที', '1 ชั่วโมง', '2 ชั่วโมง', '3 ชั่วโมง', 'กำหนดเอง']
  
  // Time Slots ตัวอย่าง (ในใช้งานจริงอาจจะ generate จาก logic เดิม)
  const timeSlotsMock = [
    "09:00-09:30", "09:30-10:00",
    "10:00-10:30", "10:30-11:00",
    "11:00-11:30", "11:30-12:00",
    "13:00-13:30", "13:30-14:00"
  ];

  // --- EFFECTS ---
  useEffect(() => {
    const unsubSchedules = subscribeSchedules(setSchedules);
    const unsubTypes = subscribeActivityTypes((fetchedTypes) => {
      setActivityTypes(fetchedTypes);
      setTypes(['เลือกกิจกรรม', ...fetchedTypes.map(t => t.name)]);
    });
    return () => { unsubSchedules(); unsubTypes(); };
  }, []);

  useEffect(() => {
    if (popupMessage.type === 'success') {
      const timer = setTimeout(() => setPopupMessage({ type: '', message: '' }), 1000);
      return () => clearTimeout(timer);
    }
  }, [popupMessage]);

  // --- HANDLERS (Minimal Logic for UI Demo) ---
  const handleDaySelect = (dayNum) => {
    // แปลงเลขวันที่เป็นวันในสัปดาห์ (Mockup logic)
    // ในที่นี้เราจะใช้ logic เดิมคือเก็บเป็น 'อาทิตย์', 'จันทร์' แต่ UI จะโชว์เป็นปฏิทิน
    const dayIndex = (dayNum % 7);
    const fullDays = ['เสาร์', 'อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์'];
    const selectedDay = fullDays[dayIndex];

    setFormData(prev => {
      const exists = prev.days.includes(selectedDay);
      return {
        ...prev,
        days: exists ? prev.days.filter(d => d !== selectedDay) : [...prev.days, selectedDay]
      };
    });
  };

  const handleSave = async () => {
    // (Logic บันทึกเดิมของคุณ)
    if (!formData.type || formData.type === 'เลือกกิจกรรม') {
      setPopupMessage({ type: 'error', message: 'กรุณาเลือกกิจกรรม' });
      return;
    }
    // ... validation ...
    setPopupMessage({ type: 'success', message: 'บันทึกข้อมูลสำเร็จ (Mockup)' });
  };

  return (
    <div className="user-schedule-container">
      <div className="user-schedule-wrapper">

        {/* --- 1. HEADER CARD (เหมือนรูปแรก) --- */}
        <div className="user-header-card">
          <div className="user-header-left">
            <div className="user-header-icon-box">
              <CalendarIcon />
            </div>
            <div className="user-header-info">
              <h1>Book an Appointment</h1>
              <p>{isViewMode ? 'รายการจองนัดหมาย' : 'จองตารางนัดหมาย'}</p>
            </div>
          </div>
          <button
            className="user-header-btn-back"
            onClick={() => setIsViewMode(!isViewMode)}
          >
            {isViewMode ? '+ จองเพิ่ม' : 'ดูรายการจองนัดหมาย'}
          </button>
        </div>

        {/* --- 2. CONTENT AREA --- */}
        {!isViewMode ? (
          <div className="user-form-card">

            {/* Row 1: Activity Select */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label className="user-section-title" style={{ display: 'block' }}>เลือกกิจกรรม</label>
              <TimeDropdown
                value={formData.type}
                onChange={val => setFormData({ ...formData, type: val })}
                timeOptions={types.filter(t => t !== 'เลือกกิจกรรม')}
                placeholder="เลือกประเภทกิจกรรม (เช่น ประชุม)"
              />
            </div>

            {/* Row 2: Subject & Duration */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label className="user-section-title" style={{ display: 'block', marginBottom: '0.5rem' }}>รายละเอียดการนัดหมาย</label>
              <div className="flex gap-4" style={{ flexWrap: 'wrap' }}>
                <div style={{ flex: 2, minWidth: '250px' }}>
                  <label style={{ fontSize: '0.9rem', marginBottom: '4px', display: 'block', color: '#4b5563' }}>
                    หัวข้อการประชุม (Subject) <span className="text-red">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น ประชุมสรุปงานออกแบบ UX"
                    className="user-custom-input"
                    value={formData.subject}
                    onChange={e => setFormData({ ...formData, subject: e.target.value })}
                  />
                </div>
                <div style={{ flex: 1, minWidth: '150px' }}>
                  <label style={{ fontSize: '0.9rem', marginBottom: '4px', display: 'block', color: '#4b5563' }}>
                    ระยะเวลา (Duration) <span className="text-red">*</span>
                  </label>
                  <TimeDropdown
                    className="user-custom-input"
                    value={formData.duration}
                    onChange={e => setFormData({ ...formData, duration: value })}
                  />
                </div>
              </div>
            </div>

            {/* Row 3: Grid Layout (Calendar & Time) */}
            <div className="user-grid-layout">

              {/* LEFT: Calendar Panel */}
              <div className="user-gray-panel">
                <div className="user-calendar-header">
                  <span className="user-section-title" style={{ margin: 0 }}>เลือกวันที่</span>
                  <div style={{ display: 'flex', gap: '10px', fontSize: '0.9rem', color: '#4b5563', cursor: 'pointer' }}>
                    <span>&lt;</span>
                    <span>พฤศจิกายน 2025</span>
                    <span>&gt;</span>
                  </div>
                </div>

                <div className="user-calendar-grid">
                  {daysOfWeek.map(d => (
                    <div key={d} className="user-calendar-day-label">{d}</div>
                  ))}
                  {/* Mock Days */}
                  {calendarDays.map(day => {
                    // Mock logic: Highlight day 26
                    const isSelected = day === 26 || formData.days.length > 0 && day === 26;
                    return (
                      <button
                        key={day}
                        className={`user-day-btn ${isSelected ? 'active' : ''}`}
                        onClick={() => handleDaySelect(day)}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* RIGHT: Time Panel */}
              <div className="user-gray-panel">
                <div className="user-section-title">เลือกเวลา</div>
                <div className="user-time-slots-grid">
                  {/* ใช้วิธี map เพื่อแสดง Time Chips */}
                  {timeSlotsMock.map((slot, idx) => (
                    <div
                      key={idx}
                      className={`user-time-chip ${formData.startTime + '-' + formData.endTime === slot ? 'active' : ''}`}
                      onClick={() => {
                        const [start, end] = slot.split('-');
                        setFormData({ ...formData, startTime: start, endTime: end });
                      }}
                    >
                      {slot}
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* FOOTER ACTIONS */}
            <div className="user-action-footer">
              <button className="btn-confirm" onClick={handleSave}>
                ยืนยันการจอง
              </button>
            </div>

          </div>
        ) : (
          /* View Mode (List) */
          <div className="user-form-card">
            <h2 className="user-section-title">รายการนัดหมายทั้งหมด</h2>
            <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
              ส่วนแสดงผลรายการ (List View)
            </div>
          </div>
        )}

      </div>

      {/* Popups */}
      {popupMessage.type === 'success' && <PopupModal message={popupMessage.message} onClose={() => setPopupMessage({ type: '', message: '' })} />}
      {popupMessage.type === 'error' && <ErrorPopup message={popupMessage.message} onClose={() => setPopupMessage({ type: '', message: '' })} />}
    </div>
  );
};

export default User;