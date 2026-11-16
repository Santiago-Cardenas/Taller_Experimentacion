# Ejecuta el plan de una pregunta en modo no-GUI, con la API recién iniciada y registro de CPU/memoria.
# Uso:  .\ejecutar_pregunta.ps1 -Pregunta P01_carga_20_vs_500_usuarios
param(
    [Parameter(Mandatory)] [string] $Pregunta,
    [string] $Repeticion = '1'
)
$ErrorActionPreference = 'Stop'

$raiz = Resolve-Path "$PSScriptRoot\.."
$planes = Join-Path $raiz 'planes'
$jmeter = if ($env:JMETER_HOME) { "$env:JMETER_HOME\bin\jmeter.bat" } else { "$env:USERPROFILE\apache-jmeter-5.6.3\bin\jmeter.bat" }
$salida = Join-Path $raiz "resultados\$Pregunta\ejecucion-$Repeticion"

if (Test-Path $salida) { Remove-Item $salida -Recurse -Force }
New-Item -ItemType Directory -Force $salida | Out-Null
$parar = Join-Path $salida '.parar'

# 1. API limpia para cada pregunta (los datos viven en memoria)
$api = Start-Process python -ArgumentList "`"$raiz\api\ticketmania_simple.py`"" -PassThru -WindowStyle Hidden
$monitor = $null
try {
    $ok = $false
    for ($i = 0; $i -lt 30; $i++) {
        try { Invoke-RestMethod http://127.0.0.1:8080/api/salud -TimeoutSec 2 | Out-Null; $ok = $true; break } catch { Start-Sleep 1 }
    }
    if (-not $ok) { throw 'La API no respondió en /api/salud' }

    # 2. Registro de CPU y memoria en paralelo
    $monitor = Start-Process powershell -ArgumentList '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', "`"$PSScriptRoot\medir_recursos.ps1`"", '-Salida', "`"$salida\recursos.csv`"", '-Parar', "`"$parar`"", '-ApiPid', $api.Id -PassThru -WindowStyle Hidden
    Start-Sleep 3   # línea base de recursos antes de la carga

    # 3. JMeter en modo no-GUI, desde la carpeta del plan (rutas relativas del CSV)
    $inicio = Get-Date
    Push-Location $planes
    & $jmeter -n -t "$Pregunta.jmx" -l "$salida\resultados.jtl" -e -o "$salida\reporte" -j "$salida\jmeter.log" '-Jjmeter.reportgenerator.overall_granularity=1000' | Tee-Object "$salida\consola.txt"
    Pop-Location
    $fin = Get-Date
    Start-Sleep 3

    @{
        pregunta = $Pregunta; repeticion = $Repeticion
        inicio = $inicio.ToString('s'); fin = $fin.ToString('s')
        duracion_s = [math]::Round(($fin - $inicio).TotalSeconds)
        equipo = (Get-CimInstance Win32_Processor).Name
        nucleos_logicos = (Get-CimInstance Win32_ComputerSystem).NumberOfLogicalProcessors
        ram_gb = [math]::Round((Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory / 1GB, 1)
        java = (cmd /c 'java -version 2>&1' | Select-Object -First 1)
        python = (cmd /c 'python --version 2>&1' | Select-Object -First 1)
    } | ConvertTo-Json | Set-Content "$salida\entorno.json" -Encoding utf8
}
finally {
    New-Item -ItemType File -Force $parar | Out-Null
    if ($monitor) { $monitor.WaitForExit(5000) | Out-Null; if (-not $monitor.HasExited) { Stop-Process -Id $monitor.Id -Force } }
    Stop-Process -Id $api.Id -Force -ErrorAction SilentlyContinue
    Remove-Item $parar -ErrorAction SilentlyContinue
}
"Listo: $salida"
