"""Analiza una ejecución: resumen por etiqueta y gráficas en el tiempo.

Uso:  python analizar.py <carpeta de la ejecución>
Lee resultados.jtl (y recursos.csv si existe) y escribe resumen.csv, errores.csv y graficas/*.png.
Las columnas del resumen son las mismas del reporte de JMeter: Muestras, Media, p95, Máx, % Error y
Rendimiento (muestras ÷ segundos entre la primera y la última muestra de esa etiqueta).
"""
import sys
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import pandas as pd

COLORES = ["#2a6fdb", "#e8590c", "#2b8a3e", "#c2255c", "#7048e8", "#0c8599", "#5c940d", "#e67700"]


def variante(etiqueta):
    """'Pago [500 usuarios]' -> '500 usuarios'"""
    return etiqueta.split("[")[-1].rstrip("]") if "[" in etiqueta else etiqueta


def resumen(jtl):
    filas = []
    for etiqueta, g in jtl.groupby("label", sort=True):
        dur_s = max((g["fin"].max() - g["timeStamp"].min()) / 1000, 0.001)
        filas.append({
            "Etiqueta": etiqueta,
            "Muestras": len(g),
            "Media (ms)": round(g["elapsed"].mean(), 1),
            "p95 (ms)": round(g["elapsed"].quantile(0.95), 1),
            "Máx (ms)": int(g["elapsed"].max()),
            "% Error": round(100 * (~g["ok"]).mean(), 2),
            "Rendimiento (/s)": round(len(g) / dur_s, 1),
        })
    return pd.DataFrame(filas)


def resumen_variantes(jtl):
    """Totales por variante (todas las peticiones de un grupo de hilos)."""
    filas = []
    for v, g in jtl.groupby("variante", sort=False):
        dur_s = max((g["fin"].max() - g["timeStamp"].min()) / 1000, 0.001)
        filas.append({
            "Variante": v,
            "Muestras": len(g),
            "Media (ms)": round(g["elapsed"].mean(), 1),
            "p95 (ms)": round(g["elapsed"].quantile(0.95), 1),
            "Máx (ms)": int(g["elapsed"].max()),
            "% Error": round(100 * (~g["ok"]).mean(), 2),
            "Rendimiento (/s)": round(len(g) / dur_s, 1),
            "Exitosas/s": round(g["ok"].sum() / dur_s, 1),
            "Media exitosas (ms)": round(g.loc[g["ok"], "elapsed"].mean(), 1) if g["ok"].any() else None,
            "Duración (s)": round(dur_s, 1),
            "Hilos máx.": int(g["allThreads"].max()),
        })
    return pd.DataFrame(filas)


def grafica(ax, titulo, ylabel):
    ax.set_title(titulo, fontsize=11, loc="left")
    ax.set_ylabel(ylabel)
    ax.grid(alpha=0.3)
    ax.spines[["top", "right"]].set_visible(False)


def main(carpeta):
    carpeta = Path(carpeta)
    jtl = pd.read_csv(carpeta / "resultados.jtl", low_memory=False)
    jtl["ok"] = jtl["success"].astype(str).str.lower() == "true"
    jtl["fin"] = jtl["timeStamp"] + jtl["elapsed"]
    t0 = jtl["timeStamp"].min()
    jtl["t"] = (jtl["timeStamp"] - t0) / 1000
    jtl["seg"] = jtl["t"].astype(int)
    jtl["variante"] = jtl["label"].map(variante)

    res = resumen(jtl)
    res.to_csv(carpeta / "resumen.csv", index=False, encoding="utf-8")
    var = resumen_variantes(jtl)
    var.to_csv(carpeta / "resumen_variantes.csv", index=False, encoding="utf-8")

    errores = (jtl[~jtl["ok"]]
               .assign(mensaje=lambda d: d["responseCode"].astype(str) + " · " + d["responseMessage"].astype(str)
                       + " · " + d.get("failureMessage", pd.Series("", index=d.index)).fillna("").astype(str))
               .groupby(["label", "mensaje"]).size().reset_index(name="cantidad")
               .sort_values("cantidad", ascending=False))
    errores.to_csv(carpeta / "errores.csv", index=False, encoding="utf-8")

    print(res.to_string(index=False))
    print()
    print(var.to_string(index=False))
    if len(errores):
        print("\nErrores:")
        print(errores.head(15).to_string(index=False))

    jtl["minuto"] = (jtl["t"] // 60).astype(int) + 1
    por_min = (jtl.groupby(["variante", "minuto"])
               .agg(muestras=("elapsed", "size"), exitosas=("ok", "sum"),
                    media_exitosas_ms=("elapsed", lambda x: round(x[jtl.loc[x.index, "ok"]].mean(), 2)))
               .reset_index())
    por_min["error_pct"] = (100 * (1 - por_min["exitosas"] / por_min["muestras"])).round(2)
    por_min.to_csv(carpeta / "por_minuto.csv", index=False, encoding="utf-8")

    graf = carpeta / "graficas"
    graf.mkdir(exist_ok=True)
    variantes = list(dict.fromkeys(jtl["variante"]))

    # 1. Tiempo de respuesta (media por segundo) y throughput (muestras por segundo) en el tiempo
    fig, (a1, a2, a3) = plt.subplots(3, 1, figsize=(13, 9), sharex=True)
    for i, v in enumerate(variantes):
        g = jtl[jtl["variante"] == v]
        por_seg = g.groupby("seg")
        c = COLORES[i % len(COLORES)]
        a1.plot(por_seg["elapsed"].mean(), color=c, lw=1.2, label=v)
        a2.plot(g[g["ok"]].groupby("seg").size(), color=c, lw=1.2, label=f"{v} · exitosas")
        if (~g["ok"]).any():
            a2.plot(g[~g["ok"]].groupby("seg").size(), color=c, lw=0.9, ls="--", alpha=0.7, label=f"{v} · fallidas")
        a3.plot(por_seg["allThreads"].max(), color=c, lw=1.2, label=v)
    grafica(a1, "Tiempo de respuesta medio por segundo", "ms")
    grafica(a2, "Throughput por segundo: exitosas (línea continua) y fallidas (punteada)", "peticiones/s")
    a2.legend(loc="upper left", bbox_to_anchor=(1.01, 1), fontsize=8, frameon=False)
    grafica(a3, "Hilos activos", "hilos")
    a3.set_xlabel("segundos desde el inicio de la prueba")
    a1.legend(loc="upper left", bbox_to_anchor=(1.01, 1), fontsize=9, frameon=False)
    fig.tight_layout()
    fig.savefig(graf / "tiempo_throughput_hilos.png", dpi=130)
    plt.close(fig)

    # 2. Errores por segundo, si los hay
    if (~jtl["ok"]).any():
        fig, ax = plt.subplots(figsize=(11, 3.2))
        for i, v in enumerate(variantes):
            g = jtl[(jtl["variante"] == v) & (~jtl["ok"])]
            if len(g):
                ax.bar(g.groupby("seg").size().index, g.groupby("seg").size().values,
                       color=COLORES[i % len(COLORES)], label=v, width=1.0)
        grafica(ax, "Peticiones fallidas por segundo", "fallidas/s")
        ax.set_xlabel("segundos desde el inicio de la prueba")
        ax.legend(fontsize=9, frameon=False)
        fig.tight_layout()
        fig.savefig(graf / "errores.png", dpi=130)
        plt.close(fig)

    # 3. CPU y memoria (contadores de Windows) alineados con la prueba
    rec_path = carpeta / "recursos.csv"
    if rec_path.exists():
        rec = pd.read_csv(rec_path, encoding="utf-8-sig")
        if len(rec):
            rec["t"] = (rec["marca_ms"] - t0) / 1000
            fig, (b1, b2) = plt.subplots(2, 1, figsize=(13, 6.5), sharex=True)
            b1.plot(rec["t"], rec["cpu_total_pct"], color="#495057", lw=1.2, label="Equipo completo")
            b1.plot(rec["t"], rec["cpu_api_pct"], color="#2a6fdb", lw=1.2, label="API (python)")
            b1.plot(rec["t"], rec["cpu_jmeter_pct"], color="#e8590c", lw=1.2, label="JMeter (java)")
            b1.set_ylim(0, 100)
            grafica(b1, "CPU (% del equipo)", "%")
            b1.legend(fontsize=9, frameon=False, loc="upper left", bbox_to_anchor=(1.01, 1))
            b2.plot(rec["t"], rec["mem_api_mb"], color="#2a6fdb", lw=1.2, label="API (python)")
            b2.plot(rec["t"], rec["mem_jmeter_mb"], color="#e8590c", lw=1.2, label="JMeter (java)")
            grafica(b2, "Memoria privada por proceso", "MB")
            b2.legend(fontsize=9, frameon=False, loc="upper left", bbox_to_anchor=(1.01, 1))
            b2.set_xlabel("segundos desde el inicio de la prueba")
            fig.tight_layout()
            fig.savefig(graf / "cpu_memoria.png", dpi=130)
            plt.close(fig)
            durante = rec[(rec["t"] >= 0) & (rec["t"] <= jtl["t"].max())]
            r = {
                "cpu_total_media": round(durante["cpu_total_pct"].mean(), 1),
                "cpu_total_max": round(durante["cpu_total_pct"].max(), 1),
                "cpu_api_media": round(durante["cpu_api_pct"].mean(), 1),
                "cpu_api_max": round(durante["cpu_api_pct"].max(), 1),
                "cpu_jmeter_media": round(durante["cpu_jmeter_pct"].mean(), 1),
                "cpu_jmeter_max": round(durante["cpu_jmeter_pct"].max(), 1),
                "mem_api_inicio_mb": durante["mem_api_mb"].iloc[0] if len(durante) else None,
                "mem_api_max_mb": durante["mem_api_mb"].max(),
                "mem_api_fin_mb": durante["mem_api_mb"].iloc[-1] if len(durante) else None,
                "mem_jmeter_max_mb": durante["mem_jmeter_mb"].max(),
                "mem_equipo_pct_max": durante["mem_usada_pct"].max(),
            }
            pd.Series(r).to_csv(carpeta / "recursos_resumen.csv", header=["valor"], encoding="utf-8")
            print("\nRecursos:", r)


if __name__ == "__main__":
    main(sys.argv[1])
