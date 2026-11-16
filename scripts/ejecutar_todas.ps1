# Ejecuta las 10 preguntas en serie (una a la vez, para que no compitan por el equipo) y analiza cada una.
param([string] $Repeticion = '1', [string[]] $Solo)
$preguntas = @(
    'P01_carga_20_vs_500_usuarios',
    'P02_carga_rampup_1_vs_60',
    'P03_carga_sin_temporizadores',
    'P04_estres_escalones',
    'P05_estres_duracion_1_vs_10_min',
    'P06_estres_tarifas_vs_seleccion',
    'P07_concurrencia_500_reservas',
    'P08_concurrencia_sincronizado_vs_distribuido',
    'P09_concurrencia_total_cobrado',
    'P10_recursos_500_usuarios'
)
if ($Solo) { $preguntas = $preguntas | Where-Object { $p = $_; $Solo | Where-Object { $p -like "$_*" } } }
function Esperar-Puertos {
    # Windows retiene ~120 s cada conexión cerrada (TIME_WAIT). Se espera a que se liberen
    # para que la pregunta anterior no contamine la siguiente.
    for ($i = 0; $i -lt 60; $i++) {
        $n = (Get-NetTCPConnection -State TimeWait -ErrorAction SilentlyContinue | Measure-Object).Count
        if ($n -lt 500) { "puertos en TIME_WAIT: $n (listo)"; return }
        Start-Sleep 5
    }
    "puertos en TIME_WAIT: $n (se agotó la espera de 5 min)"
}
foreach ($p in $preguntas) {
    Esperar-Puertos
    "===== $p (ejecución $Repeticion) · $(Get-Date -Format HH:mm:ss) ====="
    & "$PSScriptRoot\ejecutar_pregunta.ps1" -Pregunta $p -Repeticion $Repeticion | Select-String -Pattern 'summary =|Err:|Listo|error' -SimpleMatch:$false | Select-Object -Last 3
    python "$PSScriptRoot\analizar.py" "$PSScriptRoot\..\resultados\$p\ejecucion-$Repeticion"
    Start-Sleep 10   # deja enfriar el equipo entre preguntas
}
"===== FIN $(Get-Date -Format HH:mm:ss) ====="
