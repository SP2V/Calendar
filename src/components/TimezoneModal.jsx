import React, { useState, useEffect, useMemo } from 'react';
import './TimezoneModal.css';
import TimeZoneIcon from '../assets/TimeZone.jpg';
import TimeDropdown from './AdminDropdown';

const TimezoneModal = ({ isOpen, onClose }) => {
    // We store the full label string as the value because TimeDropdown works best with strings
    const [selectedTimezoneLabel, setSelectedTimezoneLabel] = useState("(GMT+07:00) Asia/Bangkok");

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
                        offsetMinutes: totalMinutes
                    };
                } catch (e) {
                    return null;
                }
            }).filter(Boolean);

            list.sort((a, b) => a.offsetMinutes - b.offsetMinutes);

            // Return just the labels for TimeDropdown
            return list.map(item => item.label);
        } catch (error) {
            console.error("Intl API not supported", error);
            // Fallback
            return ['(GMT+07:00) Asia/Bangkok'];
        }
    }, []);

    // Effect to set default
    useEffect(() => {
        if (isOpen) {
            // Try to match "(GMT+07:00) Asia/Bangkok" or fallback to first item
            const defaultTz = timezoneList.find(t => t.includes('Bangkok'));
            if (defaultTz) {
                setSelectedTimezoneLabel(defaultTz);
            } else if (timezoneList.length > 0) {
                setSelectedTimezoneLabel(timezoneList[0]);
            }
        }
    }, [isOpen, timezoneList]);

    if (!isOpen) return null;

    return (
        <div className="timezone-modal-overlay" onClick={onClose}>
            <div className="timezone-modal-box" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="timezone-header">
                    <div className="timezone-title-row">
                        <img src={TimeZoneIcon} alt="Icon" style={{ width: 28, height: 28 }} />
                        <span className="timezone-title-text">เขตเวลา</span>
                    </div>
                </div>

                {/* Body */}
                <div className="timezone-body">
                    <label className="timezone-label">เขตเวลา</label>
                    <div className="timezone-select-wrapper" style={{ marginBottom: '16px' }}>
                        <TimeDropdown
                            value={selectedTimezoneLabel}
                            onChange={(val) => setSelectedTimezoneLabel(val)}
                            timeOptions={timezoneList}
                            placeholder="ค้นหาเขตเวลา..."
                            className="timezone-dropdown"
                        />
                    </div>

                    <label className="timezone-checkbox-row">
                        <input type="checkbox" className="timezone-checkbox" />
                        <span className="timezone-checkbox-text">
                            ขอให้อัปเดตเขตเวลาหลักของฉันเป็นตำแหน่งปัจจุบัน
                        </span>
                    </label>
                </div>

            </div>
        </div>
    );
};

export default TimezoneModal;
