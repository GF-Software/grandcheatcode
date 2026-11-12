// Captura do contato antes do Stripe (fluxo F1 do estudo de recuperação de vendas, 12/11).
// Por quê: o Stripe no Brasil não entrega o contato de quem abandona o checkout. Sem isso, ninguém pode ser recuperado.
// Regra de ouro: a captura nunca segura a venda. Endpoint vazio, fora do ar ou lento (2 s) = a pessoa segue para o Stripe.
// Endpoint vazio = passo desligado; o botão vai direto ao Stripe, como antes.
// TEXTOS: rascunho funcional (rótulos e aceite). O Vaz reescreve; o fato do aceite (o que a pessoa autoriza) não muda.
const CAPTURA = {
  endpoint: "https://dprlznmzlbpsgiapydzz.supabase.co/functions/v1/lead", // função "lead" da gcc-entrega (12/11). Sem apikey: só content-type. Contrato: POST {produto, id, nome, whatsapp, email, aceite, aceite_texto, origem, pagina, utm}
  aceite: "Aceito receber mensagens da GFV no WhatsApp e no e-mail sobre esta compra. Posso sair quando quiser.",
};

(() => {
  if (!/^https:\/\/|^http:\/\/localhost/.test(CAPTURA.endpoint)) return;
  const CHAVE = "gcc-lead"; // guarda id, nome, WhatsApp e e-mail só neste navegador, para não pedir de novo e para reenviar o lead
  const ler = () => { try { return JSON.parse(localStorage.getItem(CHAVE) || "null"); } catch (e) { return null; } };
  const gravar = v => { try { localStorage.setItem(CHAVE, JSON.stringify(v)); } catch (e) {} };
  const novoId = () => "l_" + Array.from(crypto.getRandomValues(new Uint8Array(20)), b => "abcdefghijklmnopqrstuvwxyz0123456789"[b % 36]).join("");
  const origem = new URLSearchParams(location.search).get("origem") === "manychat" ? "manychat" : "landing";
  const noApp = /Instagram|FBAN|FBAV|FB_IAB/.test(navigator.userAgent);

  // Link do Stripe com o id do lead (casa o pagamento com o lead no webhook) e o e-mail preenchido.
  function destino(href, lead) {
    const u = new URL(href);
    if (lead) {
      u.searchParams.set("client_reference_id", lead.id);
      if (lead.email) u.searchParams.set("prefilled_email", lead.email);
    }
    ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"].forEach(k => {
      const v = new URLSearchParams(location.search).get(k);
      if (v && /^[\w-]{1,150}$/.test(v)) u.searchParams.set(k, v);
    });
    return u.toString();
  }

  // As UTMs da URL como objeto (o endpoint aceita até 10 chaves).
  const utms = () => { const o = {}; new URLSearchParams(location.search).forEach((v, k) => { if (/^utm_/.test(k) && Object.keys(o).length < 10) o[k] = v.slice(0, 150); }); return o; };

  // Todo caminho para o Stripe passa por aqui: o POST põe o lead de volta em "checkout aberto" e reinicia os 30 min.
  const produtoDe = href => /14A7sN1AT9WU7IG3320Fi06/.test(href) ? "heist" : "fundador"; // link do GCC Heist avulso
  const reenvia = (lead, href) => envia({ produto: produtoDe(href), id: lead.id, nome: lead.nome, whatsapp: lead.whatsapp, email: lead.email, aceite: true, aceite_texto: CAPTURA.aceite, origem, pagina: location.pathname, utm: utms() });
  const completo = lead => !!(lead && lead.id && lead.nome && lead.whatsapp);

  async function envia(dados) {
    const c = new AbortController(); const t = setTimeout(() => c.abort(), 2000);
    try {
      await fetch(CAPTURA.endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(dados), keepalive: true, signal: c.signal });
    } catch (e) {} finally { clearTimeout(t); }
  }

  function caixa(href) {
    if (document.getElementById("captura")) return;
    const css = document.createElement("style");
    css.textContent = "#captura{position:fixed;inset:0;z-index:70;display:grid;place-items:center;padding:16px;background:rgba(5,6,14,.72)}" +
      "#captura form{width:100%;max-width:420px;padding:22px;border-radius:20px;background:#0c0d1b;border:1px solid rgba(204,194,245,.28);box-shadow:0 20px 60px rgba(0,0,0,.5);color:#e5ddff;font:500 15px/1.45 Jost,Helvetica,Arial,sans-serif}" +
      "#captura b{display:block;color:#fff0c9;font-size:18px;margin-bottom:12px}#captura label{display:block;margin:10px 0 4px;font-size:14px}" +
      "#captura input[type=text],#captura input[type=email],#captura input[type=tel]{width:100%;box-sizing:border-box;padding:11px 13px;border-radius:12px;border:1px solid rgba(204,194,245,.35);background:#15172b;color:#fff;font:inherit}" +
      "#captura .ok{display:flex;gap:10px;align-items:flex-start;margin-top:14px;font-size:13.5px}#captura .ok input{margin-top:3px;width:18px;height:18px;flex:none}" +
      "#captura .app{margin-top:12px;padding:10px 12px;border-radius:12px;background:rgba(255,178,198,.1);font-size:13.5px}" +
      "#captura button{width:100%;margin-top:16px;cursor:pointer;font:600 15.5px Jost,Helvetica,Arial,sans-serif;padding:13px;border-radius:999px;border:0;background:#ffb2c6;color:#663b56}" +
      "#captura .pula{display:block;margin-top:12px;text-align:center;color:#ccc2f5;font-size:13.5px}#captura .erro{color:#ffb2c6;font-size:13.5px;min-height:1em;margin-top:8px}" +
      "#captura :focus-visible{outline:2px solid #fff;outline-offset:2px}";
    document.head.appendChild(css);
    const el = document.createElement("div");
    el.id = "captura"; el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true"); el.setAttribute("aria-labelledby", "captura-t");
    el.innerHTML = '<form novalidate><b id="captura-t">Antes de pagar</b>' +
      '<label for="cap-nome">Nome</label><input id="cap-nome" type="text" autocomplete="given-name" required>' +
      '<label for="cap-zap">WhatsApp com DDD</label><input id="cap-zap" type="tel" inputmode="tel" autocomplete="tel" placeholder="11 91234-5678" required>' +
      '<label for="cap-mail">E-mail</label><input id="cap-mail" type="email" autocomplete="email" required>' +
      '<label class="ok"><input id="cap-ok" type="checkbox" required><span></span></label>' +
      (noApp ? '<div class="app">Se o pagamento travar aqui dentro do Instagram, toque nos três pontinhos e escolha "Abrir no navegador".</div>' : "") +
      '<div class="erro" aria-live="polite"></div><button type="submit">Ir para o pagamento</button>' +
      '<a class="pula" href="#">Pular e ir direto ao pagamento</a></form>';
    el.querySelector(".ok span").textContent = CAPTURA.aceite;
    document.body.appendChild(el);
    const f = el.querySelector("form"), erro = el.querySelector(".erro");
    const fecha = () => { el.remove(); document.removeEventListener("keydown", esc); };
    const esc = e => { if (e.key === "Escape") fecha(); };
    document.addEventListener("keydown", esc);
    el.addEventListener("click", e => { if (e.target === el) fecha(); });
    el.querySelector(".pula").onclick = e => { e.preventDefault(); if (window.gccMarca) gccMarca("captura_pulou"); location.href = destino(href, null); };
    f.onsubmit = async e => {
      e.preventDefault();
      const nome = f["cap-nome"].value.trim(), email = f["cap-mail"].value.trim();
      let zap = f["cap-zap"].value.replace(/\D/g, "");
      if (zap.length === 10 || zap.length === 11) zap = "55" + zap; // número brasileiro sem DDI
      if (!nome) return (erro.textContent = "Falta o nome.");
      if (zap.length < 12 || zap.length > 15) return (erro.textContent = "Confira o WhatsApp com DDD.");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return (erro.textContent = "Confira o e-mail.");
      if (!f["cap-ok"].checked) return (erro.textContent = "Marque o aceite para seguir, ou use \"Pular\".");
      f.querySelector("button").disabled = true; f.querySelector("button").textContent = "Abrindo o pagamento…";
      const lead = { id: (ler() || {}).id || novoId(), nome, whatsapp: zap, email };
      gravar(lead);
      await reenvia(lead, href);
      if (window.gccMarca) gccMarca("lead_captado");
      location.href = destino(href, lead);
    };
    f["cap-nome"].focus();
  }

  // Intercepta só os cliques que vão para o Stripe. Quem já deixou contato neste navegador segue direto, com o id.
  document.addEventListener("click", async e => {
    const a = e.target.closest && e.target.closest('a[href*="buy.stripe.com"]');
    if (!a || e.ctrlKey || e.metaKey || e.shiftKey) return;
    e.preventDefault();
    const lead = ler();
    if (completo(lead)) { await reenvia(lead, a.href); location.href = destino(a.href, lead); return; }
    caixa(a.href);
  });

  // Link da DM do ManyChat: ?origem=manychat&comprar=1 abre a caixa assim que a página carrega (só com a venda aberta
  // e se a pessoa ainda não deixou contato neste navegador). O plano grátis do ManyChat não grava no endpoint; a landing grava por ele.
  const q = new URLSearchParams(location.search);
  if (q.get("comprar") === "1" && !completo(ler())) {
    const a = document.querySelector('a.compra[href*="buy.stripe.com"]');
    if (a) caixa(a.href);
  }
})();
