import "dotenv/config";
import { conectarBanco, desconectarBanco } from "./config/database.js";
import Aluno from "./models/aluno.js";

const alunosIniciais = [
    {
        ra: "1",
        nome: "João",
        disciplinas: [
            { codigo: "MAT101", nome: "Matemática", professor: "Prof. Carlos" },
            { codigo: "HIS101", nome: "História", professor: "Prof. Ana" },
        ],
    },
    {
        ra: "2",
        nome: "Maria",
        disciplinas: [
            { codigo: "MAT101", nome: "Matemática", professor: "Prof. Carlos" },
            { codigo: "FIS101", nome: "Física", professor: "Prof. Carlos" },
            { codigo: "POR101", nome: "Português", professor: "Prof. Beatriz" },
        ],
    },
    {
        ra: "3",
        nome: "Pedro",
        disciplinas: [
            { codigo: "HIS101", nome: "História", professor: "Prof. Ana" },
            { codigo: "GEO101", nome: "Geografia", professor: "Prof. Marcos" },
        ],
    },
    {
        ra: "4",
        nome: "Joana",
        disciplinas: [
            { codigo: "POR101", nome: "Português", professor: "Prof. Beatriz" },
        ],
    },
];

const resetar = process.argv.includes("--reset");

try {
    await conectarBanco();

    if (resetar) {
        await Aluno.deleteMany({});
        console.log("Coleção 'alunos' limpa.");
    }
    await Aluno.syncIndexes(); 

    const existentes = new Set(await Aluno.distinct("ra"));
    const novos = alunosIniciais.filter((a) => !existentes.has(a.ra));
    if (novos.length) await Aluno.insertMany(novos);
    console.log(`${novos.length} aluno(s) inserido(s); ${alunosIniciais.length - novos.length} já existia(m).`);
} catch (error) {
    console.error("Erro ao popular o banco:", error);
    process.exitCode = 1;
} finally {
    await desconectarBanco();
}
