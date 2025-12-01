import React from "react";
import { FaCheck } from "react-icons/fa";
import "./PopupModal.css";

const PopupModal = ({ message, onClose }) => {
  return (
    <div className="popup-overlay">
      <div className="popup-box">
        <div className="success-icon">
          <FaCheck />
        </div>
        <p className="popup-message">{message}</p>
        {/* <button className="popup-btn" onClick={onClose}>ตกลง</button> */}
      </div>
    </div>
  );
};

export default PopupModal;
