# 🧠 Brain Tumor Detection & Classification API
## AI Module Documentation — v3.0

---

## 📋 System Overview

A production-ready Flask API for brain tumor detection and classification from MRI and CT scans using three trained deep learning models.

| Feature | Detail |
|---------|--------|
| MRI Tumor Detection | U-Net segmentation — 95.7% accuracy |
| MRI Tumor Classification | Dual-input CLAHE CNN — 81.3% accuracy |
| CT Tumor Detection | Binary CNN — 95.3% accuracy |
| Tumor Types | Glioma, Meningioma, Pituitary |
| Processing Time | ~1–2 seconds per scan |

---

## 🗂️ Folder Structure

```
brain-tumor-app/
└── ai/
    ├── complete_api.py              ← Main Flask API server
    ├── train_segmentation.py        ← MRI segmentation training (reference)
    ├── the_traineew.py              ← Classification training (reference)
    ├── train_ct_detector.py         ← CT detection training (reference)
    ├── COMPLETE_DOCUMENTATION.md    ← This file
    ├── requirements.txt             ← Python dependencies
    ├── analysis_history.json        ← Auto-created on first run
    │
    ├── models/
    │   ├── best_model_256_gpu.h5    ← MRI segmentation model
    │   ├── tumor_classifier_v3.h5   ← MRI classification model
    │   └── ct_detector_best.h5      ← CT detection model
    │
    └── uploads/
        ├── scans/                   ← Uploaded scan images saved here
        └── overlays/                ← AI overlay images saved here
```

---

## ⚙️ Installation

```bash
pip install flask flask-cors tensorflow opencv-python numpy pillow scikit-learn
```

Or using requirements file:

```bash
pip install -r requirements.txt
```

**requirements.txt:**

```
flask
flask-cors
tensorflow==2.15.0
opencv-python
numpy
pillow
scikit-learn
```

---

## 🚀 Quick Start

```bash
cd brain-tumor-app/ai
python complete_api.py
```

**Expected output:**

```
🧠 BRAIN TUMOR DETECTION & CLASSIFICATION API
======================================================================
📦 Loading AI models...
   ✅ Segmentation model loaded (95.7% accuracy)
   ✅ Classification model loaded (81.3% accuracy)
   ✅ CT detection model loaded (95.3% accuracy)

📍 URL: http://localhost:5000
```

---

## 📡 API Endpoints

### **GET /** — API Info

```bash
curl http://localhost:5000/
```

**Response:**

```json
{
  "name": "Brain Tumor Detection & Classification API",
  "version": "3.0",
  "status": "operational",
  "models": {
    "segmentation": { 
      "loaded": true, 
      "accuracy": "95.7%", 
      "dice": "82.7%" 
    },
    "classification": { 
      "loaded": true, 
      "accuracy": "81.3%", 
      "classes": ["Glioma", "Meningioma", "Pituitary"] 
    },
    "ct_detection": { 
      "loaded": true, 
      "accuracy": "95.3%" 
    }
  }
}
```

---

### **GET /health** — Health Check

```bash
curl http://localhost:5000/health
```

**Response:**

```json
{
  "status": "healthy",
  "segmentation_model": true,
  "classification_model": true,
  "ct_model": true,
  "timestamp": "2026-03-12T10:00:00"
}
```

---

### **POST /analyze** — Analyze Scan (File Upload)

Used by the NestJS backend to send a scan image for analysis.

**Request:**

```bash
curl -X POST \
  -F "file=@scan.png" \
  -F "scan_type=MRI" \
  http://localhost:5000/analyze
```

**Parameters:**
- `file`: Image file (PNG, JPG, JPEG)
- `scan_type`: "MRI" or "CT" (default: "MRI")

**Full Response:**

```json
{
  "success": true,
  "timestamp": "2026-03-12T10:00:00",
  "scan_info": {
    "scan_type": "MRI",
    "note": "CT scan support: detection only. MRI recommended for tumor type classification."
  },
  "detection": {
    "has_tumor": true,
    "tumor_percentage": 12.34,
    "tumor_pixels": 8234,
    "confidence": 95.7
  },
  "classification": {
    "enabled": true,
    "tumor_type": "Meningioma",
    "confidence": 89.7,
    "note": "Classification requires radiologist confirmation"
  },
  "clinical_analysis": {
    "size": {
      "tumor_pixels": 8234,
      "area_cm2": 0.46,
      "estimated_diameter_cm": 0.77,
      "exceeds_2cm_threshold": false,
      "pixel_spacing_mm": 0.75
    },
    "border": {
      "irregularity_score": 0.52,
      "is_irregular": true,
      "clinical_note": "⚠️ Irregular borders detected"
    },
    "heterogeneity": {
      "heterogeneity_score": 45.3,
      "is_heterogeneous": true,
      "clinical_note": "⚠️ Mixed internal texture — possible aggressive tumor"
    },
    "contrast": {
      "tumor_mean_intensity": 180.2,
      "healthy_mean_intensity": 120.5,
      "contrast_score": 59.7,
      "is_suspicious": true,
      "clinical_note": "⚠️ Tumor appears different from surrounding tissue"
    },
    "aggressiveness_indicators": {
      "irregular_border": true,
      "heterogeneous_texture": true,
      "high_contrast": true,
      "exceeds_size_threshold": false,
      "risk_score": 3,
      "risk_level": "MODERATE-HIGH"
    }
  },
  "severity": {
    "level": "moderate",
    "action": "IMMEDIATE",
    "message": "Moderate tumor detected (12.34% of brain area). Type: Meningioma.",
    "next_steps": [
      "Consult with neurologist immediately",
      "Additional MRI sequences recommended",
      "Prepare medical history and symptoms",
      "Consider second opinion"
    ]
  },
  "visualizations": {
    "overlay": "base64_encoded_image...",
    "mask": "base64_encoded_image..."
  }
}
```

---

### **POST /analyze-base64** — Analyze Scan (Base64)

**Request:**

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "image": "base64_encoded_image...",
    "scan_type": "MRI"
  }' \
  http://localhost:5000/analyze-base64
```

**Response:** Same as `/analyze`

---

### **GET /stats** — Usage Statistics

```bash
curl http://localhost:5000/stats
```

**Response:**

```json
{
  "total_analyses": 156,
  "tumors_detected": 89,
  "tumor_types": {
    "Glioma": 25,
    "Meningioma": 34,
    "Pituitary": 30
  },
  "detection_rate": 57.1,
  "ct_scans": 12,
  "mri_scans": 144
}
```

---

## 🔬 Clinical Analysis Details

### **Size Analysis:**

```json
{
  "tumor_pixels": 8234,
  "area_cm2": 0.46,
  "estimated_diameter_cm": 0.77,
  "exceeds_2cm_threshold": false,
  "pixel_spacing_mm": 0.75
}
```

**How it works:**
- Pixel spacing: 0.75mm (typical MRI resolution)
- Area = tumor_pixels × (pixel_spacing²)
- Diameter ≈ 2 × sqrt(area / π)
- Threshold: 2cm (clinical significance)

---

### **Border Irregularity:**

```json
{
  "irregularity_score": 0.52,
  "is_irregular": true,
  "clinical_note": "⚠️ Irregular borders detected"
}
```

**Calculation:**
- Circularity = 4π × area / perimeter²
- Score = 1 - circularity
- Irregular if score > 0.4

**Clinical Significance:**
- Irregular borders → Higher malignancy risk
- Smooth borders → Likely benign

---

### **Texture Heterogeneity:**

```json
{
  "heterogeneity_score": 45.3,
  "is_heterogeneous": true,
  "clinical_note": "⚠️ Mixed internal texture"
}
```

**Calculation:**
- Standard deviation of pixel intensities within tumor
- Heterogeneous if score > 30

**Clinical Significance:**
- Mixed texture → Aggressive/malignant
- Uniform texture → Benign

---

### **Contrast Analysis:**

```json
{
  "tumor_mean_intensity": 180.2,
  "healthy_mean_intensity": 120.5,
  "contrast_score": 59.7,
  "is_suspicious": true
}
```

**Calculation:**
- Contrast = |tumor_intensity - healthy_intensity|
- Suspicious if contrast > 40

---

### **Aggressiveness Risk Assessment:**

```json
{
  "irregular_border": true,
  "heterogeneous_texture": true,
  "high_contrast": true,
  "exceeds_size_threshold": false,
  "risk_score": 3,
  "risk_level": "MODERATE-HIGH"
}
```

**Risk Levels:**
- 0-1 indicators: LOW
- 2 indicators: MODERATE
- 3 indicators: MODERATE-HIGH
- 4 indicators: HIGH

---

## 🩺 Doctor Requirements Analysis

Based on clinical criteria: "عندما يقول الطبيب يوجد ورم بالدماغ"

| Requirement | AI Detection | Status |
|------------|--------------|--------|
| كتلة لا تشبه النسيج الطبيعي<br>(Mass unlike normal tissue) | Contrast analysis | ✅ Implemented |
| حدودها غير منتظمة<br>(Irregular borders) | Border irregularity score | ✅ Implemented |
| حجمها > 2 سم<br>(Size > 2cm) | Size estimation in cm | ✅ Implemented |
| لونها مختلف عن المحيط<br>(Different color from surroundings) | Contrast score | ✅ Implemented |
| داخلها مختلط الألوان<br>(Mixed internal colors) | Heterogeneity analysis | ✅ Implemented |

---

## 💻 Integration with NestJS Backend

### **From NestJS:**

```typescript
import { Injectable } from '@nestjs/common';
import axios from 'axios';
import FormData from 'form-data';
import * as fs from 'fs';

@Injectable()
export class AiService {
  private readonly AI_API_URL = 'http://localhost:5000';

  async analyzeScan(filePath: string, scanType: 'MRI' | 'CT' = 'MRI') {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));
    formData.append('scan_type', scanType);

    const response = await axios.post(
      `${this.AI_API_URL}/analyze`,
      formData,
      {
        headers: formData.getHeaders(),
        timeout: 30000, // 30 seconds
      }
    );

    return response.data;
  }

  async analyzeBase64(imageBase64: string, scanType: 'MRI' | 'CT' = 'MRI') {
    const response = await axios.post(
      `${this.AI_API_URL}/analyze-base64`,
      {
        image: imageBase64,
        scan_type: scanType,
      }
    );

    return response.data;
  }

  async getHealth() {
    const response = await axios.get(`${this.AI_API_URL}/health`);
    return response.data;
  }
}
```

---

## 🔧 Configuration

### **In `complete_api.py`:**

```python
# Model paths
SEGMENTATION_MODEL = 'models/best_model_256_gpu.h5'
CLASSIFICATION_MODEL = 'models/tumor_classifier_v3.h5'
CT_MODEL = 'models/ct_detector_best.h5'

# Image sizes
IMG_SIZE_SEG = 256   # Segmentation
IMG_SIZE_CLAS = 224  # Classification
IMG_SIZE_CT = 128    # CT detection

# Clinical thresholds
SIZE_THRESHOLD_CM = 2.0
BORDER_IRREGULARITY_THRESHOLD = 0.4
HETEROGENEITY_THRESHOLD = 30
CONTRAST_THRESHOLD = 40

# Server
HOST = '0.0.0.0'
PORT = 5000
DEBUG = True  # Set to False in production
```

---

## 🐛 Troubleshooting

### **Model Not Loading:**

```bash
# Check model files
ls -lh models/

# Expected files:
# best_model_256_gpu.h5 (22.4 MB)
# tumor_classifier_v3.h5 (8.0 MB)
# ct_detector_best.h5 (if using CT)
```

### **Port Already in Use:**

```python
# Change port in complete_api.py
app.run(host='0.0.0.0', port=5001)
```

### **Memory Issues:**

```python
# Reduce batch size or use CPU
import os
os.environ['CUDA_VISIBLE_DEVICES'] = '-1'  # Force CPU
```

---

## 📊 Model Performance

### **MRI Segmentation:**
- Accuracy: 95.7%
- Dice Coefficient: 82.7%
- Sensitivity: 96.3%
- Specificity: 95.2%

### **MRI Classification:**
- Overall: 81.3%
- Meningioma: 94.1%
- Pituitary: 95.2%
- Glioma: 48.4%

### **CT Detection:**
- Accuracy: 95.3%
- Binary classification (tumor/no tumor)

---

## 🔒 Security Considerations

### **Production Deployment:**

1. **API Authentication:**
```python
from functools import wraps

def require_api_key(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        api_key = request.headers.get('X-API-Key')
        if api_key != os.getenv('AI_API_KEY'):
            return jsonify({'error': 'Unauthorized'}), 401
        return f(*args, **kwargs)
    return decorated

@app.route('/analyze', methods=['POST'])
@require_api_key
def analyze():
    # ...
```

2. **Rate Limiting:**
```python
from flask_limiter import Limiter

limiter = Limiter(app, default_limits=["100 per hour"])

@app.route('/analyze')
@limiter.limit("10 per minute")
def analyze():
    # ...
```

3. **File Validation:**
```python
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS
```

---

## 🌐 Deployment

### **Docker:**

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY . /app

RUN pip install --no-cache-dir -r requirements.txt

EXPOSE 5000

CMD ["python", "complete_api.py"]
```

```bash
docker build -t brain-tumor-ai .
docker run -p 5000:5000 brain-tumor-ai
```

### **Heroku:**

```bash
# Procfile
web: python complete_api.py

# Deploy
heroku create brain-tumor-ai
git push heroku main
```

---

## 📝 Example Workflow

### **Complete Analysis Flow:**

```
1. Frontend uploads MRI scan
   ↓
2. NestJS receives image
   ↓
3. NestJS calls Flask AI API
   POST /analyze
   ↓
4. Flask AI processes:
   - Segmentation (tumor location)
   - Classification (tumor type)
   - Clinical analysis (size, borders, texture)
   ↓
5. Returns complete analysis
   ↓
6. NestJS saves to MongoDB
   - AI_ANALYSES collection
   - Links to BRAIN_SCANS
   ↓
7. Notify doctor
   ↓
8. Doctor reviews & creates report
```

---

## ✅ API Response Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad Request (invalid image, missing file) |
| 500 | Internal Server Error (model error) |

---

## 📞 Support

For issues:
1. Check server logs
2. Verify model files exist
3. Test with `/health` endpoint
4. Review `analysis_history.json`

---

## 🎓 Citation

If using in research:

```
Brain Tumor Detection System using Deep Learning
- MRI Segmentation: U-Net (95.7% accuracy, 82.7% Dice)
- MRI Classification: Dual-Input CLAHE CNN (81.3% accuracy)
- Clinical Analysis: Border, texture, size assessment
- Dataset: 4,192 MRI scans (Glioma, Meningioma, Pituitary)
```

---

**Version:** 3.0  
**Last Updated:** March 12, 2026  
**Authors:** Jumana Al-Daeef & Daissyl Sariyan