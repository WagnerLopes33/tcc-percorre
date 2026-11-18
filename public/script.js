/* ================= ARMAZENAMENTO ================= */
const KEY = "obrinha:v2";
let mem = {
    obras:  []
};
function load() {
    try {
        const saved = localStorage.getItem(KEY);
        if (! saved) return;
        const parsed = JSON.parse(saved);
        if (! parsed || ! Array.isArray(parsed.obras)) return;
        mem = parsed;
        // Dados existentes não devem receber novos exemplos automaticamente.
        if (mem.inicializado == null) mem.inicializado = true;
    } catch (error) {
        toast("Não foi possível carregar os dados salvos neste navegador.");
    }
}
function save() {
    try {
        localStorage.setItem(KEY, JSON.stringify(mem));
    } catch (error) {
        toast("Não foi possível salvar. Exporte seu resumo antes de fechar a página.");
    }
}
const uid = p => p + "-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
/* ================= UTILIDADES ================= */
function dataLocal() {
    return new Intl.DateTimeFormat("sv-SE",  {
        timeZone: "America/Sao_Paulo"
    }).format(new Date());
}
const $ = s => document.querySelector(s);
const num = v => {
    if (v == null) return NaN;
    let t = String(v).trim().replace(/\s|R\$/g, "");
    if (t.includes(",")) t = t.replace(/\./g, "").replace(",", ".");
    return t === "" ? NaN: Number(t)
};
const fmt =(n, d = 2) => n.toLocaleString("pt-BR",  {
    minimumFractionDigits: d, maximumFractionDigits: d
});
const brl = n => n.toLocaleString("pt-BR",  {
    style: "currency", currency: "BRL"
});
const esc = s => String(s).replace(/[&<>"']/g, c =>( {
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
} [c]));
const icon =(d, s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;
function toast(t) {
    const el = $("#toast");
    el.textContent = t;
    el.hidden = false;
    clearTimeout(toast.t);
    toast.t = setTimeout(() => el.hidden = true, 2800)
}
/* ================= VÍRGULA AUTOMÁTICA ================= */
document.addEventListener("input", e => {
    const el = e.target;
    if (!(el.matches && el.matches("#o-orc, #g-valor, input[data-pago]"))) return;
    const d = +(el.dataset.dec || 2), dig = el.value.replace(/\D/g, "").replace(/^0+(?=\d)/, "").slice(0, 12);
    el.value = dig ?(parseInt(dig, 10) / 10 ** d).toLocaleString("pt-BR",  {
        minimumFractionDigits: d, maximumFractionDigits: d
    }): ""
});
document.addEventListener("input", e => {
    const el = e.target;
    if (el.id !== "p-tel") return;
    const d = el.value.replace(/\D/g, "").slice(0, 11);
    el.value = d.length > 10 ? `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`: d.length > 6 ? `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`: d.length > 2 ? `(${d.slice(0,2)}) ${d.slice(2)}`: d.length ? `(${d}`: ""
});
/* ================= BOTÃO "i" DE INFORMAÇÃO ================= */
let infoN = 0;
function infoBtn(html, label) {
    const id = "tip-" +(++ infoN);
    return `<span class="info"><button type="button" aria-label="Sobre ${esc(label)}" aria-expanded="false" aria-controls="${id}">i</button><span class="tip" id="${id}" role="tooltip" hidden>${html}</span></span>`
}
function montarInfos(root = document) {
    root.querySelectorAll("[data-info]:not([data-info-ok])").forEach(el => {
        el.dataset.infoOk = "1";
        const label = el.textContent.trim();
        el.insertAdjacentHTML("beforeend", infoBtn(el.dataset.info, label || "este campo"))
    });
}
document.addEventListener("click", e => {
    const b = e.target.closest(".info button");
    document.querySelectorAll(".info button[aria-expanded=true]").forEach(x => {
        if (x !== b) {
            x.setAttribute("aria-expanded", "false");
            x.nextElementSibling.hidden = true
        }
    });
    if (b) {
        e.preventDefault();
        const open = b.getAttribute("aria-expanded") !== "true";
        b.setAttribute("aria-expanded", String(open));
        b.nextElementSibling.hidden = ! open
    }
});
document.addEventListener("keydown", e => {
    if (e.key === "Escape") document.querySelectorAll(".info button[aria-expanded=true]").forEach(x => {
        x.setAttribute("aria-expanded", "false");
        x.nextElementSibling.hidden = true;
        x.focus()
    })
});
/* ================= CÁLCULOS ================= */
const Calc = {
    areaParedes: (l, c, a, np, nj, ap, aj) => Math.max(0, 2 *(l + c) * a -(np * ap + nj * aj)),
    areaPiso: (l, c) => l * c,
    rejunteKg: (C, L, j, area) =>((C + L) /(C * L)) * PADROES.rejunteEsp * j * PADROES.rejunteDens * area
};
function melhorCombo(qtd, emb) {
    let best = null;
    const sizes = [...emb].sort((a, b) => b.t - a.t);
    const rec =(i, rest, itens, custo) => {
        if (rest <= 1e-9) {
            const n = itens.reduce((s, x) => s + x.n, 0);
            if (! best || custo < best.custo - 1e-9 ||(Math.abs(custo - best.custo) < 1e-9 && n < best.n)) best = {
                custo, n, itens: itens.filter(x => x.n > 0)
            };
            return
        }
        if (i >= sizes.length) return;
        const e = sizes [i], max = Math.ceil(rest / e.t - 1e-9);
        for (let n = max;
        n >= 0;
        n --) {
            if (i === sizes.length - 1 && n < max) break;
            rec(i + 1, rest - n * e.t,  [...itens,  {
                t: e.t, p: e.p, n
            }], custo + n * e.p)
        }
    };
    rec(0, qtd,  [], 0);
    return best;
}
function comboTexto(cat, itens) {
    return itens.map(x => {
        if (cat === "tinta" || cat === "selador") return `${x.n} ${x.t>=18?(x.n>1?"latas":"lata"):x.t>=3?(x.n>1?"galões":"galão"):(x.n>1?"quartos":"quarto")} de ${fmt(x.t,x.t%1?1:0)} L`;
        if (cat === "argamassa") return `${x.n} ${x.n>1?"sacos":"saco"} de ${x.t} kg`;
        if (cat === "massa") return `${x.n} ${x.t>=25?(x.n>1?"latas":"lata"):(x.n>1?"galões":"galão")} de ${x.t} kg`;
        if (cat === "rejunte") return `${x.n} ${x.n>1?"pacotes":"pacote"} de ${x.t} kg`;
        return ""
    }).join(" + ")
}
function uso(tipo, c) {
    if (tipo === "outros") return(c && c.usoOutro) || "interno";
    return ["banheiro", "cozinha", "lavanderia"].includes(tipo) ? "molhada":  ["varanda", "garagem", "externa"].includes(tipo) ? "externo": "interno"
}
function necessidades(c) {
    const m = c.medidas, d = c.detalhes, S = c.servicos, ns = [];
    const ap = Calc.areaParedes(m.l, m.c, m.a, m.portas, m.janelas, m.ap, m.aj), apiso = Calc.areaPiso(m.l, m.c);
    const altRev = S.includes("revest") ? Math.min(d.rAlt, m.a): 0;
    const aRev = altRev ? Math.max(0, 2 *(m.l + m.c) * altRev - m.portas * 0.8 * Math.min(2.1, altRev) - m.janelas * Math.max(0, Math.min(m.aj, (altRev - 1.1) * 1.2))): 0;
    const aParPint = Math.max(0, ap - aRev);
    let areaPint = 0;
    const form = [];
    if (S.includes("paredes")) {
        areaPint += aParPint;
        form.push(`Paredes: 2 × (${fmt(m.l)} + ${fmt(m.c)}) × ${fmt(m.a)} − portas e janelas${aRev?" − área revestida":""} = ${fmt(aParPint)} m²`)
    }
    if (S.includes("teto")) {
        areaPint += apiso;
        form.push(`Teto: ${fmt(m.l)} × ${fmt(m.c)} = ${fmt(apiso)} m²`)
    }
    const dem = d.cor ? 3: d.demaos;
    if (areaPint > 0) {
        ns.push( {
            cat: "tinta", qtd: p => areaPint * dem / p.rend, como:  [...form, `Tinta: ${fmt(areaPint)} m² × ${dem} demãos ÷ rendimento do produto (m² por litro)`]
        });
        if (d.nova) ns.push( {
            cat: "selador", qtd: p => areaPint / p.rend, como:  [`Selador: ${fmt(areaPint)} m² ÷ rendimento do produto, 1 demão`]
        });
    }
    if (S.includes("massa")) {
        const a = S.includes("paredes") || ! S.includes("teto") ? aParPint +(S.includes("teto") ? apiso: 0): apiso;
        ns.push( {
            cat: "massa", qtd: p => a * p.cons * d.massaDem, como:  [`Massa corrida: ${fmt(a)} m² × ${fmt(PADROES.massaKgM2,1)} kg/m² × ${d.massaDem} demãos`]
        })
    }
    let areaCer = 0;
    const rej = [];
    if (S.includes("piso")) {
        const perda = d.assent === "diagonal"?.15: .10, area = apiso *(1 + perda), cx = Math.ceil(area / d.m2 - 1e-9);
        ns.push( {
            cat: "piso", caixas: cx, m2: d.m2, como:  [`Piso: ${fmt(apiso)} m² + ${perda*100}% de perda = ${fmt(area)} m² ÷ ${fmt(d.m2)} m² por caixa = ${cx} caixas`]
        });
        areaCer += apiso;
        const [C, L] = d.peca.split("x").map(Number);
        rej.push([C, L, d.junta, apiso, "piso"])
    }
    if (aRev > 0) {
        const area = aRev * 1.1, cx = Math.ceil(area / d.rM2 - 1e-9);
        ns.push( {
            cat: "azulejo", caixas: cx, m2: d.rM2, como:  [`Revestimento: paredes até ${fmt(altRev)} m − portas e janelas = ${fmt(aRev)} m² + 10% = ${fmt(area)} m² ÷ ${fmt(d.rM2)} m² = ${cx} caixas`]
        });
        areaCer += aRev;
        const [C, L] = d.rPeca.split("x").map(Number);
        rej.push([C, L, d.rJunta, aRev, "revestimento"])
    }
    if (areaCer > 0) {
        ns.push( {
            cat: "argamassa", qtd: () => areaCer * PADROES.argamassaKgM2, como:  [`Argamassa: ${fmt(areaCer)} m² × ${PADROES.argamassaKgM2} kg/m²`]
        });
        ns.push( {
            cat: "rejunte", qtd: () => rej.reduce((s, r) => s + Calc.rejunteKg(r [0], r [1], r [2], r [3]), 0), como: rej.map(r => `Rejunte do ${r[4]}: ((${r[0]} + ${r[1]}) ÷ (${r[0]} × ${r[1]})) × ${PADROES.rejunteEsp} mm × ${fmt(r[2],0)} mm × 1,58 × ${fmt(r[3])} m²`)
        })
    }
    if (S.includes("rodape")) {
        const per = Math.max(0, 2 *(m.l + m.c) - m.portas * 0.8), tot = per * 1.1, b = Math.ceil(tot / d.barra - 1e-9);
        ns.push( {
            cat: "rodape", caixas: b, m2: d.barra, barras: true, como:  [`Rodapé: 2 × (${fmt(m.l)} + ${fmt(m.c)}) − ${m.portas} porta(s) × 0,80 = ${fmt(per)} m + 10% = ${fmt(tot)} m ÷ ${fmt(d.barra)} m = ${b} barras`]
        })
    }
    return ns;
}
function opcoes(n, u) {
    return PRODUTOS.filter(p => p.cat === n.cat && p.uso.includes(u)).map(p => {
        let custo, texto, qtd;
        if (n.caixas) {
            qtd = n.caixas * n.m2;
            custo = n.barras ? n.caixas * p.emb [0].p: qtd * p.emb [0].p;
            texto = n.barras ? `${n.caixas} barras de ${fmt(n.m2)} m`: `${n.caixas} caixas · ${fmt(qtd,1)} m²`
        }
        else {
            qtd = n.qtd(p);
            const c = melhorCombo(qtd, p.emb);
            custo = c.custo;
            texto = comboTexto(n.cat, c.itens)
        }
        return {
            id: p.id, nome: p.nome, linha: p.linha, custo, texto, qtd
        };
    }).sort((a, b) => a.custo - b.custo).slice(0, 3);
}
function calcular(c) {
    const u = uso(c.tipo, c);
    c.escolhas = c.escolhas || {
    };
    const itens = necessidades(c).map(n => {
        const ops = opcoes(n, u);
        if (! ops.length) return null;
        const s = ops.find(o => o.id === c.escolhas [n.cat]) || ops.find(o => o.linha === "Intermediária") || ops [0];
        c.escolhas [n.cat] = s.id;
        return {
            cat: n.cat, como: n.como, ops, sel: s.id
        }
    }).filter(Boolean);
    c.pagos = c.pagos || {
    };
    itens.forEach(i => {
        if (c.pagos [i.cat] != null) i.pago = c.pagos [i.cat]
    });
    c.resultado = {
        itens, total: itens.reduce((s, i) => s +(i.pago != null ? i.pago: i.ops.find(o => o.id === i.sel).custo), 0), minimo: itens.reduce((s, i) => s + i.ops [0].custo, 0)
    };
}
/* ================= NAVEGAÇÃO E PASSO A PASSO ================= */
let atual = {
    obraId: null, comodoId: null, etapa: 1, rascunho: null, modo: "res"
};
const obraAtual =() => mem.obras.find(o => o.id === atual.obraId);
const PASSOS = ["Obra", "O que reformar", "Medidas", "Detalhes", "Resultado", "Opções mais baratas", "Gastos"];
function passo(n) {
    const w = $("#workflow");
    if (! n) {
        w.hidden = true;
        return
    } w.hidden = false;
    w.querySelector("ol").innerHTML = PASSOS.map((t, i) => `<li class="${i+1<n?"feito":i+1===n?"agora":""}" ${i+1===n?'aria-current="step"':""}><span class="n">${i+1<n?"✓":i+1}</span>${t}</li>`).join("")
}
const views = ["inicio", "novaobra", "obra", "comodo", "resultado", "gastos", "profissionais"];
let hist = [], viewAtual = "inicio";
function go(v, back) {
    if (! back && viewAtual !== v) hist.push( {
        v: viewAtual, modo: atual.modo, etapa: atual.etapa
    });
    viewAtual = v;
    $("#backbar").hidden = v === "inicio";
    if (["obra", "gastos", "comodo", "resultado"].includes(v) && ! obraAtual()) {
        if (mem.obras [0]) atual.obraId = mem.obras [0].id;
        else {
            toast("Comece uma obra primeiro.");
            v = "inicio"
        }
    }
    viewAtual = v;
    $("#backbar").hidden = v === "inicio";
    views.forEach(x => $("#v-" + x).hidden = x !== v);
    document.querySelectorAll("nav.top button").forEach(b => b.setAttribute("aria-current", String(b.dataset.go === v ||((v === "comodo" || v === "resultado") && b.dataset.go === "obra"))));
    passo( {
        novaobra: 1, resultado: atual.modo === "sug" ? 6: 5, gastos: 7
    } [v] || 0);
    ( {
        inicio: renderInicio, obra: renderObra, resultado: renderResultado, gastos: renderGastos, profissionais: renderPros
    } [v] ||(() => {
    }))();
    montarInfos();
    window.scrollTo(0, 0);
    $("#app").focus( {
        preventScroll: true
    });
}
$("#btn-back").onclick =() => {
    if (viewAtual === "comodo" && atual.etapa > 1) {
        etapa(atual.etapa - 1);
        return
    }
    if (viewAtual === "resultado" && atual.modo === "sug") {
        atual.modo = "res";
        go("resultado", true);
        return
    }
    const h = hist.pop();
    if (! h) {
        go("inicio", true);
        return
    }
    if (h.v === "comodo" && atual.rascunho) {
        go("comodo", true);
        etapa(h.etapa || 1);
        return
    }
    atual.modo = h.modo || "res";
    go(h.v, true)
};
document.addEventListener("click", e => {
    const b = e.target.closest("[data-go]");
    if (b) {
        e.preventDefault();
        go(b.dataset.go)
    }
});
function onSubmit(sel, fn) {
    const f = $(sel);
    f.querySelectorAll("[data-submit]").forEach(b => b.addEventListener("click", fn));
    f.addEventListener("keydown", e => {
        if (e.key === "Enter" && e.target.tagName === "INPUT" && e.target.type !== "checkbox" && e.target.type !== "radio") {
            e.preventDefault();
            fn()
        }
    });
    f.addEventListener("submit", e => e.preventDefault())
}
/* ================= INÍCIO ================= */
function renderInicio() {
    const el = $("#lista-obras");
    if (! mem.obras.length) {
        el.innerHTML = `<div class="card empty" style="grid-column:1/-1"><svg width="110" height="110" aria-hidden="true"><use href="#dico"/></svg><h3>Ainda não tem obra.</h3><p class="muted">Vamos começar? O Dico ajuda em cada passo.</p></div>`;
        return
    }
    el.innerHTML = mem.obras.map(o => {
        const g = gasto(o), pct = o.orcamento ? g / o.orcamento: 0;
        return `<div class="card stack" style="gap:12px"><div class="row between"><h3>${esc(o.nome)}</h3>${o.orcamento?estadoBadge(o):""}</div>
 <p class="muted small">${o.comodos.length} cômodo${o.comodos.length!==1?"s":""} · ${brl(g)} gastos${o.orcamento?` de ${brl(o.orcamento)}`:""}</p>
 ${o.orcamento?`<div class="progress"><div style="width:${Math.min(100,pct*100)}%;background:${cor(pct)}"></div></div>`:""}
 <button class="btn btn-sec" type="button" data-abrir="${o.id}">Abrir obra</button></div>`
    }).join("");
}
$("#lista-obras").addEventListener("click", e => {
    const b = e.target.closest("[data-abrir]");
    if (b) {
        atual.obraId = b.dataset.abrir;
        go("obra")
    }
});
$("#btn-nova").onclick =() => {
    $("#f-obra").reset();
    $("#e-o-nome").textContent = "";
    $("#o-nome").removeAttribute("aria-invalid");
    go("novaobra");
    $("#o-nome").focus()
};
/* ================= NOVA OBRA ================= */
onSubmit("#f-obra", () => {
    const nome = $("#o-nome").value.trim();
    if (! nome) {
        $("#e-o-nome").textContent = "Dê um nome para a obra, por exemplo “Reforma da casa”.";
        $("#o-nome").setAttribute("aria-invalid", "true");
        $("#o-nome").focus();
        return
    }
    $("#o-nome").removeAttribute("aria-invalid");
    $("#e-o-nome").textContent = "";
    const orc = num($("#o-orc").value);
    const o = {
        id: uid("obra"), nome, orcamento: isFinite(orc) && orc > 0 ? orc: null, uf: "SP", comodos:  [], compras:  []
    };
    mem.obras.unshift(o);
    save();
    atual.obraId = o.id;
    toast("Obra criada. Agora, o que você vai reformar?");
    novoComodo();
});
/* ================= OBRA ================= */
const SERVNOME = Object.fromEntries(SERVICOS.map(s => [s [0], s [1]]));
const COMNOME = Object.fromEntries(COMODOS.map(s => [s [0], s [1]]));
function nomeTipo(c) {
    return c.tipo === "outros" ?(c.outroNome || "Outros"): COMNOME [c.tipo]
}
function renderObra() {
    const o = obraAtual(), el = $("#v-obra");
    el.innerHTML = `<div class="row between"><div><span class="eyebrow">Minha obra</span><h1>${esc(o.nome)}</h1></div>
 <div class="row"><button class="btn btn-sec" type="button" data-go="gastos">Ver gastos</button><button class="btn btn-primary" type="button" id="btn-comodo">+ Adicionar cômodo</button></div></div>
 ${o.comodos.length?`<div class="grid">${o.comodos.map(c=>`<div class="card stack" style="gap:12px"><div class="row between"><div><p class="muted small">${esc(nomeTipo(c))}</p><h3>${esc(c.nome)}</h3></div>${c.concluido?`<span class="badge b-ok">Concluído</span>`:`<span class="badge b-or">Em andamento</span>`}</div>
 <div class="row" style="gap:6px">${c.servicos.map(s=>`<span class="badge b-neu">${SERVNOME[s]}</span>`).join("")}</div>
 ${c.resultado?`<p class="num" style="font-weight:700">${brl(c.resultado.total)} <span class="muted small" style="font-weight:500">em material</span></p>`:""}
 <button class="btn btn-sec" type="button" data-ver="${c.id}">Ver materiais</button></div>`).join("")}</div>`
 :`<div class="card empty"><svg width="110" height="110" aria-hidden="true"><use href="#dico"/></svg><h3>Ainda não tem cômodo.</h3><p class="muted">Vamos medir o primeiro?</p></div>`}
 <div><button class="btn-ghost" type="button" id="btn-excluir">Excluir esta obra</button></div>`;
    $("#btn-comodo").onclick = novoComodo;
    el.querySelectorAll("[data-ver]").forEach(b => b.onclick =() => {
        atual.comodoId = b.dataset.ver;
        atual.modo = "res";
        go("resultado")
    });
    $("#btn-excluir").onclick =() => confirmar(`Excluir “${esc(o.nome)}”?`, "Todos os cômodos e gastos desta obra serão apagados. Não dá para desfazer.", "Excluir obra", () => {
        mem.obras = mem.obras.filter(x => x.id !== o.id);
        save();
        atual.obraId = null;
        toast("Obra excluída.");
        go("inicio")
    });
}
/* ================= CÔMODO ================= */
$("#opts-comodo").innerHTML = COMODOS.map(([v, t, d], i) => `<label class="opt-card"><input type="radio" name="tipo" value="${v}" ${i===0?"checked":""}><span class="face"><span class="ck"></span><span class="ic">${icon(d)}</span><span class="t">${t}</span></span></label>`).join("");
$("#opts-serv").innerHTML = SERVICOS.map(([v, t, desc, d]) => `<label class="opt-card"><input type="checkbox" name="serv" value="${v}"><span class="face"><span class="ck"></span><span class="ic">${icon(d)}</span><span class="t">${t}</span><span class="d">${desc}</span></span></label>`).join("");
montarInfos();
document.querySelectorAll(".info-slot").forEach(s => {
    s.insertAdjacentHTML("beforeend", infoBtn(s.dataset.info, s.parentElement.firstChild.textContent.trim()));
    s.removeAttribute("data-info")
});
function resumoComodo() {
    const r = atual.rascunho || {
    },
    m = r.medidas, o = obraAtual();
    let html = `<span class="eyebrow">Resumo</span><h3 style="margin-top:4px">${esc(r.nome||"Novo cômodo")}</h3><dl>
 <dt>Obra</dt><dd>${o?esc(o.nome):"—"}</dd><dt>Cômodo</dt><dd>${r.tipo?esc(nomeTipo(r)):"—"}</dd>
 <dt>Serviços</dt><dd>${r.servicos&&r.servicos.length?r.servicos.map(s=>SERVNOME[s]).join("<br>"):"—"}</dd>`;
    if (m) {
        const ap = Calc.areaParedes(m.l, m.c, m.a, m.portas, m.janelas, m.ap, m.aj);
        html += `<dt>Medidas</dt><dd class="num">${fmt(m.l)} × ${fmt(m.c)} × ${fmt(m.a)} m</dd><dt>Área do piso</dt><dd class="num">${fmt(m.l*m.c)} m²</dd><dt>Área das paredes</dt><dd class="num">${fmt(ap)} m²</dd>`
    }
    html += `</dl><p class="muted small" style="margin-top:14px">Uso indicado: <b>${r.tipo?{interno:"área interna",molhada:"área molhada",externo:"área externa"}[uso(r.tipo,r)]:"—"}</b></p>`;
    $("#resumo-comodo").innerHTML = html;
}
function novoComodo() {
    atual.rascunho = {
        id: uid("comodo"), tipo: "quarto"
    };
    $("#outro-wrap").hidden = true;
    ["#f-c1", "#f-c2", "#f-c3"].forEach(f => $(f).reset());
    ["#e-serv", "#e-medidas", "#e-det"].forEach(x => $(x).textContent = "");
    document.querySelectorAll("#v-comodo input").forEach(i => i.removeAttribute("aria-invalid"));
    go("comodo");
    etapa(1);
}
function etapa(n) {
    atual.etapa = n;
    ["#f-c1", "#f-c2", "#f-c3"].forEach((f, i) => $(f).hidden = i !== n - 1);
    passo(n + 1);
    resumoComodo();
    window.scrollTo(0, 0);
    const first = $(["#f-c1", "#f-c2", "#f-c3"] [n - 1]).querySelector("input:not([type=hidden]),select");
    first && first.focus( {
        preventScroll: true
    })
}
$("#f-c1").addEventListener("change", () => {
    atual.rascunho.tipo = document.querySelector("input[name=tipo]:checked").value;
    $("#outro-wrap").hidden = atual.rascunho.tipo !== "outros";
    if (atual.rascunho.tipo === "outros") atual.rascunho.usoOutro = $("#c-outro-uso").value;
    atual.rascunho.servicos = [...document.querySelectorAll("input[name=serv]:checked")].map(i => i.value);
    if (atual.rascunho.servicos.length) $("#e-serv").textContent = "";
    resumoComodo()
});
onSubmit("#f-c1", () => {
    const serv = [...document.querySelectorAll("input[name=serv]:checked")].map(i => i.value);
    if (! serv.length) {
        $("#e-serv").textContent = "Escolha pelo menos um serviço.";
        return
    }
    const tipo = document.querySelector("input[name=tipo]:checked").value;
    let outroNome = "";
    if (tipo === "outros") {
        outroNome = $("#c-outro").value.trim();
        if (! outroNome) {
            $("#e-serv").textContent = "Escreva o nome da área, por exemplo “Closet”.";
            $("#c-outro").setAttribute("aria-invalid", "true");
            $("#c-outro").focus();
            return
        } $("#c-outro").removeAttribute("aria-invalid")
    }
    Object.assign(atual.rascunho,  {
        tipo, outroNome, usoOutro: tipo === "outros" ? $("#c-outro-uso").value: null, nome: $("#c-nome").value.trim() || outroNome || COMNOME [tipo], servicos: serv
    });
    etapa(2);
});
function vm(id, min, max, msg) {
    const el = $(id), v = num(el.value), ok = isFinite(v) && v >= min && v <= max;
    el.setAttribute("aria-invalid", String(! ok));
    return ok ? v:  {
        erro: msg, el
    }
}
onSubmit("#f-c2", () => {
    const l = vm("#m-larg", .5, 30, "Digite a largura em metros, entre 0,5 e 30. Exemplo: 3,00."), c = vm("#m-comp", .5, 30, "Digite o comprimento em metros, entre 0,5 e 30. Exemplo: 4,00."),
    a = vm("#m-alt", 2, 6, "Digite a altura da parede em metros, por exemplo 2,70."), ap = vm("#m-porta-a", .5, 6, "A área da porta deve ficar entre 0,5 e 6 m²."), aj = vm("#m-janela-a", .2, 10, "A área da janela deve ficar entre 0,2 e 10 m².");
    const err = [l, c, a, ap, aj].find(x => x && x.erro);
    if (err) {
        $("#e-medidas").textContent = err.erro;
        err.el.focus();
        return
    }
    const portas = Number($("#m-portas").value);
    const janelas = Number($("#m-janelas").value);
    if (! [portas, janelas].every(value => Number.isInteger(value) && value >= 0 && value <= 10)) {
        $("#e-medidas").textContent = "Informe quantidades inteiras de portas e janelas, entre 0 e 10.";
        return;
    }
    if (portas * ap + janelas * aj >= 2 *(l + c) * a) {
        $("#e-medidas").textContent = "Portas e janelas somam mais que as paredes. Revise as quantidades ou as áreas.";
        return
    }
    $("#e-medidas").textContent = "";
    atual.rascunho.medidas = {
        l, c, a, portas, janelas, ap, aj
    };
    const S = atual.rascunho.servicos;
    $("#d-pintura").hidden = !(S.includes("paredes") || S.includes("teto"));
    $("#d-massa").hidden = ! S.includes("massa");
    $("#d-piso").hidden = ! S.includes("piso");
    $("#d-revest").hidden = ! S.includes("revest");
    $("#d-rodape").hidden = ! S.includes("rodape");
    const vis = [...document.querySelectorAll("#f-c3 .subsec")].filter(x => ! x.hidden);
    vis.forEach((x, i) => x.style.cssText = i === 0 ? "border-top:0;padding-top:0;margin-top:0": "");
    etapa(3);
});
$("#c2-voltar").onclick =() => etapa(1);
$("#c3-voltar").onclick =() => etapa(2);
$("#d-cor").addEventListener("change", e => {
    if (e.target.checked) $("#d-demaos").value = "3"
});
onSubmit("#f-c3", () => {
    const r = atual.rascunho, S = r.servicos;
    let err = null;
    const d = {
        demaos: + $("#d-demaos").value, acab: $("#d-acab").value, cor: $("#d-cor").checked, nova: $("#d-nova").checked, massaDem: + $("#d-massa-dem").value, peca: $("#d-peca").value, assent: $("#d-assent").value, rPeca: $("#r-peca").value, rAlt: 0
    };
    const chk =(arr) => {
        err = err || arr.find(x => x && x.erro);
        return arr
    };
    if (S.includes("piso")) {
        const [m2, j] = chk([vm("#d-m2", .3, 5, "Digite os m² por caixa que estão na embalagem, por exemplo 2,50."), vm("#d-junta", 1, 10, "A junta deve ficar entre 1 e 10 mm.")]);
        d.m2 = m2;
        d.junta = j
    }
    if (S.includes("revest")) {
        const [ra, m2, j] = chk([vm("#r-alt", .3, 6, "Digite até que altura vai o revestimento, por exemplo 1,50."), vm("#r-m2", .3, 5, "Digite os m² por caixa do revestimento, por exemplo 2,00."), vm("#r-junta", 1, 10, "A junta deve ficar entre 1 e 10 mm.")]);
        d.rAlt = ra;
        d.rM2 = m2;
        d.rJunta = j
    }
    if (S.includes("rodape")) {
        const [b] = chk([vm("#d-barra", 1, 4, "Digite o comprimento da barra em metros, por exemplo 2,40.")]);
        d.barra = b
    }
    if (err) {
        $("#e-det").textContent = err.erro;
        err.el.focus();
        return
    }
    $("#e-det").textContent = "";
    r.detalhes = d;
    r.escolhas = {
    };
    const o = obraAtual();
    o.comodos = o.comodos.filter(x => x.id !== r.id);
    o.comodos.push(r);
    calcular(r);
    save();
    atual.comodoId = r.id;
    atual.modo = "res";
    go("resultado");
});
// Restaura os dados do cômodo nos formulários antes de editar.
function preencherEdicao(comodo) {
    const medidas = comodo.medidas;
    const detalhes = comodo.detalhes;
    const values = {
        "c-nome": comodo.nome,
        "c-outro": comodo.outroNome || "",
        "c-outro-uso": comodo.usoOutro || "interno",
        "m-larg": fmt(medidas.l),
        "m-comp": fmt(medidas.c),
        "m-alt": fmt(medidas.a),
        "m-portas": medidas.portas,
        "m-janelas": medidas.janelas,
        "m-porta-a": fmt(medidas.ap),
        "m-janela-a": fmt(medidas.aj),
        "d-demaos": detalhes.demaos,
        "d-acab": detalhes.acab,
        "d-massa-dem": detalhes.massaDem,
        "d-peca": detalhes.peca,
        "d-m2": fmt(detalhes.m2 || 2.5),
        "d-assent": detalhes.assent,
        "d-junta": fmt(detalhes.junta || 2, 1),
        "r-alt": fmt(detalhes.rAlt || 1.5),
        "r-peca": detalhes.rPeca || "300x600",
        "r-m2": fmt(detalhes.rM2 || 2),
        "r-junta": fmt(detalhes.rJunta || 2, 1),
        "d-barra": fmt(detalhes.barra || 2.4)
    };
    Object.entries(values).forEach(([id, value]) => {
        document.getElementById(id).value = value;
    });
    document.querySelectorAll("input[name=tipo]").forEach(input => {
        input.checked = input.value === comodo.tipo;
    });
    document.querySelectorAll("input[name=serv]").forEach(input => {
        input.checked = comodo.servicos.includes(input.value);
    });
    $("#d-cor").checked = detalhes.cor;
    $("#d-nova").checked = detalhes.nova;
    $("#outro-wrap").hidden = comodo.tipo !== "outros";
}
/* ================= RESULTADO E OPÇÕES ================= */
function renderResultado() {
    const o = obraAtual(), c = o && o.comodos.find(x => x.id === atual.comodoId);
    if (! c) {
        go("obra");
        return
    }
    calcular(c);
    save();
    const R = c.resultado, econ = R.total - R.minimo, el = $("#v-resultado"), sug = atual.modo === "sug";
    const lista = `<div class="card"><div class="card-head" style="margin-bottom:8px"><span class="eyebrow">Passo 5 de 7</span><div class="row between"><h1>Você vai precisar</h1><span class="badge b-ok">✓ Material na medida</span></div><p class="muted">${esc(c.nome)} · ${c.servicos.map(s=>SERVNOME[s]).join(", ")}</p></div>
 <div class="tbl"><table class="mtable"><thead><tr><th>Material</th><th>Quantidade</th><th class="r">Custo</th></tr></thead><tbody>
 ${R.itens.map(i=>{const s=i.ops.find(o=>o.id===i.sel);return `<tr><td><p style="font-weight:700">${NOMEMAT[i.cat]}</p><p class="muted small">${esc(s.nome)} · ${s.linha}</p></td><td><p style="font-weight:600">${s.texto}</p><p class="muted small num">${fmt(s.qtd)} ${UNID[i.cat]} necessários</p></td><td class="r num" style="font-weight:700">${i.pago!=null?`${brl(i.pago)}<br><span class="badge b-ok" style="margin-top:4px">Valor pago</span>`:brl(s.custo)}</td></tr>`}).join("")}
 </tbody></table></div>
 <details class="calc"><summary>Como calculamos</summary><ul>${R.itens.flatMap(i=>i.como).map(t=>`<li>${esc(t)}</li>`).join("")}<li>Quantidades arredondadas para embalagens inteiras, na combinação mais barata.</li></ul></details></div>`;
    const kpi = `<div class="kpi"><div class="hl"><span class="small">Custo estimado do material</span><strong class="num">${brl(R.total)}</strong></div>
 <div><span class="small muted">Com as opções mais acessíveis</span><strong class="num">${brl(R.minimo)}</strong></div>
 <div><span class="small muted">Economia possível</span><strong class="num" style="color:var(--verde-ok)">${brl(Math.max(0,econ))}</strong></div></div>`;
    const opc = `<div class="card"><div class="card-head"><span class="eyebrow">Passo 6 de 7</span><h1>Opções mais acessíveis</h1><p class="muted">Ordenadas pelo custo para cobrir o seu cômodo, não pelo preço da embalagem. ${FONTE}.</p></div><div class="stack" style="gap:26px">
 ${R.itens.map(i=>{const cur=i.ops.find(o=>o.id===i.sel).custo;return `<div><h3 style="margin-bottom:12px">${NOMEMAT[i.cat]}</h3><div class="sug">${i.ops.map((op,k)=>`<div class="sopt ${op.id===i.sel?"sel":""}">
 <div class="row between">${k===0?`<span class="badge b-ok">Mais acessível</span>`:`<span class="badge b-neu">${op.linha}</span>`}${op.id===i.sel?`<span class="small" style="font-weight:700;color:var(--laranja-escuro)">✓ Escolhida</span>`:""}</div>
 <p style="font-weight:700;margin-top:6px">${esc(op.nome)}</p><p class="muted small">${op.texto}</p><p class="price num">${brl(op.custo)}</p>
 ${op.id!==i.sel&&op.custo<cur?`<p class="small" style="color:var(--verde-ok);font-weight:700">Economiza ${brl(cur-op.custo)}</p>`:op.id!==i.sel?`<p class="small muted">${brl(op.custo-cur)} a mais</p>`:`<p class="small muted">&nbsp;</p>`}
 <div class="row" style="justify-content:space-between;margin-top:4px">${op.id!==i.sel?`<button class="btn btn-sec" style="min-height:40px;padding:0 14px" type="button" data-usar="${i.cat}|${op.id}">Usar esta</button>`:"<span></span>"}<a class="btn-ghost" href="https://www.google.com/search?tbm=shop&q=${encodeURIComponent(op.nome+" "+op.linha)}" target="_blank" rel="noopener">Ver nas lojas ↗</a></div></div>`).join("")}</div></div>`}).join("")}</div></div>`;
    const pedidoComodo = montarPedidoProfissionais({ servicos: c.servicos.map(s => (typeof MAPA_SERVICO_COMODO!=="undefined"&&MAPA_SERVICO_COMODO[s]) || s), descricao: c.nome + " - " + c.servicos.map(s=>SERVNOME[s]).join(", "), ambiente: nomeTipo(c), regiao: "", comodoId: c.id, obraId: o.id });
    const recComodo = recomendarProfissionais(pedidoComodo);
    const topComodo = recComodo.resultados.slice(0,3);
    const proCard = `<div class="card"><div class="row between" style="margin-bottom:14px"><div><h2>Profissionais recomendados para sua obra</h2><p class="muted small">Sugestões baseadas nas informações cadastradas para ${esc(c.servicos.map(s=>SERVNOME[s]).join(", "))}. Confirme qualificações e disponibilidade antes de contratar.</p></div><div class="row"><button class="btn btn-sec" type="button" id="b-ver-reco-pro">Ver recomendações completas</button><button class="btn-ghost" type="button" data-go="profissionais">Abrir profissionais</button></div></div>${topComodo.length?renderRecoCardsCompactos(topComodo,pedidoComodo):`<div class="warn-box">Ainda não há profissionais compatíveis cadastrados para esta necessidade. Você pode cadastrar profissionais ou usar "Pensando em algo mais?" para organizar sua solicitação.</div>`}</div>`;
    el.innerHTML = `${sug?opc:lista}${kpi}<div class="card"><h2>Consultar preços na internet</h2><p class="muted">Pesquise anúncios e confira embalagem, rendimento e frete antes da compra. O orçamento acima usa preços ilustrativos.</p><div class="row">${R.itens.map(i=>`<a class="btn btn-sec" href="precos.html?categoria=${encodeURIComponent(i.cat)}" target="_blank" rel="noopener">Pesquisar ${esc(NOMEMAT[i.cat])} ↗</a>`).join('')}</div></div>${proCard}
 <div class="actions" style="border:0;margin-top:0;padding-top:0">${sug?`<button class="btn btn-sec" type="button" id="b-volta">Voltar ao resultado</button><button class="btn btn-primary" type="button" id="b-salvar">Próximo: salvar no orçamento</button>`:`<div class="row"><button class="btn btn-sec" type="button" id="b-editar">Editar medidas</button><button class="btn-ghost" type="button" id="b-concluir">${c.concluido?"✓ Cômodo concluído":"Concluir este cômodo"}</button></div><button class="btn btn-primary" type="button" id="b-sug">Próximo: ver opções mais baratas</button>`}</div>`;
    el.querySelectorAll("[data-usar]").forEach(b => b.onclick =() => {
        const [cat, id] = b.dataset.usar.split("|");
        c.escolhas [cat] = id;
        save();
        const y = window.scrollY;
        renderResultado();
        window.scrollTo(0, y);
        toast("Opção atualizada.")
    });
    const on =(id, f) => {
        const b = $(id);
        if (b) b.onclick = f
    };
    on("#b-sug", () => {
        atual.modo = "sug";
        go("resultado")
    });
    on("#b-volta", () => {
        atual.modo = "res";
        go("resultado")
    });
    on("#b-salvar", () => {
        c.salvo = true;
        save();
        toast("Lista salva no orçamento da obra.");
        go("gastos")
    });
    on("#b-editar", () => {
        atual.rascunho = structuredClone(c);
        preencherEdicao(atual.rascunho);
        go("comodo");
        etapa(2)
    });
    on("#b-concluir", () => concluir(c));
    on("#b-ver-reco-pro", () => { atual.pedidoContext = { ...pedidoComodo, descricao: (pedidoComodo.descricao||"") }; go("profissionais"); });
}
/* ================= GASTOS ================= */
const gasto = o => o.compras.reduce((s, x) => s + x.valor, 0) + o.comodos.reduce((s, c) => s + Object.values(c.pagos || {
}).reduce((a, b) => a + b, 0), 0);
const cor = p => p > 1 ? "var(--erro)": p >= .8 ? "var(--atencao)": "var(--verde)";
function estadoBadge(o) {
    const g = gasto(o), p = g / o.orcamento;
    return p > 1 ? `<span class="badge b-err">Orçamento estourado em ${brl(g-o.orcamento)}</span>`: p >= .8 ? `<span class="badge b-warn">Perto do limite: faltam ${brl(o.orcamento-g)}</span>`: `<span class="badge b-ok">Dentro do orçamento</span>`
}
function renderGastos() {
    const o = obraAtual(), g = gasto(o), el = $("#v-gastos"), orc = o.orcamento, pct = orc ? g / orc: 0;
    const est = o.comodos.filter(c => c.salvo && c.resultado).reduce((s, c) => s + c.resultado.total, 0);
    el.innerHTML = `<div class="row between"><div><span class="eyebrow">Passo 7 de 7</span><h1>Meus gastos</h1><p class="muted">${esc(o.nome)}</p></div>${orc?estadoBadge(o):""}</div>
 <div class="kpi"><div class="hl"><span class="small">Já gasto</span><strong class="num">${brl(g)}</strong></div><div><span class="small muted">Orçamento</span><strong class="num">${orc?brl(orc):"—"}</strong></div><div><span class="small muted">Material estimado</span><strong class="num">${brl(est)}</strong></div></div>
 ${orc?`<div class="card stack" style="gap:10px"><div class="row between small"><span>Uso do orçamento</span><b class="num">${Math.round(pct*100)}%</b></div><div class="progress" role="img" aria-label="${Math.round(pct*100)}% do orçamento usado"><div style="width:${Math.min(100,pct*100)}%;background:${cor(pct)}"></div></div><p class="muted small">Avisamos ao chegar a 80% e ao passar do limite.</p></div>`:""}
 <div class="layout"><form id="f-compra" class="card" novalidate><div class="card-head"><h2>Registrar compra</h2></div>
 <div class="fields">
 <div class="field"><label class="lbl" for="g-item" data-info="O que foi comprado ou pago, por exemplo “Tinta 2 galões” ou “Pintor”.">Item</label><input id="g-item" placeholder="Ex.: Tinta 2 galões"></div>
 <div class="field"><label class="lbl" for="g-loja" data-info="Onde você comprou. Ajuda a comparar preços depois.">Loja <span class="opc">(opcional)</span></label><input id="g-loja" placeholder="Ex.: Loja do bairro"></div>
 <div class="field"><label class="lbl" for="g-valor" data-info="Valor total pago, em reais. Ele soma no uso do orçamento.">Valor</label><div class="inwrap"><input id="g-valor" inputmode="decimal" placeholder="179,80" style="padding-left:40px"><span class="suf" style="left:14px;right:auto">R$</span></div></div>
 <div class="field"><label class="lbl" for="g-data" data-info="Dia da compra ou do pagamento.">Data</label><input id="g-data" type="date" value="${dataLocal()}"></div>
 <div class="field"><label class="lbl" for="g-cat" data-info="<b>Material</b> é o que você compra na loja. <b>Mão de obra</b> é o pagamento de pintor, pedreiro ou outro profissional.">Categoria</label><select id="g-cat"><option value="material">Material</option><option value="mao">Mão de obra</option></select></div>
 </div><p class="hint-err" id="e-compra" role="alert" style="margin-top:12px"></p>
 <div class="actions"><span></span><button class="btn btn-primary" type="button" data-submit>Registrar compra</button></div></form>
 <aside class="card stack" style="gap:12px"><h3>Próximos passos</h3><button class="btn btn-sec" type="button" id="b-outro">+ Adicionar outro cômodo</button><button class="btn btn-sec" type="button" id="b-export">Exportar resumo</button><button class="btn-ghost" type="button" data-go="obra" style="align-self:flex-start">Ver todos os cômodos</button></aside></div>
 ${matTabela(o)}
 <div class="card"><div class="card-head" style="margin-bottom:6px"><h2>Outras compras e serviços</h2></div>${o.compras.length?`<div class="tbl"><table class="lst"><thead><tr><th>Data</th><th>Item</th><th>Loja</th><th>Categoria</th><th style="text-align:right">Valor</th><th><span style="position:absolute;left:-9999px">Ações</span></th></tr></thead><tbody>
 ${o.compras.map((x,i)=>`<tr><td class="num">${new Date(x.data+"T12:00").toLocaleDateString("pt-BR")}</td><td style="font-weight:600">${esc(x.item)}</td><td class="muted">${esc(x.loja||"—")}</td><td><span class="badge b-neu">${x.cat==="mao"?"Mão de obra":"Material"}</span></td><td class="num" style="text-align:right;font-weight:700">${brl(x.valor)}</td><td style="text-align:right"><button class="btn-ghost" type="button" data-del="${i}" aria-label="Excluir ${esc(x.item)}">Excluir</button></td></tr>`).join("")}</tbody></table></div>`:`<p class="muted">Nenhuma compra ainda. Registre a primeira acima.</p>`}</div>`;
    onSubmit("#f-compra", () => {
        const item = $("#g-item").value.trim(), valor = num($("#g-valor").value);
        if (! item) {
            $("#e-compra").textContent = "Diga o que foi comprado.";
            $("#g-item").focus();
            return
        }
        if (! Number.isFinite(valor) || !(valor > 0)) {
            $("#e-compra").textContent = "Digite o valor em reais, por exemplo 179,80.";
            $("#g-valor").focus();
            return
        }
        if (! /^\d{4}-\d{2}-\d{2}$/.test($("#g-data").value)) {
            $("#e-compra").textContent = "Informe a data da compra.";
            $("#g-data").focus();
            return;
        }
        const antes = orc ? gasto(o) / orc: 0;
        o.compras.unshift( {
            item, loja: $("#g-loja").value.trim(), valor, data: $("#g-data").value, cat: $("#g-cat").value
        });
        save();
        const dep = orc ? gasto(o) / orc: 0;
        renderGastos();
        montarInfos();
        toast(orc && dep > 1 && antes <= 1 ? "Atenção: o orçamento estourou.": orc && dep >= .8 && antes < .8 ? `Perto do limite: faltam ${brl(orc-gasto(o))}.`: "Compra registrada.")
    });
    el.querySelectorAll("[data-del]").forEach(b => b.onclick =() => {
        o.compras.splice(+ b.dataset.del, 1);
        save();
        renderGastos();
        montarInfos();
        toast("Compra excluída.")
    });
    $("#b-outro").onclick = novoComodo;
    $("#b-export").onclick =() => exportar(o);
}
function matTabela(o) {
    const cs = o.comodos.filter(c => c.salvo && c.resultado);
    if (! cs.length) return "";
    return `<div class="card"><div class="card-head" style="margin-bottom:6px"><h2>Materiais da obra</h2><p class="muted small">Já comprou? Digite quanto pagou. O valor pago substitui o preço de referência e entra no que já foi gasto.</p></div><div class="tbl"><table class="lst"><thead><tr><th>Cômodo</th><th>Material</th><th style="text-align:right">Estimado</th><th style="text-align:right">Valor pago</th><th>Situação</th></tr></thead><tbody>
 ${cs.flatMap(c=>c.resultado.itens.map(i=>{const s=i.ops.find(x=>x.id===i.sel),pg=(c.pagos||{})[i.cat];return `<tr><td>${esc(c.nome)}</td><td><b>${NOMEMAT[i.cat]}</b><br><span class="muted small">${s.texto}</span></td><td class="num" style="text-align:right">${brl(s.custo)}</td>
 <td style="text-align:right"><label class="sr" for="pg-${c.id}-${i.cat}" style="position:absolute;left:-9999px">Valor pago por ${NOMEMAT[i.cat]} em ${esc(c.nome)}</label><input class="pago" id="pg-${c.id}-${i.cat}" data-pago="${c.id}|${i.cat}" inputmode="decimal" placeholder="0,00" value="${pg!=null?fmt(pg):""}"></td>
 <td>${pg!=null?`<span class="badge b-ok">Comprado</span>${pg<s.custo?`<br><span class="small" style="color:var(--verde-ok)">${brl(s.custo-pg)} abaixo</span>`:pg>s.custo?`<br><span class="small" style="color:var(--atencao)">${brl(pg-s.custo)} acima</span>`:""}`:`<span class="badge b-neu">A comprar</span>`}</td></tr>`})).join("")}</tbody></table></div></div>`
}
document.addEventListener("change", e => {
    const el = e.target;
    if (! el.dataset || ! el.dataset.pago) return;
    const [cid, cat] = el.dataset.pago.split("|");
    const o = obraAtual();
    const c = o.comodos.find(x => x.id === cid);
    c.pagos = c.pagos || {
    };
    const v = num(el.value);
    if (isFinite(v) && v > 0) c.pagos [cat] = v;
    else delete c.pagos [cat];
    calcular(c);
    save();
    const y = window.scrollY;
    renderGastos();
    montarInfos();
    window.scrollTo(0, y);
    toast(isFinite(v) && v > 0 ? "Valor pago salvo.": "Valor pago removido.")
});
function exportar(o) {
    const L = [`Obrinha – ${o.nome}`, `Orçamento: ${o.orcamento?brl(o.orcamento):"não definido"} · Gasto: ${brl(gasto(o))}`, "", ...o.comodos.filter(c => c.resultado).flatMap(c => [`${c.nome}: ${brl(c.resultado.total)}`, ...c.resultado.itens.map(i => {
        const s = i.ops.find(x => x.id === i.sel);
        return `  - ${NOMEMAT[i.cat]}: ${s.texto} (${s.nome}) ${brl(s.custo)}`
    })]), "", "Compras:", ...o.compras.map(x => `  ${x.data} · ${x.item} · ${brl(x.valor)}`)];
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([L.join("\n")],  {
        type: "text/plain"
    }));
    a.download = `obrinha-${o.nome.replace(/\W+/g,"-").toLowerCase()}.txt`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast("Resumo baixado.");
}
/* ================= PROFISSIONAIS ================= */
const telDig = t => String(t || "").replace(/\D/g, "");
function servicoBuscaNome(id){ const f = (typeof SERVICOS_BUSCA !== "undefined" ? SERVICOS_BUSCA : []).find(x => x[0] === id); return f ? f[1] : id; }
function espNome(id){ return (typeof ESPECIALIDADES !== "undefined" && ESPECIALIDADES[id] && ESPECIALIDADES[id].nome) || id || "Não informada"; }
function waLink(tel, texto){ const d = telDig(tel); return d ? ("https://wa.me/55" + d + "?text=" + encodeURIComponent(texto || "Olá! Vi seu contato na Obrinha e gostaria de conversar sobre um serviço.")) : ""; }
function copiarTexto(t, okMsg){ (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => toast(okMsg || "Copiado."), () => toast("Não foi possível copiar automaticamente.")); }
function pedidoDeServicosComodo(servs){ return (servs || []).map(x => (typeof MAPA_SERVICO_COMODO !== "undefined" && MAPA_SERVICO_COMODO[x]) || x); }
function prosPara(servs){
  if (typeof montarPedidoProfissionais !== "function" || typeof recomendarProfissionais !== "function") {
    const alvo = new Set((servs || []).map(x => (typeof SERV2PRO !== "undefined" && SERV2PRO[x]) || x));
    return (mem.pros || []).filter(p => !alvo.size || (p.servicos || []).some(x => alvo.has(x)));
  }
  const pedido = montarPedidoProfissionais({ servicos: pedidoDeServicosComodo(servs) });
  return recomendarProfissionais(pedido).resultados.map(r => r.pro);
}

function resumoSolicitacaoTexto(sol){
  const ped = sol.pedido || {}; const f = sol.ficha || {};
  return [
    "Obrinha - Solicitação de atendimento",
    "Criada em: " + new Date(sol.criadoEm || Date.now()).toLocaleString("pt-BR"),
    "Status: " + (sol.status || "em andamento"),
    "",
    "Resumo: " + (f.resumo || ped.descricao || "Não informado"),
    "Ambiente: " + (f.ambiente || ped.ambiente || "Não informado"),
    "Região: " + (f.regiao || ped.regiao || "Não informada"),
    "Serviços/necessidades identificadas: " + ((f.servicos || ped.servicos || []).map(servicoBuscaNome).join(", ") || "A identificar"),
    "Especialidades possivelmente necessárias: " + ((f.especialidades || ped.especialidadesNecessarias || []).map(espNome).join(", ") || "A identificar"),
    "Habilidades necessárias: " + ((f.habilidades || ped.habilidadesNecessarias || []).join(", ") || "A identificar"),
    "Informações complementares: " + (f.complementares || "Não informadas"),
    "Dúvidas a esclarecer: " + (f.duvidas || "Confirmar escopo, medidas, materiais e responsabilidades com o profissional."),
    "",
    "Observação: necessidades apresentadas como possibilidades identificadas, não como diagnóstico técnico definitivo. Recomendações são sugestões baseadas nas informações cadastradas."
  ].join("\n");
}

function cardAcoesContato(pro, pedido){
  const msg = "Olá! Vi seu contato na Obrinha e gostaria de conversar sobre: " + ((pedido && pedido.descricao) || "um serviço de reforma") + ".";
  if (pro.exemplo) return '<span class="muted small">Contato fictício para demonstração.</span>';
  return '<div class="row" style="gap:8px"><a class="btn btn-primary" style="min-height:40px;padding:0 14px" href="' + waLink(pro.tel, msg) + '" target="_blank" rel="noopener">Conversar pelo WhatsApp</a><button class="btn btn-sec" style="min-height:40px;padding:0 14px" type="button" data-copiar="' + esc(pro.tel || "") + '">Copiar contato</button></div>';
}

function renderProCardDetalhado(item, pedido){
  const pro = item.pro || {}; const r = item || {};
  const grupoCls = r.grupo === "alta" ? "score-alta" : r.grupo === "parcial" ? "score-parcial" : "score-confirmar";
  const grupoNome = r.grupo === "alta" ? "Alta compatibilidade" : r.grupo === "parcial" ? "Compatibilidade parcial" : "Compatibilidade a confirmar";
  const habsRel = (r.matchedHabs || []).slice(0, 6);
  const motivos = (r.motivos || []).slice(0, 5);
  const faltas = (r.faltasConfirmar || []).slice(0, 4);
  const perfilId = "perfil-" + (pro.id || uid("p"));
  const msgShare = resumoSolicitacaoTexto({ pedido: pedido || { descricao: "" }, ficha: { resumo: (pedido && pedido.descricao) || "", servicos: (pedido && pedido.servicos) || [], especialidades: (pedido && pedido.especialidadesNecessarias) || [], habilidades: (pedido && pedido.habilidadesNecessarias) || [], regiao: (pedido && pedido.regiao) || "", complementares: "", duvidas: "Confirmar escopo e responsabilidades com o profissional." }, criadoEm: new Date().toISOString(), status: "rascunho" });
  return '<div class="pro-card">' +
    '<div class="head"><div><p style="font-weight:700;font-size:16px">' + esc(pro.nome || "") + (pro.exemplo ? ' <span class="badge b-neu">Exemplo</span>' : "") + '</p><p class="muted small">' + esc(espNome(pro.especialidade)) + (pro.regiao ? " · " + esc(pro.regiao) : "") + '</p></div><span class="score-pill ' + grupoCls + '">' + (r.score != null ? r.score : 0) + '% · ' + grupoNome + '</span></div>' +
    (habsRel.length ? '<div class="tag-row">' + habsRel.map(h => '<span class="tag">' + esc(h) + '</span>').join("") + '</div>' : '<p class="muted small">Nenhuma habilidade correspondente identificada automaticamente; confirme diretamente com o profissional.</p>') +
    (pro.experienciaAnos != null ? '<p class="small"><b>Experiência informada:</b> ' + esc(String(pro.experienciaAnos)) + ' ano(s).</p>' : "") +
    (pro.disponibilidade ? '<p class="small"><b>Disponibilidade informada:</b> ' + esc(pro.disponibilidade) + '</p>' : "") +
    '<div><p class="small" style="font-weight:700;margin-bottom:4px">Por que recomendamos?</p><ul class="motivos">' + (motivos.map(m => '<li>' + esc(m) + '</li>').join("") || '<li>Compatibilidade calculada com base no cadastro.</li>') + '</ul></div>' +
    (faltas.length ? '<div class="warn-box"><b>A confirmar:</b><ul class="motivos" style="margin-top:4px">' + faltas.map(f => '<li>' + esc(f) + '</li>').join("") + '</ul></div>' : "") +
    '<div class="row" style="gap:8px"><button class="btn btn-sec" style="min-height:38px;padding:0 12px" type="button" data-toggle="' + perfilId + '">Ver perfil completo</button></div>' +
    '<div id="' + perfilId + '" hidden class="stack" style="gap:6px;border-top:1px solid var(--linha);padding-top:8px">' +
      (pro.descricaoTrabalhos ? '<p class="small"><b>Trabalhos realizados:</b> ' + esc(pro.descricaoTrabalhos) + '</p>' : "") +
      (pro.tiposProjetos ? '<p class="small"><b>Tipos de projetos:</b> ' + esc(pro.tiposProjetos) + '</p>' : "") +
      (pro.raioAtendimento ? '<p class="small"><b>Raio de atendimento:</b> ' + esc(pro.raioAtendimento) + '</p>' : "") +
      (pro.portfolio ? '<p class="small"><b>Portfólio/fotos:</b> ' + esc(pro.portfolio) + '</p>' : "") +
      (pro.fazReformasCompletas === true ? '<p class="small"><b>Atendimento:</b> Informa realizar reformas completas.</p>' : pro.fazReformasCompletas === false ? '<p class="small"><b>Atendimento:</b> Informa realizar serviços específicos.</p>' : "") +
      (pro.obs ? '<p class="small"><b>Observações:</b> ' + esc(pro.obs) + '</p>' : "") +
      (pro.tel ? '<p class="small"><b>Telefone:</b> <span class="tel">' + esc(pro.tel) + '</span></p>' : "") +
      '<p class="small-note">Sugestão calculada automaticamente; não representa verificação, certificação ou garantia de adequação. Antes de contratar, confirme qualificações e responsabilidades necessárias.</p>' +
    '</div>' +
    cardAcoesContato(pro, pedido) +
    '<div class="row" style="gap:8px"><button class="btn-ghost" type="button" data-copiar-texto="' + esc(msgShare) + '" data-copy-label="Resumo copiado. Revise antes de compartilhar.">Copiar resumo da solicitação</button></div>' +
  '</div>';
}

function renderRecoCardsCompactos(itens, pedido){ return '<div class="reco-grid">' + (itens || []).map(it => renderProCardDetalhado(it, pedido)).join("") + '</div>'; }

function renderRecoGroups(container, rec, pedido){
  const vazio = $("#pro-reco-vazio"); const res = $("#pro-reco-resultado"); const porNec = $("#pro-reco-por-necessidade");
  if (!rec || !rec.resultados || !rec.resultados.length) {
    if (vazio) { vazio.hidden = false; vazio.innerHTML = '<div class="warn-box">Não encontramos profissionais compatíveis no cadastro para esta solicitação. Você pode ajustar a busca, cadastrar profissionais ou usar "Pensando em algo mais?" para organizar e encaminhar sua solicitação.</div>'; }
    if (res) { res.hidden = true; res.innerHTML = ""; }
    if (porNec) { porNec.hidden = true; porNec.innerHTML = ""; }
    return;
  }
  if (vazio) vazio.hidden = true;
  const mk = (titulo, itens, desc) => (itens && itens.length) ? '<div class="reco-group"><h3>' + titulo + ' <span class="badge b-neu">' + itens.length + '</span></h3><p class="muted small" style="margin-bottom:10px">' + esc(desc) + '</p>' + renderRecoCardsCompactos(itens, pedido) + '</div>' : "";
  const blocos = [
    mk("Alta compatibilidade", rec.grupos.alta || [], "Maior aderência às necessidades informadas, com base no cadastro."),
    mk("Compatibilidade parcial", rec.grupos.parcial || [], "Podem atender parte do pedido; confirme os pontos indicados."),
    mk("Compatibilidade a confirmar", rec.grupos.confirmar || [], "Há indícios de relação, mas faltam informações importantes para confirmar.")
  ];
  if (res) { res.hidden = false; res.innerHTML = blocos.filter(Boolean).join("") || ""; }

  const multi = (typeof recomendacoesPorNecessidade === "function" ? recomendacoesPorNecessidade(pedido) : []);
  if (porNec) {
    if ((pedido.servicos || []).length > 1) {
      porNec.hidden = false;
      porNec.innerHTML = '<div class="reco-group"><h3>Profissionais por necessidade</h3><p class="muted small">Quando o projeto envolve especialidades diferentes, você pode combinar profissionais. As indicações abaixo são sugestões por necessidade (não conclusões técnicas definitivas).</p>' +
        multi.map(n => '<div class="necessidade-bloco"><h4 style="margin-bottom:6px">' + esc(n.nome) + '</h4>' + (n.resultados && n.resultados.length ? renderRecoCardsCompactos(n.resultados.slice(0, 3), Object.assign({}, pedido, { servicos: [n.servico] })) : '<p class="muted small">Ainda não há alguém disponível no cadastro para esta necessidade específica.</p>') + '</div>').join("") + '</div>';
    } else { porNec.hidden = true; porNec.innerHTML = ""; }
  }
}

// Assistente local "Pensando em algo mais?" (sem IA externa configurada)
let assistState = null;
function iniciarAssistente(prefill){
  const box = $("#assist-chat"); if (!box) return;
  assistState = {
    id: uid("sol"), criadoEm: new Date().toISOString(), finalizado: false, pedirHumano: false,
    dados: { descricao: (prefill && prefill.descricao) || "", ambiente: (prefill && prefill.ambiente) || "", detalhes: "", tamanho: "", regiao: (prefill && prefill.regiao) || "", referencia: "", preferencia: "" },
    mensagens: []
  };
  box.hidden = false; renderAssistente();
  addBotMsg("Olá! Sou o assistente da Obrinha. Vou ajudar você a encontrar o profissional ideal para sua reforma. Conte um pouco sobre o que está planejando!");
  if (assistState.dados.descricao) addBotMsg("Recebi uma descrição inicial. Se quiser, complemente com mais detalhes ou responda às perguntas para eu organizar sua solicitação.");
}
function addMsg(de, texto){ if (!assistState) return; assistState.mensagens.push({ de, texto, em: new Date().toISOString() }); renderAssistente(); }
function addBotMsg(t){ addMsg("bot", t); }
function addUserMsg(t){ addMsg("user", t); }
function assistPerguntaAtual(){
  const d = assistState.dados; const desc = (d.descricao || "") + " " + (d.detalhes || "");
  if (!d.ambiente) return "ambiente";
  if (desc.trim().length < 18) return "detalhes";
  if (!d.tamanho) return "tamanho";
  if (!d.regiao) return "regiao";
  return null;
}
function textoPergunta(chave){
  return ({
    ambiente: "Em qual ambiente será realizado o serviço?",
    detalhes: "O que exatamente você deseja modificar ou instalar?",
    tamanho: "É uma reforma pequena, média ou grande (ou reforma completa)?",
    regiao: "Em qual bairro ou região será realizada?"
  })[chave] || null;
}
function interpretarRespostaAssistente(texto){
  const t = String(texto || "").trim(); const d = assistState.dados; const lower = normalizarTexto(t);
  if (/conversar com (uma )?pessoa|atendimento humano|prefiro humano/.test(lower)) { assistState.pedirHumano = true; return; }
  const pergunta = assistPerguntaAtual();
  if (!d.descricao) d.descricao = t;
  else if (pergunta === "ambiente" && !d.ambiente) d.ambiente = t;
  else if (pergunta === "detalhes") d.detalhes = (d.detalhes ? d.detalhes + " " : "") + t;
  else if (pergunta === "tamanho") d.tamanho = t;
  else if (pergunta === "regiao") d.regiao = t;
  else if (!d.referencia && /refer|foto|projeto|exemplo/.test(lower)) d.referencia = t;
  else d.detalhes = (d.detalhes ? d.detalhes + " " : "") + t;
  if (!d.ambiente) {
    const ambs = ["banheiro","cozinha","quarto","sala","quintal","área externa","area externa","fachada","lavanderia","varanda","garagem","escritório","escritorio","corredor"];
    const achado = ambs.find(a => lower.includes(normalizarTexto(a))); if (achado) d.ambiente = achado;
  }
}
function montarFichaAssistente(){
  const d = assistState.dados;
  const descricao = [d.descricao, d.detalhes].filter(Boolean).join(". ");
  const pedido = montarPedidoProfissionais({ servicos: [], descricao, regiao: d.regiao, ambiente: d.ambiente, complexidade: d.tamanho });
  const req = requisitosDeServicos(pedido.servicos || []);
  const duvidas = [];
  if (!d.regiao) duvidas.push("Confirmar bairro/região do atendimento.");
  if (!d.tamanho) duvidas.push("Confirmar se é reforma pequena, média ou completa.");
  if (!(pedido.servicos || []).length) duvidas.push("Detalhar melhor o serviço desejado para identificar especialidades com mais precisão.");
  duvidas.push("Confirmar medidas, materiais, prazos e responsabilidades com o profissional.");
  if (/(eletric|hidraul|estrutur|gas)/.test(normalizarTexto(descricao))) duvidas.push("Verificar se a atividade exige profissional habilitado ou responsável técnico.");
  return { pedido, ficha: {
    resumo: descricao || "Solicitação informada pelo cliente.",
    ambiente: d.ambiente || "Não informado",
    servicos: pedido.servicos || [],
    especialidades: req.especialidades || [],
    habilidades: req.habilidades || [],
    regiao: d.regiao || "Não informada",
    complementares: [d.tamanho ? ("Porte/complexidade: " + d.tamanho) : "", d.referencia ? ("Referência: " + d.referencia) : "", d.preferencia ? ("Preferência: " + d.preferencia) : ""].filter(Boolean).join(" | ") || "Não informadas",
    duvidas: duvidas.join(" ")
  }};
}
function salvarSolicitacao(sol){
  try {
    mem.solicitacoes = Array.isArray(mem.solicitacoes) ? mem.solicitacoes : [];
    const i = mem.solicitacoes.findIndex(x => x.id === sol.id);
    if (i >= 0) mem.solicitacoes[i] = sol; else mem.solicitacoes.unshift(sol);
    save(); return true;
  } catch (e) { toast("Não foi possível salvar a solicitação no navegador."); return false; }
}
function finalizarAssistente(){
  const mf = montarFichaAssistente();
  assistState.ficha = mf.ficha; assistState.pedido = mf.pedido; assistState.finalizado = true;
  assistState.status = assistState.pedirHumano ? "aguardando encaminhamento humano" : "organizada";
  const sol = { id: assistState.id, criadoEm: assistState.criadoEm, atualizadoEm: new Date().toISOString(), status: assistState.status, mensagens: assistState.mensagens.slice(), pedido: mf.pedido, ficha: mf.ficha };
  salvarSolicitacao(sol);
  addBotMsg("Organizei sua solicitação em uma ficha. Revise o resumo abaixo antes de encaminhar. As necessidades são possibilidades identificadas, não conclusões técnicas definitivas.");
  renderAssistente(true);
  if (typeof recomendarProfissionais === "function") {
    const rec = recomendarProfissionais(mf.pedido);
    renderRecoGroups($("#pro-reco-resultado"), rec, mf.pedido);
    proUI.pedido = mf.pedido; proUI.rec = rec;
  }
}
function renderAssistente(mostrarFicha){
  const box = $("#assist-chat"); if (!box || !assistState) return;
  const msgs = assistState.mensagens.map(m => '<div class="msg ' + (m.de === "user" ? "user" : "bot") + '">' + esc(m.texto) + '</div>').join("");
  let fichaHTML = "";
  const mf = (mostrarFicha || assistState.finalizado) ? (assistState.ficha ? { pedido: assistState.pedido, ficha: assistState.ficha } : montarFichaAssistente()) : null;
  if (mf) {
    const pedido = mf.pedido, ficha = mf.ficha;
    const recNec = typeof recomendacoesPorNecessidade === "function" ? recomendacoesPorNecessidade(pedido) : [];
    const semAlguem = recNec.filter(n => !n.resultados || !n.resultados.length).map(n => n.nome);
    fichaHTML = '<div class="solicitacao-card stack" style="gap:8px"><h3>Ficha organizada da solicitação</h3>' +
      '<p><b>Resumo:</b> ' + esc(ficha.resumo) + '</p>' +
      '<p><b>Ambiente:</b> ' + esc(ficha.ambiente) + '</p>' +
      '<p><b>Serviços identificados (possibilidades):</b> ' + ((ficha.servicos || []).length ? ficha.servicos.map(servicoBuscaNome).map(esc).join(", ") : "A identificar com mais detalhes") + '</p>' +
      '<p><b>Especialidades possivelmente necessárias:</b> ' + ((ficha.especialidades || []).length ? ficha.especialidades.map(espNome).map(esc).join(", ") : "A identificar") + '</p>' +
      '<p><b>Habilidades necessárias:</b> ' + ((ficha.habilidades || []).length ? ficha.habilidades.map(esc).join(", ") : "A identificar") + '</p>' +
      '<p><b>Região:</b> ' + esc(ficha.regiao || "Não informada") + '</p>' +
      '<p><b>Informações complementares:</b> ' + esc(ficha.complementares || "Não informadas") + '</p>' +
      '<p><b>Dúvidas a esclarecer:</b> ' + esc(ficha.duvidas || "") + '</p>' +
      (semAlguem.length ? '<p class="warn-box">Ainda não há alguém disponível no cadastro para: ' + esc(semAlguem.join(", ")) + '.</p>' : "") +
      '<p class="small-note">As necessidades são possibilidades identificadas, não conclusões técnicas definitivas. Recomendações e encaminhamentos são sugestões com base no cadastro; confirme qualificações e responsabilidades antes de contratar. Integração com IA externa: não configurada neste ambiente.</p>' +
      '<div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn btn-sec" type="button" id="as-copiar">Copiar resumo</button><button class="btn btn-sec" type="button" id="as-salvar">Salvar solicitação</button><button class="btn btn-sec" type="button" id="as-humano">Prefiro conversar com uma pessoa</button><button class="btn btn-primary" type="button" id="as-compartilhar" ' + ((typeof CONFIG_ATENDIMENTO !== "undefined" && CONFIG_ATENDIMENTO.whatsappHumano) ? "" : "disabled") + '>Compartilhar pelo WhatsApp (canal humano)</button></div>' +
      (!((typeof CONFIG_ATENDIMENTO !== "undefined") && CONFIG_ATENDIMENTO.whatsappHumano) ? '<p class="small-note">Canal humano por WhatsApp não configurado. A solicitação pode ser salva no navegador e copiada/exportada; nenhum envio automático é feito.</p>' : "") +
      (recNec.length ? '<div class="necessidade-bloco"><b>Profissionais recomendados por necessidade (sugestões):</b>' + recNec.map(n => '<div style="margin-top:8px"><span class="badge b-neu">' + esc(n.nome) + '</span> ' + ((n.resultados && n.resultados.length) ? '<span class="small">' + n.resultados.slice(0,2).map(x => esc(x.pro.nome) + " (" + x.score + "%)").join(", ") + '</span>' : '<span class="small muted">Sem compatíveis cadastrados.</span>') + '</div>').join("") + '</div>' : "") +
      '</div>';
  }
  const pergunta = !assistState.finalizado ? assistPerguntaAtual() : null;
  const hint = !assistState.finalizado ? (pergunta ? textoPergunta(pergunta) : 'Se quiser, acrescente referências ou preferências. Quando estiver pronto, clique em "Organizar solicitação".') : "Solicitação organizada e salva localmente. Você pode revisar, copiar ou encaminhar com sua confirmação.";
  box.innerHTML = '<div class="row between"><h3 style="margin:0">Atendimento da Obrinha</h3><span class="badge b-neu">' + ((typeof CONFIG_ATENDIMENTO !== "undefined" && CONFIG_ATENDIMENTO.iaHabilitada) ? "Assistente IA configurado" : "Assistente local (sem IA externa)") + '</span></div>' +
    '<div class="chat-log" id="chat-log">' + (msgs || '<div class="msg bot">Olá!</div>') + '</div>' +
    '<p class="small-note">' + esc(hint) + '</p>' +
    (!assistState.finalizado ? '<form class="chat-form" id="chat-form"><input id="chat-input" placeholder="Escreva sua mensagem..." autocomplete="off"><button class="btn btn-primary" type="submit">Enviar</button></form><div class="row" style="gap:8px"><button class="btn btn-sec" type="button" id="as-organizar">Organizar solicitação</button><button class="btn-ghost" type="button" id="as-humano-inline">Prefiro conversar com uma pessoa</button></div>' : "") +
    fichaHTML +
    '<p class="small-note">Nenhum dado é enviado automaticamente. Compartilhamentos exigem sua ação explícita.</p>';
  const log = $("#chat-log"); if (log) log.scrollTop = log.scrollHeight;
  const form = $("#chat-form");
  if (form) form.onsubmit = (e) => {
    e.preventDefault(); const inp = $("#chat-input"); const v = (inp && inp.value || "").trim(); if (!v) return; inp.value = "";
    addUserMsg(v); interpretarRespostaAssistente(v);
    if (assistState.pedirHumano) { addBotMsg("Certo. Vou organizar o que você informou para encaminhamento humano. Revise o resumo antes de compartilhar."); finalizarAssistente(); return; }
    const prox = assistPerguntaAtual(); if (prox) addBotMsg(textoPergunta(prox)); else addBotMsg("Entendi. Se quiser, posso organizar sua solicitação agora.");
  };
  const org = $("#as-organizar"); if (org) org.onclick = () => finalizarAssistente();
  const humIn = $("#as-humano-inline"); if (humIn) humIn.onclick = () => { assistState.pedirHumano = true; addUserMsg("Prefiro conversar com uma pessoa."); finalizarAssistente(); };
  const copiar = $("#as-copiar"); if (copiar) copiar.onclick = () => { const sol = { pedido: assistState.pedido, ficha: assistState.ficha, criadoEm: assistState.criadoEm, status: assistState.status }; copiarTexto(resumoSolicitacaoTexto(sol), "Resumo copiado. Revise antes de compartilhar."); };
  const salvar = $("#as-salvar"); if (salvar) salvar.onclick = () => { const sol = { id: assistState.id, criadoEm: assistState.criadoEm, atualizadoEm: new Date().toISOString(), status: assistState.status || "salva", mensagens: (assistState.mensagens || []).slice(), pedido: assistState.pedido, ficha: assistState.ficha }; if (salvarSolicitacao(sol)) toast("Solicitação salva no navegador."); };
  const humano = $("#as-humano"); if (humano) humano.onclick = () => { assistState.pedirHumano = true; assistState.status = "aguardando encaminhamento humano"; const sol = { id: assistState.id, criadoEm: assistState.criadoEm, atualizadoEm: new Date().toISOString(), status: assistState.status, mensagens: (assistState.mensagens || []).slice(), pedido: assistState.pedido, ficha: assistState.ficha }; salvarSolicitacao(sol); toast("Solicitação registrada para encaminhamento humano. Revise e compartilhe se desejar."); renderAssistente(true); };
  const comp = $("#as-compartilhar"); if (comp) comp.onclick = () => { if (!(typeof CONFIG_ATENDIMENTO !== "undefined" && CONFIG_ATENDIMENTO.whatsappHumano)) { toast("Canal humano não configurado. Solicitação salva localmente para copiar/exportar."); return; } const sol = { pedido: assistState.pedido, ficha: assistState.ficha, criadoEm: assistState.criadoEm, status: assistState.status }; const url = waLink(CONFIG_ATENDIMENTO.whatsappHumano, resumoSolicitacaoTexto(sol)); if (!url) { toast("Número de atendimento inválido."); return; } window.open(url, "_blank", "noopener"); toast("Abrindo WhatsApp para sua revisão e envio (nenhum envio automático foi feito)."); };
}

function renderSolicitacoesSalvas(){
  const lista = Array.isArray(mem.solicitacoes) ? mem.solicitacoes : [];
  if (!lista.length) { dialogo('<h2>Solicitações salvas</h2><p class="muted">Nenhuma solicitação salva neste navegador.</p><div class="row" style="justify-content:flex-end"><button class="btn btn-primary" type="button" id="dlg-ok">Fechar</button></div>'); $("#dlg-ok").onclick = () => $("#dlg").close(); return; }
  const html = lista.map(s => '<div class="solicitacao-card stack" style="gap:6px"><div class="row between"><b>' + esc((s.ficha && s.ficha.resumo) || "Solicitação") + '</b><span class="badge b-neu">' + esc(new Date(s.criadoEm || Date.now()).toLocaleDateString("pt-BR")) + '</span></div><p class="small muted">Status: ' + esc(s.status || "salva") + '</p><div class="row" style="gap:8px"><button class="btn btn-sec" type="button" data-sol-copy="' + s.id + '">Copiar</button><button class="btn-ghost" type="button" data-sol-del="' + s.id + '">Excluir</button></div></div>').join("");
  dialogo('<h2>Solicitações salvas</h2><p class="muted small">Dados armazenados localmente neste navegador. Você pode excluir quando quiser.</p><div class="stack" style="gap:10px;max-height:55vh;overflow:auto">' + html + '</div><div class="row" style="justify-content:flex-end"><button class="btn btn-primary" type="button" id="dlg-ok">Fechar</button></div>');
  $("#dlg-ok").onclick = () => $("#dlg").close();
  $("#dlg-body").querySelectorAll("[data-sol-copy]").forEach(b => b.onclick = () => { const sol = (mem.solicitacoes || []).find(x => x.id === b.dataset.solCopy); if (sol) copiarTexto(resumoSolicitacaoTexto(sol), "Resumo copiado. Revise antes de compartilhar."); });
  $("#dlg-body").querySelectorAll("[data-sol-del]").forEach(b => b.onclick = () => confirmar("Excluir solicitação?", "A solicitação será removida deste navegador.", "Excluir", () => { mem.solicitacoes = (mem.solicitacoes || []).filter(x => x.id !== b.dataset.solDel); save(); renderSolicitacoesSalvas(); toast("Solicitação excluída."); }));
}

// UI de busca / rede
let proUI = { pedido: null, rec: null };

function preencherBuscaProfissionais(){
  const sel = $("#pb-servicos"); if (sel && !sel.dataset.ready) { sel.innerHTML = (typeof SERVICOS_BUSCA !== "undefined" ? SERVICOS_BUSCA : []).map(([v, t]) => '<option value="' + v + '">' + esc(t) + '</option>').join(""); sel.dataset.ready = "1"; }
  const esp = $("#p-especialidade"); if (esp && !esp.dataset.ready) { esp.innerHTML = '<option value="">Selecione...</option>' + Object.entries(typeof ESPECIALIDADES !== "undefined" ? ESPECIALIDADES : {}).map(([id, e]) => '<option value="' + id + '">' + esc(e.nome) + '</option>').join(""); esp.dataset.ready = "1"; }
  const filtro = $("#pf-filtro"); if (filtro) { const atualV = filtro.value; filtro.innerHTML = '<option value="">Todos</option>' + (typeof SERVICOS_BUSCA !== "undefined" ? SERVICOS_BUSCA : []).map(([v, t]) => '<option value="' + v + '">' + esc(t) + '</option>').join(""); filtro.value = atualV || ""; }
  const comSel = $("#pb-comodo"), wrap = $("#pb-comodo-wrap"); const o = obraAtual();
  if (comSel && wrap) {
    if (o && o.comodos && o.comodos.length) {
      wrap.hidden = false;
      comSel.innerHTML = '<option value="">Não usar cômodo</option>' + o.comodos.map(c => '<option value="' + c.id + '">' + esc(c.nome) + ' — ' + esc((c.servicos || []).map(x => SERVNOME[x] || x).join(", ")) + '</option>').join("");
    } else { wrap.hidden = true; comSel.innerHTML = '<option value="">Sem obra/cômodos</option>'; }
  }
  atualizarHabilidadesForm();
}

function atualizarHabilidadesForm(){
  const esp = $("#p-especialidade"); const box = $("#p-habilidades"); if (!esp || !box) return;
  const e = (typeof ESPECIALIDADES !== "undefined" ? ESPECIALIDADES : {})[esp.value];
  const habs = e ? e.habilidades : [];
  box.innerHTML = habs.map(h => '<label class="chk"><input type="checkbox" name="p-hab" value="' + esc(h) + '"><span>' + esc(h) + '</span></label>').join("") || '<span class="muted small">Selecione uma especialidade para ver habilidades sugeridas (catálogo extensível).</span>';
}

function coletarPedidoDaBusca(){
  const sel = $("#pb-servicos");
  const servs = sel ? [...sel.selectedOptions].map(o => o.value) : [];
  const ambiente = $("#pb-ambiente") ? $("#pb-ambiente").value : "";
  const regiao = $("#pb-regiao") ? $("#pb-regiao").value.trim() : "";
  const complexidade = $("#pb-complexidade") ? $("#pb-complexidade").value : "";
  const desc = $("#pb-desc") ? $("#pb-desc").value.trim() : "";
  const comodoId = $("#pb-comodo") ? $("#pb-comodo").value : "";
  let pedido = montarPedidoProfissionais({ servicos: servs, descricao: desc, regiao, ambiente, complexidade, comodoId: comodoId || null, obraId: (obraAtual() || {}).id || null });
  if (comodoId) {
    const o = obraAtual(); const c = o && o.comodos.find(x => x.id === comodoId);
    if (c) {
      const servsComodo = pedidoDeServicosComodo(c.servicos);
      pedido = montarPedidoProfissionais({ servicos: [...new Set([...(pedido.servicos || []), ...servsComodo])], descricao: [desc, c.nome, (c.servicos || []).map(x => SERVNOME[x]).join(", ")].filter(Boolean).join(" - "), regiao, ambiente: ambiente || nomeTipo(c), complexidade, comodoId: c.id, obraId: o.id });
    }
  }
  return pedido;
}

function executarBuscaProfissionais(){
  if (typeof montarPedidoProfissionais !== "function") return;
  const pedido = coletarPedidoDaBusca();
  if (!(pedido.servicos || []).length && !pedido.descricao) { toast("Informe serviços ou descreva o que deseja fazer."); return; }
  const rec = recomendarProfissionais(pedido);
  proUI.pedido = pedido; proUI.rec = rec;
  renderRecoGroups($("#pro-reco-resultado"), rec, pedido);
}

function proCardRede(p){
  const habs = (p.habilidades || []).slice(0, 5);
  return '<div class="pro"><div class="row" style="gap:10px;flex-wrap:nowrap"><span class="av">' + esc((p.nome || "?").trim()[0] || "?").toUpperCase() + '</span><div style="min-width:0"><p style="font-weight:700">' + esc(p.nome || "") + (p.exemplo ? ' <span class="badge b-neu">Exemplo</span>' : "") + '</p><p class="muted small">' + esc(espNome(p.especialidade)) + (p.regiao ? " · " + esc(p.regiao) : "") + '</p></div></div>' +
    (habs.length ? '<div class="tag-row">' + habs.map(h => '<span class="tag">' + esc(h) + '</span>').join("") + '</div>' : "") +
    (p.experienciaAnos != null ? '<p class="small muted">' + esc(String(p.experienciaAnos)) + ' ano(s) de experiência informada</p>' : "") +
    (p.disponibilidade ? '<p class="small muted">Disponibilidade: ' + esc(p.disponibilidade) + '</p>' : "") +
    (p.fazReformasCompletas === true ? '<p class="small muted">Informa realizar reformas completas</p>' : p.fazReformasCompletas === false ? '<p class="small muted">Informa realizar serviços específicos</p>' : "") +
    '<p class="tel">' + esc(p.tel || "") + '</p>' +
    (p.obs ? '<p class="muted small">' + esc(p.obs) + '</p>' : "") +
    '<div class="row" style="gap:8px">' + (p.exemplo ? '<span class="muted small">Contato fictício para demonstração.</span>' : '<a class="btn btn-primary" style="min-height:40px;padding:0 14px" href="' + waLink(p.tel, "Olá! Vi seu contato na Obrinha e gostaria de um orçamento.") + '" target="_blank" rel="noopener">WhatsApp</a><button class="btn btn-sec" style="min-height:40px;padding:0 14px" type="button" data-copiar="' + esc(p.tel || "") + '">Copiar telefone</button>') + '</div></div>';
}

function renderProsLista(){
  const f = $("#pf-filtro") ? $("#pf-filtro").value : "";
  const lista = (mem.pros || []).filter(p => {
    if (!f) return true;
    const req = (typeof CATALOGO_SERVICO_REQUISITOS !== "undefined" ? CATALOGO_SERVICO_REQUISITOS : {})[f];
    if (!req) return true;
    if (req.especialidades && req.especialidades.includes(p.especialidade)) return true;
    const habs = (p.habilidades || []).map(h => normalizarTexto(h));
    return (req.habilidades || []).some(h => habs.some(ph => ph.includes(normalizarTexto(h)) || normalizarTexto(h).includes(ph)));
  });
  const cont = $("#pro-lista"); if (!cont) return;
  cont.innerHTML = lista.length ? lista.map(p => proCardRede(p)).join("") : '<div class="empty" style="grid-column:1/-1"><svg width="90" height="90" aria-hidden="true"><use href="#dico"/></svg><p class="muted">Nenhum profissional ' + (f ? "compatível com este filtro" : "cadastrado") + ' ainda. Use o formulário ao lado.</p></div>';
  cont.querySelectorAll(".pro").forEach((el, i) => {
    const pro = lista[i]; if (!pro) return;
    el.insertAdjacentHTML("beforeend", '<button class="btn-ghost" type="button" style="align-self:flex-start">Excluir</button>');
    el.lastElementChild.onclick = () => confirmar('Excluir ' + esc(pro.nome) + '?', 'O profissional sai da lista e deixa de aparecer nas sugestões.', 'Excluir', () => { mem.pros = (mem.pros || []).filter(x => x.id !== pro.id); save(); renderProsLista(); toast("Profissional excluído."); });
  });
}

function renderPros(){
  _bindProUI();
  preencherBuscaProfissionais();
  renderProsLista();
  if (atual && atual.pedidoContext && typeof recomendarProfissionais === "function") {
    const ctx = atual.pedidoContext;
    const sel = $("#pb-servicos"); if (sel && ctx.servicos) { [...sel.options].forEach(o => o.selected = ctx.servicos.includes(o.value)); }
    if ($("#pb-desc")) $("#pb-desc").value = ctx.descricao || "";
    if ($("#pb-ambiente") && ctx.ambiente) $("#pb-ambiente").value = ctx.ambiente;
    if ($("#pb-regiao") && ctx.regiao) $("#pb-regiao").value = ctx.regiao;
    if ($("#pb-comodo") && ctx.comodoId) $("#pb-comodo").value = ctx.comodoId;
    const rec = recomendarProfissionais(ctx); proUI.pedido = ctx; proUI.rec = rec; renderRecoGroups($("#pro-reco-resultado"), rec, ctx);
    atual.pedidoContext = null;
  } else if (proUI.rec && proUI.pedido) {
    renderRecoGroups($("#pro-reco-resultado"), proUI.rec, proUI.pedido);
  } else {
    const vazio = $("#pro-reco-vazio"); if (vazio) { vazio.hidden = false; vazio.innerHTML = "Preencha a busca acima ou use um cômodo da obra para ver recomendações."; }
    const res = $("#pro-reco-resultado"); if (res) { res.hidden = true; res.innerHTML = ""; }
    const pn = $("#pro-reco-por-necessidade"); if (pn) { pn.hidden = true; pn.innerHTML = ""; }
  }
  montarInfos();
}

document.addEventListener("change", e => { if (e.target && e.target.id === "p-especialidade") atualizarHabilidadesForm(); if (e.target && e.target.id === "pf-filtro") renderProsLista(); });
document.addEventListener("click", e => {
  const t = e.target;
  const tg = t.closest && t.closest("[data-toggle]"); if (tg) { const el = document.getElementById(tg.dataset.toggle); if (el) { el.hidden = !el.hidden; tg.textContent = el.hidden ? "Ver perfil completo" : "Ocultar perfil"; } }
  const copy = t.closest && t.closest("[data-copiar]"); if (copy) { copiarTexto(copy.dataset.copiar, "Telefone copiado."); }
  const copyTxt = t.closest && t.closest("[data-copiar-texto]"); if (copyTxt) { copiarTexto(copyTxt.dataset.copiarTexto, copyTxt.dataset.copyLabel || "Copiado."); }
});

function proFormOnSubmit(){
  const nome = ($("#p-nome") || {}).value ? $("#p-nome").value.trim() : "";
  const tel = ($("#p-tel") || {}).value ? $("#p-tel").value.trim() : "";
  const d = telDig(tel);
  const especialidade = ($("#p-especialidade") || {}).value || "";
  const habilidades = [...document.querySelectorAll("input[name=p-hab]:checked")].map(i => i.value);
  const regiao = ($("#p-regiao") || {}).value ? $("#p-regiao").value.trim() : "";
  const raio = ($("#p-raio") || {}).value ? $("#p-raio").value.trim() : "";
  const expRaw = ($("#p-exp") || {}).value != null ? $("#p-exp").value : "";
  const exp = expRaw === "" ? null : Number(expRaw);
  const disp = ($("#p-disp") || {}).value ? $("#p-disp").value.trim() : "";
  const desc = ($("#p-desc") || {}).value ? $("#p-desc").value.trim() : "";
  const projetos = ($("#p-projetos") || {}).value ? $("#p-projetos").value.trim() : "";
  const portfolio = ($("#p-portfolio") || {}).value ? $("#p-portfolio").value.trim() : "";
  const obs = ($("#p-obs") || {}).value ? $("#p-obs").value.trim() : "";
  const refRadio = document.querySelector("input[name=p-reforma]:checked");
  const faz = refRadio ? (refRadio.value === "completa" ? true : refRadio.value === "especificos" ? false : null) : null;
  const erro = (m, el) => { if ($("#e-pro")) $("#e-pro").textContent = m; if (el) { el.setAttribute("aria-invalid", "true"); el.focus(); } };
  ["#p-nome","#p-tel","#p-especialidade","#p-exp"].forEach(x => { const el = $(x); if (el) el.removeAttribute("aria-invalid"); });
  if (!nome) return erro("Digite o nome do profissional.", $("#p-nome"));
  if (d.length < 10 || d.length > 11) return erro("Digite o telefone com DDD, por exemplo (11) 98765-4321.", $("#p-tel"));
  if ((mem.pros || []).some(p => telDig(p.tel) === d)) return erro("Este telefone já está cadastrado.", $("#p-tel"));
  if (!especialidade) return erro("Selecione a especialidade principal.", $("#p-especialidade"));
  if (!habilidades.length) return erro("Selecione pelo menos uma habilidade específica.");
  if (exp != null && (!isFinite(exp) || exp < 0 || exp > 60)) return erro("Informe anos de experiência entre 0 e 60.", $("#p-exp"));

  const legacy = new Set();
  if (especialidade === "pintor") { legacy.add("paredes"); if (habilidades.some(h => /massa/i.test(h))) legacy.add("massa"); }
  if (especialidade === "pedreiro" || especialidade === "azulejista" || especialidade === "instalador_pisos") {
    if (habilidades.some(h => /piso|porcelanato/i.test(h))) legacy.add("piso");
    if (habilidades.some(h => /revest|azulejo/i.test(h))) legacy.add("revest");
    if (habilidades.some(h => /rodap/i.test(h))) legacy.add("rodape");
  }
  if (especialidade === "eletricista") legacy.add("eletrica");
  if (especialidade === "encanador") legacy.add("hidraulica");
  if (especialidade === "manutencao_geral") legacy.add("reparos");
  if (especialidade === "gesseiro" || especialidade === "instalador_drywall") legacy.add("reparos");

  const pro = {
    id: uid("pro"), nome, tel, regiao, raioAtendimento: raio, especialidade, habilidades, experienciaAnos: exp,
    descricaoTrabalhos: desc, tiposProjetos: projetos, disponibilidade: disp, portfolio, fazReformasCompletas: faz,
    obs, servicos: [...legacy], criadoEm: new Date().toISOString(), atualizadoEm: new Date().toISOString()
  };
  mem.pros = Array.isArray(mem.pros) ? mem.pros : [];
  mem.pros.unshift(pro);
  save();
  if ($("#f-pro")) $("#f-pro").reset();
  atualizarHabilidadesForm();
  if ($("#e-pro")) $("#e-pro").textContent = "";
  renderProsLista();
  toast("Profissional cadastrado.");
}

function _bindProUI(){
  const b = $("#pb-buscar"); if (b && !b.dataset.ready) { b.dataset.ready = "1"; b.onclick = executarBuscaProfissionais; }
  const l = $("#pb-limpar"); if (l && !l.dataset.ready) { l.dataset.ready = "1"; l.onclick = () => { ["#pb-desc","#pb-regiao"].forEach(id => { const el = $(id); if (el) el.value = ""; }); ["#pb-ambiente","#pb-complexidade","#pb-comodo"].forEach(id => { const el = $(id); if (el) el.value = ""; }); const sel = $("#pb-servicos"); if (sel) [...sel.options].forEach(o => o.selected = false); proUI = { pedido: null, rec: null }; renderPros(); }; }
  const conv = $("#btn-conversar-projeto"); if (conv && !conv.dataset.ready) { conv.dataset.ready = "1"; conv.onclick = () => { iniciarAssistente({ descricao: $("#pb-desc") ? $("#pb-desc").value : "", ambiente: $("#pb-ambiente") ? $("#pb-ambiente").value : "", regiao: $("#pb-regiao") ? $("#pb-regiao").value : "" }); }; }
  const sols = $("#btn-ver-solicitacoes"); if (sols && !sols.dataset.ready) { sols.dataset.ready = "1"; sols.onclick = renderSolicitacoesSalvas; }
  const fp = $("#f-pro"); if (fp && !fp.dataset.bound) {
    fp.dataset.bound = "1";
    fp.querySelectorAll("[data-submit]").forEach(btn => btn.addEventListener("click", proFormOnSubmit));
    fp.addEventListener("keydown", e => { if (e.key === "Enter" && e.target.tagName === "INPUT" && e.target.type !== "checkbox" && e.target.type !== "radio") { e.preventDefault(); proFormOnSubmit(); } });
    fp.addEventListener("submit", e => e.preventDefault());
  }
}

const btnProC1 = $("#btn-pro-c1");
if (btnProC1) btnProC1.onclick = () => {
  const servs = [...document.querySelectorAll("input[name=serv]:checked")].map(i => i.value);
  const pedido = typeof montarPedidoProfissionais === "function"
    ? montarPedidoProfissionais({ servicos: pedidoDeServicosComodo(servs), descricao: servs.map(x => SERVNOME[x]).join(", "), regiao: "", ambiente: (atual.rascunho && nomeTipo(atual.rascunho)) || "" })
    : { servicos: servs, descricao: "" };
  const rec = typeof recomendarProfissionais === "function" ? recomendarProfissionais(pedido) : { resultados: [] };
  atual.pedidoContext = pedido;
  if (!rec.resultados.length) {
    dialogo('<h2>Recomendações para sua obra</h2><div class="warn-box">Não encontramos profissionais compatíveis no cadastro para os serviços selecionados. Você pode cadastrar profissionais ou usar "Pensando em algo mais?" para organizar sua solicitação.</div><div class="row" style="justify-content:flex-end"><button class="btn btn-sec" type="button" id="dlg-cancel">Fechar</button><button class="btn btn-primary" type="button" id="dlg-ok">Abrir profissionais</button></div>');
  } else {
    dialogo('<h2>Recomendações para sua obra</h2><p class="muted small">Sugestões calculadas com base no cadastro (0 a 100). Confirme qualificações e disponibilidade.</p><div class="stack" style="gap:10px;max-height:55vh;overflow:auto">' + renderRecoCardsCompactos(rec.resultados.slice(0, 5), pedido) + '</div><div class="row" style="justify-content:flex-end"><button class="btn btn-sec" type="button" id="dlg-cancel">Fechar</button><button class="btn btn-primary" type="button" id="dlg-ok">Ver página completa</button></div>');
  }
  $("#dlg-cancel").onclick = () => $("#dlg").close();
  $("#dlg-ok").onclick = () => { $("#dlg").close(); go("profissionais"); };
};

/* ================= CONCLUIR CÔMODO ================= */
function concluir(c) {
    dialogo(`<h2>Concluir ${esc(c.nome)}</h2><p class="muted">Sobrou material?</p>
 <div class="opts" style="grid-template-columns:1fr 1fr"><label class="opt-card"><input type="radio" name="sobra" value="nao" checked><span class="face"><span class="ck"></span><span class="t">Não sobrou</span></span></label><label class="opt-card"><input type="radio" name="sobra" value="sim"><span class="face"><span class="ck"></span><span class="t">Sobrou um pouco</span></span></label></div>
 <div class="field" id="sobra-wrap" hidden><label class="lbl" for="sobra-txt">O que sobrou?</label><input id="sobra-txt" placeholder="Ex.: meio galão de tinta"></div>
 <div class="row" style="justify-content:flex-end"><button class="btn btn-sec" type="button" id="dlg-cancel">Cancelar</button><button class="btn btn-primary" type="button" id="dlg-ok">Concluir</button></div>`);
    document.querySelectorAll("input[name=sobra]").forEach(r => r.onchange =() => $("#sobra-wrap").hidden = document.querySelector("input[name=sobra]:checked").value !== "sim");
    $("#dlg-ok").onclick =() => {
        const s = document.querySelector("input[name=sobra]:checked").value === "sim";
        c.concluido = true;
        c.sobra = s ?($("#sobra-txt").value.trim() || "sim"): null;
        save();
        dialogo(`<svg width="130" height="130" style="align-self:center" aria-hidden="true"><use href="#dico"/></svg><h2 style="text-align:center">${s?`${esc(c.nome)} pronto!`:`${esc(c.nome)} pronto e sem sobra de material!`}</h2>
  <p class="muted" style="text-align:center">${s?"Guarde a sobra bem fechada para retoques. Anote o que sobrou para planejar a próxima compra.":"Você comprou na medida e evitou entulho, um passo para o ODS 12: consumo e produção responsáveis."}</p>
  <div class="row" style="justify-content:center"><button class="btn btn-primary" type="button" id="dlg-fim">Voltar para a obra</button></div>`);
        $("#dlg-fim").onclick =() => {
            $("#dlg").close();
            go("obra")
        }
    };
    $("#dlg-cancel").onclick =() => $("#dlg").close();
}
function dialogo(h) {
    $("#dlg-body").innerHTML = h;
    const d = $("#dlg");
    if (! d.open) d.showModal()
}
function confirmar(t, txt, btn, fn) {
    dialogo(`<h2>${t}</h2><p class="muted">${txt}</p><div class="row" style="justify-content:flex-end"><button class="btn btn-sec" type="button" id="dlg-cancel">Cancelar</button><button class="btn" style="background:var(--erro);color:#fff" type="button" id="dlg-ok">${btn}</button></div>`);
    $("#dlg-cancel").onclick =() => $("#dlg").close();
    $("#dlg-ok").onclick =() => {
        $("#dlg").close();
        fn()
    }
}
/* ================= INÍCIO DO APP ================= */
load();
if (!Array.isArray(mem.solicitacoes)) mem.solicitacoes = [];
if (!mem.inicializado) {
    const ex = {
        id: "obra-exemplo", nome: "Exemplo · Reforma da Carla", orcamento: 5000, uf: "SP", compras:  [ {
            item: "Mão de obra do pintor", loja: "", valor: 1800, data: new Date().toISOString().slice(0, 10), cat: "mao"
        }],
        comodos:  [ {
            id: "comodo-exemplo", tipo: "quarto", nome: "Quarto do Theo", servicos:  ["paredes", "piso", "rodape"], medidas:  {
                l: 3, c: 4, a: 2.7, portas: 1, janelas: 1, ap: 1.68, aj: 1.2
            },
            detalhes:  {
                demaos: 2, acab: "Fosco", cor: false, nova: false, massaDem: 2, peca: "600x600", m2: 2.5, assent: "reto", junta: 2, rAlt: 0, barra: 2.4
            },
            escolhas: {},
            salvo: true
        }]
    };
    calcular(ex.comodos[0]);
    mem.obras.push(ex);
    mem.inicializado = true;
    save();
}
if (!mem.pros) {
    mem.pros = [
      { id:"pro-ex1", nome:"Marcos Pinturas", tel:"(11) 90000-0001", especialidade:"pintor", habilidades:["Pintura interna","Aplicação de massa corrida","Preparação de paredes","Pintura de tetos"], experienciaAnos:8, descricaoTrabalhos:"Pintura residencial e preparação de superfícies (exemplo).", tiposProjetos:"Quartos, salas e áreas internas", disponibilidade:"Seg a Sáb", regiao:"Zona Leste, São Paulo", obs:"Atende aos sábados (exemplo)", fazReformasCompletas:false, servicos:["paredes","massa"], exemplo:true, criadoEm:new Date().toISOString(), atualizadoEm:new Date().toISOString() },
      { id:"pro-ex2", nome:"Ana Revestimentos", tel:"(11) 90000-0002", especialidade:"azulejista", habilidades:["Assentamento de porcelanato","Assentamento de azulejos","Revestimento de áreas molhadas","Rejuntamento","Nivelamento de superfícies"], experienciaAnos:6, descricaoTrabalhos:"Instalação de pisos e revestimentos (exemplo).", tiposProjetos:"Banheiros, cozinhas e pisos internos", disponibilidade:"Seg a Sex", regiao:"Centro, São Paulo", obs:"(exemplo)", fazReformasCompletas:false, servicos:["piso","revest","rodape"], exemplo:true, criadoEm:new Date().toISOString(), atualizadoEm:new Date().toISOString() },
      { id:"pro-ex3", nome:"Carlos Hidráulica", tel:"(11) 90000-0003", especialidade:"encanador", habilidades:["Instalação hidráulica","Manutenção de tubulações","Instalação de torneiras","Instalação de vasos sanitários","Identificação de vazamentos"], experienciaAnos:10, descricaoTrabalhos:"Serviços hidráulicos residenciais (exemplo).", tiposProjetos:"Banheiros e cozinhas", disponibilidade:"Comercial", regiao:"Zona Leste, São Paulo", obs:"(exemplo)", fazReformasCompletas:false, servicos:["hidraulica"], exemplo:true, criadoEm:new Date().toISOString(), atualizadoEm:new Date().toISOString() }
    ];
    save();
}
if (typeof migrarDadosProfissionais === "function") { migrarDadosProfissionais(); save(); }
go("inicio");
