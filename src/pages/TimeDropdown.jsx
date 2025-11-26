import React, { useState, useRef, useEffect } from "react";
import "./TimeDropdown.css";

const TimeDropdown = ({ value, onChange, timeOptions, placeholder = "เลือกเวลา" }) => {
    const [open, setOpen] = useState(false);
    const [inputValue, setInputValue] = useState(value || "");
    const [filteredOptions, setFilteredOptions] = useState(timeOptions || []);
    const dropdownRef = useRef(null);
    const inputRef = useRef(null);

    // อัปเดต inputValue เมื่อ value เปลี่ยนจากภายนอก
    useEffect(() => {
        setInputValue(value || "");
    }, [value]);

    // เมื่อเปิด dropdown ให้แสดงรายการทั้งหมด
    useEffect(() => {
        if (open && timeOptions && timeOptions.length > 0) {
            // ถ้าเปิด dropdown และมีการพิมพ์ ให้กรอง
            if (inputValue.trim() !== "") {
                const filtered = timeOptions.filter(option => {
                    const optionStr = typeof option === 'string' ? option : option.toString();
                    return optionStr.toLowerCase().includes(inputValue.toLowerCase()) || 
                           optionStr.toLowerCase().startsWith(inputValue.toLowerCase());
                });
                setFilteredOptions(filtered);
            } else {
                // ถ้าเปิด dropdown แต่ยังไม่พิมพ์ ให้แสดงทั้งหมด
                setFilteredOptions(timeOptions);
            }
        }
    }, [open, inputValue, timeOptions]);

    // ปิด dropdown เมื่อคลิกข้างนอก
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setOpen(false);
                // ถ้า inputValue ไม่ตรงกับ value ที่ถูกต้อง ให้ใช้ค่าเดิม
                if (inputValue !== value) {
                    setInputValue(value || "");
                }
            }
        };

        if (open) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [open, inputValue, value]);

    const handleInputChange = (e) => {
        const newValue = e.target.value;
        setInputValue(newValue);
        if (!open) {
            setOpen(true);
        }
        onChange(newValue);
    };

    const handleInputFocus = (e) => {
        setOpen(true);
        // เมื่อ focus ให้แสดงรายการทั้งหมด (ไม่กรองตาม inputValue)
        setFilteredOptions(timeOptions || []);
        // Select all text เพื่อให้สามารถพิมพ์ใหม่ได้
        setTimeout(() => {
            e.target.select();
        }, 0);
    };

    const handleSelectOption = (option) => {
        setInputValue(option);
        onChange(option);
        setOpen(false);
        // ไม่ blur input เพื่อให้สามารถเลือกใหม่ได้ทันที
    };

    const handleInputKeyDown = (e) => {
        if (e.key === "Enter" && filteredOptions.length > 0) {
            handleSelectOption(filteredOptions[0]);
        } else if (e.key === "Escape") {
            setOpen(false);
            inputRef.current?.blur();
        }
    };

    return (
        <div className="time-dropdown" ref={dropdownRef}>
            <input
                ref={inputRef}
                type="text"
                className={`time-input ${inputValue ? 'has-value' : ''}`}
                value={inputValue}
                onChange={handleInputChange}
                onFocus={handleInputFocus}
                onKeyDown={handleInputKeyDown}
                placeholder={placeholder}
            />
            <div
                className="dropdown-arrow"
                onClick={() => {
                    if (!open) {
                        // เมื่อเปิด dropdown ให้แสดงรายการทั้งหมด
                        setFilteredOptions(timeOptions || []);
                        setOpen(true);
                        inputRef.current?.focus();
                        // Select all text เพื่อให้สามารถพิมพ์ใหม่ได้
                        setTimeout(() => {
                            inputRef.current?.select();
                        }, 0);
                    } else {
                        setOpen(false);
                    }
                }}
            >
                <svg viewBox="0 0 20 20" fill="none" width="16" height="16">
                    <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            </div>

            {open && filteredOptions.length > 0 && (
                <div className="dropdown-list">
                    {filteredOptions.map((t) => {
                        const optionValue = typeof t === 'string' ? t : (t.name || t.toString());
                        const optionKey = typeof t === 'string' ? t : (t.id || t.toString());
                        return (
                            <div
                                key={optionKey}
                                className="dropdown-item"
                                onClick={() => handleSelectOption(optionValue)}
                            >
                                {optionValue}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default TimeDropdown;
