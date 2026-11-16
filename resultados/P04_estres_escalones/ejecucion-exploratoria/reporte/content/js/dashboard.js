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

    var data = {"OkPercent": 25.43055244911653, "KoPercent": 74.56944755088347};
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
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [0.2543055244911653, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [0.9962935507783544, 500, 1500, "Pago [050 usuarios]"], "isController": false}, {"data": [0.12131953989727266, 500, 1500, "Tarifas [250 usuarios]"], "isController": false}, {"data": [0.12193324983422972, 500, 1500, "Pago [250 usuarios]"], "isController": false}, {"data": [0.8020626017731138, 500, 1500, "Tarifas [100 usuarios]"], "isController": false}, {"data": [0.9966654316413487, 500, 1500, "SeleccionTarifaYCantidad [050 usuarios]"], "isController": false}, {"data": [0.7984524686809138, 500, 1500, "SeleccionTarifaYCantidad [100 usuarios]"], "isController": false}, {"data": [0.14041864400544457, 500, 1500, "SeleccionTarifaYCantidad [500 usuarios]"], "isController": false}, {"data": [0.12605908789508583, 500, 1500, "SeleccionTarifaYCantidad [250 usuarios]"], "isController": false}, {"data": [0.9967248908296943, 500, 1500, "Tarifas [050 usuarios]"], "isController": false}, {"data": [0.13875943788157943, 500, 1500, "Tarifas [500 usuarios]"], "isController": false}, {"data": [0.7984524686809138, 500, 1500, "Pago [100 usuarios]"], "isController": false}, {"data": [0.1325141637848576, 500, 1500, "Pago [500 usuarios]"], "isController": false}]}, function(index, item){
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
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 147543, 110022, 74.56944755088347, 1.1336085073504127, 0, 159, 1.0, 3.0, 6.0, 10.0, 614.9316061917027, 1094.1634641258117, 31.99240793822468], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["Pago [050 usuarios]", 2698, 10, 0.37064492216456635, 1.848776871756855, 0, 159, 1.0, 2.0, 2.0, 16.019999999999527, 45.496703259641485, 13.269399704473786, 11.158923990531356], "isController": false}, {"data": ["Tarifas [250 usuarios]", 13823, 12146, 87.86804601027274, 0.6642552267959172, 0, 14, 1.0, 1.0, 1.0, 2.0, 230.2988904068508, 472.53409426960116, 3.5470392626870146], "isController": false}, {"data": ["Pago [250 usuarios]", 13573, 11918, 87.80667501657703, 0.6948353348559582, 0, 9, 1.0, 1.0, 2.0, 2.2600000000002183, 228.3402308132297, 461.71433721632013, 7.037897104530467], "isController": false}, {"data": ["Tarifas [100 usuarios]", 5527, 1094, 19.793739822688618, 0.5945359146010498, 0, 5, 1.0, 1.0, 1.0, 1.0, 92.142773785906, 75.49372061667472, 9.382378392627912], "isController": false}, {"data": ["SeleccionTarifaYCantidad [050 usuarios]", 2699, 9, 0.33345683586513525, 2.7428677287884384, 0, 152, 2.0, 3.0, 4.0, 21.0, 45.494386946701276, 12.548217423642248, 10.853249550155075], "isController": false}, {"data": ["SeleccionTarifaYCantidad [100 usuarios]", 5428, 1094, 20.15475313190862, 0.7476050110537947, 0, 5, 1.0, 1.0, 1.0, 2.0, 92.1875, 61.95060066554857, 17.61839493461277], "isController": false}, {"data": ["SeleccionTarifaYCantidad [500 usuarios]", 27183, 23366, 85.95813559945555, 1.4762535408159527, 0, 40, 1.0, 4.0, 6.0, 13.0, 457.50302948700687, 911.635047930061, 15.376733934251718], "isController": false}, {"data": ["SeleccionTarifaYCantidad [250 usuarios]", 13573, 11862, 87.39409121049141, 0.738893391291531, 0, 16, 1.0, 1.0, 2.0, 3.0, 228.3402308132297, 461.01359833955786, 6.889709059881902], "isController": false}, {"data": ["Tarifas [050 usuarios]", 2748, 9, 0.32751091703056767, 1.6670305676855903, 0, 88, 1.0, 2.0, 2.0, 21.509999999999764, 45.899448805745784, 21.46829197636546, 5.807994143561049], "isController": false}, {"data": ["Tarifas [500 usuarios]", 27681, 23840, 86.12405621184206, 1.2653444600989747, 0, 35, 1.0, 3.0, 4.0, 9.0, 461.1732169335088, 933.0343290280392, 8.124001684770837], "isController": false}, {"data": ["Pago [100 usuarios]", 5428, 1094, 20.15475313190862, 0.6208548268238774, 0, 3, 1.0, 1.0, 1.0, 1.0, 92.1890657110345, 63.08826948062977, 18.11861043941813], "isController": false}, {"data": ["Pago [500 usuarios]", 27182, 23580, 86.74858362151424, 1.3160547421087465, 0, 38, 1.0, 3.0, 5.0, 9.0, 457.4861990036354, 916.2406998430558, 15.378525460313721], "isController": false}]}, function(index, item){
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
    createTable($("#errorsTable"), {"supportsControllersDiscrimination": false, "titles": ["Type of error", "Number of errors", "% in errors", "% in all samples"], "items": [{"data": ["Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to 127.0.0.1:8080 [/127.0.0.1] failed: Connection refused: connect", 951, 0.8643725800294486, 0.644557857709278], "isController": false}, {"data": ["Non HTTP response code: java.net.BindException/Non HTTP response message: Address already in use: connect", 108906, 98.98565741397175, 73.81305788820886], "isController": false}, {"data": ["404/Not Found", 165, 0.14997000599880023, 0.11183180496533214], "isController": false}]}, function(index, item){
        switch(index){
            case 2:
            case 3:
                item = item.toFixed(2) + '%';
                break;
        }
        return item;
    }, [[1, 1]]);

        // Create top5 errors by sampler
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 147543, 110022, "Non HTTP response code: java.net.BindException/Non HTTP response message: Address already in use: connect", 108906, "Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to 127.0.0.1:8080 [/127.0.0.1] failed: Connection refused: connect", 951, "404/Not Found", 165, "", "", "", ""], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": ["Pago [050 usuarios]", 2698, 10, "Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to 127.0.0.1:8080 [/127.0.0.1] failed: Connection refused: connect", 9, "404/Not Found", 1, "", "", "", "", "", ""], "isController": false}, {"data": ["Tarifas [250 usuarios]", 13823, 12146, "Non HTTP response code: java.net.BindException/Non HTTP response message: Address already in use: connect", 12146, "", "", "", "", "", "", "", ""], "isController": false}, {"data": ["Pago [250 usuarios]", 13573, 11918, "Non HTTP response code: java.net.BindException/Non HTTP response message: Address already in use: connect", 11869, "404/Not Found", 47, "Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to 127.0.0.1:8080 [/127.0.0.1] failed: Connection refused: connect", 2, "", "", "", ""], "isController": false}, {"data": ["Tarifas [100 usuarios]", 5527, 1094, "Non HTTP response code: java.net.BindException/Non HTTP response message: Address already in use: connect", 1094, "", "", "", "", "", "", "", ""], "isController": false}, {"data": ["SeleccionTarifaYCantidad [050 usuarios]", 2699, 9, "Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to 127.0.0.1:8080 [/127.0.0.1] failed: Connection refused: connect", 9, "", "", "", "", "", "", "", ""], "isController": false}, {"data": ["SeleccionTarifaYCantidad [100 usuarios]", 5428, 1094, "Non HTTP response code: java.net.BindException/Non HTTP response message: Address already in use: connect", 1094, "", "", "", "", "", "", "", ""], "isController": false}, {"data": ["SeleccionTarifaYCantidad [500 usuarios]", 27183, 23366, "Non HTTP response code: java.net.BindException/Non HTTP response message: Address already in use: connect", 23113, "Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to 127.0.0.1:8080 [/127.0.0.1] failed: Connection refused: connect", 253, "", "", "", "", "", ""], "isController": false}, {"data": ["SeleccionTarifaYCantidad [250 usuarios]", 13573, 11862, "Non HTTP response code: java.net.BindException/Non HTTP response message: Address already in use: connect", 11861, "Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to 127.0.0.1:8080 [/127.0.0.1] failed: Connection refused: connect", 1, "", "", "", "", "", ""], "isController": false}, {"data": ["Tarifas [050 usuarios]", 2748, 9, "Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to 127.0.0.1:8080 [/127.0.0.1] failed: Connection refused: connect", 9, "", "", "", "", "", "", "", ""], "isController": false}, {"data": ["Tarifas [500 usuarios]", 27681, 23840, "Non HTTP response code: java.net.BindException/Non HTTP response message: Address already in use: connect", 23531, "Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to 127.0.0.1:8080 [/127.0.0.1] failed: Connection refused: connect", 309, "", "", "", "", "", ""], "isController": false}, {"data": ["Pago [100 usuarios]", 5428, 1094, "Non HTTP response code: java.net.BindException/Non HTTP response message: Address already in use: connect", 1093, "404/Not Found", 1, "", "", "", "", "", ""], "isController": false}, {"data": ["Pago [500 usuarios]", 27182, 23580, "Non HTTP response code: java.net.BindException/Non HTTP response message: Address already in use: connect", 23105, "Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to 127.0.0.1:8080 [/127.0.0.1] failed: Connection refused: connect", 359, "404/Not Found", 116, "", "", "", ""], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
