//const { log } = require("console");
const Thing = require("../models/Thing");
const fs = require("fs");

exports.createThing = (req, res, next) => {
  const thingObject = JSON.parse(req.body.book); //Récupération des params du Livre
  delete thingObject._id;
  delete thingObject.userId;
  //Création du nouveau livre
  const thing = new Thing({
    ...thingObject,
    userId: req.auth.userId,
    imageUrl: `${req.protocol}://${req.get("host")}/images/${
      req.file.filename
    }`,
  });

  thing
    .save() // Enregistrement du livre
    .then(() => {
      res.status(201).json({ message: "Objet enregistré !" });
    })
    .catch((error) => {
      res.status(400).json({ error });
    });
};

exports.getOneThing = (req, res, next) => {
  Thing.findOne({
    _id: req.params.id, //Trouver un livre précis
  })
    .then((thing) => {
      res.status(200).json(thing); // Envoi du livre trouver
    })
    .catch((error) => {
      res.status(404).json({
        error: error,
      });
    });
};

exports.bestBooks = async (req, res, next) => {
  try {
    // Trouver les 3 livres les mieux noté
    const bestBooks = await Thing.find().sort({ averageRating: -1 }).limit(3);
    // Envoi au front du classement
    res.status(200).json(bestBooks);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Une erreur s'est produite lors de la récupération du livre",
      err: err,
    });
  }
};

exports.modifyThing = async (req, res, next) => {
  const bookId = req.params.id; // Récuperation de l'ID du livre
  const book = await Thing.findById(bookId);
  let imageUrl = book.imageUrl;
  //Vérification de présence d'image dans l'envoi
  const thingObject = req.file
    ? {
        ...JSON.parse(req.body.book),
        imageUrl: `${req.protocol}://${req.get("host")}/images/${
          req.file.filename
        }`,
      }
    : { ...req.body };
  // Suppression de l'ancienne image si une nouvelle a été envoyé
  if (thingObject.imageUrl) {
    const filename = imageUrl.split("/images/")[1];
    fs.unlink(`images/${filename}`, (err) => {
      if (err) console.log(err);
      else {
        console.log("Image BDD suprimé");
      }
    });
  }

  delete thingObject._userId;
  Thing.findOne({ _id: req.params.id }) // Vérification de l'ID du livre
    .then((thing) => {
      if (thing.userId != req.auth.userId) {
        res.status(401).json({ message: "Not authorized" });
      } else {
        Thing.updateOne(
          { _id: req.params.id },
          { ...thingObject, _id: req.params.id } // Mise a jour des data
        )
          .then(() => res.status(200).json({ message: "Objet modifié!" }))
          .catch((error) => res.status(401).json({ error }));
      }
    })
    .catch((error) => {
      res.status(400).json({ error });
    });
};

exports.deleteThing = (req, res, next) => {
  Thing.findOne({ _id: req.params.id }) // Identification du livre
    .then((thing) => {
      if (thing.userId != req.auth.userId) {
        res.status(401).json({ message: "Not authorized" });
      } else {
        //Supression de l'image en local
        const filename = thing.imageUrl.split("/images/")[1];
        fs.unlink(`images/${filename}`, () => {
          Thing.deleteOne({ _id: req.params.id }) //Supression du livre
            .then(() => {
              res.status(200).json({ message: "Objet supprimé !" });
            })
            .catch((error) => res.status(401).json({ error }));
        });
      }
    })
    .catch((error) => {
      res.status(500).json({ error });
    });
};

exports.getAllStuff = (req, res, next) => {
  Thing.find()
    .then((things) => {
      res.status(200).json(things); // Envoi de tout les livres
    })
    .catch((error) => {
      res.status(400).json({
        error: error,
      });
    });
};

exports.rateBook = async (req, res) => {
  try {
    // Vérifier que le body contient une data
    if (!req.body) {
      return res
        .status(400)
        .json({ message: "Votre requête ne contient aucune note" });
    }
    // Extraire les data
    const { userId, rating } = req.body;
    const bookToRate = await Thing.findById(req.params.id);
    // Vérifier si l'utilisateur a déja noté le livre
    if (
      bookToRate.ratings.some((rating) => {
        return rating.userId === userId;
      })
    ) {
      res.status(400).json({ message: "Vous avez déjà noté ce livre" });
    }
    // Ajouté la nouvelle note
    bookToRate.ratings.push({ userId: userId, grade: rating });
    // Calculer averageRating
    const grades = bookToRate.ratings.map((rating) => rating.grade);
    const average =
      grades.reduce((total, grade) => total + grade, 0) / grades.length;
    bookToRate.averageRating = parseFloat(average.toFixed(1));
    // Actualisation du livre dans la BDD
    await bookToRate.save();
    res.status(200).json(bookToRate);
    console.log("note attibuer");
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Une erreur est survenue lors de la mise à jour de la note",
    });
  }
};
