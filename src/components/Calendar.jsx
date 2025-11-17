// นำเข้า useState hook จาก React สำหรับจัดการ state
import { useState } from 'react'
// นำเข้า CSS สำหรับ Calendar component
import './Calendar.css'

/**
 * Calendar Component - แสดงปฏิทินแบบเดือน
 *
 * คำอธิบายโดยรวม:
 * - สร้างกริด 6 แถว x 7 คอลัมน์ (42 เซลล์) เพื่อให้ครอบคลุมทุกเดือน
 * - แต่ละวันจะถูกคำนวณจาก `currentDate` (เดือน/ปีปัจจุบัน)
 * - รับค่า `timeSlots` จาก props ซึ่งเป็น list ของ slot ที่สร้างโดย Admin
 *
 * การกรองเหตุการณ์สำหรับวันหนึ่ง ๆ:
 * - recurring slots: มี `dayTimes` สำหรับวันในสัปดาห์นั้น ๆ และ (ถ้ามี) `startDate` จะกำหนดไม่ให้แสดงย้อนหลัง
 * - non-recurring slots: เก็บอยู่ใน `specificDates` ที่ระบุเป็น 'YYYY-MM-DD' และต้องมีเวลาเริ่ม/เลิก
 *
 * การแสดงผล:
 * - ในแต่ละเซลล์วัน จะแสดงจุดสีตาม `slot.color` และนับจำนวนกิจกรรม
 */
function Calendar({ timeSlots = [] }) {
  // State สำหรับเก็บเดือนและปีปัจจุบัน
  const [currentDate, setCurrentDate] = useState(new Date())

  // ดึงข้อมูลเดือนและปีปัจจุบัน
  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()

  /**
   * ฟังก์ชันสำหรับเปลี่ยนเดือน (ไปเดือนก่อนหน้า)
   */
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1))
  }

  /**
   * ฟังก์ชันสำหรับเปลี่ยนเดือน (ไปเดือนถัดไป)
   */
  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1))
  }

  /**
   * ฟังก์ชันสำหรับกลับไปเดือนปัจจุบัน
   */
  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // ชื่อเดือนภาษาไทย
  const monthNames = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ]

  // ชื่อวันภาษาไทย
  const dayNames = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']

  /**
   * ฟังก์ชันสำหรับสร้าง array ของวันในเดือน
   * @returns {Array} array ของวันในเดือนพร้อมวันว่างก่อนหน้าและหลัง
   */
  const getDaysInMonth = () => {
    // วันแรกของเดือน
    const firstDay = new Date(currentYear, currentMonth, 1)
    // วันสุดท้ายของเดือน
    const lastDay = new Date(currentYear, currentMonth + 1, 0)
    
    // จำนวนวันในเดือน
    const daysInMonth = lastDay.getDate()
    // วันแรกของเดือนเป็นวันอะไร (0 = อาทิตย์, 1 = จันทร์, ...)
    const startingDayOfWeek = firstDay.getDay()
    // วันสุดท้ายของเดือนเป็นวันอะไร (ค่าถูกคำนวณแต่ไม่จำเป็นต้องเก็บ)

    const days = []

    // เพิ่มวันว่างก่อนวันแรกของเดือน
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }

    // เพิ่มวันในเดือน
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day)
    }

    // เพิ่มวันว่างหลังวันสุดท้ายของเดือนเพื่อให้ครบ 6 แถว (42 วัน)
    // คำนวณจำนวนวันว่างที่ต้องเพิ่ม: 42 - (วันว่างก่อนหน้า + วันในเดือน)
    const totalCells = 42 // 6 แถว x 7 วัน
    const emptyCellsAfter = totalCells - days.length
    
    for (let i = 0; i < emptyCellsAfter; i++) {
      days.push(null)
    }

    return days
  }

  /**
   * ฟังก์ชันสำหรับแปลงตัวเลขวัน (0-6) เป็นชื่อวันในสัปดาห์
   * @param {number} dayIndex - ตัวเลขวัน (0 = อาทิตย์, 1 = จันทร์, ...)
   * @returns {string} ชื่อวันในสัปดาห์ (monday, tuesday, ...)
   */
  const getDayOfWeekFromDate = (dayIndex) => {
    const dayMap = {
      0: 'sunday',
      1: 'monday',
      2: 'tuesday',
      3: 'wednesday',
      4: 'thursday',
      5: 'friday',
      6: 'saturday'
    }
    return dayMap[dayIndex] || ''
  }


  /**
   * ฟังก์ชันสำหรับตรวจสอบว่าวันนี้มี Time Slot หรือไม่
   * @param {number} day - วันที่
   * @returns {boolean} true ถ้ามี Time Slot ในวันนั้น
   */
  // NOTE: calendar filtering logic now lives in getTimeSlotsForDay; helper removed

  /**
   * ฟังก์ชันสำหรับดึง Time Slots ของวันนั้นๆ
   *
   * หลักการคัดกรอง:
   * - คืนค่า array ของ slot ที่มีเวลาที่ใช้งานในวันนั้น
   * - สำหรับ recurring: ตรวจสอบว่า `dayTimes` มีข้อมูลสำหรับ weekday นั้นและมีค่า start/end
   *   จากนั้นถ้ามี `startDate` ให้เปรียบเทียบวันที่ (midnight) เพื่อไม่ให้แสดงก่อนวันเริ่ม
   * - สำหรับ non-recurring: เปรียบเทียบรูปแบบวันที่ 'YYYY-MM-DD' กับรายการใน `specificDates`
   *
   * @param {number} day - วันที่ของเดือน (1..31 หรือ null ถ้าเซลล์ว่าง)
   * @returns {Array} array ของ Time Slots ในวันนั้น
   */
  const getTimeSlotsForDay = (day) => {
    if (!day) return []
    
    // สร้าง Date object สำหรับวันนั้น
    const date = new Date(currentYear, currentMonth, day)
    const dayOfWeek = getDayOfWeekFromDate(date.getDay())
    
    // กรอง Time Slots ที่วันนี้ตรงกับเงื่อนไข
    return timeSlots.filter(slot => {
      // recurring slot: must have dayTimes for that weekday, and respect startDate if provided
      if (slot.isRecurring) {
        if (!slot.dayTimes || !slot.dayTimes[dayOfWeek]) return false
        if (!slot.dayTimes[dayOfWeek].startTime || !slot.dayTimes[dayOfWeek].endTime) return false

        if (slot.startDate) {
          const start = new Date(slot.startDate)
          const startMid = new Date(start.getFullYear(), start.getMonth(), start.getDate())
          const targetMid = new Date(date.getFullYear(), date.getMonth(), date.getDate())
          return targetMid >= startMid
        }

        return true
      }

      // non-recurring: check specificDates array
      if (slot.specificDates && Array.isArray(slot.specificDates)) {
        const y = date.getFullYear()
        const m = String(date.getMonth() + 1).padStart(2, '0')
        const d = String(date.getDate()).padStart(2, '0')
        const iso = `${y}-${m}-${d}`
        return slot.specificDates.some(sd => sd.date === iso && sd.startTime && sd.endTime)
      }

      return false
    })
  }

  /**
   * ฟังก์ชันสำหรับตรวจสอบว่าวันนี้เป็นวันปัจจุบันหรือไม่
   * @param {number} day - วันที่
   * @returns {boolean} true ถ้าเป็นวันปัจจุบัน
   */
  const isToday = (day) => {
    if (!day) return false
    const today = new Date()
    return (
      day === today.getDate() &&
      currentMonth === today.getMonth() &&
      currentYear === today.getFullYear()
    )
  }

  const days = getDaysInMonth()

  return (
    <div className="calendar-container">
      {/* ส่วนหัวปฏิทิน: แสดงเดือน/ปี และปุ่มควบคุม */}
      <div className="calendar-header">
        <button onClick={goToPreviousMonth} className="nav-button" title="เดือนก่อนหน้า">‹</button>
        <div className="month-year">
          <h3>{monthNames[currentMonth]} {currentYear}</h3>
          <button onClick={goToToday} className="today-button">วันนี้</button>
        </div>
        <button onClick={goToNextMonth} className="nav-button" title="เดือนถัดไป">›</button>
      </div>

      {/* ส่วนแสดงชื่อวัน */}
      <div className="calendar-weekdays">
        {dayNames.map((day, index) => (
          <div key={index} className="weekday">
            {day}
          </div>
        ))}
      </div>

      {/* ส่วนแสดงวันในเดือน */}
      <div className="calendar-days">
        {days.map((day, index) => {
          const dayTimeSlots = getTimeSlotsForDay(day)
          const hasEvent = dayTimeSlots.length > 0
          const isTodayDate = isToday(day)
          
          return (
            <div
              key={index}
              className={`calendar-day ${day ? '' : 'empty'} ${hasEvent ? 'has-event' : ''} ${isTodayDate ? 'today' : ''}`}
              title={day ? `${day} ${monthNames[currentMonth]} ${currentYear}` : ''}
            >
              {day && (
                <>
                  <span className="day-number">{day}</span>
                  {hasEvent && (
                    <div className="event-indicators">
                      {/* แสดงจุดแต่ละกิจกรรมโดยใช้สีของแต่ละ slot */}
                      <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                        {dayTimeSlots.map((slot, idx) => (
                          <span
                            key={idx}
                            className="event-dot"
                            style={{ background: slot.color || '#4a90e2' }}
                            title={slot.activityId}
                          ></span>
                        ))}
                      </div>

                      {dayTimeSlots.length > 0 && (
                        <span className="event-count">{dayTimeSlots.length}</span>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Calendar

