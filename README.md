# React + Vite

โปรเจกต์ React ที่สร้างด้วย Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

## การใช้งาน / Usage

### ติดตั้ง Dependencies
```bash
npm install
```

### รันโปรเจกต์ในโหมด Development
```bash
npm run dev
```

### Build สำหรับ Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

### ตรวจสอบ Code ด้วย ESLint
```bash
npm run lint
```

## ข้อมูลเพิ่มเติม

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## การเปลี่ยนบัญชี Google Calendar ของ Admin / Changing Admin Calendar Account

ระบบจองห้องประชุมนี้เชื่อมต่อกับ Google Calendar ผ่าน **Google Apps Script (GAS)** เพื่อให้สามารถสร้างและลบกิจกรรมในปฏิทินของ Admin ได้โดยไม่ต้องเปิดเผย Credentials ของบัญชีโดยตรง

หากต้องการเปลี่ยนบัญชี Gmail ที่ใช้เป็น Admin สำหรับสร้างนัดหมาย ให้ทำตามขั้นตอนดังนี้:

### 1. สร้าง Google Apps Script ใหม่
1.  ล็อกอินด้วยบัญชี Gmail ที่ต้องการใช้เป็น Admin
2.  ไปที่ [script.google.com](https://script.google.com/) คลิก **New Project**
3.  ลบโค้ดเดิมทั้งหมด แล้ววางโค้ดด้านล่างนี้ลงไป (เป็นโค้ดตัวอย่างสำหรับการทำงานพื้นฐาน):

```javascript
/* 
  Reference Google Apps Script for Meeting Room Booking 
  This script acts as a Web App to interface with Google Calendar.
*/

function doPost(e) {
  try {
    // 1. Parse Request
    // Web App sends data as text/plain to avoid preflight complications
    var requestData = JSON.parse(e.postData.contents);
    
    var calendar = CalendarApp.getDefaultCalendar();
    
    // 2. Determine Action
    if (requestData.action === 'delete') {
      return handleDelete(calendar, requestData);
    } else {
      return handleCreate(calendar, requestData);
    }
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ 
      status: 'error', 
      message: error.toString() 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function handleCreate(calendar, data) {
  // Required: title, startTime (ISO), endTime (ISO)
  // Optional: description, location, userEmail (for guest), colorId
  
  var startTime = new Date(data.startTime);
  var endTime = new Date(data.endTime);
  
  var options = {
    description: data.description || '',
    location: data.location || ''
  };
  
  // Add User as Guest if provided
  if (data.userEmail) {
    options.guests = data.userEmail;
  }
  
  var event = calendar.createEvent(data.title, startTime, endTime, options);
  
  // Set Color if provided
  if (data.colorId) {
    event.setColor(data.colorId);
  }
  
  return ContentService.createTextOutput(JSON.stringify({ 
    status: 'success', 
    eventId: event.getId(),
    message: 'Event created successfully'
  })).setMimeType(ContentService.MimeType.JSON);
}

function handleDelete(calendar, data) {
  var eventId = data.eventId;
  var event = calendar.getEventById(eventId);
  
  if (event) {
    event.deleteEvent();
    return ContentService.createTextOutput(JSON.stringify({ 
      status: 'success', 
      message: 'Event deleted successfully'
    })).setMimeType(ContentService.MimeType.JSON);
  } else {
     return ContentService.createTextOutput(JSON.stringify({ 
      status: 'error', 
      message: 'Event not found'
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
```

### 2. ทำการ Deploy เป็น Web App
1.  คลิกปุ่ม **Deploy** (สีน้ำเงินมุมขวาบน) > **New deployment**
2.  เลือก type เป็น **Web app** (รูปเฟือง)
3.  ตั้งค่าดังนี้:
    -   **Description**: (ตั้งชื่ออะไรก็ได้ เช่น "Calendar API")
    -   **Execute as**: **Me** (บัญชีของคุณ - สำคัญมาก!)
    -   **Who has access**: **Anyone** (เพื่อให้ Application เรียกใช้งานได้)
4.  คลิก **Deploy**
5.  คัดลอก **Web app URL** (ลิงก์ยาวๆ ที่ลงท้ายด้วย `/exec`)

### 3. อัปเดต URL ในโปรเจกต์
1.  เปิดไฟล์ `src/services/calendarService.js`
2.  แก้ไขตัวแปร `API_URL` ให้เป็น URL ใหม่ที่ได้มา:
    ```javascript
    const API_URL = 'https://script.google.com/macros/s/......./exec';
    ```
3.  บันทึกไฟล์และทดสอบการจอง
