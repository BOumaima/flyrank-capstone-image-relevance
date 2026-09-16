import express from "express";
import postRoutes from "./routes/postRoutes.js";

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(postRoutes);

app.get("/health", (req, res) => {
    res.json({ status: "ok" });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});