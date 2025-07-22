import { Router } from "express";
import multer from "multer";
import path from "path";
import templateModel from "../../models/template.js";
import { checkLoginStatus } from "../../middleware/checkAuth.js";
import ExcelJS from "exceljs";
import fs from "fs";
import mongoose from "mongoose";
import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
// import libre from "libreoffice-convert";
import archiver from "archiver";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { signStatus, status } from "../../constants/index.js";
import {
  generateDocxFromTemplate,
  convertDocxToPdf,
} from "../../utils/docUtils.js";

import { RequestCreationSchema } from "../../schema/template.js"; // you can rename this file later

const router = Router();

const fileFilter = (req, file, cb) => {
  console.log(`Received file: ${file.originalname}, field: ${file.fieldname}`);
  const ext = path.extname(file.originalname).toLowerCase();

  if (file.fieldname === "file") {
    if (ext === ".pdf" || ext === ".docx") {
      cb(null, true);
    } else {
      cb(new Error('Only .pdf and .docx files are allowed for "file" field'));
    }
  } else if (file.fieldname === "excel") {
    if (ext === ".xlsx" || ext === ".xls" || ext === ".csv") {
      cb(null, true);
    } else {
      cb(
        new Error(
          'Only Excel files (.xlsx, .xls, .csv) are allowed for "excel" field'
        )
      );
    }
  } else {
    cb(new Error(`Unsupported field: ${file.fieldname}`));
  }
};
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const fileName = `${Date.now()}-${file.originalname}`; // Using timestamp to avoid name collisions
    cb(null, fileName);
  },
});

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
});

router.post(
  "/:id/upload-excel",
  checkLoginStatus,
  upload.single("excel"),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const filePath = req.file.path;

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);
      const worksheet = workbook.worksheets[0];
      const headerRow = worksheet.getRow(1).values.slice(1); // first row headers

      const dataRows = [];
      const skippedRows = [];

      worksheet.eachRow((row, rowIndex) => {
        if (rowIndex === 1) return; // Skip header

        const rowValues = row.values.slice(1); // skip index 0
        const rowObject = {};
        let notValid = false;

        headerRow.forEach((header, i) => {
          rowObject[header] = rowValues[i] ? String(rowValues[i]) : "";
        });
        notValid = Object.values(rowObject).some((val) => val.trim() === "");
        if (!notValid) {
          dataRows.push({
            id: new mongoose.Types.ObjectId(),
            data: rowObject,
            signStatus: 0, // assuming unsigned
          });
        } else {
          skippedRows.push(rowIndex);
        }
      });

      const docCount = dataRows.length;

      // Update the document in DB
      const updatedTemplate = await templateModel.findByIdAndUpdate(
        id,
        {
          $set: {
            data: dataRows,
            docCount: docCount,
          },
        },
        { new: true }
      );

      if (!updatedTemplate) {
        return res.status(404).json({ message: "Template not found" });
      }

      res.status(200).json({
        message: "Excel uploaded and data stored successfully",
        data: dataRows,
        docCount,
        skippedRows,
      });
    } catch (error) {
      console.error("Error processing Excel upload:", error);
      next(error);
    }
  }
);

router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const template = await templateModel.findOne({
      _id: id,
      status: { $ne: 0 },
    });

    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }

    res.json(template);
  } catch (error) {
    console.error("Error fetching template by ID:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/:templateId/row/:rowId", checkLoginStatus, async (req, res) => {
  const { templateId, rowId } = req.params;
  console.log("request aa gyi");
  console.log(`ye rhai temp id ${templateId} or row id ${rowId}`);

  try {
    const template = await templateModel.findById(templateId);

    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }
    console.log(template);

    // Filter out the row
    const newData = template.data.filter((row) => row._id.toString() !== rowId);

    template.set("data", newData); // Explicitly set
    template.markModified("data"); // Tell Mongoose this is modified
    template.docCount = newData.length;

    await template.save();

    res.status(200).json({
      message: "Row deleted successfully",
      updatedTemplate: template,
    });
  } catch (error) {
    console.error("Error deleting row:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post(
  "/",
  upload.single("file"),
  checkLoginStatus,
  async (req, res, next) => {
    try {
      console.log("Request aayi to hai yahan...back par");
      const { title, officerId = null } = req.body;
      console.log(req.body);
      console.log(`Title on back is: ${title}`);
      console.log(`Officer Id on back is: ${officerId}`);
      console.log(req.file);

      if (!title || !req.file) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);

      const filePath = path.join(__dirname, "../../..", req.file.path);
      const content = fs.readFileSync(filePath, "binary");
      const zip = new PizZip(content);

      const doc = new Docxtemplater(zip, {
        delimiters: { start: "{", end: "}" }, //  match your current template
      });

      doc.compile();
      const fullText = doc.getFullText();

      const variableMatches = fullText.match(/{([^{}]+)}/g) || [];

      const uniqueVariables = [
        ...new Set(
          variableMatches.map(
            (tag) => tag.replace(/[{}]/g, "").replace(/\s+/g, "") // remove `{}`, and internal spaces
          )
        ),
      ];

      const templateVariables = uniqueVariables.map((tag) => ({
        name: tag,
        required: true,
        showExcel: true,
      }));

      console.log("Extracted template variables:", templateVariables);

      // Parse and validate templateVariables
      try {
        console.log(req.session);
        // Apply Zod validation
        RequestCreationSchema.parse({
          url: `${req.file.path}`,
          description: "Generated by user input",
          templateName: title,
          templateVariables: templateVariables,
          createdBy: req.session.userId,
          updatedBy: req.session.userId,
          assignedTo: officerId || null,
        });
      } catch (e) {
        console.error("Zod validation error:", e);
        return res.status(400).json({
          message: "Invalid request format or validation failed",
          error: e.errors || e.message,
        });
      }

      const template = await templateModel.create({
        url: `/uploads/${req.file.filename}`,
        description: "Generated by user input",
        templateName: title,
        templateVariables: templateVariables,
        createdBy: req.session.userId,
        updatedBy: req.session.userId,
        assignedTo: officerId,
      });

      res.status(201).json(template);
    } catch (error) {
      next(error);
    }
  }
);

//officer assign krne vala route
router.patch("/:id/assign", checkLoginStatus, async (req, res) => {
  const { id } = req.params;
  const { officerId } = req.body;

  if (!officerId) {
    return res.status(400).json({ message: "Officer ID is required" });
  }

  try {
    const template = await templateModel.findByIdAndUpdate(
      id,
      { assignedTo: officerId, signStatus: 1 },
      { new: true }
    );

    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }

    res
      .status(200)
      .json({ message: "Officer assigned successfully", template });
  } catch (err) {
    console.error("Error assigning officer:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET all signature requests
router.get("/", checkLoginStatus, async (req, res, next) => {
  try {
    const templates = await templateModel
      .find({ createdBy: req.session.userId, status: { $ne: 0 } })
      .sort({ createdAt: -1 }); // latest first

    res.status(200).json(templates);
  } catch (error) {
    next(error);
  }
});

router.get("/officer/:id", checkLoginStatus, async (req, res, next) => {
  try {
    const officerId = req.params.id;
    console.log("Request aagi");
    console.log("officer id: ", officerId);
    // const templates = await templateModel
    //   .find({ assignedTo: officerId, status: { $ne: 0 } })
    //   .sort({ createdAt: -1 }); // latest first
    
    const templates = await templateModel.find({
      status: { $ne: 0 },
      $or: [
        { assignedTo: officerId },
        { delegatedTo: officerId }
      ],
    }).sort({ createdAt: -1 });
    res.status(200).json(templates);
  } catch (error) {
    next(error);
  }
});

router.get("/:templateId/preview/:rowId", async (req, res) => {
  const { templateId, rowId } = req.params;

  try {
    const template = await templateModel.findById(templateId);
    if (!template) return res.status(404).json({ error: "Template not found" });

    const row = template.data.find((row) => row._id.toString() === rowId);
    if (!row) return res.status(404).json({ error: "Row not found" });

    const previewDir = path.join(__dirname, "../../../previews");
    const previewPath = path.join(previewDir, `${templateId}-${rowId}.pdf`);

    // If already exists, just send URL
    if (fs.existsSync(previewPath)) {
      return res.json({
        pdfUrl: `http://localhost:3000/previews/${templateId}-${rowId}.pdf`,
      });
    }

    // Prepare paths
    const docxPath = path.join(__dirname, "../../..", template.url);
    const docxBuffer = fs.readFileSync(docxPath);

    // Generate filled docx and convert to pdf
    const filledDocx = await generateDocxFromTemplate(docxBuffer, row.data);
    const pdfBuffer = await convertDocxToPdf(filledDocx);

    fs.mkdirSync(previewDir, { recursive: true });
    fs.writeFileSync(previewPath, pdfBuffer);

    res.json({
      pdfUrl: `http://localhost:3000/previews/${templateId}-${rowId}.pdf`,
    });
  } catch (err) {
    console.error("Error previewing document:", err);
    res.status(500).json({ error: "Server error during preview" });
  }
});

router.get("/:id/excel-template", async (req, res) => {
  try {
    const templateId = req.params.id;
    const template = await templateModel.findOne({
      _id: templateId,
      status: { $ne: 0 },
    });

    if (!template) {
      return res.status(404).json({ error: "Template not found" });
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Template");

    // Extract templateVariables and use names as headers
    const headers = template.templateVariables
      .filter((v) => !["Signature", "QRCode"].includes(v.name))
      .map((v) => v.name);

    worksheet.addRow(headers); // First row as header

    // Set response headers
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", "attachment; filename=template.xlsx");

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error generating Excel template:", error);
    res.status(500).json({ error: "Server error while generating template" });
  }
});

router.get("/preview/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const template = await templateModel.findById(id);
    if (!template || !template.url) {
      return res.status(404).json({ error: "Preview not available" });
    }

    const previewDir = path.join(__dirname, "../../../previews");
    const previewPath = path.join(previewDir, `template-preview-${id}.pdf`);

    //  Step 1: Agar already cached PDF hai, use wahi bhej do
    if (fs.existsSync(previewPath)) {
      const cachedPdfBuffer = fs.readFileSync(previewPath);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", "inline; filename=preview.pdf");
      return res.send(cachedPdfBuffer);
    }

    // Step 2: Agar cached version nahi mila to naye se banao
    const docxFilePath = path.join(__dirname, "../../..", template.url);
    if (!fs.existsSync(docxFilePath)) {
      return res.status(404).json({ error: "Template file not found" });
    }

    const docxBuffer = fs.readFileSync(docxFilePath);
    const pdfBuffer = await convertDocxToPdf(docxBuffer);

    //  Step 3: Save the PDF to previews directory
    fs.mkdirSync(previewDir, { recursive: true });
    fs.writeFileSync(previewPath, pdfBuffer);

    // Step 4: Send the buffer
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline; filename=preview.pdf");
    res.send(pdfBuffer);
  } catch (error) {
    console.error("Error generating PDF preview:", error);
    res.status(500).json({ error: "Failed to generate PDF preview" });
  }
});

//reject ke liye
router.patch("/:id/reject", checkLoginStatus, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const template = await templateModel.findById(id);
    if (!template)
      return res.status(404).json({ message: "Template not found" });

    // Reject all rows
    template.data = template.data.map((row) => ({
      ...row,
      signStatus: signStatus.rejected,
      rejectionReason: reason,
    }));

    // Update top-level fields
    template.signStatus = signStatus.rejected;
    template.rejectionReason = reason;
    template.rejectedDocs = template.data.length;

    await template.save();

    res.json({
      message: "Request rejected successfully",
      rejectedCount: template.data.length,
    });
  } catch (err) {
    console.error("Error rejecting template:", err);
    res.status(500).json({ message: "Server error" });
  }
});
//single row reject ke liye
router.patch(
  "/:templateId/row/:rowId/reject",
  checkLoginStatus,
  async (req, res) => {
    try {
      const { templateId, rowId } = req.params;
      const { reason } = req.body;

      const template = await templateModel.findById(templateId);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }

      let rowFound = false;
      let alreadySigned = false;

      template.data = template.data.map((row) => {
        if (String(row._id) === String(rowId)) {
          rowFound = true;

          if (row.signStatus === 5) {
            alreadySigned = true;
          }

          return {
            ...row,
            signStatus: 2, // Rejected
            rejectionReason: reason || "Rejected by officer",
          };
        }
        return row;
      });

      if (!rowFound) {
        return res.status(404).json({ message: "Row not found in template" });
      }

      if (alreadySigned) {
        return res
          .status(400)
          .json({ message: "Cannot reject signed document" });
      }

      // Update rejected count
      template.rejectedDocs = template.data.filter(
        (r) => r.signStatus === 2
      ).length;

      await template.save();

      res.json({
        message: "Row rejected successfully",
        rejectedDocs: template.rejectedDocs,
      });
    } catch (err) {
      console.error("Error rejecting row:", err);
      res.status(500).json({ message: "Server error during row rejection" });
    }
  }
);

//ye clone krne ke liye api
router.post("/:id/clone", checkLoginStatus, async (req, res) => {
  const { id } = req.params;

  try {
    const original = await templateModel.findById(id);

    if (!original) {
      return res.status(404).json({ message: "Original template not found" });
    }

    const clonedTemplate = await templateModel.create({
      url: original.url,
      description: "Cloned from template " + original.templateName,
      templateName: original.templateName + " (Clone)",
      templateVariables: original.templateVariables,
      createdBy: req.session.userId,
      updatedBy: req.session.userId,
      assignedTo: null,
      data: [],
      docCount: 0,
      signStatus: 0,
      rejectedDocs: 0,
    });

    res.status(201).json({
      message: "Template cloned successfully",
      template: clonedTemplate,
    });
  } catch (error) {
    console.error("Clone error:", error);
    res.status(500).json({ message: "Failed to clone template" });
  }
});

//puri request delete krne ke liye
router.patch("/:id/delete", checkLoginStatus, async (req, res) => {
  try {
    const { id } = req.params;

    const template = await templateModel.findByIdAndUpdate(
      id,
      { status: status.deleted },
      { new: true }
    );

    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }

    res.status(200).json({ message: "Request marked as deleted", template });
  } catch (error) {
    console.error("Error deleting template:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

//ek document reject krne ke liye
router.patch(
  "/:templateId/row/:rowId/reject",
  checkLoginStatus,
  async (req, res) => {
    const { templateId, rowId } = req.params;
    const { reason } = req.body;

    try {
      const template = await templateModel.findById(templateId);
      if (!template)
        return res.status(404).json({ message: "Template not found" });

      const row = template.data.find((row) => row._id.toString() === rowId);
      if (!row) return res.status(404).json({ message: "Row not found" });

      row.signStatus = 2; // Rejected
      row.rejectionReason = reason || "Rejected by officer";

      template.rejectedDocs += 1;

      await template.save();
      return res
        .status(200)
        .json({ message: "Row rejected successfully", updatedRow: row });
    } catch (error) {
      console.error("Error rejecting row:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

//download ke liye
router.get(
  "/:templateId/row/:rowId/download",
  checkLoginStatus,
  async (req, res) => {
    const { templateId, rowId } = req.params;

    try {
      // Construct path: /uploads/signed/:templateId/:rowId.docx
      const filePath = path.join(
        __dirname,
        "../../../uploads/signed",
        templateId,
        `${rowId}.pdf`
      );
      console.log("file path ye aaya hai: ", filePath);

      // Check if the file exists
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: "Signed document not found" });
      }

      // Trigger file download
      res.download(filePath, `signed_${rowId}.docx`);
    } catch (err) {
      console.error("Download error:", err);
      res.status(500).json({ message: "Server error while downloading file" });
    }
  }
);

router.get("/:createdBy/download-all", checkLoginStatus, async (req, res) => {
  const { createdBy } = req.params;

  try {
    // Step 1: Find the latest signed template created by this user
    const template = await templateModel
      .findOne({
        createdBy,
        signStatus: 5, // Only fully signed templates
      })
      .sort({ createdAt: -1 });

    if (!template) {
      return res
        .status(404)
        .json({ message: "No signed templates found for this user." });
    }

    const templateId = template._id.toString(); // Actual MongoDB template ID
    const signedDir = path.join(
      __dirname,
      "../../../uploads/signed",
      templateId
    );

    if (!fs.existsSync(signedDir)) {
      return res
        .status(404)
        .json({ message: "Signed folder not found for this template" });
    }

    const files = fs
      .readdirSync(signedDir)
      .filter((file) => file.endsWith(".pdf"));

    if (files.length === 0) {
      return res
        .status(404)
        .json({ message: "No signed PDF documents found." });
    }

    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=signed_documents_${templateId}.zip`
    );

    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.pipe(res);

    for (const file of files) {
      const filePath = path.join(signedDir, file);
      archive.file(filePath, { name: file });
    }

    archive.finalize();
  } catch (err) {
    console.error("Error zipping signed documents:", err);
    res.status(500).json({ message: "Error preparing ZIP" });
  }
});

router.patch("/:templateId/delegate", checkLoginStatus, async (req, res) => {
  const { templateId } = req.params;
  const { delegateId } = req.body;

  try {
    const template = await templateModel.findById(templateId);
    if (!template)
      return res.status(404).json({ message: "Template not found" });

     template.delegatedTo = delegateId;
    template.signStatus = 3; // delegated
    await template.save();

    res.json({ message: "Template delegated successfully", template });
  } catch (err) {
    console.error("Delegate error:", err);
    res.status(500).json({ message: "Server error during delegation" });
  }
});

export default router;
