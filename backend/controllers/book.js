const fs = require('fs');
const mongoose = require('mongoose');

const Book = require('../models/Book');

// create a book
exports.createBook = (req, res, next) => {
    if (!req?.body?.book || !req?.file) {
        return res.status(400).json({message: 'INVALID FORM.'});
    }
    
    try {
        const bookObject = JSON.parse(req.body.book);

        delete bookObject._id;
        delete bookObject._userId;
        const book = new Book({
            ...bookObject,
            userId: req.auth.userId,
            ratings: [], // Specification: init rating to an empty array
            averageRating: 0, // Specification: init averageRating to 0
            imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
        });

        book.save()
            .then(() => {
                res.status(201).json({message: 'Objet enregistré !'}); // CURL + SPEC
            }).catch((error) => {
                if (error?.name && error.name === "ValidationError") {
                    return res.status(400).json({message: 'INVALID FORM.'});
                }
                //console.log("ERROR POST /api/books");
                res.status(500).json({message: 'INTERNAL SERVER ERROR'});
            });
    
    } catch (error) {
        //console.log("ERROR POST /api/books");
        res.status(500).json({message: 'INTERNAL SERVER ERROR'});
    }
}

// get all books
exports.getBooks = (req, res, next) => {
    Book.find()
        .then((books) => { res.status(200).json(books) })
        .catch((error) => {
            //console.log("ERROR GET /api/books");
            res.status(500).json({message: 'INTERNAL SERVER ERROR'})
        });
}

// get all books
exports.getBestrating = (req, res, next) => {
    try {
        Book.find().sort({averageRating: -1}).limit(3)
            .then((books) => {
                res.status(200).json(books); 
            })
            .catch((error) => {
                //console.log("ERROR GET /api/books/bestrating");
                res.status(500).json({message: 'INTERNAL SERVER ERROR'});
            });
    } catch (error) {
        //console.log("ERROR GET /api/books/bestrating");
        res.status(500).json({message: 'INTERNAL SERVER ERROR'});
    }
}

// get a book
exports.getBookById = (req, res, next) => {
    if (req?.params?.id && !mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({message: 'INVALID BOOK ID.'});
    }

    Book.findOne({_id: req.params.id})
        .then((book) => {
            if (!book) {
                res.status(404).json({message: 'BOOK NOT FOUND.'});
            } else {
                res.status(200).json(book);
            }
        }).catch((error) => {
            //console.log("ERROR GET /api/books/:id");
            res.status(500).json({message: 'INTERNAL SERVER ERROR'});
        });
}

const deleteTemporaryFile = (filename) => {
    fs.unlink(filename, (err) => {
        if (err) {
            console.log("ERROR PUT /api/books");
        }
    });
}

// update a book
exports.modifyBook = (req, res, next) => { 
    const bookObject = req.file ? {
        ...JSON.parse(req.body.book),
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    } : { ...req.body };

    
    delete bookObject._userId;
    Book.findOne({_id: req.params.id})
        .then((book) => {
            if (!book) {
                if (req.file) {
                    deleteTemporaryFile(`/images/${req.file.filename}`) // new image was saved but
                }
                return res.status(404).json({message: 'BOOK NOT FOUND.'});
            }
            if (book.userId != req.auth.userId) {
                if (req.file) {
                    deleteTemporaryFile(`/images/${req.file.filename}`) // new image was saved but
                }
                return res.status(401).json({message : 'NOT AUTHORIZED.'});
            }

            if (req.file) {
                const filename = book.imageUrl.split('/images/')[1];
                fs.unlink(`images/${filename}`, (err) => {
                    if (err) {
                        deleteTemporaryFile(`/images/${req.file.filename}`) // new image was saved but
                        // console.log("ERROR PUT /api/books/:id");
                        return res.status(500).json({message: 'INTERNAL SERVER ERROR'});
                    }
                    Book.updateOne({ _id: req.params.id}, { ...bookObject, _id: req.params.id})
                        .then(() => { res.status(200).json({message: 'Objet modifié!'}) })
                        .catch(error => {
                            deleteTemporaryFile(`/images/${req.file.filename}`) // new image was saved but
                            if (error?.name && error.name === "ValidationError") {
                                return res.status(400).json({message: 'INVALID FORM.'});
                            }
                            // console.log("ERROR PUT /api/books/:id");
                            res.status(500).json({message: 'INTERNAL SERVER ERROR'});
                        });
                });
            } else {
                Book.updateOne({ _id: req.params.id}, { ...bookObject, _id: req.params.id})
                    .then(() => { res.status(200).json({message: 'Objet modifié!'}) })
                    .catch(error => {
                        if (error?.name && error.name === "ValidationError") {
                            return res.status(400).json({message: 'INVALID FORM.'});
                        }
                        // console.log("ERROR PUT /api/books/:id");
                        res.status(500).json({message: 'INTERNAL SERVER ERROR'});
                    });
            }
        }).catch((error) => {
            // console.log("ERROR PUT /api/books/:id");
            res.status(500).json({message: 'INTERNAL SERVER ERROR'})
        });
}



// delete a book
exports.deleteBook = (req, res, next) => {
    Book.findOne({_id: req.params.id})
        .then((book) => {
            if (!book) {
                return res.status(404).json({message: 'BOOK NOT FOUND.'});
            }
            if (book.userId != req.auth.userId) {
                return res.status(401).json({message : 'NOT AUTHORIZED.'});
            }
            
            const filename = book.imageUrl.split('/images/')[1];
            fs.unlink(`images/${filename}`, (err) => {
                if (err) {
                    // console.log("ERROR DELETE /api/books/:id");
                    return res.status(500).json({message: 'INTERNAL SERVER ERROR'});
                }
                
                Book.deleteOne({ _id: req.params.id})
                    .then(() => {
                        res.status(200).json({message: 'Objet supprimé !'});
                    }).catch(error => {
                        // console.log("ERROR DELETE /api/books/:id");
                        res.status(500).json({message: 'INTERNAL SERVER ERROR'});
                    });
            });
        }).catch(error => {
            // console.log("ERROR DELETE /api/books/:id");
            res.status(500).json({message: 'INTERNAL SERVER ERROR'});
        });
}

// create a grade
exports.createRating = (req, res, next) => {
    if (!req?.body || !req.body?.rating || !isFinite(req.body.rating) || req.body.rating < 0 || req.body.rating > 5) {
        return res.status(400).json({message: 'INVALID FORM.'});
    }

    try {
        Book.findOne({_id: req.params.id})
            .then((book) => {
                if (!book) {
                    return res.status(404).json({message: 'BOOK NOT FOUND.'});
                }
                if (book.ratings.find(userId => userId === req.auth.userId)) {
                    return res.status(403).json({message: 'YOU CANNOT RATE TWICE.'}); // CURL
                }

                book.ratings.push({userId: req.auth.userId, grade: req.body.rating });

                const averageRating = book.ratings.reduce((sum, rating) => sum + rating.grade, 0) / book.ratings.length;
                book.averageRating = parseFloat(averageRating.toFixed(2));

                book.save()
                    .then((book) => { res.status(200).json(book) })
                    .catch((error) => {
                        //console.log("ERROR POST /api/books/:id/rating");
                        res.status(500).json({message: 'INTERNAL SERVER ERROR'});
                    });
            }).catch((error) => {
                //console.log("ERROR POST /api/books/:id/rating");
                res.status(500).json({message: 'INTERNAL SERVER ERROR'});
            });
    } catch (error) {
        //console.log("ERROR POST /api/books/:id/rating");
        res.status(500).json({message: 'INTERNAL SERVER ERROR'});
    }
}




