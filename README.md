# 🔥 FireWatch AI

**AI-Powered Satellite Fire & Burned-Area Segmentation**

FireWatch AI is an end-to-end deep learning project for detecting **vegetation, burned areas, and active fire** from Sentinel-2-style satellite imagery.

The system combines a lightweight **PyTorch semantic segmentation model**, a **Flask REST API**, and a **React + Vite frontend** to provide an interactive wildfire-analysis demo.

---

## 🌍 Project Overview

Wildfires can affect large geographic regions, making satellite imagery a valuable tool for monitoring fire activity and assessing environmental damage.

FireWatch AI explores how deep learning and multispectral satellite imagery can be used to automatically classify each image pixel into one of three categories:

* 🌿 **Vegetation**
* 🟤 **Burned Area**
* 🔥 **Active Fire**

The application processes Sentinel-2-style spectral bands, generates burn-related features such as the **Normalized Burn Ratio (NBR)**, and produces segmentation masks showing potentially fire-affected regions.

---

## ✨ Features

* Pixel-wise fire segmentation using a PyTorch CNN
* 3-class semantic segmentation:

  * Vegetation
  * Burned area
  * Active fire
* Upload `.npy` image patches for prediction
* Upload Sentinel-2-style TIFF bands:

  * `B11`
  * `B12`
  * `B8A`
* Generate fused satellite imagery from spectral bands
* Compute and visualize the **Normalized Burn Ratio**
* Generate pseudo-label masks using configurable thresholds
* Run full-image tiled inference
* Visualize:

  * Satellite image
  * NBR map
  * Pseudo-mask
  * Model prediction
  * Prediction overlay
* Download generated masks as:

  * PNG
  * NPY

---

## 🧠 Model

FireWatch AI uses a lightweight convolutional neural network for pixel-wise semantic segmentation.

### Input

The model uses three channels based on Sentinel-2-style imagery:

```text
B12
B11
B8A
```

### Output

Each pixel is classified into one of three classes:

```text
0 → Vegetation
1 → Burned Area
2 → Active Fire
```

The trained PyTorch model is stored in:

```text
backend/mini_cnn_fire_segmentation.pth
```

---

## 🛰️ Normalized Burn Ratio

The project uses the **Normalized Burn Ratio (NBR)** to help identify vegetation and potentially burned regions.

The NBR is calculated as:

```text
NBR = (B8A - B12) / (B8A + B12)
```

NBR is useful because vegetation and burned surfaces respond differently in near-infrared and short-wave infrared wavelengths.

In this project, NBR values are also used to generate pseudo-labels for model training.

---

## 📊 Training Configuration

The training notebook uses the following configuration:

```text
Patch Size: 128 × 128
Stride: 64
Input Bands: B12, B11, B8A
Loss Function: Weighted Cross-Entropy
Epochs: 15
```

Reported experimental results:

```text
Pixel Accuracy: 96.28%
Mean IoU: 0.856
```

> These results were obtained on the experimental dataset and pseudo-labeling pipeline used during development. They should not be interpreted as validated performance on all real-world wildfire imagery.

---

## 🏗️ Architecture

```text
              Sentinel-2 Imagery
                      │
                      ▼
              B12 + B11 + B8A
                      │
                      ▼
                Preprocessing
                      │
          ┌───────────┼───────────┐
          │           │           │
          ▼           ▼           ▼
     NBR Map     RGB Fusion   Pseudo Labels
          │           │           │
          └───────────┼───────────┘
                      ▼
                PyTorch CNN
                      │
                      ▼
            Segmentation Mask
                      │
                      ▼
                Flask API
                      │
                      ▼
             React Web App
                      │
                      ▼
       Visualization & Download
```

---

## 🛠️ Tech Stack

### Machine Learning

* Python
* PyTorch
* NumPy
* Matplotlib
* tifffile
* Pillow
* Jupyter Notebook

### Backend

* Flask
* Flask-CORS
* PyTorch
* NumPy

### Frontend

* React
* Vite
* Material UI
* MUI Icons

---

## 📁 Project Structure

```text
FireWatch-AI/
│
├── backend/
│   ├── app.py
│   ├── model.py
│   ├── mini_cnn_fire_segmentation.pth
│   ├── training_config.pth
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── api.js
│   │   ├── theme.js
│   │   └── main.jsx
│   │
│   ├── package.json
│   └── vite.config.js
│
├── notebooks/
│   └── fire_segmentation_training.ipynb
│
├── .gitignore
└── README.md
```

---

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/1hiba2/FireWatch-AI.git
cd FireWatch-AI
```

---

## 🐍 Backend Setup

Create a virtual environment:

```bash
python -m venv .venv
```

### Windows

```bash
.venv\Scripts\activate
```

### Linux / macOS

```bash
source .venv/bin/activate
```

Install backend dependencies:

```bash
cd backend
pip install -r requirements.txt
```

Run the Flask server:

```bash
python app.py
```

The backend should be available at:

```text
http://127.0.0.1:5000
```

---

## ⚛️ Frontend Setup

Open another terminal and navigate to the frontend:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The frontend will usually run at:

```text
http://localhost:5173
```

---

## 🔌 API Endpoints

### Health Check

```http
GET /health
```

Returns the backend status and the device being used for inference.

Example:

```json
{
  "status": "ok",
  "device": "cpu"
}
```

---

### Patch Prediction

```http
POST /predict/patch
```

Input:

```text
file: .npy file
```

Expected image shape:

```text
(H, W, 3)
```

Returns:

* Original patch visualization
* Prediction mask
* Prediction overlay
* Prediction mask as NPY data

---

### Full Sentinel Band Prediction

```http
POST /predict/bands
```

Required inputs:

```text
b11
b12
b8a
```

Optional parameters:

```text
nbr_veg
nbr_burn
nbr_fire
b12_q
tile
stride
```

Returns:

* Fused RGB image
* NBR map
* Pseudo-mask
* Full prediction
* Prediction overlay
* Prediction mask

---

## 🔬 Research Motivation

This project explores the intersection of:

**Artificial Intelligence + Computer Vision + Remote Sensing + Environmental Monitoring**

The main objectives are to study:

* Semantic segmentation
* Multispectral satellite imagery
* Burned-area detection
* Wildfire monitoring
* Pseudo-label generation
* Deep learning for Earth observation
* Deployment of machine learning models through web applications

---

## ⚠️ Limitations

FireWatch AI is an experimental and educational project.

The current model uses pseudo-labels generated from spectral thresholds rather than fully manually annotated wildfire masks.

Because of this, predictions should not be considered equivalent to professionally validated wildfire products.

A more advanced version should be evaluated using manually labeled imagery from geographically diverse wildfire events.

---

## 🔮 Future Improvements

Possible future developments include:

* Train on larger real-world wildfire datasets
* Use manually annotated segmentation masks
* Add more Sentinel-2 spectral bands
* Compare different architectures:

  * U-Net
  * DeepLabV3+
  * SegFormer
  * Vision Transformers
* Add temporal wildfire progression analysis
* Estimate total burned area
* Export georeferenced GeoTIFF prediction masks
* Add interactive map visualization
* Deploy the full application online
* Add model explainability
* Compare predictions across multiple satellite dates
* Improve generalization across different geographic regions

---

## 🎓 Educational Purpose

FireWatch AI was developed as a learning and research project demonstrating the complete AI workflow:

```text
Satellite Data
      ↓
Preprocessing
      ↓
Feature Engineering
      ↓
Pseudo-Label Generation
      ↓
Model Training
      ↓
Semantic Segmentation
      ↓
API Development
      ↓
Frontend Deployment
      ↓
Interactive Prediction
```

The project demonstrates how artificial intelligence can be applied to satellite imagery for environmental and wildfire-related analysis.

---

## 📌 Disclaimer

This project is intended for **educational and research purposes only**.

The predictions generated by FireWatch AI should not be used for emergency response, operational wildfire detection, or safety-critical decision making without additional validation.

---

## 👩‍💻 Author

Developed as an AI and remote sensing research project.

---

⭐ If you find this project interesting, feel free to star the repository.
