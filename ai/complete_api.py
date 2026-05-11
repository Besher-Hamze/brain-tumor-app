"""
COMPLETE BRAIN TUMOR DETECTION & CLASSIFICATION API
Integrates: Segmentation (95.7%) + Classification (81.3%)
Production-ready Flask API
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import tensorflow as tf
import numpy as np
import cv2
import base64
from datetime import datetime
import json
import os
from io import BytesIO
from PIL import Image
import traceback


app = Flask(__name__)
CORS(app)

# ADD THIS ↓
import numpy as np

class CustomJSONProvider(app.json_provider_class):
    def dumps(self, obj, **kwargs):
        import json
        def convert(o):
            if isinstance(o, (np.bool_)):
                return bool(o)
            if isinstance(o, (np.integer)):
                return int(o)
            if isinstance(o, (np.floating)):
                return float(o)
            if isinstance(o, np.ndarray):
                return o.tolist()
            raise TypeError(f"Object of type {type(o).__name__} is not JSON serializable")
        return json.dumps(obj, default=convert, **kwargs)

app.json_provider_class = CustomJSONProvider
app.json = CustomJSONProvider(app)


# --- CONFIGURATION ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, 'models')
SEGMENTATION_MODEL_CANDIDATES = [
    os.path.join(MODEL_DIR, 'best_model_256_gpu.h5'),
    os.path.join(MODEL_DIR, 'best_unet_model.h5'),
]
CLASSIFICATION_MODEL = os.path.join(MODEL_DIR, 'tumor_classifier_v3.h5')
CT_DETECTION_MODEL = os.path.join(MODEL_DIR, 'ct_detector_best.h5')
HISTORY_FILE = os.path.join(BASE_DIR, 'analysis_history.json')

IMG_SIZE_SEG = 256
IMG_SIZE_CLAS = 224

CLASS_NAMES = ['Glioma', 'Meningioma', 'Pituitary']

print("="*70)
print("🧠 BRAIN TUMOR DETECTION & CLASSIFICATION API")
print("="*70)

# --- LOAD MODELS ---
print("\n📦 Loading AI models...")

try:
    segmentation_model_path = next(
        model_path for model_path in SEGMENTATION_MODEL_CANDIDATES if os.path.exists(model_path)
    )
    segmentation_model = tf.keras.models.load_model(
        segmentation_model_path,
        custom_objects={
            'dice_coefficient': lambda y_true, y_pred: tf.constant(0.0),
            'combined_loss': lambda y_true, y_pred: tf.constant(0.0)
        },
        compile=False
    )
    print(f"   ✅ Segmentation model loaded (95.7% accuracy)")
except Exception as e:
    print(f"   ❌ Segmentation model failed: {e}")
    segmentation_model = None

try:
    classification_model = tf.keras.models.load_model(
        CLASSIFICATION_MODEL,
        compile=False
    )
    print(f"   ✅ Classification model loaded (81.3% accuracy)")
except Exception as e:
    print(f"   ❌ Classification model failed: {e}")
    classification_model = None

# ADD HERE ↓
try:
    ct_detection_model = tf.keras.models.load_model(
        CT_DETECTION_MODEL,
        compile=False
    )
    print("   ✅ CT detection model loaded (95.3% accuracy)")
except Exception as e:
    print(f"   ❌ CT model failed: {e}")
    ct_detection_model = None


if segmentation_model is None and ct_detection_model is None:
    print("\n❌ Critical: Segmentation model required!")
    exit(1)

if segmentation_model is None:
    print("\nMRI segmentation model not loaded; API will run in CT-only mode.")

# --- PREPROCESSING ---
def apply_clahe(img):
    """Apply CLAHE preprocessing"""
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    l_clahe = clahe.apply(l)
    lab_clahe = cv2.merge([l_clahe, a, b])
    return cv2.cvtColor(lab_clahe, cv2.COLOR_LAB2BGR)

def preprocess_for_segmentation(image):
    """Prepare image for segmentation"""
    img = cv2.resize(image, (IMG_SIZE_SEG, IMG_SIZE_SEG))
    img = img.astype(np.float32) / 255.0
    return np.expand_dims(img, 0)

def preprocess_for_classification(image):
    """Prepare image for classification (dual input)"""
    img = cv2.resize(image, (IMG_SIZE_CLAS, IMG_SIZE_CLAS))
    img_orig = img.astype(np.float32) / 255.0
    img_clahe = apply_clahe(img).astype(np.float32) / 255.0
    return np.expand_dims(img_orig, 0), np.expand_dims(img_clahe, 0)

# --- ANALYSIS FUNCTIONS ---
def segment_tumor(image):
    """Segment tumor from MRI"""
    img_batch = preprocess_for_segmentation(image)
    prediction = segmentation_model.predict(img_batch, verbose=0)[0]
    mask = (prediction.squeeze() > 0.5).astype(np.uint8) * 255
    return mask

def classify_tumor(image, mask):
    """Classify tumor type"""
    if classification_model is None:
        return None, 0.0
    
    # Check if tumor exists
    tumor_pixels = np.sum(mask > 127)
    if tumor_pixels < 100:
        return None, 0.0
    
    # Classify
    img_orig, img_clahe = preprocess_for_classification(image)
    prediction = classification_model.predict([img_orig, img_clahe], verbose=0)[0]
    
    class_idx = np.argmax(prediction)
    confidence = float(prediction[class_idx])
    tumor_type = CLASS_NAMES[class_idx]
    
    return tumor_type, confidence

def calculate_tumor_size_cm(mask, pixel_spacing_mm=0.75):
    """
    Convert tumor pixel area to physical size in cm.
    
    pixel_spacing_mm: real-world mm per pixel
      - Default 0.75mm is the midpoint of standard brain MRI (0.5–1.0mm)
      - Override with actual DICOM value if available
    """
    tumor_pixels = int(np.sum(mask > 127))
    
    if tumor_pixels == 0:
        return {
            "tumor_pixels": 0,
            "area_cm2": 0.0,
            "estimated_diameter_cm": 0.0,
            "exceeds_2cm_threshold": False,
            "pixel_spacing_mm": pixel_spacing_mm
        }
    
    # Each pixel = pixel_spacing_mm × pixel_spacing_mm mm²
    area_mm2 = tumor_pixels * (pixel_spacing_mm ** 2)
    area_cm2 = area_mm2 / 100.0  # convert mm² to cm²
    
    # Estimate diameter assuming circular tumor shape
    import math
    radius_cm = math.sqrt(area_cm2 / math.pi)
    diameter_cm = round(2 * radius_cm, 2)
    
    return {
        "tumor_pixels": tumor_pixels,
        "area_cm2": round(area_cm2, 2),
        "estimated_diameter_cm": diameter_cm,
        "exceeds_2cm_threshold": bool(diameter_cm >= 2.0),
        "pixel_spacing_mm": pixel_spacing_mm
    }

def calculate_border_irregularity(mask):
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return {"irregularity_score": 0.0, "is_irregular": False}
    
    contour = max(contours, key=cv2.contourArea)
    perimeter = cv2.arcLength(contour, True)
    area = cv2.contourArea(contour)
    
    if area == 0:
        return {"irregularity_score": 0.0, "is_irregular": False}
    
    circularity = (4 * 3.14159 * area) / (perimeter ** 2)
    irregularity = round(1 - circularity, 3)  # 0 = perfect circle, 1 = very irregular
    
    return {
        "irregularity_score": irregularity,
        "is_irregular": bool(irregularity > 0.4),
        "clinical_note": "⚠️ Irregular borders detected" if irregularity > 0.4 else "Borders appear regular"
    }

def calculate_heterogeneity(image, mask):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    mask_resized = cv2.resize(mask, (gray.shape[1], gray.shape[0]))
    
    tumor_region = gray[mask_resized > 127]
    
    if len(tumor_region) == 0:
        return {"heterogeneity_score": 0.0, "is_heterogeneous": False}
    
    std_dev = round(float(np.std(tumor_region)), 2)
    
    return {
        "heterogeneity_score": std_dev,
        "is_heterogeneous": bool(std_dev > 40),
        "clinical_note": "⚠️ Mixed internal texture — possible aggressive tumor" if std_dev > 40 else "Texture appears uniform"
    }

def calculate_tissue_contrast(image, mask):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    mask_resized = cv2.resize(mask, (gray.shape[1], gray.shape[0]))

    tumor_region = gray[mask_resized > 127]
    healthy_region = gray[mask_resized <= 127]

    if len(tumor_region) == 0 or len(healthy_region) == 0:
        return {
            "contrast_score": 0.0,
            "is_suspicious": False,
            "clinical_note": "Cannot calculate — no tumor region found"
        }

    tumor_mean = float(np.mean(tumor_region))
    healthy_mean = float(np.mean(healthy_region))
    contrast = round(abs(tumor_mean - healthy_mean), 2)

    return {
        "tumor_mean_intensity": round(tumor_mean, 2),
        "healthy_mean_intensity": round(healthy_mean, 2),
        "contrast_score": contrast,
        "is_suspicious": bool(contrast > 30),
        "clinical_note": "⚠️ Tumor color differs significantly from surrounding tissue" if contrast > 30 else "Tumor intensity similar to surrounding tissue"
    }


def detect_tumor_ct(image):
    img = cv2.resize(image, (224, 224))
    img = img.astype(np.float32) / 255.0
    img_batch = np.expand_dims(img, 0)

    prediction = ct_detection_model.predict(img_batch, verbose=0)[0][0]

    has_tumor = bool(prediction > 0.5)
    confidence = float(prediction) if has_tumor else float(1 - prediction)

    return has_tumor, round(confidence * 100, 1)

def create_overlay(image, mask):
    """Create visualization overlay"""
    img_resized = cv2.resize(image, (IMG_SIZE_SEG, IMG_SIZE_SEG))
    
    # Create colored overlay
    overlay = img_resized.copy()
    overlay[mask > 127] = [0, 0, 255]  # Red for tumor
    
    # Blend
    result = cv2.addWeighted(img_resized, 0.7, overlay, 0.3, 0)
    
    return result

def get_severity_info(tumor_percentage, tumor_type=None, diameter_cm=0):
    if tumor_percentage == 0:
        return {
            'severity': 'none',
            'action': 'ROUTINE',
            'message': 'No tumor detected. Continue routine monitoring.',
            'next_steps': [
                'Schedule regular check-ups',
                'Maintain healthy lifestyle',
                'Report any new symptoms'
            ]
        }

    # Upgrade severity if diameter exceeds 2cm
    if diameter_cm >= 2.0:
        severity = 'significant'
        action = 'URGENT'
        message = f'Tumor detected ({tumor_percentage:.1f}% of brain area). Diameter {diameter_cm:.1f}cm exceeds 2cm threshold.'
    elif tumor_percentage < 5:
        severity = 'small'
        action = 'MONITOR'
        message = f'Small tumor detected ({tumor_percentage:.1f}% of brain area).'
    elif tumor_percentage < 15:
        severity = 'moderate'
        action = 'IMMEDIATE'
        message = f'Moderate tumor detected ({tumor_percentage:.1f}% of brain area).'
    else:
        severity = 'significant'
        action = 'URGENT'
        message = f'Significant tumor detected ({tumor_percentage:.1f}% of brain area).'

    if tumor_type:
        message += f' Type: {tumor_type}.'

    next_steps = [
        'Consult with neurologist immediately',
        'Additional MRI sequences recommended',
        'Prepare medical history and symptoms',
        'Consider second opinion'
    ]

    if severity == 'significant':
        next_steps.insert(0, '🚨 URGENT: Seek immediate medical attention')

    return {
        'severity': severity,
        'action': action,
        'message': message,
        'next_steps': next_steps
    }


# --- API ENDPOINTS ---

@app.route('/', methods=['GET'])
def home():
    """API information"""
    return jsonify({
        'name': 'Brain Tumor Detection & Classification API',
        'version': '2.0',
        'status': 'operational',
        'models': {
            'segmentation': {
                'loaded': segmentation_model is not None,
                'accuracy': '95.7%',
                'dice': '82.7%'
            },
            'classification': {
                'loaded': classification_model is not None,
                'accuracy': '81.3%',
                'classes': CLASS_NAMES
            }
        },
        'endpoints': {
            '/health': 'Health check',
            '/analyze': 'Analyze MRI/CT scan (multipart/form-data)',
            '/analyze-base64': 'Analyze MRI/CT scan (base64 JSON)',
            '/medical-info': 'Medical reference guide',   # ADD THIS
            '/stats': 'Usage statistics'
        },
        'timestamp': datetime.now().isoformat()
    })

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'segmentation_model': segmentation_model is not None,
        'classification_model': classification_model is not None,
        'ct_detection_model': ct_detection_model is not None,
        'timestamp': datetime.now().isoformat()
    })

@app.route('/analyze', methods=['POST'])
def analyze():
    try:
        if 'file' not in request.files:
            return jsonify({'success': False, 'error': 'No file uploaded'}), 400

        file = request.files['file']
        img_bytes = file.read()
        nparr = np.frombuffer(img_bytes, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if image is None:
            return jsonify({'success': False, 'error': 'Invalid image'}), 400

        scan_type = request.form.get('scan_type', 'mri').lower()

        if scan_type == 'ct':
            if ct_detection_model is None:
                return jsonify({'success': False, 'error': 'CT model not loaded'}), 500

            has_tumor, ct_confidence = detect_tumor_ct(image)
            tumor_percentage = float(ct_confidence) if has_tumor else 0.0
            tumor_type = None
            classification_confidence = 0.0
            mask = np.zeros((256, 256), dtype=np.uint8)
            size_info = {"estimated_diameter_cm": 0.0, "exceeds_2cm_threshold": False, "area_cm2": 0.0, "tumor_pixels": 0, "pixel_spacing_mm": 0.75}
            border_info = {"irregularity_score": 0.0, "is_irregular": False, "clinical_note": "CT scan — segmentation not available"}
            heterogeneity_info = {"heterogeneity_score": 0.0, "is_heterogeneous": False, "clinical_note": "CT scan — use MRI for detailed analysis"}
            contrast_info = {"contrast_score": 0.0, "is_suspicious": False, "clinical_note": "CT scan — use MRI for detailed analysis"}
            overlay = image
            severity_info = get_severity_info(tumor_percentage, None, 0.0)

        else:
            if segmentation_model is None:
                return jsonify({'success': False, 'error': 'MRI segmentation model not loaded'}), 500

            mask = segment_tumor(image)
            total_pixels = mask.size
            tumor_pixels = int(np.sum(mask > 127))
            tumor_percentage = (tumor_pixels / total_pixels) * 100
            has_tumor = bool(tumor_pixels > 100)
            tumor_type = None
            classification_confidence = 0.0
            if has_tumor and classification_model is not None:
                tumor_type, classification_confidence = classify_tumor(image, mask)
            size_info = calculate_tumor_size_cm(mask)
            border_info = calculate_border_irregularity(mask)
            heterogeneity_info = calculate_heterogeneity(image, mask)
            contrast_info = calculate_tissue_contrast(image, mask)
            overlay = create_overlay(image, mask)
            severity_info = get_severity_info(tumor_percentage, tumor_type, size_info['estimated_diameter_cm'])

        _, overlay_encoded = cv2.imencode('.png', overlay)
        overlay_base64 = base64.b64encode(overlay_encoded).decode('utf-8')
        _, mask_encoded = cv2.imencode('.png', mask)
        mask_base64 = base64.b64encode(mask_encoded).decode('utf-8')

        result = {
            'success': True,
            'timestamp': datetime.now().isoformat(),
            'scan_info': {
                'scan_type': scan_type.upper(),
                'note': 'CT used for detection only. Upload MRI for full analysis.' if scan_type == 'ct' else 'MRI full analysis completed.'
            },
            'detection': {
                'has_tumor': has_tumor,
                'tumor_percentage': round(tumor_percentage, 2),
                'tumor_pixels': int(np.sum(mask > 127)),
                'confidence': ct_confidence if scan_type == 'ct' else 95.7
            },
            'classification': {
                'enabled': scan_type == 'mri' and classification_model is not None,
                'tumor_type': tumor_type,
                'confidence': round(classification_confidence * 100, 1) if tumor_type else 0.0,
                'note': 'Classification not available for CT scans' if scan_type == 'ct' else 'Classification requires radiologist confirmation'
            },
            'severity': severity_info,
            'clinical_analysis': {
                'size': size_info,
                'border': border_info,
                'heterogeneity': heterogeneity_info,
                'tissue_contrast': contrast_info
            },
            'visualizations': {
                'overlay': overlay_base64,
                'mask': mask_base64
            }
        }

        save_to_history(result)
        return jsonify(result)

    except Exception as e:
        print("="*50)
        print("❌ ERROR IN /analyze:")
        print(traceback.format_exc())
        print("="*50)
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/analyze-base64', methods=['POST'])
def analyze_base64():
    try:
        data = request.get_json()

        if 'image' not in data:
            return jsonify({'success': False, 'error': 'No image data'}), 400

        img_data = base64.b64decode(data['image'])
        nparr = np.frombuffer(img_data, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if image is None:
            return jsonify({'success': False, 'error': 'Invalid image'}), 400

        scan_type = data.get('scan_type', 'mri').lower()

        if scan_type == 'ct':
            if ct_detection_model is None:
                return jsonify({'success': False, 'error': 'CT model not loaded'}), 500

            has_tumor, ct_confidence = detect_tumor_ct(image)
            tumor_percentage = float(ct_confidence) if has_tumor else 0.0
            tumor_type = None
            classification_confidence = 0.0
            mask = np.zeros((256, 256), dtype=np.uint8)
            size_info = {"estimated_diameter_cm": 0.0, "exceeds_2cm_threshold": False, "area_cm2": 0.0, "tumor_pixels": 0, "pixel_spacing_mm": 0.75}
            border_info = {"irregularity_score": 0.0, "is_irregular": False, "clinical_note": "CT scan — segmentation not available"}
            heterogeneity_info = {"heterogeneity_score": 0.0, "is_heterogeneous": False, "clinical_note": "CT scan — use MRI for detailed analysis"}
            contrast_info = {"contrast_score": 0.0, "is_suspicious": False, "clinical_note": "CT scan — use MRI for detailed analysis"}
            overlay = image
            severity_info = get_severity_info(tumor_percentage, None, 0.0)

        else:
            if segmentation_model is None:
                return jsonify({'success': False, 'error': 'MRI segmentation model not loaded'}), 500

            mask = segment_tumor(image)
            total_pixels = mask.size
            tumor_pixels = int(np.sum(mask > 127))
            tumor_percentage = (tumor_pixels / total_pixels) * 100
            has_tumor = bool(tumor_pixels > 100)
            tumor_type = None
            classification_confidence = 0.0
            if has_tumor and classification_model is not None:
                tumor_type, classification_confidence = classify_tumor(image, mask)
            size_info = calculate_tumor_size_cm(mask)
            border_info = calculate_border_irregularity(mask)
            heterogeneity_info = calculate_heterogeneity(image, mask)
            contrast_info = calculate_tissue_contrast(image, mask)
            overlay = create_overlay(image, mask)
            severity_info = get_severity_info(tumor_percentage, tumor_type, size_info['estimated_diameter_cm'])

        _, overlay_encoded = cv2.imencode('.png', overlay)
        overlay_base64 = base64.b64encode(overlay_encoded).decode('utf-8')
        _, mask_encoded = cv2.imencode('.png', mask)
        mask_base64 = base64.b64encode(mask_encoded).decode('utf-8')

        result = {
            'success': True,
            'timestamp': datetime.now().isoformat(),
            'scan_info': {
                'scan_type': scan_type.upper(),
                'note': 'CT used for detection only. Upload MRI for full analysis.' if scan_type == 'ct' else 'MRI full analysis completed.'
            },
            'detection': {
                'has_tumor': has_tumor,
                'tumor_percentage': round(tumor_percentage, 2),
                'tumor_pixels': int(np.sum(mask > 127)),
                'confidence': ct_confidence if scan_type == 'ct' else 95.7
            },
            'classification': {
                'enabled': scan_type == 'mri' and classification_model is not None,
                'tumor_type': tumor_type,
                'confidence': round(classification_confidence * 100, 1) if tumor_type else 0.0,
                'note': 'Classification not available for CT scans' if scan_type == 'ct' else 'Classification requires radiologist confirmation'
            },
            'severity': severity_info,
            'clinical_analysis': {
                'size': size_info,
                'border': border_info,
                'heterogeneity': heterogeneity_info,
                'tissue_contrast': contrast_info
            },
            'visualizations': {
                'overlay': overlay_base64,
                'mask': mask_base64
            }
        }

        save_to_history(result)
        return jsonify(result)

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/stats', methods=['GET'])
def stats():
    """Get usage statistics"""
    try:
        if not os.path.exists(HISTORY_FILE):
            return jsonify({
                'total_analyses': 0,
                'tumors_detected': 0,
                'tumor_types': {}
            })
        
        with open(HISTORY_FILE, 'r') as f:
            history = json.load(f)
        
        total = len(history)
        tumors = sum(1 for h in history if h.get('detection', {}).get('has_tumor', False))
        
        tumor_types = {}
        for h in history:
            t_type = h.get('classification', {}).get('tumor_type')
            if t_type:
                tumor_types[t_type] = tumor_types.get(t_type, 0) + 1
        
        return jsonify({
            'total_analyses': total,
            'tumors_detected': tumors,
            'tumor_types': tumor_types,
            'detection_rate': round((tumors / total * 100) if total > 0 else 0, 1)
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# --- HELPER FUNCTIONS ---
def save_to_history(result):
    try:
        print("📝 Saving to history...")
        
        history = []
        if os.path.exists(HISTORY_FILE):
            with open(HISTORY_FILE, 'r') as f:
                content = f.read().strip()
                print(f"   File content preview: {content[:100]}")
                if content:
                    history = json.loads(content)

        result_copy = json.loads(
            json.dumps(result, default=lambda x: bool(x) if isinstance(x, (bool,)) else float(x) if hasattr(x, 'item') else str(x))
        )

        if 'visualizations' in result_copy:
            del result_copy['visualizations']

        history.append(result_copy)

        with open(HISTORY_FILE, 'w') as f:
            json.dump(history, f, indent=2)
        
        print("   ✅ Saved successfully")

    except Exception as e:
        print(f"   ❌ Failed to save history: {e}")
        print(traceback.format_exc())

@app.route('/medical-info', methods=['GET'])
def medical_info():
    return jsonify({
        'tumor_types': {
            'Glioma': {
                'description': 'Tumor arising from glial cells. Most common primary brain tumor.',
                'danger_level': 'High',
                'size_threshold': 'Greater than 2cm is considered dangerous',
                'warning_signs': ['Irregular borders', 'Mixed internal texture', 'Rapid growth']
            },
            'Meningioma': {
                'description': 'Tumor arising from meninges. Usually slow-growing.',
                'danger_level': 'Medium',
                'size_threshold': 'Greater than 3cm may require surgery',
                'warning_signs': ['Headaches', 'Vision problems', 'Weakness in limbs']
            },
            'Pituitary': {
                'description': 'Tumor in the pituitary gland. Affects hormone production.',
                'danger_level': 'Medium',
                'size_threshold': 'Microadenoma less than 1cm, Macroadenoma greater than 1cm',
                'warning_signs': ['Hormonal imbalance', 'Vision changes', 'Headaches']
            }
        },
        'clinical_indicators': {
            'border_irregularity': 'Score above 0.4 indicates irregular borders — red flag for malignancy',
            'heterogeneity': 'Score above 40 indicates mixed internal texture — associated with aggressive tumors',
            'size_danger': 'Diameter above 2cm requires immediate medical attention'
        },
        'scan_types': {
            'MRI': 'Best for tumor type classification and soft tissue detail',
            'CT': 'Used for initial tumor detection and emergency screening'
        }
    })

# --- RUN SERVER ---
if __name__ == '__main__':
    print("\n" + "="*70)
    print("🚀 API SERVER STARTING")
    print("="*70)
    print(f"\n📍 URL: http://localhost:5000")
    print(f"📖 Endpoints:")
    print(f"   GET  /           - API info")
    print(f"   GET  /health     - Health check")
    print(f"   POST /analyze    - Analyze MRI (multipart)")
    print(f"   POST /analyze-base64 - Analyze MRI (base64)")
    print(f"   GET  /stats      - Statistics")
    print(f"\n⚡ Status:")
    print(f"   Segmentation: {'✅' if segmentation_model else '❌'}")
    print(f"   Classification: {'✅' if classification_model else '❌'}")
    print(f"\n{'='*70}\n")
    
    debug = os.getenv('FLASK_DEBUG', 'false').lower() == 'true'
    app.run(debug=debug, host='0.0.0.0', port=5000, use_reloader=debug)
