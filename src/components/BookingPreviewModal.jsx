import React from 'react';
import { Calendar, X } from 'lucide-react';
import './BookingPreviewModal.css';

const BookingPreviewModal = ({ isOpen, onClose, onConfirm, data, readOnly = false }) => {
    if (!isOpen) return null;

    // Helper to format date
    const formatThaiDate = (dateStr) => {
        if (!dateStr) return '-';
        const months = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
        const [y, m, d] = dateStr.split('-').map(Number);
        return `${d} ${months[m - 1]} ${y + 543}`;
    };

    // Prevent body scroll when modal is open
    React.useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    return (
        <div className="preview-modal-overlay">
            <div className="preview-modal-container">
                {/* Close Button X (Only for ReadOnly view or general close usage) */}
                {readOnly && (
                    <button className="btn-close-x" onClick={onClose}>
                        <X size={24} />
                    </button>
                )}
                {/* Header Icon */}
                <div className="icon-wrapper">
                    <div className="icon-circle">
                        <Calendar size={40} strokeWidth={1.5} />
                    </div>
                </div>

                {/* Title */}
                <div className="modal-header-text">
                    <h2 className="modal-title">{readOnly ? 'รายละเอียดการนัดหมาย' : 'ตรวจสอบการจอง'}</h2>
                    <p className="modal-subtitle">{readOnly ? 'ข้อมูลการนัดหมายทั้งหมด' : 'ข้อมูลการจองของคุณ'}</p>
                </div>

                {/* Content Box */}
                <div className="content-box">
                    <div className="details-list">
                        <div className="detail-row">
                            <span className="detail-label">กิจกรรม</span>
                            <span className="detail-value">{data.type}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">หัวข้อ</span>
                            <span className="detail-value">{data.subject}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">ระยะเวลา</span>
                            <span className="detail-value">{data.duration}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">วันที่</span>
                            <span className="detail-value">{formatThaiDate(data.date)}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">เวลา</span>
                            <span className="detail-value">{data.timeSlot}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">รูปแบบ</span>
                            <span className="detail-value">{data.meetingFormat}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">{data.meetingFormat === 'Online' ? 'ลิงก์ประชุม' : 'สถานที่'}</span>
                            <span className="detail-value">
                                {data.meetingFormat === 'Online' ? (
                                    <a href={data.location} target="_blank" rel="noopener noreferrer" className="link-text">{data.location}</a>
                                ) : (
                                    data.location
                                )}
                            </span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">รายละเอียดเพิ่มเติม</span>
                            <span className="detail-value">{data.description || '-'}</span>
                        </div>
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="modal-footer">
                    {!readOnly && (
                        <>
                            <button className="btn-modal btn-edit" onClick={() => {
                                document.body.style.overflow = 'unset';
                                onClose();
                            }}>
                                แก้ไข
                            </button>
                            <button className="btn-modal btn-confirm-modal" onClick={onConfirm}>
                                ยืนยัน
                            </button>
                        </>
                    )}
                </div>

            </div>
        </div>
    );
};

export default BookingPreviewModal;
