import os
import cv2
import numpy as np
import tensorflow as tf
from tensorflow.keras import layers, models
from tensorflow.keras.callbacks import ModelCheckpoint, ReduceLROnPlateau, EarlyStopping
import matplotlib.pyplot as plt

# --- FORCE GPU USAGE ---
print("="*70)
print("🔍 GPU Detection and Configuration")
print("="*70)

# List all devices
print("\nAvailable devices:")
for device in tf.config.list_physical_devices():
    print(f"   {device}")

# Get GPUs
gpus = tf.config.list_physical_devices('GPU')
print(f"\n📊 GPU Count: {len(gpus)}")

if len(gpus) == 0:
    print("⚠️  WARNING: No GPU detected!")
    print("   Training will be VERY slow on CPU")
    print("\n   Your old code worked because TensorFlow was configured differently.")
    print("   Let's continue but training will take longer.\n")
else:
    print(f"✅ GPU Detected: {gpus[0]}")
    try:
        # Set memory growth
        for gpu in gpus:
            tf.config.experimental.set_memory_growth(gpu, True)
        
        # Force TensorFlow to use GPU
        tf.config.set_visible_devices(gpus, 'GPU')
        
        print("✅ GPU memory growth enabled")
        print("✅ GPU set as visible device\n")
    except RuntimeError as e:
        print(f"⚠️  GPU config error: {e}\n")

# --- CONFIGURATION ----
IMG_SIZE = 256
BATCH_SIZE = 8
EPOCHS = 30
BASE_PATH = r"D:\work\brain tumor project\Brain_Project_256"

print("="*70)
print("🧠 BRAIN TUMOR SEGMENTATION - GPU OPTIMIZED")
print("="*70)

# --- LOAD DATASET ---
def load_dataset(folder_name):
    """Load entire dataset into memory"""
    print(f"\n📦 Loading {folder_name} dataset...")
    
    img_dir = os.path.join(BASE_PATH, folder_name, 'images')
    msk_dir = os.path.join(BASE_PATH, folder_name, 'masks')
    
    files = os.listdir(img_dir)
    
    images = []
    masks = []
    skipped = 0
    
    for i, filename in enumerate(files):
        if i % 500 == 0:
            print(f"   Loading {i}/{len(files)}...")
        
        try:
            img_path = os.path.join(img_dir, filename)
            msk_path = os.path.join(msk_dir, filename)
            
            img = cv2.imread(img_path)
            msk = cv2.imread(msk_path, cv2.IMREAD_GRAYSCALE)
            
            if img is None or msk is None:
                skipped += 1
                continue
            
            if img.shape[0] != 256 or img.shape[1] != 256:
                img = cv2.resize(img, (IMG_SIZE, IMG_SIZE))
                msk = cv2.resize(msk, (IMG_SIZE, IMG_SIZE))
            
            img = img.astype(np.float32) / 255.0
            msk = msk.astype(np.float32) / 255.0
            
            images.append(img)
            masks.append(msk)
            
        except Exception as e:
            print(f"   ⚠️ Error loading {filename}: {e}")
            skipped += 1
            continue
    
    X = np.array(images, dtype=np.float32)
    y = np.array(masks, dtype=np.float32)
    y = np.expand_dims(y, axis=-1)
    
    print(f"   ✅ Loaded {len(X)} images ({skipped} skipped)")
    
    tumor_count = np.sum([np.max(mask) > 0.5 for mask in masks])
    print(f"   📊 Tumors: {tumor_count}/{len(masks)} ({tumor_count/len(masks)*100:.1f}%)")
    
    return X, y

# --- U-NET ---
def build_unet():
    """U-Net for 256×256"""
    inputs = layers.Input((IMG_SIZE, IMG_SIZE, 3))
    
    # Encoder
    c1 = layers.Conv2D(32, 3, activation='relu', padding='same')(inputs)
    c1 = layers.Conv2D(32, 3, activation='relu', padding='same')(c1)
    p1 = layers.MaxPooling2D(2)(c1)
    
    c2 = layers.Conv2D(64, 3, activation='relu', padding='same')(p1)
    c2 = layers.Conv2D(64, 3, activation='relu', padding='same')(c2)
    p2 = layers.MaxPooling2D(2)(c2)
    
    c3 = layers.Conv2D(128, 3, activation='relu', padding='same')(p2)
    c3 = layers.Conv2D(128, 3, activation='relu', padding='same')(c3)
    p3 = layers.MaxPooling2D(2)(c3)
    
    c4 = layers.Conv2D(256, 3, activation='relu', padding='same')(p3)
    c4 = layers.Conv2D(256, 3, activation='relu', padding='same')(c4)
    c4 = layers.Dropout(0.5)(c4)
    
    # Decoder
    u3 = layers.UpSampling2D(2)(c4)
    u3 = layers.concatenate([u3, c3])
    c5 = layers.Conv2D(128, 3, activation='relu', padding='same')(u3)
    c5 = layers.Conv2D(128, 3, activation='relu', padding='same')(c5)
    
    u2 = layers.UpSampling2D(2)(c5)
    u2 = layers.concatenate([u2, c2])
    c6 = layers.Conv2D(64, 3, activation='relu', padding='same')(u2)
    c6 = layers.Conv2D(64, 3, activation='relu', padding='same')(c6)
    
    u1 = layers.UpSampling2D(2)(c6)
    u1 = layers.concatenate([u1, c1])
    c7 = layers.Conv2D(32, 3, activation='relu', padding='same')(u1)
    c7 = layers.Conv2D(32, 3, activation='relu', padding='same')(c7)
    
    outputs = layers.Conv2D(1, 1, activation='sigmoid')(c7)
    
    return models.Model(inputs, outputs)

# --- LOSS FUNCTIONS ---
def dice_coefficient(y_true, y_pred, smooth=1e-6):
    y_true_f = tf.reshape(y_true, [-1])
    y_pred_f = tf.reshape(y_pred, [-1])
    intersection = tf.reduce_sum(y_true_f * y_pred_f)
    return (2. * intersection + smooth) / (tf.reduce_sum(y_true_f) + tf.reduce_sum(y_pred_f) + smooth)

def dice_loss(y_true, y_pred):
    return 1 - dice_coefficient(y_true, y_pred)

def combined_loss(y_true, y_pred):
    bce = tf.keras.losses.binary_crossentropy(y_true, y_pred)
    dice = dice_loss(y_true, y_pred)
    return 0.5 * bce + 0.5 * dice

# --- CALLBACKS ---
def get_callbacks():
    checkpoint = ModelCheckpoint(
        'best_model_256_gpu.h5',
        monitor='val_dice_coefficient',
        mode='max',
        save_best_only=True,
        verbose=1
    )
    
    reduce_lr = ReduceLROnPlateau(
        monitor='val_loss',
        factor=0.5,
        patience=3,
        min_lr=1e-7,
        verbose=1
    )
    
    early_stop = EarlyStopping(
        monitor='val_dice_coefficient',
        patience=8,
        mode='max',
        verbose=1,
        restore_best_weights=True
    )
    
    return [checkpoint, reduce_lr, early_stop]

# --- VISUALIZATION ---
class VisualizationCallback(tf.keras.callbacks.Callback):
    def __init__(self, val_X, val_y, frequency=5):
        self.val_X = val_X
        self.val_y = val_y
        self.frequency = frequency
    
    def on_epoch_end(self, epoch, logs=None):
        if (epoch + 1) % self.frequency == 0:
            tumor_indices = [i for i in range(len(self.val_y)) if np.max(self.val_y[i]) > 0.5]
            
            if len(tumor_indices) > 0:
                idx = np.random.choice(tumor_indices)
            else:
                idx = np.random.randint(0, len(self.val_X))
            
            sample_img = self.val_X[idx:idx+1]
            sample_mask = self.val_y[idx]
            
            pred = self.model.predict(sample_img, verbose=0)[0]
            pred_binary = (pred > 0.5).astype(np.float32)
            
            dice = dice_coefficient(sample_mask, pred_binary).numpy()
            
            true_tumor = np.sum(sample_mask > 0.5)
            pred_tumor = np.sum(pred_binary > 0.5)
            
            print(f"\n📊 Epoch {epoch+1} Sample:")
            print(f"   Dice: {dice:.4f}")
            print(f"   True: {true_tumor:,} | Pred: {pred_tumor:,} pixels")
            
            if dice < 0.3:
                print(f"   ⚠️  Learning...")
            elif dice < 0.6:
                print(f"   💪 Improving!")
            elif dice < 0.8:
                print(f"   ✅ Good!")
            else:
                print(f"   🎉 Excellent!")

# --- TRAINING ---
if __name__ == '__main__':
    print(f"\n⚙️  Configuration:")
    print(f"   Image size: {IMG_SIZE}×{IMG_SIZE}")
    print(f"   Batch size: {BATCH_SIZE}")
    print(f"   Epochs: {EPOCHS}")
    
    print("\n🔄 Loading datasets...")
    train_X, train_y = load_dataset('train')
    val_X, val_y = load_dataset('val')
    
    print(f"\n📊 Summary:")
    print(f"   Training: {len(train_X)} images")
    print(f"   Validation: {len(val_X)} images")
    print(f"   Memory: ~{(train_X.nbytes + train_y.nbytes) / (1024**3):.2f} GB")
    
    print(f"\n🏗️  Building model...")
    
    # Build with device placement
    with tf.device('/GPU:0' if len(gpus) > 0 else '/CPU:0'):
        model = build_unet()
        print(f"   ✅ Model created on {'GPU' if len(gpus) > 0 else 'CPU'}")
        print(f"   Parameters: {model.count_params():,}")
    
    print(f"\n⚙️  Compiling...")
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=1e-4),
        loss=combined_loss,
        metrics=[dice_coefficient]
    )
    
    callbacks = get_callbacks()
    callbacks.append(VisualizationCallback(val_X, val_y, frequency=5))
    
    print(f"\n{'='*70}")
    print(f"🚀 Starting Training")
    print(f"{'='*70}")
    
    if len(gpus) > 0:
        print(f"\n✅ Using GPU - Should be FAST!")
        print(f"   Expected: ~2-3 minutes per epoch")
    else:
        print(f"\n⚠️  Using CPU - Will be SLOW!")
        print(f"   Expected: ~20 minutes per epoch")
    
    print(f"\n💡 Monitor Task Manager GPU usage to confirm\n")
    
    try:
        history = model.fit(
            train_X, train_y,
            validation_data=(val_X, val_y),
            batch_size=BATCH_SIZE,
            epochs=EPOCHS,
            callbacks=callbacks,
            verbose=1
        )
        
        # Save plots
        plt.figure(figsize=(15, 5))
        
        plt.subplot(1, 2, 1)
        plt.plot(history.history['dice_coefficient'], label='Train', linewidth=2)
        plt.plot(history.history['val_dice_coefficient'], label='Val', linewidth=2)
        plt.title('Dice Coefficient')
        plt.xlabel('Epoch')
        plt.ylabel('Dice')
        plt.legend()
        plt.grid(True, alpha=0.3)
        
        plt.subplot(1, 2, 2)
        plt.plot(history.history['loss'], label='Train', linewidth=2)
        plt.plot(history.history['val_loss'], label='Val', linewidth=2)
        plt.title('Loss')
        plt.xlabel('Epoch')
        plt.ylabel('Loss')
        plt.legend()
        plt.grid(True, alpha=0.3)
        
        plt.tight_layout()
        plt.savefig('training_history_gpu.png', dpi=150)
        plt.show()
        
        best_dice = max(history.history['val_dice_coefficient'])
        
        print(f"\n{'='*70}")
        print(f"✅ COMPLETE!")
        print(f"{'='*70}")
        print(f"\n🏆 Best Val Dice: {best_dice:.4f}")
        print(f"💾 Saved: best_model_256_gpu.h5")
        
        if best_dice >= 0.80:
            print(f"🎉 Excellent results!")
        
    except KeyboardInterrupt:
        print(f"\n⚠️  Interrupted")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()