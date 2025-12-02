import React, { useState, useEffect } from 'react';
import { collection, getDocs, getFirestore } from 'firebase/firestore';
import { app, db } from '../firebase';
import './User.css';

// Check if Firebase is properly initialized
if (!db) {
  console.error('Firebase is not properly initialized');
}

// Icons
const ChevronDown = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 20 20" fill="none">
    <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ChevronLeft = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 18l-6-6 6-6" />
  </svg>
);

const ChevronRight = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18l6-6-6-6" />
  </svg>
);

const UserPage = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().getDate());
  const [selectedTime, setSelectedTime] = useState('09:00-09:30');
  const [activities, setActivities] = useState([]);
  const [activity, setActivity] = useState('');
  const [subject, setSubject] = useState('');
  const [duration, setDuration] = useState('30');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch activities from Firestore
  useEffect(() => {
    if (!db) {
      setError('ไม่สามารถเชื่อมต่อกับระบบได้ กรุณารีเฟรชหน้าเว็บ');
      setLoading(false);
      return;
    }

    const fetchActivities = async () => {
      try {
        const activitiesRef = collection(db, 'activities');
        const snapshot = await getDocs(activitiesRef);
        const activitiesList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setActivities(activitiesList);
      } catch (err) {
        console.error("Error fetching activities: ", err);
        setError('ไม่สามารถโหลดรายการกิจกรรมได้ กรุณาลองใหม่ภายหลัง');
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);

  // Time slots
  const timeSlots = [
    '09:00-09:30', '09:30-10:00', '10:00-10:30', '10:30-11:00',
    '11:00-11:30', '11:30-12:00', '12:00-12:30', '12:30-13:00',
    '13:00-13:30', '13:30-14:00', '14:00-14:30', '14:30-15:00',
    '15:00-15:30', '15:30-16:00', '16:00-16:30', '16:30-17:00'
  ];

  // Generate days in month
  const getDaysInMonth = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    
    // Add empty cells for days before the 1st of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    
    return days;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you would typically send the booking data to your backend
    alert(`การจองสำเร็จ!\nวันที่: ${selectedDate} \nเวลา: ${selectedTime} \nกิจกรรม: ${activity}`);
  };

  const days = getDaysInMonth();
  const dayNames = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
  const currentMonth = new Date().toLocaleString('th-TH', { month: 'long', year: 'numeric' });

  if (!db) {
    return (
      <div className="user-error-container">
        <h2>เกิดข้อผิดพลาดในการเชื่อมต่อ</h2>
        <p className="user-error-message">
          ไม่สามารถเชื่อมต่อกับระบบได้ กรุณารีเฟรชหน้าเว็บหรือติดต่อผู้ดูแลระบบ
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="user-loading-container">
        <div className="user-loading-spinner"></div>
        <p>กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="user-error-container">
        <p className="user-error-message">{error}</p>
      </div>
    );
  }

  return (
    <div className="user-container">
      <div className="user-card">
        <h1 className="user-title">จองห้องประชุม</h1>
        
        <form onSubmit={handleSubmit} className="user-form">
          {/* Activity Selection */}
          <div className="user-form-group">
            <label className="user-form-label">กิจกรรม <span className="user-required">*</span></label>
            <div className="user-select-wrapper">
              <select 
                className="user-form-select"
                value={activity}
                onChange={(e) => setActivity(e.target.value)}
                required
                disabled={activities.length === 0}
              >
                <option value="">{activities.length === 0 ? 'ไม่พบกิจกรรม' : 'เลือกกิจกรรม'}</option>
                {activities.map((act) => (
                  <option key={act.id} value={act.name || act.id}>
                    {act.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="user-select-icon" />
            </div>
          </div>

          {/* Subject */}
          <div className="user-form-group">
            <label className="user-form-label">หัวข้อการประชุม <span className="user-required">*</span></label>
            <input
              type="text"
              className="user-form-input"
              placeholder="เช่น ประชุมสรุปงานออกแบบ UX"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
          </div>

          {/* Duration */}
          <div className="user-form-group">
            <label className="user-form-label">ระยะเวลา (นาที) <span className="user-required">*</span></label>
            <div className="user-select-wrapper">
              <select 
                className="user-form-select"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                required
              >
                <option value="30">30 นาที</option>
                <option value="60">1 ชั่วโมง</option>
                <option value="90">1.5 ชั่วโมง</option>
                <option value="120">2 ชั่วโมง</option>
              </select>
              <ChevronDown className="user-select-icon" />
            </div>
          </div>
          
          {/* Calendar */}
          <div className="user-form-group">
            <label className="user-form-label">วันที่ <span className="user-required">*</span></label>
            <div className="user-calendar-container">
              <div className="user-calendar-header">
                <h3 className="user-month-year">{currentMonth}</h3>
                <div className="user-calendar-nav">
                  <button type="button" className="user-nav-button">
                    <ChevronLeft className="user-nav-icon" />
                  </button>
                  <button type="button" className="user-nav-button">
                    <ChevronRight className="user-nav-icon" />
                  </button>
                </div>
              </div>
              <div className="user-calendar-grid">
                {dayNames.map((day, index) => (
                  <div key={`day-${index}`} className="user-day-header">{day}</div>
                ))}
                {days.map((day, index) => (
                  <button
                    key={`date-${index}`}
                    type="button"
                    className={`user-day-cell ${day === selectedDate ? 'user-selected' : ''} ${!day ? 'user-empty' : ''}`}
                    onClick={() => day && setSelectedDate(day)}
                    disabled={!day}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          {/* Time Slot Selection */}
          <div className="user-form-group">
            <label className="user-form-label">เวลา <span className="user-required">*</span></label>
            <div className="user-time-slots-grid">
              {timeSlots.map((time, index) => (
                <button
                  key={index}
                  type="button"
                  className={`user-time-slot ${time === selectedTime ? 'user-selected' : ''}`}
                  onClick={() => setSelectedTime(time)}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>
          
          {/* User Information */}
          <div className="user-form-group">
            <label className="user-form-label">ชื่อ-นามสกุล <span className="user-required">*</span></label>
            <input
              type="text"
              className="user-form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          
          <div className="user-form-group">
            <label className="user-form-label">อีเมล <span className="user-required">*</span></label>
            <input
              type="email"
              className="user-form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="user-form-group">
            <label className="user-form-label">หมายเหตุ</label>
            <textarea
              className="user-form-textarea"
              rows="3"
              placeholder="กรอกหมายเหตุเพิ่มเติม (ถ้ามี)"
            ></textarea>
          </div>
          
          <div className="user-form-actions">
            <button type="submit" className="user-submit-button">
              ยืนยันการจอง
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserPage;