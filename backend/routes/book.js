const express = require('express');
const router = express.Router();

// middlewares
const auth = require('../middleware/auth');
const multer = require('../middleware/multer-config');
const sharp = require('../middleware/sharp-config');

const bookController = require('../controllers/book');

// create a book
router.post('/', auth, multer, sharp, bookController.createBook);

// get all books
router.get('/', bookController.getBooks);

// get a book
router.get('/:id', bookController.getBookById);

// update a book
router.put('/:id', auth, multer, sharp, bookController.modifyBook);

// delete a book
router.delete('/:id', auth, bookController.deleteBook);

// create a grade
router.post('/:id/rating', auth, bookController.createRating);

// get best rated books
router.get('/bestrating', bookController.getBestrating);

module.exports = router;
