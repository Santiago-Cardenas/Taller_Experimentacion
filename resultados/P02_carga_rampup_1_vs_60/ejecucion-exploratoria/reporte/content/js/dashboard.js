/*
   Licensed to the Apache Software Foundation (ASF) under one or more
   contributor license agreements.  See the NOTICE file distributed with
   this work for additional information regarding copyright ownership.
   The ASF licenses this file to You under the Apache License, Version 2.0
   (the "License"); you may not use this file except in compliance with
   the License.  You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
var showControllersOnly = false;
var seriesFilter = "";
var filtersOnlySampleSeries = true;

/*
 * Add header in statistics table to group metrics by category
 * format
 *
 */
function summaryTableHeader(header) {
    var newRow = header.insertRow(-1);
    newRow.className = "tablesorter-no-sort";
    var cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Requests";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 3;
    cell.innerHTML = "Executions";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 7;
    cell.innerHTML = "Response Times (ms)";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Throughput";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 2;
    cell.innerHTML = "Network (KB/sec)";
    newRow.appendChild(cell);
}

/*
 * Populates the table identified by id parameter with the specified data and
 * format
 *
 */
function createTable(table, info, formatter, defaultSorts, seriesIndex, headerCreator) {
    var tableRef = table[0];

    // Create header and populate it with data.titles array
    var header = tableRef.createTHead();

    // Call callback is available
    if(headerCreator) {
        headerCreator(header);
    }

    var newRow = header.insertRow(-1);
    for (var index = 0; index < info.titles.length; index++) {
        var cell = document.createElement('th');
        cell.innerHTML = info.titles[index];
        newRow.appendChild(cell);
    }

    var tBody;

    // Create overall body if defined
    if(info.overall){
        tBody = document.createElement('tbody');
        tBody.className = "tablesorter-no-sort";
        tableRef.appendChild(tBody);
        var newRow = tBody.insertRow(-1);
        var data = info.overall.data;
        for(var index=0;index < data.length; index++){
            var cell = newRow.insertCell(-1);
            cell.innerHTML = formatter ? formatter(index, data[index]): data[index];
        }
    }

    // Create regular body
    tBody = document.createElement('tbody');
    tableRef.appendChild(tBody);

    var regexp;
    if(seriesFilter) {
        regexp = new RegExp(seriesFilter, 'i');
    }
    // Populate body with data.items array
    for(var index=0; index < info.items.length; index++){
        var item = info.items[index];
        if((!regexp || filtersOnlySampleSeries && !info.supportsControllersDiscrimination || regexp.test(item.data[seriesIndex]))
                &&
                (!showControllersOnly || !info.supportsControllersDiscrimination || item.isController)){
            if(item.data.length > 0) {
                var newRow = tBody.insertRow(-1);
                for(var col=0; col < item.data.length; col++){
                    var cell = newRow.insertCell(-1);
                    cell.innerHTML = formatter ? formatter(col, item.data[col]) : item.data[col];
                }
            }
        }
    }

    // Add support of columns sort
    table.tablesorter({sortList : defaultSorts});
}

$(document).ready(function() {

    // Customize table sorter default options
    $.extend( $.tablesorter.defaults, {
        theme: 'blue',
        cssInfoBlock: "tablesorter-no-sort",
        widthFixed: true,
        widgets: ['zebra']
    });

    var data = {"OkPercent": 25.258658450012838, "KoPercent": 74.74134154998715};
    var dataset = [
        {
            "label" : "FAIL",
            "data" : data.KoPercent,
            "color" : "#FF6347"
        },
        {
            "label" : "PASS",
            "data" : data.OkPercent,
            "color" : "#9ACD32"
        }];
    $.plot($("#flot-requests-summary"), dataset, {
        series : {
            pie : {
                show : true,
                radius : 1,
                label : {
                    show : true,
                    radius : 3 / 4,
                    formatter : function(label, series) {
                        return '<div style="font-size:8pt;text-align:center;padding:2px;color:white;">'
                            + label
                            + '<br/>'
                            + Math.round10(series.percent, -2)
                            + '%</div>';
                    },
                    background : {
                        opacity : 0.5,
                        color : '#000'
                    }
                }
            }
        },
        legend : {
            show : true
        }
    });

    // Creates APDEX table
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [0.2525865845001284, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [0.2172021674425704, 500, 1500, "SeleccionTarifaYCantidad [subida 1 s]"], "isController": false}, {"data": [0.1994809754608251, 500, 1500, "Pago [subida 1 s]"], "isController": false}, {"data": [0.3139244718016969, 500, 1500, "Tarifas [subida 60 s]"], "isController": false}, {"data": [0.31769746856852904, 500, 1500, "SeleccionTarifaYCantidad [subida 60 s]"], "isController": false}, {"data": [0.221811320754717, 500, 1500, "Tarifas [subida 1 s]"], "isController": false}, {"data": [0.3018325345362278, 500, 1500, "Pago [subida 60 s]"], "isController": false}]}, function(index, item){
        switch(index){
            case 0:
                item = item.toFixed(3);
                break;
            case 1:
            case 2:
                item = formatDuration(item);
                break;
        }
        return item;
    }, [[0, 0]], 3);

    // Create statistics table
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 132414, 98968, 74.74134154998715, 3.0943027172353426, 0, 198, 3.0, 6.0, 7.0, 13.0, 736.7917336701591, 1312.7230231680223, 38.422447471232545], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["SeleccionTarifaYCantidad [subida 1 s]", 26206, 20514, 78.27978325574296, 3.946310005342301, 0, 122, 3.0, 7.0, 9.0, 13.0, 294.6712693825689, 542.817268776073, 15.321631259628033], "isController": false}, {"data": ["Pago [subida 1 s]", 26203, 20976, 80.05190245391749, 3.8299812998511618, 0, 29, 3.0, 8.0, 10.0, 12.0, 294.82318260067285, 547.0052713300404, 15.35497487046705], "isController": false}, {"data": ["Tarifas [subida 60 s]", 18033, 12372, 68.60755281983032, 1.5243165308046325, 0, 36, 1.0, 3.0, 4.0, 8.0, 200.1909435051455, 342.1150635830771, 7.978348345618846], "isController": false}, {"data": ["SeleccionTarifaYCantidad [subida 60 s]", 17737, 12102, 68.2302531431471, 2.201556069233809, 0, 88, 1.0, 5.0, 6.0, 12.0, 198.71830780779098, 326.2605410149904, 15.111166000985916], "isController": false}, {"data": ["Tarifas [subida 1 s]", 26500, 20622, 77.8188679245283, 4.1003396226415, 0, 198, 3.0, 7.0, 8.0, 12.0, 295.72592344604396, 554.8454762303314, 8.32753564055351], "isController": false}, {"data": ["Pago [subida 60 s]", 17735, 12382, 69.81674654637722, 1.7343670707640262, 0, 41, 1.0, 4.0, 5.0, 10.0, 198.69812673657793, 329.05311512671415, 15.283844275875012], "isController": false}]}, function(index, item){
        switch(index){
            // Errors pct
            case 3:
                item = item.toFixed(2) + '%';
                break;
            // Mean
            case 4:
            // Mean
            case 7:
            // Median
            case 8:
            // Percentile 1
            case 9:
            // Percentile 2
            case 10:
            // Percentile 3
            case 11:
            // Throughput
            case 12:
            // Kbytes/s
            case 13:
            // Sent Kbytes/s
                item = item.toFixed(2);
                break;
        }
        return item;
    }, [[0, 0]], 0, summaryTableHeader);

    // Create error table
    createTable($("#errorsTable"), {"supportsControllersDiscrimination": false, "titles": ["Type of error", "Number of errors", "% in errors", "% in all samples"], "items": [{"data": ["Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to 127.0.0.1:8080 [/127.0.0.1] failed: Connection refused: connect", 3247, 3.2808584592999757, 2.4521576268370415], "isController": false}, {"data": ["Non HTTP response code: java.net.BindException/Non HTTP response message: Address already in use: connect", 95189, 96.18159405060221, 71.88741371758273], "isController": false}, {"data": ["404/Not Found", 532, 0.5375474900978094, 0.40177020556738713], "isController": false}]}, function(index, item){
        switch(index){
            case 2:
            case 3:
                item = item.toFixed(2) + '%';
                break;
        }
        return item;
    }, [[1, 1]]);

        // Create top5 errors by sampler
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 132414, 98968, "Non HTTP response code: java.net.BindException/Non HTTP response message: Address already in use: connect", 95189, "Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to 127.0.0.1:8080 [/127.0.0.1] failed: Connection refused: connect", 3247, "404/Not Found", 532, "", "", "", ""], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": ["SeleccionTarifaYCantidad [subida 1 s]", 26206, 20514, "Non HTTP response code: java.net.BindException/Non HTTP response message: Address already in use: connect", 19941, "Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to 127.0.0.1:8080 [/127.0.0.1] failed: Connection refused: connect", 573, "", "", "", "", "", ""], "isController": false}, {"data": ["Pago [subida 1 s]", 26203, 20976, "Non HTTP response code: java.net.BindException/Non HTTP response message: Address already in use: connect", 19984, "Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to 127.0.0.1:8080 [/127.0.0.1] failed: Connection refused: connect", 659, "404/Not Found", 333, "", "", "", ""], "isController": false}, {"data": ["Tarifas [subida 60 s]", 18033, 12372, "Non HTTP response code: java.net.BindException/Non HTTP response message: Address already in use: connect", 11970, "Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to 127.0.0.1:8080 [/127.0.0.1] failed: Connection refused: connect", 402, "", "", "", "", "", ""], "isController": false}, {"data": ["SeleccionTarifaYCantidad [subida 60 s]", 17737, 12102, "Non HTTP response code: java.net.BindException/Non HTTP response message: Address already in use: connect", 11644, "Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to 127.0.0.1:8080 [/127.0.0.1] failed: Connection refused: connect", 458, "", "", "", "", "", ""], "isController": false}, {"data": ["Tarifas [subida 1 s]", 26500, 20622, "Non HTTP response code: java.net.BindException/Non HTTP response message: Address already in use: connect", 19981, "Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to 127.0.0.1:8080 [/127.0.0.1] failed: Connection refused: connect", 641, "", "", "", "", "", ""], "isController": false}, {"data": ["Pago [subida 60 s]", 17735, 12382, "Non HTTP response code: java.net.BindException/Non HTTP response message: Address already in use: connect", 11669, "Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to 127.0.0.1:8080 [/127.0.0.1] failed: Connection refused: connect", 514, "404/Not Found", 199, "", "", "", ""], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
