import io
import base64
import numpy as np
import torch
import torch.nn as nn
import matplotlib.pyplot as plt
from PIL import Image

# =============================
# MODEL
# =============================
class MiniSegCNN(nn.Module):
    def __init__(self, n_classes=3):
        super().__init__()
        self.net = nn.Sequential(
            nn.Conv2d(3, 16, 3, padding=1),
            nn.BatchNorm2d(16),
            nn.ReLU(),
            nn.Conv2d(16, 32, 3, padding=1),
            nn.BatchNorm2d(32),
            nn.ReLU(),
            nn.Conv2d(32, n_classes, 1)
        )

    def forward(self, x):
        return self.net(x)

# =============================
# HELPERS
# =============================
def robust_minmax(x, pmin=2, pmax=98):
    x = x[np.isfinite(x)]
    return np.percentile(x, pmin), np.percentile(x, pmax)

def normalize_for_rgb(img3, pmin=2, pmax=98, eps=1e-6):
    out = np.zeros_like(img3, dtype=np.float32)
    for c in range(3):
        lo, hi = robust_minmax(img3[..., c], pmin, pmax)
        out[..., c] = (img3[..., c] - lo) / (hi - lo + eps)
    return np.clip(out, 0, 1)

def make_colors(mask):
    colors = np.zeros((mask.shape[0], mask.shape[1], 3), dtype=np.float32)
    colors[mask == 0] = [0.1, 0.8, 0.2]    # veg
    colors[mask == 1] = [0.75, 0.45, 0.1]  # burned
    colors[mask == 2] = [1.0, 0.1, 0.1]    # fire
    return colors

def compute_nbr_mask(B12, B11, B8A, nbr_veg=0.25, nbr_burn=0.05, nbr_fire=0.0, b12_q=99.5):
    eps = 1e-6
    nbr = (B8A - B12) / (B8A + B12 + eps)
    b12_thr = np.percentile(B12, b12_q)

    mask = np.zeros(B12.shape, dtype=np.uint8)
    mask[nbr >= nbr_veg] = 0
    mask[nbr <= nbr_burn] = 1
    fire = (B12 >= b12_thr) & (nbr <= nbr_fire)
    mask[fire] = 2
    return nbr, mask, float(b12_thr)

def to_png_b64(rgb_float01):
    arr = (np.clip(rgb_float01, 0, 1) * 255).astype(np.uint8)
    im = Image.fromarray(arr)
    buf = io.BytesIO()
    im.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode("utf-8")

def gray_to_png_b64(gray, cmap="RdYlGn"):
    fig = plt.figure(figsize=(4, 4), dpi=150)
    plt.imshow(gray, cmap=cmap)
    plt.axis("off")
    buf = io.BytesIO()
    plt.savefig(buf, format="png", bbox_inches="tight", pad_inches=0)
    plt.close(fig)
    return base64.b64encode(buf.getvalue()).decode("utf-8")

def npy_to_b64(arr):
    buf = io.BytesIO()
    np.save(buf, arr)
    return base64.b64encode(buf.getvalue()).decode("utf-8")

def b64_to_npy(b64_str):
    raw = base64.b64decode(b64_str)
    buf = io.BytesIO(raw)
    return np.load(buf, allow_pickle=False)

# =============================
# PREDICTION
# =============================
def predict_patch(model, rgb_patch, device):
    rgb_patch = np.asarray(rgb_patch)

    if rgb_patch.ndim == 2:
        raise ValueError(f"Patch 2D reçu {rgb_patch.shape}. Attendu (H,W,3). Tu as upload un mask ?")
    if rgb_patch.ndim != 3 or rgb_patch.shape[2] != 3:
        raise ValueError(f"Patch shape invalide: {rgb_patch.shape}. Attendu (H,W,3).")

    rgb_patch = rgb_patch.astype(np.float32)
    if np.nanmax(rgb_patch) > 1.5:
        rgb_patch = rgb_patch / 255.0
    rgb_patch = np.clip(rgb_patch, 0, 1)

    x = torch.from_numpy(rgb_patch).permute(2, 0, 1).unsqueeze(0).float().to(device)
    with torch.no_grad():
        logits = model(x)
        pred = torch.argmax(logits, dim=1)[0].cpu().numpy().astype(np.uint8)
    return pred

def predict_full_image_tiled(model, rgb, device, tile=128, stride=64):
    H, W = rgb.shape[:2]
    n_classes = 3

    prob_sum = np.zeros((n_classes, H, W), dtype=np.float32)
    count = np.zeros((H, W), dtype=np.float32)

    for y in range(0, H - tile + 1, stride):
        for x in range(0, W - tile + 1, stride):
            patch = rgb[y:y+tile, x:x+tile]
            inp = torch.from_numpy(patch).permute(2, 0, 1).unsqueeze(0).float().to(device)
            with torch.no_grad():
                logits = model(inp)[0]  # (C,tile,tile)
                probs = torch.softmax(logits, dim=0).cpu().numpy()
            prob_sum[:, y:y+tile, x:x+tile] += probs
            count[y:y+tile, x:x+tile] += 1.0

    count[count == 0] = 1.0
    prob_avg = prob_sum / count[None, :, :]
    pred = np.argmax(prob_avg, axis=0).astype(np.uint8)
    return pred
