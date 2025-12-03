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

  // Form State
  const [formData, setFormData] = useState({ type: '', days: [], startTime: '', endTime: '', duration: '', subject: '' });
  const [customDuration, setCustomDuration] = useState('');

  // UI States
  const [isViewMode, setIsViewMode] = useState(false);
  const [popupMessage, setPopupMessage] = useState({ type: '', message: '' });

  // --- CALENDAR STATE ---
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysOfWeek = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
  const fullDays = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
  
  const thaiMonths = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];

  // Helper Functions
  const getFirstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const changeMonth = (offset) => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
  
  const formatDateId = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const getThaiDayNameFromDateStr = (dateStr) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return fullDays[date.getDay()];
  };

  const duration = ['30 นาที', '1 ชั่วโมง', '1.5 ชั่วโมง', '2 ชั่วโมง', '3 ชั่วโมง', 'กำหนดเอง'];

  // --- CORE LOGIC ---
  const getAvailableTimeSlots = () => {
    if (!formData.type || formData.type === 'เลือกกิจกรรม') return [];
    const activitySchedules = schedules.filter(s => s.type === formData.type);
    if (formData.days.length === 0) return [];

    const selectedDateStr = formData.days[0];
    const targetDayName = getThaiDayNameFromDateStr(selectedDateStr);
    const dailySchedules = activitySchedules.filter(s => s.day === targetDayName);

    const timeSlots = new Set();
    dailySchedules.forEach(schedule => {
      if (schedule.time) timeSlots.add(schedule.time);
    });
    
    return Array.from(timeSlots).sort((a, b) => a.localeCompare(b));
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
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDateObj < today) return; 

    const dateId = formatDateId(selectedDateObj);

    setFormData(prev => {
      const isSameDate = prev.days.includes(dateId);
      return {
        ...prev,
        days: isSameDate ? [] : [dateId],
        startTime: '' 
      };
    });
  };

  // --- ส่วนที่แก้ไข: เพิ่ม Validation เช็คความครบถ้วน ---
  const handleSave = async () => {
    // 1. เช็คกิจกรรม
    if (!formData.type || formData.type === 'เลือกกิจกรรม') {
      setPopupMessage({ type: 'error', message: 'กรุณาเลือกประเภทกิจกรรม' });
      return;
    }

    // 2. เช็คหัวข้อการประชุม (Subject)
    if (!formData.subject || formData.subject.trim() === '') {
        setPopupMessage({ type: 'error', message: 'กรุณากรอกหัวข้อการประชุม' });
        return;
    }

    // 3. เช็คระยะเวลา (Duration)
    const finalDuration = formData.duration === 'กำหนดเอง' ? customDuration : formData.duration;
    if (!finalDuration || finalDuration.trim() === '') {
        setPopupMessage({ type: 'error', message: 'กรุณาระบุระยะเวลา' });
        return;
    }

    // 4. เช็ควันที่ (Date)
    if (formData.days.length === 0) {
        setPopupMessage({ type: 'error', message: 'กรุณาเลือกวันที่จากปฏิทิน' });
        return;
    }

    // 5. เช็คเวลา (Time)
    if (!formData.startTime) {
        setPopupMessage({ type: 'error', message: 'กรุณาเลือกเวลาที่ต้องการจอง' });
        return;
    }

    // ผ่านทุกเงื่อนไข -> บันทึก
    // (ตรงนี้คุณสามารถใส่โค้ดบันทึกลง Firebase จริงๆ ได้เลย)
    setPopupMessage({ type: 'success', message: 'บันทึกข้อมูลสำเร็จ (Mockup)' });
  };

  // --- RENDER HELPERS ---
  const renderCalendarGrid = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDayIndex = getFirstDayOfMonth(currentDate);
    const gridItems = [];
    const todayObj = new Date();
    todayObj.setHours(0, 0, 0, 0);

    for (let i = 0; i < firstDayIndex; i++) {
      gridItems.push(<div key={`empty-${i}`} className="user-day-empty"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const currentDayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dateId = formatDateId(currentDayDate);
      const isSelected = formData.days.includes(dateId);
      const isPast = currentDayDate < todayObj;
      const isToday = currentDayDate.getTime() === todayObj.getTime();

      gridItems.push(
        <button
          key={day}
          disabled={isPast}
          className={`user-day-btn ${isSelected ? 'active' : ''}`}
          style={{ 
            border: isToday ? '1px solid #f59e0b' : undefined,
            fontWeight: isToday ? 'bold' : undefined,
            opacity: isPast ? 0.3 : 1,
            cursor: isPast ? 'not-allowed' : 'pointer',
            backgroundColor: isPast ? '#f3f4f6' : undefined,
            color: isPast ? '#9ca3af' : undefined
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
            <div className="user-section-title-Activity" style={{ marginBottom: '1.5rem' }}>
              <label className="user-section-title" style={{ display: 'block' }}>เลือกกิจกรรม</label>
              <TimeDropdown
                className="user-custom-input"
                value={formData.type}
                onChange={val => setFormData({ ...formData, type: val, startTime: '', days: [] })} 
                timeOptions={types.filter(t => t !== 'เลือกกิจกรรม')}
                placeholder="เลือกกิจกรรม"
                style={{ width: '100%', maxWidth: '350px!important' }} 
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
                      style={{ 
                        flex: formData.duration === 'กำหนดเอง' ? 1 : 'auto', 
                        width: '140px', 
                        minWidth: 'auto' 
                      }}
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

              {/* RIGHT: Time Panel */}
              <div className="user-gray-panel">
                <div className="user-section-title" style={{ marginBottom: '10px' }}>
                    เลือกเวลา {formData.days.length > 0 && `(${getThaiDayNameFromDateStr(formData.days[0])})`}
                </div>
                
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {(!formData.type || formData.type === 'เลือกกิจกรรม') ? (
                     <div style={{ color: '#9ca3af', fontSize: '0.9rem', width: '100%', textAlign: 'center', padding: '20px' }}>
                        กรุณาเลือกประเภทกิจกรรมด้านบนก่อน
                     </div>
                  ) : formData.days.length === 0 ? (
                    <div style={{ color: '#9ca3af', fontSize: '0.9rem', width: '100%', textAlign: 'center', padding: '20px' }}>
                        <p>กรุณาเลือกวันที่จากปฏิทิน</p>
                        <p style={{fontSize: '0.8em'}}>เพื่อดูเวลาว่างของวันนั้นๆ</p>
                    </div>
                  ) : availableTimeSlots.length > 0 ? (
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