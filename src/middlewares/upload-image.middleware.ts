// import multer from "multer";

// export const uploadImage = multer({
//   storage: multer.memoryStorage(),
//   limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
//   fileFilter(_, file, cb) {
//     if (!file.mimetype.startsWith("image/")) {
//       cb(new Error("Only image files are allowed"));
//     }
//     cb(null, true);
//   },
// });

import multer from "multer";

export const uploadImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter(_, file, cb) {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"));
    }
    cb(null, true);
  },
});
