import jsPDF from "jspdf";

export const exportDiagnosisPDF = (result, preview, lang) => {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210; // A4 width in mm
  const margin = 15;
  let y = 20;

  // ── Helper functions ───────────────────────────────────────────────────
  const addText = (text, x, size = 11, style = "normal", color = [30, 80, 40]) => {
    doc.setFontSize(size);
    doc.setFont("helvetica", style);
    doc.setTextColor(...color);
    doc.text(text, x, y);
  };

  const addLine = (color = [74, 222, 128]) => {
    doc.setDrawColor(...color);
    doc.setLineWidth(0.4);
    doc.line(margin, y, W - margin, y);
    y += 6;
  };

  const addSection = (title) => {
    y += 4;
    doc.setFillColor(22, 101, 52);
    doc.roundedRect(margin, y - 5, W - margin * 2, 10, 2, 2, "F");
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text(title, margin + 4, y + 2);
    y += 10;
  };

  const addBullet = (text, indent = margin + 4) => {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(40, 40, 40);
    const lines = doc.splitTextToSize(`• ${text}`, W - indent - margin);
    lines.forEach(line => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.text(line, indent, y);
      y += 6;
    });
  };

  const addWrappedText = (text, indent = margin, size = 10) => {
    doc.setFontSize(size);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(40, 40, 40);
    const lines = doc.splitTextToSize(text, W - indent - margin);
    lines.forEach(line => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.text(line, indent, y);
      y += 6;
    });
  };

  // ── HEADER ─────────────────────────────────────────────────────────────
  doc.setFillColor(5, 46, 22);
  doc.rect(0, 0, W, 30, "F");

  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(74, 222, 128);
  doc.text("LeafDoc AI", margin, 14);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(167, 243, 208);
  doc.text("AI-Powered Plant Disease Detection Report", margin, 21);

  doc.setFontSize(9);
  doc.setTextColor(110, 231, 183);
  const dateStr = new Date().toLocaleString("en-IN", {
    dateStyle: "medium", timeStyle: "short"
  });
  doc.text(`Generated: ${dateStr}`, W - margin, 21, { align: "right" });

  y = 38;

  // ── LEAF IMAGE ─────────────────────────────────────────────────────────
  if (preview) {
    try {
      const imgW = 60;
      const imgH = 50;
      const imgX = W - margin - imgW;
      doc.addImage(preview, "JPEG", imgX, y - 5, imgW, imgH);
      doc.setDrawColor(74, 222, 128);
      doc.setLineWidth(0.5);
      doc.roundedRect(imgX, y - 5, imgW, imgH, 2, 2);
    } catch (e) {
      console.log("Image add failed:", e);
    }
  }

  // ── DIAGNOSIS SECTION ──────────────────────────────────────────────────
  addSection("🔬 PRIMARY DIAGNOSIS");

  const disease = result.diagnosis.top_prediction.display_name;
  const conf    = result.diagnosis.top_prediction.confidence;
  const sev     = result.disease_info.severity;

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(22, 101, 52);
  doc.text(disease, margin, y);
  y += 8;

  // Confidence bar
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(40, 40, 40);
  doc.text(`Confidence: ${conf}%`, margin, y);

  const barX = margin + 35;
  const barW = 80;
  const barH = 4;
  doc.setFillColor(220, 220, 220);
  doc.roundedRect(barX, y - 3.5, barW, barH, 1, 1, "F");
  const fillColor = conf > 80 ? [22, 163, 74] : conf > 60 ? [234, 179, 8] : [220, 38, 38];
  doc.setFillColor(...fillColor);
  doc.roundedRect(barX, y - 3.5, (barW * conf) / 100, barH, 1, 1, "F");
  y += 8;

  // Severity badge
  const sevColors = {
    None: [22, 163, 74], Low: [234, 179, 8],
    Medium: [234, 88, 12], High: [220, 38, 38], Unknown: [107, 114, 128]
  };
  const sevColor = sevColors[sev] || sevColors.Unknown;
  doc.setFillColor(...sevColor);
  doc.roundedRect(margin, y - 4, 35, 7, 2, 2, "F");
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text(`Severity: ${sev}`, margin + 2, y + 0.5);
  y += 12;

  // ── DESCRIPTION ────────────────────────────────────────────────────────
  addSection("📋 ABOUT THIS DISEASE");
  addWrappedText(result.disease_info.description || "No description available.");
  y += 2;

  // ── SYMPTOMS ───────────────────────────────────────────────────────────
  if (result.disease_info.symptoms?.length > 0) {
    addSection("🔍 SYMPTOMS");
    result.disease_info.symptoms.forEach(s => addBullet(s));
    y += 2;
  }

  // ── CAUSES ─────────────────────────────────────────────────────────────
  addSection("🧫 CAUSES");
  addWrappedText(result.disease_info.causes || "Not available.");
  y += 2;

  // ── ORGANIC TREATMENT ──────────────────────────────────────────────────
  if (result.disease_info.organic_treatment?.length > 0) {
    addSection("🌿 ORGANIC TREATMENT");
    result.disease_info.organic_treatment.forEach(t => addBullet(t));
    y += 2;
  }

  // ── CHEMICAL TREATMENT ─────────────────────────────────────────────────
  if (result.disease_info.chemical_treatment?.length > 0) {
    addSection("⚗️ CHEMICAL TREATMENT");
    result.disease_info.chemical_treatment.forEach(t => addBullet(t));
    y += 2;
  }

  // ── PREVENTION ─────────────────────────────────────────────────────────
  if (result.disease_info.prevention?.length > 0) {
    addSection("🛡️ PREVENTION");
    result.disease_info.prevention.forEach(t => addBullet(t));
    y += 2;
  }

  // ── OTHER POSSIBILITIES ────────────────────────────────────────────────
  if (result.diagnosis.all_predictions?.length > 1) {
    addSection("📊 OTHER POSSIBILITIES");
    result.diagnosis.all_predictions.slice(1).forEach(p => {
      addBullet(`${p.display_name} — ${p.confidence}%`);
    });
    y += 2;
  }

  // ── FOOTER ─────────────────────────────────────────────────────────────
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFillColor(5, 46, 22);
    doc.rect(0, 285, W, 12, "F");
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(110, 231, 183);
    doc.text(
      "⚠️ This is an AI-based preliminary diagnosis. Consult a certified agricultural expert for high-value crops.",
      margin, 291
    );
    doc.setTextColor(74, 222, 128);
    doc.text(
      `LeafDoc AI | DTI Project | Bennett University 2026 | Page ${i}/${pageCount}`,
      W - margin, 291, { align: "right" }
    );
  }

  // ── SAVE ───────────────────────────────────────────────────────────────
  const fileName = `LeafDoc_${disease.replace(/[^a-zA-Z0-9]/g, "_")}_${Date.now()}.pdf`;
  doc.save(fileName);
  return fileName;
};