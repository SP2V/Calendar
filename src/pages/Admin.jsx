// นำเข้า useState hook จาก React สำหรับจัดการ state
import { useState, useEffect } from 'react'
// นำเข้า CSS สำหรับ Admin component
import './Admin.css'
// นำเข้า Calendar component
import Calendar from '../components/Calendar'

/**
 * Admin Component - หน้า Admin สำหรับจัดการ Time Slots และแสดงปฏิทิน
 * แบ่งเป็น 2 ส่วน: ตาราง Time Slots (ซ้าย) และ ปฏิทิน (ขวา)
 */
function Admin() {
  // State สำหรับเก็บรายการ Time Slots (โหลดจาก localStorage ตอนเริ่ม)
  const [timeSlots, setTimeSlots] = useState(() => {
    try {
      const raw = localStorage.getItem('timeSlots')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) return parsed
      }
    } catch {
      // ignore
    }
    return []
  })

  // State สำหรับเก็บข้อมูล Time Slot ใหม่ที่กำลังจะเพิ่ม
  const [newTimeSlot, setNewTimeSlot] = useState({
    activityId: '',
    dayTimes: {}, // object เก็บเวลาของแต่ละวัน เช่น { monday: { startTime: '09:00', endTime: '10:00' }, ... }
    color: '#4a90e2',
    isRecurring: true, // true = ซ้ำทุก week, false = ไม่ซ้ำ
    specificDates: [] // สำหรับกรณีไม่ซ้ำ: [{ date: 'YYYY-MM-DD', startTime: '09:00', endTime: '10:00' }, ...]
  })

  // รายชื่อวันในสัปดาห์
  const daysOfWeek = [
    { value: 'monday', label: 'จันทร์', abbr: 'จ.', order: 1 },
    { value: 'tuesday', label: 'อังคาร', abbr: 'อ.', order: 2 },
    { value: 'wednesday', label: 'พุธ', abbr: 'พ.', order: 3 },
    { value: 'thursday', label: 'พฤหัสบดี', abbr: 'พฤ.', order: 4 },
    { value: 'friday', label: 'ศุกร์', abbr: 'ศ.', order: 5 },
    { value: 'saturday', label: 'เสาร์', abbr: 'ส.', order: 6 },
    { value: 'sunday', label: 'อาทิตย์', abbr: 'อา.', order: 7 }
  ]

  // ล้างฟอร์ม (ใช้ทั้งปุ่มยกเลิกและหลังบันทึก)
  const resetNewTimeSlot = () => {
    setNewTimeSlot({
      activityId: '',
      dayTimes: {},
      color: '#4a90e2',
      isRecurring: true,
      specificDates: []
    })
  }

  // ควบคุมการแสดงฟอร์มเพิ่มกิจกรรมหรือรายการกิจกรรม
  const [showAddForm, setShowAddForm] = useState(true)

  // เก็บรายการ timeSlots ลง localStorage ทุกครั้งที่มีการเปลี่ยนแปลง
  useEffect(() => {
    try {
      localStorage.setItem('timeSlots', JSON.stringify(timeSlots))
    } catch (err) {
      console.warn('Failed to save timeSlots', err)
    }
  }, [timeSlots])

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
    const hasSpecific = newTimeSlot.specificDates && newTimeSlot.specificDates.some(d => d.date && d.startTime && d.endTime)
    const ok = newTimeSlot.activityId && (newTimeSlot.isRecurring ? selectedDays.length > 0 : hasSpecific)

    if (ok) {
      const slotObj = {
        id: Date.now(),
        activityId: newTimeSlot.activityId,
        dayTimes: { ...newTimeSlot.dayTimes },
        color: newTimeSlot.color || '#4a90e2',
        isRecurring: newTimeSlot.isRecurring
      }

      if (newTimeSlot.isRecurring) {
        // startDate controls from when a recurring slot is active (midnight of today)
        const now = new Date()
        slotObj.startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
      } else {
        // for non-recurring store specificDates
        slotObj.specificDates = (newTimeSlot.specificDates || []).filter(d => d.date && d.startTime && d.endTime)
      }

      setTimeSlots([...timeSlots, slotObj])

      // รีเซ็ตฟอร์มให้เป็นค่าว่าง
      resetNewTimeSlot()
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
    
    return sortedDays.map(d => d?.abbr).join(', ')
  }

  return (
    <div className="admin-container">
      <div className="admin-layout">
        {/* ส่วนซ้าย: ตาราง Time Slots */}
        <div className="time-slots-section">

          <div className="left-controls" style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <button 
              type="button" 
              className={`btn-add-event ${showAddForm ? 'btn-active' : 'btn-inactive'}`}
              onClick={() => setShowAddForm(true)} 
              style={{ flex: 1 }}
            >
              ✚ เพิ่มกิจกรรม
            </button>
            <button 
              type="button" 
              className={`btn-add-event ${!showAddForm ? 'btn-active' : 'btn-inactive'}`}
              onClick={() => setShowAddForm(false)} 
              style={{ flex: 1 }}
            >
              📋 รายการกิจกรรม
            </button>
          </div>

          {/* ฟอร์มเพิ่มกิจกรรม แสดงที่ด้านซ้ายโดยตรง (ไม่เป็น modal) */}
          {showAddForm ? (
            <form onSubmit={handleAddTimeSlot} className="add-time-slot-form modal-form">
            {/* ฟิลด์กรอก Activity ID */}
            <div className="form-field-group">
              <label className="form-label">ชื่อกิจกรรม</label>
              <input
                type="text"
                value={newTimeSlot.activityId}
                onChange={(e) => setNewTimeSlot({ ...newTimeSlot, activityId: e.target.value })}
                placeholder="กรอก Activity ID"
                className="form-input"
                autoFocus
              />
            </div>

            {/* ฟิลด์เลือกวันแบบ Checkbox พร้อมเวลา */}
            <div className="form-field-group">
              <label className="form-label">เลือกวันและกำหนดเวลา</label>

              {/* ถ้าเป็น recurring ให้เลือกวันในสัปดาห์เป็น checkbox */}
              {newTimeSlot.isRecurring ? (
                <div className="day-times-container">
                  {daysOfWeek.map(day => {
                    const isSelected = !!newTimeSlot.dayTimes[day.value]

                    return (
                      <div key={day.value} className="day-time-item">
                        <label className="day-checkbox-label">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewTimeSlot({
                                  ...newTimeSlot,
                                  dayTimes: {
                                    ...newTimeSlot.dayTimes,
                                    [day.value]: { startTime: '09:00', endTime: '17:00' }
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
                          <span className="day-label">{day.abbr || day.label}</span>
                        </label>

                        {isSelected && (
                          <div className="time-inputs-inline">
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
                              className="time-input"
                            />
                            <span className="time-dash">−</span>
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
                              className="time-input"
                            />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="specific-dates-container">
                  {newTimeSlot.specificDates && newTimeSlot.specificDates.map((d, i) => (
                    <div className="specific-date-row" key={i}>
                      <input
                        type="date"
                        value={d.date}
                        onChange={(e) => {
                          const updated = (newTimeSlot.specificDates || []).slice()
                          updated[i] = { ...updated[i], date: e.target.value }
                          setNewTimeSlot({ ...newTimeSlot, specificDates: updated })
                        }}
                      />
                      <input
                        type="time"
                        value={d.startTime}
                        onChange={(e) => {
                          const updated = (newTimeSlot.specificDates || []).slice()
                          updated[i] = { ...updated[i], startTime: e.target.value }
                          setNewTimeSlot({ ...newTimeSlot, specificDates: updated })
                        }}
                        className="time-input"
                      />
                      <span className="time-dash">−</span>
                      <input
                        type="time"
                        value={d.endTime}
                        onChange={(e) => {
                          const updated = (newTimeSlot.specificDates || []).slice()
                          updated[i] = { ...updated[i], endTime: e.target.value }
                          setNewTimeSlot({ ...newTimeSlot, specificDates: updated })
                        }}
                        className="time-input"
                      />
                      <button type="button" className="btn-delete" onClick={() => {
                        const updated = (newTimeSlot.specificDates || []).slice()
                        updated.splice(i, 1)
                        setNewTimeSlot({ ...newTimeSlot, specificDates: updated })
                      }}>ลบ</button>
                    </div>
                  ))}

                  <div style={{ marginTop: '0.5rem' }}>
                    <button type="button" className="btn-add" onClick={() => {
                      const updated = (newTimeSlot.specificDates || []).slice()
                      updated.push({ date: '', startTime: '09:00', endTime: '10:00' })
                      setNewTimeSlot({ ...newTimeSlot, specificDates: updated })
                    }}>+ เพิ่มวันที่</button>
                  </div>
                </div>
              )}

            </div>

            {/* ฟิลด์สีและซ้ำทุก week ในแถวเดียว */}
            <div className="form-field-group form-options-row">
              <div className="form-option">
                <label className="form-label">สี</label>
                <input
                  type="color"
                  value={newTimeSlot.color}
                  onChange={(e) => setNewTimeSlot({ ...newTimeSlot, color: e.target.value })}
                  className="color-input"
                />
              </div>
              <div className="form-option">
                <label className="form-label">ซ้ำทุก Week</label>
                <select
                  value={newTimeSlot.isRecurring ? 'yes' : 'no'}
                  onChange={(e) => setNewTimeSlot({ ...newTimeSlot, isRecurring: e.target.value === 'yes' })}
                  className="form-select"
                >
                  <option value="yes">ใช่</option>
                  <option value="no">ไม่ใช่</option>
                </select>
              </div>
            </div>

            {/* ปุ่ม */}
            <div className="modal-footer" style={{ padding: 0, marginTop: 0 }}>
              <button 
                type="button"
                onClick={() => resetNewTimeSlot()}
                className="btn-cancel"
              >
                ยกเลิก
              </button>
              <button 
                type="submit"
                className="btn-submit"
              >
                บันทึก
              </button>
            </div>
          </form>

          ) : (
            <div className="time-slots-table">
              <table>
              <thead>
                <tr>
                  <th>Activity ID</th>
                  <th>สี</th>
                  <th>วัน</th>
                  <th>เวลา</th>
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
                        <td>{slot.isRecurring ? getDayRangeLabel(slot.dayTimes) : (slot.specificDates ? slot.specificDates.map(d => d.date).join(', ') : '')}</td>
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
          )}
        </div>

        {/* ส่วนขวา: ปฏิทิน */}
        <div className="calendar-section">

          {/* แสดง Calendar component */}
          <Calendar timeSlots={timeSlots} />
        </div>
      </div>

      
    </div>
  )
}

export default Admin
