# Abre un plan en el GUI de JMeter y captura: (1) el árbol completo y (2) el panel de cada hijo del plan indicado.
# Uso: capturar_gui.ps1 -Plan <ruta .jmx> -Salida <carpeta> -Hijos 3,4  (índices 1-based de los hijos directos del Plan a capturar)
param(
    [Parameter(Mandatory)] [string] $Plan,
    [Parameter(Mandatory)] [string] $Salida,
    [string[]] $Rutas = @(),   # posiciones en el árbol, 1-based: "4" = 4.º hijo del plan; "4.1.3" = 3.er hijo del 1.º hijo del 4.º
    [int] $Alto = 1000         # alto del recorte (px): la parte útil está arriba
)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Windows.Forms, System.Drawing
Add-Type @"
using System; using System.Runtime.InteropServices;
public class Win {
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
  [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr h, int c);
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out RECT r);
  [DllImport("user32.dll")] public static extern bool SetCursorPos(int x, int y);
  [DllImport("user32.dll")] public static extern void mouse_event(int f, int x, int y, int d, int e);
  public struct RECT { public int Left, Top, Right, Bottom; }
}
"@

New-Item -ItemType Directory -Force $Salida | Out-Null
$nombre = [IO.Path]::GetFileName($Plan)
$env:JVM_ARGS = '-Duser.language=es -Duser.region=ES'
$jm = Start-Process "$env:USERPROFILE\apache-jmeter-5.6.3\bin\jmeter.bat" -ArgumentList '-t', "`"$Plan`"" -PassThru -WindowStyle Minimized

# Espera la ventana de JMeter con el plan cargado
$ventana = $null
for ($i = 0; $i -lt 90 -and -not $ventana; $i++) {
    Start-Sleep 1
    $ventana = Get-Process java, javaw -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowTitle -like "*$nombre*" } | Select-Object -First 1
}
if (-not $ventana) { throw "No apareció la ventana de JMeter para $nombre" }
$h = $ventana.MainWindowHandle
[Win]::ShowWindow($h, 9) | Out-Null       # restaurar (arranca minimizada)
Start-Sleep 1
[Win]::ShowWindow($h, 3) | Out-Null       # maximizar
Start-Sleep 2
[Win]::SetForegroundWindow($h) | Out-Null
Start-Sleep 1

function Captura($archivo) {
    Start-Sleep -Milliseconds 900
    $r = New-Object Win+RECT
    [Win]::GetWindowRect($h, [ref]$r) | Out-Null
    $pant = [Windows.Forms.Screen]::PrimaryScreen.Bounds
    $x = [Math]::Max($r.Left, 0); $y = [Math]::Max($r.Top, 0)
    $an = [Math]::Min($r.Right, $pant.Right) - $x; $al = [Math]::Min([Math]::Min($r.Bottom, $pant.Bottom) - $y, $Alto)
    $bmp = New-Object Drawing.Bitmap $an, $al
    $g = [Drawing.Graphics]::FromImage($bmp)
    $g.CopyFromScreen($x, $y, 0, 0, $bmp.Size)
    $bmp.Save((Join-Path $Salida $archivo), [Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose(); $bmp.Dispose()
}
function Teclas($k) { [Win]::SetForegroundWindow($h) | Out-Null; [Windows.Forms.SendKeys]::SendWait($k); Start-Sleep -Milliseconds 350 }

if ($env:SOLO_DIAGNOSTICO) { Captura 'diagnostico.png'; Stop-Process -Id $ventana.Id -Force; return }
# Clic sobre el nodo raíz del árbol para darle el foco (esquina superior izquierda del panel del árbol)
$r = New-Object Win+RECT; [Win]::GetWindowRect($h, [ref]$r) | Out-Null
[Win]::SetCursorPos($r.Left + 60, $r.Top + 118); Start-Sleep -Milliseconds 300
[Win]::mouse_event(2, 0, 0, 0, 0); [Win]::mouse_event(4, 0, 0, 0, 0); Start-Sleep 1

# (1) Árbol completo expandido, con el Plan seleccionado
Teclas '^+-'      # Expandir todo (Ctrl+Mayús+Menos)
Teclas '{HOME}'
Captura '00_arbol.png'

# (2) Panel de cada elemento: colapsar todo y bajar por la ruta indicada
foreach ($ruta in $Rutas) {
    Teclas '^-'    # Colapsar todo
    Teclas '{HOME}'
    foreach ($paso in ($ruta -split '\.')) {
        Teclas '{RIGHT}'    # expandir el nodo actual
        for ($k = 0; $k -lt [int]$paso; $k++) { Teclas '{DOWN}' }
    }
    Captura ('nodo_{0}.png' -f ($ruta -replace '\.', '-'))
}

Stop-Process -Id $ventana.Id -Force
Stop-Process -Id $jm.Id -Force -ErrorAction SilentlyContinue
"capturas GUI: $Salida"
