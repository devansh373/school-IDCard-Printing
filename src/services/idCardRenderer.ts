import { createCanvas, loadImage, CanvasRenderingContext2D } from "canvas";
import fetch from "node-fetch";
import path from "path";

export interface StudentCardData {
  name: string;
  className: string;
  sectionName: string;
  dob: string;
  address: string;
  guardianMobile: string;
  bloodGroup: string;
  photoUrl: string;
  rollNo?: string | undefined;
  schoolAddress?: string | undefined;
  schoolContact?: string | undefined;
  aparIdOrPan?: string | undefined;
  logoUrl?: string | undefined;
  templateFrontUrl?: string | undefined;
  templateBackUrl?: string | undefined;
  authoritySignatureUrl?: string | undefined;
  schoolName?: string | undefined;
}

export type CardSide = "FRONT" | "BACK";

export async function renderIdCardCanvas(
  data: StudentCardData,
  side: CardSide,
  WIDTH = 410,
  HEIGHT = 700,
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
  lineHeight: number,
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
  HEIGHT: number,
) {
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Background Template
  if (data.templateFrontUrl) {
    try {
      const bg = await loadImage(data.templateFrontUrl);
      ctx.drawImage(bg, 0, 0, WIDTH, HEIGHT);
    } catch (e) {
      ctx.fillStyle = "#f0f0f0";
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
    }
    console.log("front if part");
  } else {
    // Fallback to local default if no template provided
    try {
      console.log("front else part");
      const bg = await loadImage("src/templates/id-card-bg.jpg");
      ctx.drawImage(bg, 0, 0, WIDTH, HEIGHT);
    } catch (e) {
      ctx.fillStyle = "#f0f0f0";
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
    }
  }

  const PHOTO_W = 110;
  const PHOTO_H = 140;
  const PHOTO_X = (WIDTH - PHOTO_W) / 2;
  const PHOTO_Y = 230; // Shifted up as requested

  try {
    const photo = await loadImage(data.photoUrl);
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(PHOTO_X, PHOTO_Y, PHOTO_W, PHOTO_H, 10);
    ctx.clip();
    ctx.drawImage(photo, PHOTO_X, PHOTO_Y, PHOTO_W, PHOTO_H);
    ctx.restore();
  } catch (e) {
    console.error("Error loading photo:", e);
    ctx.fillStyle = "#ccc";
    ctx.fillRect(PHOTO_X, PHOTO_Y, PHOTO_W, PHOTO_H);
  }

  let currentY = PHOTO_Y + PHOTO_H + 35;

  // Name - Blue and Bold (Reduced size)
  ctx.fillStyle = "#0B4A7B";
  ctx.font = "bold 24px Arial";
  ctx.textAlign = "center";
  ctx.fillText(data.name.toUpperCase(), WIDTH / 2, currentY);

  currentY += 35;
  ctx.textAlign = "left";

  const LABEL_X = 50;
  const VALUE_X = 175;
  const MAX_TEXT_WIDTH = WIDTH - VALUE_X - 25;

  function drawRow(label: string, value: string) {
    if (!value || currentY > HEIGHT - 100) return; // Leave space for signature

    ctx.fillStyle = "#C0392B"; // Reddish label
    ctx.font = "bold 16px Arial";
    ctx.fillText(label, LABEL_X, currentY);

    ctx.fillStyle = "#16A085"; // Tealish value
    ctx.font = "16px Arial";

    currentY = drawWrappedText(
      ctx,
      value,
      VALUE_X,
      currentY,
      MAX_TEXT_WIDTH,
      22,
    );
    currentY += 8;
  }

  // Combined Class/Section row
  drawRow("Class/Sec", `${data.className} (${data.sectionName})`);
  drawRow("Roll No", data.rollNo ?? "");
  drawRow("APARID/PEN", data.aparIdOrPan ?? "");
  drawRow("DOB", data.dob);

  // Authority Signature image and text at bottom right
  if (data.authoritySignatureUrl) {
    try {
      const sig = await loadImage(data.authoritySignatureUrl);
      const SIG_W = 100;
      const SIG_H = 40;
      ctx.drawImage(sig, WIDTH - SIG_W - 40, HEIGHT - 110, SIG_W, SIG_H);
    } catch (e) {
      console.error("Error loading authority signature image:", e);
    }
  }

  // ctx.textAlign = "right";
  // ctx.fillStyle = "#222";
  // ctx.font = "bold 15px Arial";
  // ctx.fillText("Signature of", WIDTH - 40, HEIGHT - 70);
  // ctx.fillText("Authority", WIDTH - 58, HEIGHT - 50);
}

/* =========================
   BACK SIDE
========================= */

async function renderBack(
  ctx: CanvasRenderingContext2D,
  data: StudentCardData,
  WIDTH: number,
  HEIGHT: number,
) {
  // Background Template for Back Side
  if (data.templateBackUrl) {
    try {
      const bg = await loadImage(data.templateBackUrl);
      ctx.drawImage(bg, 0, 0, WIDTH, HEIGHT);
    } catch (e) {
      ctx.fillStyle = "#f9f9f9";
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
    }
    console.log("back if part");
  } else {
    try {
      console.log("back else part");
      const bg = await loadImage("src/templates/id-card-bg-back.jpg");
      ctx.drawImage(bg, 0, 0, WIDTH, HEIGHT);
    } catch (e) {
      ctx.fillStyle = "#f9f9f9";
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
    }
  }

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
      20,
    );
    currentY += 10;
  }

  drawRow("Contact No", data.guardianMobile);
  drawRow("Blood Group", data.bloodGroup);
  drawRow("Address", data.address);
  drawRow("School Addr", data.schoolAddress ?? "");
  drawRow("School Ph", data.schoolContact ?? "");

  // Authority Signature at the bottom
  // if (data.authoritySignatureUrl) {
  //   try {
  //     const sig = await loadImage(data.authoritySignatureUrl);
  //     const SIG_W = 120;
  //     const SIG_H = 50;
  //     ctx.drawImage(sig, (WIDTH - SIG_W) / 2, HEIGHT - 110, SIG_W, SIG_H);

  //     ctx.fillStyle = "#000";
  //     ctx.font = "bold 14px Arial";
  //     ctx.textAlign = "center";
  //     ctx.fillText("Authorized Signature", WIDTH / 2, HEIGHT - 55);
  //   } catch (e) {
  //     console.error("Error loading signature:", e);
  //   }
  // }

  // ctx.textAlign = "center";
  // ctx.font = "12px Arial";
  // ctx.fillStyle = "#555";
  // ctx.fillText(
  //   "If found please return to the school office",
  //   WIDTH / 2,
  //   HEIGHT - 25,
  // );
}
