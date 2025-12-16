import React, { useState, useEffect, useMemo, useRef } from 'react';
import './TimezoneModal.css';
import { Clock, ChevronDown, AlertCircle } from 'lucide-react';

const TimezoneModal = ({ isOpen, onClose }) => {
    // State
    const [selectedTimezoneLabel, setSelectedTimezoneLabel] = useState("(GMT+07:00) Asia/Bangkok");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Filter state
    const [filterText, setFilterText] = useState("");

    // Memoize the timezone list generation
    const timezoneList = useMemo(() => {
        try {
            const timeZones = Intl.supportedValuesOf('timeZone');

            const list = timeZones.map(tz => {
                try {
                    const parts = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'longOffset' }).formatToParts(new Date());
                    const offsetPart = parts.find(p => p.type === 'timeZoneName');
                    const offset = offsetPart ? offsetPart.value : 'GMT+00:00';

                    let totalMinutes = 0;
                    if (offset.includes('GMT')) {
                        const raw = offset.replace('GMT', '').trim();
                        if (raw !== '') {
                            const sign = raw.startsWith('-') ? -1 : 1;
                            const [h, m] = raw.substring(1).split(':').map(Number);
                            totalMinutes = sign * ((h * 60) + (m || 0));
                        }
                    }

                    return {
                        label: `(${offset}) ${tz}`,
                        offsetMinutes: totalMinutes,
                        tz: tz
                    };
                } catch (e) {
                    return null;
                }
            }).filter(Boolean);

            list.sort((a, b) => a.offsetMinutes - b.offsetMinutes);

            // Return full objects for rendering
            return list;
        } catch (error) {
            console.error("Intl API not supported", error);
            // Fallback
            return [{ label: '(GMT+07:00) Asia/Bangkok', tz: 'Asia/Bangkok' }];
        }
    }, []);

    // Effect to set default
    useEffect(() => {
        if (isOpen) {
            const defaultTz = timezoneList.find(t => t.tz.includes('Bangkok'));
            if (defaultTz) {
                setSelectedTimezoneLabel(defaultTz.label);
            } else if (timezoneList.length > 0) {
                setSelectedTimezoneLabel(timezoneList[0].label);
            }
        }
    }, [isOpen, timezoneList]);

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

    const handleSelect = (label) => {
        setSelectedTimezoneLabel(label);
        setIsDropdownOpen(false);
        setFilterText("");
    };

    if (!isOpen) return null;

    // Filtered options
    const filteredOptions = timezoneList.filter(item =>
        item.label.toLowerCase().includes(filterText.toLowerCase())
    );

    return (
        <div className="timezone-modal-overlay" onClick={onClose}>
            <div className="timezone-modal-box" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="timezone-header-redesign">
                    <div className="timezone-title-main">การตั้งค่าเขตเวลา</div>
                    <div className="timezone-subtitle">จัดการเขตเวลาสำหรับการแสดงผลและการแจ้งเตือน</div>
                </div>

                {/* Selection Card */}
                <div className="timezone-selection-card" ref={dropdownRef} onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                    <div className="timezone-icon-box">
                        <Clock size={20} />
                    </div>
                    <div className="timezone-info">
                        <span className="timezone-info-label">เขตเวลาปัจจุบัน</span>
                        <span className="timezone-info-value">{selectedTimezoneLabel}</span>
                    </div>
                    <div className="timezone-chevron">
                        <ChevronDown size={20} />
                    </div>

                    {/* Custom Dropdown */}
                    {isDropdownOpen && (
                        <div className="timezone-dropdown-list" onClick={e => e.stopPropagation()}>
                            {/* Search Input inside dropdown */}
                            <div style={{ padding: '8px' }}>
                                <input
                                    type="text"
                                    placeholder="ค้นหา..."
                                    style={{ width: '100%', padding: '8px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none' }}
                                    value={filterText}
                                    onChange={(e) => setFilterText(e.target.value)}
                                    autoFocus
                                    onClick={e => e.stopPropagation()} // Prevent closing
                                />
                            </div>
                            {filteredOptions.length > 0 ? filteredOptions.map((item, index) => (
                                <div
                                    key={index}
                                    className={`timezone-dropdown-item ${selectedTimezoneLabel === item.label ? 'active' : ''}`}
                                    onClick={() => handleSelect(item.label)}
                                >
                                    {item.label}
                                </div>
                            )) : (
                                <div style={{ padding: '10px', textAlign: 'center', color: '#888' }}>ไม่พบข้อมูล</div>
                            )}
                        </div>
                    )}
                </div>

                {/* Action Button */}
                <button className="timezone-action-btn" onClick={onClose}>
                    เปลี่ยนเขตเวลา
                </button>

                {/* Warning Box */}
                <div className="timezone-warning-box">
                    <div className="timezone-warning-icon">
                        <AlertCircle size={20} />
                    </div>
                    <div className="timezone-warning-content">
                        <div className="timezone-warning-title">ข้อมูลสำคัญ</div>
                        <div className="timezone-warning-desc">
                            การเปลี่ยนเขตเวลาจะส่งผลต่อการแสดงเวลาของการนัดหมายและการแจ้งเตือนทั้งหมด
                            กรุณาตรวจสอบให้แน่ใจก่อนบันทึก
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default TimezoneModal;
