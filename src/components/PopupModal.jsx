import React, { useState, useRef, useEffect } from "react";
import "./PopupModal.css";

const PopupModal = ({ message, onClose }) => {
  return (
    <div className="popup-overlay">
      <div className="popup-box">
        <p className="popup-message">{message}</p>
        {/* <button className="popup-btn" onClick={onClose}>ตกลง</button> */}
      </div>
    </div>
  );
};

export default PopupModal;
