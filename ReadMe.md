# 🧠 Brain Tumor Detection System

A full-stack AI-powered medical imaging system for brain tumor detection and classification. Built for doctors to upload MRI/CT scans and receive instant AI analysis.

---

## 📁 Project Structure

```
brain-tumor-app/
├── ai/                → Flask API + AI Models (Python)
├── backend/           → REST API (NestJS + MongoDB)
└── mobile/            → Mobile App (Flutter)
```

---

## 🧩 System Architecture

```
Flutter App (Mobile)
        ↓
NestJS Backend (Port 3000)
        ↓
Flask AI API (Port 5000)
        ↓
MongoDB Database
```

---

## 🚀 Quick Start

### **1. AI Module (Flask API)**

```bash
cd ai
pip install -r requirements.txt
python complete_api.py
```

**Runs at:** `http://localhost:5000`

### **2. Backend (NestJS)** 🚧 *In Progress*

```bash
cd backend
npm install
npm run start:dev
```

**Runs at:** `http://localhost:3000`

### **3. Mobile App (Flutter)** 🚧 *In Progress*

```bash
cd mobile
flutter pub get
flutter run
```

---

## 📊 Features

### ✅ **Completed:**
- 🤖 **AI Detection:** 95.7% accuracy (U-Net segmentation)
- 🧠 **AI Classification:** 81.3% accuracy (3 tumor types)
- 🩺 **Clinical Analysis:** Size, borders, texture, aggressiveness
- 🔬 **CT Support:** 95.3% detection accuracy
- 📡 **REST API:** Complete Flask API with 5 endpoints
- 📄 **Medical Guide:** Tumor type information & recommendations

### 🚧 **In Progress:**
- 🖥️ NestJS Backend (Authentication, Patient Management)
- 📱 Flutter Mobile App (UI/UX, API Integration)
- 🗄️ MongoDB Integration

---

## 🤖 AI Models

| Model | File | Accuracy | Task |
|-------|------|----------|------|
| U-Net Segmentation | `best_model_256_gpu.h5` | 95.7% | MRI tumor detection |
| CLAHE Classifier | `tumor_classifier_v3.h5` | 81.3% | Tumor type classification |
| CT Detector | `ct_detector_best.h5` | 95.3% | CT tumor detection |

### **Tumor Types Detected:**
- 🔴 Glioma
- 🔵 Meningioma
- 🟢 Pituitary

---

## 📡 API Endpoints (AI Module)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | API information |
| GET | `/health` | Health check |
| POST | `/analyze` | Analyze scan (file upload) |
| POST | `/analyze-base64` | Analyze scan (base64 JSON) |
| GET | `/medical-info` | Medical reference guide |
| GET | `/stats` | Usage statistics |

---

## 📊 Performance Metrics

### **MRI Segmentation:**
```
Accuracy:    95.7%
Dice Score:  82.7%
Sensitivity: 96.3%
Specificity: 95.2%
```

### **MRI Classification:**
```
Overall:     81.3%
├─ Meningioma: 94.1%
├─ Pituitary:  95.2%
└─ Glioma:     48.4%
```

### **CT Detection:**
```
Accuracy:    95.3%
```

### **Clinical Analysis:**
```
✅ Size estimation (cm)
✅ Border irregularity detection
✅ Texture heterogeneity analysis
✅ Contrast assessment
✅ Aggressiveness risk scoring
```

---

## 🗄️ Database Schema

### **MongoDB Collections:**

1. **USERS** - Doctors, patients, admins
2. **PATIENT_FILES** - Medical records
3. **BRAIN_SCANS** - MRI/CT images
4. **AI_ANALYSES** - AI detection & classification results
5. **DOCTOR_REPORTS** - Doctor's diagnosis & treatment plans
6. **APPOINTMENTS** - Scheduling system
7. **NOTIFICATIONS** - User alerts
8. **MEDICAL_KNOWLEDGE** - Medical guide content

See [`DATABASE_SCHEMA.md`](./DATABASE_SCHEMA.md) for complete design.

---

## 🛠️ Tech Stack

### **AI Module:**
- Python 3.11
- TensorFlow 2.15
- Keras
- Flask
- OpenCV
- NumPy

### **Backend:**
- NestJS
- MongoDB + Mongoose
- JWT Authentication
- Multer (file uploads)

### **Mobile:**
- Flutter (Dart)
- Provider / Riverpod
- HTTP package

---

## 📖 Documentation

- 📄 [`AI_API_DOCUMENTATION.md`](./ai/AI_API_DOCUMENTATION.md) - Complete AI API reference
- 📄 [`DATABASE_SCHEMA.md`](./DATABASE_SCHEMA.md) - Database design
- 📄 [`COMPLETE_DOCUMENTATION.md`](./ai/COMPLETE_DOCUMENTATION.md) - Full system docs

---

## 🔧 Installation

### **Prerequisites:**
```bash
# Python 3.11+
python --version

# Node.js 18+
node --version

# Flutter 3.0+
flutter --version

# MongoDB 6.0+
mongod --version
```

### **1. Clone Repository:**
```bash
git clone https://github.com/your-org/brain-tumor-app.git
cd brain-tumor-app
```

### **2. Setup AI Module:**
```bash
cd ai
pip install -r requirements.txt
python complete_api.py
```

### **3. Setup Backend:** 🚧
```bash
cd backend
npm install
npm run start:dev
```

### **4. Setup Mobile App:** 🚧
```bash
cd mobile
flutter pub get
flutter run
```

---

## 🧪 Testing

### **Test AI API:**
```bash
cd ai
python test_api_client.py
```

### **Test Models:**
```bash
python test_both_models.py
```

---

## 🌐 Deployment

### **AI Module (Flask):**

**Docker:**
```bash
cd ai
docker build -t brain-tumor-ai .
docker run -p 5000:5000 brain-tumor-ai
```

**Heroku:**
```bash
cd ai
heroku create brain-tumor-ai
git push heroku main
```

---

## 🔒 Security

- ✅ JWT Authentication (NestJS)
- ✅ API Key validation (Flask)
- ✅ Rate limiting
- ✅ Input validation
- ✅ File type restrictions
- ✅ HTTPS support

---

## 📱 Mobile App Screens (Planned)

```
Authentication:
├─ Login
└─ Register

Dashboard:
├─ Overview Statistics
├─ Recent Analyses
└─ Notifications

Patients:
├─ Patient List
├─ Patient Profile
├─ Add New Patient
└─ Medical History

Scans:
├─ Upload Scan
├─ Scan History
├─ AI Analysis Result
└─ Compare Scans

Reports:
├─ Create Report
├─ View Reports
├─ Download PDF
└─ Share Report

Other:
├─ Appointments
├─ Medical Guide
├─ Settings
└─ Admin Panel
```

---

## 🩺 Clinical Workflow

```
1. UPLOAD SCAN
   Doctor uploads MRI/CT scan
   ↓
2. AI ANALYSIS (1-2 seconds)
   - Detection: Tumor found (Yes/No)
   - Classification: Type (Glioma/Meningioma/Pituitary)
   - Clinical analysis: Size, borders, texture
   ↓
3. DOCTOR REVIEW
   - Reviews AI results
   - Confirms/corrects diagnosis
   - Creates treatment plan
   ↓
4. PATIENT NOTIFICATION
   - Patient receives results
   - Can view report
   - Schedule follow-up
   ↓
5. FOLLOW-UP
   - Track tumor progression
   - Compare with previous scans
   - Monitor treatment effectiveness
```

---

## 👥 Team

**Students:**
- Jumana Al-Daeef
- Daissyl Sariyan

**Project:** Brain Tumor Monitoring System (متابعة الأورام السرطانية)

---

## 📅 Version History

- **v3.0** (March 2026) - AI Module complete, Backend & Mobile in progress
- **v2.0** (January 2026) - Classification model added
- **v1.0** (January 2026) - Initial segmentation model

---

## 📝 License

This project is for educational purposes.

---

## 🙏 Acknowledgments

- Dataset: Brain MRI Images for Brain Tumor Detection
- Libraries: TensorFlow, Keras, Flask, NestJS, Flutter
- Medical Consultants: [Your advisors]

---

## 📞 Support

For questions or issues:
- 📧 Email: [your-email]
- 🐛 Issues: [GitHub Issues]
- 📖 Docs: See documentation files

---

## 🎯 Project Status

```
AI Module:       ████████████████████ 100% ✅
Backend:         ████░░░░░░░░░░░░░░░░  20% 🚧
Mobile App:      ██░░░░░░░░░░░░░░░░░░  10% 🚧
Database:        ████████░░░░░░░░░░░░  40% 🚧
Documentation:   ████████████████░░░░  80% ✅
```

---

## 🚀 Next Steps

- [ ] Complete NestJS backend
- [ ] Implement authentication system
- [ ] Build Flutter UI/UX
- [ ] Integrate mobile app with backend
- [ ] Add real-time notifications
- [ ] Implement appointment scheduling
- [ ] Generate PDF reports
- [ ] Deploy to cloud (AWS/Heroku)
- [ ] User testing
- [ ] Documentation finalization

---

**Built with ❤️ for better healthcare** 🏥

---

© 2026 Brain Tumor Detection System - All Rights Reserved