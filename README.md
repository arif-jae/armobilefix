# บัญชีร้านซ่อมมือถือ

แอพบันทึกงานซ่อม ลูกค้า สต๊อกอะไหล่ รายรับ-รายจ่าย และกำไร
โค้ดเก็บบน GitHub (โฮสต์ด้วย GitHub Pages) ข้อมูลเก็บบน Supabase

## โครงสร้างไฟล์
- `index.html` : ตัวแอพ (ไฟล์เดียว)
- `supabase-setup.sql` : สคริปต์สร้างตารางและสิทธิ์ใน Supabase

## ตั้งค่า Supabase
1. สร้างโปรเจกต์ที่ https://supabase.com
2. SQL Editor → วางและรัน `supabase-setup.sql`
3. Authentication → Users → Add user (สร้างบัญชีพนักงาน)
4. Project Settings → API → คัดลอก Project URL และ anon public key
5. แก้ 2 บรรทัดบนสุดของสคริปต์ใน `index.html`: `SUPABASE_URL` และ `SUPABASE_KEY`

> ใส่เฉพาะ **anon public key** เท่านั้น ห้ามนำ `service_role` key ขึ้น GitHub เด็ดขาด
> ข้อมูลปลอดภัยด้วย Row Level Security (ต้องล็อกอินจึงอ่าน/เขียนได้)

## เผยแพร่ด้วย GitHub Pages
1. สร้าง repository ใหม่ แล้วอัปโหลด `index.html`, `supabase-setup.sql`, `README.md`
2. Settings → Pages → Source: Deploy from a branch → Branch: `main` / `(root)` → Save
3. รอ 1-2 นาที จะได้ลิงก์ `https://<ชื่อผู้ใช้>.github.io/<ชื่อ repo>/`
4. เปิดลิงก์บนทุกเครื่อง ล็อกอินด้วยบัญชีจากข้อ 3 แล้วใช้งานได้เลย

## อัปเดตแอพ
แก้ไฟล์ `index.html` บน GitHub แล้ว commit เว็บจะอัปเดตเองภายในไม่กี่นาที
