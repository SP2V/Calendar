import React, { useState, useEffect } from 'react';
import './Admin.css';
import TimeDropdown from "../components/TimeDropdown";
import PopupModal from "../components/PopupModal";
import {
  subscribeSchedules,
  addScheduleDoc,
  deleteScheduleById,
  subscribeActivityTypes,
  addActivityType,
  updateActivityType,
  deleteActivityType
} from '../firebase';


// --------------------------- ICONS ---------------------------
const CalendarIcon = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <path d="M16 2v4M8 2v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const Plus = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const ChevronDown = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 20 20" fill="none">
    <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Admin = () => {
  const [schedules, setSchedules] = useState([]);
  const [types, setTypes] = useState(['เลือกประเภทกิจกรรม']);
  const [activityTypes, setActivityTypes] = useState([]);
  const [formData, setFormData] = useState({ type: '', days: [], startTime: '', endTime: '', duration: '' });
  const [newType, setNewType] = useState('');
  const [editItem, setEditItem] = useState(null);
  const [isViewMode, setIsViewMode] = useState(false);
  const [editingTypeId, setEditingTypeId] = useState(null);
  const [editingTypeName, setEditingTypeName] = useState('');
  const [customDuration, setCustomDuration] = useState('');
  const [currentSchedulePage, setCurrentSchedulePage] = useState(1);
  const [currentTypePage, setCurrentTypePage] = useState(1);
  const [activityFilter, setActivityFilter] = useState('แสดงทั้งหมด');
  const itemsPerPage = 5;
  const [popupMessage, setPopupMessage] = useState("");
  // const [showPopup, setShowPopup] = useState(false); // ไม่จำเป็นต้องใช้ เพราะเช็คจาก popupMessage โดยตรง

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

  // ตัวเลือกระยะเวลา
  const durationOptions = [
    '30 นาที',
    '45 นาที',
    '1 ชั่วโมง',
    '2 ชั่วโมง',
    '3 ชั่วโมง',
    '4 ชั่วโมง',
    'Custom'
  ];


  // --------------------------- FETCH DATA ---------------------------
  useEffect(() => {
    const unsubSchedules = subscribeSchedules(setSchedules);
    const unsubTypes = subscribeActivityTypes((fetchedTypes) => {
      setActivityTypes(fetchedTypes);
      setTypes(['เลือกประเภทกิจกรรม', ...fetchedTypes.map(t => t.name)]);
    });
    return () => {
      unsubSchedules();
      unsubTypes();
    };
  }, []);

  // Reset page เมื่อ schedules เปลี่ยน
  useEffect(() => {
    setCurrentSchedulePage(1);
  }, [schedules.length]);

  // Reset page เมื่อ activity types เปลี่ยน
  useEffect(() => {
    setCurrentTypePage(1);
  }, [activityTypes.length]);

  // --------------------------- AUTO CLOSE POPUP ---------------------------
  // เพิ่มส่วนนี้: เมื่อ popupMessage เปลี่ยนแปลง ถ้ามีข้อความ ให้ตั้งเวลาปิดใน 3 วินาที
  useEffect(() => {
    if (popupMessage) {
      const timer = setTimeout(() => {
        setPopupMessage("");
      }, 5000); // 3000 ms = 3 วินาที (ปรับเปลี่ยนเวลาได้ตรงนี้)

      // Cleanup function: ถ้ามีการ set ข้อความใหม่ก่อนหมดเวลา ให้ล้าง timer เก่าทิ้ง
      return () => clearTimeout(timer);
    }
  }, [popupMessage]);
  // ----------------------------------------------------------------------

  // --------------------------- VALIDATION ---------------------------
  const validateForm = () => {
    if (formData.type === '' || formData.type === 'เลือกประเภทกิจกรรม') {
      setPopupMessage('กรุณาเลือกประเภทกิจกรรม');
      return false;
    }
    if (formData.days.length === 0) {
      setPopupMessage('กรุณาเลือกวันทำกิจกรรม');
      return false;
    }
    if (!formData.startTime) {
      setPopupMessage('กรุณาเลือกเวลาเริ่มต้น');
      return false;
    }
    if (!formData.endTime) {
      setPopupMessage('กรุณาเลือกเวลาสิ้นสุด');
      return false;
    }
    if (!formData.duration) {
      setPopupMessage('กรุณาเลือกระยะเวลา');
      return false;
    }
    return true;
  };

  // --------------------------- SAVE (ADD & UPDATE) ---------------------------
  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }
    if (!formData.type || formData.days.length === 0 || !formData.startTime || !formData.endTime) return;

    const shortDayMap = {
      'อาทิตย์': 'อา.', 'จันทร์': 'จ.', 'อังคาร': 'อ.', 'พุธ': 'พ.',
      'พฤหัสบดี': 'พฤ.', 'ศุกร์': 'ศ.', 'เสาร์': 'ส.'
    };

    try {
      if (editItem) {
        await deleteScheduleById(editItem.id);
      }

      // เตรียม duration value
      let durationValue = formData.duration || '';
      if (formData.duration === 'Custom' && customDuration) {
        durationValue = customDuration;
      }

      const newSchedules = formData.days.map(day => ({
        day: shortDayMap[day] || day,
        type: formData.type,
        time: `${formData.startTime} - ${formData.endTime}`,
        duration: durationValue,
        createdDate: new Date().toISOString(),
      }));

      await Promise.all(newSchedules.map(s => addScheduleDoc(s)));
      setFormData({ type: '', days: [], startTime: '', endTime: '', duration: '' });
      setCustomDuration('');
      
      // *** แสดง Popup แจ้งเตือน ***
      setPopupMessage(editItem ? 'อัปเดตข้อมูลสำเร็จ' : 'บันทึกข้อมูลสำเร็จ');
      
      setEditItem(null);
    } catch (err) {
      console.error(err);
      setPopupMessage('เกิดข้อผิดพลาดในการบันทึก');
    }
  };

  // --------------------------- DELETE SCHEDULE ---------------------------
  // สร้างฟังก์ชัน Wrapper สำหรับลบตารางเวลาเพื่อให้แสดง Popup
  const handleDeleteSchedule = async (id) => {
    if (window.confirm("คุณต้องการลบรายการนี้ใช่หรือไม่?")) {
      try {
        await deleteScheduleById(id);
        setPopupMessage("ลบข้อมูลตารางเวลาสำเร็จ");
      } catch (err) {
        console.error(err);
        setPopupMessage("เกิดข้อผิดพลาดในการลบ");
      }
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
        // *** แสดง Popup แจ้งเตือน ***
        setPopupMessage('เพิ่มประเภทกิจกรรมสำเร็จ');
      } catch (err) {
        console.error(err);
        setPopupMessage('เกิดข้อผิดพลาดในการเพิ่มประเภท');
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

  // --------------------------- EDIT ACTIVITY TYPE ---------------------------
  const handleEditType = (type) => {
    setEditingTypeId(type.id);
    setEditingTypeName(type.name);
  };

  const handleSaveType = async () => {
    if (!editingTypeName.trim() || !editingTypeId) return;
    try {
      await updateActivityType(editingTypeId, editingTypeName.trim());
      setEditingTypeId(null);
      setEditingTypeName('');
      // *** แสดง Popup แจ้งเตือน ***
      setPopupMessage('แก้ไขประเภทกิจกรรมสำเร็จ');
    } catch (err) {
      console.error(err);
      setPopupMessage('เกิดข้อผิดพลาดในการแก้ไข');
    }
  };

  const handleCancelEditType = () => {
    setEditingTypeId(null);
    setEditingTypeName('');
  };

  // --------------------------- DELETE ACTIVITY TYPE ---------------------------
  // สร้างฟังก์ชัน Wrapper สำหรับลบประเภทกิจกรรมเพื่อให้แสดง Popup
  const handleDeleteActivityType = async (id) => {
    if (window.confirm("คุณต้องการลบประเภทกิจกรรมนี้ใช่หรือไม่?")) {
        try {
            await deleteActivityType(id);
            setPopupMessage('ลบประเภทกิจกรรมสำเร็จ');
        } catch (err) {
            console.error(err);
            setPopupMessage('เกิดข้อผิดพลาดในการลบ');
        }
    }
  };

  // --------------------------- RENDER ---------------------------
  return (
    <div className="admin-schedule-container">
      <div className="admin-schedule-wrapper">

        {/* HEADER */}
        <div className="header-card">
          <div className="header-top-row">
            <div className="header-content">
              <div className="header-icon"><CalendarIcon className="icon" /></div>
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
                  <div className="select-wrapper type-select" style={{ flex: 1 }}>
                    <TimeDropdown
                      value={formData.type}
                      onChange={selectedType => setFormData({ ...formData, type: selectedType })}
                      timeOptions={types.filter(t => t !== 'เลือกประเภทกิจกรรม')}
                      placeholder="เลือกประเภทกิจกรรม"
                    />
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

              {/* DURATION */}
              <div className="form-group">
                <label className="form-label">ระยะเวลาการนัดหมาย</label>
                <div className="duration-row">
                  <div className="select-wrapper" style={{ flex: 1 }}>
                    <TimeDropdown
                      value={formData.duration}
                      onChange={duration => {
                        setFormData({ ...formData, duration });
                        if (duration !== 'Custom') {
                          setCustomDuration('');
                        }
                      }}
                      timeOptions={durationOptions}
                      placeholder="เลือกระยะเวลา"
                    />
                  </div>
                  {formData.duration === 'Custom' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                      <input
                        type="text"
                        placeholder="เช่น 90, 1.5, 1h30m"
                        value={customDuration}
                        onChange={e => setCustomDuration(e.target.value)}
                        className="custom-duration-input"
                        style={{
                          flex: 1,
                          height: '38px',
                          padding: '6px 10px',
                          border: '1px solid #ccc',
                          borderRadius: '6px',
                          fontSize: '14px'
                        }}
                      />
                      <span style={{ fontSize: '14px', color: '#666' }}>นาที</span>
                    </div>
                  )}
                </div>
              </div>

              {/* TIME */}
              <div className="time-grid">
                <div className="form-group">
                  <label className="form-label">เวลาเริ่ม</label>
                  <TimeDropdown
                    value={formData.startTime}
                    onChange={time => setFormData({ ...formData, startTime: time })}
                    timeOptions={timeOptions}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">เวลาสิ้นสุด</label>
                  <TimeDropdown
                    value={formData.endTime}
                    onChange={time => setFormData({ ...formData, endTime: time })}
                    timeOptions={timeOptions}
                  />
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

            <div className="list-content-grid">
              {/* ส่วนแสดงประเภทกิจกรรม - ซ้าย */}
              <div className="list-column-card">
                <h3 style={{ fontSize: '1rem', marginBottom: '1rem', marginTop: '0', color: '#333' }}>กิจกรรม</h3>
                {(() => {
                  const typeTotalPages = Math.ceil(activityTypes.length / itemsPerPage) || 1;
                  const typeStartIndex = (currentTypePage - 1) * itemsPerPage;
                  const currentTypes = activityTypes.slice(typeStartIndex, typeStartIndex + itemsPerPage);

                  return (
                    <>
                      <div className="schedule-list">
                        {activityTypes.length > 0 ? currentTypes.map(type => (
                          <div key={type.id} className="schedule-item">
                            {editingTypeId === type.id ? (
                              <>
                                <div className="schedule-info" style={{ flex: 1 }}>
                                  <input
                                    type="text"
                                    value={editingTypeName}
                                    onChange={e => setEditingTypeName(e.target.value)}
                                    onKeyPress={e => {
                                      if (e.key === 'Enter') handleSaveType();
                                      if (e.key === 'Escape') handleCancelEditType();
                                    }}
                                    style={{
                                      width: '90px',
                                      padding: '8px 12px',
                                      border: '1px solid #3b82f6',
                                      borderRadius: '6px',
                                      fontSize: '14px',
                                      outline: 'none'
                                    }}
                                    autoFocus
                                  />
                                </div>
                                <div className="schedule-actions">
                                  <button
                                    className="action-button action-edit"
                                    onClick={handleSaveType}
                                  >บันทึก</button>
                                  <button
                                    className="action-button action-delete"
                                    onClick={handleCancelEditType}
                                  >ยกเลิก</button>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="schedule-info">
                                  <p className="schedule-type">{type.name}</p>
                                </div>
                                <div className="schedule-actions">
                                  <button
                                    className="action-button action-edit"
                                    onClick={() => handleEditType(type)}
                                  >แก้ไข</button>
                                  {/* แก้ไข onClick ให้เรียก wrapper function */}
                                  <button
                                    className="action-button action-delete"
                                    onClick={() => handleDeleteActivityType(type.id)}
                                  >ลบ</button>
                                </div>
                              </>
                            )}
                          </div>
                        )) : (
                          <p className="text-center text-gray-500 py-4">
                            ยังไม่มีกิจกรรมที่บันทึกไว้
                          </p>
                        )}
                      </div>

                      {activityTypes.length > itemsPerPage && (
                        <div className="pagination-controls">
                          <button
                            className="pagination-button"
                            onClick={() => setCurrentTypePage(prev => Math.max(1, prev - 1))}
                            disabled={currentTypePage === 1}
                          >
                            ← ก่อนหน้า
                          </button>
                          <span className="pagination-info">
                            หน้า {currentTypePage} จาก {typeTotalPages} ({activityTypes.length} ประเภท)
                          </span>
                          <button
                            className="pagination-button"
                            onClick={() => setCurrentTypePage(prev => Math.min(typeTotalPages, prev + 1))}
                            disabled={currentTypePage === typeTotalPages}
                          >
                            ถัดไป →
                          </button>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>

              {/* ส่วนแสดงตารางเวลา - ขวา */}
              <div className="list-column-card">
                <div className="list-row-card">
                  <h3 className="text-base font-medium text-gray-900 whitespace-nowrap mr-4">ตารางเวลากิจกรรม</h3>
                  <div className="w-36">
                    <TimeDropdown
                      value={activityFilter}
                      onChange={(value) => {
                        setActivityFilter(value);
                        setCurrentSchedulePage(1);
                      }}
                      timeOptions={['แสดงทั้งหมด', ...new Set(schedules.map(item => item.type))]}
                      placeholder="กรองกิจกรรม"
                    />
                  </div>
                </div>

                {/* Calculate pagination */}
                {(() => {
                  // Filter schedules based on selected filter
                  const filteredSchedules = activityFilter === 'แสดงทั้งหมด'
                    ? schedules
                    : schedules.filter(item => item.type === activityFilter);

                  const totalPages = Math.ceil(filteredSchedules.length / itemsPerPage) || 1;
                  const startIndex = (currentSchedulePage - 1) * itemsPerPage;
                  const endIndex = startIndex + itemsPerPage;
                  const currentSchedules = filteredSchedules.slice(startIndex, endIndex);

                  return (
                    <>
                      <div className="schedule-list">
                        {filteredSchedules.length > 0 ? currentSchedules.map(item => (
                          <div key={item.id} className="schedule-item">
                            <div className="schedule-info">
                              <p className="schedule-type">{item.type}</p>
                              <div className="schedule-day-badge">{item.day}</div>
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
                                  const [startTime, endTime] = item.time.split(' - ');
                                  // ดึง duration จากข้อมูลที่บันทึกไว้
                                  const duration = item.duration || '';
                                  if (duration && !durationOptions.includes(duration)) {
                                    // ถ้า duration ไม่ใช่ใน options แสดงว่าเป็น Custom
                                    setCustomDuration(duration);
                                    setFormData({
                                      type: item.type,
                                      days: [fullDay],
                                      startTime,
                                      endTime,
                                      duration: 'Custom'
                                    });
                                  } else {
                                    setCustomDuration('');
                                    setFormData({
                                      type: item.type,
                                      days: [fullDay],
                                      startTime,
                                      endTime,
                                      duration
                                    });
                                  }
                                  setIsViewMode(false);
                                }}
                              >แก้ไข</button>
                              {/* แก้ไข onClick ให้เรียก wrapper function */}
                              <button
                                className="action-button action-delete"
                                onClick={() => handleDeleteSchedule(item.id)}
                              >ลบ</button>
                            </div>
                          </div>
                        )) : (
                          <div className="empty-state">ยังไม่มีข้อมูลตารางเวลา</div>
                        )}
                      </div>

                      {schedules.length > itemsPerPage && (
                        <div className="pagination-controls">
                          <button
                            className="pagination-button"
                            onClick={() => setCurrentSchedulePage(prev => Math.max(1, prev - 1))}
                            disabled={currentSchedulePage === 1}
                          >
                            ← ก่อนหน้า
                          </button>
                          <span className="pagination-info">
                            หน้า {currentSchedulePage} จาก {totalPages} ({schedules.length} รายการ)
                          </span>
                          <button
                            className="pagination-button"
                            onClick={() => setCurrentSchedulePage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentSchedulePage === totalPages}
                          >
                            ถัดไป →
                          </button>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        )}
      </div>
      {/* ส่วนแสดง Popup */}
      {popupMessage && (
        <PopupModal
          message={popupMessage}
          onClose={() => setPopupMessage("")}
        />
      )}
    </div>
  );
};

export default Admin;