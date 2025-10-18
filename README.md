# Habit Tracker App

แอปพลิเคชันติดตาม Habit ประจำวันที่สร้างด้วย React Native (Expo) และ Firebase

## คุณสมบัติ

- 🔐 ระบบ Login/Register ด้วย Firebase Authentication
- 📅 แสดงวันที่แบบปฏิทินไทย (พ.ศ.)
- ✅ จัดการ Habits ประจำวัน
- 🔔 ระบบแจ้งเตือน
- 📊 ติดตามความคืบหน้า

## การติดตั้ง

1. Clone repository และติดตั้ง dependencies:

```bash
git clone <your-repo-url>
cd HabitTrackerApp
npm install
```

2. ตั้งค่า Firebase:
   - ไปที่ [Firebase Console](https://console.firebase.google.com/)
   - สร้าง Project ใหม่
   - เพิ่ม Web App
   - คัดลอก Firebase Configuration
   - คัดลอกไฟล์ `src/config/firebase.example.ts` เป็น `src/config/firebase.ts`:

```bash
copy src\config\firebase.example.ts src\config\firebase.ts
# หรือบน Mac/Linux: cp src/config/firebase.example.ts src/config/firebase.ts
```

- แก้ไขไฟล์ `src/config/firebase.ts` ใส่ค่า Firebase Config ของคุณ:

```typescript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
};
```

**หมายเหตุ:** ไฟล์ `firebase.ts` จะไม่ถูก track โดย Git เพื่อความปลอดภัย

3. เปิดใช้งาน Firebase Authentication:

   - ไปที่ Authentication > Sign-in method
   - เปิดใช้งาน Email/Password

4. สร้าง Firestore Database:
   - ไปที่ Firestore Database
   - สร้าง Database (เริ่มใน Test mode)
   - จะมี collections: `users`, `habits`

## โครงสร้างไฟล์

```
HabitTrackerApp/
├── src/
│   ├── config/
│   │   └── firebase.ts          # Firebase configuration
│   ├── navigation/
│   │   └── AppNavigator.tsx     # Navigation setup
│   ├── screens/
│   │   ├── LoginScreen.tsx      # หน้าล็อกอิน
│   │   ├── RegisterScreen.tsx   # หน้าสมัครสมาชิก
│   │   └── HomeScreen.tsx       # หน้าหลัก (แสดง Habits)
│   └── types/
│       └── index.ts             # TypeScript types
├── assets/
│   └── icon.png                 # Logo แอป
├── App.tsx
└── package.json
```

## การรันแอป

```bash
# เริ่มต้น Metro bundler
npm start

# รันบน iOS Simulator
npm run ios

# รันบน Android Emulator
npm run android

# รันบน Expo Go
สแกน QR Code ด้วยแอป Expo Go
```

## Firestore Collections Structure

### users

```
{
  uid: string,
  username: string,
  email: string,
  createdAt: timestamp
}
```

### habits

```
{
  id: string,
  userId: string,
  title: string,
  description: string,
  time: string,
  icon: string,
  color: string,
  completed: boolean,
  createdAt: timestamp
}
```

## หน้าจอที่มี

1. **Login Screen** - หน้าเข้าสู่ระบบ
2. **Register Screen** - หน้าสมัครสมาชิก
3. **Home Screen** - หน้าแสดง Habits พร้อมปฏิทิน

## การพัฒนาต่อ

- เพิ่มหน้าสำหรับสร้าง/แก้ไข Habit
- เพิ่มระบบ Push Notification
- เพิ่มสถิติและกราฟแสดงความคืบหน้า
- เพิ่ม Bottom Navigation เต็มรูปแบบ

## Technologies

- React Native (Expo)
- TypeScript
- Firebase (Authentication + Firestore)
- React Navigation
- date-fns
