const express = require("express");
const router = express.Router();
const uid2 = require("uid2"); // Sert à créer des string aléatoires
const SHA256 = require("crypto-js/sha256"); // Sert à hasher
const encBase64 = require("crypto-js/enc-base64"); // Sert à transformer l'encryptage en string

const User = require("../models/User");

// On ajoute un utilisateur à la table user
router.post("/user/signup", async (req, res) => {
  try {
    // Vérifier si le nom d'utilisateur est renseigné
    //if (!req.body.username || !req.body.email || !req.body.password) permet de verifier si y'a un username, emai et passeword
    if (!req.body.username) {
      return res.status(400).json({
        message: "Username is required",
      });
    }

    // Verifie si un le username existe déja en BDD
    const usernameExiste = await User.findOne({
      "account.username": req.body.username,
    });
    if (usernameExiste) {
      return res.status(400).json({
        message: "Username already exists",
      });
    }

    // Verifie si l'email existe déja en BDD
    const emailExiste = await User.findOne({ email: req.body.email });
    if (emailExiste) {
      return res.status(409).json({
        message: "Email already use",
      });
    }
    //---------------- SECU MDP -----------------

    // Générer un salt aléatoire
    const salt = uid2(16);

    // Hasher le mot de passe combiné avec le sel
    const hash = SHA256(req.body.password + salt).toString(encBase64);

    // Générer un token d'authentification
    const token = uid2(32); // Génère une chaîne aléatoire de 32 caractères
    //console.log(salt, hash, token);

    //---------------- CREATION USER -----------------

    // Créer un nouvel utilisateur avec le nom d'utilisateur, l'email,
    const existingUser = await User.findOne({ email: req.body.email });
    if (!existingUser) {
      // générer un salt :
      const salt = uid2(16);
      // générer un hash
      const hash = SHA256(req.body.password + salt).toString(encBase64);
      const token = uid2(32);

      const newUser = new User({
        email: req.body.email,
        account: {
          username: req.body.username,
        },
        newsletter: req.body.newsletter,
        token: token,
        hash: hash,
        salt: salt,
      });

      await newUser.save();

      const responseObject = {
        _id: newUser._id,
        token: newUser.token,
        account: {
          username: newUser.account.username,
        },
      };

      return res.status(201).json(responseObject);
    } else {
      return res.status(409).json("Cet email est déjà utilisé");
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

//---------------- PARTIE LOGIN USER -----------------

// On ajoute un utilisateur à la table user
router.post("/user/login", async (req, res) => {
  try {
    // on doit recuperer le salt et la hash du user correspondant au mail
    const userFound = await User.findOne({ email: req.body.email });

    //on va rajouter le salt recupérer dans la BDD et hash le tout et comparé le nouveau has avec celui en BDD
    if (!userFound) {
      return res.status(401).json("Email ou mot de passe incorrect");
    }
    const newHash = SHA256(req.body.password + userFound.salt).toString(
      encBase64
    );
    // si le user est différent de user => message erreur
    if (newHash === userFound.hash) {
      const responseObject = {
        _id: userFound._id,
        token: userFound.token,
        account: {
          username: userFound.account.username,
        },
      };
      return res.status(200).json(responseObject);
    } else {
      return res.status(200).json({ message: "Wrong Password or User Exist" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
