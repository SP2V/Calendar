// นำเข้า useState hook จาก React สำหรับจัดการ state
import { useState } from 'react'
// นำเข้า CSS สำหรับ User component
import './User.css'

/**
 * User Component - หน้า User สำหรับผู้ใช้ทั่วไป
 * มีฟังก์ชันจัดการกิจกรรมส่วนตัว, แสดงข้อมูลส่วนตัว
 */
function User() {
  // State สำหรับเก็บข้อมูลผู้ใช้ (ไม่มีการเปลี่ยนแปลง จึงไม่ต้องมี setter)
  const [userInfo] = useState({
    name: 'สมชาย ใจดี',
    email: 'somchai@example.com',
    role: 'user',
    joinDate: '2024-01-15'
  })

  // State สำหรับเก็บรายการกิจกรรมทั้งหมด
  // เริ่มต้นด้วยข้อมูลตัวอย่าง 3 กิจกรรม
  const [events, setEvents] = useState([
    { id: 1, title: 'ประชุมทีม', date: '2024-12-20', time: '10:00', status: 'upcoming' },
    { id: 2, title: 'ส่งรายงาน', date: '2024-12-18', time: '14:00', status: 'completed' },
    { id: 3, title: 'อบรม React', date: '2024-12-25', time: '09:00', status: 'upcoming' },
  ])

  // State สำหรับเก็บข้อมูลกิจกรรมใหม่ที่กำลังจะเพิ่ม
  // เริ่มต้นด้วยค่าว่าง
  const [newEvent, setNewEvent] = useState({ title: '', date: '', time: '' })

  /**
   * ฟังก์ชันสำหรับเพิ่มกิจกรรมใหม่
   * @param {Event} e - event object จาก form submission
   */
  const handleAddEvent = (e) => {
    e.preventDefault() // ป้องกันการ reload หน้าเมื่อ submit form
    
    // ตรวจสอบว่ามีข้อมูลครบถ้วนแล้ว
    if (newEvent.title && newEvent.date && newEvent.time) {
      // เพิ่มกิจกรรมใหม่เข้าไปใน array events
      // กำหนด status เป็น 'upcoming' (ยังไม่เสร็จ) โดยอัตโนมัติ
      setEvents([...events, { ...newEvent, id: events.length + 1, status: 'upcoming' }])
      
      // รีเซ็ตฟอร์มให้เป็นค่าว่าง
      setNewEvent({ title: '', date: '', time: '' })
    }
  }

  /**
   * ฟังก์ชันสำหรับลบกิจกรรม
   * @param {number} id - ID ของกิจกรรมที่ต้องการลบ
   */
  const handleDeleteEvent = (id) => {
    // กรองกิจกรรมออกโดยเก็บเฉพาะกิจกรรมที่ id ไม่เท่ากับ id ที่ส่งมา
    setEvents(events.filter(event => event.id !== id))
  }

  /**
   * ฟังก์ชันสำหรับสลับสถานะกิจกรรม (upcoming <-> completed)
   * @param {number} id - ID ของกิจกรรมที่ต้องการเปลี่ยนสถานะ
   */
  const toggleEventStatus = (id) => {
    // วนลูปผ่าน events และเปลี่ยนสถานะของกิจกรรมที่ตรงกับ id
    setEvents(events.map(event =>
      event.id === id
        ? { ...event, status: event.status === 'completed' ? 'upcoming' : 'completed' }
        : event
    ))
  }

  return (
    <div className="user-container">
      {/* ส่วนหัวของหน้า User แสดงข้อมูลผู้ใช้ */}
      <div className="user-header">
        <div className="user-profile">
          {/* Avatar แสดงตัวอักษรแรกของชื่อ */}
          <div className="avatar">
            {userInfo.name.charAt(0)}
          </div>
          {/* ข้อมูลผู้ใช้ */}
          <div className="user-info">
            <h1>สวัสดี, {userInfo.name}</h1>
            <p>{userInfo.email}</p>
            <span className="user-badge">ผู้ใช้ทั่วไป</span>
          </div>
        </div>
      </div>

      <div className="user-content">
        {/* ส่วนฟอร์มสำหรับเพิ่มกิจกรรมใหม่ */}
        <section className="user-section">
          <h2>เพิ่มกิจกรรมใหม่</h2>
          <form onSubmit={handleAddEvent} className="user-form">
            <div className="form-row">
              {/* ฟิลด์กรอกชื่อกิจกรรม */}
              <div className="form-group">
                <label>ชื่อกิจกรรม:</label>
                <input
                  type="text"
                  value={newEvent.title}
                  // อัปเดต state เมื่อมีการพิมพ์
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  placeholder="กรอกชื่อกิจกรรม"
                  required
                />
              </div>
              
              {/* ฟิลด์เลือกวันที่ */}
              <div className="form-group">
                <label>วันที่:</label>
                <input
                  type="date"
                  value={newEvent.date}
                  // อัปเดต state เมื่อมีการเลือกวันที่
                  onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                  required
                />
              </div>
              
              {/* ฟิลด์เลือกเวลา */}
              <div className="form-group">
                <label>เวลา:</label>
                <input
                  type="time"
                  value={newEvent.time}
                  // อัปเดต state เมื่อมีการเลือกเวลา
                  onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                  required
                />
              </div>
            </div>
            {/* ปุ่มสำหรับ submit form */}
            <button type="submit" className="btn-add">เพิ่มกิจกรรม</button>
          </form>
        </section>

        {/* ส่วนแสดงรายการกิจกรรมทั้งหมด */}
        <section className="user-section">
          <h2>กิจกรรมของฉัน</h2>
          <div className="events-list">
            {/* ตรวจสอบว่ามีกิจกรรมหรือไม่ */}
            {events.length === 0 ? (
              // แสดงข้อความถ้ายังไม่มีกิจกรรม
              <p className="no-events">ยังไม่มีกิจกรรม</p>
            ) : (
              // วนลูปแสดงกิจกรรมแต่ละรายการ
              events.map(event => (
                <div key={event.id} className={`event-card ${event.status}`}>
                  {/* ส่วนแสดงข้อมูลกิจกรรม */}
                  <div className="event-content">
                    <h3>{event.title}</h3>
                    <div className="event-details">
                      <span className="event-date">📅 {event.date}</span>
                      <span className="event-time">🕐 {event.time}</span>
                    </div>
                  </div>
                  
                  {/* ส่วนปุ่มจัดการกิจกรรม */}
                  <div className="event-actions">
                    {/* ปุ่มสลับสถานะกิจกรรม (เสร็จแล้ว/ยังไม่เสร็จ) */}
                    <button
                      onClick={() => toggleEventStatus(event.id)}
                      className={`btn-status ${event.status === 'completed' ? 'completed' : ''}`}
                    >
                      {event.status === 'completed' ? '✓ เสร็จแล้ว' : '○ ยังไม่เสร็จ'}
                    </button>
                    
                    {/* ปุ่มลบกิจกรรม */}
                    <button
                      onClick={() => handleDeleteEvent(event.id)}
                      className="btn-delete"
                    >
                      ลบ
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* ส่วนแสดงข้อมูลส่วนตัว */}
        <section className="user-section">
          <h2>ข้อมูลส่วนตัว</h2>
          <div className="profile-info">
            {/* แสดงชื่อ */}
            <div className="info-item">
              <label>ชื่อ:</label>
              <span>{userInfo.name}</span>
            </div>
            
            {/* แสดงอีเมล */}
            <div className="info-item">
              <label>อีเมล:</label>
              <span>{userInfo.email}</span>
            </div>
            
            {/* แสดงบทบาท */}
            <div className="info-item">
              <label>บทบาท:</label>
              <span>{userInfo.role}</span>
            </div>
            
            {/* แสดงวันที่เข้าร่วม */}
            <div className="info-item">
              <label>วันที่เข้าร่วม:</label>
              <span>{userInfo.joinDate}</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default User

