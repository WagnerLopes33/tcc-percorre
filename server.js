
const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Disponibiliza os arquivos HTML, CSS e JS
app.use(express.static(path.join(__dirname, "public")));

// Exemplo de rota da API
app.get("/api/status", (req, res) => {
  res.json({
    status: "online",
    mensagem: "API funcionando!"
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
