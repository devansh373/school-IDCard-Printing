// import PDFDocument from "pdfkit";
// import { createCanvas, loadImage } from "canvas";
// import { prisma } from "../db.js";

// const CARD_WIDTH = 1016;
// const CARD_HEIGHT = 638;

// // A4 size in points
// const PAGE_WIDTH = 595;
// const PAGE_HEIGHT = 842;

// // Grid: 2 columns × 4 rows = 8 cards
// const SCALE = 0.45;
// const GAP_X = 20;
// const GAP_Y = 20;

// export async function generateIdCardPdf(studentIds: number[], res: any) {
//   if (studentIds.length === 0) {
//     throw new Error("No students selected");
//   }

//   if (studentIds.length > 100) {
//     throw new Error("Maximum 100 students allowed");
//   }

//   const students = await prisma.student.findMany({
//     where: { id: { in: studentIds } },
//     include: {
//       class: true,
//       section: true,
//     },
//   });

//   const doc = new PDFDocument({ size: "A4", margin: 20 });
//   res.setHeader("Content-Type", "application/pdf");
//   res.setHeader("Content-Disposition", "attachment; filename=id-cards.pdf");

//   doc.pipe(res);

//   let index = 0;

//   for (const student of students) {
//     if(student.photoUrl===null){
//       continue;
//     }
//     // new page every 8 cards
//     if (index > 0 && index % 8 === 0) {
//       doc.addPage();
//     }

//     const col = index % 2;
//     const row = Math.floor((index % 8) / 2);

//     const x = 20 + col * (CARD_WIDTH * SCALE + GAP_X);
//     const y = 20 + row * (CARD_HEIGHT * SCALE + GAP_Y);

//     // Render card to canvas
//     const canvas = createCanvas(CARD_WIDTH, CARD_HEIGHT);
//     const ctx = canvas.getContext("2d");

//     const bg = await loadImage("src/templates/id-card-bg.png");
//     ctx.drawImage(bg, 0, 0, CARD_WIDTH, CARD_HEIGHT);

//     const photo = await loadImage(student.photoUrl);
//     ctx.drawImage(photo, 80, 170, 260, 300);

//     ctx.fillStyle = "#000";
//     ctx.font = "bold 42px Arial";
//     ctx.fillText(student.firstName + student.lastName, 380, 260);

//     ctx.font = "28px Arial";
//     ctx.fillText(`Class: ${student.class.name}`, 380, 320);
//     ctx.fillText(`Section: ${student.section.name}`, 380, 360);

//     const buffer = canvas.toBuffer("image/png");

//     doc.image(buffer, x, y, {
//       width: CARD_WIDTH * SCALE,
//     });

//     index++;
//   }

//   doc.end();
// }

// import PDFDocument from "pdfkit";
// import { prisma } from "../db.js";
// import { renderIdCardCanvas } from "./idCardRenderer.js";

// const PAGE_WIDTH = 595;
// const PAGE_HEIGHT = 842;

// const CARD_PDF_WIDTH = 260;
// const GAP_X = 10;
// const GAP_Y = 10;
// const MARGIN_X = 30;
// const MARGIN_Y = 30;

// const CARDS_PER_ROW = 2;
// const CARDS_PER_PAGE = 8;

// export async function generateIdCardPdf(studentIds: number[], res: any) {
//   if (!studentIds.length) {
//     throw new Error("No students selected");
//   }

//   if (studentIds.length > 100) {
//     throw new Error("Maximum 100 students allowed");
//   }

//   const students = await prisma.student.findMany({
//     where: {
//       id: { in: studentIds },
//       photoUrl: { not: null },
//     },
//     include: {
//       class: true,
//       section: true,
//     },
//   });

//   const doc = new PDFDocument({ size: "A4", margin: 0 });
//   res.setHeader("Content-Type", "application/pdf");
//   res.setHeader("Content-Disposition", "attachment; filename=id-cards.pdf");

//   doc.pipe(res);

//   let index = 0;

//   for (const student of students) {
//     if (index > 0 && index % CARDS_PER_PAGE === 0) {
//       doc.addPage();
//     }

//     const indexInPage = index % CARDS_PER_PAGE;
//     const row = Math.floor(indexInPage / CARDS_PER_ROW);
//     const col = indexInPage % CARDS_PER_ROW;

//     const x = MARGIN_X + col * (CARD_PDF_WIDTH + GAP_X);
//     const y = MARGIN_Y + row * (CARD_PDF_WIDTH * 0.63 + GAP_Y);

//     const canvas = await renderIdCardCanvas({
//       name: `${student.firstName} ${student.lastName}`,
//       className: student.class.name,
//       sectionName: student.section.name,
//       fatherName: student.fatherName ?? "",
//       dob: `${student.dateOfBirth}`,
//       address: student.currentAddress ?? "",
//       mobile: student.mobileNo ?? "",
//       bloodGroup: student.bloodGroup ?? "",
//       photoUrl: student.photoUrl!,
//     });

//     const buffer = canvas.toBuffer("image/png");

//     doc.image(buffer, x, y, {
//       width: CARD_PDF_WIDTH,
//     });

//     index++;
//   }

//   doc.end();
// }

// import PDFDocument from "pdfkit";
// import { prisma } from "../db.js";
// import { renderIdCardCanvas } from "./idCardRenderer.js";

// const PAGE_WIDTH = 842;
// const PAGE_HEIGHT = 595;

// // const PAGE_WIDTH = 595;
// // const PAGE_HEIGHT = 842;

// const CARD_WIDTH = 638;
// const CARD_HEIGHT = 1016;

// // PDF layout
// const SCALE = 0.28;               // ⬅ important
// const CARD_PDF_WIDTH = CARD_WIDTH * SCALE;
// const CARD_PDF_HEIGHT = CARD_HEIGHT * SCALE;

// const GAP_X = 5;
// const GAP_Y = 5;

// const CARDS_PER_ROW = 5;
// const CARDS_PER_PAGE = 10;
// const ROWS_PER_PAGE = 2;

// export async function generateIdCardPdf(studentIds: number[], res: any) {
//   if (!studentIds.length) {
//     throw new Error("No students selected");
//   }

//   if (studentIds.length > 100) {
//     throw new Error("Maximum 100 students allowed");
//   }

//   const students = await prisma.student.findMany({
//     where: {
//       id: { in: studentIds },
//       photoUrl: { not: null },
//     },
//     include: {
//       class: true,
//       section: true,
//     },
//   });

//   const doc = new PDFDocument({ size: "A4",layout:"landscape", margin: 0 });
//   res.setHeader("Content-Type", "application/pdf");
//   res.setHeader("Content-Disposition", "attachment; filename=id-cards.pdf");

//   doc.pipe(res);

//   // 🔥 CENTER GRID VERTICALLY
//   const TOTAL_HEIGHT =
//     ROWS_PER_PAGE * CARD_PDF_HEIGHT +
//     (ROWS_PER_PAGE - 1) * GAP_Y;

//   const START_Y = (PAGE_HEIGHT - TOTAL_HEIGHT) / 2;
//   const START_X =
//     (PAGE_WIDTH -
//       (CARDS_PER_ROW * CARD_PDF_WIDTH +
//         (CARDS_PER_ROW - 1) * GAP_X)) /
//     2;

//   let index = 0;

//   for (const student of students) {
//     if (index > 0 && index % CARDS_PER_PAGE === 0) {
//       doc.addPage();
//     }

//     const indexInPage = index % CARDS_PER_PAGE;
//     const row = Math.floor(indexInPage / CARDS_PER_ROW);
//     const col = indexInPage % CARDS_PER_ROW;

//     const x = START_X + col * (CARD_PDF_WIDTH + GAP_X);
//     const y = START_Y + row * (CARD_PDF_HEIGHT + GAP_Y);

//     const canvas = await renderIdCardCanvas({
//       name: `${student.firstName} ${student.lastName}`,
//       className: student.class.name,
//       sectionName: student.section.name,
//       fatherName: student.fatherName ?? "",
//       dob: `${formatDOB(student.dateOfBirth) ?? ""}`,
//       address: student.currentAddress ?? "",
//       mobile: student.mobileNo ?? "",
//       bloodGroup: student.bloodGroup ?? "",
//       photoUrl: student.photoUrl!,
//     });

//     const buffer = canvas.toBuffer("image/png");
// doc
//   .rect(x, y, CARD_PDF_WIDTH, CARD_PDF_HEIGHT)
//   .stroke("red");

//     doc.image(buffer, x, y, {
//       width: CARD_PDF_WIDTH,
//     });

//     index++;
//   }

//   doc.end();
// }

// import PDFDocument from "pdfkit";
// import { prisma } from "../db.js";
// import { renderIdCardCanvas } from "./idCardRenderer.js";

// /**
//  * A4 Landscape dimensions (PDF points)
//  */
// const PAGE_WIDTH = 842;
// const PAGE_HEIGHT = 595;

// /**
//  * Canvas (card) base size
//  */
// const CARD_WIDTH = 410;
// const CARD_HEIGHT = 700;

// /**
//  * PDF layout tuning
//  */
// const SCALE = 0.38;
// const CARD_PDF_WIDTH = CARD_WIDTH * SCALE;
// const CARD_PDF_HEIGHT = CARD_HEIGHT * SCALE;

// const GAP_X = 5;
// const GAP_Y = 5;

// const CARDS_PER_ROW = 5;
// const ROWS_PER_PAGE = 2;
// const CARDS_PER_PAGE = CARDS_PER_ROW * ROWS_PER_PAGE;

// /**
//  * DOB formatter
//  */
//
// }

// export async function generateIdCardPdf(
//   studentIds: number[],
//   res: any
// ) {
//   if (!studentIds.length) {
//     throw new Error("No students selected");
//   }

//   if (studentIds.length > 100) {
//     throw new Error("Maximum 100 students allowed");
//   }

//   const students = await prisma.student.findMany({
//     where: {
//       id: { in: studentIds },
//       photoUrl: { not: null },
//     },
//     include: {
//       class: true,
//       section: true,
//     },
//   });

//   const doc = new PDFDocument({
//     size: "A4",
//     layout: "landscape",
//     margin: 0,
//   });

//   res.setHeader("Content-Type", "application/pdf");
//   res.setHeader(
//     "Content-Disposition",
//     "attachment; filename=id-cards.pdf"
//   );

//   doc.pipe(res);

//   const TOTAL_HEIGHT =
//     ROWS_PER_PAGE * CARD_PDF_HEIGHT +
//     (ROWS_PER_PAGE - 1) * GAP_Y;

//   const START_Y = (PAGE_HEIGHT - TOTAL_HEIGHT) / 2;

//   const TOTAL_WIDTH =
//     CARDS_PER_ROW * CARD_PDF_WIDTH +
//     (CARDS_PER_ROW - 1) * GAP_X;

//   const START_X = (PAGE_WIDTH - TOTAL_WIDTH) / 2;

//   let index = 0;

//   for (const student of students) {
//     if (index > 0 && index % CARDS_PER_PAGE === 0) {
//       doc.addPage();
//     }

//     const indexInPage = index % CARDS_PER_PAGE;
//     const row = Math.floor(indexInPage / CARDS_PER_ROW);
//     const col = indexInPage % CARDS_PER_ROW;

//     const x = START_X + col * (CARD_PDF_WIDTH + GAP_X);
//     const y = START_Y + row * (CARD_PDF_HEIGHT + GAP_Y);

//     const canvas = await renderIdCardCanvas({
//       name: `${student.firstName} ${student.lastName}`,
//       className: student.class.name,
//       sectionName: student.section.name,
//       fatherName: student.fatherName ?? "",
//       dob: formatDOB(student.dateOfBirth),
//       address: student.currentAddress ?? "",
//       mobile: student.mobileNo ?? "",
//       bloodGroup: student.bloodGroup ?? "",
//       photoUrl: student.photoUrl!,
//     }, CARD_WIDTH, CARD_HEIGHT);

//     const buffer = canvas.toBuffer("image/png");

//     // Debug border (remove later)
//     doc.rect(x, y, CARD_PDF_WIDTH, CARD_PDF_HEIGHT).stroke("black");

//     doc.image(buffer, x, y, {
//       width: CARD_PDF_WIDTH,
//     });

//     index++;
//   }

//   doc.end();
// }

// import PDFDocument from "pdfkit";
// import { prisma } from "../db.js";
//     import { fetchImageAsBuffer } from "../utils/fetchImageBuffer.js";

// /**
//  * A4 Landscape dimensions (PDF points)
//  */
// const PAGE_WIDTH = 842;
// const PAGE_HEIGHT = 595;

// /**
//  * Card base size (must match generated ID card size)
//  */
// const CARD_WIDTH = 410;
// const CARD_HEIGHT = 700;

// /**
//  * PDF layout tuning
//  */
// const SCALE = 0.38;
// const CARD_PDF_WIDTH = CARD_WIDTH * SCALE;
// const CARD_PDF_HEIGHT = CARD_HEIGHT * SCALE;

// const GAP_X = 5;
// const GAP_Y = 5;

// const CARDS_PER_ROW = 5;
// const ROWS_PER_PAGE = 2;
// const CARDS_PER_PAGE = CARDS_PER_ROW * ROWS_PER_PAGE;

// export async function generateIdCardPdf(
//   studentIds: number[],
//   res: any
// ) {
//   if (!studentIds.length) {
//     throw new Error("No students selected");
//   }

//   if (studentIds.length > 100) {
//     throw new Error("Maximum 100 students allowed");
//   }

//   /**
//    * 🔥 Fetch students WITH idCard
//    */
//   const students = await prisma.student.findMany({
//     where: {
//       id: { in: studentIds },
//     },
//     include: {
//       class: true,
//       section: true,
//       idCard: true, // ✅ IMPORTANT
//     },
//   });

//   const doc = new PDFDocument({
//     size: "A4",
//     layout: "landscape",
//     margin: 0,
//   });

//   res.setHeader("Content-Type", "application/pdf");
//   res.setHeader(
//     "Content-Disposition",
//     "attachment; filename=id-cards.pdf"
//   );

//   doc.pipe(res);

//   /**
//    * Center grid
//    */
//   const TOTAL_HEIGHT =
//     ROWS_PER_PAGE * CARD_PDF_HEIGHT +
//     (ROWS_PER_PAGE - 1) * GAP_Y;

//   const TOTAL_WIDTH =
//     CARDS_PER_ROW * CARD_PDF_WIDTH +
//     (CARDS_PER_ROW - 1) * GAP_X;

//   const START_Y = (PAGE_HEIGHT - TOTAL_HEIGHT) / 2;
//   const START_X = (PAGE_WIDTH - TOTAL_WIDTH) / 2;

//   let index = 0;

//   for (const student of students) {
//     /**
//      * ✅ Only print READY cards
//      */
//     if (!student.idCard || student.idCard.status !== "READY") {
//       continue;
//     }

//     if (index > 0 && index % CARDS_PER_PAGE === 0) {
//       doc.addPage();
//     }

//     const indexInPage = index % CARDS_PER_PAGE;
//     const row = Math.floor(indexInPage / CARDS_PER_ROW);
//     const col = indexInPage % CARDS_PER_ROW;

//     const x = START_X + col * (CARD_PDF_WIDTH + GAP_X);
//     const y = START_Y + row * (CARD_PDF_HEIGHT + GAP_Y);

//     /**
//      * ✅ Use existing ImageKit URL
//      */

// const imageBuffer = await fetchImageAsBuffer(
//   student.idCard.frontUrl!
// );

// doc.image(imageBuffer, x, y, {
//   width: CARD_PDF_WIDTH,
// });

//     // doc.image(student.idCard.frontUrl!, x, y, {
//     //   width: CARD_PDF_WIDTH,
//     // });

//     // Optional debug border (remove later)
//     // doc.rect(x, y, CARD_PDF_WIDTH, CARD_PDF_HEIGHT).stroke("black");

//     index++;
//   }

//   doc.end();
// }

import PDFDocument from "pdfkit";
import { prisma } from "../db.js";
import { fetchImageAsBuffer } from "../utils/fetchImageBuffer.js";

const PAPER_CONFIG = {
  A4: {
    width: 842,
    height: 595,
    cardsPerRow: 5,
    rowsPerPage: 2,
    CARD_WIDTH: 410,
    CARD_HEIGHT: 700,
    SCALE: 0.38,
    GAP_X: 5,
    GAP_Y: 5,
  },
  A3: {
    width: 1191,
    height: 842,
    cardsPerRow: 8,
    rowsPerPage: 3,
    CARD_WIDTH: 390,
    CARD_HEIGHT: 670,
    SCALE: 0.38,
    GAP_X: 1,
    GAP_Y: 1,
  },
};

export async function generateIdCardPdf(req: any, res: any) {
  const { studentIds } = req.body;
  const paper: "A4" | "A3" = req.query.paper === "A3" ? "A3" : "A4";

  if (!studentIds || studentIds.length === 0) {
    throw new Error("No students selected");
  }

  if (studentIds.length > 100) {
    throw new Error("Maximum 100 students allowed");
  }

  const side: "FRONT" | "BACK" = req.query.side === "BACK" ? "BACK" : "FRONT";

  const config = PAPER_CONFIG[paper];

  const PAGE_WIDTH = config.width;
  const PAGE_HEIGHT = config.height;

  const CARDS_PER_ROW = config.cardsPerRow;
  const ROWS_PER_PAGE = config.rowsPerPage;
  const CARDS_PER_PAGE = CARDS_PER_ROW * ROWS_PER_PAGE;

  const CARD_PDF_WIDTH = config.CARD_WIDTH * config.SCALE;
  const CARD_PDF_HEIGHT = config.CARD_HEIGHT * config.SCALE;

  const students = await prisma.student.findMany({
    where: {
      id: { in: studentIds },
      idCard: {
        is: { status: "READY" },
      },
    },
    include: {
      idCard: true,
    },
  });

  const doc = new PDFDocument({
    size: paper,
    layout: "landscape",
    margin: 0,
  });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `inline; filename=id-cards-${side.toLowerCase()}.pdf`
  );

  doc.pipe(res);

  const TOTAL_WIDTH =
    CARDS_PER_ROW * CARD_PDF_WIDTH + (CARDS_PER_ROW - 1) * config.GAP_X;

  const TOTAL_HEIGHT =
    ROWS_PER_PAGE * CARD_PDF_HEIGHT + (ROWS_PER_PAGE - 1) * config.GAP_Y;

  const START_X = (PAGE_WIDTH - TOTAL_WIDTH) / 2;
  const START_Y = (PAGE_HEIGHT - TOTAL_HEIGHT) / 2;

  let index = 0;

  for (const student of students) {
    if (index > 0 && index % CARDS_PER_PAGE === 0) {
      doc.addPage();
    }

    const indexInPage = index % CARDS_PER_PAGE;
    const row = Math.floor(indexInPage / CARDS_PER_ROW);
    const col = indexInPage % CARDS_PER_ROW;

    // 🔥 For BACK side, we mirror the columns so they align with fronts when flipped
    const drawCol = side === "BACK" ? CARDS_PER_ROW - 1 - col : col;

    const x = START_X + drawCol * (CARD_PDF_WIDTH + config.GAP_X);
    const y = START_Y + row * (CARD_PDF_HEIGHT + config.GAP_Y);

    const imageUrl =
      side === "FRONT" ? student.idCard?.frontUrl : student.idCard?.backUrl;

    if (imageUrl) {
      try {
        const imageBuffer = await fetchImageAsBuffer(imageUrl);
        doc.image(imageBuffer, x, y, {
          width: CARD_PDF_WIDTH,
        });
        index++;
      } catch (err) {
        console.error(
          `Failed to fetch image for student ${student.id}: ${imageUrl}`,
          err
        );
      }
    }
  }

  doc.end();
}
