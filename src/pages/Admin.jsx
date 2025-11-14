// นำเข้า useState hook จาก React สำหรับจัดการ state
import { useState } from 'react'
// นำเข้า CSS สำหรับ Admin component
import './Admin.css'
// นำเข้า Calendar component
import Calendar from '../components/Calendar'

/**
 * Admin Component - หน้า Admin สำหรับจัดการ Time Slots และแสดงปฏิทิน
 * แบ่งเป็น 2 ส่วน: ตาราง Time Slots (ซ้าย) และ ปฏิทิน (ขวา)
 */
function Admin() {
  // State สำหรับเก็บรายการ Time Slots
  const [timeSlots, setTimeSlots] = useState([])

  // State สำหรับแสดง/ซ่อน modal สำหรับเพิ่ม Time Slot
  const [showAddModal, setShowAddModal] = useState(false)

  // State สำหรับเก็บข้อมูล Time Slot ใหม่ที่กำลังจะเพิ่ม
  const [newTimeSlot, setNewTimeSlot] = useState({
    activityId: '',
    dayTimes: {}, // object เก็บเวลาของแต่ละวัน เช่น { monday: { startTime: '09:00', endTime: '10:00' }, ... }
    color: '#4a90e2',
    isRecurring: true // true = ซ้ำทุก week, false = ไม่ซ้ำ
  })

  // รายชื่อวันในสัปดาห์
  const daysOfWeek = [
    { value: 'monday', label: 'จันทร์', order: 1 },
    { value: 'tuesday', label: 'อังคาร', order: 2 },
    { value: 'wednesday', label: 'พุธ', order: 3 },
    { value: 'thursday', label: 'พฤหัสบดี', order: 4 },
    { value: 'friday', label: 'ศุกร์', order: 5 },
    { value: 'saturday', label: 'เสาร์', order: 6 },
    { value: 'sunday', label: 'อาทิตย์', order: 7 }
  ]

  /**
   * ฟังก์ชันสำหรับเพิ่ม Time Slot ใหม่
   * @param {Event} e - event object จาก form submission
   */
  const handleAddTimeSlot = (e) => {
    e.preventDefault() // ป้องกันการ reload หน้าเมื่อ submit form
    
    // ดึงวันที่เลือก (keys ของ dayTimes ที่มีค่า)
    const selectedDays = Object.keys(newTimeSlot.dayTimes).filter(day => 
      newTimeSlot.dayTimes[day].startTime && newTimeSlot.dayTimes[day].endTime
    )
    
    // ตรวจสอบว่ามีข้อมูลครบถ้วนแล้ว
    if (newTimeSlot.activityId && selectedDays.length > 0) {
      // เพิ่ม Time Slot ใหม่เข้าไปใน array (รวมสี)
      setTimeSlots([...timeSlots, {
        id: timeSlots.length + 1,
        activityId: newTimeSlot.activityId,
        dayTimes: { ...newTimeSlot.dayTimes },
        color: newTimeSlot.color || '#4a90e2',
        isRecurring: newTimeSlot.isRecurring
      }])
      
      // รีเซ็ตฟอร์มให้เป็นค่าว่าง
      setNewTimeSlot({
        activityId: '',
        dayTimes: {},
        color: '#4a90e2',
        isRecurring: true
      })

      // ปิด modal
      setShowAddModal(false)
    }
  }

  /**
   * ฟังก์ชันสำหรับลบ Time Slot
   * @param {number} id - ID ของ Time Slot ที่ต้องการลบ
   */
  const handleDeleteTimeSlot = (id) => {
    // กรอง Time Slot ออกโดยเก็บเฉพาะ Time Slot ที่ id ไม่เท่ากับ id ที่ส่งมา
    setTimeSlots(timeSlots.filter(slot => slot.id !== id))
  }

  /**
   * ฟังก์ชันสำหรับแปลงช่วงวันเป็นชื่อวันภาษาไทย
   * @param {Object} dayTimes - object ของวันและเวลา
   * @returns {string} ชื่อวันภาษาไทยในรูปแบบรายการ
   */
  const getDayRangeLabel = (dayTimes) => {
    if (!dayTimes || Object.keys(dayTimes).length === 0) return ''
    
    // เรียงลำดับวันตามลำดับสัปดาห์
    const selectedDayValues = Object.keys(dayTimes).filter(day => dayTimes[day].startTime && dayTimes[day].endTime)
    const sortedDays = selectedDayValues
      .map(dayValue => daysOfWeek.find(d => d.value === dayValue))
      .sort((a, b) => (a?.order || 0) - (b?.order || 0))
    
    return sortedDays.map(d => d?.label).join(', ')
  }

  return (
    <div className="admin-container">
      <div className="admin-layout">
        {/* ส่วนซ้าย: ตาราง Time Slots */}
        <div className="time-slots-section">
          {/* หัวข้อส่วน Time Slots */}
          <div className="section-header">
            <span className="section-icon">📅</span>
            <h2>ตาราง Time Slots</h2>
          </div>

          {/* ปุ่มเพิ่ม Event */}
          <button 
            onClick={() => setShowAddModal(true)}
            className="btn-add-event"
          >
            <span className="btn-icon">+</span>
            เพิ่มกิจกรรม
          </button>

          {/* ตารางแสดง Time Slots */}
          <div className="time-slots-table">
            <table>
              <thead>
                <tr>
                  <th>Activity ID</th>
                  <th>สี</th>
                  <th>วัน</th>
                  <th>เวลา</th>
                  <th>ซ้ำ</th>
                  <th>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {timeSlots.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="empty-message">
                      ยังไม่มี Time Slots
                    </td>
                  </tr>
                ) : (
                  timeSlots.map(slot => {
                    // สร้างรายการเวลาของแต่ละวัน
                    const dayTimesList = Object.keys(slot.dayTimes)
                      .filter(day => slot.dayTimes[day].startTime && slot.dayTimes[day].endTime)
                      .map(day => {
                        const dayLabel = daysOfWeek.find(d => d.value === day)?.label || day
                        return `${dayLabel} ${slot.dayTimes[day].startTime}-${slot.dayTimes[day].endTime}`
                      })
                    
                    return (
                      <tr key={slot.id}>
                        <td>{slot.activityId}</td>
                        <td>
                          <span
                            className="color-swatch"
                            style={{ background: slot.color || '#4a90e2' }}
                            title={slot.color || '#4a90e2'}
                          />
                        </td>
                        <td>{getDayRangeLabel(slot.dayTimes)}</td>
                        <td>
                          <div style={{ fontSize: '0.65rem', lineHeight: '1.2' }}>
                            {dayTimesList.length > 0 ? (
                              dayTimesList.map((time, idx) => (
                                <div key={idx}>{time}</div>
                              ))
                            ) : (
                              <span>-</span>
                            )}
                          </div>
                        </td>
                        <td>{slot.isRecurring ? '✓' : '✗'}</td>
                        <td>
                          <button
                            onClick={() => handleDeleteTimeSlot(slot.id)}
                            className="btn-delete"
                          >
                            ลบ
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ส่วนขวา: ปฏิทิน */}
        <div className="calendar-section">
          {/* หัวข้อส่วนปฏิทิน */}
          <div className="section-header">
            <span className="section-icon">📅</span>
            <h2>ปฏิทิน</h2>
          </div>

          {/* แสดง Calendar component */}
          <Calendar timeSlots={timeSlots} />
        </div>
      </div>

      {/* Modal สำหรับเพิ่ม Event */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>เพิ่มกิจกรรมใหม่</h2>
              <button 
                className="modal-close"
                onClick={() => setShowAddModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddTimeSlot} className="modal-form">
              {/* ฟิลด์กรอก Activity ID */}
              <div className="form-row">
                <div className="form-field">
                  <label>Activity ID</label>
                  <input
                    type="text"
                    value={newTimeSlot.activityId}
                    onChange={(e) => setNewTimeSlot({ ...newTimeSlot, activityId: e.target.value })}
                    placeholder="กรอก Activity ID"
                    autoFocus
                  />
                </div>
              </div>

              {/* ฟิลด์เลือกวันแบบ Checkbox พร้อมเวลา */}
              <div className="form-row">
                <div className="form-field">
                  <label>เลือกวันและกำหนดเวลา</label>
                  <div className="day-time-group">
                    {daysOfWeek.map(day => {
                      const isSelected = !!newTimeSlot.dayTimes[day.value]
                      
                      return (
                        <div key={day.value} className="day-time-row">
                          <label className="checkbox-label">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setNewTimeSlot({
                                    ...newTimeSlot,
                                    dayTimes: {
                                      ...newTimeSlot.dayTimes,
                                      [day.value]: { startTime: '', endTime: '' }
                                    }
                                  })
                                } else {
                                  const updatedDayTimes = { ...newTimeSlot.dayTimes }
                                  delete updatedDayTimes[day.value]
                                  setNewTimeSlot({
                                    ...newTimeSlot,
                                    dayTimes: updatedDayTimes
                                  })
                                }
                              }}
                            />
                            <span>{day.label}</span>
                          </label>
                          
                          {isSelected && (
                            <div className="time-inputs">
                              <input
                                type="time"
                                value={newTimeSlot.dayTimes[day.value].startTime}
                                onChange={(e) => setNewTimeSlot({
                                  ...newTimeSlot,
                                  dayTimes: {
                                    ...newTimeSlot.dayTimes,
                                    [day.value]: {
                                      ...newTimeSlot.dayTimes[day.value],
                                      startTime: e.target.value
                                    }
                                  }
                                })}
                                placeholder="Start"
                                title="เวลาเริ่มต้น"
                              />
                              <span className="time-separator">-</span>
                              <input
                                type="time"
                                value={newTimeSlot.dayTimes[day.value].endTime}
                                onChange={(e) => setNewTimeSlot({
                                  ...newTimeSlot,
                                  dayTimes: {
                                    ...newTimeSlot.dayTimes,
                                    [day.value]: {
                                      ...newTimeSlot.dayTimes[day.value],
                                      endTime: e.target.value
                                    }
                                  }
                                })}
                                placeholder="End"
                                title="เวลาสิ้นสุด"
                              />
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* ฟิลด์เลือกสีของกิจกรรม */}
              <div className="form-row">
                <div className="form-field">
                  <label>สีของกิจกรรม</label>
                  <input
                    type="color"
                    value={newTimeSlot.color}
                    onChange={(e) => setNewTimeSlot({ ...newTimeSlot, color: e.target.value })}
                    title="เลือกสีสำหรับกิจกรรมนี้"
                  />
                </div>
              </div>

              {/* ฟิลด์เลือกซ้ำทุก week */}
              <div className="form-row">
                <div className="form-field">
                  <label>ซ้ำทุก Week</label>
                  <select
                    value={newTimeSlot.isRecurring ? 'yes' : 'no'}
                    onChange={(e) => setNewTimeSlot({ ...newTimeSlot, isRecurring: e.target.value === 'yes' })}
                  >
                    <option value="yes">ซ้ำทุก Week</option>
                    <option value="no">ไม่ซ้ำทุก Week</option>
                  </select>
                </div>
              </div>

              {/* ปุ่ม */}
              <div className="modal-footer">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-cancel"
                >
                  ยกเลิก
                </button>
                <button 
                  type="submit"
                  className="btn-submit"
                >
                  เพิ่มกิจกรรม
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Admin
