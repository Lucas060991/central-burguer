// COLOQUE A URL QUE VOCÊ COPIOU NO PASSO 2 AQUI
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbylnb_O8930YdFRLGGnw__nO4GWN9VmfBP9Fgz61tHNaK_jhvJHpiY47k7Lqa7UO_FZTA/exec";

function salvarNoGoogleSheets(dados) {
  fetch(SCRIPT_URL, {
    method: "POST",
    body: JSON.stringify(dados),
    mode: "no-cors", // Importante para evitar erros de bloqueio
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
  })
  .then(response => {
    console.log("Dados enviados para a planilha!");
    alert("Salvo com sucesso!");
  })
  .catch(error => {
    console.error("Erro ao salvar:", error);
    alert("Erro ao salvar os dados.");
  });
}
