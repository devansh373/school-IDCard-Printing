// // src/services/idCardRenderer.ts
// import { CanvasRenderingContext2D, createCanvas, loadImage } from "canvas";
// import fetch from "node-fetch";
// // import { imagekit } from "../utils/imagekit";
// import path from "path";
// import { imagekit } from "../config/imagekit.js";

// interface StudentCardData {
//   name: string;
//   className: string;
//   sectionName: string;
//   photoUrl: string;
// }

// export async function generateIdCardPreview(
//   data: StudentCardData
// ): Promise<string> {

//   // 1. Create canvas
// //   const width = 1000;
// //   const height = 600;
// //   const canvas = createCanvas(width, height);
// //   const ctx = canvas.getContext("2d");

// const width = 600;
// const height = 1000;
// const canvas = createCanvas(width, height);
// const ctx = canvas.getContext("2d");

// // Optional: background color
// ctx.fillStyle = "#ffffff";
// ctx.fillRect(0, 0, width, height);

//   // 2. Draw background
//   const bgPath = path.join(process.cwd(), "src/templates/id-card-bg.png");
//   const bgImage = await loadImage(bgPath);
//   ctx.drawImage(bgImage, 0, 0, width, height);

//   // 3. Load student photo
//   const photoResponse = await fetch(data.photoUrl);
//   const photoBuffer = Buffer.from(await photoResponse.arrayBuffer());
//   const photoImage = await loadImage(photoBuffer);

// //   // 4. Draw photo
// //   ctx.drawImage(photoImage, 60, 120, 220, 260);

// // PHOTO FRAME SETTINGS
// // const photoX = 60;
// // const photoY = 120;
// // const photoW = 220;
// // const photoH = 260;

// const photoX = (width - 220) / 2; // center horizontally
// const photoY = 120;
// const photoW = 220;
// const photoH = 260;
// const radius = 16;

// // Helper: rounded rectangle path
// function roundedRect(
//   ctx: CanvasRenderingContext2D,
//   x: number,
//   y: number,
//   w: number,
//   h: number,
//   r: number
// ) {
//   ctx.beginPath();
//   ctx.moveTo(x + r, y);
//   ctx.lineTo(x + w - r, y);
//   ctx.quadraticCurveTo(x + w, y, x + w, y + r);
//   ctx.lineTo(x + w, y + h - r);
//   ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
//   ctx.lineTo(x + r, y + h);
//   ctx.quadraticCurveTo(x, y + h, x, y + h - r);
//   ctx.lineTo(x, y + r);
//   ctx.quadraticCurveTo(x, y, x + r, y);
//   ctx.closePath();
// }

// // 1️⃣ Clip photo area
// ctx.save();
// roundedRect(ctx, photoX, photoY, photoW, photoH, radius);
// ctx.clip();

// // 2️⃣ Draw image inside clipped area
// ctx.drawImage(photoImage, photoX, photoY, photoW, photoH);

// // 3️⃣ Restore canvas
// ctx.restore();

// // 4️⃣ Draw border
// ctx.strokeStyle = "#cccccc";
// ctx.lineWidth = 2;
// roundedRect(ctx, photoX, photoY, photoW, photoH, radius);
// ctx.stroke();

// //   // 5. Draw text
// //   ctx.fillStyle = "#000";
// //   ctx.font = "bold 32px Arial";
// //   ctx.fillText(data.name, 320, 160);

// //   ctx.font = "24px Arial";
// //   ctx.fillText(`Class: ${data.className}`, 320, 210);
// //   ctx.fillText(`Section: ${data.sectionName}`, 320, 250);

// ctx.fillStyle = "#000";
// ctx.textAlign = "center";

// ctx.font = "bold 32px Arial";
// ctx.fillText(data.name, width / 2, 430);

// ctx.font = "24px Arial";
// ctx.fillText(`Class: ${data.className}`, width / 2, 480);
// ctx.fillText(`Section: ${data.sectionName}`, width / 2, 520);

//   // 6. Convert to buffer
//   const imageBuffer = canvas.toBuffer("image/png");

//   // 7. Upload to ImageKit
//   const upload = await imagekit.upload({
//     file: imageBuffer,
//     fileName: `id-card-preview-${Date.now()}.png`,
//     folder: "/id-card-previews"
//   });

//   return upload.url;
// }

// src/services/idCardRenderer.ts
// import { CanvasRenderingContext2D, createCanvas, loadImage } from "canvas";
// import fetch from "node-fetch";
// import path from "path";
// import { imagekit } from "../config/imagekit.js";

// interface StudentCardData {
//   name: string;
//   className: string;
//   sectionName: string;
//   photoUrl: string;
// }

// export async function generateIdCardPreview(
//   data: StudentCardData
// ): Promise<string> {

//   /* ======================
//      CANVAS SETUP
//   ======================= */
//   const width = 600;
//   const height = 1000;
//   const canvas = createCanvas(width, height);
//   const ctx = canvas.getContext("2d");

//   // White background
//   ctx.fillStyle = "#ffffff";
//   ctx.fillRect(0, 0, width, height);

//   /* ======================
//      BACKGROUND TEMPLATE
//   ======================= */
//   const bgPath = path.join(process.cwd(), "src/templates/id-card-bg.png");
//   const bgImage = await loadImage(bgPath);
//   ctx.drawImage(bgImage, 0, 0, width, height);

//   /* ======================
//      LOAD PHOTO
//   ======================= */
//   const photoResponse = await fetch(data.photoUrl);
//   const photoBuffer = Buffer.from(await photoResponse.arrayBuffer());
//   const photoImage = await loadImage(photoBuffer);

//   /* ======================
//      PHOTO FRAME
//   ======================= */
//   const photoW = 220;
//   const photoH = 260;
//   const photoX = (width - photoW) / 2;
//   const photoY = 120;
//   const radius = 16;

//   function roundedRect(
//     ctx: CanvasRenderingContext2D,
//     x: number,
//     y: number,
//     w: number,
//     h: number,
//     r: number
//   ) {
//     ctx.beginPath();
//     ctx.moveTo(x + r, y);
//     ctx.lineTo(x + w - r, y);
//     ctx.quadraticCurveTo(x + w, y, x + w, y + r);
//     ctx.lineTo(x + w, y + h - r);
//     ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
//     ctx.lineTo(x + r, y + h);
//     ctx.quadraticCurveTo(x, y + h, x, y + h - r);
//     ctx.lineTo(x, y + r);
//     ctx.quadraticCurveTo(x, y, x + r, y);
//     ctx.closePath();
//   }

//   // Clip + draw photo
//   ctx.save();
//   roundedRect(ctx, photoX, photoY, photoW, photoH, radius);
//   ctx.clip();
//   ctx.drawImage(photoImage, photoX, photoY, photoW, photoH);
//   ctx.restore();

//   // Photo border
//   ctx.strokeStyle = "#cccccc";
//   ctx.lineWidth = 2;
//   roundedRect(ctx, photoX, photoY, photoW, photoH, radius);
//   ctx.stroke();

//   /* ======================
//      NAME + CLASS (CENTER)
//   ======================= */
//   ctx.fillStyle = "#000";
//   ctx.textAlign = "center";

//   ctx.font = "bold 32px Arial";
//   ctx.fillText(data.name, width / 2, 430);

//   ctx.font = "24px Arial";
//   ctx.fillText(`Class: ${data.className}`, width / 2, 480);
//   ctx.fillText(`Section: ${data.sectionName}`, width / 2, 520);

//   /* ======================
//      DETAILS SECTION (NEW)
//   ======================= */

//   const leftMargin = 60;
//   const labelX = leftMargin;
//   const valueX = leftMargin + 180;
//   const rowHeight = 38;
//   const detailsStartY = 600;

//   ctx.textAlign = "left";
//   ctx.font = "20px Arial";

//   function drawDetailRow(
//     label: string,
//     value: string,
//     rowIndex: number
//   ) {
//     const y = detailsStartY + rowIndex * rowHeight;

//     if (label) {
//       ctx.fillText(label, labelX, y);
//     }
//     ctx.fillText(value, valueX, y);
//   }

//   let row = 0;

//   drawDetailRow("Father Name", "Mr. Pravin Patil", row++);
//   drawDetailRow("DOB", "10.07.2005", row++);
//   drawDetailRow("Address", "Shreeram apt 1107", row++);
//   drawDetailRow("", "Shivajinagar", row++); // wrapped line
//   drawDetailRow("Mobile", "1234567890", row++);
//   drawDetailRow("Blood Group", "B +ve", row++);

//   /* ======================
//      EXPORT & UPLOAD
//   ======================= */
//   const imageBuffer = canvas.toBuffer("image/png");

//   const upload = await imagekit.upload({
//     file: imageBuffer,
//     fileName: `id-card-preview-${Date.now()}.png`,
//     folder: "/id-card-previews"
//   });

//   return upload.url;
// }

import { createCanvas, loadImage, CanvasRenderingContext2D } from "canvas";
import fetch from "node-fetch";
import path from "path";

export interface StudentCardData {
  name: string;
  className: string;
  sectionName: string;
  fatherName: string;
  dob: string;
  address: string;
  mobile: string;
  bloodGroup: string;
  photoUrl: string;
  rollNo?: string;
  houseName?: string;
  schoolAddress?: string;
  schoolContact?: string;
}

// const WIDTH = 1016;
// const HEIGHT = 638;

// /**
//  * Draw rounded rectangle path
//  */
// function roundedRect(
//   ctx: CanvasRenderingContext2D,
//   x: number,
//   y: number,
//   w: number,
//   h: number,
//   r: number
// ) {
//   ctx.beginPath();
//   ctx.moveTo(x + r, y);
//   ctx.lineTo(x + w - r, y);
//   ctx.quadraticCurveTo(x + w, y, x + w, y + r);
//   ctx.lineTo(x + w, y + h - r);
//   ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
//   ctx.lineTo(x + r, y + h);
//   ctx.quadraticCurveTo(x, y + h, x, y + h - r);
//   ctx.lineTo(x, y + r);
//   ctx.quadraticCurveTo(x, y, x + r, y);
//   ctx.closePath();
// }

// /**
//  * MAIN CARD RENDER FUNCTION
//  */
// export async function renderIdCardCanvas(data: StudentCardData) {

//   const canvas = createCanvas(WIDTH, HEIGHT);
//   const ctx = canvas.getContext("2d");

//   /* ================= BACKGROUND ================= */
//   const bgPath = path.join(process.cwd(), "src/templates/id-card-bg.png");
//   const bg = await loadImage(bgPath);
//   ctx.drawImage(bg, 0, 0, WIDTH, HEIGHT);

//   /* ================= PHOTO ================= */
//   const photoRes = await fetch(data.photoUrl);
//   const photoBuffer = Buffer.from(await photoRes.arrayBuffer());
//   const photo = await loadImage(photoBuffer);

//   const PHOTO = {
//     x: 378,
//     y: 140,
//     w: 260,
//     h: 300,
//     r: 20,
//   };

//   ctx.save();
//   roundedRect(ctx, PHOTO.x, PHOTO.y, PHOTO.w, PHOTO.h, PHOTO.r);
//   ctx.clip();
//   ctx.drawImage(photo, PHOTO.x, PHOTO.y, PHOTO.w, PHOTO.h);
//   ctx.restore();

//   /* ================= NAME ================= */
//   ctx.fillStyle = "#0A4F7A";
//   ctx.font = "bold 44px Arial";
//   ctx.textAlign = "center";
//   ctx.fillText(data.name.toUpperCase(), WIDTH / 2, 480);

//   /* ================= CLASS BADGE TEXT ================= */
//   ctx.fillStyle = "#FFFFFF";
//   ctx.font = "bold 30px Arial";
//   ctx.fillText(
//     `Std. ${data.className} (${data.sectionName})`,
//     WIDTH / 2,
//     530
//   );

//   /* ================= DETAILS TABLE ================= */
//   const LABEL_X = 220;
//   const VALUE_X = 420;
//   let y = 580;
//   const ROW = 46;

//   // Labels
//   ctx.textAlign = "left";
//   ctx.fillStyle = "#C65A5A";
//   ctx.font = "bold 28px Arial";

//   ctx.fillText("Father Name", LABEL_X, y);
//   ctx.fillText("DOB", LABEL_X, y += ROW);
//   ctx.fillText("Address", LABEL_X, y += ROW);
//   ctx.fillText("Mo.", LABEL_X, y += ROW);
//   ctx.fillText("Blood Group", LABEL_X, y += ROW);

//   // Values
//   y = 580;
//   ctx.fillStyle = "#0A7C82";
//   ctx.font = "28px Arial";

//   ctx.fillText(data.fatherName, VALUE_X, y);
//   ctx.fillText(data.dob, VALUE_X, y += ROW);
//   ctx.fillText(data.address, VALUE_X, y += ROW);
//   ctx.fillText(data.mobile, VALUE_X, y += ROW);
//   ctx.fillText(data.bloodGroup, VALUE_X, y += ROW);

//   return canvas;
// }

// export async function renderIdCardCanvas(data: StudentCardData) {

//     const WIDTH = 400;
//     const HEIGHT = 800;
//     const canvas = createCanvas(WIDTH, HEIGHT);
//     const ctx = canvas.getContext("2d");

//   // Background
//   ctx.fillStyle = "#ffffaa";
//   ctx.fillRect(0, 0, WIDTH, HEIGHT);

//   const bg = await loadImage("src/templates/id-card-bg.png");
// //   ctx.drawImage(bg, 0, 0, WIDTH, HEIGHT);
// ctx.drawImage(bg, 0, 0, WIDTH , HEIGHT);

//   // -------------------------
//   // PHOTO
//   // -------------------------
//   const PHOTO_W = 130;
//   const PHOTO_H = 200;
//   const PHOTO_X = (WIDTH - PHOTO_W) / 2;
//   const PHOTO_Y = 120;

//   const photo = await loadImage(data.photoUrl);

//   ctx.save();
//   ctx.beginPath();
//   ctx.roundRect(PHOTO_X, PHOTO_Y, PHOTO_W, PHOTO_H, 12);
//   ctx.clip();
//   ctx.drawImage(photo, PHOTO_X, PHOTO_Y, PHOTO_W, PHOTO_H);
//   ctx.restore();

//   let currentY = PHOTO_Y + PHOTO_H + 30;

//   // -------------------------
//   // NAME
//   // -------------------------
//   ctx.fillStyle = "#0B4A7B";
//   ctx.font = "bold 36px Arial";
//   ctx.textAlign = "center";
//   ctx.fillText(data.name.toUpperCase(), 300, currentY);

//   currentY += 44;

//   // -------------------------
//   // CLASS / SECTION
//   // -------------------------
//   ctx.fillStyle = "#333";
//   ctx.font = "22px Arial";
//   ctx.fillText(
//     `Std: ${data.className} (${data.sectionName})`,
//     319,
//     currentY
//   );

//   currentY += 40;

//   // -------------------------
//   // DETAILS BLOCK
//   // -------------------------
//   const LABEL_X = 80;
//   const VALUE_X = 260;
//   const LINE_GAP = 34;

//   ctx.textAlign = "left";

//     const MAX_TEXT_WIDTH = WIDTH - VALUE_X - 30;

//     function drawWrappedText(
//   text: string,
//   x: number,
//   y: number,
//   maxWidth: number,
//   lineHeight: number
// ) {
//   const words = text.split(" ");
//   let line = "";
//   let currentY = y;

//   for (let i = 0; i < words.length; i++) {
//     const testLine = line + words[i] + " ";
//     const metrics = ctx.measureText(testLine);
//     const testWidth = metrics.width;

//     if (testWidth > maxWidth && i > 0) {
//       ctx.fillText(line, x, currentY);
//       line = words[i] + " ";
//       currentY += lineHeight;
//     } else {
//       line = testLine;
//     }
//   }

//   ctx.fillText(line, x, currentY);

//   return currentY + lineHeight;
// }

// //   function drawRow(label: string, value: string) {
// //     if (!value) return;

// //     ctx.fillStyle = "#C0392B";
// //     ctx.font = "bold 20px Arial";
// //     ctx.fillText(label, LABEL_X, currentY);

// //     ctx.fillStyle = "#1F7A7A";
// //     ctx.font = "20px Arial";
// //     ctx.fillText(value, VALUE_X, currentY);

// //     currentY += LINE_GAP;
// //   }

// function drawRow(label: string, value: string) {
//   if (!value) return;

//   ctx.fillStyle = "#C0392B";
//   ctx.font = "bold 20px Arial";
//   ctx.fillText(label, LABEL_X, currentY);

//   ctx.fillStyle = "#1F7A7A";
//   ctx.font = "20px Arial";

//   currentY = drawWrappedText(
//     value,
//     VALUE_X,
//     currentY,
//     MAX_TEXT_WIDTH,
//     26
//   );

//   currentY += 8; // small gap between rows
// }

//   drawRow("Father Name", data.fatherName);
//   drawRow("DOB", data.dob);
//   drawRow("Address", data.address);
//   drawRow("Mobile", data.mobile);
//   drawRow("Blood Group", data.bloodGroup);

//   return canvas;
// }

// export interface StudentCardData {
//   name: string;
//   className: string;
//   sectionName: string;
//   fatherName: string;
//   dob: string;
//   address: string;
//   mobile: string;
//   bloodGroup: string;
//   photoUrl: string;
// }

// export async function renderIdCardCanvas(
//   data: StudentCardData, WIDTH = 410, HEIGHT = 700
// ) {
// //   const WIDTH = 410;
// //   const HEIGHT = 700;

//   const canvas = createCanvas(WIDTH, HEIGHT);
//   const ctx = canvas.getContext("2d");

//   /**
//    * Background
//    */
//   ctx.fillStyle = "#ffffff";
//   ctx.fillRect(0, 0, WIDTH, HEIGHT);

//   const bg = await loadImage("src/templates/id-card-bg-2.jpg");
//   ctx.drawImage(bg, 0, 0, WIDTH, HEIGHT);

//   /**
//    * Photo
//    */
//   const PHOTO_W = 130;
//   const PHOTO_H = 200;
//   const PHOTO_X = (WIDTH - PHOTO_W) / 2;
//   const PHOTO_Y = 120;

//   const photo = await loadImage(data.photoUrl);

//   ctx.save();
//   ctx.beginPath();
//   ctx.roundRect(PHOTO_X, PHOTO_Y, PHOTO_W, PHOTO_H, 12);
//   ctx.clip();
//   ctx.drawImage(photo, PHOTO_X, PHOTO_Y, PHOTO_W, PHOTO_H);
//   ctx.restore();

//   let currentY = PHOTO_Y + PHOTO_H + 30;

//   /**
//    * Name
//    */
//   ctx.fillStyle = "#0B4A7B";
//   ctx.font = "bold 32px Arial";
//   ctx.textAlign = "center";
//   ctx.fillText(data.name.toUpperCase(), WIDTH / 2, currentY);

//   currentY += 42;

//   /**
//    * Class / Section
//    */
//   ctx.fillStyle = "#333";
//   ctx.font = "20px Arial";
//   ctx.fillText(
//     `Std: ${data.className} (${data.sectionName})`,
//     WIDTH / 2,
//     currentY
//   );

//   currentY += 36;

//   /**
//    * Details layout
//    */
//   ctx.textAlign = "left";

//   const LABEL_X = 50;
//   const VALUE_X = 190;
//   const MAX_TEXT_WIDTH = WIDTH - VALUE_X - 20;

//   function drawWrappedText(
//     text: string,
//     x: number,
//     y: number,
//     maxWidth: number,
//     lineHeight: number
//   ) {
//     const words = text.split(" ");
//     let line = "";
//     let drawY = y;

//     for (let i = 0; i < words.length; i++) {
//       const testLine = line + words[i] + " ";
//       const testWidth = ctx.measureText(testLine).width;

//       if (testWidth > maxWidth && i > 0) {
//         ctx.fillText(line, x, drawY);
//         line = words[i] + " ";
//         drawY += lineHeight;
//       } else {
//         line = testLine;
//       }
//     }

//     ctx.fillText(line, x, drawY);
//     return drawY + lineHeight;
//   }

//   function drawRow(label: string, value: string) {
//     if (!value) return;
//     if (currentY > HEIGHT - 30) return;

//     ctx.fillStyle = "#C0392B";
//     ctx.font = "bold 18px Arial";
//     ctx.fillText(label, LABEL_X, currentY);

//     ctx.fillStyle = "#1F7A7A";
//     ctx.font = "18px Arial";

//     currentY = drawWrappedText(
//       value,
//       VALUE_X,
//       currentY,
//       MAX_TEXT_WIDTH,
//       24
//     );

//     currentY += 6;
//   }

//   drawRow("Father Name", data.fatherName);
//   drawRow("DOB", data.dob);
//   drawRow("Address", data.address);
//   drawRow("Mobile", data.mobile);
//   drawRow("Blood Group", data.bloodGroup);

//   return canvas;
// }

export interface StudentCardData {
  name: string;
  className: string;
  sectionName: string;
  fatherName: string;
  dob: string;
  address: string;
  mobile: string;
  bloodGroup: string;
  photoUrl: string;
  rollNo?: string;
  houseName?: string;
  schoolAddress?: string;
  schoolContact?: string;
  enrollmentNo?: string;
}

export type CardSide = "FRONT" | "BACK";

export async function renderIdCardCanvas(
  data: StudentCardData,
  side: CardSide,
  WIDTH = 410,
  HEIGHT = 700
) {
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext("2d");

  if (side === "FRONT") {
    await renderFront(ctx, data, WIDTH, HEIGHT);
  } else {
    await renderBack(ctx, data, WIDTH, HEIGHT);
  }

  return canvas;
}

/* =========================
   HELPERS
========================= */

function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split(" ");
  let line = "";
  let drawY = y;

  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i] + " ";
    const testWidth = ctx.measureText(testLine).width;

    if (testWidth > maxWidth && i > 0) {
      ctx.fillText(line, x, drawY);
      line = words[i] + " ";
      drawY += lineHeight;
    } else {
      line = testLine;
    }
  }

  ctx.fillText(line, x, drawY);
  return drawY + lineHeight;
}

/* =========================
   FRONT SIDE
========================= */

async function renderFront(
  ctx: CanvasRenderingContext2D,
  data: StudentCardData,
  WIDTH: number,
  HEIGHT: number
) {
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const bg = await loadImage("src/templates/id-card-bg-2.jpg");
  ctx.drawImage(bg, 0, 0, WIDTH, HEIGHT);

  const PHOTO_W = 130;
  const PHOTO_H = 200;
  const PHOTO_X = (WIDTH - PHOTO_W) / 2;
  const PHOTO_Y = 120;

  const photo = await loadImage(data.photoUrl);

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(PHOTO_X, PHOTO_Y, PHOTO_W, PHOTO_H, 12);
  ctx.clip();
  ctx.drawImage(photo, PHOTO_X, PHOTO_Y, PHOTO_W, PHOTO_H);
  ctx.restore();

  let currentY = PHOTO_Y + PHOTO_H + 30;

  ctx.fillStyle = "#0B4A7B";
  ctx.font = "bold 32px Arial";
  ctx.textAlign = "center";
  ctx.fillText(data.name.toUpperCase(), WIDTH / 2, currentY);

  currentY += 42;

  ctx.fillStyle = "#333";
  ctx.font = "20px Arial";
  ctx.fillText(
    `Std: ${data.className} (${data.sectionName})`,
    WIDTH / 2,
    currentY
  );

  currentY += 36;
  ctx.textAlign = "left";

  const LABEL_X = 50;
  const VALUE_X = 190;
  const MAX_TEXT_WIDTH = WIDTH - VALUE_X - 20;

  function drawRow(label: string, value: string) {
    if (!value || currentY > HEIGHT - 30) return;

    ctx.fillStyle = "#C0392B";
    ctx.font = "bold 18px Arial";
    ctx.fillText(label, LABEL_X, currentY);

    ctx.fillStyle = "#1F7A7A";
    ctx.font = "18px Arial";

    currentY = drawWrappedText(
      ctx,
      value,
      VALUE_X,
      currentY,
      MAX_TEXT_WIDTH,
      24
    );
    currentY += 6;
  }

  drawRow("Father Name", data.fatherName);
  drawRow("Roll No", data.rollNo ?? "");
  drawRow("House", data.houseName ?? "");
  drawRow("Enrollment No", data.enrollmentNo ?? "");
  drawRow("DOB", data.dob);
}

/* =========================
   BACK SIDE
========================= */

async function renderBack(
  ctx: CanvasRenderingContext2D,
  data: StudentCardData,
  WIDTH: number,
  HEIGHT: number
) {
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const bg = await loadImage("src/templates/id-card-bg.png");
  ctx.drawImage(bg, 0, 0, WIDTH, HEIGHT);

  ctx.textAlign = "left";

  let currentY = 140;
  const LABEL_X = 40;
  const VALUE_X = 175;
  const MAX_TEXT_WIDTH = WIDTH - VALUE_X - 25;

  function drawRow(label: string, value: string) {
    if (!value) return;

    ctx.fillStyle = "#000";
    ctx.font = "bold 16px Arial";
    ctx.fillText(label + " :", LABEL_X, currentY);

    ctx.fillStyle = "#C0392B";
    ctx.font = "16px Arial";

    currentY = drawWrappedText(
      ctx,
      value,
      VALUE_X,
      currentY,
      MAX_TEXT_WIDTH,
      20
    );
    currentY += 10;
  }

  drawRow("Contact No", data.mobile);
  drawRow("Blood Group", data.bloodGroup);
  drawRow("Address", data.address);
  drawRow("School Addr", data.schoolAddress ?? "");
  drawRow("School Ph", data.schoolContact ?? "");

  ctx.textAlign = "center";
  ctx.font = "12px Arial";
  ctx.fillStyle = "#555";
  ctx.fillText(
    "If found please return to the school office",
    WIDTH / 2,
    HEIGHT - 40
  );
}
