require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use("/public", express.static(`${process.cwd()}/public`));

const uri = `mongodb+srv://admin-ilkin:${process.env.PW}@cluster0.fy0c2.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
mongoose.connect(uri);

const urlSchema = new mongoose.Schema({
   original: { type: String, required: true },
   short: Number,
});

const Url = mongoose.model("Url", urlSchema);

app.get("/", function (req, res) {
   res.sendFile(process.cwd() + "/views/index.html");
});

app.get("/api/hello", function (req, res) {
   res.json({ greeting: "hello API" });
});

let responseObject = {};

app.post(
   "/api/shorturl",
   bodyParser.urlencoded({ extended: false }),
   (req, res) => {
      let inputUrl = req.body["url"];

      let urlRegex = new RegExp(
         /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/gi
      );

      if (!inputUrl.match(urlRegex)) {
         res.json({ error: "invalid url" });
         return;
      }

      responseObject["original_url"] = inputUrl;

      let inputShort = 1;

      Url.findOne({})
         .sort({ short: "desc" })
         .exec((err, result) => {
            if (!err && result != undefined) {
               inputShort = result.short + 1;
            }
            if (!err) {
               Url.findOneAndUpdate(
                  { original: inputUrl },
                  { original: inputUrl, short: inputShort },
                  { new: true, upsert: true },
                  (err, savedUrl) => {
                     if (!err) {
                        responseObject["short_url"] = savedUrl.short;
                        res.json(responseObject);
                     }
                  }
               );
            }
         });
   }
);

app.get("/api/shorturl/:input", (req, res) => {
   let input = req.params.input;

   Url.findOne({ short: input }, (err, result) => {
      if (!err && result != undefined) {
         res.redirect(result.original);
      } else {
         res.json("URL not Found");
      }
   });
});

app.listen(port, function () {
   console.log(`Listening on port ${port}`);
});
