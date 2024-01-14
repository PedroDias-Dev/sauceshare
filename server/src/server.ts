import { configDotenv } from "dotenv";
import express from "express";
import multer from "multer";
import fs from "fs";
import { Upload } from "@aws-sdk/lib-storage";
import { S3Client } from "@aws-sdk/client-s3";
import AWS from "aws-sdk";

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

const accessKeyId = process.env.AWS_ACCESS_KEY_ID as any;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY as any;
const region = process.env.S3_REGION as any;
const Bucket = process.env.S3_BUCKET as any;

const s3 = new AWS.S3({
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
  region,
});

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

    const fileBody = fs.readFileSync(file ? `public/${file.originalname}` : "");

    new Upload({
      client: new S3Client({
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
        region,
      }),
      params: {
        ACL: "public-read",
        Bucket,
        Key: `${file ? file.originalname : ""}`,
        Body: fileBody,
      },
      tags: [], // optional tags
      queueSize: 4, // optional concurrency configuration
      partSize: 1024 * 1024 * 5, // optional size of each part, in bytes, at least 5MB
      leavePartsOnError: false, // optional manually handle dropped parts
    })
      .done()
      .then((data) => {
        console.log(data);
      })
      .catch((err) => {
        console.log(err);
      });

    console.log("file: ", file?.originalname);
    res.send("File uploaded");
  }
);

app.get("/files", checkSecretMiddleware, async (req, res) => {
  // get all files from s3
  const params = {
    Bucket: Bucket,
    Delimiter: '/',
    Prefix: '',
  };

  const data = await s3.listObjects(params).promise();

  if (!data) {
    res.send("No files found");
  }

  const files = [];
  for (let index = 1; data['Contents'] && index < data['Contents'].length; index++) {
    files.push({
      ...data['Contents'][index],
      Location: `https://${Bucket}.s3.${region}.amazonaws.com/${data['Contents'][index].Key}`
    });
  }

  res.send(files);
});

app.get("/files/:name", checkSecretMiddleware, (req, res) => {
  const { name } = req.params;

  const file = fs.readFileSync(`public/${name}`);

  res.send(file);
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
