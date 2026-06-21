# Bat-Stock (ERP & POS System)

ระบบบริหารจัดการทรัพยากรองค์กร (ERP) และระบบขายหน้าร้าน (POS) ที่ออกแบบมารองรับมาตรฐานการบัญชีและภาษีของประเทศไทยโดยเฉพาะ

---

## ฟีเจอร์หลักของระบบ (Key Features)

* ** ระบบขายหน้าร้าน (POS):** จัดการการขายสินค้า, คำนวณยอดเงินรวม/ภาษี, และรองรับการชำระเงินออนไลน์ผ่าน Omise Payment Gateway
* ** ระบบจัดซื้อ (Purchase Order - PO):** สร้างใบสั่งซื้อ, จัดการข้อมูลคู่ค้า (Supplier), และตั้งหนี้ (Accounts Payable)
* ** ระบบคลังสินค้า (Inventory & Lot Management):** รับของเข้าสต็อกอัตโนมัติเมื่อปิด PO พร้อมระบบจัดการเลขล็อต (Lot Number) และติดตามวันหมดอายุ
* ** ระบบเอกสารและภาษี (Tax & Accounting):**
  * เจเนอเรตใบกำกับภาษี/ใบเสร็จรับเงิน (Tax Invoice/Receipt) เป็นไฟล์ PDF ภาษาไทยสมบูรณ์แบบ
  * เจเนอเรตไฟล์ XML มาตรฐาน E-Tax Invoice ของกรมสรรพากร (ETDA)
  * เจเนอเรตหนังสือรับรองการหักภาษี ณ ที่จ่าย (ใบ 50 ทวิ) อัตโนมัติในรูปแบบ PDF
* ** ระบบรักษาความปลอดภัย (Security):** ระบบจัดการผู้ใช้งานและสิทธิ์ผู้ดูแลระบบ (Admin) พร้อมการเข้ารหัสพาสเวิร์ดขั้นสูง

---

## การตั้งค่าระบบ Environment (`.env`)

ก่อนเริ่มรันระบบฝั่ง Backend ให้ทำการสร้างไฟล์ชื่อ `.env` ไว้ที่โฟลเดอร์ราก (Root) ของ `erp-backend` (ระดับเดียวกับไฟล์ `package.json`) และคัดลอกค่าคอนฟิกด้านล่างนี้ไปใส่ พร้อมแก้ไขข้อมูลให้เป็นของคุณเอง:

```env
# ---- SERVER SETTINGS ----
PORT=3000
FRONTEND_URL=http://localhost:4200

# ---- PAYMENT GATEWAY (OMISE) ----
OMISE_PUBLIC_KEY=pkey_test_67www3xb6v7g4q20d1q
OMISE_SECRET_KEY=skey_test_67www3xyzmtlkg45r7w

# ---- DEFAULT ADMIN ACCOUNT ----
INITIAL_ADMIN_USER=master
INITIAL_ADMIN_PASS=MasterSecurePass@GrixStore!

# ---- THAI TAX & E-TAX SETTINGS (มาตรฐานสรรพากรไทย) ----
COMPANY_NAME="[ระบุชื่อบริษัท หรือ ชื่อร้านค้าของคุณในไฟล์ .env]"
COMPANY_TAX_ID="[ระบุเลขประจำตัวผู้เสียภาษี 13 หลักในไฟล์ .env]"
COMPANY_BRANCH="00000" # ระบุ 00000 สำหรับสำนักงานใหญ่ หรือใส่เลขสาขา 5 หลัก
COMPANY_ADDRESS="[ระบุที่อยู่บริษัทในไฟล์ .env]"
DEFAULT_VAT_RATE=7