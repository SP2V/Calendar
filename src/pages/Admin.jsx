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
// Icon Palette (จานสี)
const Palette = ({ className = '', ...props }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
    <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
    <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
    <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
  </svg>
);

// Helper: แปลงเวลา "HH:mm" เป็นนาที (เพื่อคำนวณ)
const timeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

const Admin = () => {
  const [schedules, setSchedules] = useState([]);
  const [types, setTypes] = useState(['เลือกประเภทกิจกรรม']);
  const [activityTypes, setActivityTypes] = useState([]);
  const [formData, setFormData] = useState({ type: '', days: [], startTime: '', endTime: '', duration: '' });

  const [newType, setNewType] = useState('');
  const [newColor, setNewColor] = useState('#3B82F6');

  const [editItem, setEditItem] = useState(null);
  const [isViewMode, setIsViewMode] = useState(false);
  const [editingTypeId, setEditingTypeId] = useState(null);
  const [editingTypeName, setEditingTypeName] = useState('');
  const [customDuration, setCustomDuration] = useState('');
  const [currentSchedulePage, setCurrentSchedulePage] = useState(1);
  const [currentTypePage, setCurrentTypePage] = useState(1);
  const [activityFilter, setActivityFilter] = useState('แสดงทั้งหมด');
  const itemsPerPageLeft = 4;
  const itemsPerPageRight = 5;
  const [popupMessage, setPopupMessage] = useState("");

  const days = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];

  const timeOptions = (() => {
    const opts = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 15) {
        opts.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
      }
    }
    return opts;
  })();

  // const durationOptions = [
  //   '30 นาที', '45 นาที', '1 ชั่วโมง', '2 ชั่วโมง', '3 ชั่วโมง', '4 ชั่วโมง', 'Custom'
  // ];

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

  useEffect(() => { setCurrentSchedulePage(1); }, [schedules.length]);
  useEffect(() => { setCurrentTypePage(1); }, [activityTypes.length]);

  // --------------------------- AUTO CLOSE POPUP ---------------------------
  useEffect(() => {
    if (popupMessage) {
      const timer = setTimeout(() => {
        setPopupMessage("");
      }, 1000); // เพิ่มเวลาเป็น 2 วินาทีเพื่อให้คนอ่านทัน
      return () => clearTimeout(timer);
    }
  }, [popupMessage]);

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
    return true;
  };

  // --------------------------- SAVE (ADD & UPDATE) ---------------------------
  const handleSave = async () => {
    if (!validateForm()) return;

    // 1. ตรวจสอบว่าเวลาเริ่มต้องน้อยกว่าเวลาสิ้นสุด
    const newStartMin = timeToMinutes(formData.startTime);
    const newEndMin = timeToMinutes(formData.endTime);

    if (newStartMin >= newEndMin) {
      setPopupMessage('เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้น');
      return;
    }

    const shortDayMap = {
      'อาทิตย์': 'อา.', 'จันทร์': 'จ.', 'อังคาร': 'อ.', 'พุธ': 'พ.',
      'พฤหัสบดี': 'พฤ.', 'ศุกร์': 'ศ.', 'เสาร์': 'ส.'
    };

    // 2. ตรวจสอบการจองเวลาซ้ำ (Overlap Check)
    // หา IDs ที่ต้องยกเว้นการเช็ค (กรณีแก้ไข Group)
    const excludeIds = editItem ? (editItem.ids || [editItem.id]) : [];

    for (const day of formData.days) {
      const shortDay = shortDayMap[day] || day;
      
      // หาตารางที่มีอยู่ในวันนั้นๆ (ไม่รวมรายการที่กำลังแก้ไข)
      const existingInDay = schedules.filter(s => s.day === shortDay && !excludeIds.includes(s.id));

      for (const schedule of existingInDay) {
        const [existStart, existEnd] = schedule.time.split(' - ');
        const existStartMin = timeToMinutes(existStart);
        const existEndMin = timeToMinutes(existEnd);

        // สูตรเช็ค Overlap: (StartA < EndB) && (EndA > StartB)
        if (newStartMin < existEndMin && newEndMin > existStartMin) {
          setPopupMessage(`วัน${day} มีตารางซ้ำกับช่วงเวลา ${schedule.time} (${schedule.type})`);
          return; // หยุดการทำงาน ไม่บันทึก
        }
      }
    }

    // 3. ถ้าผ่านการตรวจสอบ ให้บันทึกข้อมูล
    try {
      if (editItem) {
        if (editItem.ids && Array.isArray(editItem.ids)) {
          await Promise.all(editItem.ids.map(id => deleteScheduleById(id)));
        } else {
          await deleteScheduleById(editItem.id);
        }
      }

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

      setPopupMessage(editItem ? 'อัปเดตข้อมูลสำเร็จ' : 'บันทึกข้อมูลสำเร็จ');
      setEditItem(null);
    } catch (err) {
      console.error(err);
      setPopupMessage('เกิดข้อผิดพลาดในการบันทึก');
    }
  };

  const handleDeleteGroup = async (ids) => {
    if (window.confirm(`คุณต้องการลบรายการกิจกรรมทั้งหมด ${ids.length} วันนี้ใช่หรือไม่?`)) {
      try {
        await Promise.all(ids.map(id => deleteScheduleById(id)));
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
        await addActivityType(trimmed, newColor);
        setFormData({ ...formData, type: trimmed });
        setNewType('');
        setNewColor('#3B82F6');
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

                  {/* ADD NEW */}
                  <div className="input-with-icon-wrapper" style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
                    <input
                      type="text"
                      placeholder="เพิ่มกิจกรรมใหม่..."
                      value={newType}
                      onChange={e => setNewType(e.target.value)}
                      onKeyPress={e => e.key === 'Enter' && handleAddType()}
                      className="add-activity-input"
                      style={{ paddingRight: '40px', width: '100%' }}
                    />
                    <div className="color-picker-container">
                      <input
                        type="color"
                        id="activityColorPickerMain"
                        value={newColor}
                        onChange={(e) => setNewColor(e.target.value)}
                        className="hidden-color-input"
                      />
                      <label htmlFor="activityColorPickerMain" className="color-icon-label" title="เลือกสี">
                        <Palette
                          className="w-5 h-5"
                          style={{ color: newColor, fill: newColor, opacity: 0.8, width: '20px', height: '20px' }}
                        />
                      </label>
                    </div>
                  </div>

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

              {/* SAVE BUTTON */}
              <button onClick={handleSave} className="submit-button">
                {editItem ? 'อัปเดต' : 'บันทึก'}
              </button>
            </div>
          </div>
        ) : (
          <div className="list-card">
            <h2 className="form-title">รายการกิจกรรมทั้งหมด</h2>

            <div className="list-content-grid">
              {/* Left Column: Activity Types */}
              <div className="list-column-card">
                <h3 style={{ fontSize: '1rem', marginBottom: '1rem', marginTop: '0', color: '#333' }}>กิจกรรม</h3>
                {(() => {
                  const typeTotalPages = Math.ceil(activityTypes.length / itemsPerPageLeft) || 1;
                  const typeStartIndex = (currentTypePage - 1) * itemsPerPageLeft;
                  const currentTypes = activityTypes.slice(typeStartIndex, typeStartIndex + itemsPerPageLeft);

                  return (
                    <>
                      <div className="schedule-list">
                        <div className='schedule-list-add-input' style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div className="input-with-icon-wrapper" style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
                            <input
                              type="text"
                              placeholder="เพิ่มกิจกรรมใหม่..."
                              value={newType}
                              onChange={e => setNewType(e.target.value)}
                              onKeyPress={e => e.key === 'Enter' && handleAddType()}
                              className="add-activity-input"
                              style={{ paddingRight: '40px', width: '100%' }}
                            />
                            <div className="color-picker-container">
                              <input
                                type="color"
                                id="activityColorPickerList"
                                value={newColor}
                                onChange={(e) => setNewColor(e.target.value)}
                                className="hidden-color-input"
                              />
                              <label htmlFor="activityColorPickerList" className="color-icon-label" title="เลือกสี">
                                <Palette
                                  className="w-5 h-5"
                                  style={{ color: newColor, fill: newColor, opacity: 0.8, width: '20px', height: '20px' }}
                                />
                              </label>
                            </div>
                          </div>
                          <button type="button" onClick={handleAddType} className="add-activity-btn" style={{ flexShrink: 0 }}>
                            <Plus className="button-icon" /> เพิ่ม
                          </button>
                        </div>

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
                                  <button className="action-button action-edit" onClick={handleSaveType}>บันทึก</button>
                                  <button className="action-button action-delete" onClick={handleCancelEditType}>ยกเลิก</button>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="schedule-info" style={{ display: 'flex', alignItems: 'center' }}>
                                  <div
                                    style={{
                                      width: '14px',
                                      height: '14px',
                                      borderRadius: '50%',
                                      backgroundColor: type.color || '#e5e7eb',
                                      marginRight: '10px',
                                      border: '1px solid rgba(0,0,0,0.1)',
                                      flexShrink: 0
                                    }}
                                  />
                                  <p className="schedule-type" style={{ margin: 0 }}>{type.name}</p>
                                </div>
                                <div className="schedule-actions">
                                  <button className="action-button action-edit" onClick={() => handleEditType(type)}>แก้ไข</button>
                                  <button className="action-button action-delete" onClick={() => handleDeleteActivityType(type.id)}>ลบ</button>
                                </div>
                              </>
                            )}
                          </div>
                        )) : (
                          <p className="text-center text-gray-500 py-4">ยังไม่มีกิจกรรมที่บันทึกไว้</p>
                        )}
                      </div>

                      {activityTypes.length > itemsPerPageLeft && (
                        <div className="pagination-controls">
                          <button
                            className="pagination-button"
                            onClick={() => setCurrentTypePage(prev => Math.max(1, prev - 1))}
                            disabled={currentTypePage === 1}
                          >← ก่อนหน้า</button>
                          <span className="pagination-info">หน้า {currentTypePage} จาก {typeTotalPages}</span>
                          <button
                            className="pagination-button"
                            onClick={() => setCurrentTypePage(prev => Math.min(typeTotalPages, prev + 1))}
                            disabled={currentTypePage === typeTotalPages}
                          >ถัดไป →</button>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>

              {/* Right Column: Schedule List */}
              <div className="list-column-card">
                <div className="list-row-card">
                  <h3 style={{ fontSize: '1rem', marginBottom: '1rem', marginTop: '0', color: '#333' }}>ตารางเวลากิจกรรม</h3>
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

                {(() => {
                  // 1. กรองข้อมูล
                  const filteredSchedules = activityFilter === 'แสดงทั้งหมด'
                    ? schedules
                    : schedules.filter(item => item.type === activityFilter);

                  // 2. กำหนดลำดับวัน
                  const dayOrder = { 'อา.': 0, 'จ.': 1, 'อ.': 2, 'พ.': 3, 'พฤ.': 4, 'ศ.': 5, 'ส.': 6 };

                  // 3. Grouping Logic
                  const groupedMap = {};
                  filteredSchedules.forEach(item => {
                    const key = `${item.type}|${item.time}|${item.duration}`;
                    if (!groupedMap[key]) {
                      groupedMap[key] = {
                        ...item,
                        days: [item.day],
                        ids: [item.id]
                      };
                    } else {
                      if (!groupedMap[key].days.includes(item.day)) {
                        groupedMap[key].days.push(item.day);
                      }
                      groupedMap[key].ids.push(item.id);
                    }
                  });
                  let groupedSchedules = Object.values(groupedMap);

                  // 4. Sort
                  groupedSchedules = groupedSchedules.sort((a, b) => {
                    // Sort days inside group
                    a.days.sort((d1, d2) => (dayOrder[d1] || 99) - (dayOrder[d2] || 99));
                    b.days.sort((d1, d2) => (dayOrder[d1] || 99) - (dayOrder[d2] || 99));

                    // Sort by first day
                    const firstDayA = dayOrder[a.days[0]] || 99;
                    const firstDayB = dayOrder[b.days[0]] || 99;
                    if (firstDayA !== firstDayB) return firstDayA - firstDayB;

                    // Sort by type
                    const typeCompare = a.type.localeCompare(b.type, 'th');
                    if (typeCompare !== 0) return typeCompare;

                    // Sort by time
                    return a.time.localeCompare(b.time);
                  });

                  // 5. Pagination
                  const totalPages = Math.ceil(groupedSchedules.length / itemsPerPageRight) || 1;
                  const startIndex = (currentSchedulePage - 1) * itemsPerPageRight;
                  const endIndex = startIndex + itemsPerPageRight;
                  const currentSchedules = groupedSchedules.slice(startIndex, endIndex);

                  return (
                    <>
                      <div className="schedule-list">
                        {groupedSchedules.length > 0 ? currentSchedules.map((item, index) => {
                          const activityColor = activityTypes.find(t => t.name === item.type)?.color || '#e5e7eb';

                          return (
                            <div key={`${item.type}-${item.time}-${index}`} className="schedule-item">
                              <div className="schedule-info">
                                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                                  <div
                                    style={{
                                      width: '12px',
                                      height: '12px',
                                      borderRadius: '50%',
                                      backgroundColor: activityColor,
                                      marginRight: '8px',
                                      border: '1px solid rgba(0,0,0,0.1)'
                                    }}
                                  />
                                  <p className="schedule-type" style={{ margin: 0 }}>{item.type}</p>
                                </div>
                                <div style={{display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '4px'}}>
                                  {item.days.map(d => (
                                      <div key={d} className="schedule-day-badge">{d}</div>
                                  ))}
                                </div>
                                <p className="schedule-time">{item.time}</p>
                              </div>

                              <div className="schedule-actions">
                                <button
                                  className="action-button action-edit"
                                  onClick={() => {
                                    setEditItem(item);
                                    const fullDayMap = { 'อา.': 'อาทิตย์', 'จ.': 'จันทร์', 'อ.': 'อังคาร', 'พ.': 'พุธ', 'พฤ.': 'พฤหัสบดี', 'ศ.': 'ศุกร์', 'ส.': 'เสาร์' };
                                    const fullDays = item.days.map(d => fullDayMap[d] || d);
                                    
                                    const [startTime, endTime] = item.time.split(' - ');
                                    const duration = item.duration || '';

                                    if (duration && !durationOptions.includes(duration)) {
                                      setCustomDuration(duration);
                                      setFormData({ type: item.type, days: fullDays, startTime, endTime, duration: 'Custom' });
                                    } else {
                                      setCustomDuration('');
                                      setFormData({ type: item.type, days: fullDays, startTime, endTime, duration });
                                    }
                                    setIsViewMode(false);
                                  }}
                                >แก้ไข</button>
                                <button className="action-button action-delete" onClick={() => handleDeleteGroup(item.ids)}>ลบ</button>
                              </div>
                            </div>
                          );
                        }) : (
                          <div className="empty-state">ยังไม่มีข้อมูลตารางเวลา</div>
                        )}
                      </div>

                      {groupedSchedules.length > itemsPerPageRight && (
                        <div className="pagination-controls">
                          <button
                            className="pagination-button"
                            onClick={() => setCurrentSchedulePage(prev => Math.max(1, prev - 1))}
                            disabled={currentSchedulePage === 1}
                          >← ก่อนหน้า</button>
                          <span className="pagination-info">หน้า {currentSchedulePage} จาก {totalPages}</span>
                          <button
                            className="pagination-button"
                            onClick={() => setCurrentSchedulePage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentSchedulePage === totalPages}
                          >ถัดไป →</button>
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