import "dotenv/config";
import express from "express";
import { conectarBanco } from "./config/database.js";
import alunoRoutes from "./routes/alunoRoutes.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get("/", (_req, res) => {
    res.status(200).json({ mensagem: "API de Alunos e Disciplinas", rotas: "/alunos" });
});

app.use("/alunos", alunoRoutes);

app.use((_req, res) => {
    res.status(404).json({ erro: "Rota não encontrada" });
});

app.use((err, _req, res, _next) => {
    if (err.type === "entity.parse.failed") {
        return res.status(400).json({ erro: "JSON inválido no corpo da requisição" });
    }
    if (err.code === 11000) {
        return res.status(409).json({ erro: "RA já cadastrado" });
    }
    if (err.name === "ValidationError") {
        const mensagem = Object.values(err.errors)[0]?.message || "Dados inválidos";
        return res.status(400).json({ erro: mensagem });
    }

    console.error(err);
    return res.status(500).json({ erro: "Erro interno do servidor" });
});

conectarBanco()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    })
    .catch((error) => {
        console.error("Erro ao conectar ao MongoDB", error);
        process.exit(1);
    });
