// AdminScheduleUI.jsx
import React, { useState } from 'react';
import './Admin.css';

// Inline SVG icons to avoid external dependency on lucide-react
const CalendarIcon = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <path d="M16 2v4M8 2v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const Plus = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const ChevronDown = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const Admin = () => {
  const [schedules, setSchedules] = useState([
    { id: 1, day: 'จ.', type: 'ประชุม', time: '08:30 - 12:00', createdDate: '2025-11-18' },
    { id: 2, day: 'อ.', type: 'ประชุม', time: '09:30 - 12:00', createdDate: '2025-11-18' },
    { id: 3, day: 'พ.', type: 'อบรม', time: '08:30 - 12:00', createdDate: '2025-11-17' },
  ]);

  const [filterType, setFilterType] = useState('ทั้งหมด');

  const [formData, setFormData] = useState({
    type: '',
    days: [],
    startTime: '',
    endTime: '',
  });

  const days = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์'];
  const types = ['เลือกประเภทกิจกรรม', 'ประชุม', 'อบรม', 'สัมมนา', 'Presentation', 'Workshop'];
  const timeOptions = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00'
  ];

  const handleCreate = () => {
    if (formData.type && formData.days.length > 0 && formData.startTime && formData.endTime) {
      const currentDate = new Date().toISOString().split('T')[0];
      const newSchedules = formData.days.map((day, index) => ({
        id: schedules.length + index + 1,
        day: day.slice(0, 2) + '.',
        type: formData.type,
        time: `${formData.startTime} - ${formData.endTime}`,
        createdDate: currentDate,
      }));
      setSchedules([...schedules, ...newSchedules]);
      setFormData({ type: '', days: [], startTime: '', endTime: '' });
    }
  };

  const toggleDay = (day) => {
    setFormData(prev => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day]
    }));
  };

  const handleDelete = (id) => {
    setSchedules(schedules.filter(s => s.id !== id));
  };

  const filteredSchedules = filterType === 'ทั้งหมด' 
    ? schedules 
    : schedules.filter(schedule => schedule.type === filterType);

  const uniqueTypes = ['ทั้งหมด', ...new Set(schedules.map(s => s.type))];

  // Group schedules by created date
  const groupedSchedules = filteredSchedules.reduce((groups, schedule) => {
    const date = schedule.createdDate;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(schedule);
    return groups;
  }, {});

  // Sort dates (newest first)
  const sortedDates = Object.keys(groupedSchedules).sort((a, b) => new Date(b) - new Date(a));

  // Format date to Thai
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const thaiMonths = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 
                        'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
    const day = date.getDate();
    const month = thaiMonths[date.getMonth()];
    const year = date.getFullYear() + 543;
    return `${day} ${month} ${year}`;
  };

  return (
    <div className="admin-schedule-container">
      <div className="admin-schedule-wrapper">
        {/* Header */}
        <div className="header-card">
          <div className="header-content">
            <div className="header-icon">
              <CalendarIcon className="icon" />
            </div>
            <div>
              <h1 className="header-title">Admin Schedule Management</h1>
              <p className="header-subtitle">จัดการตารางเวลาและกิจกรรมทั้งหมด</p>
            </div>
          </div>
        </div>

        {/* Create Form */}
        <div className="form-card">
          <div className="form-header">
            <Plus className="form-icon" />
            <h2 className="form-title">กำหนดช่วงเวลากิจกรรม</h2>
          </div>

          <div className="form-content">
            {/* Type Dropdown */}
            <div className="form-group">
              <label className="form-label">ประเภทกิจกรรม</label>
              <div className="select-wrapper">
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="form-select"
                >
                  {types.map((type) => (
                    <option key={type} value={type === 'เลือกประเภทกิจกรรม' ? '' : type}>
                      {type}
                    </option>
                  ))}
                </select>
                <ChevronDown className="select-icon" />
              </div>
            </div>

            {/* Day Selection */}
            <div className="form-group">
              <label className="form-label">
                วัน <span className="form-label-hint">(เลือกได้มากกว่า 1 วัน)</span>
              </label>
              <div className="day-buttons">
                {days.map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`day-button ${formData.days.includes(day) ? 'day-button-active' : ''}`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            {/* Time Selection */}
            <div className="time-grid">
              <div className="form-group">
                <label className="form-label">เวลาเริ่ม</label>
                <div className="select-wrapper">
                  <select
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="form-select"
                  >
                    <option value="">เลือกเวลาเริ่ม</option>
                    {timeOptions.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="select-icon" />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">เวลาสิ้นสุด</label>
                <div className="select-wrapper">
                  <select
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="form-select"
                  >
                    <option value="">เลือกเวลาสิ้นสุด</option>
                    {timeOptions.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="select-icon" />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button onClick={handleCreate} className="submit-button">
              บันทึก
            </button>
          </div>
        </div>

        {/* Schedule List */}
        <div className="list-card">
          {/* Filter Section */}
          <div className="filter-section">
            <label className="form-label">กรองตามประเภท</label>
            <div className="select-wrapper filter-select">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="form-select"
              >
                {uniqueTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <ChevronDown className="select-icon" />
            </div>
          </div>

          {/* Results Count */}
          <div className="results-count">
            แสดง {filteredSchedules.length} รายการ
            {filterType !== 'ทั้งหมด' && ` (กรอง: ${filterType})`}
          </div>

          {/* Schedule Items */}
          <div className="schedule-list">
            {filteredSchedules.length === 0 ? (
              <div className="empty-state">
                ไม่พบรายการที่ค้นหา
              </div>
            ) : (
              sortedDates.map((date) => (
                <div key={date} className="date-group">
                  {/* Date Separator */}
                  <div className="date-separator">
                    <div className="date-badge">
                      {formatDate(date)}
                    </div>
                    <div className="date-line"></div>
                  </div>

                  {/* Schedule Items for this date */}
                  <div className="schedule-items">
                    {groupedSchedules[date].map((schedule) => (
                      <div key={schedule.id} className="schedule-item">
                        {/* Day Badge */}
                        <div className="schedule-day-badge">
                          {schedule.day}
                        </div>

                        {/* Info */}
                        <div className="schedule-info">
                          <h3 className="schedule-type">{schedule.type}</h3>
                          <p className="schedule-time">
                            <span>🕐</span>
                            {schedule.time}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="schedule-actions">
                          <button className="action-button action-edit">
                            แก้ไข
                          </button>
                          <button
                            onClick={() => handleDelete(schedule.id)}
                            className="action-button action-delete"
                          >
                            ยกเลิก
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;