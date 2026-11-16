"""Genera el documento de entrega (Word) del taller "¿Qué pasaría si...?".

Las tablas de resultados se leen de resultados/<pregunta>/ejecucion-N/*.csv; las imágenes, de
resultados/<pregunta>/ejecucion-1/{capturas,capturas-gui,graficas}. El texto de cada respuesta está en
textos.py, escrito a partir de esos mismos datos.
"""
import json
from pathlib import Path

import pandas as pd
from docx import Document
from docx.enum.section import WD_ORIENT
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor

from textos import ENTORNO, METODO, HALLAZGO, PREGUNTAS, CONCLUSIONES, LIMITACIONES_GENERALES, REPRODUCIR

RAIZ = Path(__file__).resolve().parent.parent
RES = RAIZ / "resultados"
AZUL = RGBColor(0x1F, 0x3A, 0x8A)
GRIS = RGBColor(0x55, 0x5B, 0x66)


# ---------- utilidades de formato ----------
def sombrear(celda, color_hex):
    tc = celda._tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), color_hex)
    tc.append(shd)


def bordes_tabla(tabla, color="BFC5D2"):
    tbl = tabla._tbl
    pr = tbl.tblPr
    b = OxmlElement("w:tblBorders")
    for lado in ("top", "left", "bottom", "right", "insideH", "insideV"):
        el = OxmlElement(f"w:{lado}")
        el.set(qn("w:val"), "single")
        el.set(qn("w:sz"), "4")
        el.set(qn("w:space"), "0")
        el.set(qn("w:color"), color)
        b.append(el)
    pr.append(b)


def tabla(doc, encabezados, filas, anchos_cm, tam=9):
    t = doc.add_table(rows=1, cols=len(encabezados))
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    t.autofit = False
    bordes_tabla(t)
    for i, h in enumerate(encabezados):
        c = t.rows[0].cells[i]
        c.width = Cm(anchos_cm[i])
        sombrear(c, "1F3A8A")
        p = c.paragraphs[0]
        r = p.add_run(str(h))
        r.bold = True
        r.font.size = Pt(tam)
        r.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
    for k, fila in enumerate(filas):
        celdas = t.add_row().cells
        for i, v in enumerate(fila):
            celdas[i].width = Cm(anchos_cm[i])
            if k % 2 == 1:
                sombrear(celdas[i], "EEF2FA")
            p = celdas[i].paragraphs[0]
            r = p.add_run("" if v is None or (isinstance(v, float) and pd.isna(v)) else str(v))
            r.font.size = Pt(tam)
            if i > 0 and isinstance(v, (int, float)):
                p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    doc.add_paragraph()
    return t


def parrafo(doc, texto, negrita_inicial=None, estilo=None, tam=None):
    p = doc.add_paragraph(style=estilo)
    if negrita_inicial:
        r = p.add_run(negrita_inicial + " ")
        r.bold = True
    # **negrita** simple dentro del texto
    partes = texto.split("**")
    for i, parte in enumerate(partes):
        r = p.add_run(parte)
        r.bold = i % 2 == 1
        if tam:
            r.font.size = Pt(tam)
    return p


def vinetas(doc, items):
    for it in items:
        parrafo(doc, it, estilo="List Bullet")


def imagen(doc, ruta, pie, ancho_cm=16.5):
    if not ruta.exists():
        parrafo(doc, f"[Falta la imagen: {ruta.name}]")
        return
    doc.add_picture(str(ruta), width=Cm(ancho_cm))
    doc.paragraphs[-1].alignment = WD_ALIGN_PARAGRAPH.CENTER
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run(pie)
    r.italic = True
    r.font.size = Pt(8.5)
    r.font.color.rgb = GRIS


def recortar_gui(ruta, ancho=1450, margen=18):
    """Recorta una captura del GUI de JMeter: se queda con el árbol y los campos (izquierda)
    y corta debajo de la última fila con contenido."""
    if not ruta.exists():
        return ruta
    from PIL import Image
    import numpy as np
    img = Image.open(ruta).convert("RGB")
    ancho = min(ancho, img.width)
    a = np.asarray(img)[:, :ancho, :].astype(int)
    fondo = a[-5, ancho // 2]   # color del fondo del panel
    distinto = np.abs(a - fondo).sum(axis=2) > 40
    distinto[:, 580:660] = False   # la línea divisoria entre árbol y panel llega hasta abajo: no cuenta como contenido
    filas = np.where(distinto.any(axis=1))[0]
    alto = min(img.height, int(filas.max()) + margen) if len(filas) else img.height
    destino = ruta.with_name("recorte_" + ruta.name)
    img.crop((0, 0, ancho, max(alto, 200))).save(destino)
    return destino


def fmt(v, dec=1):
    if v is None or (isinstance(v, float) and pd.isna(v)):
        return "—"
    if isinstance(v, (int,)) or (isinstance(v, float) and float(v).is_integer() and dec == 0):
        return f"{int(v):,}".replace(",", ".")
    return f"{v:,.{dec}f}".replace(",", "X").replace(".", ",").replace("X", ".")


def tabla_variantes(doc, carpeta, titulo_var="Variante"):
    df = pd.read_csv(carpeta / "resumen_variantes.csv")
    filas = []
    for _, r in df.iterrows():
        filas.append([r["Variante"], fmt(int(r["Muestras"]), 0), fmt(r["Media (ms)"]), fmt(r["p95 (ms)"]),
                      fmt(int(r["Máx (ms)"]), 0), fmt(r["% Error"], 2) + " %", fmt(r["Rendimiento (/s)"]),
                      fmt(r["Exitosas/s"]), fmt(r["Media exitosas (ms)"])])
    tabla(doc, [titulo_var, "Muestras", "Media (ms)", "p95 (ms)", "Máx (ms)", "% Error", "Rendimiento (/s)",
                "Exitosas/s", "Media exitosas (ms)"],
          filas, [3.3, 1.7, 1.6, 1.5, 1.5, 1.7, 2.1, 1.7, 2.1], tam=8)


def tabla_etiquetas(doc, carpeta):
    df = pd.read_csv(carpeta / "resumen.csv")
    filas = [[r["Etiqueta"], fmt(int(r["Muestras"]), 0), fmt(r["Media (ms)"]), fmt(r["p95 (ms)"]),
              fmt(int(r["Máx (ms)"]), 0), fmt(r["% Error"], 2) + " %", fmt(r["Rendimiento (/s)"])]
             for _, r in df.iterrows()]
    tabla(doc, ["Petición", "Muestras", "Media (ms)", "p95 (ms)", "Máx (ms)", "% Error", "Rendimiento (/s)"],
          filas, [5.6, 1.8, 1.8, 1.7, 1.7, 1.8, 2.4], tam=8)


def tabla_repeticion(doc, pregunta):
    c1, c2 = RES / pregunta / "ejecucion-1", RES / pregunta / "ejecucion-2"
    if not (c2 / "resumen_variantes.csv").exists():
        return False
    a = pd.read_csv(c1 / "resumen_variantes.csv").set_index("Variante")
    b = pd.read_csv(c2 / "resumen_variantes.csv").set_index("Variante")
    filas = []
    for v in a.index:
        if v in b.index:
            filas.append([v, fmt(a.loc[v, "% Error"], 2) + " %", fmt(b.loc[v, "% Error"], 2) + " %",
                          fmt(a.loc[v, "Exitosas/s"]), fmt(b.loc[v, "Exitosas/s"]),
                          fmt(a.loc[v, "Media exitosas (ms)"]), fmt(b.loc[v, "Media exitosas (ms)"])])
    tabla(doc, ["Variante", "% Error ej. 1", "% Error ej. 2", "Exitosas/s ej. 1", "Exitosas/s ej. 2",
                "Media exit. ej. 1", "Media exit. ej. 2"], filas, [3.4, 2.1, 2.1, 2.4, 2.4, 2.3, 2.3], tam=8)
    return True


# ---------- documento ----------
def construir(salida):
    doc = Document()
    sec = doc.sections[0]
    sec.page_height, sec.page_width = Cm(29.7), Cm(21.0)
    for lado in ("left_margin", "right_margin"):
        setattr(sec, lado, Cm(2.0))
    sec.top_margin, sec.bottom_margin = Cm(2.0), Cm(2.0)

    estilos = doc.styles
    estilos["Normal"].font.name = "Calibri"
    estilos["Normal"].font.size = Pt(10.5)
    estilos["Normal"].paragraph_format.space_after = Pt(5)
    for nombre, tam, color in (("Title", 26, AZUL), ("Heading 1", 16, AZUL), ("Heading 2", 12.5, AZUL), ("Heading 3", 11, GRIS)):
        s = estilos[nombre]
        s.font.name = "Calibri"
        s.font.size = Pt(tam)
        s.font.bold = True
        s.font.color.rgb = color
        s.paragraph_format.space_before = Pt(14 if nombre != "Title" else 0)
        s.paragraph_format.space_after = Pt(6)
        s.paragraph_format.keep_with_next = True
        rpr = s.element.get_or_add_rPr()
        fuentes = rpr.find(qn("w:rFonts"))
        if fuentes is None:
            fuentes = OxmlElement("w:rFonts")
            rpr.append(fuentes)
        for atr in ("w:ascii", "w:hAnsi", "w:cs", "w:eastAsia"):
            fuentes.set(qn(atr), "Calibri")

    # Portada
    for _ in range(5):
        doc.add_paragraph()
    p = doc.add_paragraph(style="Title")
    p.add_run("¿Qué pasaría si...?")
    p = doc.add_paragraph()
    r = p.add_run("Taller de experimentación con JMeter · API de Tiquetmania")
    r.font.size = Pt(15)
    r.font.color.rgb = GRIS
    doc.add_paragraph()
    for linea in ENTORNO["portada"]:
        parrafo(doc, linea, tam=11)
    doc.add_paragraph().add_run().add_break(WD_BREAK.PAGE)

    # Tabla de contenido (Word la actualiza al abrir o con F9)
    doc.add_heading("Contenido", level=1)
    p = doc.add_paragraph()
    fld = OxmlElement("w:fldSimple")
    fld.set(qn("w:instr"), 'TOC \\o "1-1" \\h \\z \\u')
    r = OxmlElement("w:r")
    t = OxmlElement("w:t")
    t.text = "Haz clic derecho y elige «Actualizar campo» para ver la tabla de contenido."
    r.append(t)
    fld.append(r)
    p._p.append(fld)
    doc.add_paragraph().add_run().add_break(WD_BREAK.PAGE)

    # 1. Entorno y método
    doc.add_heading("1. Entorno y método", level=1)
    env = json.loads((RES / "P01_carga_20_vs_500_usuarios" / "ejecucion-1" / "entorno.json").read_text(encoding="utf-8-sig"))
    tabla(doc, ["Elemento", "Valor"], [
        ["Equipo", f'{env["equipo"]} · {env["nucleos_logicos"]} núcleos lógicos · {env["ram_gb"]} GB de RAM'],
        ["Sistema operativo", ENTORNO["so"]],
        ["Herramientas", f'Apache JMeter 5.6.3 · {env["java"]} · {env["python"]}'],
        ["API bajo prueba", "api/ticketmania_simple.py en http://127.0.0.1:8080, en el mismo equipo que JMeter"],
        ["Planes", "Un .jmx por pregunta en pruebas/experimentacion/ del repositorio (no los ejecuta el pipeline)"],
        ["Fecha de las mediciones", ENTORNO["fecha"]],
    ], [4.0, 13.0])
    for t_ in METODO:
        parrafo(doc, t_)

    # 2. Hallazgo transversal
    doc.add_heading("2. Hallazgo que atraviesa todas las preguntas", level=1)
    for t_ in HALLAZGO["parrafos"]:
        parrafo(doc, t_)
    tabla(doc, HALLAZGO["tabla_enc"], HALLAZGO["tabla"], [5.5, 3.0, 3.0, 5.5])
    for t_ in HALLAZGO["cierre"]:
        parrafo(doc, t_)

    # 3. Preguntas
    for n, q in enumerate(PREGUNTAS, start=1):
        doc.add_page_break()
        doc.add_heading(f"{n + 2}. P{n:02d} · {q['titulo']}", level=1)
        parrafo(doc, q["pregunta"], negrita_inicial="Pregunta:")
        carpeta = RES / q["carpeta"] / "ejecucion-1"

        doc.add_heading("Escenario", level=2)
        parrafo(doc, q["variable"], negrita_inicial="Qué cambia y qué se mantiene:")
        parrafo(doc, q["metrica"], negrita_inicial="Métrica que responde:")
        tabla(doc, ["Grupo de hilos", "Hilos", "Subida", "Duración / bucle", "Temporizador", "Retardo de arranque"],
              q["escenario"], [3.6, 1.3, 1.5, 2.9, 4.6, 3.1], tam=8.5)
        gui = carpeta / "capturas-gui"
        for archivo, pie in q.get("gui", []):
            imagen(doc, recortar_gui(gui / archivo), pie, ancho_cm=16.5)

        doc.add_heading("Resultados", level=2)
        if q.get("tabla") == "etiquetas":
            tabla_etiquetas(doc, carpeta)
        else:
            tabla_variantes(doc, carpeta)
        for t_ in q.get("resultados", []):
            parrafo(doc, t_)
        if q.get("tabla_extra"):
            enc, filas, anchos = q["tabla_extra"]
            tabla(doc, enc, filas, anchos, tam=8.5)
        for ruta, pie in q.get("imagenes", []):
            imagen(doc, carpeta / ruta, pie)
        if tabla_repeticion(doc, q["carpeta"]) is True:
            pass
        for t_ in q.get("repeticion", []):
            parrafo(doc, t_)

        doc.add_heading("Respuesta", level=2)
        for t_ in q["respuesta"]:
            parrafo(doc, t_)
        doc.add_heading("Limitación", level=2)
        for t_ in q["limitacion"]:
            parrafo(doc, t_)

    # Conclusiones y limitaciones
    doc.add_page_break()
    doc.add_heading(f"{len(PREGUNTAS) + 3}. Conclusiones", level=1)
    vinetas(doc, CONCLUSIONES)
    doc.add_heading(f"{len(PREGUNTAS) + 4}. Limitaciones generales", level=1)
    vinetas(doc, LIMITACIONES_GENERALES)
    doc.add_heading(f"{len(PREGUNTAS) + 5}. Cómo reproducir las mediciones", level=1)
    for t_ in REPRODUCIR:
        p = doc.add_paragraph()
        r = p.add_run(t_)
        if t_.startswith("    ") or t_.startswith(".\\") or t_.startswith("python") or t_.startswith("jmeter"):
            r.font.name = "Consolas"
            r.font.size = Pt(9)

    # Pie de página con número
    pie = sec.footer.paragraphs[0]
    pie.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    r = pie.add_run("¿Qué pasaría si...? · Tiquetmania · página ")
    r.font.size = Pt(8)
    r.font.color.rgb = GRIS
    for tipo, texto in (("begin", None), (None, "PAGE"), ("end", None)):
        run = pie.add_run()
        run.font.size = Pt(8)
        if tipo:
            f = OxmlElement("w:fldChar")
            f.set(qn("w:fldCharType"), tipo)
            run._r.append(f)
        else:
            it = OxmlElement("w:instrText")
            it.set(qn("xml:space"), "preserve")
            it.text = texto
            run._r.append(it)

    doc.save(salida)
    print("documento:", salida)


if __name__ == "__main__":
    construir(RAIZ / "Experimentacion_JMeter_Que_pasaria_si.docx")
