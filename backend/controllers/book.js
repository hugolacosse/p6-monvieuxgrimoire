const fs = require('fs');
const Book = require('../models/Book');

// create a book
exports.createBook = (req, res, next) => {
    if (!req.body?.book) {
        res.status(400).json({ error: "error"}); // CURL
        return ;
    }
    // tester tout les cas de: !req.body?.book 
    // verifier req.file
    // analyse le livre transformé en chaîne de caractères
    
    const bookObject = JSON.parse(req.body.book);

    delete bookObject._id;
    delete bookObject._userId;
    
    const book = new Book({
        ...bookObject,
        userId: req.auth.userId,
        ratings: [], // Spec: init rating to an empty array
        averageRating: 0, // Spec: init averageRating to 0
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    });
 
    book.save()
        .then(() => { res.status(201).json({message: 'Objet enregistré !'}) }) // CURL
        .catch(error => { res.status(500).json({ error })});
}

// get all books
exports.getBooks = (req, res, next) => {
    Book.find()
        .then((books) => { res.status(200).json(books) }) // CURL
        .catch((error) => { res.status(500).json({ error }) });
}

// get a book
exports.getBookById = (req, res, next) => {
    Book.findOne({_id: req.params.id})
        .then((book) => { res.status(200).json(book) }) // CURL (id is wrong == 404 ?)
        .catch((error) => { res.status(500).json({error}) });
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
            if (book.userId != req.auth.userId) {
                res.status(401).json({ message : 'Not authorized'});
            } else {
                if (req.file) {
                    const filename = book.imageUrl.split('/images/')[1];
                    fs.unlink(`images/${filename}`, () => {
                        Book.updateOne({ _id: req.params.id}, { ...bookObject, _id: req.params.id})
                            .then(() => { res.status(200).json({message: 'Objet modifié!'}) })
                            .catch(error => { res.status(500).json({ error }) });
                    })
                } else {
                    Book.updateOne({ _id: req.params.id}, { ...bookObject, _id: req.params.id})
                        .then(() => { res.status(200).json({message: 'Objet modifié!'}) })
                        .catch(error => { res.status(500).json({ error }) });
                }
           }
        }).catch((error) => {
            res.status(500).json({ error });
        });
}

// delete a book
exports.deleteBook = (req, res, next) => {
    Book.findOne({_id: req.params.id})
        .then((book) => {
           if (book.userId != req.auth.userId) {
               res.status(401).json({ message : 'Not authorized'});
           } else {
                const filename = book.imageUrl.split('/images/')[1];
                fs.unlink(`images/${filename}`, () => {
                    Book.deleteOne({ _id: req.params.id})
                        .then(() => {
                            res.status(200).json({message : 'Objet supprimé !'})
                        }).catch(error => {
                            res.status(401).json({ error })
                        });
                })
            }
        }).catch(error => {
            res.status(500).json({error})
        });
}

// create a grade
exports.createRating = (req, res, next) => {
    if (!req?.body || !req.body?.rating || !isFinite(req.body.rating)) {
        res.status(400).json({ message: 'Invalid form.'}); // CURL
        return ;   
    }
    // La note doit être comprise entre 0 et 5.
    if (req.body.rating < 0 || req.body.rating > 5) {
        res.status(400).json({ message: 'Invalid form.'}); // CURL
        return ;
    }
    

    Book.findOne({_id: req.params.id})
        .then((book) => {
            if (book.ratings.find(userId => userId === req.auth.userId)) {
                res.status(403).json({ message: 'Vous avez déja noté ce livre.'}); // CURL
                return ;
            }
            book.ratings.push({userId: req.auth.userId, grade: req.body.rating });

            const averageRating = book.ratings.reduce((sum, rating) => sum + rating.grade, 0) / book.ratings.length;
            book.averageRating = parseFloat(averageRating.toFixed(2));
        
            // expected result: { book: object }
            book.save()
                .then((book) => { res.status(201).json({ book }) })
                .catch((error) => { res.status(500).json({ error }) });
        }).catch((error) => {
            // CURL
            res.status(404).json({error})
        });
}

// get best rated books
exports.getBestrating = (req, res, next) => {
    res.status(500).json({error})

    // Return an Array of books
    // Renvoie un tableau des 3 livres de la base de
    // données ayant la meilleure note moyenne.

}

// TODO: LOG ERROR + change error response message ?
//      - delete
//      - getBookById
//      - getBooks

// TODO: Verifier le cahier des charges
