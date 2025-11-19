// Admin.jsx
import React, { useState, useEffect } from 'react';
import './Admin.css';
import {
  subscribeSchedules,
  addScheduleDoc,
  deleteScheduleById,
  // updateScheduleById,
} from '../firebase';

// --------------------------- ICONS ---------------------------
const CalendarIcon = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <path d="M16 2v4M8 2v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const Plus = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const ChevronDown = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// --------------------------- MAIN COMPONENT ---------------------------
const Admin = () => {
  const [schedules, setSchedules] = useState([]);
  const [filterType, setFilterType] = useState('ทั้งหมด');
  const [editItem, setEditItem] = useState(null);

  const [formData, setFormData] = useState({
    type: '',
    days: [],
    startTime: '',
    endTime: '',
  });

  const days = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์'];
  const types = ['เลือกประเภทกิจกรรม', 'ประชุม', 'อบรม', 'สัมมนา', 'กินข้าว', 'เที่ยว'];

  // สร้างตัวเลือกเวลา (ทุก 5 นาที)
  const timeOptions = (() => {
    const opts = [];
    for (let h = 0; h <= 23; h++) {
      for (let m = 0; m < 60; m += 5) {
        const hh = String(h).padStart(2, '0');
        const mm = String(m).padStart(2, '0');
        opts.push(`${hh}:${mm}`);
      }
    }
    return opts;
  })();

  // --------------------------- SAVE (CREATE / UPDATE) ---------------------------
  const handleSave = async () => {
    if (formData.type && formData.days.length > 0 && formData.startTime && formData.endTime) {
      const currentDate = new Date().toISOString().split('T')[0];

      const shortDayMap = {
        'จันทร์': 'จ.',
        'อังคาร': 'อ.',
        'พุธ': 'พ.',
        'พฤหัสบดี': 'พฤ.',
        'ศุกร์': 'ศ.',
        'เสาร์': 'ส.',
        'อาทิตย์': 'อา.',
      };

      const newSchedules = formData.days.map((day) => ({
        day: shortDayMap[day] || day,
        type: formData.type,
        time: `${formData.startTime} - ${formData.endTime}`,
        createdDate: currentDate,
      }));

      try {
        // ถ้าเป็นการแก้ไข ให้ลบรายการเก่าออกก่อน
        if (editItem) {
          await deleteScheduleById(editItem.id);
        }

        // เพิ่มรายการใหม่
        await Promise.all(newSchedules.map((s) => addScheduleDoc(s)));

        // รีเซ็ตฟอร์ม
        setFormData({ type: '', days: [], startTime: '', endTime: '' });
        setEditItem(null);
      } catch (err) {
        console.error('Error adding schedules:', err);
      }
    }
  };


  // --------------------------- TOGGLE DAY ---------------------------
  const toggleDay = (day) => {
    setFormData((prev) => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter((d) => d !== day)
        : [...prev.days, day],
    }));
  };

  // --------------------------- DELETE ---------------------------
  const handleDelete = async (id) => {
    if (window.confirm('แน่ใจว่าต้องการลบรายการนี้?')) {
      try {
        await deleteScheduleById(id);
      } catch (err) {
        console.error('Error deleting schedule:', err);
      }
    }
  };

  // --------------------------- EDIT ---------------------------
  const handleEdit = (item) => {
    setEditItem(item);
    const fullDayMap = {
      'จ.': 'จันทร์',
      'อ.': 'อังคาร',
      'พ.': 'พุธ',
      'พฤ.': 'พฤหัสบดี',
      'ศ.': 'ศุกร์',
      'ส.': 'เสาร์',
      'อา.': 'อาทิตย์',
    };
    setFormData({
      type: item.type,
      days: [fullDayMap[item.day] || item.day],
      startTime: item.time.split(' - ')[0],
      endTime: item.time.split(' - ')[1],
    });
  };

  // --------------------------- FIRESTORE REALTIME ---------------------------
  useEffect(() => {
    const unsub = subscribeSchedules((items) => {
      setSchedules(items);
    });
    return () => unsub();
  }, []);

  // --------------------------- FILTERING ---------------------------
  const filteredSchedules =
    filterType === 'ทั้งหมด'
      ? schedules
      : schedules.filter((s) => s.type === filterType);

  const uniqueTypes = ['ทั้งหมด', ...new Set(schedules.map((s) => s.type))];

  // --------------------------- GROUP BY DATE ---------------------------
  const groupedSchedules = filteredSchedules.reduce((groups, s) => {
    const date = s.createdDate;
    if (!groups[date]) groups[date] = [];
    groups[date].push(s);
    return groups;
  }, {});

  // ✅ เรียงลำดับวันในแต่ละกลุ่ม
  const dayOrder = ['จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.', 'อา.'];
  for (const date in groupedSchedules) {
    groupedSchedules[date].sort(
      (a, b) => dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day)
    );
  }

  // ✅ เรียงวันที่ใหม่สุดอยู่บนสุด
  const sortedDates = Object.keys(groupedSchedules).sort(
    (a, b) => new Date(b) - new Date(a)
  );

  // --------------------------- FORMAT THAI DATE ---------------------------
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const thaiMonths = [
      'มกราคม',
      'กุมภาพันธ์',
      'มีนาคม',
      'เมษายน',
      'พฤษภาคม',
      'มิถุนายน',
      'กรกฎาคม',
      'สิงหาคม',
      'กันยายน',
      'ตุลาคม',
      'พฤศจิกายน',
      'ธันวาคม',
    ];
    const day = date.getDate();
    const month = thaiMonths[date.getMonth()];
    const year = date.getFullYear() + 543;
    return `${day} ${month} ${year}`;
  };

  // --------------------------- RENDER ---------------------------
  return (
    <div className="admin-schedule-container">
      <div className="admin-schedule-wrapper">

        {/* HEADER */}
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

        {/* FORM */}
        <div className="form-card">
          <div className="form-header">
            <Plus className="form-icon" />
            <h2 className="form-title">{editItem ? 'แก้ไขกิจกรรม' : 'กำหนดช่วงเวลากิจกรรม'}</h2>
          </div>

          <div className="form-content">
            {/* TYPE */}
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

            {/* DAYS */}
            <div className="form-group">
              <label className="form-label">วัน <span className="form-label-hint">(เลือกได้มากกว่า 1 วัน)</span></label>
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

            {/* TIME */}
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
                      <option key={time} value={time}>{time}</option>
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
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                  <ChevronDown className="select-icon" />
                </div>
              </div>
            </div>

            {/* BUTTON */}
            <button onClick={handleSave} className="submit-button">
              {editItem ? 'อัปเดต' : 'บันทึก'}
            </button>
          </div>
        </div>

        {/* LIST */}
        <div className="list-card">
          <div className="filter-section">
            <label className="form-label">กรองตามประเภท</label>
            <div className="select-wrapper filter-select">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="form-select"
              >
                {uniqueTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <ChevronDown className="select-icon" />
            </div>
          </div>

          <div className="results-count">
            แสดง {filteredSchedules.length} รายการ
            {filterType !== 'ทั้งหมด' && ` (กรอง: ${filterType})`}
          </div>

          <div className="schedule-list">
            {filteredSchedules.length === 0 ? (
              <div className="empty-state">ไม่พบรายการที่ค้นหา</div>
            ) : (
              sortedDates.map((date) => (
                <div key={date} className="date-group">
                  <div className="date-separator">
                    <div className="date-badge">บันทึกเมื่อ {formatDate(date)}</div>
                    <div className="date-line"></div>
                  </div>

                  <div className="schedule-items">
                    {groupedSchedules[date].map((schedule) => (
                      <div key={schedule.id} className="schedule-item">
                        <div className="schedule-day-badge">{schedule.day}</div>
                        <div className="schedule-info">
                          <h3 className="schedule-type">{schedule.type}</h3>
                          <p className="schedule-time">🕐 {schedule.time}</p>
                        </div>
                        <div className="schedule-actions">
                          <button
                            className="action-button action-edit"
                            onClick={() => handleEdit(schedule)}
                          >
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
