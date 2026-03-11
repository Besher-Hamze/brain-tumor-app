# 🧠 Brain Tumor Detection & Classification System
## Complete Production Documentation

---

## 📋 **System Overview**

A complete AI-powered medical imaging system for brain tumor detection and classification from MRI scans.

### **Key Features:**
- ✅ **Detection**: 95.7% accuracy (U-Net segmentation)
- ✅ **Classification**: 81.3% accuracy (V3 CLAHE dual-input)
- ✅ **REST API**: Flask-based production API
- ✅ **Visualization**: Tumor overlay and mask generation
- ✅ **Recommendations**: Severity assessment and next steps

---

## 🏗️ **System Architecture**

```
┌─────────────────┐
│   Flutter App   │ (Mobile/Web Frontend)
│   (User Input)  │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│   Flask API     │ (Backend - Port 5000)
│   complete_api  │
└────────┬────────┘
         │
         ├──→ ┌──────────────────┐
         │    │ Segmentation     │ (best_model_256_gpu.h5)
         │    │ U-Net Model      │ Detection: 95.7%
         │    └──────────────────┘
         │
         └──→ ┌──────────────────┐
              │ Classification   │ (tumor_classifier_v3.h5)
              │ V3 CLAHE Model   │ Classification: 81.3%
              └──────────────────┘
```

---

## 📦 **Installation**

### **Requirements:**

```bash
pip install flask flask-cors tensorflow opencv-python numpy pillow scikit-learn
```

### **File Structure:**

```
brain-tumor-project/
├── complete_api.py              # Main API server
├── test_api_client.py           # API test client
├── best_model_256_gpu.h5        # Segmentation model (95.7%)
├── tumor_classifier_v3.h5       # Classification model (81.3%)
├── analysis_history.json        # Analysis history (auto-created)
└── README.md                    # This file
```

---

## 🚀 **Quick Start**

### **1. Start the API Server:**

```bash
python complete_api.py
```

**Output:**
```
🧠 BRAIN TUMOR DETECTION & CLASSIFICATION API
==================================================
📍 URL: http://localhost:5000
⚡ Status:
   Segmentation: ✅
   Classification: ✅
```

### **2. Test the API:**

```bash
# In another terminal
python test_api_client.py
```

---

## 📡 **API Endpoints**

### **1. GET /** - API Information

**Request:**
```bash
curl http://localhost:5000/
```

**Response:**
```json
{
  "name": "Brain Tumor Detection & Classification API",
  "version": "2.0",
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
    }
  }
}
```

---

### **2. GET /health** - Health Check

**Request:**
```bash
curl http://localhost:5000/health
```

**Response:**
```json
{
  "status": "healthy",
  "segmentation_model": true,
  "classification_model": true,
  "timestamp": "2026-01-20T16:30:00"
}
```

---

### **3. POST /analyze** - Analyze MRI Scan (File Upload)

**Request:**
```bash
curl -X POST -F "file=@scan.png" http://localhost:5000/analyze
```

**Response:**
```json
{
  "success": true,
  "timestamp": "2026-01-20T16:30:00",
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
  "severity": {
    "severity": "moderate",
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

### **4. POST /analyze-base64** - Analyze MRI (Base64)

**Request:**
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"image": "base64_encoded_image..."}' \
  http://localhost:5000/analyze-base64
```

**Response:** Same as `/analyze`

---

### **5. GET /stats** - Usage Statistics

**Request:**
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
  "detection_rate": 57.1
}
```

---

## 💻 **Flutter Integration**

### **Example Dart Code:**

```dart
import 'package:http/http.dart' as http;
import 'dart:convert';

Future<Map<String, dynamic>> analyzeMRI(File imageFile) async {
  final uri = Uri.parse('http://localhost:5000/analyze');
  
  var request = http.MultipartRequest('POST', uri);
  request.files.add(await http.MultipartFile.fromPath('file', imageFile.path));
  
  var response = await request.send();
  var responseBody = await response.stream.bytesToString();
  
  return json.decode(responseBody);
}

// Usage
void performAnalysis() async {
  File mriScan = File('path/to/scan.png');
  var result = await analyzeMRI(mriScan);
  
  print('Has tumor: ${result['detection']['has_tumor']}');
  print('Type: ${result['classification']['tumor_type']}');
  print('Severity: ${result['severity']['severity']}');
}
```

---

## 🔧 **Configuration**

### **Model Paths** (in `complete_api.py`):

```python
SEGMENTATION_MODEL = 'best_model_256_gpu.h5'
CLASSIFICATION_MODEL = 'tumor_classifier_v3.h5'
```

### **Image Sizes:**

```python
IMG_SIZE_SEG = 256   # Segmentation input
IMG_SIZE_CLAS = 224  # Classification input
```

### **Server Configuration:**

```python
# In complete_api.py, line ~500
app.run(
    debug=True,          # Set to False in production
    host='0.0.0.0',     # Allow external connections
    port=5000           # API port
)
```

---

## 🌐 **Deployment Options**

### **Option 1: Local Network**

```bash
# Run on local network
python complete_api.py
# Access from: http://YOUR_IP:5000
```

### **Option 2: Cloud Deployment (Heroku)**

```bash
# Create Procfile
echo "web: python complete_api.py" > Procfile

# Create requirements.txt
pip freeze > requirements.txt

# Deploy
heroku create brain-tumor-api
git push heroku main
```

### **Option 3: Docker**

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY . /app

RUN pip install flask flask-cors tensorflow opencv-python-headless numpy pillow

EXPOSE 5000

CMD ["python", "complete_api.py"]
```

```bash
docker build -t brain-tumor-api .
docker run -p 5000:5000 brain-tumor-api
```

---

## 📊 **Model Performance**

### **Segmentation Model:**
- **Accuracy**: 95.7%
- **Dice Coefficient**: 82.7%
- **Sensitivity**: 96.3%
- **Specificity**: 95.2%

### **Classification Model (V3 CLAHE):**
- **Overall**: 81.3%
- **Meningioma**: 94.1%
- **Pituitary**: 95.2%
- **Glioma**: 48.4%

### **Processing Time:**
- Segmentation: ~0.5-1 second
- Classification: ~0.3-0.5 second
- **Total**: ~1-2 seconds per scan

---

## 🔒 **Security Considerations**

### **Production Deployment:**

1. **API Authentication:**
```python
from functools import wraps

def require_api_key(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        api_key = request.headers.get('X-API-Key')
        if api_key != 'your-secret-key':
            return jsonify({'error': 'Invalid API key'}), 401
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

@app.route('/analyze', methods=['POST'])
@limiter.limit("10 per minute")
def analyze():
    # ...
```

3. **HTTPS:**
- Use nginx/Apache as reverse proxy
- Enable SSL certificates (Let's Encrypt)

4. **Input Validation:**
```python
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS
```

---

## 🐛 **Troubleshooting**

### **Model Not Loading:**

```bash
# Check model files exist
ls -lh best_model_256_gpu.h5
ls -lh tumor_classifier_v3.h5

# Check TensorFlow version
python -c "import tensorflow as tf; print(tf.__version__)"
# Should be 2.15.0
```

### **Port Already in Use:**

```bash
# Change port in complete_api.py
app.run(port=5001)  # Use different port
```

### **Memory Issues:**

```python
# Reduce batch processing
# In complete_api.py, use single prediction instead of batches
```

---

## 📝 **MongoDB Integration (Optional)**

### **Add Patient Records:**

```python
from pymongo import MongoClient

client = MongoClient('mongodb://localhost:27017/')
db = client['brain_tumor_db']
patients = db['patients']

def save_patient_analysis(patient_id, result):
    record = {
        'patient_id': patient_id,
        'timestamp': datetime.now(),
        'analysis': result
    }
    patients.insert_one(record)
```

---

## 🎓 **Academic Citations**

If using this system in research:

```
Brain Tumor Detection System using Deep Learning
- Segmentation: U-Net Architecture (95.7% accuracy)
- Classification: Dual-Input CLAHE CNN (81.3% accuracy)
- Dataset: 4,192 MRI scans (3 tumor types)
```

---

## 📞 **Support**

For issues or questions:
- Check logs in terminal where API is running
- Review test_api_client.py for usage examples
- Ensure all model files are present

---

## ✅ **Testing Checklist**

- [ ] API starts without errors
- [ ] `/health` returns healthy status
- [ ] Can analyze a test image
- [ ] Visualizations are generated
- [ ] Statistics are tracked
- [ ] Classification works when tumor detected
- [ ] Severity recommendations are appropriate

---

## 🎉 **Project Complete!**

You now have a fully functional, production-ready brain tumor detection and classification system!

**System Components:**
✅ Detection (95.7%)
✅ Classification (81.3%)
✅ REST API
✅ Visualizations
✅ Documentation
✅ Ready for Flutter integration
✅ Ready for deployment

---

**Created by:** Jumana Al-Daeef & Daissyl Sariyan
**Date:** January 2026
**Version:** 2.0
