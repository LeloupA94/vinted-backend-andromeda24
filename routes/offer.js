const express = require("express");
const router = express.Router();
const isAuthenticated = require("../middlewares/isAuthenticated");
const convertToBase64 = require("../utils/converToBase64");
const fileUpload = require("express-fileupload");
const Offer = require("../models/Offer");
const cloudinary = require("cloudinary").v2;

// On verifie si le user est loggé
router.post(
  "/offer/publish",
  isAuthenticated,
  fileUpload(),
  async (req, res) => {
    try {
      //console.log("ma route marche");
      const { title, description, price, condition, city, brand, size, color } =
        req.body;

      const picture = req.files.picture;

      const cloudinaryResponse = await cloudinary.uploader.upload(picture);

      const neWoffer = new Offer({
        product_name: title,
        product_description: description,
        product_price: price,
        product_details: [
          {
            MARQUE: brand,
          },
          {
            TAILLE: size,
          },
          {
            ÉTAT: condition,
          },
          {
            COULEUR: color,
          },
          {
            EMPLACEMENT: city,
          },
        ],
        product_image: cloudinaryResponse,
        owner: req.user,
      });
      await newOffer.save();
      await newOffer.populate("owner", "account");
      res.status(201).json(newOffer);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

router.get("/offers", async (req, res) => {
  try {
    //ici on affiche toutes les offres
    //console.log(req.query);
    const { title, priceMin, priceMax, sort, page } = req.query;
    const filters = {
      //product_name: new regExp(title, "i"),
      //product_price: { $gte: priceMin },
    };
    if (title) {
      filters.product_name = new regExp(title, "i");
    }

    if (priceMin) {
      filters.product_price = { $gte: priceMin };
    }

    if (priceMax) {
      if (priceMin) {
        filters.product_price.$lte = priceMax;
      } else {
        filters.product_price = { $lte: priceMax };
      }
    }
    const sorter = {};
    if (sort === "price-asc") {
      sorter.product_price = "asc";
    } else if (sort === "price-desc") {
      sorter.product_price = "desc";
    }

    let skip = 0;
    // 5 resultat par page. Page 1 => skip = 0 // page 2 => skip = 5 etc..
    if (page) {
      skip = (page - 1) * 5;
    }

    const offers = await Offer.find(filters)
      .sort(sorter)
      .skip(skip)
      .limit(5)
      .populate("owner", "account");

    const count = await Offer.countDocuments(filters);

    res.json({
      count: offers.length,
      offers: offers,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

//permet de trouver une offre avec son ID
router.get("/offers/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const offer = await Offer.findById(id);
    res.json(offer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
