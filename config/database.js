import mongoose from "mongoose";

export async function conectarBanco() {
    const uri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_DB || "escola";

    if (!uri) {
        throw new Error("Variável MONGODB_URI não definida no arquivo .env");
    }

    await mongoose.connect(uri, { dbName });
    console.log(`Conexão com o MongoDB estabelecida com sucesso! (banco: ${dbName})`);
}

export async function desconectarBanco() {
    await mongoose.disconnect();
}
