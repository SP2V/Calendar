import React, { useState, useRef, useEffect } from 'react';
import { X, Calendar, Clock, ChevronDown, Search } from 'lucide-react';
import { AlarmClock } from 'lucide-react';
import { thaiTimezones } from '../constants/timezones';
import './AddNotificationModal.css';

const AddNotificationModal = ({ isOpen, onClose, onSave, initialDate = '' }) => {
    const [title, setTitle] = useState('');
    const [date, setDate] = useState(initialDate);
    const [time, setTime] = useState('');
    const [timezone, setTimezone] = useState('Asia/Bangkok');

    // Dropdown state
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [filterText, setFilterText] = useState("");
    const dropdownRef = useRef(null);

    // Initial value effect or when opening
    // (timezone state is already set)

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
        if (!title || !date || !time) return;
        const selectedTz = thaiTimezones.find(tz => tz.value === timezone);
        onSave({ title, date, time, timezoneRef: timezone, timezone: selectedTz ? selectedTz.label : timezone });
        handleClose();
    };

    const handleClose = () => {
        setTitle('');
        setDate('');
        setTime('');
        setTimezone('Asia/Bangkok');
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

    // Filter timezones
    const filteredTimezones = thaiTimezones.filter(tz =>
        tz.label.toLowerCase().includes(filterText.toLowerCase())
    );

    const selectedTimezoneLabel = thaiTimezones.find(tz => tz.value === timezone)?.label || timezone;

    return (
        <div className="an-modal-overlay" onClick={handleClose}>
            <div className="an-modal-container" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="an-modal-header">
                    <div className="an-title-box">
                        <AlarmClock size={28} strokeWidth={2.5} color="#2563eb" />
                        <span>ตั้งนาฬิกาเตือน</span>
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

                    {/* Date */}
                    <div className="an-input-group">
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

                    {/* Time */}
                    <div className="an-input-group">
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
