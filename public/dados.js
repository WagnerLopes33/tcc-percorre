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
/* ================= CATÁLOGO DE ESPECIALIDADES E HABILIDADES (extensível) ================= */
const ESPECIALIDADES = {
  pintor: { nome: "Pintor", habilidades: ["Pintura interna","Pintura externa","Pintura de tetos","Preparação de paredes","Aplicação de massa corrida","Texturização","Pintura de portas e janelas","Pintura decorativa"] },
  pedreiro: { nome: "Pedreiro", habilidades: ["Alvenaria","Assentamento de pisos","Assentamento de revestimentos","Contrapiso","Construção de paredes","Reboco","Pequenas reformas","Demolição e retirada de revestimentos"] },
  eletricista: { nome: "Eletricista", habilidades: ["Instalação de tomadas","Instalação de interruptores","Iluminação","Instalação de chuveiros","Manutenção elétrica","Instalação de quadros elétricos"] },
  encanador: { nome: "Encanador", habilidades: ["Instalação hidráulica","Manutenção de tubulações","Instalação de torneiras","Instalação de vasos sanitários","Manutenção de registros","Identificação de vazamentos"] },
  azulejista: { nome: "Azulejista", habilidades: ["Assentamento de azulejos","Assentamento de porcelanato","Revestimento de áreas molhadas","Rejuntamento","Nivelamento de superfícies","Remoção de revestimentos"] },
  gesseiro: { nome: "Gesseiro", habilidades: ["Forro de gesso","Sancas","Molduras","Divisórias","Reparos em gesso"] },
  marceneiro: { nome: "Marceneiro", habilidades: ["Móveis planejados","Bancadas","Portas de madeira","Reparos em madeira","Prateleiras e nichos"] },
  serralheiro: { nome: "Serralheiro", habilidades: ["Portões e grades","Estruturas metálicas","Soldagem","Corrimãos","Reparos metálicos"] },
  instalador_drywall: { nome: "Instalador de drywall", habilidades: ["Paredes de drywall","Forros de drywall","Isolamento acústico em drywall","Reparos em drywall"] },
  impermeabilizador: { nome: "Impermeabilizador", habilidades: ["Impermeabilização de lajes","Impermeabilização de banheiros","Impermeabilização de áreas molhadas","Mantas e produtos impermeabilizantes"] },
  telhadista: { nome: "Telhadista", habilidades: ["Instalação de telhados","Manutenção de telhados","Calhas e rufos","Substituição de telhas"] },
  carpinteiro: { nome: "Carpinteiro", habilidades: ["Estruturas de madeira","Decks","Telhados de madeira","Escadas de madeira"] },
  instalador_pisos: { nome: "Instalador de pisos", habilidades: ["Instalação de porcelanato","Instalação de pisos cerâmicos","Instalação de pisos laminados","Instalação de pisos vinílicos","Rodapés"] },
  paisagista: { nome: "Paisagista", habilidades: ["Jardinagem","Projeto de áreas externas","Instalação de decks","Iluminação de jardim"] },
  manutencao_geral: { nome: "Profissional de manutenção geral", habilidades: ["Pequenos reparos","Montagem e ajustes","Manutenção preventiva","Serviços diversos"] }
};

const PRO_PESOS = { habilidades: 0.40, especialidade: 0.20, experiencia: 0.15, regiao: 0.15, disponibilidade: 0.10 };
const SERVICOS_BUSCA = [
  ["pintura", "Pintura"],
  ["massa", "Massa corrida / preparação"],
  ["piso", "Instalação de piso"],
  ["revestimento", "Revestimento / azulejo"],
  ["rodape", "Rodapé"],
  ["eletrica", "Elétrica"],
  ["hidraulica", "Hidráulica"],
  ["impermeabilizacao", "Impermeabilização"],
  ["gesso", "Gesso / forro"],
  ["alvenaria", "Alvenaria / reformas estruturais leves"],
  ["marcenaria", "Marcenaria / bancadas"],
  ["telhado", "Telhado"],
  ["area_externa", "Área externa / paisagismo"],
  ["manutencao", "Manutenção geral"]
];

const CATALOGO_SERVICO_REQUISITOS = {
  pintura: { especialidades: ["pintor"], habilidades: ["Pintura interna","Pintura externa","Pintura de tetos","Preparação de paredes"] },
  massa: { especialidades: ["pintor","gesseiro"], habilidades: ["Aplicação de massa corrida","Preparação de paredes","Reparos em gesso"] },
  piso: { especialidades: ["instalador_pisos","pedreiro","azulejista"], habilidades: ["Instalação de porcelanato","Instalação de pisos cerâmicos","Assentamento de pisos","Rodapés"] },
  revestimento: { especialidades: ["azulejista","pedreiro"], habilidades: ["Assentamento de azulejos","Assentamento de porcelanato","Revestimento de áreas molhadas","Rejuntamento"] },
  rodape: { especialidades: ["instalador_pisos","marceneiro","pedreiro"], habilidades: ["Rodapés","Assentamento de pisos","Instalação de pisos laminados"] },
  eletrica: { especialidades: ["eletricista"], habilidades: ["Instalação de tomadas","Instalação de interruptores","Iluminação","Manutenção elétrica","Instalação de chuveiros"] },
  hidraulica: { especialidades: ["encanador"], habilidades: ["Instalação hidráulica","Manutenção de tubulações","Instalação de torneiras","Instalação de vasos sanitários","Identificação de vazamentos"] },
  impermeabilizacao: { especialidades: ["impermeabilizador","pedreiro"], habilidades: ["Impermeabilização de banheiros","Impermeabilização de áreas molhadas","Impermeabilização de lajes"] },
  gesso: { especialidades: ["gesseiro","instalador_drywall"], habilidades: ["Forro de gesso","Sancas","Molduras","Divisórias","Reparos em gesso","Paredes de drywall","Forros de drywall"] },
  alvenaria: { especialidades: ["pedreiro"], habilidades: ["Alvenaria","Construção de paredes","Reboco","Contrapiso","Pequenas reformas","Demolição e retirada de revestimentos"] },
  marcenaria: { especialidades: ["marceneiro","carpinteiro"], habilidades: ["Móveis planejados","Bancadas","Reparos em madeira","Estruturas de madeira","Decks"] },
  telhado: { especialidades: ["telhadista","carpinteiro"], habilidades: ["Instalação de telhados","Manutenção de telhados","Calhas e rufos","Telhados de madeira"] },
  area_externa: { especialidades: ["paisagista","pedreiro","carpinteiro"], habilidades: ["Jardinagem","Projeto de áreas externas","Instalação de decks","Pequenas reformas"] },
  manutencao: { especialidades: ["manutencao_geral","pedreiro","pintor"], habilidades: ["Pequenos reparos","Manutenção preventiva","Serviços diversos"] }
};

const MAPA_SERVICO_COMODO = {
  paredes: "pintura", teto: "pintura", massa: "massa", piso: "piso", revest: "revestimento", rodape: "rodape"
};

const CONFIG_ATENDIMENTO = { whatsappHumano: "", iaHabilitada: false };

function normalizarTexto(txt){ return String(txt||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9\s]/g," ").replace(/\s+/g," ").trim(); }
function tokensTexto(txt){ return normalizarTexto(txt).split(" ").filter(t=>t.length>2); }

function inferirNecessidadesPorTexto(texto){
  const t = normalizarTexto(texto);
  const achados = new Set();
  const regras = [
    ["pintura", ["pintar","pintura","parede","teto","cor"]],
    ["massa", ["massa corrida","massa","nivelar parede","buraco","trinca"]],
    ["piso", ["piso","porcelanato","ceramica","assoalho","laminado","vinilico"]],
    ["revestimento", ["azulejo","revestimento","pastilha","parede do banheiro","cozinha"]],
    ["rodape", ["rodape"]],
    ["eletrica", ["eletrica","eletricista","tomada","interruptor","iluminacao","chuveiro","fio","disjuntor","lampada"]],
    ["hidraulica", ["hidraulica","encanador","cano","torneira","vaso","registro","vazamento","pia","esgoto"]],
    ["impermeabilizacao", ["impermeabiliz","infiltr","vazamento laje","umidade"]],
    ["gesso", ["gesso","sanca","moldura","forro","drywall"]],
    ["alvenaria", ["parede","muro","reboco","contrapiso","demolir","quebrar","construir","escada de concreto","bancada de alvenaria"]],
    ["marcenaria", ["marcenaria","armario","bancada","madeira","planejado","nicho","porta de madeira"]],
    ["telhado", ["telhado","telha","calha","rufo"]],
    ["area_externa", ["quintal","jardim","area gourmet","deck","externa","paisag"]],
    ["manutencao", ["reparo","conserto","ajuste","manutencao"]]
  ];
  regras.forEach(([serv, termos]) => { if (termos.some(x => t.includes(normalizarTexto(x)))) achados.add(serv); });
  // heurísticas compostas
  if (t.includes("banheiro") && (t.includes("reform") || t.includes("porcelanato") || t.includes("azulejo"))) { achados.add("revestimento"); achados.add("piso"); achados.add("impermeabilizacao"); }
  if (t.includes("area gourmet") || t.includes("churrasqueira")) { achados.add("alvenaria"); achados.add("hidraulica"); achados.add("eletrica"); }
  if (t.includes("iluminacao embutida") || t.includes("spot")) { achados.add("eletrica"); achados.add("gesso"); }
  return [...achados];
}

function requisitosDeServicos(servs){
  const especialidades = new Set();
  const habilidades = new Set();
  (servs||[]).forEach(s => {
    const req = CATALOGO_SERVICO_REQUISITOS[s];
    if (!req) return;
    (req.especialidades||[]).forEach(e=>especialidades.add(e));
    (req.habilidades||[]).forEach(h=>habilidades.add(h));
  });
  return { especialidades: [...especialidades], habilidades: [...habilidades] };
}

function montarPedidoProfissionais({ servicos=[], descricao="", regiao="", ambiente="", complexidade="", comodoId=null, obraId=null }){
  const inferidos = inferirNecessidadesPorTexto(descricao);
  const todosServ = [...new Set([...(servicos||[]), ...inferidos])];
  const req = requisitosDeServicos(todosServ);
  return {
    id: uid("pedido"),
    criadoEm: new Date().toISOString(),
    servicos: todosServ,
    descricao: String(descricao||"").trim(),
    ambiente: String(ambiente||"").trim(),
    regiao: String(regiao||"").trim(),
    complexidade: String(complexidade||"").trim(),
    especialidadesNecessarias: req.especialidades,
    habilidadesNecessarias: req.habilidades,
    comodoId, obraId,
    origem: comodoId ? "obra" : "busca"
  };
}

function migrarProfissionalLegado(p){
  if (!p || typeof p !== "object") return null;
  const legacyServs = Array.isArray(p.servicos) ? p.servicos : [];
  let esp = p.especialidade;
  let habs = Array.isArray(p.habilidades) ? [...p.habilidades] : [];
  if (!esp) {
    if (legacyServs.includes("eletrica")) esp = "eletricista";
    else if (legacyServs.includes("hidraulica")) esp = "encanador";
    else if (legacyServs.includes("massa") || legacyServs.includes("paredes")) esp = "pintor";
    else if (legacyServs.includes("revest") || legacyServs.includes("piso") || legacyServs.includes("rodape")) esp = "pedreiro";
    else if (legacyServs.includes("reparos")) esp = "manutencao_geral";
    else esp = "manutencao_geral";
  }
  if (!habs.length) {
    const map = {
      paredes: ["Pintura interna"], teto: ["Pintura de tetos","Pintura interna"], massa: ["Aplicação de massa corrida","Preparação de paredes"],
      piso: ["Assentamento de pisos","Instalação de porcelanato"], revest: ["Assentamento de revestimentos","Rejuntamento"], rodape: ["Rodapés"],
      eletrica: ["Instalação de tomadas","Manutenção elétrica"], hidraulica: ["Instalação hidráulica","Manutenção de tubulações"], reparos: ["Pequenos reparos"]
    };
    legacyServs.forEach(s => (map[s]||[]).forEach(h => { if (!habs.includes(h)) habs.push(h); }));
  }
  return {
    id: p.id || uid("pro"),
    nome: String(p.nome||"").trim(),
    tel: String(p.tel||"").trim(),
    regiao: String(p.regiao||"").trim(),
    obs: String(p.obs||"").trim(),
    exemplo: !!p.exemplo,
    servicos: legacyServs,
    especialidade: esp,
    habilidades: habs,
    experienciaAnos: p.experienciaAnos != null && isFinite(Number(p.experienciaAnos)) ? Number(p.experienciaAnos) : null,
    descricaoTrabalhos: String(p.descricaoTrabalhos||"").trim(),
    tiposProjetos: String(p.tiposProjetos||"").trim(),
    disponibilidade: String(p.disponibilidade||"").trim(),
    raioAtendimento: String(p.raioAtendimento||"").trim(),
    portfolio: String(p.portfolio||"").trim(),
    fazReformasCompletas: p.fazReformasCompletas === true ? true : p.fazReformasCompletas === false ? false : null,
    criadoEm: p.criadoEm || new Date().toISOString(),
    atualizadoEm: new Date().toISOString()
  };
}

function migrarDadosProfissionais(){
  if (!Array.isArray(mem.pros)) mem.pros = [];
  mem.pros = mem.pros.map(migrarProfissionalLegado).filter(p => p && p.nome && p.tel);
  if (!Array.isArray(mem.solicitacoes)) mem.solicitacoes = [];
}
function _temTexto(v){ return String(v||"").trim().length > 0; }
function _normRegiao(v){ return normalizarTexto(v).replace(/\b(zona|regiao|bairro|cidade|de|da|do|das|dos)\b/g," ").replace(/\s+/g," ").trim(); }
function _matchRegiao(pedidoRegiao, pro){
  const a = _normRegiao(pedidoRegiao);
  if (!a) return { ok: null, motivo: "Região do pedido não informada (critério não penalizado)." };
  const campos = [pro.regiao, pro.raioAtendimento, pro.obs, pro.tiposProjetos, pro.descricaoTrabalhos].map(_normRegiao).filter(Boolean);
  if (!campos.length) return { ok: null, motivo: "Profissional não informou região/raio (a confirmar)." };
  const ta = tokensTexto(a);
  for (const c of campos) {
    if (c.includes(a) || a.includes(c)) return { ok: true, motivo: `Atende região compatível com "${pedidoRegiao}".` };
    const tb = tokensTexto(c);
    const inter = ta.filter(t => tb.includes(t));
    if (inter.length >= Math.min(2, ta.length) && inter.length) return { ok: true, motivo: `Região possivelmente compatível (${inter.join(", ")}).` };
  }
  return { ok: false, motivo: `Região informada ("${pro.regiao||pro.raioAtendimento||"não detalhada"}") não corresponde claramente à solicitada.` };
}
function _matchDisponibilidade(pedido, pro){
  const disp = normalizarTexto(pro.disponibilidade);
  if (!disp) return { ok: null, motivo: "Disponibilidade não informada (a confirmar)." };
  if (/(indispon|nao atende|não atende|sem agenda)/.test(disp)) return { ok: false, motivo: "Disponibilidade informada indica indisponibilidade." };
  return { ok: true, motivo: `Disponibilidade informada: ${pro.disponibilidade}.` };
}
function _matchExperiencia(pedido, pro){
  const anos = pro.experienciaAnos;
  const texto = normalizarTexto([pro.descricaoTrabalhos, pro.tiposProjetos, pro.obs].join(" "));
  const pistas = [...(pedido.habilidadesNecessarias||[]), ...(pedido.servicos||[])].map(normalizarTexto);
  const achouPista = pistas.some(p => p && texto.includes(p.split(" ")[0]));
  if (anos == null && !texto) return { ok: null, valor: 0, motivo: "Experiência relacionada não informada." };
  if (anos != null && anos >= 3 && achouPista) return { ok: true, valor: 1, motivo: `Informa ${anos} ano(s) e experiência relacionada ao pedido.` };
  if (anos != null && anos >= 1) return { ok: achouPista ? true : null, valor: achouPista ? 0.8 : 0.5, motivo: `Informa ${anos} ano(s) de experiência${achouPista?" relacionada ao pedido":" (relação a confirmar)"}.` };
  if (achouPista) return { ok: null, valor: 0.6, motivo: "Descreve trabalhos relacionados, mas sem tempo de experiência informado." };
  if (anos != null) return { ok: null, valor: 0.35, motivo: `Informa ${anos} ano(s), mas sem relação clara com o pedido.` };
  return { ok: null, valor: 0.2, motivo: "Experiência informada sem relação clara com o pedido." };
}

function calcularCompatibilidadeProfissional(pro, pedido){
  const reqHab = pedido.habilidadesNecessarias || [];
  const reqEsp = pedido.especialidadesNecessarias || [];
  const servs = pedido.servicos || [];
  const proHabs = Array.isArray(pro.habilidades) ? pro.habilidades : [];
  const proHabN = proHabs.map(normalizarTexto);
  const matchedHabs = [];
  const faltandoHabs = [];
  reqHab.forEach(h => {
    const hn = normalizarTexto(h);
    const hit = proHabN.some(ph => ph === hn || ph.includes(hn) || hn.includes(ph));
    if (hit) matchedHabs.push(h); else faltandoHabs.push(h);
  });
  // fallback por serviço mapeado -> habilidades do catálogo
  if (!reqHab.length && servs.length) {
    servs.forEach(s => {
      const req = CATALOGO_SERVICO_REQUISITOS[s];
      if (!req) return;
      (req.habilidades||[]).forEach(h => {
        const hn = normalizarTexto(h);
        if (proHabN.some(ph => ph===hn || ph.includes(hn) || hn.includes(ph))) { if (!matchedHabs.includes(h)) matchedHabs.push(h); }
      });
    });
  }
  let habScore;
  const baseHabReq = reqHab.length ? reqHab : [...new Set(servs.flatMap(s => (CATALOGO_SERVICO_REQUISITOS[s]?.habilidades)||[]))];
  if (!baseHabReq.length) habScore = 0.5; // sem requisito específico
  else habScore = matchedHabs.length / baseHabReq.length;

  let espScore = 0.5;
  let espMotivo = "Especialidade não exigida especificamente.";
  if (reqEsp.length) {
    if (reqEsp.includes(pro.especialidade)) { espScore = 1; espMotivo = `Especialidade principal compatível (${(ESPECIALIDADES[pro.especialidade]?.nome)||pro.especialidade}).`; }
    else {
      // compatibilidade parcial por habilidades relacionadas
      espScore = habScore >= 0.5 ? 0.4 : 0;
      espMotivo = espScore ? "Especialidade principal diferente, mas com habilidades relacionadas." : `Especialidade principal (${(ESPECIALIDADES[pro.especialidade]?.nome)||pro.especialidade||"não informada"}) não é a mais indicada para o pedido.`;
    }
  } else if (pro.especialidade) {
    espMotivo = `Especialidade cadastrada: ${(ESPECIALIDADES[pro.especialidade]?.nome)||pro.especialidade}.`;
  }

  const exp = _matchExperiencia(pedido, pro);
  const reg = _matchRegiao(pedido.regiao, pro);
  const disp = _matchDisponibilidade(pedido, pro);

  const expScore = exp.valor != null ? exp.valor : (exp.ok === true ? 1 : exp.ok === false ? 0 : 0.45);
  const regScore = reg.ok === true ? 1 : reg.ok === false ? 0 : 0.5;
  const dispScore = disp.ok === true ? 1 : disp.ok === false ? 0 : 0.5;

  const pesos = PRO_PESOS;
  let total = (habScore*pesos.habilidades + espScore*pesos.especialidade + expScore*pesos.experiencia + regScore*pesos.regiao + dispScore*pesos.disponibilidade) * 100;
  total = Math.max(0, Math.min(100, Math.round(total)));

  const motivos = [];
  if (matchedHabs.length) motivos.push(`Habilidades relacionadas: ${matchedHabs.slice(0,4).join(", ")}${matchedHabs.length>4?"…":""}.`);
  else if (baseHabReq.length) motivos.push("Não há habilidades cadastradas correspondentes às necessidades identificadas.");
  motivos.push(espMotivo);
  motivos.push(exp.motivo);
  motivos.push(reg.motivo);
  motivos.push(disp.motivo);
  if (pro.fazReformasCompletas === true && (pedido.complexidade||"").toLowerCase().includes("complet")) motivos.push("Informa que realiza reformas completas.");

  const faltasConfirmar = [];
  if (baseHabReq.length && matchedHabs.length < baseHabReq.length) faltasConfirmar.push(...faltandoHabs.slice(0,3).map(h=>`Confirmar habilidade: ${h}.`));
  if (reg.ok === null) faltasConfirmar.push("Confirmar atendimento na região informada.");
  if (disp.ok === null) faltasConfirmar.push("Confirmar disponibilidade.");
  if (exp.ok === null) faltasConfirmar.push("Confirmar experiência relacionada ao serviço.");

  let grupo = "parcial";
  const temBaseMinima = habScore > 0 || (reqEsp.length && reqEsp.includes(pro.especialidade));
  if (!temBaseMinima && reqEsp.length && espScore === 0) grupo = "incompativel";
  else if (total >= 70 && habScore >= 0.5 && reg.ok !== false) grupo = "alta";
  else if (total >= 45 || habScore >= 0.34) grupo = "parcial";
  else grupo = "confirmar";
  if (reg.ok === false && habScore < 0.7) grupo = habScore >= 0.5 ? "confirmar" : "incompativel";
  if (disp.ok === false && habScore < 0.7) grupo = "incompativel";

  return { score: total, grupo, motivos, matchedHabs, faltandoHabs, faltasConfirmar, breakdown: { habilidades: Math.round(habScore*100), especialidade: Math.round(espScore*100), experiencia: Math.round(expScore*100), regiao: Math.round(regScore*100), disponibilidade: Math.round(dispScore*100) } };
}

function recomendarProfissionais(pedido, opts={}){
  const incluirIncompativeis = !!opts.incluirIncompativeis;
  const lista = (mem.pros||[]).map(pro => ({ pro, ...calcularCompatibilidadeProfissional(pro, pedido) }));
  const compativeis = lista.filter(x => x.grupo !== "incompativel");
  compativeis.sort((a,b)=> b.score - a.score || a.pro.nome.localeCompare(b.pro.nome));
  const grupos = {
    alta: compativeis.filter(x=>x.grupo==="alta"),
    parcial: compativeis.filter(x=>x.grupo==="parcial"),
    confirmar: compativeis.filter(x=>x.grupo==="confirmar")
  };
  return { pedido, resultados: compativeis, grupos, todos: incluirIncompativeis ? lista : compativeis };
}

function recomendacoesPorNecessidade(pedido){
  const servs = (pedido.servicos && pedido.servicos.length) ? pedido.servicos : inferirNecessidadesPorTexto(pedido.descricao||"");
  if (!servs.length) return [];
  return servs.map(serv => {
    const subPedido = { ...pedido, servicos: [serv], ...requisitosDeServicos([serv]) };
    const rec = recomendarProfissionais(subPedido);
    return { servico: serv, nome: (SERVICOS_BUSCA.find(s=>s[0]===serv)||[serv,serv])[1], grupos: rec.grupos, resultados: rec.resultados };
  });
}
