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

    var data = {"OkPercent": 38.694292684602964, "KoPercent": 61.305707315397036};
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
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [0.3869429268460296, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [1.0, 500, 1500, "Pago [050 usuarios]"], "isController": false}, {"data": [0.4044861991114995, 500, 1500, "Tarifas [250 usuarios]"], "isController": false}, {"data": [0.3828351012536162, 500, 1500, "Pago [250 usuarios]"], "isController": false}, {"data": [0.9987228607918263, 500, 1500, "Tarifas [100 usuarios]"], "isController": false}, {"data": [1.0, 500, 1500, "SeleccionTarifaYCantidad [050 usuarios]"], "isController": false}, {"data": [0.9990709773318469, 500, 1500, "SeleccionTarifaYCantidad [100 usuarios]"], "isController": false}, {"data": [0.20395601095972676, 500, 1500, "SeleccionTarifaYCantidad [500 usuarios]"], "isController": false}, {"data": [0.3910560664491249, 500, 1500, "SeleccionTarifaYCantidad [250 usuarios]"], "isController": false}, {"data": [0.9992735197965855, 500, 1500, "Tarifas [050 usuarios]"], "isController": false}, {"data": [0.21945017688679244, 500, 1500, "Tarifas [500 usuarios]"], "isController": false}, {"data": [0.9973982531128043, 500, 1500, "Pago [100 usuarios]"], "isController": false}, {"data": [0.1709651987836468, 500, 1500, "Pago [500 usuarios]"], "isController": false}]}, function(index, item){
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
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 145515, 89209, 61.305707315397036, 4.388104319142384, 0, 54, 6.0, 13.0, 15.0, 21.0, 210.88366363537554, 322.179195273722, 16.615248032227093], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["Pago [050 usuarios]", 2703, 0, 0.0, 1.516463189049206, 0, 29, 1.0, 2.0, 3.0, 6.0, 45.89679588406093, 13.042903947625355, 11.294914612093118], "isController": false}, {"data": ["Tarifas [250 usuarios]", 13731, 8177, 59.551380088850046, 2.483285995193365, 0, 22, 2.0, 4.0, 6.0, 9.0, 228.66325833902312, 352.31595368990327, 11.742038272910456], "isController": false}, {"data": ["Pago [250 usuarios]", 13481, 8320, 61.71648987463838, 2.8391068911801813, 0, 18, 2.0, 6.0, 7.0, 10.0, 227.08666722816477, 340.5451181251579, 21.751393655773605], "isController": false}, {"data": ["Tarifas [100 usuarios]", 5481, 7, 0.1277139208173691, 1.3358876117496756, 0, 23, 1.0, 2.0, 2.0, 3.0, 91.33934374322995, 42.34346487701435, 11.581005653507091], "isController": false}, {"data": ["SeleccionTarifaYCantidad [050 usuarios]", 2703, 0, 0.0, 2.1561228264890904, 1, 32, 2.0, 3.0, 4.0, 8.0, 45.882772317563784, 12.308556551408056, 10.982270925633582], "isController": false}, {"data": ["SeleccionTarifaYCantidad [100 usuarios]", 5382, 5, 0.09290226681531029, 2.1863619472315134, 1, 28, 2.0, 3.0, 3.0, 4.170000000000073, 91.4217767963309, 24.717697628248686, 21.862293241464243], "isController": false}, {"data": ["SeleccionTarifaYCantidad [500 usuarios]", 26643, 21209, 79.60439890402732, 6.372067710092684, 0, 47, 6.0, 13.0, 17.0, 25.0, 449.5191496541252, 843.0011428104436, 21.944267230470725], "isController": false}, {"data": ["SeleccionTarifaYCantidad [250 usuarios]", 13484, 8211, 60.89439335508751, 2.982497775140908, 0, 16, 3.0, 5.0, 6.0, 9.0, 227.0148323989427, 338.3997620092345, 21.24822894569591], "isController": false}, {"data": ["Tarifas [050 usuarios]", 2753, 2, 0.0726480203414457, 1.3614239011986913, 0, 22, 1.0, 2.0, 2.0, 5.0, 45.98834004309841, 21.26698409284533, 5.834122026543942], "isController": false}, {"data": ["Tarifas [500 usuarios]", 27136, 21181, 78.05498231132076, 5.500479068396246, 0, 54, 5.0, 13.0, 16.0, 24.0, 451.8825664851543, 852.2737769250303, 12.58939666908128], "isController": false}, {"data": ["Pago [100 usuarios]", 5381, 14, 0.26017468871956884, 1.4987920460880875, 0, 24, 1.0, 2.0, 3.0, 3.0, 91.40634289694066, 26.391987665409637, 22.447998283264536], "isController": false}, {"data": ["Pago [500 usuarios]", 26637, 22083, 82.90348012163533, 6.235161617299281, 0, 51, 7.0, 14.0, 16.0, 23.0, 449.4103355772637, 866.8397856877731, 19.992271331047224], "isController": false}]}, function(index, item){
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
    createTable($("#errorsTable"), {"supportsControllersDiscrimination": false, "titles": ["Type of error", "Number of errors", "% in errors", "% in all samples"], "items": [{"data": ["Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to 127.0.0.1:8080 [/127.0.0.1] failed: Connection refused: connect", 4744, 5.3178490959432345, 3.260145002233447], "isController": false}, {"data": ["Non HTTP response code: java.net.BindException/Non HTTP response message: Address already in use: connect", 84099, 94.2718783979195, 57.79404185135553], "isController": false}, {"data": ["404/Not Found", 366, 0.4102725061372731, 0.25152046180806104], "isController": false}]}, function(index, item){
        switch(index){
            case 2:
            case 3:
                item = item.toFixed(2) + '%';
                break;
        }
        return item;
    }, [[1, 1]]);

        // Create top5 errors by sampler
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 145515, 89209, "Non HTTP response code: java.net.BindException/Non HTTP response message: Address already in use: connect", 84099, "Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to 127.0.0.1:8080 [/127.0.0.1] failed: Connection refused: connect", 4744, "404/Not Found", 366, "", "", "", ""], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": [], "isController": false}, {"data": ["Tarifas [250 usuarios]", 13731, 8177, "Non HTTP response code: java.net.BindException/Non HTTP response message: Address already in use: connect", 8092, "Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to 127.0.0.1:8080 [/127.0.0.1] failed: Connection refused: connect", 85, "", "", "", "", "", ""], "isController": false}, {"data": ["Pago [250 usuarios]", 13481, 8320, "Non HTTP response code: java.net.BindException/Non HTTP response message: Address already in use: connect", 8088, "Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to 127.0.0.1:8080 [/127.0.0.1] failed: Connection refused: connect", 142, "404/Not Found", 90, "", "", "", ""], "isController": false}, {"data": ["Tarifas [100 usuarios]", 5481, 7, "Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to 127.0.0.1:8080 [/127.0.0.1] failed: Connection refused: connect", 7, "", "", "", "", "", "", "", ""], "isController": false}, {"data": [], "isController": false}, {"data": ["SeleccionTarifaYCantidad [100 usuarios]", 5382, 5, "Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to 127.0.0.1:8080 [/127.0.0.1] failed: Connection refused: connect", 5, "", "", "", "", "", "", "", ""], "isController": false}, {"data": ["SeleccionTarifaYCantidad [500 usuarios]", 26643, 21209, "Non HTTP response code: java.net.BindException/Non HTTP response message: Address already in use: connect", 19944, "Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to 127.0.0.1:8080 [/127.0.0.1] failed: Connection refused: connect", 1265, "", "", "", "", "", ""], "isController": false}, {"data": ["SeleccionTarifaYCantidad [250 usuarios]", 13484, 8211, "Non HTTP response code: java.net.BindException/Non HTTP response message: Address already in use: connect", 8080, "Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to 127.0.0.1:8080 [/127.0.0.1] failed: Connection refused: connect", 131, "", "", "", "", "", ""], "isController": false}, {"data": ["Tarifas [050 usuarios]", 2753, 2, "Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to 127.0.0.1:8080 [/127.0.0.1] failed: Connection refused: connect", 2, "", "", "", "", "", "", "", ""], "isController": false}, {"data": ["Tarifas [500 usuarios]", 27136, 21181, "Non HTTP response code: java.net.BindException/Non HTTP response message: Address already in use: connect", 19948, "Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to 127.0.0.1:8080 [/127.0.0.1] failed: Connection refused: connect", 1233, "", "", "", "", "", ""], "isController": false}, {"data": ["Pago [100 usuarios]", 5381, 14, "Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to 127.0.0.1:8080 [/127.0.0.1] failed: Connection refused: connect", 11, "404/Not Found", 3, "", "", "", "", "", ""], "isController": false}, {"data": ["Pago [500 usuarios]", 26637, 22083, "Non HTTP response code: java.net.BindException/Non HTTP response message: Address already in use: connect", 19947, "Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to 127.0.0.1:8080 [/127.0.0.1] failed: Connection refused: connect", 1863, "404/Not Found", 273, "", "", "", ""], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
