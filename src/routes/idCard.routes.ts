// // src/routes/idCard.routes.ts
// import { Router } from "express";
// import { previewIdCard } from "../controllers/idCard.controller.js";

// const router = Router();

// router.get("/students/:studentId/id-card/preview", previewIdCard);

// export default router;


import { Router } from "express";
import { bulkGenerateIdCards, getIdCardPreviews, previewIdCard, printIdCards } from "../controllers/idCard.controller.js";

const router = Router();

router.get("/students/:studentId/id-card/single-generate", previewIdCard);
router.post("/id-cards/bulk-generate", bulkGenerateIdCards);
router.post("/id-cards/print", printIdCards);
router.get("/id-cards/previews", getIdCardPreviews);

export default router;
