const express = require("express");
const path = require("path");
const app = express();

app.use(express.static(path.join(__dirname, "www")));
app.use(express.static(path.join(__dirname, "../build")));

app.listen(8080, () => console.log("server listening on port", 8080));