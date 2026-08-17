const API = "http://127.0.0.1:5000";

export function b64pngToUrl(b64) {
  return `data:image/png;base64,${b64}`;
}

export function downloadB64File(b64, filename, mime = "application/octet-stream") {
  if (!b64) return;
  const byteChars = atob(b64);
  const byteNumbers = new Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) byteNumbers[i] = byteChars.charCodeAt(i);
  const blob = new Blob([new Uint8Array(byteNumbers)], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function predictPatch(file) {
  const form = new FormData();
  form.append("file", file); // IMPORTANT: must be "file"

  const r = await fetch(`${API}/predict/patch`, { method: "POST", body: form });
  const data = await r.json();
  if (!r.ok) throw new Error(data?.error || "Patch prediction failed");
  return data;
}

export async function predictBands({ b11, b12, b8a, nbr_veg, nbr_burn, nbr_fire, b12_q, tile, stride }) {
  const form = new FormData();
  form.append("b11", b11);
  form.append("b12", b12);
  form.append("b8a", b8a);

  form.append("nbr_veg", String(nbr_veg));
  form.append("nbr_burn", String(nbr_burn));
  form.append("nbr_fire", String(nbr_fire));
  form.append("b12_q", String(b12_q));
  form.append("tile", String(tile));
  form.append("stride", String(stride));

  const r = await fetch(`${API}/predict/bands`, { method: "POST", body: form });
  const data = await r.json();
  if (!r.ok) throw new Error(data?.error || "Bands prediction failed");
  return data;
}
