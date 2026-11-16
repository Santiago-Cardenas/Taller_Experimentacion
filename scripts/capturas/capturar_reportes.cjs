// Toma capturas de los paneles del reporte HTML de JMeter de cada pregunta.
// Uso: node capturar_reportes.cjs <carpeta resultados> [P01 P02 ...]
const path = require('path');
const fs = require('fs');
const { chromium } = require(process.env.PLAYWRIGHT_TEST || '@playwright/test');   // npm i @playwright/test

const raiz = process.argv[2];
const filtro = process.argv.slice(3);

const capturas = [
  { pagina: 'index.html', selector: '#statisticsTable', archivo: '01_estadisticas.png' },
  { pagina: 'index.html', selector: '#errorsTable', archivo: '02_errores.png', soloSiErrores: true },
  { pagina: 'content/pages/OverTime.html', selector: '#flotResponseTimesOverTime', archivo: '03_tiempo_respuesta.png' },
  { pagina: 'content/pages/OverTime.html', selector: '#flotActiveThreadsOverTime', archivo: '05_hilos_activos.png' },
  { pagina: 'content/pages/Throughput.html', selector: '#flotTransactionsPerSecond', archivo: '04_transacciones_por_segundo.png' },
];

(async () => {
  const navegador = await chromium.launch();
  const pagina = await navegador.newPage({ viewport: { width: 1500, height: 1000 }, deviceScaleFactor: 1.5 });
  for (const pregunta of fs.readdirSync(raiz).filter((d) => d.startsWith('P')).sort()) {
    if (filtro.length && !filtro.some((f) => pregunta.startsWith(f))) continue;
    const ejecucion = path.join(raiz, pregunta, process.env.EJECUCION || 'ejecucion-1');
    const reporte = path.join(ejecucion, 'reporte');
    if (!fs.existsSync(reporte)) continue;
    const salida = path.join(ejecucion, 'capturas');
    fs.mkdirSync(salida, { recursive: true });
    const conErrores = fs.existsSync(path.join(ejecucion, 'errores.csv'))
      && fs.readFileSync(path.join(ejecucion, 'errores.csv'), 'utf8').trim().split('\n').length > 1;

    for (const c of capturas) {
      if (c.soloSiErrores && !conErrores) continue;
      await pagina.goto('file:///' + path.join(reporte, c.pagina).replace(/\\/g, '/'));
      await pagina.waitForLoadState('networkidle');
      // Abre los paneles colapsados y espera a que flot dibuje
      await pagina.evaluate(() => document.querySelectorAll('.collapse').forEach((e) => e.classList.add('in')));
      await pagina.waitForTimeout(1200);
      const panel = pagina.locator(c.selector).locator('xpath=ancestor::div[contains(@class,"panel")][1]');
      await panel.scrollIntoViewIfNeeded();
      await panel.screenshot({ path: path.join(salida, c.archivo) });
    }
    console.log('capturas listas:', pregunta);
  }
  await navegador.close();
})();
