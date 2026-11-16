"""Textos del documento de entrega. Cada cifra sale de resultados/<pregunta>/ejecucion-N/."""

ENTORNO = {
    "portada": [
        "**Estudiante:** Santiago Cárdenas Montes",
        "**Curso:** Pruebas de software · Taller de rendimiento · Experimentación local",
        "**Universidad Icesi** · noviembre de 2026",
        "**Repositorio del ejercicio y de los planes:** github.com/Santiago-Cardenas/Taller_jmeter",
        "**Repositorio de esta experimentación:** github.com/Santiago-Cardenas/Taller_Experimentacion",
    ],
    "so": "Windows 11 Pro (compilación 26300) · 16.384 puertos TCP dinámicos (49152-65535)",
    "fecha": "16 de noviembre de 2026",
}

METODO = [
    "**Cómo medí.** Cada pregunta tiene su propio plan (P01 a P10). Cuando la pregunta compara variantes, cada variante es "
    "un Grupo de Hilos del mismo plan y el plan se ejecuta con «Lanza cada Grupo de Hilos separadamente», así las variantes "
    "corren una después de la otra y nunca a la vez. Cada petición lleva la variante entre corchetes (por ejemplo "
    "«Pago [500 usuarios]»), para que el reporte las compare lado a lado. Todas las mediciones se hicieron en modo no-GUI "
    "(jmeter -n ... -e -o reporte); la interfaz gráfica la usé solo para construir y revisar los escenarios.",
    "**Una variable por ejecución.** Entre una variante y la siguiente solo cambia lo que la pregunta pide (usuarios, subida, "
    "temporizador o duración). Antes de cada pregunta reinicié la API (sus datos viven en memoria) y esperé a que Windows "
    "liberara los puertos de la prueba anterior; dentro de cada plan, la segunda variante arranca con un «Retardo de arranque» "
    "de 150 s por la misma razón (ver sección 2).",
    "**Hardware.** En lugar de PerfMon con ServerAgent registré CPU y memoria con los contadores de rendimiento de Windows "
    "(clases WMI), cada segundo aproximadamente: CPU del equipo completo y CPU y memoria privada del proceso de la API (python) "
    "y del proceso de JMeter (java), identificados por su PID. Lo hice así para no depender de los plugins jpgc ni del "
    "ServerAgent, que usa la librería SIGAR y puede no arrancar en sistemas modernos.",
    "**Repetición.** Repetí las preguntas P01, P04, P07, P08 y P09 (ejecución 2): los resultados coinciden con la ejecución 1 "
    "y se muestran en cada pregunta. La primera corrida completa la guardé aparte como «ejecución exploratoria»: allí descubrí "
    "el límite de la sección 2, que contaminaba unas variantes con otras, y por eso corregí el método antes de medir.",
    "**Dos columnas que agregué.** JMeter cuenta las peticiones fallidas en el Rendimiento, y una petición que falla al "
    "conectar tarda 0 ms: eso infla el throughput y baja la Media justo cuando el sistema está peor. Por eso, además de las "
    "columnas del reporte (Muestras, Media, p95, Máx, % Error, Rendimiento), calculé **Exitosas/s** (peticiones exitosas por "
    "segundo) y **Media exitosas** (tiempo medio solo de las exitosas) a partir del .jtl.",
]

HALLAZGO = {
    "parrafos": [
        "En casi todas las preguntas con muchos usuarios aparecieron errores masivos. El 90 % o más son "
        "**java.net.BindException: Address already in use: connect**: el equipo que genera la carga se quedó sin puertos para "
        "abrir conexiones. No es la API la que falla: su CPU nunca pasó del 8 % y su memoria se mantuvo cerca de 11 MB.",
        "**Por qué pasa.** La API usa el servidor HTTP de la biblioteca estándar de Python, que responde con HTTP/1.0 y cierra la "
        "conexión después de cada respuesta. Entonces JMeter abre una conexión TCP nueva por cada petición, y cada conexión "
        "cerrada deja su puerto ocupado en estado TIME_WAIT unos 120 s. Windows tiene 16.384 puertos dinámicos, así que este "
        "equipo puede abrir como máximo unas 16.384 conexiones por ventana: **~273 por segundo durante 60 s** si arranca con "
        "todos los puertos libres, y **~136 por segundo sostenidas** (16.384 ÷ 120 s). Por encima de eso, las peticiones "
        "fallan antes de salir del equipo.",
        "Los datos lo confirman con precisión:",
    ],
    "tabla_enc": ["Medición", "Exitosas/s", "% Error", "Lectura"],
    "tabla": [
        ["P04 · escalón de 50 usuarios (60 s)", "136,9", "0,00 %", "Por debajo del techo: todo responde"],
        ["P04 · escalón de 100 usuarios (60 s)", "272,8", "0,05 %", "Justo en el techo de 60 s (16.384 ÷ 60 = 273)"],
        ["P04 · escalón de 250 usuarios (60 s)", "279,7", "58,79 %", "El techo no se mueve; sobran errores"],
        ["P04 · escalón de 500 usuarios (60 s)", "265,3", "80,17 %", "Igual: el techo es del generador"],
        ["P10 · 500 usuarios durante 120 s", "135,8", "89,33 %", "Techo sostenido: 16.384 ÷ 120 s = 136,5"],
    ],
    "cierre": [
        "Esto es lo que la guía advierte en sus límites: «un solo equipo genera la carga; si ese equipo se queda sin recursos, "
        "los resultados reflejan al generador, no a la API». Aquí el recurso agotado no fue CPU ni memoria, sino los puertos "
        "del sistema operativo. Lo tengo en cuenta en cada respuesta: separo lo que dice de la API de lo que dice del "
        "generador.",
        "Un segundo límite aparece cuando muchas conexiones llegan en el mismo instante: el servidor de Python acepta solo "
        "5 conexiones en espera (request_queue_size = 5) y Windows rechaza el resto con **Connection refused**. Ese límite sí "
        "es de la API, y explica las preguntas de concurrencia (P07 y P08).",
    ],
}

TIMER = "Aleatorio uniforme 500-1500 ms (en Selección)"

PREGUNTAS = [
    {
        "carpeta": "P01_carga_20_vs_500_usuarios",
        "titulo": "Carga: de 20 a 500 usuarios",
        "pregunta": "¿Qué pasaría si subo de 20 a 500 usuarios? ¿Cambia el throughput, el tiempo de respuesta o ambos?",
        "variable": "Cambia solo el número de hilos (20 → 500). Se mantienen la subida (10 s), la duración (60 s), el "
                    "temporizador y el flujo completo Tarifas → Selección → Pago.",
        "metrica": "Rendimiento y Exitosas/s para el throughput; Media y Media exitosas para el tiempo de respuesta; % Error.",
        "escenario": [
            ["20 usuarios", 20, "10 s", "60 s", TIMER, "—"],
            ["500 usuarios", 500, "10 s", "60 s", TIMER, "150 s"],
        ],
        "gui": [("00_arbol.png", "Escenario en JMeter: plan P01 con un Grupo de Hilos por variante"),
                ("nodo_5.png", "Grupo de Hilos «500 usuarios»: 500 hilos, subida 10 s, 60 s, retardo de arranque 150 s")],
        "resultados": [
            "Con 20 usuarios la API respondió todo en 1,2 ms de media y sin errores. El throughput (54,9/s) lo fija el "
            "temporizador: cada usuario hace 3 peticiones por ciclo de ~1 s, así que 20 usuarios generan ~57 peticiones/s.",
            "Con 500 usuarios el Rendimiento del reporte subió a 1.332,8/s, pero el 80,08 % fueron errores de conexión del "
            "generador. Las peticiones exitosas fueron 265,5/s: crecieron unas 5 veces, no 25. La Media exitosa pasó de 1,2 "
            "a 2,6 ms y el p95 general llegó a 18 ms.",
        ],
        "imagenes": [("capturas/01_estadisticas.png", "Reporte HTML de JMeter: estadísticas por petición y variante"),
                     ("graficas/tiempo_throughput_hilos.png",
                      "Tiempo de respuesta, throughput (exitosas y fallidas) e hilos activos en el tiempo")],
        "repeticion": ["La ejecución 2 dio lo mismo: 80,05 % de error y 265,6 exitosas/s con 500 usuarios."],
        "respuesta": [
            "Cambian **ambos**. El tiempo de respuesta de las peticiones exitosas se duplicó (1,2 → 2,6 ms) y el throughput "
            "subió, pero mucho menos que los usuarios: 25 veces más usuarios dieron solo 5 veces más peticiones exitosas "
            "(54,9 → 265,5/s). Lo que frenó el crecimiento no fue la API sino el equipo que genera la carga: 500 usuarios "
            "necesitan ~1.400 conexiones nuevas por segundo y este Windows solo puede abrir ~273/s (sección 2), así que 4 de "
            "cada 5 peticiones fallaron antes de llegar a la API. Mirar solo el Rendimiento del reporte (1.332,8/s) habría "
            "llevado a una conclusión falsa.",
        ],
        "limitacion": [
            "No pude medir cómo responde la API a 500 usuarios reales: el generador se saturó primero. Para medirlo haría "
            "falta generar la carga desde otro equipo (o desde varios), o que la API reutilice conexiones (HTTP/1.1 "
            "keep-alive).",
        ],
    },
    {
        "carpeta": "P02_carga_rampup_1_vs_60",
        "titulo": "Carga: ramp-up de 1 s frente a 60 s",
        "pregunta": "¿Qué pasaría si el ramp-up pasa de 1 segundo a 60 segundos? ¿Cambia el pico inicial del reporte?",
        "variable": "Cambia solo el periodo de subida (1 s → 60 s). Se mantienen 300 hilos, 90 s de duración y el temporizador.",
        "metrica": "Máx y tiempo de respuesta en los primeros segundos (pico inicial); hilos activos; % Error en el tiempo.",
        "escenario": [
            ["Subida 1 s", 300, "1 s", "90 s", TIMER, "—"],
            ["Subida 60 s", 300, "60 s", "90 s", TIMER, "150 s"],
        ],
        "gui": [("nodo_4.png", "Grupo de Hilos «Subida 1 s»: los 300 usuarios entran en 1 segundo"),
                ("nodo_5.png", "Grupo de Hilos «Subida 60 s»: entran 5 usuarios por segundo")],
        "resultados": ["Comparo los primeros segundos de cada variante, que es donde está el pico inicial:"],
        "tabla_extra": (["Ventana", "Subida 1 s: hilos · máx · error", "Subida 60 s: hilos · máx · error"], [
            ["0-5 s", "300 · 102 ms · 5,3 %", "25 · 3 ms · 0,0 %"],
            ["5-15 s", "300 · 9 ms · 6,1 %", "75 · 3 ms · 0,0 %"],
            ["15-30 s", "300 · 21 ms · 65,3 %", "150 · 5 ms · 0,4 %"],
            ["30-60 s", "300 · 26 ms · 100 %", "300 · 24 ms · 41,8 %"],
        ], [3.0, 7.0, 7.0]),
        "imagenes": [("capturas/03_tiempo_respuesta.png",
                      "Reporte HTML, tiempo de respuesta medio por segundo: a la izquierda subida 1 s (pico de 34 ms al "
                      "inicio), a la derecha subida 60 s (sin pico, crece de forma gradual)"),
                     ("graficas/tiempo_throughput_hilos.png", "Throughput e hilos activos de ambas variantes")],
        "respuesta": [
            "**Sí, el pico inicial desaparece.** Con subida de 1 s los 300 usuarios arrancan juntos: en los primeros 5 s el "
            "tiempo máximo llegó a 102 ms (la media normal es ~2 ms) y la media por segundo tuvo un pico de 34 ms. Con subida "
            "de 60 s entran 5 usuarios por segundo y en los primeros 5 s el máximo fue 3 ms: no hay pico, la carga crece de "
            "forma gradual. El Máx total bajó de 102 a 25 ms.",
            "También cambia cuándo se agota el generador: con 1 s los puertos se acabaron a los ~15 s (65 % de error entre 15 "
            "y 30 s); con 60 s llegó más tarde (0,4 % de error hasta los 30 s). Un ramp-up muy corto mezcla el efecto del "
            "arranque con el de la carga, y por eso la guía recomienda una subida gradual.",
        ],
        "limitacion": [
            "Con 300 usuarios ambas variantes terminan superando el techo de conexiones del generador, así que la segunda "
            "mitad de la prueba mide al generador. La comparación válida es la del inicio, que es justo lo que pregunta.",
        ],
    },
    {
        "carpeta": "P03_carga_sin_temporizadores",
        "titulo": "Carga: quitar los temporizadores",
        "pregunta": "¿Qué pasaría si quito los temporizadores? ¿Cuánto sube el throughput y qué significa eso para la prueba?",
        "variable": "Cambia solo el temporizador: en la segunda variante se eliminó el Temporizador Aleatorio Uniforme. Se "
                    "mantienen 200 hilos, subida de 10 s y 60 s.",
        "metrica": "Rendimiento (throughput bruto), Exitosas/s, Media exitosas y tipo de error.",
        "escenario": [
            ["Con temporizador", 200, "10 s", "60 s", TIMER, "—"],
            ["Sin temporizador", 200, "10 s", "60 s", "Ninguno", "150 s"],
        ],
        "gui": [("nodo_4-2-3.png", "Temporizador Aleatorio Uniforme del grupo «Con temporizador» (500 ms + hasta 1000 ms); "
                                   "el grupo «Sin temporizador» no lo tiene")],
        "resultados": [
            "El throughput bruto subió de 542,0/s a 3.930,3/s: **7,3 veces más**. Pero las peticiones exitosas bajaron de "
            "305,6/s a 226,3/s, el error subió de 43,6 % a 94,2 % y la Media exitosa pasó de 1,8 a 13,2 ms (p95 de 205 ms).",
            "El tipo de error también cambió: con temporizador casi todo fue BindException (13.947, falta de puertos); sin "
            "temporizador dominó **Connection refused** (188.673): los hilos sin pausa llenan la cola de 5 conexiones del "
            "servidor de Python y Windows rechaza el resto.",
        ],
        "imagenes": [("capturas/01_estadisticas.png", "Reporte HTML: estadísticas con y sin temporizador"),
                     ("graficas/tiempo_throughput_hilos.png", "Throughput exitoso y fallido con y sin temporizador")],
        "respuesta": [
            "El throughput **sube unas 7 veces en el reporte**, pero es un número engañoso: casi todo son fallos instantáneos. "
            "El trabajo útil (exitosas/s) bajó un 26 % y cada petición exitosa tardó 7 veces más.",
            "Para la prueba significa que deja de simular usuarios: un usuario real lee, elige y piensa entre clics, y eso es "
            "lo que representa el temporizador. Sin él, 200 hilos se convierten en una ráfaga continua de conexiones que mide "
            "los límites del generador y de la cola de conexiones de la API, no la experiencia de un usuario. Quitar los "
            "temporizadores sirve para buscar un máximo teórico, no para una prueba de carga.",
        ],
        "limitacion": [
            "Con 200 usuarios incluso la variante con temporizador superó el techo de puertos del generador (43,6 % de error), "
            "así que ninguna de las dos mide a la API sin interferencia. La diferencia entre variantes sí es válida porque "
            "ambas corrieron con los puertos libres al empezar.",
        ],
    },
    {
        "carpeta": "P04_estres_escalones",
        "titulo": "Estrés: escalones de 50, 100, 250 y 500 usuarios",
        "pregunta": "¿Qué pasaría si escalono de 50 a 100, 250 y 500 usuarios? ¿En qué punto deja de crecer el throughput?",
        "variable": "Cambia solo el número de usuarios de cada escalón. Cada escalón dura 60 s con subida de 10 s y el mismo "
                    "temporizador; entre escalones hay 150 s de pausa para que cada uno arranque con los puertos libres.",
        "metrica": "Exitosas/s por escalón (dónde se aplana) y % Error.",
        "escenario": [
            ["Escalón 50 usuarios", 50, "10 s", "60 s", TIMER, "—"],
            ["Escalón 100 usuarios", 100, "10 s", "60 s", TIMER, "150 s"],
            ["Escalón 250 usuarios", 250, "10 s", "60 s", TIMER, "150 s"],
            ["Escalón 500 usuarios", 500, "10 s", "60 s", TIMER, "150 s"],
        ],
        "gui": [("00_arbol.png", "Plan P04: un Grupo de Hilos estándar por escalón, ejecutados uno tras otro"),
                ("nodo_7.png", "Escalón de 500 usuarios: 500 hilos, 60 s, retardo de arranque 150 s")],
        "resultados": [
            "Las peticiones exitosas por segundo fueron 136,9 → 272,8 → 279,7 → 265,3. Se duplicaron de 50 a 100 usuarios y "
            "después **se aplanaron en ~270/s**, mientras el error saltaba de 0,05 % a 58,8 % y 80,2 %. En la gráfica se ve "
            "cómo funciona: con 250 y 500 usuarios hay una ráfaga de exitosas de 15 a 25 s y luego todo falla, cuando se "
            "acaban los puertos.",
        ],
        "imagenes": [("graficas/tiempo_throughput_hilos.png",
                      "Los cuatro escalones: la línea continua (exitosas) se aplana desde 100 usuarios; la punteada (fallidas) crece"),
                     ("capturas/01_estadisticas.png", "Reporte HTML: estadísticas por escalón")],
        "repeticion": ["La ejecución 2 dio el mismo techo: 136,3 → 270,3 → 266,1 → 265,5 exitosas/s."],
        "respuesta": [
            "El throughput deja de crecer **entre 100 y 250 usuarios, en ~270 peticiones exitosas por segundo**. Ese número "
            "es exactamente 16.384 puertos ÷ 60 s: es el techo del equipo generador, no el de la API, cuya CPU nunca pasó del "
            "8 %. Desde ese punto, agregar usuarios solo agrega errores, y el Rendimiento del reporte sigue «creciendo» "
            "(678,7 y 1.338,2/s) porque cuenta los fallos instantáneos. La señal de saturación es justamente esa: el "
            "throughput útil se estanca mientras los usuarios suben.",
        ],
        "limitacion": [
            "No usé el Ultimate Thread Group porque no instalé los plugins jpgc; usé Grupos de Hilos estándar en serie. Al "
            "darle a cada escalón 150 s de pausa, mido el techo de 60 s con puertos libres (~273/s); en una rampa continua, "
            "sin pausas, el techo sostenido sería ~136/s (ver P10).",
        ],
    },
    {
        "carpeta": "P05_estres_duracion_1_vs_10_min",
        "titulo": "Estrés: 10 minutos en lugar de 1",
        "pregunta": "¿Qué pasaría si la prueba dura 10 minutos en lugar de 1? ¿El tiempo de respuesta se mantiene o sube con el tiempo?",
        "variable": "Cambia solo la duración (60 s → 600 s). Se mantienen 100 hilos, subida de 10 s y el temporizador.",
        "metrica": "Media exitosa minuto a minuto (tendencia), % Error en el tiempo y memoria de la API.",
        "escenario": [
            ["Duración 1 min", 100, "10 s", "60 s", TIMER, "—"],
            ["Duración 10 min", 100, "10 s", "600 s", TIMER, "150 s"],
        ],
        "gui": [("nodo_5.png", "Grupo de Hilos «Duración 10 min»: 100 hilos con planificador de 600 s")],
        "resultados": [
            "En 1 minuto: 271,2 exitosas/s, 0,18 % de error y Media exitosa de 1,37 ms. Durante los 10 minutos:",
        ],
        "tabla_extra": (["Minuto", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"], [
            ["Media exitosa (ms)", "1,37", "1,99", "1,59", "1,52", "1,55", "1,56", "1,59", "1,60", "1,57", "1,52"],
            ["Exitosas/s", "272,9", "78,6", "266,3", "90,3", "266,0", "93,8", "261,6", "96,5", "261,2", "99,5"],
            ["% Error", "0,1", "73,5", "10,5", "69,5", "10,0", "68,5", "12,1", "67,4", "11,9", "66,6"],
            ["Memoria API (MB)", "11,0", "11,1", "11,1", "11,1", "11,1", "11,1", "11,2", "11,2", "11,2", "11,2"],
        ], [3.3, 1.35, 1.35, 1.35, 1.35, 1.35, 1.35, 1.35, 1.35, 1.35, 1.35]),
        "imagenes": [("graficas/tiempo_throughput_hilos.png",
                      "1 minuto frente a 10 minutos: el tiempo de respuesta es plano; exitosas y fallidas se alternan en ciclos de 2 min"),
                     ("graficas/cpu_memoria.png", "CPU y memoria durante la prueba: la memoria de la API no crece")],
        "respuesta": [
            "**El tiempo de respuesta se mantiene**: la Media de las peticiones exitosas estuvo entre 1,4 y 2,0 ms durante "
            "los 10 minutos, sin tendencia a subir (el minuto 10 dio 1,52 ms, casi igual que el 1), y la memoria de la API se "
            "quedó en 11,0-11,2 MB. No hay degradación ni acumulación en la API (cada pago consume su reserva).",
            "Pero la prueba larga mostró algo que la de 1 minuto escondía: desde el minuto 2 el error alterna minuto a "
            "minuto entre ~70 % y ~10 %, en ciclos de 2 minutos. 100 usuarios piden ~272 conexiones/s, el doble de las ~136/s "
            "sostenidas del generador: el primer minuto usa los 16.384 puertos libres, en el segundo casi no quedan, y en el "
            "tercero Windows libera los que cumplieron 120 s en TIME_WAIT, y así sucesivamente. Con solo 1 minuto habría "
            "concluido «0 % de error», que es falso para una carga sostenida.",
        ],
        "limitacion": [
            "Los errores del minuto 2 en adelante son del generador, no de la API. Además, 10 minutos es poco para detectar "
            "fugas lentas de memoria: una prueba de duración real suele durar horas.",
        ],
    },
    {
        "carpeta": "P06_estres_tarifas_vs_seleccion",
        "titulo": "Estrés: costo de /api/tarifas frente a /api/seleccion",
        "pregunta": "¿Qué pasaría si mido /api/tarifas (solo lectura) y /api/seleccion (crea reservas) con la misma carga? ¿Cuál cuesta más?",
        "variable": "Las dos peticiones las hace el mismo usuario en el mismo ciclo, así que reciben exactamente la misma "
                    "carga: 50 hilos, subida de 10 s, 120 s y temporizador (~100 conexiones/s, por debajo del techo del "
                    "generador, para que todas las muestras sean válidas).",
        "metrica": "Costo = Media de cada petición en ms (también mediana, p95 y p99).",
        "tabla": "etiquetas",
        "escenario": [["Misma carga", 50, "10 s", "120 s", TIMER, "—"]],
        "gui": [("00_arbol.png", "Plan P06: Tarifas (GET) y Selección (POST) dentro del mismo Grupo de Hilos")],
        "resultados": [
            "Con 0 % de error en ambas: Tarifas tuvo Media de **1,3 ms** (mediana 1, p99 3 ms) y Selección **2,0 ms** (mediana "
            "2, p99 5 ms), con el mismo rendimiento (47,9/s cada una). Selección cuesta ~0,7 ms más, un 60 %, aunque devuelve "
            "menos datos (275 bytes frente a 472). La memoria de la API subió de 11,0 a 13,3 MB porque este plan crea "
            "reservas que nunca paga: quedan guardadas en memoria (5.688 reservas).",
        ],
        "imagenes": [("capturas/01_estadisticas.png", "Reporte HTML: estadísticas de Tarifas y Selección con la misma carga")],
        "respuesta": [
            "**Cuesta más /api/seleccion**: 2,0 ms frente a 1,3 ms de media, y lo mismo en mediana y p99. Tarifas solo "
            "serializa una lista fija; Selección tiene que leer y validar el cuerpo JSON, generar un identificador (uuid4), "
            "tomar un candado (lock) y escribir la reserva en memoria. Escribir es más caro que leer, y además deja estado: "
            "las reservas no pagadas hacen crecer la memoria.",
            "En una ejecución exploratoria lo medí sin temporizador y con 200 usuarios: ahí ambas daban ~12 ms con 94 % de "
            "error y no se distinguían. Por eso repetí la medición por debajo del techo del generador.",
        ],
        "limitacion": [
            "La diferencia es de menos de 1 ms y JMeter mide en milisegundos enteros, así que la comparo con miles de "
            "muestras y con varios percentiles, no con un solo valor. Con una API real (base de datos, red) la diferencia "
            "sería mucho mayor.",
        ],
    },
    {
        "carpeta": "P07_concurrencia_500_reservas",
        "titulo": "Concurrencia: 500 reservas al mismo tiempo",
        "pregunta": "¿Qué pasaría si 500 usuarios crean reservas al mismo tiempo? ¿Todas las respuestas son exitosas?",
        "variable": "500 hilos con subida 0 y bucle 1. Un Temporizador Sincronizado en Selección espera a que estén los 500 y "
                    "los libera juntos; luego cada uno paga su reserva.",
        "metrica": "% Error y tipo de error; selecciones exitosas de 500.",
        "escenario": [["500 a la vez", 500, "0 s", "bucle 1", "Sincronizado: agrupa 500, espera máx. 60 s", "—"]],
        "gui": [("00_arbol.png", "Plan P07: el Temporizador Sincronizado está dentro de la Selección"),
                ("nodo_4-1-3.png", "Temporizador Sincronizado: agrupa 500 usuarios simulados")],
        "resultados": [
            "**Solo 8 de 500 selecciones fueron exitosas (1,6 %)** y solo 1 pago. 912 de los 1.000 errores fueron "
            "**Connection refused**: la conexión ni siquiera se abrió. Los otros 79 son pagos que fallaron con 404 porque su "
            "reserva nunca se creó (el extractor dejó num_reserva_not_found). Las 8 selecciones que entraron tardaron 96,7 ms "
            "de media (máximo 224 ms), cuando normalmente tardan 2 ms.",
        ],
        "imagenes": [("capturas/02_errores.png", "Reporte HTML: tipos de error"),
                     ("capturas/01_estadisticas.png", "Reporte HTML: estadísticas de la ráfaga de 500")],
        "repeticion": ["La ejecución 2 dio 9 de 500 selecciones exitosas y 0 pagos: el resultado se repite."],
        "respuesta": [
            "**No. Casi todas fallan: el 98 % de las reservas fueron rechazadas.** El motivo no es la CPU ni la lógica de la "
            "API, sino cómo recibe conexiones: el servidor HTTP de Python (ThreadingHTTPServer) tiene una cola de solo 5 "
            "conexiones pendientes (request_queue_size = 5). Cuando llegan 500 en el mismo instante, Windows acepta las que "
            "caben y rechaza el resto al momento. Además, los errores se propagan en el flujo: si la reserva no se crea, el "
            "pago también falla.",
            "Para un evento real (la venta de boletas abre a una hora exacta), esto significa que la API necesita una cola "
            "de admisión más grande o una cola virtual delante, como la que modela el simulador de la clase.",
        ],
        "limitacion": [
            "El rechazo inmediato es como lo maneja Windows; en Linux las conexiones que no caben en la cola suelen esperar "
            "y reintentarse, así que el % de error podría ser distinto en otro sistema operativo. No lo probé.",
        ],
    },
    {
        "carpeta": "P08_concurrencia_sincronizado_vs_distribuido",
        "titulo": "Concurrencia: sincronizados frente a distribuidos",
        "pregunta": "¿Qué pasaría si los usuarios disparan a la vez con el Temporizador Sincronizado, frente a cuando llegan distribuidos?",
        "variable": "Cambia solo cómo llegan los mismos 200 usuarios: todos juntos (Temporizador Sincronizado, subida 0 s) "
                    "o repartidos en 20 s (10 por segundo, sin sincronizar). Bucle 1 en ambos.",
        "metrica": "% Error y Media/Máx de la Selección.",
        "escenario": [
            ["Sincronizados", 200, "0 s", "bucle 1", "Sincronizado: agrupa 200", "—"],
            ["Distribuidos", 200, "20 s", "bucle 1", "Ninguno", "150 s"],
        ],
        "gui": [("nodo_4-1-3.png", "Temporizador Sincronizado del grupo «Sincronizados»: agrupa 200 usuarios"),
                ("nodo_5.png", "Grupo «Distribuidos»: 200 hilos repartidos en 20 s")],
        "resultados": [
            "Sincronizados: **8 de 200 selecciones exitosas (4 %)**, Media de 53,6 ms y máximo de 99 ms en las que entraron. "
            "Distribuidos: **200 de 200 exitosas**, Media de 1,6 ms y máximo de 4 ms, con 0 % de error.",
        ],
        "imagenes": [("capturas/01_estadisticas.png", "Reporte HTML: la misma cantidad de usuarios con resultados opuestos")],
        "repeticion": ["En la ejecución 2: sincronizados, 8 de 200 selecciones exitosas; distribuidos, 200 de 200."],
        "respuesta": [
            "Con la misma cantidad de usuarios el resultado es opuesto: **distribuidos, todo funciona en 1,6 ms; "
            "sincronizados, el 96 % de las reservas se rechaza**. Lo que rompe a la API no es cuántos usuarios hay, sino "
            "cuántos llegan en el mismo instante: 10 por segundo caben de sobra en su cola de 5 conexiones, 200 a la vez no.",
            "Por eso una prueba de concurrencia necesita el Temporizador Sincronizado: con usuarios distribuidos este problema "
            "nunca habría aparecido.",
        ],
        "limitacion": [
            "El Temporizador Sincronizado libera los hilos a la vez dentro de JMeter, pero la simultaneidad real en la red "
            "depende de cómo el sistema operativo agenda los hilos. Igual que en P07, el rechazo inmediato depende de Windows.",
        ],
    },
    {
        "carpeta": "P09_concurrencia_total_cobrado",
        "titulo": "Concurrencia: total cobrado = precio × cantidad",
        "pregunta": "¿Qué pasaría si el total cobrado no coincide con precio × cantidad bajo carga? ¿Cómo lo validarías con el CSV?",
        "variable": "Agregué al CSV una tercera columna, total_esperado = precio × cantidad (con los precios de /api/tarifas). "
                    "Una JSON Assertion compara $.total de la Selección y del Pago con ${total_esperado}. Grupo 1, de "
                    "control: un CSV con un total alterado a propósito (vip × 2 = 600.000, cuando lo correcto es 700.000). "
                    "Grupo 2: 300 usuarios sin pausas durante 60 s.",
        "metrica": "Fallos de la aserción del total (respuestas HTTP correctas cuyo total no coincide).",
        "escenario": [
            ["Control con total alterado", 4, "0 s", "bucle 1", "Ninguno", "—"],
            ["Bajo carga", 300, "10 s", "60 s", "Ninguno", "150 s"],
        ],
        "gui": [("nodo_3-1.png", "CSV del grupo de control: variables tarifa, cantidad y total_esperado"),
                ("nodo_3-2-3.png", "JSON Assertion: $.total debe ser igual a ${total_esperado}")],
        "resultados": [
            "**Control:** la aserción detectó la fila alterada: «Value in json path '$.total' expected to be '600000', but "
            "found '700000'». Fallaron exactamente esa selección y su pago (2 de 8 muestras, 25 % de error).",
            "**Bajo carga:** de las 16.988 respuestas HTTP correctas (201 y 200), **0 tuvieron un total distinto de precio × "
            "cantidad**. Los demás errores son de conexión (203.533 rechazadas y 37.490 sin puerto) y 3.721 pagos con 404 "
            "porque su selección no se creó.",
        ],
        "imagenes": [("capturas/02_errores.png", "Reporte HTML: tipos de error; ninguno es de la aserción del total bajo carga")],
        "repeticion": ["En la ejecución 2: el control volvió a detectar el total alterado y, bajo carga, 15.772 respuestas "
                       "correctas tuvieron 0 totales incorrectos."],
        "respuesta": [
            "Lo validaría como lo hice: **el CSV trae el resultado esperado de cada compra** (total_esperado = precio × "
            "cantidad) y **una JSON Assertion compara el total que devuelve la API con ese valor**, en la selección y en el "
            "pago. Si el total no coincide, la muestra queda fallida con un mensaje que dice qué se esperaba y qué llegó, el "
            "% Error sube en el reporte y, en el pipeline, el paso que revisa el .jtl lo deja en rojo. El grupo de control "
            "demuestra que la aserción sí detecta la diferencia.",
            "En esta API el total nunca se descuadró bajo carga: lo calcula dentro de la misma petición (precio × cantidad) y "
            "la escritura de la reserva está protegida con un candado, así que no hay condiciones de carrera.",
        ],
        "limitacion": [
            "Solo pude validar las respuestas que llegaron (16.988 de 261.732 muestras); el resto falló por conexión. Además, "
            "los totales esperados los calculé con los precios actuales: si cambian, hay que actualizar el CSV (o extraer los "
            "precios de /api/tarifas durante la prueba).",
        ],
    },
    {
        "carpeta": "P10_recursos_500_usuarios",
        "titulo": "Recursos: CPU y memoria con 500 usuarios",
        "pregunta": "¿Qué pasaría si subo a 500 usuarios? ¿Cómo se comportan la memoria y la CPU durante la prueba? ¿Llegan a "
                    "saturarse? ¿Cuánto cambia el tiempo de respuesta cuando eso pasa?",
        "variable": "Línea base de 20 usuarios (60 s) y luego 500 usuarios (subida de 30 s, 120 s), con el mismo temporizador. "
                    "CPU y memoria se registraron con los contadores de Windows durante toda la prueba.",
        "metrica": "CPU (% del equipo) y memoria por proceso (hardware); Media exitosa y % Error (rendimiento).",
        "escenario": [
            ["Base 20 usuarios", 20, "10 s", "60 s", TIMER, "—"],
            ["500 usuarios", 500, "30 s", "120 s", TIMER, "150 s"],
        ],
        "gui": [("nodo_5.png", "Grupo de Hilos «500 usuarios»: subida 30 s, 120 s, retardo de arranque 150 s")],
        "resultados": ["Hardware y rendimiento, leídos juntos:"],
        "tabla_extra": (["Medición", "Base 20 usuarios", "500 usuarios"], [
            ["CPU del equipo (media · máx)", "16,5 % · 43 %", "26,3 % · 50 %"],
            ["CPU de la API (media · máx)", "0,2 % · 1,0 %", "0,4 % · 7,7 %"],
            ["CPU de JMeter (media · máx)", "0,5 % · 2,9 %", "11,1 % · 29,2 %"],
            ["Memoria de la API", "11,1 MB", "11,0-11,3 MB"],
            ["Memoria de JMeter", "168-265 MB", "250-841 MB"],
            ["Memoria del equipo (máx)", "69,1 % de 31,7 GB", "70,8 % de 31,7 GB"],
            ["Media exitosa · % Error", "1,3 ms · 0 %", "2,4 ms · 89,3 %"],
            ["Primeros 30 s con 500", "—", "543,6 exitosas/s · 25,6 % de error"],
            ["De 30 s en adelante con 500", "—", "~0 exitosas/s · 100 % de error"],
        ], [5.5, 5.5, 6.0]),
        "imagenes": [("graficas/cpu_memoria.png",
                      "CPU y memoria: la API (azul) apenas usa CPU y su memoria es plana; JMeter (naranja) crece a 841 MB"),
                     ("graficas/tiempo_throughput_hilos.png", "Con 500 usuarios las exitosas caen a cero a los ~30 s")],
        "respuesta": [
            "**Ni la CPU ni la memoria se saturan.** La CPU del equipo llegó como máximo al 50 % (y ~15 puntos de eso son "
            "otros programas del equipo, como se ve en la línea base) y la API nunca usó más del 7,7 %. La memoria de la API "
            "se mantuvo plana en ~11 MB: no acumula nada porque cada pago consume su reserva. El que más memoria tomó fue "
            "JMeter: de 250 a 841 MB, por los 500 hilos.",
            "Lo que sí se saturó fue otro recurso del sistema: los puertos de red del generador. A los ~30 s de empezar con 500 "
            "usuarios se agotaron y desde ahí el 100 % de las peticiones falló. Cuando eso pasa, el tiempo de las exitosas "
            "sube de 1,3 a 2,4 ms (casi el doble), pero el efecto real no está en el tiempo sino en los errores: el 89,3 % de "
            "las peticiones nunca llegó a la API. El hardware explica el resultado justamente por lo que no muestra: la API "
            "estaba casi ociosa mientras sus clientes fallaban.",
        ],
        "limitacion": [
            "No usé PerfMon: medí con los contadores de Windows, cada ~1 s. La CPU del equipo incluye los demás programas "
            "abiertos, por eso también registré la CPU de la API y de JMeter por separado. No medí puertos ni conexiones en "
            "PerfMon; el agotamiento lo comprobé con los errores del .jtl y la configuración de Windows.",
        ],
    },
]

CONCLUSIONES = [
    "La API de Tiquetmania es muy rápida (1 a 2 ms) y estable: su tiempo de respuesta no sube con el tiempo (P05) y su "
    "memoria no crece cuando el flujo se completa (P05, P10).",
    "Su punto débil es la llegada simultánea: con una cola de solo 5 conexiones, 200 o 500 usuarios que llegan a la vez "
    "reciben rechazos inmediatos (P07, P08), mientras que los mismos usuarios distribuidos se atienden sin errores.",
    "En este equipo, el límite de casi todas las pruebas grandes fue el generador de carga: Windows solo puede abrir ~273 "
    "conexiones nuevas por segundo durante 60 s y ~136 sostenidas, porque la API cierra cada conexión (sección 2). Por eso "
    "el throughput útil se aplana en ~270/s (P04) aunque la API esté casi ociosa (P10).",
    "Leer solo el Rendimiento y la Media del reporte puede llevar a conclusiones falsas: las peticiones fallidas son "
    "instantáneas e inflan el throughput (P01, P03, P04). Hay que mirarlo junto con el % Error y con el throughput de las "
    "exitosas.",
    "Los temporizadores y el ramp-up no son detalles: quitarlos o acortarlos cambia lo que mide la prueba (P02, P03).",
    "Una aserción alimentada por el CSV convierte una regla de negocio (total = precio × cantidad) en una verificación "
    "automática bajo carga (P09).",
]

LIMITACIONES_GENERALES = [
    "La API y JMeter corrieron en el mismo computador, como pide el taller. En una prueba real la API debe ir en un equipo "
    "dedicado y la carga debe salir de otro (o de varios).",
    "El generador de carga (Windows, 16.384 puertos dinámicos, ~120 s de TIME_WAIT) limitó las pruebas de más de ~100 "
    "usuarios. Ampliar el rango de puertos o reducir el TIME_WAIT requiere cambiar la configuración del sistema como "
    "administrador, y no lo hice.",
    "En vez de PerfMon y ServerAgent usé los contadores de rendimiento de Windows. Miden lo mismo (CPU y memoria) pero no "
    "aparecen dentro de JMeter.",
    "El equipo tenía otros programas abiertos (la línea base de CPU fue ~15 %). Para reducir su efecto medí con la "
    "interfaz de JMeter cerrada, repetí cinco preguntas y separé la CPU de la API y de JMeter.",
    "Las conclusiones de concurrencia dependen de cómo Windows maneja una cola de conexiones llena; en Linux (como en el "
    "pipeline de GitHub Actions) el resultado podría ser distinto.",
]

REPRODUCIR = [
    "Los planes están en Taller_jmeter/pruebas/experimentacion/ (un .jmx por pregunta, con sus CSV) y una copia en este "
    "repositorio, en planes/. Los scripts están en scripts/.",
    "1. Ejecutar una pregunta (levanta la API, registra CPU y memoria, corre JMeter en no-GUI y guarda todo en resultados/):",
    ".\\scripts\\ejecutar_pregunta.ps1 -Pregunta P01_carga_20_vs_500_usuarios",
    "2. Ejecutar todas, esperando a que Windows libere los puertos entre preguntas:",
    ".\\scripts\\ejecutar_todas.ps1 -Repeticion 1",
    "3. Analizar una ejecución (resumen.csv, resumen_variantes.csv, por_minuto.csv y gráficas):",
    "python scripts\\analizar.py resultados\\P01_carga_20_vs_500_usuarios\\ejecucion-1",
    "Comando base de JMeter, desde la carpeta de los planes:",
    "jmeter -n -t P01_carga_20_vs_500_usuarios.jmx -l resultados.jtl -e -o reporte",
]
