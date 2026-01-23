// import { prisma } from "../db.js";
// import { generateIdCardPreview } from "./idCardRenderer.js";

// export async function getOrCreateIdCardPreview(studentId: number) {
//   // 1. Fetch student + idCard
//   const student = await prisma.student.findUnique({
//     where: { id: studentId },
//     include: { idCard: true,class:true,section:true }
//   });

//   if (!student || !student.photoUrl) {
//     throw new Error("Student not found");
//   }

//   // 2. If preview already exists → reuse
//   if (student.idCard?.status === "READY" && student.idCard.frontUrl) {
//     return student.idCard.frontUrl;
//   }

//   // 3. Ensure IdCard row exists
//   const idCard =
//     student.idCard ??
//     (await prisma.idCard.create({
//       data: { studentId: student.id }
//     }));

//   // 4. Generate preview
//   const frontUrl = await generateIdCardPreview({
//     name: student.firstName + " " + student.lastName,
//     className: student.class.name,     // adjust if needed
//     sectionName: student.section.name, // adjust if needed
//     photoUrl: student.photoUrl
//   });

//   // 5. Save result
//   await prisma.idCard.update({
//     where: { id: idCard.id },
//     data: {
//       frontUrl,
//       status: "READY"
//     }
//   });

//   return frontUrl;
// }

import { prisma } from "../db.js";
import { renderIdCardCanvas, type CardSide } from "./idCardRenderer.js";
import { imagekit } from "../config/imagekit.js";
import { formatDOB } from "../utils/formatDob.js";

export async function getOrCreateIdCardPreview(
  studentId: number,
  side: CardSide,
) {
  // 1️⃣ Fetch student + relations
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      idCard: true,
      class: true,
      section: true,
      school: true,
    },
  });

  if (!student) {
    throw new Error("Student not found");
  }
  // ✅ 🚫 HARD STOP: photo is mandatory
  if (!student.photoUrl) {
    throw new Error("Student photo is required to generate ID card");
  }

  // 2️⃣ If preview already exists → reuse
  if (student.idCard?.status === "READY") {
    if (side === "FRONT" && student.idCard.frontUrl)
      return student.idCard.frontUrl;
    if (side === "BACK" && student.idCard.backUrl)
      return student.idCard.backUrl;
  }

  // 3️⃣ Ensure IdCard row exists
  const idCard =
    student.idCard ??
    (await prisma.idCard.create({
      data: { studentId: student.id },
    }));

  // 4️⃣ Render canvas (NEW renderer)
  const canvas = await renderIdCardCanvas(
    {
      name: student.name,
      className: student.class.name,
      sectionName: student.section.name,
      dob: `${formatDOB(student.dateOfBirth) ?? ""}`,
      address: student.currentAddress ?? "",
      guardianMobile: student.guardianMobileNo ?? "",
      bloodGroup: student.bloodGroup ?? "",
      photoUrl: student.photoUrl!,
      rollNo: student.rollNo ?? "",
      schoolAddress: student.school.address ?? "",
      schoolContact: student.school.contactNumber ?? "",
      aparIdOrPan: student.aparIdOrPan ?? "",
      logoUrl: student.school.logoUrl ?? undefined,
      templateFrontUrl: student.school.templateFrontUrl ?? undefined,
      templateBackUrl: student.school.templateBackUrl ?? undefined,
      authoritySignatureUrl: student.school.authoritySignatureUrl ?? undefined,
      schoolName: student.school.name,
    },
    side,
  );

  // 5️⃣ Convert to PNG
  const buffer = canvas.toBuffer("image/png");

  // 6️⃣ Upload to ImageKit
  const upload = await imagekit.upload({
    file: buffer,
    fileName: `id-card-${student.id}-${side}.png`,
    folder: "/id-card-previews",
  });

  // 7️⃣ Save preview URL + status
  const updateData: any = {
    status: "READY",
  };

  if (side === "FRONT") {
    updateData.frontUrl = upload.url;
  } else {
    updateData.backUrl = upload.url;
  }

  await prisma.idCard.update({
    where: { id: idCard.id },
    data: updateData,
  });

  return upload.url;
}
