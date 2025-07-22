import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import mongoose from "mongoose";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import templateModel from "../../models/template.js";
import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import ImageModule from "docxtemplater-image-module-free";
import sizeOf from "image-size";
import libre from "libreoffice-convert";
import signatureModel from "../../models/signatures.js";
import { checkLoginStatus } from "../../middleware/checkAuth.js";
import { status } from "../../constants/index.js";

const router = Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads/signatures";
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const fileName = `${Date.now()}-${file.originalname}`;
    cb(null, fileName);
  },
});

const upload = multer({ storage });

// ✅ Upload Signature
router.post(
  "/:userId",
  checkLoginStatus,
  upload.single("sign"),
  async (req, res, next) => {
    try {
      const { userId } = req.params;
      const file = req.file;

      if (!file) return res.status(400).json({ message: "No file uploaded." });

      const url = `/uploads/signatures/${file.filename}`;

      const newSignature = await signatureModel.create({
        userId,
        url,
        status: status.active,
        createdBy: userId,
        updatedBy: userId,
      });

      res.status(201).json({
        message: "Signature uploaded successfully",
        data: [newSignature],
      });
    } catch (error) {
      next(error);
    }
  }
);

// ✅ Get All Signatures (for a specific user)
router.get("/:userId", checkLoginStatus, async (req, res) => {
  try {
    const { userId } = req.params;
    const signatures = await signatureModel
      .find({ userId })
      .sort({ createdAt: -1 });
    res.status(200).json(signatures);
  } catch (err) {
    console.error("Error fetching signatures:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});
router.delete("/:signatureId", checkLoginStatus, async (req, res, next) => {
  try {
    const { signatureId } = req.params;

    const deleted = await signatureModel.findByIdAndDelete(signatureId);

    if (!deleted) {
      return res.status(404).json({ message: "Signature not found" });
    }

    res.json({ message: "Signature deleted successfully" });
  } catch (error) {
    next(error);
  }
});

//sign krne ke liye abhi aise hi banaya
router.patch("/start-sign/:templateId", checkLoginStatus, async (req, res) => {
  const { templateId } = req.params;
  const { signatureId } = req.body;

  try {
    const template = await templateModel.findById(templateId);
    if (!template)
      return res.status(404).json({ message: "Template not found" });

    const signature = await signatureModel.findById(signatureId);
    if (!signature)
      return res.status(404).json({ message: "Signature not found" });

    // Set to in-process
    template.signStatus = 4;
    template.selectedSignature = signatureId;
    await template.save();

    // Send immediate response
    res.json({ message: "Signing started in background.", status: "inprocess" });

    // Background processing starts here (no await now)
    startSigningProcess(template, signature);
  } catch (err) {
    console.error("Signing error:", err);
    res.status(500).json({ message: "Server error during signing." });
  }
});

async function startSigningProcess(template, signature) {
  try {
    const signaturePath = path.join(
      signature.url.startsWith("/") ? signature.url.slice(1) : signature.url
    );

    const docsData = template.data || [];
    const signedDocsDir = path.join("uploads", "signed", template._id.toString());
    fs.mkdirSync(signedDocsDir, { recursive: true });

    for (let i = 0; i < docsData.length; i++) {
      const row = docsData[i];

      if (row.signStatus === 2) continue;

      const raw = Object.fromEntries(row.data);
      const renderData = {};
      for (const key in raw) {
        const spacedKey = key.replace(/([a-z])([A-Z])/g, "$1 $2");
        renderData[spacedKey] = raw[key];
      }
      renderData["image:Signature"] = path.resolve(signaturePath);

      const templatePath = path.join(
        __dirname,
        "../../..",
        template.url.startsWith("/") ? template.url.slice(1) : template.url
      );

      const content = fs.readFileSync(templatePath, "binary");
      const zip = new PizZip(content);

      const imageModule = new ImageModule({
        centered: false,
        getImage(tagValue) {
          const buffer = fs.readFileSync(tagValue);
          return buffer;
        },
        getSize() {
          return [120, 40];
        },
      });

      const doc = new Docxtemplater(zip, {
        modules: [imageModule],
        paragraphLoop: true,
        linebreaks: true,
        delimiters: { start: "{", end: "}" },
      });

      doc.render(renderData);
      const docxBuffer = doc.getZip().generate({ type: "nodebuffer" });

      const pdfBuffer = await convertDocxToPdf(docxBuffer);

      const pdfName = `${row._id}.pdf`;
      const pdfPath = path.join(signedDocsDir, pdfName);
      fs.writeFileSync(pdfPath, pdfBuffer);

      // Update row
      template.data[i].signStatus = 5;
      template.data[i].signedDate = new Date();
      template.data[i].url = `/signed/${template._id}/${pdfName}`;
    }

    // Save updated template
    template.signStatus = 5;
    template.signedDate = new Date();
    await template.save();

    console.log("All documents signed and saved.");
  } catch (error) {
    console.error("Background signing failed:", error);
    // Optional: set status back to failed or notify admin
  }
}




function convertDocxToPdf(docxBuffer) {
  return new Promise((resolve, reject) => {
    libre.convert(docxBuffer, ".pdf", undefined, (err, done) => {
      if (err) return reject(err);
      resolve(done);
    });
  });
}

export default router;
