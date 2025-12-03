import React, { useState, useEffect } from 'react';
import './User.css';
import TimeDropdown from "../components/AdminDropdown";
import PopupModal from "../components/PopupModal";
import ErrorPopup from "../components/ErrorPopup";
import {
  subscribeSchedules,
  subscribeActivityTypes,
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

  // Form State: days เก็บเป็น ['2025-12-05']
  const [formData, setFormData] = useState({ type: '', days: [], startTime: '', endTime: '', duration: '', subject: '' });
  const [customDuration, setCustomDuration] = useState('');

  // UI States
  const [isViewMode, setIsViewMode] = useState(false);
  const [popupMessage, setPopupMessage] = useState({ type: '', message: '' });

  // --- CALENDAR STATE ---
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysOfWeek = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
  // *สำคัญ* ชื่อวันต้องตรงกับที่บันทึกใน Database (schedules)
  const fullDays = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
  
  const thaiMonths = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];

  // Helper: หาวันแรกของเดือน
  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  // Helper: หาจำนวนวันทั้งหมดในเดือน
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  // Helper: เปลี่ยนเดือน
  const changeMonth = (offset) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
  };

  // Helper: แปลง Date -> ID (YYYY-MM-DD)
  const formatDateId = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // Helper: แปลง ID (YYYY-MM-DD) -> ชื่อวันไทย (เช่น 'ศุกร์')
  const getThaiDayNameFromDateStr = (dateStr) => {
    if (!dateStr) return '';
    // แยก string เพื่อสร้าง Date แบบ Local (ป้องกัน timezone เพี้ยน)
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return fullDays[date.getDay()];
  };

  const duration = ['30 นาที', '1 ชั่วโมง', '1.5 ชั่วโมง', '2 ชั่วโมง', '3 ชั่วโมง', 'กำหนดเอง'];

  // --- CORE LOGIC: ดึงเวลาว่างตาม กิจกรรม + วันที่เลือก ---
  const getAvailableTimeSlots = () => {
    // 1. ถ้ายังไม่เลือกกิจกรรม ให้คืนค่าว่าง
    if (!formData.type || formData.type === 'เลือกกิจกรรม') return [];
    
    // 2. ดึง Schedule ทั้งหมดของกิจกรรมนั้น
    const activitySchedules = schedules.filter(s => s.type === formData.type);

    // 3. ถ้ายังไม่เลือกวันที่ ให้คืนค่าว่าง (หรือจะคืนทั้งหมดก็ได้ แต่ UI จะดูยาก)
    if (formData.days.length === 0) return [];

    // 4. แปลงวันที่ที่เลือก (เช่น '2025-12-05') เป็นวันในสัปดาห์ (เช่น 'ศุกร์')
    const selectedDateStr = formData.days[0];
    const targetDayName = getThaiDayNameFromDateStr(selectedDateStr);

    // 5. กรอง Schedule ให้เหลือเฉพาะวันนั้น
    const dailySchedules = activitySchedules.filter(s => s.day === targetDayName);

    // 6. ดึงเฉพาะเวลาออกมาแล้วเรียงลำดับ
    const timeSlots = new Set();
    dailySchedules.forEach(schedule => {
      if (schedule.time) timeSlots.add(schedule.time);
    });
    
    // เรียงเวลาจากน้อยไปมาก
    return Array.from(timeSlots).sort((a, b) => {
        return a.localeCompare(b);
    });
  };
  
  const availableTimeSlots = getAvailableTimeSlots();

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

  // --- HANDLERS ---
  const handleDaySelect = (dayNum) => {
    const selectedDateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNum);
    const dateId = formatDateId(selectedDateObj);

    setFormData(prev => {
      const isSameDate = prev.days.includes(dateId);
      return {
        ...prev,
        days: isSameDate ? [] : [dateId],
        startTime: '' // **สำคัญ** รีเซ็ตเวลาทุกครั้งที่เปลี่ยนวัน
      };
    });
  };

  const handleSave = async () => {
    if (!formData.type || formData.type === 'เลือกกิจกรรม') {
      setPopupMessage({ type: 'error', message: 'กรุณาเลือกกิจกรรม' });
      return;
    }
    if (formData.days.length === 0) {
        setPopupMessage({ type: 'error', message: 'กรุณาเลือกวันที่' });
        return;
    }
    if (!formData.startTime) {
        setPopupMessage({ type: 'error', message: 'กรุณาเลือกเวลา' });
        return;
    }
    setPopupMessage({ type: 'success', message: 'บันทึกข้อมูลสำเร็จ (Mockup)' });
  };

  // --- RENDER HELPERS ---
  const renderCalendarGrid = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDayIndex = getFirstDayOfMonth(currentDate);
    const gridItems = [];

    for (let i = 0; i < firstDayIndex; i++) {
      gridItems.push(<div key={`empty-${i}`} className="user-day-empty"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const currentDayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dateId = formatDateId(currentDayDate);
      const isSelected = formData.days.includes(dateId);
      
      const today = new Date();
      const isToday = day === today.getDate() && 
                      currentDate.getMonth() === today.getMonth() && 
                      currentDate.getFullYear() === today.getFullYear();

      gridItems.push(
        <button
          key={day}
          className={`user-day-btn ${isSelected ? 'active' : ''}`}
          style={{ 
            border: isToday ? '1px solid #f59e0b' : undefined,
            fontWeight: isToday ? 'bold' : undefined 
          }}
          onClick={() => handleDaySelect(day)}
        >
          {day}
        </button>
      );
    }
    return gridItems;
  };

  return (
    <div className="user-schedule-container">
      <div className="user-schedule-wrapper">

        {/* --- HEADER --- */}
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

        {/* --- CONTENT --- */}
        {!isViewMode ? (
          <div className="user-form-card">

            {/* Row 1: Activity Select */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label className="user-section-title" style={{ display: 'block' }}>เลือกกิจกรรม</label>
              <TimeDropdown
                value={formData.type}
                onChange={val => setFormData({ ...formData, type: val, startTime: '', days: [] })} 
                // Reset วันและเวลาเมื่อเปลี่ยนกิจกรรม
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
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {formData.duration === 'กำหนดเอง' && (
                      <input
                        type="text"
                        placeholder="เช่น 45 นาที"
                        className="user-custom-input"
                        value={customDuration}
                        onChange={e => setCustomDuration(e.target.value)}
                        style={{ flex: 1 }}
                      />
                    )}
                    <TimeDropdown
                      className="user-custom-input"
                      value={formData.duration}
                      onChange={val => setFormData({ ...formData, duration: val })}
                      timeOptions={duration}
                      placeholder="เลือกระยะเวลา"
                      style={{ flex: formData.duration === 'กำหนดเอง' ? 1 : 'auto', minWidth: '150px' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Row 3: Grid Layout (Calendar & Time) */}
            <div className="user-grid-layout">

              {/* LEFT: Calendar Panel */}
              <div className="user-gray-panel">
                <div className="user-calendar-header">
                  <span className="user-section-title" style={{ margin: 0 }}>เลือกวันที่</span>
                  <div style={{ display: 'flex', gap: '15px', fontSize: '0.9rem', color: '#4b5563', alignItems: 'center', userSelect: 'none' }}>
                    <span onClick={() => changeMonth(-1)} style={{ cursor: 'pointer', padding: '0 5px', fontWeight: 'bold' }}>&lt;</span>
                    <span style={{ minWidth: '100px', textAlign: 'center' }}>
                      {thaiMonths[currentDate.getMonth()]} {currentDate.getFullYear() + 543}
                    </span>
                    <span onClick={() => changeMonth(1)} style={{ cursor: 'pointer', padding: '0 5px', fontWeight: 'bold' }}>&gt;</span>
                  </div>
                </div>
                <div className="user-calendar-grid">
                  {daysOfWeek.map(d => (<div key={d} className="user-calendar-day-label">{d}</div>))}
                  {renderCalendarGrid()}
                </div>
              </div>

              {/* RIGHT: Time Panel (ส่วนที่แสดงเวลาตามวันที่เลือก) */}
              <div className="user-gray-panel">
                <div className="user-section-title" style={{ marginBottom: '10px' }}>
                    เลือกเวลา {formData.days.length > 0 && `(${getThaiDayNameFromDateStr(formData.days[0])})`}
                </div>
                
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {/* Case 1: ยังไม่ได้เลือกกิจกรรม */}
                  {(!formData.type || formData.type === 'เลือกกิจกรรม') ? (
                     <div style={{ color: '#9ca3af', fontSize: '0.9rem', width: '100%', textAlign: 'center', padding: '20px' }}>
                        กรุณาเลือกประเภทกิจกรรมด้านบนก่อน
                     </div>
                  ) : 
                  /* Case 2: เลือกกิจกรรมแล้ว แต่ยังไม่เลือกวันที่ */
                  formData.days.length === 0 ? (
                    <div style={{ color: '#9ca3af', fontSize: '0.9rem', width: '100%', textAlign: 'center', padding: '20px' }}>
                        <p>กรุณาเลือกวันที่จากปฏิทิน</p>
                        <p style={{fontSize: '0.8em'}}>เพื่อดูเวลาว่างของวันนั้นๆ</p>
                    </div>
                  ) : 
                  /* Case 3: เลือกครบแล้ว มีเวลาแสดง */
                  availableTimeSlots.length > 0 ? (
                    availableTimeSlots.map((slot, idx) => (
                      <button
                        key={idx}
                        onClick={() => setFormData(prev => ({ ...prev, startTime: slot, endTime: '' }))}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '6px',
                          border: '1px solid #3b82f6',
                          backgroundColor: formData.startTime === slot ? '#3b82f6' : 'white',
                          color: formData.startTime === slot ? 'white' : '#3b82f6',
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                          fontWeight: '500',
                          transition: 'all 0.2s',
                          minWidth: '80px',
                          textAlign: 'center'
                        }}
                        onMouseOver={(e) => { e.target.style.backgroundColor = formData.startTime === slot ? '#2563eb' : '#eff6ff'; }}
                        onMouseOut={(e) => { e.target.style.backgroundColor = formData.startTime === slot ? '#3b82f6' : 'white'; }}
                      >
                        {slot}
                      </button>
                    ))
                  ) : (
                    /* Case 4: เลือกครบแล้ว แต่ไม่มีเวลาว่างในวันนั้น */
                    <div style={{ color: '#ef4444', fontSize: '0.9rem', width: '100%', textAlign: 'center', padding: '20px', backgroundColor: '#fee2e2', borderRadius: '8px' }}>
                      ไม่มีรอบเวลาว่างสำหรับวัน{getThaiDayNameFromDateStr(formData.days[0])}
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* FOOTER */}
            <div className="user-action-footer">
              <button className="btn-confirm" onClick={handleSave}>ยืนยันการจอง</button>
            </div>

          </div>
        ) : (
          <div className="user-form-card">
            <h2 className="user-section-title">รายการนัดหมายทั้งหมด</h2>
            <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>ส่วนแสดงผลรายการ (List View)</div>
          </div>
        )}

      </div>
      {popupMessage.type === 'success' && <PopupModal message={popupMessage.message} onClose={() => setPopupMessage({ type: '', message: '' })} />}
      {popupMessage.type === 'error' && <ErrorPopup message={popupMessage.message} onClose={() => setPopupMessage({ type: '', message: '' })} />}
    </div>
  );
};

export default User;