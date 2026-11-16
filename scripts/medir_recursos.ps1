# Registra CPU y memoria del equipo cada segundo mientras corre una prueba.
# Reemplaza a PerfMon/ServerAgent: usa las clases WMI de rendimiento de Windows
# (no dependen del idioma del sistema, a diferencia de Get-Counter).
# Mide el equipo completo y, por separado, el proceso de la API y el de JMeter.
# Se detiene cuando aparece el archivo indicado en -Parar.
param(
    [Parameter(Mandatory)] [string] $Salida,
    [Parameter(Mandatory)] [string] $Parar,
    [Parameter(Mandatory)] [int] $ApiPid
)

$nucleos = (Get-CimInstance Win32_ComputerSystem).NumberOfLogicalProcessors
$memTotalMB = [math]::Round((Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory / 1MB)
$jmPid = $null
"marca_ms,cpu_total_pct,mem_usada_mb,mem_usada_pct,cpu_api_pct,mem_api_mb,cpu_jmeter_pct,mem_jmeter_mb" | Set-Content $Salida -Encoding utf8

function Medir-Proceso([int] $id) {
    if (-not $id) { return @(0, 0) }
    $p = Get-CimInstance Win32_PerfFormattedData_PerfProc_Process -Filter "IDProcess=$id"
    if (-not $p) { return @(0, 0) }
    # PercentProcessorTime por proceso es por núcleo (puede pasar de 100): se normaliza al equipo completo
    return @([math]::Round($p.PercentProcessorTime / $nucleos, 1), [math]::Round($p.WorkingSetPrivate / 1MB, 1))
}

while (-not (Test-Path $Parar)) {
    if (-not $jmPid) {
        $jm = Get-CimInstance Win32_Process -Filter "Name='java.exe'" | Where-Object { $_.CommandLine -like '*ApacheJMeter*' } | Select-Object -First 1
        if ($jm) { $jmPid = $jm.ProcessId }
    }
    $marca = [DateTimeOffset]::Now.ToUnixTimeMilliseconds()
    $cpu = (Get-CimInstance Win32_PerfFormattedData_PerfOS_Processor -Filter "Name='_Total'").PercentProcessorTime
    $so = Get-CimInstance Win32_OperatingSystem
    $memUsada = [math]::Round(($so.TotalVisibleMemorySize - $so.FreePhysicalMemory) / 1KB)
    $a = Medir-Proceso $ApiPid
    $j = Medir-Proceso $jmPid
    "$marca,$cpu,$memUsada,$([math]::Round(100 * $memUsada / $memTotalMB, 1)),$($a[0]),$($a[1]),$($j[0]),$($j[1])" | Add-Content $Salida -Encoding utf8
    Start-Sleep -Milliseconds 700
}
