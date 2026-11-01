"""Gera src/app/tema.css a partir das paletas do design system ARQFLOW.
Rode com: python3 scripts/gerar-tema.py
"""
import os

P = {
 "basalto": {
  "claro": dict(bg="#e7e3dc", plate="#efece6", ink="#1f1c19", sec="#57514a", tert="#6b645c", accent="#73583a", onaccent="#efece6", line="rgba(31,28,25,0.12)", tint="rgba(115,88,58,0.10)", edge="rgba(31,28,25,0.08)", accentline="rgba(115,88,58,0.6)", ring="rgba(31,28,25,0.55)"),
  "escuro": dict(bg="#1c1a18", plate="#24221f", ink="#ece6dc", sec="#b3aba0", tert="#918a80", accent="#cbb8a0", onaccent="#1c1a18", line="rgba(236,230,220,0.10)", tint="rgba(203,184,160,0.12)", edge="rgba(236,230,220,0.07)", accentline="rgba(203,184,160,0.6)", ring="rgba(236,230,220,0.4)"),
 },
 "calcario": {
  "claro": dict(bg="#f2f2ef", plate="#ffffff", ink="#161917", sec="#555b57", tert="#686e6a", accent="#56624e", onaccent="#ffffff", line="rgba(22,25,23,0.10)", tint="rgba(86,98,78,0.10)", edge="rgba(22,25,23,0.06)", accentline="rgba(86,98,78,0.4)", ring="rgba(22,25,23,0.55)"),
  "escuro": dict(bg="#131a1c", plate="#1c2528", ink="#e6eae7", sec="#a9b1ad", tert="#8b9490", accent="#a6b394", onaccent="#131a1c", line="rgba(230,234,231,0.10)", tint="rgba(166,179,148,0.12)", edge="rgba(230,234,231,0.06)", accentline="rgba(166,179,148,0.4)", ring="rgba(230,234,231,0.4)"),
 },
 "concreto": {
  "claro": dict(bg="#e4e6e6", plate="#f3f4f4", ink="#121516", sec="#454c4e", tert="#5e6668", accent="#1d5363", onaccent="#f3f4f4", line="rgba(18,21,22,0.16)", tint="rgba(29,83,99,0.10)", edge="rgba(18,21,22,0.16)", accentline="rgba(29,83,99,0.35)", ring="rgba(18,21,22,0.55)"),
  "escuro": dict(bg="#151a1b", plate="#1d2324", ink="#e3e7e7", sec="#a7afb1", tert="#889193", accent="#7db8c6", onaccent="#151a1b", line="rgba(227,231,231,0.14)", tint="rgba(125,184,198,0.12)", edge="rgba(227,231,231,0.14)", accentline="rgba(125,184,198,0.4)", ring="rgba(227,231,231,0.42)"),
 },
 "musgo": {
  "claro": dict(bg="#e6e9e0", plate="#f4f5ef", ink="#1c261d", sec="#485247", tert="#5d675b", accent="#4c5e43", onaccent="#f4f5ef", onhint="rgba(244,245,239,0.82)", line="rgba(28,38,29,0.10)", tint="rgba(76,94,67,0.10)", edge="rgba(28,38,29,0.06)", accentline="rgba(76,94,67,0.4)", ring="rgba(28,38,29,0.55)"),
  "escuro": dict(bg="#172019", plate="#212c23", ink="#ece8dd", sec="#b9bcae", tert="#959c8e", accent="#d8cbb0", onaccent="#172019", onhint="rgba(23,32,25,0.72)", line="rgba(236,232,221,0.09)", tint="rgba(216,203,176,0.14)", edge="rgba(236,232,221,0)", accentline="rgba(216,203,176,0.5)", ring="rgba(236,232,221,0.42)"),
 },
 "nanquim": {
  "claro": dict(bg="#ffffff", plate="#ffffff", ink="#000000", sec="#4a4a4a", tert="#6b6b6b", accent="#000000", onaccent="#ffffff", onhint="rgba(255,255,255,0.75)", line="rgba(0,0,0,0.12)", tint="rgba(0,0,0,0.06)", edge="#000000", accentline="#000000", ring="rgba(0,0,0,0.55)", invsec="#d6d6d6", invtert="#b8b8b8", invchip="rgba(255,255,255,0.5)"),
  "escuro": dict(bg="#000000", plate="#000000", ink="#ffffff", sec="#b8b8b8", tert="#949494", accent="#ffffff", onaccent="#000000", onhint="rgba(0,0,0,0.7)", line="rgba(255,255,255,0.14)", tint="rgba(255,255,255,0.10)", edge="#ffffff", accentline="#ffffff", ring="rgba(255,255,255,0.6)", invsec="#333333", invtert="#4a4a4a", invchip="rgba(0,0,0,0.5)"),
 },
}


R = {
 "basalto": dict(card="6px", control="6px", button="25px", chip="13px", check="10px"),
 "calcario": dict(card="22px", control="14px", button="14px", chip="13px", check="10px"),
 "concreto": dict(card="3px", control="2px", button="2px", chip="2px", check="2px"),
 "musgo": dict(card="28px", control="18px", button="25px", chip="13px", check="11px"),
 "nanquim": dict(card="0", control="0", button="0", chip="0", check="0"),
}

FONTES = {
 "basalto": '"Jost", system-ui, sans-serif',
 "calcario": '"Hanken Grotesk", system-ui, sans-serif',
 "concreto": '"Geist", system-ui, sans-serif',
 "musgo": '"Figtree", system-ui, sans-serif',
 "nanquim": '"Archivo", system-ui, sans-serif',
}
STROKE = {"basalto": "1.3", "calcario": "1.5", "concreto": "1.5", "musgo": "1.5", "nanquim": "1.5"}
CAP = {"basalto": "50%", "calcario": "14px", "concreto": "3px", "musgo": "50%", "nanquim": "0"}
PESO_TITULO = {"basalto": 400, "calcario": 500, "concreto": 500, "musgo": 500, "nanquim": 600}

# Tratamentos de cada estilo (seleção, botão principal, captura, etiqueta, caixa de concluir)
TRAT = {
 "basalto": dict(tile_bg="transparent", tile_fg="var(--af-tert)", tile_border="var(--af-line)",
   sel_bg="transparent", sel_fg="var(--af-ink)", sel_icon="var(--af-accent)", sel_line="var(--af-accent)", sel_hint="var(--af-tert)",
   btn_bg="transparent", btn_fg="var(--af-accent)", btn_border="var(--af-accentline)",
   cap_bg="transparent", cap_fg="var(--af-accent)", cap_border="var(--af-accent)",
   chip_bg="var(--af-tint)", chip_border="transparent", check_on="var(--af-accent)", check_mark="var(--af-on)",
   tog_bg="var(--af-tint)", tog_fg="var(--af-ink)", nav_bg="var(--af-bg)"),
 "calcario": dict(tile_bg="transparent", tile_fg="var(--af-tert)", tile_border="var(--af-line)",
   sel_bg="var(--af-plate)", sel_fg="var(--af-ink)", sel_icon="var(--af-accent)", sel_line="var(--af-ink)", sel_hint="var(--af-tert)",
   btn_bg="var(--af-ink)", btn_fg="var(--af-bg)", btn_border="var(--af-ink)",
   cap_bg="var(--af-ink)", cap_fg="var(--af-bg)", cap_border="var(--af-ink)",
   chip_bg="var(--af-tint)", chip_border="transparent", check_on="var(--af-ink)", check_mark="var(--af-bg)",
   tog_bg="var(--af-plate)", tog_fg="var(--af-ink)", nav_bg="var(--af-plate)"),
 "concreto": dict(tile_bg="transparent", tile_fg="var(--af-tert)", tile_border="var(--af-line)",
   sel_bg="var(--af-tint)", sel_fg="var(--af-ink)", sel_icon="var(--af-accent)", sel_line="var(--af-accent)", sel_hint="var(--af-tert)",
   btn_bg="var(--af-ink)", btn_fg="var(--af-bg)", btn_border="var(--af-ink)",
   cap_bg="var(--af-accent)", cap_fg="var(--af-on)", cap_border="var(--af-accent)",
   chip_bg="transparent", chip_border="var(--af-accentline)", check_on="var(--af-ink)", check_mark="var(--af-bg)",
   tog_bg="var(--af-tint)", tog_fg="var(--af-ink)", nav_bg="var(--af-plate)"),
 "musgo": dict(tile_bg="var(--af-plate)", tile_fg="var(--af-sec)", tile_border="transparent",
   sel_bg="var(--af-accent)", sel_fg="var(--af-on)", sel_icon="var(--af-on)", sel_line="transparent", sel_hint="var(--af-onhint)",
   btn_bg="var(--af-accent)", btn_fg="var(--af-on)", btn_border="var(--af-accent)",
   cap_bg="var(--af-accent)", cap_fg="var(--af-on)", cap_border="var(--af-accent)",
   chip_bg="var(--af-tint)", chip_border="transparent", check_on="var(--af-accent)", check_mark="var(--af-on)",
   tog_bg="var(--af-accent)", tog_fg="var(--af-on)", nav_bg="var(--af-plate)"),
 "nanquim": dict(tile_bg="transparent", tile_fg="var(--af-ink)", tile_border="var(--af-ink)",
   sel_bg="var(--af-ink)", sel_fg="var(--af-bg)", sel_icon="var(--af-bg)", sel_line="transparent", sel_hint="var(--af-onhint)",
   btn_bg="var(--af-ink)", btn_fg="var(--af-bg)", btn_border="var(--af-ink)",
   cap_bg="var(--af-ink)", cap_fg="var(--af-bg)", cap_border="var(--af-ink)",
   chip_bg="transparent", chip_border="var(--af-line)", check_on="var(--af-ink)", check_mark="var(--af-bg)",
   tog_bg="var(--af-ink)", tog_fg="var(--af-bg)", nav_bg="var(--af-bg)"),
}
CORES = ["bg", "plate", "ink", "sec", "tert", "accent", "onaccent", "line", "tint", "edge", "accentline", "ring", "onhint", "invsec", "invtert", "invchip"]

out = ["/* Gerado por scripts/gerar-tema.py a partir do design system ARQFLOW. Não edite à mão. */", ""]
for s in P:
    for esquema in ("claro", "escuro"):
        c = P[s][esquema]
        decl = []
        for k in CORES:
            if k in c:
                nome = "on" if k == "onaccent" else k
                decl.append(f"--af-{nome}: {c[k]};")
        if "onhint" not in c:
            decl.append("--af-onhint: var(--af-tert);")
        out.append(f'[data-estilo="{s}"][data-theme="{esquema}"] {{ color-scheme: {"light" if esquema == "claro" else "dark"}; ' + " ".join(decl) + " }")
    r = R[s]; t = TRAT[s]
    decl = [f"--af-r-card: {r['card']};", f"--af-r-ctl: {r['control']};", f"--af-r-btn: {r['button']};", f"--af-r-chip: {r['chip']};", f"--af-r-check: {r['check']};", f"--af-r-cap: {CAP[s]};",
            f"--af-font: {FONTES[s]};", f"--af-stroke: {STROKE[s]};", f"--af-cap: {'square' if s == 'nanquim' else 'round'};", f"--af-join: {'miter' if s == 'nanquim' else 'round'};",
            f"--af-title-weight: {PESO_TITULO[s]};"]
    for k, v in t.items():
        decl.append(f"--af-{k.replace('_', '-')}: {v};")
    if s == "nanquim":
        decl += ["--af-hero-bg: var(--af-ink);", "--af-hero-fg: var(--af-bg);", "--af-hero-sec: var(--af-invsec);", "--af-hero-tert: var(--af-invtert);", "--af-hero-accent: var(--af-bg);", "--af-hero-border: var(--af-ink);", "--af-hero-chip-border: var(--af-invchip);", "--af-hero-btn-bg: var(--af-bg);", "--af-hero-btn-fg: var(--af-ink);", "--af-hero-btn-border: var(--af-bg);"]
    else:
        decl += ["--af-hero-bg: var(--af-plate);", "--af-hero-fg: var(--af-ink);", "--af-hero-sec: var(--af-sec);", "--af-hero-tert: var(--af-tert);", "--af-hero-accent: var(--af-accent);", "--af-hero-border: var(--af-edge);", "--af-hero-chip-border: var(--af-chip-border);", "--af-hero-btn-bg: var(--af-btn-bg);", "--af-hero-btn-fg: var(--af-btn-fg);", "--af-hero-btn-border: var(--af-btn-border);"]
    out.append(f'[data-estilo="{s}"] {{ ' + " ".join(decl) + " }")
    out.append("")
# amostras do seletor de aparência: fundo e acento de cada estilo nos dois esquemas
for esquema in ("claro", "escuro"):
    for s in P:
        c = P[s][esquema]
        out.append(f'[data-theme="{esquema}"] .af-swatch-{s} .af-swatch-fill {{ background: linear-gradient(135deg, {c["bg"]} 0 50%, {c["accent"]} 50% 100%); }}')
os.makedirs("src/app", exist_ok=True)
open("src/app/tema.css", "w").write("\n".join(out) + "\n")
print("ok")
