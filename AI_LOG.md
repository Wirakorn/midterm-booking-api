```markdown
# AI Log — Midterm Practical Lab Test

## Log Entry 1: Planning and Initial Setup
- **Prompt:** ช่วยสรุปโจทย์ ออกแบบ Database Schema และสร้าง API Contract สำหรับระบบจองอุปกรณ์
- **AI Output Used:** นำโครงสร้างตาราง `equipment`, `bookings` และรายละเอียดสเปก API ใน `API_CONTRACT.md` มาใช้งาน
- **Verification:** ตรวจสอบชื่อฟิลด์ (`equipmentId`, `borrowerName`, `startAt`, `endAt`, `purpose`) ให้ตรงกับโจทย์กำหนด และตรวจสอบความสัมพันธ์ Foreign Key

## Log Entry 2: Implementation of API Endpoints
- **Prompt:** เขียนโค้ด API สำหรับ CRUD Operation, Validate ข้อมูล, SQL Parameter Binding และ Overlapping logic (`409 Conflict`)
- **AI Output Used:** โค้ดใน `src/index.ts`
- **Verification:** ตรวจสอบความเงื่อนไข Overlapping logic ให้ตรงกับสูตร `startAt < existing.endAt AND endAt > existing.startAt` และตรวจสอบการจัดการ HTTP Status Codes (200, 201, 204, 400, 404, 409)

## Log Entry 3: Quality Gate Review and Testing
- **Prompt:** สรุปการทำ Quality Gate Review, คำสั่งยิง `curl` และสร้าง README.md
- **AI Output Used:** ตารางปรับปรุงใน `QUALITY_GATE_REVIEW.md` และขั้นตอนใน `README.md`
- **Verification:** ทดสอบยิง `curl` ผ่าน `cmd` ครบทุกเคส และยืนยันผลลัพธ์ว่าตรงกับ HTTP Status Codes ที่กำหนดไว้