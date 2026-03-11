"""
CT Brain Tumor Detection Model
Binary: Tumor / Healthy
"""

import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Conv2D, MaxPooling2D, Dense, Dropout, GlobalAveragePooling2D, BatchNormalization
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.callbacks import ModelCheckpoint, EarlyStopping, ReduceLROnPlateau
import matplotlib.pyplot as plt
import numpy as np
import os

# --- PATHS ---
CT_DATA_PATH = r"D:\work\brain tumor project\CT_Dataset"

IMG_SIZE = 224
BATCH_SIZE = 32
EPOCHS = 30

print("="*60)
print("🧠 CT BRAIN TUMOR DETECTION TRAINING")
print("="*60)

# --- DATA GENERATORS ---
train_datagen = ImageDataGenerator(
    rescale=1./255,
    rotation_range=20,
    width_shift_range=0.1,
    height_shift_range=0.1,
    horizontal_flip=True,
    zoom_range=0.1,
    validation_split=0.2  # 80% train, 20% val
)

train_gen = train_datagen.flow_from_directory(
    CT_DATA_PATH,
    target_size=(IMG_SIZE, IMG_SIZE),
    batch_size=BATCH_SIZE,
    class_mode='binary',
    subset='training',
    shuffle=True
)

val_gen = train_datagen.flow_from_directory(
    CT_DATA_PATH,
    target_size=(IMG_SIZE, IMG_SIZE),
    batch_size=BATCH_SIZE,
    class_mode='binary',
    subset='validation',
    shuffle=False
)

print(f"\n✅ Train: {train_gen.samples} images")
print(f"✅ Val: {val_gen.samples} images")
print(f"Classes: {train_gen.class_indices}")

# --- MODEL ---
model = Sequential([
    Conv2D(32, (3,3), activation='relu', input_shape=(IMG_SIZE, IMG_SIZE, 3)),
    BatchNormalization(),
    MaxPooling2D(2,2),

    Conv2D(64, (3,3), activation='relu'),
    BatchNormalization(),
    MaxPooling2D(2,2),

    Conv2D(128, (3,3), activation='relu'),
    BatchNormalization(),
    MaxPooling2D(2,2),

    Conv2D(256, (3,3), activation='relu'),
    BatchNormalization(),
    MaxPooling2D(2,2),

    GlobalAveragePooling2D(),
    Dense(512, activation='relu'),
    Dropout(0.5),
    Dense(256, activation='relu'),
    Dropout(0.3),
    Dense(1, activation='sigmoid')  # Binary: tumor or not
])

model.compile(
    optimizer='adam',
    loss='binary_crossentropy',
    metrics=['accuracy']
)

print(f"\nModel parameters: {model.count_params():,}")

# --- CALLBACKS ---
os.makedirs('models', exist_ok=True)

callbacks = [
    ModelCheckpoint(
        'models/ct_detector_best.h5',
        monitor='val_accuracy',
        save_best_only=True,
        mode='max',
        verbose=1
    ),
    EarlyStopping(
        monitor='val_accuracy',
        patience=8,
        restore_best_weights=True,
        verbose=1
    ),
    ReduceLROnPlateau(
        monitor='val_accuracy',
        factor=0.5,
        patience=4,
        min_lr=1e-6,
        verbose=1
    )
]

# --- TRAIN ---
print("\n🚀 Starting training...")
history = model.fit(
    train_gen,
    epochs=EPOCHS,
    validation_data=val_gen,
    callbacks=callbacks,
    verbose=1
)

# --- EVALUATE ---
print("\n" + "="*60)
val_loss, val_acc = model.evaluate(val_gen, verbose=0)
print(f"✅ Final Accuracy: {val_acc*100:.1f}%")

# --- PLOT ---
plt.figure(figsize=(12,4))
plt.subplot(1,2,1)
plt.plot(history.history['accuracy'], label='Train')
plt.plot(history.history['val_accuracy'], label='Val')
plt.title('CT Detector Accuracy')
plt.legend()

plt.subplot(1,2,2)
plt.plot(history.history['loss'], label='Train')
plt.plot(history.history['val_loss'], label='Val')
plt.title('CT Detector Loss')
plt.legend()

plt.savefig('models/ct_training_history.png')
plt.show()

print(f"\n💾 Model saved: models/ct_detector_best.h5")
print("="*60)
