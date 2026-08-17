import React, { useState } from "react";
import {
  Box, Stack, Typography, Paper, Divider, Button, Chip,
  ToggleButtonGroup, ToggleButton, Slider, TextField,
  CircularProgress, Alert
} from "@mui/material";

import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import SatelliteAltIcon from "@mui/icons-material/SatelliteAlt";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import DownloadIcon from "@mui/icons-material/Download";
import ImageIcon from "@mui/icons-material/Image";
import InsightsIcon from "@mui/icons-material/Insights";
import LayersIcon from "@mui/icons-material/Layers";

import { b64pngToUrl, predictPatch, predictBands, downloadB64File } from "./api";
import { glass } from "./theme";

// ----- Card wrapper
function Card({ title, icon, right, children }) {
  return (
    <Paper sx={{ p: 2.2, borderRadius: 4, ...glass }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.2 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          {icon}
          <Typography variant="h6" sx={{ fontWeight: 900, color: "rgba(255,255,255,0.92)" }}>
            {title}
          </Typography>
        </Stack>
        {right}
      </Stack>
      {children}
    </Paper>
  );
}

function ImgPanel({ title, b64, children }) {
  return (
    <Paper sx={{ p: 1.6, borderRadius: 4, ...glass }}>
      <Typography sx={{ mb: 1, fontWeight: 900, color: "rgba(255,255,255,0.92)" }}>
        {title}
      </Typography>

      <Box
        component="img"
        src={b64 ? b64pngToUrl(b64) : ""}
        alt={title}
        sx={{
          width: "100%",
          height: 420,
          objectFit: "contain",
          borderRadius: 3,
          border: "1px solid rgba(255,255,255,0.10)",
          bgcolor: "rgba(0,0,0,0.25)"
        }}
      />

      <Box sx={{ mt: 1.2 }}>
        {children}
      </Box>
    </Paper>
  );
}

function Legend() {
  const items = [
    { name: "Végétation", color: "#1bd15a" },
    { name: "Brûlé", color: "#c07a1a" },
    { name: "Feu actif", color: "#ff2b2b" }
  ];
  return (
    <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
      {items.map((it) => (
        <Chip
          key={it.name}
          label={it.name}
          sx={{
            color: "rgba(255,255,255,0.9)",
            fontWeight: 900,
            bgcolor: "rgba(255,255,255,0.05)",
            border: `1px solid ${it.color}`
          }}
          icon={
            <Box
              sx={{
                width: 12,
                height: 12,
                bgcolor: it.color,
                borderRadius: "50%",
                ml: 1
              }}
            />
          }
        />
      ))}
    </Stack>
  );
}

export default function App() {
  const [mode, setMode] = useState("bands"); // patch | bands
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [patchRes, setPatchRes] = useState(null);

  const [b11, setB11] = useState(null);
  const [b12, setB12] = useState(null);
  const [b8a, setB8a] = useState(null);
  const [bandsRes, setBandsRes] = useState(null);

  const [nbrVeg, setNbrVeg] = useState(0.25);
  const [nbrBurn, setNbrBurn] = useState(0.05);
  const [nbrFire, setNbrFire] = useState(0.0);
  const [b12q, setB12q] = useState(99.5);
  const [tile, setTile] = useState(128);
  const [stride, setStride] = useState(64);

  const canRunBands = !!(b11 && b12 && b8a);

  async function runPatch(file) {
    setErr(""); setLoading(true);
    try {
      const data = await predictPatch(file);
      setPatchRes(data);
    } catch (e) {
      setErr(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  async function runBands() {
    setErr(""); setLoading(true);
    try {
      const data = await predictBands({
        b11, b12, b8a,
        nbr_veg: nbrVeg, nbr_burn: nbrBurn, nbr_fire: nbrFire, b12_q: b12q,
        tile, stride
      });
      setBandsRes(data);
    } catch (e) {
      setErr(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100%",
        background:
          "radial-gradient(1200px 600px at 10% 10%, rgba(255,90,31,0.22), transparent 60%)," +
          "radial-gradient(900px 500px at 90% 20%, rgba(76,201,240,0.18), transparent 60%)," +
          "linear-gradient(180deg, #070A10 0%, #0B1220 100%)",
        color: "white",
        p: { xs: 1.5, md: 2.5 }
      }}
    >
      <Stack direction={{ xs: "column", md: "row" }} spacing={2.5} sx={{ width: "100%" }}>

        {/* SIDEBAR */}
        <Paper
          sx={{
            width: { xs: "100%", md: 360 },
            p: 2.2,
            borderRadius: 4,
            ...glass,
            position: { md: "sticky" },
            top: { md: 16 },
            height: { md: "fit-content" }
          }}
        >
          <Stack spacing={1.2}>
            <Stack direction="row" spacing={1.2} alignItems="center">
              <Box
                sx={{
                  width: 44, height: 44, borderRadius: 3,
                  display: "grid", placeItems: "center",
                  bgcolor: "rgba(255,90,31,0.14)",
                  border: "1px solid rgba(255,90,31,0.25)"
                }}
              >
                <LocalFireDepartmentIcon />
              </Box>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 900, lineHeight: 1.1, color: "rgba(255,255,255,0.95)" }}>
                  FireWatch AI
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.85 , color: "rgba(207, 197, 197, 0.95)"}}>
                  Segmentation 3 classes • Démo end-user
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
              <Chip icon={<LocalFireDepartmentIcon />} label="Pompier" variant="outlined" sx={{ color: "white" }} />
              <Chip icon={<SatelliteAltIcon />} label="Satellite" variant="outlined" sx={{ color: "white" }} />
              <Chip label="Mini-CNN" variant="outlined" sx={{ color: "white" }} />
            </Stack>

            <Divider sx={{ borderColor: "rgba(255,255,255,0.14)", my: 1.4 }} />

            <Typography variant="subtitle1" sx={{ fontWeight: 900, color: "rgba(255,255,255,0.92)" }}>
              1) Choisir le type d’entrée
            </Typography>

            <ToggleButtonGroup
              value={mode}
              exclusive
              onChange={(_, v) => v && setMode(v)}
              fullWidth
              sx={{
                "& .MuiToggleButton-root": {
                  borderColor: "rgba(255,255,255,0.18)",
                  textTransform: "none",
                  fontWeight: 900,
                  color: "rgba(255,255,255,0.9)"
                }
              }}
            >
              <ToggleButton value="patch">Patch (.npy)</ToggleButton>
              <ToggleButton value="bands">3 TIFF (B11/B12/B8A)</ToggleButton>
            </ToggleButtonGroup>

            <Divider sx={{ borderColor: "rgba(255,255,255,0.14)", my: 1.6 }} />

            {/* PATCH */}
            {mode === "patch" && (
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 900, mb: 1, color: "rgba(255,255,255,0.92)" }}>
                  2) Upload patch
                </Typography>

                <Button
                  component="label"
                  startIcon={<UploadFileIcon />}
                  variant="contained"
                  sx={{ py: 1.2, borderRadius: 3, fontWeight: 900 }}
                  fullWidth
                >
                  Upload patch .npy
                  <input hidden type="file" accept=".npy" onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) runPatch(f);
                  }} />
                </Button>

                <Typography variant="body2" sx={{ mt: 1, opacity: 0.9,  color: "rgba(207, 197, 197, 0.95)" }}>
                  Patch attendu: (H,W,3) normalisé [0..1]
                </Typography>
              </Box>
            )}

            {/* BANDS */}
            {mode === "bands" && (
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 900, mb: 1, color: "rgba(255,255,255,0.92)" }}>
                  2) Upload 3 bandes TIFF
                </Typography>

                <Stack spacing={1}>
                  <Button component="label" variant="outlined" startIcon={<UploadFileIcon />} fullWidth sx={{ borderRadius: 3, color: "white" }}>
                    Upload B11
                    <input hidden type="file" accept=".tif,.tiff" onChange={(e) => setB11(e.target.files?.[0] || null)} />
                  </Button>
                  {b11 && <Typography variant="caption" sx={{ opacity: 0.9, color: "rgba(207, 197, 197, 0.95)" }}>{b11.name}</Typography>}

                  <Button component="label" variant="outlined" startIcon={<UploadFileIcon />} fullWidth sx={{ borderRadius: 3, color: "white" }}>
                    Upload B12
                    <input hidden type="file" accept=".tif,.tiff" onChange={(e) => setB12(e.target.files?.[0] || null)} />
                  </Button>
                  {b12 && <Typography variant="caption" sx={{ opacity: 0.9, color: "rgba(207, 197, 197, 0.95)" }}>{b12.name}</Typography>}

                  <Button component="label" variant="outlined" startIcon={<UploadFileIcon />} fullWidth sx={{ borderRadius: 3, color: "white" }}>
                    Upload B8A
                    <input hidden type="file" accept=".tif,.tiff" onChange={(e) => setB8a(e.target.files?.[0] || null)} />
                  </Button>
                  {b8a && <Typography variant="caption" sx={{ opacity: 0.9, color: "rgba(207, 197, 197, 0.95)" }}>{b8a.name}</Typography>}

                  <Button
                    variant="contained"
                    startIcon={<InsightsIcon />}
                    disabled={!canRunBands || loading}
                    onClick={runBands}
                    sx={{ borderRadius: 3, py: 1.2, fontWeight: 900 }}
                    fullWidth
                  >
                    Lancer la prédiction FULL
                  </Button>
                </Stack>

                <Divider sx={{ borderColor: "rgba(255,255,255,0.14)", my: 1.6 }} />

                <Typography variant="subtitle1" sx={{ fontWeight: 900, color: "rgba(255,255,255,0.92)" }}>
                  Seuils pseudo-mask (NBR + B12)
                </Typography>

                <Typography variant="body2" sx={{ opacity: 0.9, mt: 1, color: "rgba(207, 197, 197, 0.95)" }}>
                  NBR végétation (≥): <b>{nbrVeg.toFixed(2)}</b>
                </Typography>
                <Slider value={nbrVeg} min={0} max={0.6} step={0.01} onChange={(_, v) => setNbrVeg(Array.isArray(v) ? v[0] : v)} />

                <Typography variant="body2" sx={{ opacity: 0.9, color: "rgba(207, 197, 197, 0.95)" }}>
                  NBR brûlé (≤): <b>{nbrBurn.toFixed(2)}</b>
                </Typography>
                <Slider value={nbrBurn} min={-0.3} max={0.3} step={0.01} onChange={(_, v) => setNbrBurn(Array.isArray(v) ? v[0] : v)} />

                <Typography variant="body2" sx={{ opacity: 0.9, color: "rgba(207, 197, 197, 0.95)" }}>
                  NBR feu (≤): <b>{nbrFire.toFixed(2)}</b>
                </Typography>
                <Slider value={nbrFire} min={-0.3} max={0.3} step={0.01} onChange={(_, v) => setNbrFire(Array.isArray(v) ? v[0] : v)} />

                <Typography variant="body2" sx={{ opacity: 0.9, color: "rgba(207, 197, 197, 0.95)" }}>
                  Quantile B12 (%): <b>{b12q.toFixed(1)}</b>
                </Typography>
                <Slider value={b12q} min={95} max={99.9} step={0.1} onChange={(_, v) => setB12q(Array.isArray(v) ? v[0] : v)} />

                <Divider sx={{ borderColor: "rgba(255,255,255,0.14)", my: 1.2 }} />

                <Typography variant="subtitle1" sx={{ fontWeight: 900, color: "rgba(255,255,255,0.92)" }}>
                  Prédiction (tiling)
                </Typography>

                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                  <TextField
                    label="Tile"
                    value={tile}
                    onChange={(e) => setTile(parseInt(e.target.value || "128", 10))}
                    size="small"
                    fullWidth
                    InputLabelProps={{ style: { color: "rgba(255,255,255,0.8)" } }}
                    InputProps={{ style: { color: "white" } }}
                  />
                  <TextField
                    label="Stride"
                    value={stride}
                    onChange={(e) => setStride(parseInt(e.target.value || "64", 10))}
                    size="small"
                    fullWidth
                    InputLabelProps={{ style: { color: "rgba(255,255,255,0.8)" } }}
                    InputProps={{ style: { color: "white" } }}
                  />
                </Stack>
              </Box>
            )}

            {loading && (
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 2 }}>
                <CircularProgress size={20} />
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Inference en cours…
                </Typography>
              </Stack>
            )}

            {err && <Alert severity="error" sx={{ mt: 2 }}>{err}</Alert>}
          </Stack>
        </Paper>

        {/* MAIN */}
        <Box sx={{ flex: 1, width: "100%" }}>
          <Stack spacing={2} sx={{ width: "100%" }}>

            <Paper sx={{ p: 2.5, borderRadius: 4, ...glass }}>
              <Typography variant="h4" sx={{ fontWeight: 900, color: "rgba(255,255,255,0.95)" }}>
                Détection Feu / Brûlé / Végétation
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9, mt: 0.5,  color: "rgba(207, 197, 197, 0.95)" }}>
                Démo end-user • Upload patch (.npy) ou 3 bandes Sentinel-2 (B11/B12/B8A)
              </Typography>
              <Box sx={{ mt: 1.2 }}>
                <Legend />
              </Box>
            </Paper>

            {/* PATCH RESULT */}
            {mode === "patch" && (
              <Card title="Résultat Patch" icon={<ImageIcon />}>
                <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                  <Box sx={{ flex: 1 }}>
                    <ImgPanel title="Image (patch)" b64={patchRes?.patch_png}>
                      {/* pas de download ici */}
                    </ImgPanel>
                  </Box>

                  <Box sx={{ flex: 1 }}>
                    <ImgPanel title="Prédiction (mask)" b64={patchRes?.pred_png}>
                      <Button
                        startIcon={<DownloadIcon />}
                        variant="outlined"
                        fullWidth
                        sx={{ color: "white", borderColor: "rgba(255,255,255,0.25)", fontWeight: 900 }}
                        onClick={() => downloadB64File(patchRes?.pred_png, "prediction_mask.png", "image/png")}
                        disabled={!patchRes?.pred_png}
                      >
                        Télécharger PNG
                      </Button>
                      <Button
                        startIcon={<DownloadIcon />}
                        variant="outlined"
                        fullWidth
                        sx={{ mt: 1, color: "white", borderColor: "rgba(255,255,255,0.25)", fontWeight: 900 }}
                        onClick={() => downloadB64File(patchRes?.pred_npy, "prediction_mask.npy")}
                        disabled={!patchRes?.pred_npy}
                      >
                        Télécharger NPY
                      </Button>
                    </ImgPanel>
                  </Box>

                  <Box sx={{ flex: 1 }}>
                    <ImgPanel title="Overlay" b64={patchRes?.overlay_png}>
                      <Button
                        startIcon={<DownloadIcon />}
                        variant="outlined"
                        fullWidth
                        sx={{ color: "white", borderColor: "rgba(255,255,255,0.25)", fontWeight: 900 }}
                        onClick={() => downloadB64File(patchRes?.overlay_png, "overlay.png", "image/png")}
                        disabled={!patchRes?.overlay_png}
                      >
                        Télécharger PNG
                      </Button>
                    </ImgPanel>
                  </Box>
                </Stack>
              </Card>
            )}

            {/* BANDS RESULT */}
            {mode === "bands" && (
              <Stack spacing={2}>
                <Card
                  title="Fusion + NBR + Pseudo-mask"
                  icon={<LayersIcon />}
                  right={
                    bandsRes?.meta?.b12_thr ? (
                      <Chip
                        label={`Seuil B12 ≈ ${bandsRes.meta.b12_thr.toFixed(4)}`}
                        variant="outlined"
                        sx={{ color: "white", borderColor: "rgba(255,255,255,0.25)" }}
                      />
                    ) : null
                  }
                >
                  <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                    <Box sx={{ flex: 1 }}>
                      <ImgPanel title="Fusion (RGB = B12,B11,B8A)" b64={bandsRes?.fusion_png}>
                        <Button
                          startIcon={<DownloadIcon />}
                          variant="outlined"
                          fullWidth
                          sx={{ color: "white", borderColor: "rgba(255,255,255,0.25)", fontWeight: 900 }}
                          onClick={() => downloadB64File(bandsRes?.fusion_png, "fusion_rgb.png", "image/png")}
                          disabled={!bandsRes?.fusion_png}
                        >
                          Télécharger PNG
                        </Button>
                      </ImgPanel>
                    </Box>

                    <Box sx={{ flex: 1 }}>
                      <ImgPanel title="NBR (colormap)" b64={bandsRes?.nbr_png}>
                        <Button
                          startIcon={<DownloadIcon />}
                          variant="outlined"
                          fullWidth
                          sx={{ color: "white", borderColor: "rgba(255,255,255,0.25)", fontWeight: 900 }}
                          onClick={() => downloadB64File(bandsRes?.nbr_png, "nbr.png", "image/png")}
                          disabled={!bandsRes?.nbr_png}
                        >
                          Télécharger PNG
                        </Button>
                      </ImgPanel>
                    </Box>

                    <Box sx={{ flex: 1 }}>
                      <ImgPanel title="Pseudo-mask (3 classes)" b64={bandsRes?.pseudo_png}>
                        <Button
                          startIcon={<DownloadIcon />}
                          variant="outlined"
                          fullWidth
                          sx={{ color: "white", borderColor: "rgba(255,255,255,0.25)", fontWeight: 900 }}
                          onClick={() => downloadB64File(bandsRes?.pseudo_png, "pseudo_mask.png", "image/png")}
                          disabled={!bandsRes?.pseudo_png}
                        >
                          Télécharger PNG
                        </Button>
                      </ImgPanel>
                    </Box>
                  </Stack>
                </Card>

                <Card title="Prédiction modèle sur TOUTE l'image (tiling)" icon={<InsightsIcon />}>
                  <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                    <Box sx={{ flex: 1 }}>
                      <ImgPanel title="Prediction (full)" b64={bandsRes?.pred_png}>
                        <Button
                          startIcon={<DownloadIcon />}
                          variant="outlined"
                          fullWidth
                          sx={{ color: "white", borderColor: "rgba(255,255,255,0.25)", fontWeight: 900 }}
                          onClick={() => downloadB64File(bandsRes?.pred_png, "prediction_full.png", "image/png")}
                          disabled={!bandsRes?.pred_png}
                        >
                          Télécharger PNG
                        </Button>
                        <Button
                          startIcon={<DownloadIcon />}
                          variant="outlined"
                          fullWidth
                          sx={{ mt: 1, color: "white", borderColor: "rgba(255,255,255,0.25)", fontWeight: 900 }}
                          onClick={() => downloadB64File(bandsRes?.pred_npy, "prediction_mask.npy")}
                          disabled={!bandsRes?.pred_npy}
                        >
                          Télécharger NPY
                        </Button>
                      </ImgPanel>
                    </Box>

                    <Box sx={{ flex: 1 }}>
                      <ImgPanel title="Overlay (full)" b64={bandsRes?.overlay_png}>
                        <Button
                          startIcon={<DownloadIcon />}
                          variant="outlined"
                          fullWidth
                          sx={{ color: "white", borderColor: "rgba(255,255,255,0.25)", fontWeight: 900 }}
                          onClick={() => downloadB64File(bandsRes?.overlay_png, "overlay_full.png", "image/png")}
                          disabled={!bandsRes?.overlay_png}
                        >
                          Télécharger PNG
                        </Button>
                      </ImgPanel>
                    </Box>
                  </Stack>
                </Card>
              </Stack>
            )}
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
}
