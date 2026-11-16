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

    var data = {"OkPercent": 11.87567299703043, "KoPercent": 88.12432700296957};
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
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [0.11875486700274601, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [0.5623487809417458, 500, 1500, "SeleccionTarifaYCantidad [con temporizador]"], "isController": false}, {"data": [0.0722196086409236, 500, 1500, "SeleccionTarifaYCantidad [sin temporizador]"], "isController": false}, {"data": [0.07109007749968238, 500, 1500, "Tarifas [sin temporizador]"], "isController": false}, {"data": [0.5718201754385965, 500, 1500, "Tarifas [con temporizador]"], "isController": false}, {"data": [0.029365735733825307, 500, 1500, "Pago [sin temporizador]"], "isController": false}, {"data": [0.5572824569567241, 500, 1500, "Pago [con temporizador]"], "isController": false}]}, function(index, item){
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
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 268389, 236516, 88.12432700296957, 27.505490165394267, 0, 656, 204.0, 209.0, 210.0, 211.0, 994.4495288769003, 2188.4055873384045, 26.493748714739873], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["SeleccionTarifaYCantidad [con temporizador]", 10746, 4703, 43.765121905825424, 2.268285873813511, 0, 13, 2.0, 4.0, 4.0, 8.0, 181.43139340525755, 207.97168748628206, 24.4198167810532], "isController": false}, {"data": ["SeleccionTarifaYCantidad [sin temporizador]", 78649, 72969, 92.77803913590763, 31.076466325064498, 0, 398, 57.0, 207.0, 208.0, 211.0, 1310.117937100213, 3060.3545296675106, 22.648239949110476], "isController": false}, {"data": ["Tarifas [sin temporizador]", 78710, 73114, 92.89035700673358, 30.835344937110886, 0, 656, 57.0, 207.0, 209.0, 211.0, 1311.0903821168006, 3084.089523749042, 11.833788977912516], "isController": false}, {"data": ["Tarifas [con temporizador]", 10944, 4686, 42.81798245614035, 1.8955592105263217, 0, 20, 2.0, 3.0, 3.0, 8.0, 182.94578826833384, 226.31965311094766, 13.280832086558233], "isController": false}, {"data": ["Pago [sin temporizador]", 78595, 76287, 97.06342642661747, 31.08232075831785, 0, 440, 58.0, 207.0, 208.0, 211.0, 1309.2184168443498, 3055.824751538763, 22.60657922545476], "isController": false}, {"data": ["Pago [con temporizador]", 10745, 4757, 44.271754304327594, 2.1361563517915245, 0, 15, 2.0, 3.0, 4.0, 9.0, 181.46352996808133, 210.23914723118233, 25.033647726217215], "isController": false}]}, function(index, item){
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
    createTable($("#errorsTable"), {"supportsControllersDiscrimination": false, "titles": ["Type of error", "Number of errors", "% in errors", "% in all samples"], "items": [{"data": ["Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to 127.0.0.1:8080 [/127.0.0.1] failed: Connection refused: connect", 188835, 79.84026450641817, 70.3586957736718], "isController": false}, {"data": ["Non HTTP response code: java.net.BindException/Non HTTP response message: Address already in use: connect", 44291, 18.726428655989448, 16.50253922478194], "isController": false}, {"data": ["404/Not Found", 3390, 1.4333068375923828, 1.2630920045158334], "isController": false}]}, function(index, item){
        switch(index){
            case 2:
            case 3:
                item = item.toFixed(2) + '%';
                break;
        }
        return item;
    }, [[1, 1]]);

        // Create top5 errors by sampler
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 268389, 236516, "Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to 127.0.0.1:8080 [/127.0.0.1] failed: Connection refused: connect", 188835, "Non HTTP response code: java.net.BindException/Non HTTP response message: Address already in use: connect", 44291, "404/Not Found", 3390, "", "", "", ""], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": ["SeleccionTarifaYCantidad [con temporizador]", 10746, 4703, "Non HTTP response code: java.net.BindException/Non HTTP response message: Address already in use: connect", 4649, "Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to 127.0.0.1:8080 [/127.0.0.1] failed: Connection refused: connect", 54, "", "", "", "", "", ""], "isController": false}, {"data": ["SeleccionTarifaYCantidad [sin temporizador]", 78649, 72969, "Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to 127.0.0.1:8080 [/127.0.0.1] failed: Connection refused: connect", 62844, "Non HTTP response code: java.net.BindException/Non HTTP response message: Address already in use: connect", 10125, "", "", "", "", "", ""], "isController": false}, {"data": ["Tarifas [sin temporizador]", 78710, 73114, "Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to 127.0.0.1:8080 [/127.0.0.1] failed: Connection refused: connect", 63020, "Non HTTP response code: java.net.BindException/Non HTTP response message: Address already in use: connect", 10094, "", "", "", "", "", ""], "isController": false}, {"data": ["Tarifas [con temporizador]", 10944, 4686, "Non HTTP response code: java.net.BindException/Non HTTP response message: Address already in use: connect", 4648, "Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to 127.0.0.1:8080 [/127.0.0.1] failed: Connection refused: connect", 38, "", "", "", "", "", ""], "isController": false}, {"data": ["Pago [sin temporizador]", 78595, 76287, "Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to 127.0.0.1:8080 [/127.0.0.1] failed: Connection refused: connect", 62809, "Non HTTP response code: java.net.BindException/Non HTTP response message: Address already in use: connect", 10125, "404/Not Found", 3353, "", "", "", ""], "isController": false}, {"data": ["Pago [con temporizador]", 10745, 4757, "Non HTTP response code: java.net.BindException/Non HTTP response message: Address already in use: connect", 4650, "Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to 127.0.0.1:8080 [/127.0.0.1] failed: Connection refused: connect", 70, "404/Not Found", 37, "", "", "", ""], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
