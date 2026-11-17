/* ================= DADOS DE EXEMPLO (preços ilustrativos) ================= */
const PADROES = {
    argamassaKgM2: 5, rejunteDens: 1.58, rejunteEsp: 8, massaKgM2: 0.8
};
const COMODOS = [
["quarto", "Quarto", "M3 20V9l9-6 9 6v11M8 20v-6h8v6"],  ["sala", "Sala", "M4 18v-5a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v5M2 14h20M6 18v2M18 18v2"],
["cozinha", "Cozinha", "M5 3v8a3 3 0 0 0 6 0V3M8 3v18M17 3c-2 2-2 6 0 8v10"],  ["banheiro", "Banheiro", "M4 12h16v3a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5zM6 12V5a2 2 0 0 1 4 0"],
["lavanderia", "Lavanderia", "M5 3h14v18H5zM5 7h14M12 15m-4 0a4 4 0 1 0 8 0a4 4 0 1 0-8 0"],  ["escritorio", "Escritório", "M3 7h18v10H3zM8 21h8M12 17v4"],
["corredor", "Corredor", "M8 3v18M16 3v18M8 12h8"],  ["varanda", "Varanda", "M3 10h18M5 10v10M19 10v10M9 10v10M15 10v10M3 20h18"],
["garagem", "Garagem", "M3 21V9l9-5 9 5v12M7 21v-7h10v7M7 17h10"],  ["externa", "Área externa", "M12 3v4M5 7l2 2M19 7l-2 2M3 21h18M6 21c0-4 3-7 6-7s6 3 6 7"],  ["outros", "Outros", "M12 5v14M5 12h14"]
];
const SERVICOS = [
["paredes", "Pintar paredes", "Tinta para as paredes, já descontando portas e janelas.", "M3 3h15v6H3zM18 6h2v5h-8v3M10 14h4v7h-4z"],
["teto", "Pintar teto", "Tinta para o teto, pela área do piso.", "M3 4h18M6 4v4M18 4v4M12 4v16"],
["massa", "Massa corrida", "Nivela a parede antes da pintura.", "M4 20l6-6M14 4l6 6-8 8-6-6z"],
["piso", "Trocar piso", "Piso, argamassa e rejunte, com a perda dos recortes.", "M3 3h18v18H3zM3 12h18M12 3v18"],
["revest", "Revestir parede", "Azulejo ou cerâmica, argamassa e rejunte.", "M3 3h18v18H3zM3 9h18M3 15h18M9 3v18M15 3v18"],
["rodape", "Instalar rodapé", "Barras pelo perímetro, descontando as portas.", "M3 20h18M3 16h18M3 16v4M21 16v4"]
];
const PRODUTOS = [
{
    id: "tinta-eco", cat: "tinta", nome: "Tinta acrílica", linha: "Econômica", uso:  ["interno"], rend: 8, emb:  [ {
        t: 3.6, p: 79.9
    },
    {
        t: 18, p: 299.9
    }]
},
{
    id: "tinta-int", cat: "tinta", nome: "Tinta acrílica", linha: "Intermediária", uso:  ["interno", "externo", "molhada"], rend: 10, emb:  [ {
        t: 0.9, p: 39.9
    },
    {
        t: 3.6, p: 119.9
    },
    {
        t: 18, p: 449.9
    }]
},
{
    id: "tinta-pre", cat: "tinta", nome: "Tinta acrílica premium", linha: "Premium", uso:  ["interno", "externo", "molhada"], rend: 13, emb:  [ {
        t: 0.9, p: 59.9
    },
    {
        t: 3.6, p: 189.9
    },
    {
        t: 18, p: 699.9
    }]
},
{
    id: "sel-eco", cat: "selador", nome: "Selador acrílico", linha: "Econômica", uso:  ["interno", "externo", "molhada"], rend: 10, emb:  [ {
        t: 3.6, p: 59.9
    },
    {
        t: 18, p: 229.9
    }]
},
{
    id: "sel-pre", cat: "selador", nome: "Selador acrílico", linha: "Premium", uso:  ["interno", "externo", "molhada"], rend: 12, emb:  [ {
        t: 3.6, p: 89.9
    },
    {
        t: 18, p: 339.9
    }]
},
{
    id: "massa-pva", cat: "massa", nome: "Massa corrida PVA", linha: "Econômica", uso:  ["interno"], cons: 0.8, emb:  [ {
        t: 6, p: 24.9
    },
    {
        t: 25, p: 69.9
    }]
},
{
    id: "massa-acr", cat: "massa", nome: "Massa acrílica", linha: "Intermediária", uso:  ["interno", "externo", "molhada"], cons: 0.8, emb:  [ {
        t: 6, p: 44.9
    },
    {
        t: 25, p: 139.9
    }]
},
{
    id: "piso-eco", cat: "piso", nome: "Piso cerâmico", linha: "Econômica", uso:  ["interno"], emb:  [ {
        t: 1, p: 39.9
    }]
},
{
    id: "piso-int", cat: "piso", nome: "Porcelanato acetinado", linha: "Intermediária", uso:  ["interno", "externo", "molhada"], emb:  [ {
        t: 1, p: 69.9
    }]
},
{
    id: "piso-pre", cat: "piso", nome: "Porcelanato polido", linha: "Premium", uso:  ["interno"], emb:  [ {
        t: 1, p: 109.9
    }]
},
{
    id: "piso-ext", cat: "piso", nome: "Piso antiderrapante", linha: "Econômica", uso:  ["externo", "molhada"], emb:  [ {
        t: 1, p: 44.9
    }]
},
{
    id: "azu-eco", cat: "azulejo", nome: "Azulejo branco", linha: "Econômica", uso:  ["interno", "molhada"], emb:  [ {
        t: 1, p: 34.9
    }]
},
{
    id: "azu-int", cat: "azulejo", nome: "Revestimento retificado", linha: "Intermediária", uso:  ["interno", "molhada", "externo"], emb:  [ {
        t: 1, p: 59.9
    }]
},
{
    id: "azu-pre", cat: "azulejo", nome: "Revestimento decorado", linha: "Premium", uso:  ["interno", "molhada", "externo"], emb:  [ {
        t: 1, p: 99.9
    }]
},
{
    id: "arg-ac1", cat: "argamassa", nome: "Argamassa AC-I", linha: "Econômica", uso:  ["interno"], emb:  [ {
        t: 20, p: 18.9
    }]
},
{
    id: "arg-ac2", cat: "argamassa", nome: "Argamassa AC-II", linha: "Intermediária", uso:  ["interno", "externo", "molhada"], emb:  [ {
        t: 20, p: 29.9
    }]
},
{
    id: "arg-ac3", cat: "argamassa", nome: "Argamassa AC-III", linha: "Premium", uso:  ["interno", "externo", "molhada"], emb:  [ {
        t: 20, p: 49.9
    }]
},
{
    id: "rej-com", cat: "rejunte", nome: "Rejunte cimentício", linha: "Econômica", uso:  ["interno", "externo"], emb:  [ {
        t: 1, p: 9.9
    }]
},
{
    id: "rej-flex", cat: "rejunte", nome: "Rejunte flexível", linha: "Intermediária", uso:  ["interno", "externo", "molhada"], emb:  [ {
        t: 1, p: 16.9
    }]
},
{
    id: "rej-epx", cat: "rejunte", nome: "Rejunte epóxi", linha: "Premium", uso:  ["interno", "externo", "molhada"], emb:  [ {
        t: 1, p: 59.9
    }]
},
{
    id: "rod-pol", cat: "rodape", nome: "Rodapé de poliestireno", linha: "Econômica", uso:  ["interno"], emb:  [ {
        t: 1, p: 24.9
    }]
},
{
    id: "rod-mdf", cat: "rodape", nome: "Rodapé de MDF", linha: "Intermediária", uso:  ["interno"], emb:  [ {
        t: 1, p: 34.9
    }]
},
{
    id: "rod-cer", cat: "rodape", nome: "Rodapé cerâmico", linha: "Intermediária", uso:  ["interno", "externo", "molhada"], emb:  [ {
        t: 1, p: 29.9
    }]
}
];
const PRO_SERV = [["paredes", "Pintura"],  ["massa", "Massa corrida"],  ["piso", "Piso"],  ["revest", "Revestimento"],  ["rodape", "Rodapé"],  ["eletrica", "Elétrica"],  ["hidraulica", "Hidráulica"],  ["reparos", "Pequenos reparos"]];
const SERV2PRO = {
    paredes: "paredes", teto: "paredes", massa: "massa", piso: "piso", revest: "revest", rodape: "rodape"
};
const FONTE = "Preços de referência de exemplo · SP";
const NOMEMAT = {
    tinta: "Tinta", selador: "Selador", massa: "Massa corrida", piso: "Piso", azulejo: "Revestimento", argamassa: "Argamassa", rejunte: "Rejunte", rodape: "Rodapé"
};
const UNID = {
    tinta: "L", selador: "L", massa: "kg", piso: "m²", azulejo: "m²", argamassa: "kg", rejunte: "kg", rodape: "m"
};
