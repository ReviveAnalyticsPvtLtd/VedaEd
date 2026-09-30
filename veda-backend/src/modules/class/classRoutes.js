const express = require("express");
const router = express.Router();
const authMiddleware = require("../../middleware/authMiddleware");
const classController = require("./classController");

// CRUD Routes for Classes
router.get("/", authMiddleware, classController.getClasses);        // GET all classes
router.get("/:id", authMiddleware, classController.getClassById ); // use it to display the list on Ui jaha class cards ke form me show ho rha, proper class teacher and sections isme mil jayega 
router.get("/:classId/sections/:sectionId", authMiddleware, classController.getClassByIdAndSection);   // GET class by id and section
router.post("/", authMiddleware, classController.createClass);      // POST new class
router.put("/:id", authMiddleware, classController.updateClass);    // PUT update class
router.delete("/:id", authMiddleware, classController.deleteClass); // DELETE class

module.exports = router;
