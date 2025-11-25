import React, { useState, useEffect } from 'react';
import './Admin.css';
import TimeDropdown from "./TimeDropdown";
import {
  subscribeSchedules,
  addScheduleDoc,
  deleteScheduleById,
  subscribeActivityTypes,
  addActivityType
} from '../firebase';

// --------------------------- ICONS ---------------------------
const CalendarIcon = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M16 2v4M8 2v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const Plus = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const ChevronDown = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 20 20" fill="none">
    <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const Admin = () => {
  const [schedules, setSchedules] = useState([]);
  const [types, setTypes] = useState(['เลือกประเภทกิจกรรม']);
  const [formData, setFormData] = useState({ type: '', days: [], startTime: '', endTime: '' });
  const [newType, setNewType] = useState('');
  const [editItem, setEditItem] = useState(null);
  const [isViewMode, setIsViewMode] = useState(false);

  const days = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];

  // สร้างตัวเลือกเวลา 15 นาที
  const timeOptions = (() => {
    const opts = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 15) {
        opts.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
      }
    }
    return opts;
  })();

  // --------------------------- FETCH DATA ---------------------------
  useEffect(() => {
    const unsubSchedules = subscribeSchedules(setSchedules);
    const unsubTypes = subscribeActivityTypes((fetchedTypes) => {
      setTypes(['เลือกประเภทกิจกรรม', ...fetchedTypes]);
    });
    return () => {
      unsubSchedules();
      unsubTypes();
    };
  }, []);

  // --------------------------- SAVE ---------------------------
  const handleSave = async () => {
    if (!formData.type || formData.days.length === 0 || !formData.startTime || !formData.endTime) return;

    const shortDayMap = {
      'อาทิตย์': 'อา.', 'จันทร์': 'จ.', 'อังคาร': 'อ.', 'พุธ': 'พ.',
      'พฤหัสบดี': 'พฤ.', 'ศุกร์': 'ศ.', 'เสาร์': 'ส.'
    };

    try {
      if (editItem) {
        await deleteScheduleById(editItem.id);
      }

      const newSchedules = formData.days.map(day => ({
        day: shortDayMap[day] || day,
        type: formData.type,
        time: `${formData.startTime} - ${formData.endTime}`,
        createdDate: new Date().toISOString(),
      }));

      await Promise.all(newSchedules.map(s => addScheduleDoc(s)));
      setFormData({ type: '', days: [], startTime: '', endTime: '' });
      setEditItem(null);
    } catch (err) {
      console.error(err);
    }
  };

  // --------------------------- ADD NEW TYPE ---------------------------
  const handleAddType = async () => {
    const trimmed = newType.trim();
    if (trimmed && !types.includes(trimmed)) {
      try {
        await addActivityType(trimmed);
        setFormData({ ...formData, type: trimmed });
        setNewType('');
      } catch (err) {
        console.error(err);
      }
    }
  };

  // --------------------------- TOGGLE DAY ---------------------------
  const toggleDay = day => {
    setFormData(prev => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day]
    }));
  };

  // --------------------------- RENDER ---------------------------
  return (
    <div className="admin-schedule-container">
      <div className="admin-schedule-wrapper">

        {/* HEADER */}
        <div className="header-card">
          <div className="header-top-row">
            <div className="header-content">
              <div className="header-icon"><CalendarIcon className="icon"/></div>
              <div>
                <h1 className="header-title">Admin Schedule Management</h1>
                <p className="header-subtitle">
                  {isViewMode ? 'ดูรายการกิจกรรมทั้งหมด' : 'จัดการตารางเวลาและกิจกรรม'}
                </p>
              </div>
            </div>
            <button className="session-toggle-btn" onClick={() => setIsViewMode(!isViewMode)}>
              {isViewMode ? 'กลับไปหน้าจัดการ' : 'ดูรายการกิจกรรม'}
            </button>
          </div>
        </div>

        {/* MAIN CONTENT */}
        {!isViewMode ? (
          <div className="form-card">
            <div className="form-header">
              <Plus className="form-icon" />
              <h2 className="form-title">{editItem ? 'แก้ไขกิจกรรม' : 'กำหนดช่วงเวลากิจกรรม'}</h2>
            </div>

            <div className="form-content">
              {/* TYPE */}
              <div className="form-group">
                <label className="form-label">ประเภทกิจกรรม</label>
                <div className="type-inline-row">
                  <div className="select-wrapper type-select">
                    <select
                      value={formData.type}
                      onChange={e => setFormData({ ...formData, type: e.target.value })}
                      className={`form-select ${formData.type ? 'has-value' : ''}`}
                    >
                      {types.map(type => (
                        <option key={type} value={type === 'เลือกประเภทกิจกรรม' ? '' : type}>{type}</option>
                      ))}
                    </select>
                    <ChevronDown className="select-icon" />
                  </div>

                  <input
                    type="text"
                    placeholder="เพิ่มกิจกรรมใหม่..."
                    value={newType}
                    onChange={e => setNewType(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && handleAddType()}
                    className="add-activity-input"
                  />
                  <button type="button" onClick={handleAddType} className="add-activity-btn">
                    <Plus className="button-icon" /> เพิ่ม
                  </button>
                </div>
              </div>

              {/* DAYS */}
              <div className="form-group">
                <label className="form-label">วัน <span className="form-label-hint">(เลือกได้มากกว่า 1 วัน)</span></label>
                <div className="day-buttons">
                  {days.map(day => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`day-button ${formData.days.includes(day) ? 'day-button-active' : ''}`}
                    >{day}</button>
                  ))}
                </div>
              </div>

              {/* TIME */}
              <div className="time-grid">
                <div className="form-group">
                  <label className="form-label">เวลาเริ่ม</label>
                  <div className="time-input-row">
                    <input
                      type="text"
                      value={formData.startTime}
                      onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                      className="time-text-input"
                      placeholder="HH:MM"
                    />
                    <TimeDropdown
                      value={formData.startTime}
                      onChange={time => setFormData({ ...formData, startTime: time })}
                      timeOptions={timeOptions}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">เวลาสิ้นสุด</label>
                  <div className="time-input-row">
                    <input
                      type="text"
                      value={formData.endTime}
                      onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                      className="time-text-input"
                      placeholder="HH:MM"
                    />
                    <TimeDropdown
                      value={formData.endTime}
                      onChange={time => setFormData({ ...formData, endTime: time })}
                      timeOptions={timeOptions}
                    />
                  </div>
                </div>
              </div>

              {/* SAVE */}
              <button onClick={handleSave} className="submit-button">
                {editItem ? 'อัปเดต' : 'บันทึก'}
              </button>
            </div>
          </div>
        ) : (
          <div className="list-card">
            <h2 className="form-title">รายการกิจกรรมทั้งหมด</h2>
            <div className="schedule-list">
              {schedules.length > 0 ? schedules.map(item => (
                <div key={item.id} className="schedule-item">
                  <div className="schedule-day-badge">{item.day}</div>
                  <div className="schedule-info">
                    <p className="schedule-type">{item.type}</p>
                    <p className="schedule-time">{item.time}</p>
                  </div>
                  <div className="schedule-actions">
                    <button
                      className="action-button action-edit"
                      onClick={() => {
                        setEditItem(item);
                        // แปลง shortDay เป็น full day ถ้าต้องการ mapping
                        const fullDayMap = { 'อา.': 'อาทิตย์', 'จ.': 'จันทร์', 'อ.': 'อังคาร', 'พ.': 'พุธ', 'พฤ.': 'พฤหัสบดี', 'ศ.': 'ศุกร์', 'ส.': 'เสาร์' };
                        const fullDay = fullDayMap[item.day] || item.day;
                        setFormData({
                          type: item.type,
                          days: [fullDay],
                          startTime: item.time.split(' - ')[0],
                          endTime: item.time.split(' - ')[1],
                        });
                        setIsViewMode(false);
                      }}
                    >✏️ แก้ไข</button>
                    <button
                      className="action-button action-delete"
                      onClick={() => deleteScheduleById(item.id)}
                    >🗑️ ลบ</button>
                  </div>
                </div>
              )) : (
                <div className="empty-state">ยังไม่มีข้อมูลกิจกรรม</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
