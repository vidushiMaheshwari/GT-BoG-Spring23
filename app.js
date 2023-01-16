import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import {
  doc,
  setDoc,
  query,
  collection,
  getDocs,
  where,
  getDoc,
  updateDoc,
  collectionGroup,
  Timestamp,
} from "firebase/firestore";
import { db } from "./db.js";
import bodyParser from "body-parser";
import { FirebaseError } from "firebase/app";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { validateToken, getQueries, collName } from "./helper.js";
import { multer, uploadHandler } from "./storage.js";
import session from "express-session";

dotenv.config();
const app = express();
const APP_PORT = 5000;
app.use(cors({ origin: true }));
app.use(
  session({ resave: false, secret: "s", saveUninitialized: false })
);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;
const SALT_ROUNDS = process.env.SALT_ROUNDS;

let lastPageUser = null; // used for pagination
let lastPageAnimal = null;
let lastPageTrain = null;

app.get("/", (req, res) => {
  res.json({ Hello: "World" });
});

app.get("/api/health", (req, res) => {
  res.json({ healthy: true });
});

app.post("/api/user", async (req, res) => {
  try {
    const data = req.body;
    if (!data._id) {
      res.status(400).send("Invalid Input");
      return;
    }
    if (Object.keys(data).includes("password")) {
      data.password = bcrypt.hashSync(data.password, bcrypt.genSaltSync(SALT_ROUNDS));
    }

    const docSnap = await getDoc(doc(db, collName.USER, data._id));
    if (docSnap.exists()) {
      res
        .status(400)
        .send("Please choose a different id, as this is already occupied");
      return;
    }

    await setDoc(doc(db, "User", data._id), data);
    res.status(200).send("Success");
    return;
  } catch (error) {
    if (error instanceof FirebaseError) {
      res.status(400).send("Invalid input");
    } else {
      res.status(500).send(error.message);
    }
  }
});

app.post("/api/animal", async (req, res) => {
  try {
    const value = validateToken(req);
    if (!value) {
      res.status(403).send("Please Log In. Token expired.");
      return;
    }

    let data = req.body;
    if (!data._id) {
      res.status(400).send("Invalid Input");
    }
    data["owner"] = value._id;
    if (data.dateOfBirth) {
      data["dateOfBirth"] = new Date(new Date(data.dateOfBirth).toDateString());
    }

    const docRef = doc(
      db,
      `${collName.USER}/${data.owner}/${collName.ANIMAL}/${data._id}`
    );
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      res
        .status(400)
        .send(
          "Please choose a different id, you already have a animal with this id"
        );
      return;
    }

    await setDoc(docRef, data);
    res.status(200).send("Success");
    return;
  } catch (error) {
    if (error instanceof FirebaseError) {
      res.status(400).send(error.message);
    } else {
      res.status(500).send(error.message);
    }
  }
});

app.post("/api/training", async (req, res) => {
  try {
    const decode = validateToken(req);
    if (!decode) {
      res.status(403).send("Please Log In");
      return;
    }

    let data = req.body;
    data["owner"] = decode._id;

    if (!data.date) {
      new FirebaseError();
    }

    data["date"] = new Date(new Date(data.date).toDateString());
    let docRef = doc(db,
      `${collName.USER}/${data.owner}/${collName.ANIMAL}/${data.animal}`);
    getDoc(docRef).then((docSnap) => {
      if (!docSnap.exists()) {
        res.status(400).send("The given animal id doesn't exist. Please chose another");
        return;
      }

      docRef = doc(
        db,
        `${collName.USER}/${data.owner}/${collName.ANIMAL}/${data.animal}/${collName.TRAIN}/${data._id}`
      );
      getDoc(docRef).then(async (docSnap) => {
        if (docSnap.exists()) {
          res
            .status(400)
            .send(
              "Please choose a different id, as there is already a traiing log with this id"
            );
          return;
        }

          await setDoc(docRef, data);
          res.status(200).send("Success");
          return;
      });
    })

  } catch (error) {
    if (error instanceof FirebaseError) {
      res.status(400).send("Invalid input");
    } else {
      res.status(500).send(error.message);
    }
  }
});

app.get("/api/admin/users", async (req, res) => {
  try {
    let returnJson = {};
    const lim = (req.body && req.body.lim) ? (req.body.lim) : 1;

    const query = getQueries(lastPageUser, collection(db, collName.USER), lim, "lastName")

    const docSnaps = await getDocs(query);
    docSnaps.forEach((doc) => {
      returnJson[doc.id] = {};
      for (let key in doc.data()) {
        if (key != "password") {
          returnJson[doc.id][key] = doc.data()[key];
        }
      }
    });

    lastPageUser = docSnaps.docs[docSnaps.docs.length - 1];
    res.status(200).json(returnJson);
  } catch (error) {
    res.status(400);
  }
});

app.get("/api/admin/animals", async (req, res) => {
  try {
    let returnJSON = {};
    const lim = req.body && req.body.lim ? req.body.lim : 1;

    const q = getQueries(lastPageAnimal, collectionGroup(db, `${collName.ANIMAL}`), lim, 'hoursTrained');

    const docSnaps = await getDocs(q);
    let i = 0;
    docSnaps.forEach((doc) => {
      let newJson = {};
      for (let key in doc.data()) {
        if (key === 'dateOfBirth') {
          newJson[key] = new Date(doc.data()[key]).toDateString();
        } else {
          newJson[key] = doc.data()[key];
        }
      }
      returnJSON[i] = newJson;
      i += 1;
    });

    lastPageAnimal = docSnaps.docs[docSnaps.docs.length - 1];

    res.status(200).send(returnJSON);
    return;

  } catch (error) {
    res.status(400).send(error.message);
  }
});

app.get("/api/admin/training", async (req, res) => {
  try {
    let returnJSON = {};
    const lim = req.body && req.body.lim ? req.body.lim : 1;

    const query = getQueries(lastPageTrain, collectionGroup(db, `${collName.TRAIN}`) , lim, 'hours');
    const docSnaps = await getDocs(query);
    let i = 0;
    docSnaps.forEach((doc) => {
      let newJson = {};
      for (let key in doc.data()) {
        if (key === 'date') {
          newJson[key] = new Date(doc.data()[key].seconds*1000).toDateString();
        } else {
          newJson[key] = doc.data()[key];
        }
      }
      returnJSON[i] = newJson;
      i += 1;
    });

    lastPageTrain = docSnaps.docs[docSnaps.docs.length - 1];
    res.status(200).send(returnJSON);
  } catch (error) {
    res.status(400).send(error.message);
  }
});

app.post("/api/user/login", async (req, res) => {
  try {
    const data = req.body;
    const q = query(collection(db, collName.USER), where("email", "==", data.email));
    let found = false;
    const snapShot = await getDocs(q);
    snapShot.forEach((doc) => {
      if (bcrypt.compareSync(data.password, doc.data().password) && !found) {
        found = true;
        req.session.context = doc.data();
        res.redirect("/api/user/verify");
        return;
      }
    });
    if (!found) {
      res.status(403).send("Invalid combination");
      return;
    }
  } catch (error) {
    res.status(400).send(error.message);
    return;
  }
});

app.use("/api/user/verify", (req, res) => {
  try {
    const token = jwt.sign(req.session.context, `${JWT_SECRET_KEY}`, {
      expiresIn: "1h",
    });
    res.status(200).json({ success: true, data: { token: token } });
    return;
  } catch (error) {
    res.status(400).send(error.message);
    return;
  }
});

app.post("/api/file/upload", multer.single("file"), async (req, res) => {
  try {
    const value = validateToken(req);
    if (!value) {
      res.status(403).send("Please Log In. Token expired.");
      return;
    }

    if (req.file == null) {
      res.status(400).send("Insuffient data :(");
      return;
    }

    const ids = req.body;

    let docRef;
    let propertyName;
    let fileName;
    const fileType = req.file.mimetype.split('/')[0];

    if (ids.training_id != null) {
      if (fileType !== "video") {
        res.status(200).send("Please upload a video file");
        return;
      }
      if (ids.animal_id) {
        docRef = doc(
          db,
          `${collName.USER}/${value._id}/${collName.ANIMAL}/${ids.animal_id}/${collName.TRAIN}/${ids.training_id}`
        );
        propertyName = "trainingLogVideo";
        fileName = `${value._id}_${ids.animal_id}_${ids.training_id}`;
      } else {
        res
          .status(400)
          .send(
            "Please put appropriate animal_id for the corresponding training video"
          );
      }
    } else if (ids.animal_id != null) {
              if (fileType !== "image") {
                res.status(200).send("Please upload a image file");
                return;
              }
      docRef = doc(
        db,
        `${collName.USER}/${value._id}/${collName.ANIMAL}/${ids.animal_id}`
      );
      propertyName = "profilePicture";
      fileName = `${value._id}_${ids.animal_id}`;
    } else {
              if (fileType !== "image") {
                res.status(200).send("Please upload a image file");
                return;
              }
      docRef = doc(db, collName.USER, value._id);
      propertyName = "profilePicture";
      fileName = `${value._id}`;
    }

    uploadHandler(req.file, fileName)
      .then(async (val) => {
        await updateDoc(docRef, { [propertyName]: val });
        res.status(200).send("done and done :)");
        return;
      })
      .catch((error) => {
        res.status(400).send(error);
        return;
      });
  } catch (error) {
    res.status(400).send(error.message);
    return;
  }
});

app.listen(APP_PORT, () => {
  console.log(`api listening at http://localhost:${APP_PORT}`);
});
