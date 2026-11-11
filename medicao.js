// Medição do Grand Cheat Code: Microsoft Clarity (mapa de calor e gravação) e Google Analytics 4.
// Regra LGPD: nada carrega antes do "Aceitar". Recusar (ou não responder) = nenhum script de terceiro, nenhum cookie.
// Os ids abaixo são PÚBLICOS (aparecem no código de qualquer site que usa a ferramenta). Nunca coloque chave privada aqui.
// Vazio = medição desligada e o aviso de cookies nem aparece.
const MEDICAO = {
  ga4: "G-DT07FW3PN8", // propriedade "Grand Cheat Code", fluxo "Landing", criados em 11/11 (GA4 › Administrador › Fluxos de dados › ID da métrica)
  clarity: "zc5bh56nrd", // projeto "Grand Cheat Code" criado em 11/11    (Clarity › Settings › Overview › Project ID)
};

(() => {
  const CHAVE = "gcc-cookies"; // "sim" | "nao", guardado só no navegador da pessoa (essencial: lembrar a escolha)
  const idGa4 = /^G-[A-Z0-9]{4,15}$/.test(MEDICAO.ga4) ? MEDICAO.ga4 : "";
  const idClarity = /^[a-z0-9]{6,14}$/.test(MEDICAO.clarity) ? MEDICAO.clarity : "";
  const ler = () => { try { return localStorage.getItem(CHAVE); } catch (e) { return null; } };
  const gravar = v => { try { localStorage.setItem(CHAVE, v); } catch (e) {} };
  let ligado = false;

  // Evento para as duas ferramentas. Sem consentimento, não faz nada.
  window.gccMarca = (nome, dados = {}) => {
    if (!ligado) return;
    if (window.gtag) window.gtag("event", nome, dados);
    if (window.clarity) window.clarity("event", nome);
  };

  function liga() {
    if (ligado) return;
    ligado = true;
    if (idGa4) {
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { dataLayer.push(arguments); };
      window.gtag("consent", "default", { analytics_storage: "granted", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" });
      window.gtag("js", new Date());
      window.gtag("config", idGa4);
      const s = document.createElement("script"); s.async = true; s.src = "https://www.googletagmanager.com/gtag/js?id=" + idGa4;
      document.head.appendChild(s);
    }
    if (idClarity) {
      (function (c, l, a, r, i, t, y) { c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); }; t = l.createElement(r); t.async = 1; t.src = "https://www.clarity.ms/tag/" + i; y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y); })(window, document, "clarity", "script", idClarity);
      window.clarity("consentv2", { ad_Storage: "denied", analytics_Storage: "granted" });
    }
    eventos();
  }

  // Recusar depois de ter aceitado: apaga os cookies das duas ferramentas e recarrega sem elas.
  function desliga() {
    document.cookie.split(";").map(c => c.split("=")[0].trim()).filter(n => /^(_ga|_gid|_gat|_clck|_clsk|CLID|MUID)/.test(n)).forEach(n => {
      [location.hostname, "." + location.hostname, "." + location.hostname.split(".").slice(-2).join(".")].forEach(d => {
        document.cookie = n + "=; Max-Age=0; path=/; domain=" + d;
      });
      document.cookie = n + "=; Max-Age=0; path=/";
    });
  }

  // Aviso de cookies: aparece só se houver ferramenta configurada e a pessoa ainda não escolheu.
  function aviso() {
    if (document.getElementById("cookies")) return;
    const raiz = document.documentElement.dataset.raiz || "/";
    const css = document.createElement("style");
    css.textContent = "#cookies{position:fixed;left:16px;right:16px;bottom:16px;z-index:60;max-width:440px;padding:18px 20px;border-radius:18px;background:rgba(12,13,27,.97);border:1px solid rgba(204,194,245,.28);box-shadow:0 20px 60px rgba(0,0,0,.5);color:#e5ddff;font:500 14.5px/1.45 Jost,Helvetica,Arial,sans-serif}" +
      "#cookies b{display:block;color:#fff0c9;font-size:15.5px;margin-bottom:4px}#cookies a{color:#ffb2c6}" +
      "#cookies .bts{display:flex;gap:10px;margin-top:14px}#cookies button{flex:1;cursor:pointer;font:600 14.5px Jost,Helvetica,Arial,sans-serif;padding:11px 14px;border-radius:999px;border:1px solid rgba(255,178,198,.5);background:transparent;color:#ffb2c6}" +
      "#cookies button.sim{background:#ffb2c6;color:#663b56;border-color:#ffb2c6}#cookies button:focus-visible{outline:2px solid #fff;outline-offset:2px}";
    document.head.appendChild(css);
    const el = document.createElement("div");
    el.id = "cookies"; el.setAttribute("role", "dialog"); el.setAttribute("aria-label", "Cookies");
    el.innerHTML = '<b>Cookies de medição</b>Usamos Microsoft Clarity e Google Analytics para ver como a página é usada (cliques, rolagem, gravação anônima da visita). Só ligam se você aceitar. <a href="' + raiz + 'privacidade/">Privacidade</a>' +
      '<div class="bts"><button type="button" class="nao">Recusar</button><button type="button" class="sim">Aceitar</button></div>';
    document.body.appendChild(el);
    el.querySelector(".nao").onclick = () => { const antes = ler(); gravar("nao"); el.remove(); if (antes === "sim") { desliga(); location.reload(); } };
    el.querySelector(".sim").onclick = () => { gravar("sim"); el.remove(); liga(); };
  }
  window.gccCookies = aviso; // o link "Cookies" do rodapé reabre o aviso

  // Eventos: compra (Fundador e Heist), dobras vistas, mapa da cidade, perguntas abertas.
  function eventos() {
    const pagina = location.pathname;
    document.addEventListener("click", e => {
      const a = e.target.closest && e.target.closest("a[href]");
      if (!a) return;
      const href = a.getAttribute("href") || "";
      const onde = (a.closest("[id]") || {}).id || "pagina";
      if (href.includes("buy.stripe.com/14A7sN1AT9WU7IG3320Fi06") || a.dataset.produto === "heist") {
        gccMarca("clique_heist", { onde, value: 111.11, currency: "BRL" });
        gccMarca("begin_checkout", { value: 111.11, currency: "BRL", items: [{ item_id: "gcc-heist", item_name: "GCC Heist", price: 111.11 }] });
      } else if (href.includes("buy.stripe.com") || (a.classList.contains("compra") && document.documentElement.dataset.fase === "aberto")) {
        gccMarca("clique_fundador", { onde, value: 1111, currency: "BRL" });
        gccMarca("begin_checkout", { value: 1111, currency: "BRL", items: [{ item_id: "gcc-fundador", item_name: "Grand Cheat Code Fundador", price: 1111 }] });
      } else if (/(^|\/)cidade\/?$/.test(href)) {
        gccMarca("abre_cidade", { onde });
      } else if (href.includes("chat.whatsapp.com") || href.includes("wa.me/")) {
        gccMarca("clique_whatsapp", { onde });
      }
    }, true);
    // Uma vez por visita, cada dobra (seção com id) que aparece na tela.
    const vistas = new Set();
    const olho = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting || vistas.has(e.target.id)) return;
      vistas.add(e.target.id); olho.unobserve(e.target);
      gccMarca("dobra_vista", { dobra: e.target.id, ordem: vistas.size });
    }), { rootMargin: "0px 0px -50% 0px" }); // conta quando a seção chega à metade de cima da tela (vale para seção mais alta que a tela)
    document.querySelectorAll("section[id], [data-dobra]").forEach(s => olho.observe(s));
    document.querySelectorAll("details").forEach(d => d.addEventListener("toggle", () => {
      if (d.open) gccMarca("abre_pergunta", { pergunta: d.querySelector("summary").textContent.trim().slice(0, 90) });
    }));
    // Obrigado: o Stripe só manda para cá quem pagou. Conta uma vez por navegador.
    const compra = pagina.includes("/obrigado/heist") ? ["gcc-heist", "GCC Heist", 111.11] : pagina.includes("/obrigado") ? ["gcc-fundador", "Grand Cheat Code Fundador", 1111] : null;
    if (compra) {
      const marca = "gcc-comprou-" + compra[0];
      let ja = false; try { ja = !!localStorage.getItem(marca); localStorage.setItem(marca, "1"); } catch (e) {}
      if (!ja) gccMarca("purchase", { transaction_id: compra[0] + "-" + Date.now(), value: compra[2], currency: "BRL", items: [{ item_id: compra[0], item_name: compra[1], price: compra[2] }] });
    }
  }

  if (!idGa4 && !idClarity) return;
  const escolha = ler();
  if (escolha === "sim") liga();
  else if (escolha !== "nao") (document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", aviso) : aviso());
})();
