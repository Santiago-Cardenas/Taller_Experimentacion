"""Genera los planes .jmx de la experimentación (una pregunta por archivo).

Cada variante de una pregunta es un Grupo de Hilos propio; el plan se ejecuta con
"Lanza cada Grupo de Hilos separadamente", así las variantes no se mezclan y el
reporte las compara por etiqueta (por ejemplo "Pago [20 usuarios]").
"""
from pathlib import Path
from xml.sax.saxutils import escape

DESTINO = Path(__file__).resolve().parent.parent / "planes"   # luego se copian a Taller_jmeter/pruebas/experimentacion/


def e(texto):
    return escape(str(texto), {'"': "&quot;"})


# ---------- elementos ----------
def http_defaults():
    return """<ConfigTestElement guiclass="HttpDefaultsGui" testclass="ConfigTestElement" testname="Valores por Defecto para Petición HTTP">
  <stringProp name="HTTPSampler.protocol">http</stringProp>
  <stringProp name="HTTPSampler.domain">127.0.0.1</stringProp>
  <stringProp name="HTTPSampler.port">8080</stringProp>
  <elementProp name="HTTPsampler.Arguments" elementType="Arguments" guiclass="HTTPArgumentsPanel" testclass="Arguments" testname="Variables definidas por el usuario">
    <collectionProp name="Arguments.arguments"/>
  </elementProp>
</ConfigTestElement>
<hashTree/>
"""


def cookies():
    return """<CookieManager guiclass="CookiePanel" testclass="CookieManager" testname="Gestor de Cookies HTTP">
  <collectionProp name="CookieManager.cookies"/>
  <boolProp name="CookieManager.clearEachIteration">false</boolProp>
  <boolProp name="CookieManager.controlledByThreadGroup">false</boolProp>
</CookieManager>
<hashTree/>
"""


def csv(archivo, variables, nombre="Configuración del CSV Data Set"):
    return f"""<CSVDataSet guiclass="TestBeanGUI" testclass="CSVDataSet" testname="{e(nombre)}">
  <stringProp name="filename">{e(archivo)}</stringProp>
  <stringProp name="fileEncoding">UTF-8</stringProp>
  <stringProp name="variableNames">{e(variables)}</stringProp>
  <boolProp name="ignoreFirstLine">true</boolProp>
  <stringProp name="delimiter">,</stringProp>
  <boolProp name="quotedData">false</boolProp>
  <boolProp name="recycle">true</boolProp>
  <boolProp name="stopThread">false</boolProp>
  <stringProp name="shareMode">shareMode.all</stringProp>
</CSVDataSet>
<hashTree/>
"""


def cabeceras():
    return """<HeaderManager guiclass="HeaderPanel" testclass="HeaderManager" testname="Gestor de Cabecera HTTP">
  <collectionProp name="HeaderManager.headers">
    <elementProp name="" elementType="Header">
      <stringProp name="Header.name">Accept</stringProp>
      <stringProp name="Header.value">application/json</stringProp>
    </elementProp>
    <elementProp name="" elementType="Header">
      <stringProp name="Header.name">Content-Type</stringProp>
      <stringProp name="Header.value">application/json</stringProp>
    </elementProp>
  </collectionProp>
</HeaderManager>
<hashTree/>
"""


def extractor():
    return """<JSONPostProcessor guiclass="JSONPostProcessorGui" testclass="JSONPostProcessor" testname="JSON Extractor">
  <stringProp name="JSONPostProcessor.referenceNames">num_reserva</stringProp>
  <stringProp name="JSONPostProcessor.jsonPathExprs">$.reserva</stringProp>
  <stringProp name="JSONPostProcessor.match_numbers">1</stringProp>
  <stringProp name="JSONPostProcessor.defaultValues">num_reserva_not_found</stringProp>
</JSONPostProcessor>
<hashTree/>
"""


def aserto_json(ruta, valor, nombre):
    return f"""<JSONPathAssertion guiclass="JSONPathAssertionGui" testclass="JSONPathAssertion" testname="{e(nombre)}">
  <stringProp name="JSON_PATH">{e(ruta)}</stringProp>
  <stringProp name="EXPECTED_VALUE">{e(valor)}</stringProp>
  <boolProp name="JSONVALIDATION">true</boolProp>
  <boolProp name="EXPECT_NULL">false</boolProp>
  <boolProp name="INVERT">false</boolProp>
  <boolProp name="ISREGEX">false</boolProp>
</JSONPathAssertion>
<hashTree/>
"""


def temporizador(retardo=500, rango=1000):
    return f"""<UniformRandomTimer guiclass="UniformRandomTimerGui" testclass="UniformRandomTimer" testname="Temporizador Aleatorio Uniforme">
  <stringProp name="ConstantTimer.delay">{retardo}</stringProp>
  <stringProp name="RandomTimer.range">{rango}</stringProp>
</UniformRandomTimer>
<hashTree/>
"""


def sincronizado(grupo, espera_ms=60000):
    return f"""<SyncTimer guiclass="TestBeanGUI" testclass="SyncTimer" testname="Temporizador Sincronizado">
  <intProp name="groupSize">{grupo}</intProp>
  <longProp name="timeoutInMs">{espera_ms}</longProp>
</SyncTimer>
<hashTree/>
"""


def peticion(nombre, metodo, ruta, cuerpo=None, hijos=""):
    if cuerpo is None:
        args = """<elementProp name="HTTPsampler.Arguments" elementType="Arguments" guiclass="HTTPArgumentsPanel" testclass="Arguments" testname="Variables definidas por el usuario">
    <collectionProp name="Arguments.arguments"/>
  </elementProp>"""
        raw = "false"
    else:
        args = f"""<elementProp name="HTTPsampler.Arguments" elementType="Arguments">
    <collectionProp name="Arguments.arguments">
      <elementProp name="" elementType="HTTPArgument">
        <boolProp name="HTTPArgument.always_encode">false</boolProp>
        <stringProp name="Argument.value">{e(cuerpo)}</stringProp>
        <stringProp name="Argument.metadata">=</stringProp>
      </elementProp>
    </collectionProp>
  </elementProp>"""
        raw = "true"
    return f"""<HTTPSamplerProxy guiclass="HttpTestSampleGui" testclass="HTTPSamplerProxy" testname="{e(nombre)}">
  <stringProp name="HTTPSampler.path">{ruta}</stringProp>
  <stringProp name="HTTPSampler.method">{metodo}</stringProp>
  <boolProp name="HTTPSampler.follow_redirects">true</boolProp>
  <boolProp name="HTTPSampler.use_keepalive">true</boolProp>
  <boolProp name="HTTPSampler.postBodyRaw">{raw}</boolProp>
  {args}
</HTTPSamplerProxy>
{"<hashTree>" + chr(10) + hijos + "</hashTree>" if hijos else "<hashTree/>"}
"""


ENFRIAMIENTO = 150  # s: Windows retiene ~120 s cada puerto cerrado (TIME_WAIT); se espera a que se liberen


def grupo_hilos(nombre, hilos, subida, hijos, duracion=None, bucles=1, comentario="", retardo=None):
    """duracion en segundos: el grupo repite el flujo hasta que se cumpla. Sin duración, repite 'bucles' veces.
    retardo: segundos de espera antes de arrancar el grupo (enfriamiento entre variantes)."""
    if retardo:
        comentario = (comentario + " " if comentario else "") + (
            f"Retardo de arranque de {retardo} s: deja que Windows libere los puertos (TIME_WAIT) "
            "que usó la variante anterior, para que no contamine esta.")
    planificador = duracion is not None or bool(retardo)
    return f"""<ThreadGroup guiclass="ThreadGroupGui" testclass="ThreadGroup" testname="{e(nombre)}">
  <stringProp name="TestPlan.comments">{e(comentario)}</stringProp>
  <stringProp name="ThreadGroup.on_sample_error">continue</stringProp>
  <elementProp name="ThreadGroup.main_controller" elementType="LoopController" guiclass="LoopControlPanel" testclass="LoopController" testname="Controlador Bucle">
    <stringProp name="LoopController.loops">{-1 if duracion is not None else bucles}</stringProp>
    <boolProp name="LoopController.continue_forever">false</boolProp>
  </elementProp>
  <stringProp name="ThreadGroup.num_threads">{hilos}</stringProp>
  <stringProp name="ThreadGroup.ramp_time">{subida}</stringProp>
  <boolProp name="ThreadGroup.delayedStart">false</boolProp>
  <boolProp name="ThreadGroup.scheduler">{"true" if planificador else "false"}</boolProp>
  <stringProp name="ThreadGroup.duration">{duracion if duracion is not None else (300 if planificador else "")}</stringProp>
  <stringProp name="ThreadGroup.delay">{retardo or ""}</stringProp>
  <boolProp name="ThreadGroup.same_user_on_next_iteration">true</boolProp>
</ThreadGroup>
<hashTree>
{hijos}</hashTree>
"""


def reporte_resumen():
    return """<ResultCollector guiclass="SummaryReport" testclass="ResultCollector" testname="Reporte resumen">
  <boolProp name="ResultCollector.error_logging">false</boolProp>
  <stringProp name="filename"></stringProp>
</ResultCollector>
<hashTree/>
<ResultCollector guiclass="ViewResultsFullVisualizer" testclass="ResultCollector" testname="Ver Árbol de Resultados" enabled="false">
  <boolProp name="ResultCollector.error_logging">false</boolProp>
  <stringProp name="filename"></stringProp>
</ResultCollector>
<hashTree/>
"""


def plan(nombre, comentario, hijos):
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<jmeterTestPlan version="1.2" properties="5.0" jmeter="5.6.3">
  <hashTree>
    <TestPlan guiclass="TestPlanGui" testclass="TestPlan" testname="{e(nombre)}">
      <stringProp name="TestPlan.comments">{e(comentario)}</stringProp>
      <elementProp name="TestPlan.user_defined_variables" elementType="Arguments" guiclass="ArgumentsPanel" testclass="Arguments" testname="Variables definidas por el usuario">
        <collectionProp name="Arguments.arguments"/>
      </elementProp>
      <boolProp name="TestPlan.functional_mode">false</boolProp>
      <boolProp name="TestPlan.serialize_threadgroups">true</boolProp>
    </TestPlan>
    <hashTree>
{hijos}    </hashTree>
  </hashTree>
</jmeterTestPlan>
"""


# ---------- flujo de compra ----------
def flujo(sufijo, con_tarifas=True, timer=True, sync=None, validar_total=False):
    """Tarifas → Selección (+cabecera, extractor, temporizador) → Pago (+cabecera, aserción)."""
    tag = f" [{sufijo}]"
    hijos_sel = cabeceras() + extractor()
    if validar_total:
        hijos_sel += aserto_json("$.total", "${total_esperado}", "JSON Assertion: total = precio × cantidad")
    if sync:
        hijos_sel += sincronizado(sync)
    if timer:
        hijos_sel += temporizador()
    hijos_pago = cabeceras() + aserto_json("$.estado", "APROBADO", "JSON Assertion: estado = APROBADO")
    if validar_total:
        hijos_pago += aserto_json("$.total", "${total_esperado}", "JSON Assertion: total cobrado = precio × cantidad")
    xml = ""
    if con_tarifas:
        xml += peticion("Tarifas" + tag, "GET", "/api/tarifas")
    xml += peticion("SeleccionTarifaYCantidad" + tag, "POST", "/api/seleccion",
                    '{"tarifa":"${tarifa}","cantidad":${cantidad}}', hijos_sel)
    xml += peticion("Pago" + tag, "POST", "/api/pago", '{"reserva":"${num_reserva}"}', hijos_pago)
    return xml


def base(archivo_csv="datos.csv", variables="tarifa,cantidad"):
    return http_defaults() + cookies() + csv(archivo_csv, variables)


# ---------- preguntas ----------
PREGUNTAS = {}

PREGUNTAS["P01_carga_20_vs_500_usuarios"] = plan(
    "P01 · Carga: 20 frente a 500 usuarios",
    "¿Qué pasaría si subo de 20 a 500 usuarios? Cambia SOLO el número de hilos. Igual: subida 10 s, duración 60 s, temporizador 500-1500 ms.",
    base()
    + grupo_hilos("20 usuarios", 20, 10, flujo("20 usuarios"), duracion=60)
    + grupo_hilos("500 usuarios", 500, 10, flujo("500 usuarios"), duracion=60, retardo=ENFRIAMIENTO)
    + reporte_resumen(),
)

PREGUNTAS["P02_carga_rampup_1_vs_60"] = plan(
    "P02 · Carga: ramp-up de 1 s frente a 60 s",
    "¿Qué pasaría si el ramp-up pasa de 1 s a 60 s? Cambia SOLO el periodo de subida. Igual: 300 hilos, duración 90 s, temporizador 500-1500 ms.",
    base()
    + grupo_hilos("Subida 1 s", 300, 1, flujo("subida 1 s"), duracion=90)
    + grupo_hilos("Subida 60 s", 300, 60, flujo("subida 60 s"), duracion=90, retardo=ENFRIAMIENTO)
    + reporte_resumen(),
)

PREGUNTAS["P03_carga_sin_temporizadores"] = plan(
    "P03 · Carga: con y sin temporizadores",
    "¿Qué pasaría si quito los temporizadores? Cambia SOLO el temporizador (se elimina). Igual: 200 hilos, subida 10 s, duración 60 s.",
    base()
    + grupo_hilos("Con temporizador", 200, 10, flujo("con temporizador"), duracion=60)
    + grupo_hilos("Sin temporizador", 200, 10, flujo("sin temporizador", timer=False), duracion=60, retardo=ENFRIAMIENTO)
    + reporte_resumen(),
)

PREGUNTAS["P04_estres_escalones"] = plan(
    "P04 · Estrés: escalones de 50, 100, 250 y 500 usuarios",
    "¿En qué punto deja de crecer el throughput? Cada escalón mantiene su carga 60 s (subida 10 s), con temporizador 500-1500 ms.",
    base()
    + "".join(grupo_hilos(f"Escalón {n} usuarios", n, 10, flujo(f"{n:03d} usuarios"), duracion=60,
                       retardo=(ENFRIAMIENTO if n != 50 else None)) for n in (50, 100, 250, 500))
    + reporte_resumen(),
)

PREGUNTAS["P05_estres_duracion_1_vs_10_min"] = plan(
    "P05 · Estrés: 1 minuto frente a 10 minutos",
    "¿El tiempo de respuesta se mantiene o sube con el tiempo? Cambia SOLO la duración. Igual: 100 hilos, subida 10 s, temporizador 500-1500 ms.",
    base()
    + grupo_hilos("Duración 1 min", 100, 10, flujo("1 min"), duracion=60)
    + grupo_hilos("Duración 10 min", 100, 10, flujo("10 min"), duracion=600, retardo=ENFRIAMIENTO)
    + reporte_resumen(),
)

PREGUNTAS["P06_estres_tarifas_vs_seleccion"] = plan(
    "P06 · Estrés: costo de /api/tarifas frente a /api/seleccion",
    "¿Cuál cuesta más con la misma carga? El mismo usuario hace ambas peticiones en cada ciclo, así reciben exactamente la misma carga. "
    "50 hilos, subida 10 s, 120 s, temporizador 500-1500 ms: unas 100 conexiones/s, por debajo del techo del generador "
    "(~136/s en este Windows), para que todas las muestras sean válidas y el costo sea comparable.",
    base()
    + grupo_hilos("Misma carga", 50, 10,
                  peticion("Tarifas (solo lectura)", "GET", "/api/tarifas")
                  + peticion("Seleccion (crea reserva)", "POST", "/api/seleccion",
                             '{"tarifa":"${tarifa}","cantidad":${cantidad}}', cabeceras() + temporizador()),
                  duracion=120)
    + reporte_resumen(),
)

PREGUNTAS["P07_concurrencia_500_reservas"] = plan(
    "P07 · Concurrencia: 500 reservas al mismo tiempo",
    "¿Todas las respuestas son exitosas? 500 hilos, subida 0 s, bucle 1; el Temporizador Sincronizado libera las 500 selecciones a la vez.",
    base()
    + grupo_hilos("500 a la vez", 500, 0, flujo("500 a la vez", con_tarifas=False, timer=False, sync=500), bucles=1)
    + reporte_resumen(),
)

PREGUNTAS["P08_concurrencia_sincronizado_vs_distribuido"] = plan(
    "P08 · Concurrencia: sincronizados frente a distribuidos",
    "Cambia SOLO cómo llegan: 200 hilos liberados juntos por el Temporizador Sincronizado, frente a 200 hilos distribuidos en 20 s. Bucle 1.",
    base()
    + grupo_hilos("Sincronizados", 200, 0, flujo("sincronizados", con_tarifas=False, timer=False, sync=200), bucles=1)
    + grupo_hilos("Distribuidos", 200, 20, flujo("distribuidos", con_tarifas=False, timer=False), bucles=1, retardo=ENFRIAMIENTO)
    + reporte_resumen(),
)

PREGUNTAS["P09_concurrencia_total_cobrado"] = plan(
    "P09 · Concurrencia: total cobrado = precio × cantidad",
    "El CSV trae el total esperado de cada fila (precio × cantidad). Una JSON Assertion compara $.total de la selección y del pago contra ${total_esperado}. Grupo 1: control con un CSV que trae un total alterado a propósito, para comprobar que la aserción sí detecta la diferencia. Grupo 2: carga de 300 usuarios sin pausas.",
    http_defaults() + cookies()
    + grupo_hilos("Control con total alterado", 4, 0,
                  csv("datos-total-alterado.csv", "tarifa,cantidad,total_esperado", "CSV con un total alterado")
                  + flujo("control", con_tarifas=False, timer=False, validar_total=True), bucles=1)
    + grupo_hilos("Bajo carga", 300, 10,
                  csv("datos-con-total.csv", "tarifa,cantidad,total_esperado")
                  + flujo("bajo carga", timer=False, validar_total=True), duracion=60, retardo=ENFRIAMIENTO)
    + reporte_resumen(),
)

PREGUNTAS["P10_recursos_500_usuarios"] = plan(
    "P10 · Recursos: CPU y memoria con 500 usuarios",
    "Línea base de 20 usuarios (60 s) y luego 500 usuarios (120 s, subida 30 s), con temporizador 500-1500 ms. CPU y memoria se registran con los contadores de Windows mientras corre.",
    base()
    + grupo_hilos("Base 20 usuarios", 20, 10, flujo("020 usuarios"), duracion=60)
    + grupo_hilos("500 usuarios", 500, 30, flujo("500 usuarios"), duracion=120, retardo=ENFRIAMIENTO)
    + reporte_resumen(),
)


if __name__ == "__main__":
    DESTINO.mkdir(parents=True, exist_ok=True)
    for nombre, xml in PREGUNTAS.items():
        (DESTINO / f"{nombre}.jmx").write_text(xml, encoding="utf-8")
        print("generado", nombre)
