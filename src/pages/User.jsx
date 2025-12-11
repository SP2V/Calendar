import React, { useState, useEffect } from 'react';
import './User.css';
import TimeDropdown from "../components/AdminDropdown";
import PopupModal from "../components/PopupModal";
import ErrorPopup from "../components/ErrorPopup";
import BookingPreviewModal from "../components/BookingPreviewModal";
import CustomDurationModal from "../components/CustomDurationModal";
import {
  subscribeSchedules,
  subscribeActivityTypes,
  addBooking,
  subscribeBookings,
  deleteBooking,
} from '../services/firebase';
import { useNavigate } from 'react-router-dom';
import { createCalendarEvent, deleteCalendarEvent } from '../services/calendarService';
import { Trash2, Eye, Search, LayoutGrid, List, ChevronLeft, ChevronRight, Plus, ChevronDown, User as UserIcon, History, LogOut } from 'lucide-react';

// --- ICONS (SVG) ---
const CalendarIcon = ({ style }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
);
const ClockIcon = ({ style }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
);
const FileTextIcon = ({ style }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
);
const MonitorIcon = ({ style }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
);
const MapPinIcon = ({ style }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
);

const User = () => {
  // --- STATES ---
  const [schedules, setSchedules] = useState([]);
  const [types, setTypes] = useState(['เลือกกิจกรรม']);
  const [activityTypes, setActivityTypes] = useState([]);
  const [bookings, setBookings] = useState([]); // New state for bookings

  // Form State
  const [formData, setFormData] = useState({
    type: '',
    days: [],
    startTime: '',
    endTime: '',
    duration: '',
    subject: '',
    meetingFormat: 'Online',
    location: '',
    description: ''
  });
  const [customDuration, setCustomDuration] = useState('');
  const [customDurationUnit, setCustomDurationUnit] = useState('นาที'); // New state for unit
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showDurationModal, setShowDurationModal] = useState(false);

  // View/Delete State
  const [viewingBooking, setViewingBooking] = useState(null); // For Viewing Details

  // UI States
  const [isViewMode, setIsViewMode] = useState(false);
  const [popupMessage, setPopupMessage] = useState({ type: '', message: '' });
  const [currentDate, setCurrentDate] = useState(new Date());

  // Redesign: List View Filter & Pagination States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('แสดงทั้งหมด');
  const [viewLayout, setViewLayout] = useState('grid'); // 'grid' or 'list'
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const daysOfWeek = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
  const fullDays = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
  const thaiMonths = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
  const STANDARD_DURATIONS = ['30 นาที', '1 ชั่วโมง', '1.5 ชั่วโมง', '2 ชั่วโมง', '3 ชั่วโมง'];
  const duration = [...STANDARD_DURATIONS, 'กำหนดเอง']; // Legacy support if needed, but we use displayDurations
  // เพิ่มจุด (.) ให้ตรงกับ Database
  const dayAbbreviations = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];

  // --- HELPER FUNCTIONS ---
  const getFirstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const changeMonth = (offset) => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));

  const formatDateId = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const getThaiDayNameFromDateStr = (dateStr) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return dayAbbreviations[date.getDay()];
  };

  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return '-';
    const [y, m, d] = dateStr.split('-').map(Number);
    return `${d} ${thaiMonths[m - 1]} ${y + 543}`;
  };

  // --- NEW LOGIC: Time & Duration Helpers ---

  // ฟังก์ชันแปลงข้อความระยะเวลาเป็นตัวเลขนาที (ใช้ร่วมกันหลายที่)
  const getDurationInMinutes = (durationStr, customVal, customUnit = 'นาที') => {
    if (!durationStr) return 0;

    // Robust parsing for strings like "30 นาที", "1 ชั่วโมง", "1.5 ชั่วโมง", etc.
    if (durationStr === 'กำหนดเอง') {
      const val = parseFloat(customVal) || 0;
      if (customUnit === 'ชั่วโมง') return val * 60;
      return val;
    }

    // Try to parse number from string
    const match = durationStr.match(/([\d\.]+)/);
    if (!match) return 0;

    const val = parseFloat(match[1]);

    // Check for hour keywords
    if (durationStr.includes('ชั่วโมง') || durationStr.includes('ชม.')) {
      return val * 60;
    }

    return val; // Assume minutes if no hour keyword or just minutes
  };

  // แปลงนาที (นับจากเที่ยงคืน) กลับเป็นเวลา HH:MM
  const minutesToTimeStr = (minutes) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  // แปลงเวลา HH:MM เป็นนาที
  const timeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    // เผื่อกรณีมีขีดติดมา ตัดเอาเฉพาะเวลาตัวแรก
    const cleanTime = timeStr.includes('-') ? timeStr.split('-')[0].trim() : timeStr;
    const [hours, minutes] = cleanTime.split(':').map(Number);
    return (hours * 60) + (minutes || 0);
  };

  const calculateEndTime = (startTime, durationStr) => {
    if (!startTime || !durationStr) return '';
    const minsToAdd = getDurationInMinutes(durationStr, customDuration, customDurationUnit);
    const [startH, startM] = startTime.split(/[.:]/).map(Number);
    if (isNaN(startH)) return startTime;

    const totalMins = (startH * 60) + startM + minsToAdd;
    return `${startTime}-${minutesToTimeStr(totalMins)}`;
  };

  // Check if a specific time slot is booked
  const isTimeSlotBooked = (timeStr) => {
    if (formData.days.length === 0) return false;

    // Parse selected Date
    const dateStr = formData.days[0];
    const [year, month, day] = dateStr.split('-').map(Number);

    // Parse Slot Start Time
    const [h, m] = timeStr.split(':').map(Number);
    const slotStart = new Date(year, month - 1, day, h, m);

    // Calculate Slot End Time
    const durationMins = getDurationInMinutes(formData.duration, customDuration, customDurationUnit);
    // If no duration selected yet, default to 1 min check or 30 mins just to see if start time overlaps
    // But logically, we need duration to know if it overlaps "into" a booking
    // For safety, let's use 1 minute if 0, to at least check start point
    const bufferMins = durationMins > 0 ? durationMins : 1;
    const slotEnd = new Date(slotStart.getTime() + bufferMins * 60000);

    // Filter bookings for this day
    const dayBookings = bookings.filter(b => {
      // Basic check: is it non-cancelled? (Assuming 'confirmed' status or similar)
      // If you have cancelled status, filter it out here. 
      // For now assume all in 'bookings' collection are active.
      if (b.status === 'cancelled') return false;

      const bStart = new Date(b.startTime);
      const bEnd = new Date(b.endTime);

      // Check if booking falls on the same day
      return bStart.getDate() === day &&
        bStart.getMonth() === (month - 1) &&
        bStart.getFullYear() === year;
    });

    // Check overlap
    return dayBookings.some(b => {
      const bStart = new Date(b.startTime);
      const bEnd = new Date(b.endTime);

      // Overlap logic: (StartA < EndB) and (EndA > StartB)
      return slotStart < bEnd && slotEnd > bStart;
    });
  };

  // --- CORE LOGIC: Generate Time Slots ---
  const getAvailableTimeSlots = () => {
    if (!formData.type || formData.type === 'เลือกกิจกรรม') return [];
    if (formData.days.length === 0) return [];

    const selectedDateStr = formData.days[0];
    const targetDayName = getThaiDayNameFromDateStr(selectedDateStr);

    // 1. ดึง Schedule ที่ตรงกับวันและประเภท
    const matchingSchedules = schedules.filter(schedule =>
      schedule.type === formData.type &&
      schedule.day === targetDayName &&
      schedule.time
    );

    // 2. ดึง Duration ของผู้ใช้มาเตรียมคำนวณ
    const userDurationMins = getDurationInMinutes(formData.duration, customDuration, customDurationUnit);
    // ถ้ายังไม่เลือก Duration ให้ใช้ค่า Default 60 นาทีในการแสดงผลไปก่อน (หรือจะใช้ 30 ก็ได้)
    const durationCheck = userDurationMins > 0 ? userDurationMins : 60;

    const generatedSlots = new Set();

    matchingSchedules.forEach(sch => {
      const timeStr = sch.time;

      if (timeStr.includes('-')) {
        // กรณีเป็นช่วงเวลา เช่น "19:00 - 22:00"
        const [startStr, endStr] = timeStr.split('-').map(s => s.trim());

        let currentMins = timeToMinutes(startStr);
        const endMins = timeToMinutes(endStr);

        // Loop สร้างปุ่มเวลา โดยขยับทีละ 30 นาที (Interval)
        const STEP_INTERVAL = userDurationMins > 0 ? userDurationMins : 30;

        while (currentMins + durationCheck <= endMins) {
          generatedSlots.add(minutesToTimeStr(currentMins));
          currentMins += STEP_INTERVAL;
        }

      } else {
        // กรณีเป็นเวลาเดี่ยว เช่น "19:00" ก็ใส่ไปเลย
        generatedSlots.add(timeStr);
      }
    });

    // แปลงกลับเป็น Array และเรียงลำดับ
    return Array.from(generatedSlots).sort((a, b) => timeToMinutes(a) - timeToMinutes(b));
  };

  const availableTimeSlots = getAvailableTimeSlots();

  // --- EFFECTS ---
  useEffect(() => {
    const unsubSchedules = subscribeSchedules(setSchedules);
    const unsubTypes = subscribeActivityTypes((fetchedTypes) => {
      setActivityTypes(fetchedTypes);
      setTypes(['เลือกกิจกรรม', ...fetchedTypes.map(t => t.name)]);
    });
    const unsubBookings = subscribeBookings(setBookings);
    return () => { unsubSchedules(); unsubTypes(); unsubBookings(); };
  }, []);

  useEffect(() => {
    if (popupMessage.type === 'success') {
      const timer = setTimeout(() => setPopupMessage({ type: '', message: '' }), 1000);
      return () => clearTimeout(timer);
    }
  }, [popupMessage]);



  // --- HANDLERS ---
  const handleDaySelect = (dayNum) => {
    const selectedDateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNum);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDateObj < today) return;
    const dateId = formatDateId(selectedDateObj);
    setFormData(prev => {
      const isSameDate = prev.days.includes(dateId);
      return { ...prev, days: isSameDate ? [] : [dateId], startTime: '' };
    });
  };

  const handleDurationChange = (val) => {
    // If user selects "กำหนดเอง" OR selects a custom-like value that is not in standard list
    // (In practice, if they click the already-selected custom value (e.g., "5 ชั่วโมง") in the dropdown,
    // we want to let them edit it.
    // However, typical dropdown logic: clicking the same value might just re-trigger onChange.

    // Check if standard
    const isStandard = STANDARD_DURATIONS.includes(val);

    if (val === 'กำหนดเอง' || (!isStandard && val === formData.duration)) {
      // If clicking "กำหนดเอง" OR re-clicking their custom value -> Open Modal
      setShowDurationModal(true);
      // Important: if it's "กำหนดเอง", we don't set formData.duration yet until they confirm strings
      // But if they clicked their existing custom value, we keep it as is until modal confirms
    } else {
      setFormData({ ...formData, duration: val });
      // If they pick a standard one, clear custom duration/unit states? 
      // Optional, but safer to keep them clean or just ignore them.
    }
  };

  const handleCustomDurationConfirm = (val, unit) => {
    setCustomDuration(val);
    setCustomDurationUnit(unit);
    setShowDurationModal(false);

    // Directly set the duration string to proper format
    const newDurationStr = `${val} ${unit}`;
    setFormData(prev => ({ ...prev, duration: newDurationStr }));
  };

  const handleCustomDurationCancel = () => {
    setShowDurationModal(false);
    // If we were on "กำหนดเอง" but cancelled, and didn't have a previous custom value...
    // logic is tricky. If formData.duration is "กำหนดเอง", we might want to revert?
    // But here formData.duration is likely still the old value or empty.
    if (!formData.duration || formData.duration === 'กำหนดเอง') {
      setFormData(prev => ({ ...prev, duration: '' }));
    }
  };



  // Helper to match Hex to Google Color ID
  const mapHexToGoogleColorId = (hex) => {
    if (!hex) return '7'; // Default Peacock (Blue)

    // Google Calendar Colors
    const colors = {
      1: '#7986cb', // Lavender
      2: '#33b679', // Sage
      3: '#8e24aa', // Grape
      4: '#e67c73', // Flamingo
      5: '#f6c026', // Banana
      6: '#f5511d', // Tangerine
      7: '#039be5', // Peacock
      8: '#616161', // Graphite
      9: '#3f51b5', // Blueberry
      10: '#0b8043', // Basil
      11: '#d50000'  // Tomato
    };

    const hexToRgb = (h) => {
      let r = 0, g = 0, b = 0;
      // 3 digits
      if (h.length === 4) {
        r = parseInt("0x" + h[1] + h[1]);
        g = parseInt("0x" + h[2] + h[2]);
        b = parseInt("0x" + h[3] + h[3]);
      } else if (h.length === 7) {
        r = parseInt("0x" + h[1] + h[2]);
        g = parseInt("0x" + h[3] + h[4]);
        b = parseInt("0x" + h[5] + h[6]);
      }
      return { r, g, b };
    };

    const target = hexToRgb(hex);
    let minDiff = Infinity;
    let bestId = '7';

    Object.entries(colors).forEach(([id, cHex]) => {
      const cRgb = hexToRgb(cHex);
      // Euclidean distance usually sufficient for simple mapping
      const diff = Math.sqrt(
        Math.pow(target.r - cRgb.r, 2) +
        Math.pow(target.g - cRgb.g, 2) +
        Math.pow(target.b - cRgb.b, 2)
      );
      if (diff < minDiff) {
        minDiff = diff;
        bestId = id;
      }
    });

    return bestId;
  };

  const handleReview = () => {
    if (!formData.type || formData.type === 'เลือกกิจกรรม') { setPopupMessage({ type: 'error', message: 'กรุณาเลือกประเภทกิจกรรม' }); return; }
    if (!formData.subject || formData.subject.trim() === '') { setPopupMessage({ type: 'error', message: 'กรุณากรอกหัวข้อการประชุม' }); return; }

    // Check if custom duration is selected but value is empty
    if (formData.duration === 'กำหนดเอง') {
      const val = parseFloat(customDuration);
      let totalMinutes = val;
      if (customDurationUnit === 'ชั่วโมง') totalMinutes = val * 60;

      if (!val || val <= 0) {
        setPopupMessage({ type: 'error', message: 'กรุณาระบุระยะเวลา (เลขจำนวนเต็ม/ทศนิยม)' });
        return;
      }
      if (totalMinutes < 10) {
        setPopupMessage({ type: 'error', message: 'กรุณาระบุระยะเวลาอย่างน้อย 10 นาที' });
        return;
      }
    } else {
      if (!formData.duration || formData.duration.trim() === '') { setPopupMessage({ type: 'error', message: 'กรุณาระบุระยะเวลา' }); return; }
    }
    if (formData.days.length === 0) { setPopupMessage({ type: 'error', message: 'กรุณาเลือกวันที่จากปฏิทิน' }); return; }
    if (!formData.startTime) { setPopupMessage({ type: 'error', message: 'กรุณาเลือกเวลาที่ต้องการจอง' }); return; }
    if (formData.meetingFormat === 'Online' && (!formData.location || formData.location.trim() === '')) { setPopupMessage({ type: 'error', message: 'กรุณากรอกลิงก์การประชุม' }); return; }
    if (formData.meetingFormat === 'On-site' && (!formData.location || formData.location.trim() === '')) { setPopupMessage({ type: 'error', message: 'กรุณาระบุสถานที่' }); return; }

    setShowPreviewModal(true);
  };

  const handleConfirmBooking = async () => {
    setShowPreviewModal(false);

    // --- Google Calendar Integration ---
    try {
      const dateStr = formData.days[0];
      const timeStr = formData.startTime;
      const [year, month, day] = dateStr.split('-').map(Number);
      const [hour, minute] = timeStr.split(':').map(Number);

      const startDateTime = new Date(year, month - 1, day, hour, minute);

      const durationMins = getDurationInMinutes(formData.duration, customDuration, customDurationUnit);
      const endDateTime = new Date(startDateTime.getTime() + durationMins * 60000);

      // Determine Color ID
      const selectedActivity = activityTypes.find(t => t.name === formData.type);
      let colorId = '7'; // Default Peacock (Blue)
      if (selectedActivity && selectedActivity.color) {
        colorId = mapHexToGoogleColorId(selectedActivity.color);
      }

      const eventPayload = {
        title: `[${formData.type}] ${formData.subject}`,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        description: `${formData.description || '-'}`,
        location: formData.location,
        colorId: colorId
      };

      setPopupMessage({ type: 'success', message: 'กำลังบันทึก...' });

      const result = await createCalendarEvent(eventPayload);

      if (result.status === 'success') {
        // Save to Firestore
        await addBooking({
          ...eventPayload,
          googleCalendarEventId: result.eventId || null,
          status: 'confirmed',
          type: formData.type,
          subject: formData.subject, // Explicitly save subject
          meetingFormat: formData.meetingFormat
        });

        setPopupMessage({ type: 'success', message: 'จองนัดหมายและบันทึกลงปฏิทินเรียบร้อยแล้ว' });

        // Clear form
        setFormData({
          type: '',
          days: [],
          startTime: '',
          endTime: '',
          duration: '',
          subject: '',
          meetingFormat: 'Online',
          location: '',
          description: ''
        });
        setCustomDuration('');
        setCustomDurationUnit('นาที');
      } else {
        throw new Error(result.message || 'Unknown error');
      }

    } catch (error) {
      console.error("Calendar Error:", error);
      setPopupMessage({ type: 'error', message: `เชื่อมต่อไม่ได้: ${error.message}` });
    }
  };

  // --- ACTIONS ---
  const handleDeleteBooking = async (id) => {
    if (window.confirm('คุณต้องการลบรายการนัดหมายนี้ใช่หรือไม่?')) {
      try {
        // 1. Find the booking to get Google Calendar Event ID
        const bookingToDelete = bookings.find(b => b.id === id);

        // 2. Delete from Google Calendar if linked
        if (bookingToDelete && bookingToDelete.googleCalendarEventId) {
          try {
            await deleteCalendarEvent(bookingToDelete.googleCalendarEventId);
          } catch (calError) {
            console.warn("Failed to delete from Google Calendar:", calError);
            // Continue to delete from local DB even if calendar fails
          }
        }

        // 3. Delete from Firestore
        await deleteBooking(id);
        setPopupMessage({ type: 'success', message: 'ลบรายการเรียบร้อยแล้ว' });
      } catch (error) {
        console.error("Delete Error:", error);
        setPopupMessage({ type: 'error', message: 'ลบรายการไม่สำเร็จ' });
      }
    }
  };

  const handleViewBookingDetails = (booking) => {
    // Transform booking data for Modal
    const start = new Date(booking.startTime);
    const end = new Date(booking.endTime);

    // Format Date: YYYY-MM-DD
    const dateStr = start.getFullYear() + '-' + String(start.getMonth() + 1).padStart(2, '0') + '-' + String(start.getDate()).padStart(2, '0');

    // Format Time: HH:MM - HH:MM
    const timeStr = `${start.getHours().toString().padStart(2, '0')}:${start.getMinutes().toString().padStart(2, '0')} - ${end.getHours().toString().padStart(2, '0')}:${end.getMinutes().toString().padStart(2, '0')} น.`;

    // Calculate Duration
    const diffMs = end - start;
    const diffMins = Math.floor(diffMs / 60000);
    let durationStr = `${diffMins} นาที`;
    if (diffMins >= 60) {
      const h = Math.floor(diffMins / 60);
      const m = diffMins % 60;
      durationStr = m > 0 ? `${h} ชม. ${m} นาที` : `${h} ชั่วโมง`;
    }

    const normalizedFormat = booking.type === 'Training' ? 'On-site' : // Example heuristic correction if needed, but better to trust data
      (booking.meetingFormat || booking.bookingData?.meetingFormat || (booking.location && booking.location.includes('http') ? 'Online' : 'On-site'));

    setViewingBooking({
      type: booking.type || 'นัดหมาย',
      subject: booking.title || booking.subject || '-',
      date: dateStr,
      timeSlot: timeStr,
      duration: durationStr,
      meetingFormat: normalizedFormat,
      location: booking.location || '-',
      description: booking.description || '-'
    });
  };

  // --- RENDER HELPERS ---
  const renderCalendarGrid = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDayIndex = getFirstDayOfMonth(currentDate);
    const gridItems = [];
    const todayObj = new Date();
    todayObj.setHours(0, 0, 0, 0);

    for (let i = 0; i < firstDayIndex; i++) { gridItems.push(<div key={`empty-${i}`} className="user-day-empty"></div>); }

    for (let day = 1; day <= daysInMonth; day++) {
      const currentDayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dateId = formatDateId(currentDayDate);
      const isSelected = formData.days.includes(dateId);
      const isPast = currentDayDate < todayObj;
      const isToday = currentDayDate.getTime() === todayObj.getTime();

      let btnClass = 'user-day-btn';
      if (isSelected) btnClass += ' active';
      if (isToday) btnClass += ' today';

      gridItems.push(
        <button key={day} disabled={isPast} className={btnClass} onClick={() => handleDaySelect(day)}>
          {day}
        </button>
      );
    }
    return gridItems;
  };

  // Calculate display duration options
  let displayDurations = [...STANDARD_DURATIONS];

  // Logic: 
  // 1. If we have a custom duration that is NOT standard, we add it to the list so it can be shown/selected.
  // 2. We ALWAYS show 'กำหนดเอง' at the end to allow user to pick it (or clear/reset).

  // Note: if formData.duration is empty, includes returns false, so we check truthiness first
  const isCustomActive = formData.duration && !STANDARD_DURATIONS.includes(formData.duration);

  if (isCustomActive) {
    // Show the custom value
    displayDurations.push(formData.duration);
  }
  // Always show 'กำหนดเอง' option
  displayDurations.push('กำหนดเอง');

  // Profile Dropdown State
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate('/login');
  };

  return (
    <div className="user-schedule-container">
      {/* Profile Badge */}
      <div className="user-profile-container" style={{ position: 'absolute', top: '1.5rem', right: '2rem', zIndex: 100 }}>
        <div
          className="user-profile-badge"
          onClick={() => setIsProfileOpen(!isProfileOpen)}
          style={{ position: 'relative', top: 0, right: 0 }}
        >
          <div className="profile-avatar">SC</div>
          {/* <div className="profile-info">
            <span className="profile-name">Som Chai</span>
            <span className="profile-email">somchai.j@gmail.com</span>
          </div> */}
          {/* Chevron removed but clickable area remains */}
        </div>

        {/* Dropdown Menu */}
        {isProfileOpen && (
          <div className="profile-dropdown-menu">
            <div className="dropdown-header-info">
              <div className="profile-avatar sm">SC</div>
              <div className="profile-info">
                <span className="profile-name">Som Chai</span>
                <span className="profile-email">somchai.j@gmail.com</span>
              </div>
            </div>

            <div className="dropdown-divider"></div>

            <button className="dropdown-item">
              <UserIcon size={18} />
              <span>โปรไฟล์</span>
            </button>
            <button className="dropdown-item">
              <History size={18} />
              <span>ประวัติการนัดหมาย</span>
            </button>

            <div className="dropdown-divider"></div>

            <button className="dropdown-item logout" onClick={handleLogout}>
              <LogOut size={18} />
              <span>ออกจากระบบ</span>
            </button>
          </div>
        )}
      </div>

      <div className="user-schedule-wrapper">

        {/* --- HEADER --- */}
        <div className="user-header-card">
          <div className="user-header-left">
            <div className="user-header-icon-box"><CalendarIcon /></div>
            <div className="user-header-info">
              <h1>Book an Appointment</h1>
              <p>{isViewMode ? 'รายการจองนัดหมาย' : 'จองตารางนัดหมาย'}</p>
            </div>
          </div>
          <button className="user-header-btn-back" onClick={() => setIsViewMode(!isViewMode)}>
            {isViewMode ? '+ เพิ่มรายการ' : 'รายการนัดหมายของฉัน'}
          </button>
        </div>

        {/* --- CONTENT --- */}
        {!isViewMode ? (
          <div className="user-form-card">

            {/* Row 1: Activity */}
            <div className="form-section-Activity">
              <label className="user-section-title">เลือกกิจกรรม <span className="required">*</span></label>
              <TimeDropdown
                className="dropdown-full"
                value={formData.type}
                onChange={val => setFormData({ ...formData, type: val, startTime: '', days: [] })}
                timeOptions={types.filter(t => t !== 'เลือกกิจกรรม')}
                placeholder="เลือกกิจกรรม"
              />
            </div>

            {/* Row 2: Details */}
            <div className="form-section">
              <label className="user-section-title">รายละเอียดการนัดหมาย</label>
              <div className="flex-row-wrap">
                <div className="col-2">
                  <label className="input-label">หัวข้อการประชุม (Subject) <span className="required">*</span></label>
                  <input type="text" placeholder="เช่น ประชุมสรุปงานออกแบบ UX" className="user-custom-input"
                    value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })} />
                </div>
                <div className="col-1">
                  <label className="input-label">ระยะเวลา (Duration) <span className="required">*</span></label>
                  <div className="duration-group">
                    <TimeDropdown
                      className="dropdown-time"
                      value={formData.duration} onChange={handleDurationChange}
                      timeOptions={displayDurations} placeholder="ระยะเวลา"
                    />
                    {/* CUSTOM DISPLAY REMOVED IN FAVOR OF IN-DROPDOWN DISPLAY */}
                  </div>
                </div>
              </div>
            </div>

            {/* Row 3: Grid Layout (Calendar & Time) */}
            <div className="user-grid-layout">
              {/* Calendar Panel */}
              <div className="user-gray-panel">
                <div className="user-calendar-header">
                  <span className="user-section-title" style={{ margin: 0 }}>เลือกวันที่</span>
                  <div className="calendar-nav">
                    <span className="nav-btn" onClick={() => changeMonth(-1)}>&lt;</span>
                    <span className="nav-month">{thaiMonths[currentDate.getMonth()]} {currentDate.getFullYear() + 543}</span>
                    <span className="nav-btn" onClick={() => changeMonth(1)}>&gt;</span>
                  </div>
                </div>
                <div className="user-calendar-grid">
                  {daysOfWeek.map(d => (<div key={d} className="user-calendar-day-label">{d}</div>))}
                  {renderCalendarGrid()}
                </div>
              </div>

              {/* Time Panel */}
              <div className="user-gray-panel">
                <div className="user-section-title" style={{ marginBottom: '10px' }}>เลือกเวลา</div>
                <div className="time-slot-container">
                  {(!formData.type || formData.type === 'เลือกกิจกรรม') ?
                    <div className="empty-state-text">กรุณาเลือกประเภทกิจกรรมก่อน</div>
                    : (!formData.duration) ?
                      <div className="empty-state-text">กรุณาระบุระยะเวลาก่อน</div>
                      : formData.days.length === 0 ?
                        <div className="empty-state-text">กรุณาเลือกวันที่จากปฏิทิน</div>
                        : availableTimeSlots.length > 0 ?
                          availableTimeSlots.map((slot, idx) => {
                            const isBooked = isTimeSlotBooked(slot);
                            return (
                              <button key={idx}
                                onClick={() => !isBooked && setFormData(prev => ({ ...prev, startTime: slot, endTime: '' }))}
                                disabled={isBooked}
                                className={`time-btn ${formData.startTime === slot ? 'active' : ''} ${isBooked ? 'booked' : ''}`}
                                title={isBooked ? "เวลานี้ถูกจองแล้ว" : ""}
                              >
                                {calculateEndTime(slot, formData.duration).replace('-', ' - ')}
                              </button>
                            );
                          })
                          : <div className="error-state-box">ไม่มีรอบเวลาว่าง</div>}
                </div>
              </div>
            </div>
            <div className="bottom-layout">

              {/* LEFT: Format & Input */}
              <div className="format-section">
                <h3 className="user-section-title">รูปแบบการประชุม</h3>

                <div className="toggle-container">
                  <button
                    className={`toggle-btn ${formData.meetingFormat === 'Online' ? 'active' : ''}`}
                    onClick={() => setFormData({ ...formData, meetingFormat: 'Online', location: '' })}
                  >
                    <MonitorIcon /> Online
                  </button>
                  <button
                    className={`toggle-btn ${formData.meetingFormat === 'On-site' ? 'active' : ''}`}
                    onClick={() => setFormData({ ...formData, meetingFormat: 'On-site', location: '' })}
                  >
                    <MapPinIcon /> On-site
                  </button>
                </div>

                <div className="input-group">
                  <label className="input-label">
                    {formData.meetingFormat === 'Online' ? 'ลิงก์ประชุมออนไลน์' : 'สถานที่นัดหมาย'} <span className="required">*</span>
                  </label>
                  <input type="text" className="user-custom-input"
                    placeholder={formData.meetingFormat === 'Online' ? "วางลิงก์ Google Meet / Zoom / Teams" : "ระบุชื่อห้องประชุม หรือ สถานที่"}
                    value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} />
                </div>

                <div className="input-group">
                  <label className="input-label">รายละเอียดเพิ่มเติม </label>
                  <textarea className="user-custom-input"
                    placeholder="ระบุรายละเอียดเพิ่มเติม..."
                    value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                </div>
              </div>

              {/* RIGHT: Summary Box */}
              <div className="summary-box">
                <h3 className="summary-title"><FileTextIcon /> สรุปการจอง</h3>
                <div className="summary-grid">
                  <div className="summary-item">
                    <p className="summary-label">กิจกรรม</p>
                    <p className="summary-value">{formData.type || '-'}</p>
                  </div>
                  <div className="summary-item">
                    <div className="summary-label"><CalendarIcon style={{ width: '14px' }} /> วันที่</div>
                    <p className="summary-value">{formData.days.length > 0 ? formatDisplayDate(formData.days[0]) : '-'}</p>
                  </div>
                  <div className="summary-item span-2">
                    <div className="summary-label"><FileTextIcon style={{ width: '14px' }} /> หัวข้อ</div>
                    <p className="summary-value">{formData.subject || '-'}</p>
                  </div>
                  <div className="summary-item">
                    <div className="summary-label"><ClockIcon style={{ width: '14px' }} /> ระยะเวลา</div>
                    <p className="summary-value">{formData.duration === 'กำหนดเอง' ? `${customDuration} ${customDurationUnit}` : (formData.duration || '-')}</p>
                  </div>
                  <div className="summary-item">
                    <div className="summary-label"><ClockIcon style={{ width: '14px' }} /> เวลา</div>
                    <p className="summary-value">{formData.startTime ? calculateEndTime(formData.startTime, formData.duration) + ' น.' : '-'}</p>
                  </div>
                  <div className="summary-item span-2">
                    <div className="summary-label">{formData.meetingFormat === 'Online' ? <MonitorIcon style={{ width: '14px' }} /> : <MapPinIcon style={{ width: '14px' }} />} รูปแบบ</div>
                    <p className="summary-value">{formData.meetingFormat}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="user-action-footer">
              <button className="btn-confirm" onClick={handleReview}>ยืนยันการจอง</button>
            </div>

          </div>
        ) : (
          <div className="user-view-container">
            {/* Filter Bar */}
            <div className="filter-bar">
              <div className="filter-left">
                <div className="search-wrapper">
                  {/* <Search size={18} className="search-icon" /> */}
                  <input
                    type="text"
                    placeholder="ค้นหาการจอง..."
                    className="search-input"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1); // Reset to first page on search
                    }}
                  />
                </div>
                <div className="filter-dropdown-wrapper">
                  <TimeDropdown
                    value={filterType}
                    onChange={(val) => setFilterType(val)}
                    timeOptions={['แสดงทั้งหมด', ...new Set(schedules.map(item => item.type))]}
                    placeholder="กรองกิจกรรม"
                  />
                </div>
              </div>
              <div className="view-toggles">
                <button
                  className={`view-toggle-btn ${viewLayout === 'grid' ? 'active' : ''}`}
                  onClick={() => setViewLayout('grid')}
                >
                  <LayoutGrid size={18} />
                </button>
                <button
                  className={`view-toggle-btn ${viewLayout === 'list' ? 'active' : ''}`}
                  onClick={() => setViewLayout('list')}
                >
                  <List size={18} />
                </button>
              </div>
            </div>

            {/* Content Display */}
            <div className="bookings-content">
              {(() => {
                // Filter Logic
                const filtered = bookings.filter(b => {
                  const sub = b.title || b.subject || ''; // Use title (which has subj) or subject
                  const desc = b.description || '';
                  const matchesSearch = sub.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    desc.toLowerCase().includes(searchQuery.toLowerCase());
                  const matchesType = filterType === 'แสดงทั้งหมด' || b.type === filterType;
                  return matchesSearch && matchesType;
                });

                if (filtered.length === 0) {
                  return (
                    <div className="empty-state-view">
                      <div className="empty-icon-box">
                        <CalendarIcon style={{ width: 48, height: 48, color: '#9ca3af' }} />
                      </div>
                      <p>ไม่พบรายการที่ค้นหา</p>
                    </div>
                  );
                }

                // Pagination Logic
                const totalPages = Math.ceil(filtered.length / itemsPerPage);
                const startIndex = (currentPage - 1) * itemsPerPage;
                const currentItems = filtered.slice(startIndex, startIndex + itemsPerPage);

                return (
                  <>
                    {/* Grid / List Layout */}
                    {/* Grid / List Layout */}
                    {viewLayout === 'grid' ? (
                      <div className="bookings-grid">
                        {currentItems.map(item => {
                          const starT = new Date(item.startTime);
                          const endT = new Date(item.endTime);
                          const dateStr = starT.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });
                          const timeRange = `${starT.getHours().toString().padStart(2, '0')}:${starT.getMinutes().toString().padStart(2, '0')} - ${endT.getHours().toString().padStart(2, '0')}:${endT.getMinutes().toString().padStart(2, '0')} น.`;
                          const isOnline = item.meetingFormat === 'Online' || (item.location && item.location.includes('http'));

                          return (
                            <div key={item.id} className="booking-card">
                              <div className="card-header">
                                <h3 className="card-type">{item.type || 'นัดหมาย'}</h3>
                                <p className="card-subject">
                                  {item.subject || item.title.replace(/^\[.*?\]\s*/, '')}
                                </p>
                              </div>
                              <div className="card-body">
                                <div className="card-row">
                                  <CalendarIcon style={{ width: 16, height: 16 }} />
                                  <span>{dateStr}</span>
                                </div>
                                <div className="card-row">
                                  <ClockIcon style={{ width: 16, height: 16 }} />
                                  <span>{timeRange}</span>
                                </div>
                                <div className="card-row">
                                  {isOnline ? <MonitorIcon style={{ width: 16, height: 16 }} /> : <MapPinIcon style={{ width: 16, height: 16 }} />}
                                  <span className={`status-badge ${isOnline ? 'online' : 'onsite'}`}>
                                    {isOnline ? 'Online' : 'On-site'}
                                  </span>
                                </div>
                              </div>
                              <div className="card-actions">
                                <button className="btn-card-action view" onClick={() => handleViewBookingDetails(item)}>
                                  ดูรายละเอียด
                                </button>
                                <button className="btn-card-action cancel" onClick={() => handleDeleteBooking(item.id)}>
                                  ยกเลิก
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="bookings-list-container">
                        <table className="bookings-table">
                          <thead>
                            <tr>
                              <th>หัวข้อ</th>
                              <th>กิจกรรม</th>
                              <th>วันที่</th>
                              <th>เวลา</th>
                              <th>รูปแบบ</th>
                              <th>การดำเนินการ</th>
                            </tr>
                          </thead>
                          <tbody>
                            {currentItems.map(item => {
                              const starT = new Date(item.startTime);
                              const endT = new Date(item.endTime);
                              const dateStr = starT.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });
                              const timeRange = `${starT.getHours().toString().padStart(2, '0')}:${starT.getMinutes().toString().padStart(2, '0')} - ${endT.getHours().toString().padStart(2, '0')}:${endT.getMinutes().toString().padStart(2, '0')} น.`;
                              const isOnline = item.meetingFormat === 'Online' || (item.location && item.location.includes('http'));

                              return (
                                <tr key={item.id}>
                                  <td className="cell-subject">
                                    {item.subject || item.title.replace(/^\[.*?\]\s*/, '')}
                                  </td>
                                  <td>{item.type || 'นัดหมาย'}</td>
                                  <td>{dateStr}</td>
                                  <td>{timeRange}</td>
                                  <td>
                                    <span className={`status-badge ${isOnline ? 'online' : 'onsite'}`}>
                                      {isOnline ? 'Online' : 'On-site'}
                                    </span>
                                  </td>
                                  <td>
                                    <div className="table-actions">
                                      <button className="btn-table-action view" onClick={() => handleViewBookingDetails(item)}>
                                        ดูรายละเอียด
                                      </button>
                                      <button className="btn-table-action cancel" onClick={() => handleDeleteBooking(item.id)}>
                                        ยกเลิก
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <div className="pagination-controls">
                        <button
                          className="page-btn"
                          disabled={currentPage === 1}
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        >
                          <ChevronLeft size={16} />
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                          <button
                            key={page}
                            className={`page-btn ${currentPage === page ? 'active' : ''}`}
                            onClick={() => setCurrentPage(page)}
                          >
                            {page}
                          </button>
                        ))}
                        <button
                          className="page-btn"
                          disabled={currentPage === totalPages}
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        >
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </div>

      <BookingPreviewModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        onConfirm={handleConfirmBooking}
        data={{
          type: formData.type,
          subject: formData.subject,
          date: formData.days[0],
          timeSlot: formData.startTime ? `${formData.startTime} - ${calculateEndTime(formData.startTime, formData.duration).split('-')[1]} น.` : '-',
          duration: formData.duration === 'กำหนดเอง' ? `${customDuration} ${customDurationUnit}` : formData.duration,
          meetingFormat: formData.meetingFormat,
          location: formData.location,
          description: formData.description
        }}
      />

      {/* View Details Modal */}
      {viewingBooking && (
        <BookingPreviewModal
          isOpen={!!viewingBooking}
          onClose={() => setViewingBooking(null)}
          readOnly={true}
          data={viewingBooking}
        />
      )}

      <CustomDurationModal
        isOpen={showDurationModal}
        onClose={handleCustomDurationCancel}
        onConfirm={handleCustomDurationConfirm}
        initialValue={customDuration}
        initialUnit={customDurationUnit}
      />

      {popupMessage.type === 'success' && <PopupModal message={popupMessage.message} onClose={() => setPopupMessage({ type: '', message: '' })} />}
      {popupMessage.type === 'error' && <ErrorPopup message={popupMessage.message} onClose={() => setPopupMessage({ type: '', message: '' })} />}
    </div>
  );
};
export default User;
