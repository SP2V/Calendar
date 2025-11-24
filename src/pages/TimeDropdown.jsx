import React, { useState } from "react";
import "./TimeDropdown.css";

const TimeDropdown = ({ value, onChange, timeOptions }) => {
    const [open, setOpen] = useState(false);

    return (
        <div className="time-dropdown">
            <div className="display" onClick={() => setOpen(!open)}>
                {value || "เลือกเวลา"}
            </div>

            {open && (
                <div className="dropdown-list">
                    {timeOptions.map((t) => (
                        <div
                            key={t}
                            className="dropdown-item"
                            onClick={() => {
                                onChange(t);
                                setOpen(false);
                            }}
                        >
                            {t}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TimeDropdown;
