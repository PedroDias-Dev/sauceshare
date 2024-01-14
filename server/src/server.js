"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const fs_1 = __importDefault(require("fs"));
const lib_storage_1 = require("@aws-sdk/lib-storage");
const client_s3_1 = require("@aws-sdk/client-s3");
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const app = (0, express_1.default)();
const PORT = 3333;
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
const storage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "public/");
    },
    filename: function (req, file, cb) {
        cb(null, `${file.originalname}`);
    },
});
const upload = (0, multer_1.default)({ storage });
(0, dotenv_1.configDotenv)();
const secret = process.env.AUTH_SECRET;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const region = process.env.S3_REGION;
const Bucket = process.env.S3_BUCKET;
const s3 = new aws_sdk_1.default.S3({
    credentials: {
        accessKeyId,
        secretAccessKey,
    },
    region,
});
const checkSecretMiddleware = (req, res, next) => {
    const { authorization } = req.headers;
    if (authorization === secret) {
        next();
    }
    else {
        res.status(401).send("Not authorized");
    }
};
app.post("/upload", checkSecretMiddleware, upload.single("file"), (req, res) => {
    const file = req.file;
    if (!file || file === undefined) {
        res.send("Please upload a file");
    }
    const fileBody = fs_1.default.readFileSync(file ? `public/${file.originalname}` : "");
    new lib_storage_1.Upload({
        client: new client_s3_1.S3Client({
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
    console.log("file: ", file === null || file === void 0 ? void 0 : file.originalname);
    res.send("File uploaded");
});
app.get("/files", checkSecretMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // get all files from s3
    const params = {
        Bucket: Bucket,
        Delimiter: '/',
        Prefix: '',
    };
    const data = yield s3.listObjects(params).promise();
    if (!data) {
        res.send("No files found");
    }
    const files = [];
    for (let index = 1; data['Contents'] && index < data['Contents'].length; index++) {
        files.push(Object.assign(Object.assign({}, data['Contents'][index]), { Location: `https://${Bucket}.s3.${region}.amazonaws.com/${data['Contents'][index].Key}` }));
    }
    res.send(files);
}));
app.get("/files/:name", checkSecretMiddleware, (req, res) => {
    const { name } = req.params;
    const file = fs_1.default.readFileSync(`public/${name}`);
    res.send(file);
});
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
