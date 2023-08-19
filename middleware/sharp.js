const sharp = require("sharp");

const imageResizer = (req, res, next) => {
  if (!req.file) {
    console.log("pas d'image redimenssionner");
    return next();
  }

  const filePath = req.file.path;
  console.log("image redimensionner");

  sharp(filePath)
    .resize({ width: 400 })
    .toBuffer()
    .then((data) => {
      sharp(data)
        .toFile(filePath)
        .then(() => {
          next();
        })
        .catch((err) => {
          next(err);
        });
    })
    .catch((err) => {
      next(err);
    });
};

module.exports = {
  imageResizer,
};
