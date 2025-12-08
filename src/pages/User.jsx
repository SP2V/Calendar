import React, { useState, useEffect } from 'react';
import './User.css';
import TimeDropdown from "../components/AdminDropdown";
import PopupModal from "../components/PopupModal";
import ErrorPopup from "../components/ErrorPopup";
import BookingPreviewModal from "../components/BookingPreviewModal";
import {
  subscribeSchedules,
  subscribeActivityTypes,
  addBooking,
} from '../services/firebase';
import { createCalendarEvent, getCalendarEvents } from '../services/calendarService';

// --- ICONS (SVG) ---
const CalendarIcon = ({ style }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
);
const ClockIcon = ({ style }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
);
const FileTextIcon = ({ style }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
);
const MonitorIcon = ({ style }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
);
const MapPinIcon = ({ style }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
);

const User = () => {
  // --- STATES ---
  const [schedules, setSchedules] = useState([]);
  const [types, setTypes] = useState(['เลือกกิจกรรม']);
  const [activityTypes, setActivityTypes] = useState([]);

  // Form State
  const [formData, setFormData] = useState({
    type: '',
    days: [],
    startTime: '',
    endTime: '',
    duration: '',
    subject: '',
    meetingFormat: 'Online',
    location: '',
    description: ''
  });
  const [customDuration, setCustomDuration] = useState('');
  const [calendarEvents, setCalendarEvents] = useState([]); // New state for events
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // UI States
  const [isViewMode, setIsViewMode] = useState(false);
  const [popupMessage, setPopupMessage] = useState({ type: '', message: '' });
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysOfWeek = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
  const fullDays = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
  const thaiMonths = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
  const duration = ['30 นาที', '1 ชั่วโมง', '1.5 ชั่วโมง', '2 ชั่วโมง', '3 ชั่วโมง', 'กำหนดเอง'];
  // เพิ่มจุด (.) ให้ตรงกับ Database
  const dayAbbreviations = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];

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
    return dayAbbreviations[date.getDay()];
  };

  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return '-';
    const [y, m, d] = dateStr.split('-').map(Number);
    return `${d} ${thaiMonths[m - 1]} ${y + 543}`;
  };

  // --- NEW LOGIC: Time & Duration Helpers ---

  // ฟังก์ชันแปลงข้อความระยะเวลาเป็นตัวเลขนาที (ใช้ร่วมกันหลายที่)
  const getDurationInMinutes = (durationStr, customVal) => {
    if (!durationStr) return 0;
    if (durationStr === '30 นาที') return 30;
    if (durationStr === '1 ชั่วโมง') return 60;
    if (durationStr === '1.5 ชั่วโมง') return 90;
    if (durationStr === '2 ชั่วโมง') return 120;
    if (durationStr === '3 ชั่วโมง') return 180;
    if (durationStr === 'กำหนดเอง') return parseInt(customVal) || 0;

    const cleanStr = durationStr.replace(/\D/g, '');
    return parseInt(cleanStr) || 0;
  };

  // แปลงนาที (นับจากเที่ยงคืน) กลับเป็นเวลา HH:MM
  const minutesToTimeStr = (minutes) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  // แปลงเวลา HH:MM เป็นนาที
  const timeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    // เผื่อกรณีมีขีดติดมา ตัดเอาเฉพาะเวลาตัวแรก
    const cleanTime = timeStr.includes('-') ? timeStr.split('-')[0].trim() : timeStr;
    const [hours, minutes] = cleanTime.split(':').map(Number);
    return (hours * 60) + (minutes || 0);
  };

  const calculateEndTime = (startTime, durationStr) => {
    if (!startTime || !durationStr) return '';
    const minsToAdd = getDurationInMinutes(durationStr, customDuration);
    const [startH, startM] = startTime.split(/[.:]/).map(Number);
    if (isNaN(startH)) return startTime;

    const totalMins = (startH * 60) + startM + minsToAdd;
    return `${startTime}-${minutesToTimeStr(totalMins)}`;
  };

  // --- CORE LOGIC: Generate Time Slots ---
  const getAvailableTimeSlots = () => {
    if (!formData.type || formData.type === 'เลือกกิจกรรม') return [];
    if (formData.days.length === 0) return [];

    const selectedDateStr = formData.days[0];
    const targetDayName = getThaiDayNameFromDateStr(selectedDateStr);

    // 1. ดึง Schedule ที่ตรงกับวันและประเภท
    const matchingSchedules = schedules.filter(schedule =>
      schedule.type === formData.type &&
      schedule.day === targetDayName &&
      schedule.time
    );

    // 2. ดึง Duration ของผู้ใช้มาเตรียมคำนวณ
    const userDurationMins = getDurationInMinutes(formData.duration, customDuration);
    // ถ้ายังไม่เลือก Duration ให้ใช้ค่า Default 60 นาทีในการแสดงผลไปก่อน (หรือจะใช้ 30 ก็ได้)
    const durationCheck = userDurationMins > 0 ? userDurationMins : 60;

    const generatedSlots = new Set();

    matchingSchedules.forEach(sch => {
      const timeStr = sch.time;

      if (timeStr.includes('-')) {
        // กรณีเป็นช่วงเวลา เช่น "19:00 - 22:00"
        const [startStr, endStr] = timeStr.split('-').map(s => s.trim());

        let currentMins = timeToMinutes(startStr);
        const endMins = timeToMinutes(endStr);

        // Loop สร้างปุ่มเวลา โดยขยับทีละ 30 นาที (Interval)
        const STEP_INTERVAL = 30;

        while (currentMins + durationCheck <= endMins) {
          generatedSlots.add(minutesToTimeStr(currentMins));
          currentMins += STEP_INTERVAL;
        }

      } else {
        // กรณีเป็นเวลาเดี่ยว เช่น "19:00" ก็ใส่ไปเลย
        generatedSlots.add(timeStr);
      }
    });

    // แปลงกลับเป็น Array และเรียงลำดับ
    return Array.from(generatedSlots).sort((a, b) => timeToMinutes(a) - timeToMinutes(b));
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

  // Fetch events when switching to View Mode
  useEffect(() => {
    if (isViewMode) {
      const fetchEvents = async () => {
        try {
          const events = await getCalendarEvents();
          setCalendarEvents(events);
        } catch (error) {
          console.error("Failed to fetch events", error);
        }
      };
      fetchEvents();
    }
  }, [isViewMode]);

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

  const handleReview = () => {
    if (!formData.type || formData.type === 'เลือกกิจกรรม') { setPopupMessage({ type: 'error', message: 'กรุณาเลือกประเภทกิจกรรม' }); return; }
    if (!formData.subject || formData.subject.trim() === '') { setPopupMessage({ type: 'error', message: 'กรุณากรอกหัวข้อการประชุม' }); return; }
    const finalDuration = formData.duration === 'กำหนดเอง' ? customDuration : formData.duration;
    if (!finalDuration || finalDuration.trim() === '') { setPopupMessage({ type: 'error', message: 'กรุณาระบุระยะเวลา' }); return; }
    if (formData.days.length === 0) { setPopupMessage({ type: 'error', message: 'กรุณาเลือกวันที่จากปฏิทิน' }); return; }
    if (!formData.startTime) { setPopupMessage({ type: 'error', message: 'กรุณาเลือกเวลาที่ต้องการจอง' }); return; }
    if (formData.meetingFormat === 'Online' && (!formData.location || formData.location.trim() === '')) { setPopupMessage({ type: 'error', message: 'กรุณากรอกลิงก์การประชุม' }); return; }
    if (formData.meetingFormat === 'On-site' && (!formData.location || formData.location.trim() === '')) { setPopupMessage({ type: 'error', message: 'กรุณาระบุสถานที่' }); return; }

    setShowPreviewModal(true);
  };

  const handleConfirmBooking = async () => {
    setShowPreviewModal(false);

    // --- Google Calendar Integration ---
    try {
      const dateStr = formData.days[0];
      const timeStr = formData.startTime;
      const [year, month, day] = dateStr.split('-').map(Number);
      const [hour, minute] = timeStr.split(':').map(Number);

      const startDateTime = new Date(year, month - 1, day, hour, minute);

      const durationMins = getDurationInMinutes(formData.duration, customDuration);
      const endDateTime = new Date(startDateTime.getTime() + durationMins * 60000);

      const eventPayload = {
        title: `[${formData.type}] ${formData.subject}`,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        description: `รายละเอียด: ${formData.description || '-'}\nรูปแบบ: ${formData.meetingFormat}`,
        location: formData.location
      };

      setPopupMessage({ type: 'success', message: 'กำลังบันทึก...' });

      const result = await createCalendarEvent(eventPayload);

      if (result.status === 'success') {
        // Save to Firestore
        await addBooking({
          ...eventPayload,
          googleCalendarEventId: result.eventId || null,
          status: 'confirmed'
        });

        setPopupMessage({ type: 'success', message: 'จองนัดหมายและบันทึกลงปฏิทินเรียบร้อยแล้ว' });

        // Clear form
        setFormData({
          type: '',
          days: [],
          startTime: '',
          endTime: '',
          duration: '',
          subject: '',
          meetingFormat: 'Online',
          location: '',
          description: ''
        });
        setCustomDuration('');
      } else {
        throw new Error(result.message || 'Unknown error');
      }

    } catch (error) {
      console.error("Calendar Error:", error);
      setPopupMessage({ type: 'error', message: `เชื่อมต่อไม่ได้: ${error.message}` });
    }
  };

  // --- RENDER HELPERS ---
  const renderCalendarGrid = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDayIndex = getFirstDayOfMonth(currentDate);
    const gridItems = [];
    const todayObj = new Date();
    todayObj.setHours(0, 0, 0, 0);

    for (let i = 0; i < firstDayIndex; i++) { gridItems.push(<div key={`empty-${i}`} className="user-day-empty"></div>); }

    for (let day = 1; day <= daysInMonth; day++) {
      const currentDayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dateId = formatDateId(currentDayDate);
      const isSelected = formData.days.includes(dateId);
      const isPast = currentDayDate < todayObj;
      const isToday = currentDayDate.getTime() === todayObj.getTime();

      let btnClass = 'user-day-btn';
      if (isSelected) btnClass += ' active';
      if (isToday) btnClass += ' today';

      gridItems.push(
        <button key={day} disabled={isPast} className={btnClass} onClick={() => handleDaySelect(day)}>
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
            {isViewMode ? '+ เพิ่มรายการ' : 'รายการนัดหมายของฉัน'}
          </button>
        </div>

        {/* --- CONTENT --- */}
        {!isViewMode ? (
          <div className="user-form-card">

            {/* Row 1: Activity */}
            <div className="form-section-Activity">
              <label className="user-section-title">เลือกกิจกรรม</label>
              <TimeDropdown
                className="dropdown-full"
                value={formData.type}
                onChange={val => setFormData({ ...formData, type: val, startTime: '', days: [] })}
                timeOptions={types.filter(t => t !== 'เลือกกิจกรรม')}
                placeholder="เลือกกิจกรรม"
              />
            </div>

            {/* Row 2: Details */}
            <div className="form-section">
              <label className="user-section-title">รายละเอียดการนัดหมาย</label>
              <div className="flex-row-wrap">
                <div className="col-2">
                  <label className="input-label">หัวข้อการประชุม (Subject) <span className="required">*</span></label>
                  <input type="text" placeholder="เช่น ประชุมสรุปงานออกแบบ UX" className="user-custom-input"
                    value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })} />
                </div>
                <div className="col-1">
                  <label className="input-label">ระยะเวลา (Duration) <span className="required">*</span></label>
                  <div className="duration-group">
                    {formData.duration === 'กำหนดเอง' && (
                      <input type="text" placeholder="เช่น 45 นาที" className="user-custom-input" style={{ flex: 1 }}
                        value={customDuration} onChange={e => setCustomDuration(e.target.value)} />
                    )}
                    <TimeDropdown
                      className="dropdown-time"
                      value={formData.duration} onChange={val => setFormData({ ...formData, duration: val })}
                      timeOptions={duration} placeholder="ระยะเวลา"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Row 3: Grid Layout (Calendar & Time) */}
            <div className="user-grid-layout">
              {/* Calendar Panel */}
              <div className="user-gray-panel">
                <div className="user-calendar-header">
                  <span className="user-section-title" style={{ margin: 0 }}>เลือกวันที่</span>
                  <div className="calendar-nav">
                    <span className="nav-btn" onClick={() => changeMonth(-1)}>&lt;</span>
                    <span className="nav-month">{thaiMonths[currentDate.getMonth()]} {currentDate.getFullYear() + 543}</span>
                    <span className="nav-btn" onClick={() => changeMonth(1)}>&gt;</span>
                  </div>
                </div>
                <div className="user-calendar-grid">
                  {daysOfWeek.map(d => (<div key={d} className="user-calendar-day-label">{d}</div>))}
                  {renderCalendarGrid()}
                </div>
              </div>

              {/* Time Panel */}
              <div className="user-gray-panel">
                <div className="user-section-title" style={{ marginBottom: '10px' }}>เลือกเวลา</div>
                <div className="time-slot-container">
                  {(!formData.type || formData.type === 'เลือกกิจกรรม') ?
                    <div className="empty-state-text">กรุณาเลือกประเภทกิจกรรมก่อน</div>
                    : (!formData.duration) ?
                      <div className="empty-state-text">กรุณาระบุระยะเวลาก่อน</div>
                      : formData.days.length === 0 ?
                        <div className="empty-state-text">กรุณาเลือกวันที่จากปฏิทิน</div>
                        : availableTimeSlots.length > 0 ?
                          availableTimeSlots.map((slot, idx) => (
                            <button key={idx}
                              onClick={() => setFormData(prev => ({ ...prev, startTime: slot, endTime: '' }))}
                              className={`time-btn ${formData.startTime === slot ? 'active' : ''}`}
                            >
                              {slot}
                            </button>
                          ))
                          : <div className="error-state-box">ไม่มีรอบเวลาว่าง</div>}
                </div>
              </div>
            </div>
            <div className="bottom-layout">

              {/* LEFT: Format & Input */}
              <div className="format-section">
                <h3 className="user-section-title">รูปแบบการประชุม</h3>

                <div className="toggle-container">
                  <button
                    className={`toggle-btn ${formData.meetingFormat === 'Online' ? 'active' : ''}`}
                    onClick={() => setFormData({ ...formData, meetingFormat: 'Online', location: '' })}
                  >
                    <MonitorIcon /> Online
                  </button>
                  <button
                    className={`toggle-btn ${formData.meetingFormat === 'On-site' ? 'active' : ''}`}
                    onClick={() => setFormData({ ...formData, meetingFormat: 'On-site', location: '' })}
                  >
                    <MapPinIcon /> On-site
                  </button>
                </div>

                <div className="input-group">
                  <label className="input-label">
                    {formData.meetingFormat === 'Online' ? 'ลิงก์ประชุมออนไลน์' : 'สถานที่นัดหมาย'} <span className="required">*</span>
                  </label>
                  <input type="text" className="user-custom-input"
                    placeholder={formData.meetingFormat === 'Online' ? "วางลิงก์ Google Meet / Zoom / Teams" : "ระบุชื่อห้องประชุม หรือ สถานที่"}
                    value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} />
                </div>

                <div className="input-group">
                  <label className="input-label">รายละเอียดเพิ่มเติม </label>
                  <textarea className="user-custom-input"
                    placeholder="ระบุรายละเอียดเพิ่มเติม..."
                    value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                </div>
              </div>

              {/* RIGHT: Summary Box */}
              <div className="summary-box">
                <h3 className="summary-title"><FileTextIcon /> สรุปการจอง</h3>
                <div className="summary-grid">
                  <div className="summary-item">
                    <p className="summary-label">กิจกรรม</p>
                    <p className="summary-value">{formData.type || '-'}</p>
                  </div>
                  <div className="summary-item">
                    <div className="summary-label"><CalendarIcon style={{ width: '14px' }} /> วันที่</div>
                    <p className="summary-value">{formData.days.length > 0 ? formatDisplayDate(formData.days[0]) : '-'}</p>
                  </div>
                  <div className="summary-item span-2">
                    <div className="summary-label"><FileTextIcon style={{ width: '14px' }} /> หัวข้อ</div>
                    <p className="summary-value">{formData.subject || '-'}</p>
                  </div>
                  <div className="summary-item">
                    <div className="summary-label"><ClockIcon style={{ width: '14px' }} /> ระยะเวลา</div>
                    <p className="summary-value">{formData.duration === 'กำหนดเอง' ? `${customDuration} (กำหนดเอง)` : (formData.duration || '-')}</p>
                  </div>
                  <div className="summary-item">
                    <div className="summary-label"><ClockIcon style={{ width: '14px' }} /> เวลา</div>
                    <p className="summary-value">{formData.startTime ? calculateEndTime(formData.startTime, formData.duration === 'กำหนดเอง' ? customDuration : formData.duration) + ' น.' : '-'}</p>
                  </div>
                  <div className="summary-item span-2">
                    <div className="summary-label">{formData.meetingFormat === 'Online' ? <MonitorIcon style={{ width: '14px' }} /> : <MapPinIcon style={{ width: '14px' }} />} รูปแบบ</div>
                    <p className="summary-value">{formData.meetingFormat}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="user-action-footer">
              <button className="btn-confirm" onClick={handleReview}>ยืนยันการจอง</button>
            </div>

          </div>
        ) : (
          <div className="user-form-card">
            <h2 className="user-section-title">รายการนัดหมายทั้งหมด</h2>
            {/* <div style={{ textAlign: 'center', padding: '1rem', color: '#6b7280' }}>ส่วนแสดงผลรายการ (List View)</div> */}

            <div className="user-event-list">
              {calendarEvents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>ไม่พบรายการนัดหมาย</div>
              ) : (
                calendarEvents.map(event => (
                  <div key={event.id} className="summary-box" style={{ marginBottom: '1rem' }}>
                    <div className="summary-grid">
                      <div className="summary-item span-2">
                        <div className="summary-label"><FileTextIcon style={{ width: '14px' }} /> หัวข้อ</div>
                        <p className="summary-value" style={{ fontWeight: 'bold' }}>{event.title}</p>
                      </div>
                      <div className="summary-item">
                        <div className="summary-label"><CalendarIcon style={{ width: '14px' }} /> เริ่ม</div>
                        <p className="summary-value">{new Date(event.startTime).toLocaleString('th-TH')}</p>
                      </div>
                      <div className="summary-item">
                        <div className="summary-label"><ClockIcon style={{ width: '14px' }} /> สิ้นสุด</div>
                        <p className="summary-value">{new Date(event.endTime).toLocaleString('th-TH')}</p>
                      </div>
                      <div className="summary-item span-2">
                        <div className="summary-label"><MapPinIcon style={{ width: '14px' }} /> รายละเอียด/สถานที่</div>
                        <p className="summary-value" style={{ whiteSpace: 'pre-wrap' }}>{event.description} @ {event.location}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <BookingPreviewModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        onConfirm={handleConfirmBooking}
        data={{
          type: formData.type,
          subject: formData.subject,
          date: formData.days[0],
          timeSlot: formData.startTime ? calculateEndTime(formData.startTime, formData.duration === 'กำหนดเอง' ? customDuration : formData.duration) ? `${formData.startTime} - ${calculateEndTime(formData.startTime, formData.duration === 'กำหนดเอง' ? customDuration : formData.duration).split('-')[1]} น.` : '-' : '-',
          duration: formData.duration === 'กำหนดเอง' ? `${customDuration} (กำหนดเอง)` : formData.duration,
          meetingFormat: formData.meetingFormat,
          location: formData.location,
          description: formData.description
        }}
      />

      {popupMessage.type === 'success' && <PopupModal message={popupMessage.message} onClose={() => setPopupMessage({ type: '', message: '' })} />}
      {popupMessage.type === 'error' && <ErrorPopup message={popupMessage.message} onClose={() => setPopupMessage({ type: '', message: '' })} />}
    </div>
  );
};
export default User;