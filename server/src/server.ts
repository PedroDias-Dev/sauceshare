import { configDotenv } from "dotenv";
import express from "express";
import multer from "multer";
import fs from "fs";

const app = express();
const PORT = 3333;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/");
  },
  filename: function (req, file, cb) {
    cb(null, `${file.originalname}`);
  },
});

const upload = multer({ storage });

configDotenv();

const secret = process.env.AUTH_SECRET;

const checkSecretMiddleware = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  const { authorization } = req.headers;

  if (authorization === secret) {
    next();
  } else {
    res.status(401).send("Not authorized");
  }
};

app.post(
  "/upload",
  checkSecretMiddleware,
  upload.single("file"),
  (req, res) => {
    const file = req.file;

    if (!file || file === undefined) {
      res.send("Please upload a file");
    }

    console.log("file: ", file?.originalname);
    res.send("File uploaded");
  }
);

app.get("/files", checkSecretMiddleware, (req, res) => {
  const files = fs.readdirSync("public");

  const formattedFiles = [];

  for (const file of files) {
    const fileStats = fs.statSync(`public/${file}`);
    const sizeInMb = fileStats.size / 1000000.0;

    formattedFiles.push({
      name: file,
      size: `${sizeInMb.toFixed(2)} MB`,
      duration: 0,
    });
  }

  res.send(formattedFiles);
});

app.get("/files/:name", checkSecretMiddleware, (req, res) => {
  const { name } = req.params;

  const file = fs.readFileSync(`public/${name}`);

  res.send(file);
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
