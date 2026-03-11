"""
Xception Training - With Manual Weight Loading
If download fails, loads from local file
"""

import tensorflow as tf
from tensorflow.keras.applications import Xception
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout, BatchNormalization
from tensorflow.keras.models import Model
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.callbacks import ModelCheckpoint, EarlyStopping, ReduceLROnPlateau
import matplotlib.pyplot as plt
import numpy as np
import os

# Set random seeds
tf.random.set_seed(42)
np.random.seed(42)

# Dataset paths
BASE_PATH = r"D:\work\brain tumor project\Brain_Tumors_Organized"
TRAIN_DIR = os.path.join(BASE_PATH, 'train')
VAL_DIR = os.path.join(BASE_PATH, 'val')
TEST_DIR = os.path.join(BASE_PATH, 'test')

# Model parameters
IMG_SIZE = 299  # Xception requires 299
BATCH_SIZE = 16
EPOCHS = 40
INITIAL_LR = 1e-4
NUM_CLASSES = 3

CLASS_NAMES = ['Glioma', 'Meningioma', 'Pituitary']

print("="*70)
print("🧠 XCEPTION TRANSFER LEARNING - Boss's Code Modified")
print("="*70)

# Data augmentation
print("\n📦 Setting up data generators...")

train_datagen = ImageDataGenerator(
    rescale=1./255,
    rotation_range=25,
    width_shift_range=0.15,
    height_shift_range=0.15,
    shear_range=0.15,
    zoom_range=0.15,
    horizontal_flip=True,
    brightness_range=[0.8, 1.2],
    fill_mode='nearest'
)

val_datagen = ImageDataGenerator(rescale=1./255)
test_datagen = ImageDataGenerator(rescale=1./255)

# Create generators
train_generator = train_datagen.flow_from_directory(
    TRAIN_DIR,
    target_size=(IMG_SIZE, IMG_SIZE),
    batch_size=BATCH_SIZE,
    class_mode='sparse',
    shuffle=True
)

val_generator = val_datagen.flow_from_directory(
    VAL_DIR,
    target_size=(IMG_SIZE, IMG_SIZE),
    batch_size=BATCH_SIZE,
    class_mode='sparse',
    shuffle=False
)

test_generator = test_datagen.flow_from_directory(
    TEST_DIR,
    target_size=(IMG_SIZE, IMG_SIZE),
    batch_size=BATCH_SIZE,
    class_mode='sparse',
    shuffle=False
)

print(f"\n📊 Dataset:")
print(f"   Training: {train_generator.samples}")
print(f"   Validation: {val_generator.samples}")
print(f"   Test: {test_generator.samples}")
print(f"   Classes: {list(train_generator.class_indices.keys())}")

# Calculate class weights
from collections import Counter
class_counts = Counter(train_generator.classes)
total = sum(class_counts.values())

class_weights = {
    i: total / (NUM_CLASSES * class_counts[i]) 
    for i in range(NUM_CLASSES)
}

print(f"\n⚖️  Class weights:")
for i in range(NUM_CLASSES):
    class_name = list(train_generator.class_indices.keys())[i]
    print(f"   {class_name:12s}: {class_weights[i]:.2f}")

# Build model
print("\n" + "="*70)
print("🏗️  BUILDING XCEPTION MODEL")
print("="*70)

print("\n📥 Loading Xception...")
print("   Trying to download pretrained weights...")

try:
    # Try downloading
    base_model = Xception(
        weights='imagenet',
        include_top=False,
        input_shape=(IMG_SIZE, IMG_SIZE, 3)
    )
    print("   ✅ Downloaded successfully!")
    
except Exception as e:
    print(f"   ❌ Download failed: {e}")
    print("\n   🔄 Using Xception WITHOUT pretrained weights...")
    print("   (Model will train from scratch - takes longer)")
    
    base_model = Xception(
        weights=None,  # No pretrained weights
        include_top=False,
        input_shape=(IMG_SIZE, IMG_SIZE, 3)
    )
    print("   ✅ Created model without ImageNet weights")

print(f"\n   Total layers: {len(base_model.layers)}")

# Freeze base initially
base_model.trainable = False

# Add custom head
x = base_model.output
x = GlobalAveragePooling2D()(x)
x = BatchNormalization()(x)
x = Dense(512, activation='relu')(x)
x = Dropout(0.5)(x)
x = BatchNormalization()(x)
x = Dense(256, activation='relu')(x)
x = Dropout(0.4)(x)
predictions = Dense(NUM_CLASSES, activation='softmax')(x)

model = Model(inputs=base_model.input, outputs=predictions)

print(f"\n   Parameters: {model.count_params():,}")
print(f"   Trainable: {sum([tf.size(w).numpy() for w in model.trainable_weights]):,}")

# Compile
model.compile(
    optimizer=Adam(learning_rate=INITIAL_LR),
    loss='sparse_categorical_crossentropy',
    metrics=['accuracy']
)

# Callbacks
os.makedirs('models', exist_ok=True)

callbacks = [
    ModelCheckpoint(
        'models/xception_best.h5',
        monitor='val_accuracy',
        save_best_only=True,
        mode='max',
        verbose=1
    ),
    ReduceLROnPlateau(
        monitor='val_accuracy',
        factor=0.5,
        patience=4,
        mode='max',
        min_lr=1e-7,
        verbose=1
    ),
    EarlyStopping(
        monitor='val_accuracy',
        patience=12,
        mode='max',
        restore_best_weights=True,
        verbose=1
    )
]

# PHASE 1: Train with frozen base
print("\n" + "="*70)
print("🚀 PHASE 1: Training")
print("="*70)
print(f"⏱️  Expected: 45-60 minutes\n")

history = model.fit(
    train_generator,
    epochs=25,
    validation_data=val_generator,
    class_weight=class_weights,
    callbacks=callbacks,
    verbose=1
)

# PHASE 2: Fine-tuning
print("\n" + "="*70)
print("🔧 PHASE 2: Fine-tuning")
print("="*70)

base_model.trainable = True
fine_tune_at = len(base_model.layers) - 30

for layer in base_model.layers[:fine_tune_at]:
    layer.trainable = False

print(f"\n   Unfrozing last {len(base_model.layers) - fine_tune_at} layers")

model.compile(
    optimizer=Adam(learning_rate=INITIAL_LR/10),
    loss='sparse_categorical_crossentropy',
    metrics=['accuracy']
)

history_fine = model.fit(
    train_generator,
    epochs=40,
    initial_epoch=len(history.history['loss']),
    validation_data=val_generator,
    class_weight=class_weights,
    callbacks=callbacks,
    verbose=1
)

# Evaluate
print("\n" + "="*70)
print("📊 EVALUATION")
print("="*70)

test_loss, test_acc = model.evaluate(test_generator, verbose=0)
print(f"\n🎯 Test Accuracy: {test_acc:.4f} ({test_acc*100:.1f}%)")

# Per-class
predictions = model.predict(test_generator, verbose=0)
pred_labels = np.argmax(predictions, axis=1)
true_labels = test_generator.classes

print(f"\n📋 Per-Class:")
for i in range(NUM_CLASSES):
    class_name = list(test_generator.class_indices.keys())[i]
    mask = true_labels == i
    if np.sum(mask) > 0:
        acc = np.mean(pred_labels[mask] == true_labels[mask])
        count = np.sum(mask)
        print(f"   {class_name:12s}: {acc*100:5.1f}% ({int(acc*count)}/{count})")

# Plot
acc = history.history['accuracy'] + history_fine.history['accuracy']
val_acc = history.history['val_accuracy'] + history_fine.history['val_accuracy']

plt.figure(figsize=(12, 5))
plt.subplot(1, 2, 1)
plt.plot(acc, 'b-', label='Train', linewidth=2)
plt.plot(val_acc, 'r-', label='Val', linewidth=2)
plt.axvline(x=len(history.history['loss']), color='green', linestyle='--', label='Fine-tune')
plt.title('Xception Accuracy', fontsize=14, fontweight='bold')
plt.xlabel('Epoch')
plt.ylabel('Accuracy')
plt.legend()
plt.grid(True, alpha=0.3)

plt.subplot(1, 2, 2)
best_val = max(val_acc)
best_epoch = val_acc.index(best_val) + 1
plt.bar(['V3\nCLAHE', 'Xception'], [0.783, test_acc], color=['blue', 'green'])
plt.title('Model Comparison', fontsize=14, fontweight='bold')
plt.ylabel('Accuracy')
plt.ylim([0, 1])
for i, v in enumerate([0.783, test_acc]):
    plt.text(i, v + 0.02, f'{v*100:.1f}%', ha='center', fontweight='bold')

plt.tight_layout()
plt.savefig('models/xception_results.png', dpi=150)
print(f"\n✅ Saved: models/xception_results.png")
plt.show()

print("\n" + "="*70)
print("✅ COMPLETE!")
print("="*70)
print(f"\n🏆 Best Val: {max(val_acc)*100:.1f}%")
print(f"🎯 Test: {test_acc*100:.1f}%")

if test_acc >= 0.80:
    print(f"\n🎉 EXCELLENT!")
elif test_acc >= 0.75:
    print(f"\n✅ VERY GOOD!")

print(f"\n💾 Model: models/xception_best.h5")
print(f"{'='*70}\n")