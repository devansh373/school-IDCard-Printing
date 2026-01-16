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
//   if (student.idCard?.status === "READY" && student.idCard.previewUrl) {
//     return student.idCard.previewUrl;
//   }

//   // 3. Ensure IdCard row exists
//   const idCard =
//     student.idCard ??
//     (await prisma.idCard.create({
//       data: { studentId: student.id }
//     }));

//   // 4. Generate preview
//   const previewUrl = await generateIdCardPreview({
//     name: student.firstName + " " + student.lastName,
//     className: student.class.name,     // adjust if needed
//     sectionName: student.section.name, // adjust if needed
//     photoUrl: student.photoUrl
//   });

//   // 5. Save result
//   await prisma.idCard.update({
//     where: { id: idCard.id },
//     data: {
//       previewUrl,
//       status: "READY"
//     }
//   });

//   return previewUrl;
// }


import { prisma } from "../db.js";
import { renderIdCardCanvas } from "./idCardRenderer.js";
import { imagekit } from "../config/imagekit.js";
import { formatDOB } from "../utils/formatDob.js";

export async function getOrCreateIdCardPreview(studentId: number) {
  // 1️⃣ Fetch student + relations
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      idCard: true,
      class: true,
      section: true,
    },
  });

  if (!student ) {
    throw new Error("Student not found or photo missing");
  }

  // 2️⃣ If preview already exists → reuse
  if (student.idCard?.status === "READY" && student.idCard.previewUrl) {
    return student.idCard.previewUrl;
  }

  // 3️⃣ Ensure IdCard row exists
  const idCard =
    student.idCard ??
    (await prisma.idCard.create({
      data: { studentId: student.id },
    }));

  // 4️⃣ Render canvas (NEW renderer)
  const canvas = await renderIdCardCanvas({
    name: `${student.firstName} ${student.lastName}`,
    className: student.class.name,
    sectionName: student.section.name,
    fatherName: student.fatherName ?? "",
    dob: `${formatDOB(student.dateOfBirth) ?? ""}`,
      address: student.currentAddress ?? "",
      mobile: student.mobileNo ?? "",
    bloodGroup: student.bloodGroup ?? "",
    photoUrl: student.photoUrl!,
  });

  // 5️⃣ Convert to PNG
  const buffer = canvas.toBuffer("image/png");

  // 6️⃣ Upload to ImageKit
  const upload = await imagekit.upload({
    file: buffer,
    fileName: `id-card-${student.id}.png`,
    folder: "/id-card-previews",
  });

  // 7️⃣ Save preview URL + status
  await prisma.idCard.update({
    where: { id: idCard.id },
    data: {
      previewUrl: upload.url,
      status: "READY",
    },
  });

  return upload.url;
}

