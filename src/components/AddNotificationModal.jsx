import React, { useState, useRef, useEffect } from 'react';
import { X, Calendar, Clock, ChevronDown, Search, ChevronRight, RotateCcw, Check as IconCheck, ChevronLeft as IconChevronLeft } from 'lucide-react';
import { AlarmClock } from 'lucide-react';
import { thaiTimezones } from '../constants/timezones';
import './AddNotificationModal.css';

const AddNotificationModal = ({ isOpen, onClose, onSave, initialData = null }) => {
    const [title, setTitle] = useState('');
    const [time, setTime] = useState('');
    const [date, setDate] = useState('');
    const [timezone, setTimezone] = useState('Asia/Bangkok');

    // Dropdown state
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [filterText, setFilterText] = useState("");
    const dropdownRef = useRef(null);

    const [view, setView] = useState('MAIN'); // 'MAIN' | 'DAYS'
    const [selectedDays, setSelectedDays] = useState([]); // Array of integers 0-6 (Sun-Sat)

    const daysOfWeek = [
        { id: 0, label: 'ทุกวันอาทิตย์' },
        { id: 1, label: 'ทุกวันจันทร์' },
        { id: 2, label: 'ทุกวันอังคาร' },
        { id: 3, label: 'ทุกวันพุธ' },
        { id: 4, label: 'ทุกวันพฤหัสบดี' },
        { id: 5, label: 'ทุกวันศุกร์' },
        { id: 6, label: 'ทุกวันเสาร์' },
    ];

    // Initial value effect or when opening
    useEffect(() => {
        if (isOpen) {
            setView('MAIN'); // Reset view
            if (initialData) {
                // Edit Mode
                setTitle(initialData.title || '');
                setTime(initialData.time || '');
                setDate(initialData.date || new Date().toLocaleDateString('en-CA'));
                setTimezone(initialData.timezoneRef || initialData.timezone || 'Asia/Bangkok');
                if (initialData.repeatDays) {
                    setSelectedDays(initialData.repeatDays);
                } else {
                    setSelectedDays([]);
                }
            } else {
                // Add Mode
                setTitle('');
                setTime('');
                setDate(new Date().toLocaleDateString('en-CA'));
                setTimezone('Asia/Bangkok');
                setSelectedDays([]);
            }
        }
    }, [isOpen, initialData]);

    // Prevent background scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    // Click outside handler
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };

        if (isDropdownOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isDropdownOpen]);

    if (!isOpen) return null;

    const handleSave = () => {
        if (!title || !time || (selectedDays.length === 0 && !date)) return;
        const selectedTz = thaiTimezones.find(tz => tz.value === timezone);

        const saveData = {
            title,
            time,
            date: selectedDays.length === 0 ? date : null,
            repeatDays: selectedDays,
            timezoneRef: timezone,
            timezone: selectedTz ? selectedTz.label : timezone
        };

        if (initialData && initialData.id) {
            saveData.id = initialData.id;
        }

        onSave(saveData);
        if (!initialData) handleClose();
        else onClose();
    };

    const handleClose = () => {
        setTitle('');
        setTime('');
        setDate('');
        setTimezone('Asia/Bangkok');
        setSelectedDays([]);
        setView('MAIN');
        onClose();
    };

    const toggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen);
        setFilterText(""); // Reset filter on toggle
    };

    const handleSelectTimezone = (tzValue) => {
        setTimezone(tzValue);
        setIsDropdownOpen(false);
    };

    const toggleDaySelection = (dayId) => {
        setSelectedDays(prev => {
            if (prev.includes(dayId)) {
                return prev.filter(id => id !== dayId);
            } else {
                return [...prev, dayId].sort();
            }
        });
    }

    // Filter timezones
    const filteredTimezones = thaiTimezones.filter(tz =>
        tz.label.toLowerCase().includes(filterText.toLowerCase())
    );

    const selectedTimezoneLabel = thaiTimezones.find(tz => tz.value === timezone)?.label || timezone;

    // Helper to format repeat text
    const getRepeatText = () => {
        if (selectedDays.length === 0) return "ไม่ซ้ำ";
        if (selectedDays.length === 7) return "ทุกวัน";

        // Check for Weekend (Sat + Sun only)
        const isWeekend = selectedDays.length === 2 && selectedDays.includes(0) && selectedDays.includes(6);
        if (isWeekend) return "ทุกวันสุดสัปดาห์";

        // Check for Weekday (Mon-Fri only)
        const isWeekday = selectedDays.length === 5 && [1, 2, 3, 4, 5].every(d => selectedDays.includes(d));
        if (isWeekday) return "ทุกวันธรรมดา";

        // Map ids back to short names if needed, or just list count
        // For now, let's keep it simple or join labels
        return selectedDays.map(id => daysOfWeek.find(d => d.id === id).label.replace('ทุกวัน', '')).join(', ');
    };

    // Sub-view: Select Days
    if (view === 'DAYS') {
        return (
            <div className="an-modal-overlay">
                <div className="an-modal-container slide-in">
                    <div className="an-modal-header">
                        <div className="an-header-nav">
                            <button className="an-nav-btn" onClick={() => setView('MAIN')} style={{ marginRight: 'auto' }}>
                                <IconChevronLeft size={24} />
                            </button>
                            <span className="an-header-title">เลือกวัน</span>
                            <button className="an-nav-action" onClick={() => setView('MAIN')}>บันทึก</button>
                        </div>
                    </div>
                    <div className="an-modal-body no-padding">
                        <div className="an-day-list">
                            {daysOfWeek.map(day => (
                                <div key={day.id} className="an-day-item" onClick={() => toggleDaySelection(day.id)}>
                                    <span>{day.label}</span>
                                    <div className={`an-checkbox ${selectedDays.includes(day.id) ? 'checked' : ''}`}>
                                        {selectedDays.includes(day.id) && <IconCheck size={14} color="white" />}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="an-modal-overlay" onClick={handleClose}>
            <div className="an-modal-container" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="an-modal-header">
                    <div className="an-title-box">
                        <AlarmClock size={28} strokeWidth={2.5} color="#2563eb" />
                        <span>{initialData ? 'แก้ไขการแจ้งเตือน' : 'ตั้งนาฬิกาเตือน'}</span>
                    </div>
                </div>

                {/* Body */}
                <div className="an-modal-body">
                    {/* Name */}
                    <div className="an-input-group">
                        <label className="an-label">ชื่อการเตือน</label>
                        <input
                            type="text"
                            className="an-input-name"
                            placeholder="ระบุชื่อการแจ้งเตือน"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                        />
                    </div>

                    {/* Time & Date Row */}
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <div className="an-input-group" style={{ flex: 1 }}>
                            <label className="an-label">เวลา</label>
                            <div className="an-input-wrapper">
                                <Clock className="an-input-icon-left" size={20} strokeWidth={2} />
                                <input
                                    type="time"
                                    className="an-input with-icon"
                                    value={time}
                                    onChange={e => setTime(e.target.value)}
                                    style={{ color: time ? '#1f2937' : '#9ca3af' }}
                                />
                                <ChevronDown className="an-select-chevron" size={16} />
                            </div>
                        </div>

                        {/* Date (Only if No Repeat) */}
                        {selectedDays.length === 0 && (
                            <div className="an-input-group" style={{ flex: 1 }}>
                                <label className="an-label">วันที่</label>
                                <div className="an-input-wrapper">
                                    <Calendar className="an-input-icon-left" size={20} strokeWidth={2} />
                                    <input
                                        type="text"
                                        className="an-input with-icon"
                                        value={date ? date.split('-').reverse().join('/') : ''}
                                        placeholder="dd/mm/yyyy"
                                        readOnly
                                        style={{ color: date ? '#1f2937' : '#9ca3af' }}
                                    />
                                    <input
                                        type="date"
                                        className="an-input"
                                        value={date}
                                        onChange={e => setDate(e.target.value)}
                                        style={{
                                            position: 'absolute',
                                            left: 0,
                                            top: 0,
                                            width: '100%',
                                            height: '100%',
                                            opacity: 0,
                                            cursor: 'pointer',
                                            zIndex: 10
                                        }}
                                    />
                                    <ChevronDown className="an-select-chevron" size={16} />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Repeat Days */}
                    <div className="an-input-group">
                        <label className="an-label">ทำซ้ำ</label>
                        <div className="an-input-wrapper" onClick={() => setView('DAYS')} style={{ cursor: 'pointer' }}>
                            <RotateCcw className="an-input-icon-left" size={20} strokeWidth={2} />
                            <input
                                type="text"
                                className="an-input with-icon"
                                value={getRepeatText()}
                                readOnly
                                style={{ color: '#1f2937', cursor: 'pointer' }}
                            />
                            <ChevronRight className="an-select-chevron" size={16} />
                        </div>
                    </div>

                    {/* Timezone Custom Dropdown */}
                    <div className="an-input-group" style={{ zIndex: 20 }}>
                        <label className="an-label">เขตเวลา</label>
                        <div className="an-select-wrapper" ref={dropdownRef}>
                            <div
                                className="an-input"
                                onClick={toggleDropdown}
                                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                            >
                                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginRight: '20px' }}>
                                    {selectedTimezoneLabel}
                                </span>
                                <ChevronDown className="an-select-chevron" size={16} style={{ position: 'static', transform: 'none' }} />
                            </div>

                            {isDropdownOpen && (
                                <div className="an-dropdown-list">
                                    <div className="an-search-box">
                                        <Search size={16} color="#9ca3af" style={{ marginRight: '8px' }} />
                                        <input
                                            type="text"
                                            placeholder="ค้นหา..."
                                            className="an-search-input"
                                            value={filterText}
                                            onChange={e => setFilterText(e.target.value)}
                                            autoFocus
                                            onClick={e => e.stopPropagation()}
                                        />
                                    </div>
                                    <div className="an-list-items">
                                        {filteredTimezones.length > 0 ? filteredTimezones.map(tz => (
                                            <div
                                                key={tz.value}
                                                className={`an-dropdown-item ${timezone === tz.value ? 'active' : ''}`}
                                                onClick={() => handleSelectTimezone(tz.value)}
                                            >
                                                {tz.label}
                                            </div>
                                        )) : (
                                            <div className="an-no-results">ไม่พบข้อมูล</div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="an-modal-footer">
                    <button className="an-btn cancel" onClick={handleClose}>ยกเลิก</button>
                    <button className="an-btn save" onClick={handleSave}>บันทึก</button>
                </div>
            </div>
        </div>
    );
};

export default AddNotificationModal;
