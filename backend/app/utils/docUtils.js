import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import libre from "libreoffice-convert";

export async function generateDocxFromTemplate(templateBuffer, rowData) {
  const zip = new PizZip(templateBuffer);
  const doc = new Docxtemplater(zip, {
    delimiters: { start: "{", end: "}" },
  });

  const raw = Object.fromEntries(rowData);
  const renderData = {};

  for (const key in raw) {
    const spacedKey = key.replace(/([a-z])([A-Z])/g, "$1 $2");
    renderData[spacedKey] = raw[key];
  }

  doc.render(renderData);

  return doc.getZip().generate({
    type: "nodebuffer",
    compression: "DEFLATE",
  });
}

export function convertDocxToPdf(docxBuffer) {
  return new Promise((resolve, reject) => {
    libre.convert(docxBuffer, ".pdf", undefined, (err, done) => {
      if (err) return reject(err);
      resolve(done);
    });
  });
}
