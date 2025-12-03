import React, { useState, useEffect } from 'react';
import './User.css';
import TimeDropdown from "../components/AdminDropdown";
import PopupModal from "../components/PopupModal";
import ErrorPopup from "../components/ErrorPopup";
import {
  subscribeSchedules,
  subscribeActivityTypes,
} from '../firebase';

// --- ICONS (SVG) ---
const CalendarIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
);
const ClockIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
);
const FileTextIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
);
const UserIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
);
const MonitorIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
);
const MapPinIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
);

const User = () => {
  // --- STATES ---
  const [schedules, setSchedules] = useState([]);
  const [types, setTypes] = useState(['เลือกกิจกรรม']);
  const [activityTypes, setActivityTypes] = useState([]);

  // Form State Updated
  const [formData, setFormData] = useState({ 
    type: '', 
    days: [], 
    startTime: '', 
    endTime: '', 
    duration: '', 
    subject: '',
    meetingFormat: 'Online', // 'Online' or 'On-site'
    location: '', // ใช้เก็บ Link หรือ สถานที่
    description: '' // รายละเอียดเพิ่มเติม
  });
  const [customDuration, setCustomDuration] = useState('');

  // UI States
  const [isViewMode, setIsViewMode] = useState(false);
  const [popupMessage, setPopupMessage] = useState({ type: '', message: '' });

  // --- CALENDAR STATE ---
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysOfWeek = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
  const fullDays = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
  const thaiMonths = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน','กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
  const duration = ['30 นาที', '1 ชั่วโมง', '1.5 ชั่วโมง', '2 ชั่วโมง', '3 ชั่วโมง', 'กำหนดเอง'];

  // --- HELPER FUNCTIONS ---
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

  // Helper: Format Date for Display (26 พฤศจิกายน 2025)
  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return '-';
    const [y, m, d] = dateStr.split('-').map(Number);
    return `${d} ${thaiMonths[m-1]} ${y + 543}`;
  };

  // Helper: Calculate End Time based on Start Time + Duration
  const calculateEndTime = (startTime, durationStr) => {
    if (!startTime || !durationStr) return '';
    
    let minutesToAdd = 0;
    if (durationStr === '30 นาที') minutesToAdd = 30;
    else if (durationStr === '1 ชั่วโมง') minutesToAdd = 60;
    else if (durationStr === '1.5 ชั่วโมง') minutesToAdd = 90;
    else if (durationStr === '2 ชั่วโมง') minutesToAdd = 120;
    else if (durationStr === '3 ชั่วโมง') minutesToAdd = 180;
    else if (durationStr === 'กำหนดเอง') minutesToAdd = parseInt(customDuration) || 0;
    else {
        // พยายาม Parse เช่น "45 นาที"
        const cleanStr = durationStr.replace(/\D/g, '');
        minutesToAdd = parseInt(cleanStr) || 0;
    }

    const [startH, startM] = startTime.split(/[.:]/).map(Number);
    const date = new Date();
    date.setHours(startH, startM + minutesToAdd);
    
    const endH = String(date.getHours()).padStart(2, '0');
    const endM = String(date.getMinutes()).padStart(2, '0');
    return `${startTime}-${endH}:${endM}`;
  };

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
      return { ...prev, days: isSameDate ? [] : [dateId], startTime: '' };
    });
  };

  const handleSave = async () => {
    // Validation
    if (!formData.type || formData.type === 'เลือกกิจกรรม') { setPopupMessage({ type: 'error', message: 'กรุณาเลือกประเภทกิจกรรม' }); return; }
    if (!formData.subject || formData.subject.trim() === '') { setPopupMessage({ type: 'error', message: 'กรุณากรอกหัวข้อการประชุม' }); return; }
    
    const finalDuration = formData.duration === 'กำหนดเอง' ? customDuration : formData.duration;
    if (!finalDuration || finalDuration.trim() === '') { setPopupMessage({ type: 'error', message: 'กรุณาระบุระยะเวลา' }); return; }
    
    if (formData.days.length === 0) { setPopupMessage({ type: 'error', message: 'กรุณาเลือกวันที่จากปฏิทิน' }); return; }
    if (!formData.startTime) { setPopupMessage({ type: 'error', message: 'กรุณาเลือกเวลาที่ต้องการจอง' }); return; }

    // New Validation
    if (formData.meetingFormat === 'Online' && (!formData.location || formData.location.trim() === '')) {
       setPopupMessage({ type: 'error', message: 'กรุณากรอกลิงก์การประชุม' }); return;
    }
    if (formData.meetingFormat === 'On-site' && (!formData.location || formData.location.trim() === '')) {
       setPopupMessage({ type: 'error', message: 'กรุณาระบุสถานที่' }); return;
    }

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
            border: isToday ? '2px solid #8fdaffff' : undefined,
            // fontWeight: isToday ? 'bold' : undefined,
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
            <div className="user-header-icon-box"><CalendarIcon /></div>
            <div className="user-header-info">
              <h1>Book an Appointment</h1>
              <p>{isViewMode ? 'รายการจองนัดหมาย' : 'จองตารางนัดหมาย'}</p>
            </div>
          </div>
          <button className="user-header-btn-back" onClick={() => setIsViewMode(!isViewMode)}>
            {isViewMode ? '+ จองเพิ่ม' : 'ดูรายการจองนัดหมาย'}
          </button>
        </div>

        {/* --- CONTENT --- */}
        {!isViewMode ? (
          <div className="user-form-card">

            {/* Row 1: Activity & Subject */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label className="user-section-title">เลือกกิจกรรม</label>
              <TimeDropdown
                value={formData.type}
                onChange={val => setFormData({ ...formData, type: val, startTime: '', days: [] })} 
                timeOptions={types.filter(t => t !== 'เลือกกิจกรรม')}
                placeholder="เลือกประเภทกิจกรรม"
                style={{ width: '100%', maxWidth: '350px' }} 
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label className="user-section-title">รายละเอียดการนัดหมาย</label>
              <div className="flex gap-4" style={{ flexWrap: 'wrap' }}>
                <div style={{ flex: 2, minWidth: '250px' }}>
                  <label className="text-sm text-gray-600 mb-1 block">หัวข้อการประชุม (Subject) <span className="text-red-500">*</span></label>
                  <input type="text" placeholder="เช่น ประชุมสรุปงานออกแบบ UX" className="user-custom-input"
                    value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })}
                  />
                </div>
                <div style={{ flex: 1, minWidth: '150px' }}>
                  <label className="text-sm text-gray-600 mb-1 block">ระยะเวลา (Duration) <span className="text-red-500">*</span></label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {formData.duration === 'กำหนดเอง' && (
                      <input type="text" placeholder="45 นาที" className="user-custom-input" style={{ flex: 1 }}
                        value={customDuration} onChange={e => setCustomDuration(e.target.value)}
                      />
                    )}
                    <TimeDropdown
                      value={formData.duration} onChange={val => setFormData({ ...formData, duration: val })}
                      timeOptions={duration} placeholder="ระยะเวลา"
                      style={{ flex: formData.duration === 'กำหนดเอง' ? 1 : 'auto', width: '140px', minWidth: 'auto' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Row 2: Grid Layout (Calendar & Time) */}
            <div className="user-grid-layout" style={{ marginBottom: '2rem' }}>
              {/* Calendar */}
              <div className="user-gray-panel">
                <div className="user-calendar-header">
                  <span className="user-section-title" style={{ margin: 0 }}>เลือกวันที่</span>
                  <div style={{ display: 'flex', gap: '15px', fontSize: '0.9rem', color: '#4b5563', alignItems: 'center' }}>
                    <span onClick={() => changeMonth(-1)} style={{ cursor: 'pointer', padding: '0 5px', fontWeight: 'bold' }}>&lt;</span>
                    <span style={{ minWidth: '100px', textAlign: 'center' }}>{thaiMonths[currentDate.getMonth()]} {currentDate.getFullYear() + 543}</span>
                    <span onClick={() => changeMonth(1)} style={{ cursor: 'pointer', padding: '0 5px', fontWeight: 'bold' }}>&gt;</span>
                  </div>
                </div>
                <div className="user-calendar-grid">
                  {daysOfWeek.map(d => (<div key={d} className="user-calendar-day-label">{d}</div>))}
                  {renderCalendarGrid()}
                </div>
              </div>

              {/* Time Slots */}
              <div className="user-gray-panel">
                <div className="user-section-title" style={{ marginBottom: '10px' }}>เลือกเวลา</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {(!formData.type || formData.type === 'เลือกกิจกรรม') ? (
                     <div className="text-gray-400 text-sm w-full text-center p-5">กรุณาเลือกประเภทกิจกรรมก่อน</div>
                  ) : formData.days.length === 0 ? (
                    <div className="text-gray-400 text-sm w-full text-center p-5">กรุณาเลือกวันที่จากปฏิทิน</div>
                  ) : availableTimeSlots.length > 0 ? (
                    availableTimeSlots.map((slot, idx) => (
                      <button key={idx}
                        onClick={() => setFormData(prev => ({ ...prev, startTime: slot, endTime: '' }))}
                        className={`px-4 py-2 rounded-md border text-sm font-medium transition-all ${
                            formData.startTime === slot ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-blue-500 border-blue-400 hover:bg-blue-50'
                        }`}
                        style={{ minWidth: '80px' }}
                      >
                        {slot}
                      </button>
                    ))
                  ) : (
                    <div className="text-red-500 text-sm w-full text-center p-5 bg-red-50 rounded">ไม่มีรอบเวลาว่าง</div>
                  )}
                </div>
              </div>
            </div>

            {/* --- NEW SECTION: Bottom Layout (Format & Summary) --- */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'flex-start' }}>
                
                {/* LEFT: Meeting Format Form */}
                <div style={{ flex: 1, minWidth: '300px' }}>
                    <h3 className="user-section-title" style={{ marginBottom: '15px' }}>รูปแบบการประชุม</h3>
                    
                    {/* Toggle Buttons */}
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                        <button 
                            className={`px-4 py-2 rounded-md border text-sm font-medium transition-all flex-1 ${
                                formData.meetingFormat === 'Online' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                            }`}
                            onClick={() => setFormData({...formData, meetingFormat: 'Online', location: ''})}
                        >
                            Online
                        </button>
                        <button 
                            className={`px-4 py-2 rounded-md border text-sm font-medium transition-all flex-1 ${
                                formData.meetingFormat === 'On-site' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                            }`}
                            onClick={() => setFormData({...formData, meetingFormat: 'On-site', location: ''})}
                        >
                            On-site
                        </button>
                    </div>

                    {/* Conditional Input */}
                    <div style={{ marginBottom: '15px' }}>
                        <label className="text-sm text-gray-600 mb-1 block">
                            {formData.meetingFormat === 'Online' ? 'ลิงก์ประชุมออนไลน์' : 'สถานที่นัดหมาย'} <span className="text-red-500">*</span>
                        </label>
                        <input 
                            type="text" 
                            className="user-custom-input" 
                            style={{ width: '100%' }}
                            placeholder={formData.meetingFormat === 'Online' ? "วางลิงก์ Google Meet / Zoom / Teams" : "ระบุชื่อห้องประชุม หรือ สถานที่"}
                            value={formData.location}
                            onChange={e => setFormData({...formData, location: e.target.value})}
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="text-sm text-gray-600 mb-1 block">รายละเอียดเพิ่มเติม <span className="text-red-500">*</span></label>
                        <textarea 
                            className="user-custom-input" 
                            style={{ width: '100%', height: '100px', resize: 'none' }}
                            placeholder="ระบุรายละเอียดเพิ่มเติม..."
                            value={formData.description}
                            onChange={e => setFormData({...formData, description: e.target.value})}
                        />
                    </div>
                </div>

                {/* RIGHT: Booking Summary Box */}
                <div style={{ flex: 1, minWidth: '300px', backgroundColor: '#e0f2fe', borderRadius: '12px', padding: '20px', border: '1px solid #bae6fd' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0369a1', fontWeight: 'bold', marginBottom: '15px', fontSize: '1.1rem' }}>
                        <FileTextIcon /> สรุปการจอง
                    </h3>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px 10px' }}>
                        
                        {/* Activity */}
                        <div>
                            <p style={{ fontSize: '0.8rem', color: '#64748b' }}>กิจกรรม</p>
                            <p style={{ fontWeight: '600', color: '#334155' }}>{formData.type || '-'}</p>
                        </div>

                        {/* Date */}
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', color: '#64748b' }}>
                                <CalendarIcon style={{width:'14px'}}/> วันที่
                            </div>
                            <p style={{ fontWeight: '600', color: '#334155' }}>
                                {formData.days.length > 0 ? formatDisplayDate(formData.days[0]) : '-'}
                            </p>
                        </div>

                        {/* Subject */}
                        <div style={{ gridColumn: 'span 2' }}>
                             <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', color: '#64748b' }}>
                                <FileTextIcon style={{width:'14px'}}/> หัวข้อ
                            </div>
                            <p style={{ fontWeight: '600', color: '#334155' }}>{formData.subject || '-'}</p>
                        </div>

                        {/* Duration */}
                        <div>
                             <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', color: '#64748b' }}>
                                <ClockIcon style={{width:'14px'}}/> ระยะเวลา
                            </div>
                            <p style={{ fontWeight: '600', color: '#334155' }}>
                                {formData.duration === 'กำหนดเอง' ? `${customDuration} (กำหนดเอง)` : (formData.duration || '-')}
                            </p>
                        </div>

                        {/* Time */}
                        <div>
                             <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', color: '#64748b' }}>
                                <ClockIcon style={{width:'14px'}}/> เวลา
                            </div>
                            <p style={{ fontWeight: '600', color: '#334155' }}>
                                {formData.startTime 
                                    ? calculateEndTime(formData.startTime, formData.duration === 'กำหนดเอง' ? customDuration : formData.duration) + ' น.' 
                                    : '-'
                                }
                            </p>
                        </div>

                        {/* Format */}
                        <div style={{ gridColumn: 'span 2' }}>
                             <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', color: '#64748b' }}>
                                {formData.meetingFormat === 'Online' ? <MonitorIcon style={{width:'14px'}}/> : <MapPinIcon style={{width:'14px'}}/>} รูปแบบ
                            </div>
                            <p style={{ fontWeight: '600', color: '#334155' }}>
                                {formData.meetingFormat}
                            </p>
                        </div>
                    </div>

                </div>
            </div>

            {/* FOOTER */}
            <div className="user-action-footer" style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center' }}>
              <button className="btn-confirm" onClick={handleSave} style={{ minWidth: '200px', fontSize: '1rem', padding: '12px' }}>
                ยืนยันการจอง
              </button>
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