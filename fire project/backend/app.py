import os
import io
import numpy as np
import tifffile as tiff
import torch

from flask import Flask, request, jsonify
from flask_cors import CORS

from model import (
    MiniSegCNN,
    normalize_for_rgb, compute_nbr_mask, make_colors,
    to_png_b64, gray_to_png_b64, npy_to_b64,
    predict_patch, predict_full_image_tiled
)

app = Flask(__name__)
CORS(app)

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

# =============================
# LOAD MODEL AUTO
# =============================
def load_model_auto():
    model_path = "mini_cnn_fire_segmentation.pth"
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Modèle introuvable: {model_path}. Mets le .pth dans backend/")
    model = MiniSegCNN(n_classes=3)
    sd = torch.load(model_path, map_location=DEVICE)
    model.load_state_dict(sd)
    model.to(DEVICE)
    model.eval()
    return model

model = load_model_auto()
print("✅ Model loaded on", DEVICE)

# =============================
# HELPERS
# =============================
def load_npy_file(file_storage):
    raw = file_storage.read()
    buf = io.BytesIO(raw)
    arr = np.load(buf, allow_pickle=False)
    return arr

@app.get("/health")
def health():
    return jsonify({"ok": True, "device": DEVICE})

# =============================
# PATCH ENDPOINT
# =============================
@app.post("/predict/patch")
def api_predict_patch():
    if "file" not in request.files:
        return jsonify({"error": "Missing file field. Use FormData key 'file'."}), 400

    f = request.files["file"]
    patch = load_npy_file(f)

    # Debug
    print("PATCH SHAPE:", patch.shape, "DTYPE:", patch.dtype)

    if patch.ndim == 2:
        return jsonify({"error": f"Patch 2D reçu {patch.shape}. Attendu (H,W,3). Tu as upload un mask ?"}), 400
    if patch.ndim != 3 or patch.shape[2] != 3:
        return jsonify({"error": f"Patch shape invalide {patch.shape}. Attendu (H,W,3)."}), 400

    patch = patch.astype(np.float32)
    if np.nanmax(patch) > 1.5:
        patch = patch / 255.0
    patch = np.clip(patch, 0, 1)

    pred = predict_patch(model, patch, DEVICE)
    pred_rgb = make_colors(pred)
    overlay = np.clip(0.55 * patch + 0.45 * pred_rgb, 0, 1)

    return jsonify({
        "patch_png": to_png_b64(patch),
        "pred_png": to_png_b64(pred_rgb),
        "overlay_png": to_png_b64(overlay),
        "pred_npy": npy_to_b64(pred)
    })

# =============================
# BANDS ENDPOINT
# =============================
@app.post("/predict/bands")
def api_predict_bands():
    # files
    for k in ["b11", "b12", "b8a"]:
        if k not in request.files:
            return jsonify({"error": f"Missing file: {k}"}), 400

    b11 = tiff.imread(request.files["b11"]).astype(np.float32)
    b12 = tiff.imread(request.files["b12"]).astype(np.float32)
    b8a = tiff.imread(request.files["b8a"]).astype(np.float32)

    if not (b11.shape == b12.shape == b8a.shape):
        return jsonify({"error": f"Tailles différentes: B11{b11.shape} B12{b12.shape} B8A{b8a.shape}"}), 400

    # params
    nbr_veg = float(request.form.get("nbr_veg", 0.25))
    nbr_burn = float(request.form.get("nbr_burn", 0.05))
    nbr_fire = float(request.form.get("nbr_fire", 0.0))
    b12_q = float(request.form.get("b12_q", 99.5))
    tile = int(request.form.get("tile", 128))
    stride = int(request.form.get("stride", 64))

    fused = np.stack([b12, b11, b8a], axis=-1)
    rgb = normalize_for_rgb(fused)

    nbr, pseudo, b12_thr = compute_nbr_mask(b12, b11, b8a, nbr_veg, nbr_burn, nbr_fire, b12_q)

    pred_full = predict_full_image_tiled(model, rgb, DEVICE, tile=tile, stride=stride)
    pred_rgb = make_colors(pred_full)
    overlay = np.clip(0.55 * rgb + 0.45 * pred_rgb, 0, 1)

    return jsonify({
        "fusion_png": to_png_b64(rgb),
        "nbr_png": gray_to_png_b64(nbr, cmap="RdYlGn"),
        "pseudo_png": to_png_b64(make_colors(pseudo)),
        "pred_png": to_png_b64(pred_rgb),
        "overlay_png": to_png_b64(overlay),
        "pred_npy": npy_to_b64(pred_full),
        "meta": {"b12_thr": b12_thr}
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
