import React from "react";
import { FaExclamationCircle } from "react-icons/fa";
import "./ErrorPopup.css";

const ErrorPopup = ({ message, onClose }) => {
  return (
    <div className="error-popup-overlay">
      <div className="error-popup-box">
        <div className="error-icon">
          <FaExclamationCircle />
        </div>
        <p className="error-popup-message">{message}</p>
        <button className="error-popup-btn" onClick={onClose}>
          ตกลง
        </button>
      </div>
    </div>
  );
};

export default ErrorPopup;
