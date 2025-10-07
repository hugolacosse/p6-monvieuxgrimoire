const sharp = require("sharp");
 
module.exports = async (req, res, next) => {
    try {
        if (!req?.file) {
            return next();
        }
        const { buffer, originalname } = req.file;

        const name = originalname.split(' ').join('_');
        const ref = `${Date.now()}-${name}.webp`;

        await sharp(buffer)
            .resize(800, 800, {
                fit: sharp.fit.inside,
                withoutEnlargement: true
            })
            .webp({ quality: 20 })
            .toFile("./images/" + ref);

        req.file.filename = ref;
        next();
     } catch(error) {
        res.status(500).json({error});
     }
 };