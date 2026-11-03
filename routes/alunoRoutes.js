import { Router } from "express";
import {
    listarAlunos,
    buscarAluno,
    listarDisciplinas,
    resumoAluno,
    cadastrarAluno,
    atualizarAluno,
    excluirAluno,
    adicionarDisciplina,
    atualizarDisciplina,
    removerDisciplina,
} from "../controllers/alunoController.js";

const router = Router();

router.get("/", listarAlunos);               
router.post("/", cadastrarAluno);            
router.get("/:ra", buscarAluno);             
router.put("/:ra", atualizarAluno);          
router.delete("/:ra", excluirAluno);         
router.get("/:ra/resumo", resumoAluno);      

router.get("/:ra/disciplinas", listarDisciplinas);                 
router.post("/:ra/disciplinas", adicionarDisciplina);             
router.put("/:ra/disciplinas/:codigo", atualizarDisciplina);       
router.delete("/:ra/disciplinas/:codigo", removerDisciplina);      

export default router;
