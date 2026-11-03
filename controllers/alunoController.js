import Aluno from "../models/aluno.js";

const PROJECAO = { _id: 0 };

function texto(valor) {
    if (typeof valor === "number") valor = String(valor);
    if (typeof valor !== "string") return null;
    const limpo = valor.trim();
    return limpo === "" ? null : limpo;
}

function normalizarCodigo(codigo) {
    const valor = texto(codigo);
    return valor ? valor.toUpperCase() : null;
}

function escaparRegex(valor) {
    return valor.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function validarDisciplina(dados) {
    if (!dados || typeof dados !== "object" || Array.isArray(dados)) {
        return { erro: "Disciplina inválida" };
    }

    const codigo = normalizarCodigo(dados.codigo);
    const nome = texto(dados.nome);
    const professor = texto(dados.professor);

    if (!codigo) return { erro: "O campo 'codigo' da disciplina é obrigatório" };
    if (!nome) return { erro: "O campo 'nome' da disciplina é obrigatório" };
    if (!professor) return { erro: "O campo 'professor' da disciplina é obrigatório" };

    return { disciplina: { codigo, nome, professor } };
}

async function alunoExiste(ra) {
    return (await Aluno.exists({ ra })) !== null;
}

export async function listarAlunos(req, res) {
    const filtro = {};

    if (req.query.nome !== undefined) {
        const nome = texto(req.query.nome);
        if (!nome) {
            return res.status(400).json({ erro: "O parâmetro 'nome' não pode ser vazio" });
        }
        filtro.nome = { $regex: escaparRegex(nome), $options: "i" };
    }

    if (req.query.disciplina !== undefined) {
        const codigo = normalizarCodigo(req.query.disciplina);
        if (!codigo) {
            return res.status(400).json({ erro: "O parâmetro 'disciplina' não pode ser vazio" });
        }
        filtro["disciplinas.codigo"] = codigo;
    }

    const alunos = await Aluno.find(filtro, PROJECAO).sort({ ra: 1 }).lean();
    return res.status(200).json(alunos);
}

export async function buscarAluno(req, res) {
    const aluno = await Aluno.findOne({ ra: req.params.ra }, PROJECAO).lean();
    if (!aluno) {
        return res.status(404).json({ erro: "Aluno não encontrado" });
    }
    return res.status(200).json(aluno);
}

export async function listarDisciplinas(req, res) {
    const aluno = await Aluno.findOne({ ra: req.params.ra }, { _id: 0, disciplinas: 1 }).lean();
    if (!aluno) {
        return res.status(404).json({ erro: "Aluno não encontrado" });
    }
    return res.status(200).json(aluno.disciplinas);
}

export async function resumoAluno(req, res) {
    const aluno = await Aluno.findOne({ ra: req.params.ra }, PROJECAO).lean();
    if (!aluno) {
        return res.status(404).json({ erro: "Aluno não encontrado" });
    }

    const professores = [...new Set(aluno.disciplinas.map((d) => d.professor))];

    return res.status(200).json({
        ra: aluno.ra,
        nome: aluno.nome,
        totalDisciplinas: aluno.disciplinas.length,
        professores,
    });
}

export async function cadastrarAluno(req, res) {
    const body = req.body ?? {};
    const ra = texto(body.ra);
    const nome = texto(body.nome);

    if (!ra) return res.status(400).json({ erro: "O campo 'ra' é obrigatório" });
    if (!nome) return res.status(400).json({ erro: "O campo 'nome' é obrigatório" });

    let disciplinas = [];
    if (body.disciplinas !== undefined) {
        if (!Array.isArray(body.disciplinas)) {
            return res.status(400).json({ erro: "O campo 'disciplinas' deve ser uma lista" });
        }

        const codigos = new Set();
        for (const item of body.disciplinas) {
            const { erro, disciplina } = validarDisciplina(item);
            if (erro) return res.status(400).json({ erro });

            if (codigos.has(disciplina.codigo)) {
                return res.status(409).json({ erro: `Disciplina duplicada: ${disciplina.codigo}` });
            }
            codigos.add(disciplina.codigo);
            disciplinas.push(disciplina);
        }
    }

    if (await alunoExiste(ra)) {
        return res.status(409).json({ erro: "RA já cadastrado" });
    }

    const aluno = await Aluno.create({ ra, nome, disciplinas });
    return res.status(201).json(aluno.toJSON());
}

export async function atualizarAluno(req, res) {
    const nome = texto(req.body?.nome);
    if (!nome) {
        return res.status(400).json({ erro: "O campo 'nome' é obrigatório" });
    }

    const aluno = await Aluno.findOneAndUpdate(
        { ra: req.params.ra },
        { $set: { nome } },
        { returnDocument: "after", projection: PROJECAO, lean: true }
    );

    if (!aluno) {
        return res.status(404).json({ erro: "Aluno não encontrado" });
    }
    return res.status(200).json(aluno);
}

export async function excluirAluno(req, res) {
    const aluno = await Aluno.findOneAndDelete({ ra: req.params.ra }, { projection: PROJECAO, lean: true });
    if (!aluno) {
        return res.status(404).json({ erro: "Aluno não encontrado" });
    }
    return res.status(200).json({ mensagem: "Aluno excluído com sucesso", aluno });
}

export async function adicionarDisciplina(req, res) {
    const { ra } = req.params;
    const { erro, disciplina } = validarDisciplina(req.body);
    if (erro) return res.status(400).json({ erro });

    const aluno = await Aluno.findOneAndUpdate(
        { ra, "disciplinas.codigo": { $ne: disciplina.codigo } },
        { $push: { disciplinas: disciplina } },
        { returnDocument: "after", projection: PROJECAO, lean: true }
    );

    if (!aluno) {
        if (!(await alunoExiste(ra))) {
            return res.status(404).json({ erro: "Aluno não encontrado" });
        }
        return res.status(409).json({ erro: "Disciplina já cadastrada para este aluno" });
    }

    return res.status(201).json({ mensagem: "Disciplina adicionada com sucesso", aluno });
}

export async function atualizarDisciplina(req, res) {
    const { ra } = req.params;
    const codigo = normalizarCodigo(req.params.codigo);
    const body = req.body ?? {};

    const alteracoes = {};
    for (const campo of ["nome", "professor"]) {
        if (body[campo] !== undefined) {
            const valor = texto(body[campo]);
            if (!valor) {
                return res.status(400).json({ erro: `O campo '${campo}' da disciplina não pode ser vazio` });
            }
            alteracoes[`disciplinas.$.${campo}`] = valor;
        }
    }

    if (Object.keys(alteracoes).length === 0) {
        return res.status(400).json({ erro: "Informe 'nome' e/ou 'professor' para atualizar a disciplina" });
    }

    const aluno = await Aluno.findOneAndUpdate(
        { ra, "disciplinas.codigo": codigo },
        { $set: alteracoes },
        { returnDocument: "after", projection: PROJECAO, lean: true }
    );

    if (!aluno) {
        if (!(await alunoExiste(ra))) {
            return res.status(404).json({ erro: "Aluno não encontrado" });
        }
        return res.status(404).json({ erro: "Disciplina não encontrada" });
    }

    const disciplina = aluno.disciplinas.find((d) => d.codigo === codigo);
    return res.status(200).json({ mensagem: "Disciplina atualizada com sucesso", disciplina });
}

export async function removerDisciplina(req, res) {
    const { ra } = req.params;
    const codigo = normalizarCodigo(req.params.codigo);

    const aluno = await Aluno.findOneAndUpdate(
        { ra, "disciplinas.codigo": codigo },
        { $pull: { disciplinas: { codigo } } },
        { returnDocument: "after", projection: PROJECAO, lean: true }
    );

    if (!aluno) {
        if (!(await alunoExiste(ra))) {
            return res.status(404).json({ erro: "Aluno não encontrado" });
        }
        return res.status(404).json({ erro: "Disciplina não encontrada" });
    }

    return res.status(200).json({ mensagem: "Disciplina removida com sucesso", aluno });
}
