"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const fs_1 = __importDefault(require("fs"));
const app = (0, express_1.default)();
const PORT = 3000;
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
const storage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "public/");
    },
    filename: function (req, file, cb) {
        // Extração da extensão do arquivo original:
        const extensaoArquivo = file.originalname.split(".")[1];
        // Cria um código randômico que será o nome do arquivo
        const novoNomeArquivo = file.originalname;
        // Indica o novo nome do arquivo:
        cb(null, `${file.originalname}`);
    },
});
const upload = (0, multer_1.default)({ storage });
(0, dotenv_1.configDotenv)();
const secret = process.env.AUTH_SECRET;
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
    console.log("file: ", file === null || file === void 0 ? void 0 : file.originalname);
    res.send("File uploaded");
});
app.get("/files", checkSecretMiddleware, (req, res) => {
    const files = fs_1.default.readdirSync("public");
    const formattedFiles = [];
    for (const file of files) {
        const fileStats = fs_1.default.statSync(`public/${file}`);
        const sizeInMb = fileStats.size / 1000000.0;
        formattedFiles.push({
            name: file,
            size: `${sizeInMb.toFixed(2)} MB`,
            duration: 0,
        });
    }
    res.send(formattedFiles);
});
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
