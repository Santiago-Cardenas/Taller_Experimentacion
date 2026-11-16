# ¿Qué pasaría si...? · Experimentación con JMeter

Taller individual de experimentación sobre la API de Tiquetmania: 10 preguntas de carga, estrés, concurrencia y recursos, cada una con su escenario, su ejecución en JMeter 5.6.3 (modo no-GUI) y su respuesta.

**Entrega:** [Experimentacion_JMeter_Que_pasaria_si.docx](Experimentacion_JMeter_Que_pasaria_si.docx) (también en [PDF](Experimentacion_JMeter_Que_pasaria_si.pdf)).

## Respuestas en una línea

| # | Pregunta | Respuesta corta |
|---|---|---|
| P01 | 20 → 500 usuarios | Cambian ambos: el tiempo de las exitosas se duplica (1,2 → 2,6 ms) y el throughput útil solo se multiplica por 5 (54,9 → 265,5/s); el 80 % falla en el generador |
| P02 | Ramp-up 1 s → 60 s | Desaparece el pico inicial: máximo de 102 ms en los primeros 5 s con 1 s, frente a 3 ms con 60 s |
| P03 | Sin temporizadores | El throughput del reporte sube 7,3 veces, pero las exitosas bajan un 26 % y tardan 7 veces más: deja de simular usuarios |
| P04 | Escalones 50/100/250/500 | El throughput útil se aplana en ~270/s desde 100 usuarios (techo del generador: 16.384 puertos ÷ 60 s) |
| P05 | 10 min en lugar de 1 | El tiempo de respuesta se mantiene (1,4-2,0 ms) y la memoria también; aparecen errores cíclicos que 1 minuto escondía |
| P06 | Tarifas frente a Selección | Selección cuesta más: 2,0 ms frente a 1,3 ms con la misma carga (escribe estado; Tarifas solo lee) |
| P07 | 500 reservas a la vez | No: solo 8 de 500 (1,6 %); la cola de conexiones de la API es de 5 y Windows rechaza el resto |
| P08 | Sincronizados frente a distribuidos | Los mismos 200 usuarios: distribuidos, 100 % de éxito en 1,6 ms; sincronizados, 96 % rechazados |
| P09 | Total = precio × cantidad | CSV con `total_esperado` + JSON Assertion: detecta el total alterado; bajo carga, 0 totales incorrectos |
| P10 | CPU y memoria con 500 | No se saturan (CPU de la API ≤ 7,7 %, memoria plana en 11 MB); lo que se agota son los puertos del generador |

**Hallazgo central:** la API cierra cada conexión (HTTP/1.0), así que este Windows (16.384 puertos dinámicos, ~120 s en TIME_WAIT) solo puede abrir ~273 conexiones/s durante 60 s y ~136/s sostenidas. Por encima de eso, los errores son del generador y no de la API. Ver sección 2 del documento.

## Contenido

```text
├── Experimentacion_JMeter_Que_pasaria_si.docx   Entrega (Word)
├── api/                    API de Tiquetmania (copia de la del taller)
├── planes/                 Un .jmx por pregunta + CSV (los mismos de Taller_jmeter/pruebas/experimentacion/)
├── scripts/
│   ├── ejecutar_pregunta.ps1    Levanta la API, registra CPU/memoria, corre JMeter no-GUI
│   ├── ejecutar_todas.ps1       Las 10 preguntas en serie, esperando a que se liberen los puertos
│   ├── medir_recursos.ps1       CPU y memoria con contadores de Windows (en lugar de PerfMon)
│   ├── analizar.py              Resumen por petición y variante, por minuto y gráficas
│   ├── generar_experimentos.py  Genera los .jmx de planes/
│   ├── generar_documento.py     Arma el Word a partir de los resultados (textos en textos.py)
│   └── capturas/                Capturas del GUI de JMeter y del reporte HTML
└── resultados/<pregunta>/
    ├── ejecucion-1/             Medición principal
    │   ├── reporte/index.html   Reporte HTML de JMeter
    │   ├── resumen.csv, resumen_variantes.csv, por_minuto.csv, errores.csv
    │   ├── recursos.csv, recursos_resumen.csv, entorno.json
    │   ├── graficas/            Tiempo, throughput, hilos, CPU y memoria
    │   ├── capturas/            Paneles del reporte HTML
    │   └── capturas-gui/        Escenario configurado en JMeter
    ├── ejecucion-2/             Repetición (P01, P04, P07, P08, P09)
    └── ejecucion-exploratoria/  Primera corrida, donde apareció el límite de puertos
```

Los `.jtl` (hasta 100 MB cada uno) no se suben; se regeneran al ejecutar los planes.

## Reproducir

Requisitos: Windows, Java 17, JMeter 5.6.3 en `%USERPROFILE%\apache-jmeter-5.6.3` (o la variable `JMETER_HOME`), Python 3.8+ con pandas y matplotlib.

```powershell
.\scripts\ejecutar_pregunta.ps1 -Pregunta P01_carga_20_vs_500_usuarios
python scripts\analizar.py resultados\P01_carga_20_vs_500_usuarios\ejecucion-1
```

Comando base de JMeter, desde `planes/`:

```bash
jmeter -n -t P01_carga_20_vs_500_usuarios.jmx -l resultados.jtl -e -o reporte
```

## Entorno de medición

Intel Core i5-13600K (20 núcleos lógicos), 31,7 GB de RAM, Windows 11 Pro, Java 17.0.20.1, Python 3.12.6. La API y JMeter corrieron en el mismo equipo, como pide el taller.
