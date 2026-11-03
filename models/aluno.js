import mongoose from "mongoose";

const disciplinaSchema = new mongoose.Schema(
    {
        codigo: {
            type: String,
            required: [true, "O campo 'codigo' da disciplina é obrigatório"],
            trim: true,
            uppercase: true,
        },
        nome: {
            type: String,
            required: [true, "O campo 'nome' da disciplina é obrigatório"],
            trim: true,
        },
        professor: {
            type: String,
            required: [true, "O campo 'professor' da disciplina é obrigatório"],
            trim: true,
        },
    },
    { _id: false }
);

const alunoSchema = new mongoose.Schema(
    {
        ra: {
            type: String,
            required: [true, "O campo 'ra' é obrigatório"],
            unique: true,
            trim: true,
        },
        nome: {
            type: String,
            required: [true, "O campo 'nome' é obrigatório"],
            trim: true,
        },
        disciplinas: {
            type: [disciplinaSchema],
            default: [],
            validate: {
                validator: (disciplinas) => {
                    const codigos = disciplinas.map((d) => d.codigo);
                    return new Set(codigos).size === codigos.length;
                },
                message: "O aluno não pode possuir disciplinas com códigos repetidos",
            },
        },
    },
    {
        versionKey: false,
        toJSON: {
            transform: (_doc, ret) => {
                delete ret._id;
                return ret;
            },
        },
    }
);

const Aluno = mongoose.model("Aluno", alunoSchema, "alunos");

export default Aluno;
