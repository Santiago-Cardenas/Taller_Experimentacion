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

    var data = {"OkPercent": 59.72633365764796, "KoPercent": 40.27366634235204};
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
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [0.5972633365764796, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [0.9487317862924987, 500, 1500, "Tarifas [1 min]"], "isController": false}, {"data": [0.5687866179842065, 500, 1500, "SeleccionTarifaYCantidad [10 min]"], "isController": false}, {"data": [0.9488917384136288, 500, 1500, "SeleccionTarifaYCantidad [1 min]"], "isController": false}, {"data": [0.9455944312145081, 500, 1500, "Pago [1 min]"], "isController": false}, {"data": [0.5652476137192072, 500, 1500, "Tarifas [10 min]"], "isController": false}, {"data": [0.5597371057860503, 500, 1500, "Pago [10 min]"], "isController": false}]}, function(index, item){
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
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 193228, 77820, 40.27366634235204, 1.2761401039186784, 0, 55, 1.0, 3.0, 3.0, 4.0, 292.8158376471444, 325.7315608846887, 35.825083197295484], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["Tarifas [1 min]", 5559, 285, 5.126821370750135, 0.6382442885411044, 0, 15, 1.0, 1.0, 1.0, 2.0, 92.82947030926458, 51.405340689917175, 11.180795892892926], "isController": false}, {"data": ["SeleccionTarifaYCantidad [10 min]", 58885, 25392, 43.12133820157935, 1.5767343126432922, 0, 50, 2.0, 3.0, 4.0, 5.0, 98.31174598722457, 111.31041043453091, 13.384266434577652], "isController": false}, {"data": ["SeleccionTarifaYCantidad [1 min]", 5459, 279, 5.110826158637113, 0.8562007693716819, 0, 19, 1.0, 1.0, 2.0, 2.399999999999636, 92.23620849877503, 34.1879210843119, 20.949967527667482], "isController": false}, {"data": ["Pago [1 min]", 5459, 297, 5.4405568785491845, 0.6863894486169625, 0, 4, 1.0, 1.0, 1.0, 2.0, 92.2611502644966, 35.706118279842485, 21.525306484392164], "isController": false}, {"data": ["Tarifas [10 min]", 58983, 25643, 43.475238628079275, 1.1415662139938556, 0, 42, 1.0, 2.0, 3.0, 3.0, 98.30336161063983, 122.72855673759604, 7.054244408426526], "isController": false}, {"data": ["Pago [10 min]", 58883, 25924, 44.02628942139497, 1.2641679262265761, 0, 55, 1.0, 2.0, 3.0, 4.0, 98.3085710087969, 112.57063794637715, 13.704463985342953], "isController": false}]}, function(index, item){
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
    createTable($("#errorsTable"), {"supportsControllersDiscrimination": false, "titles": ["Type of error", "Number of errors", "% in errors", "% in all samples"], "items": [{"data": ["Non HTTP response code: java.net.BindException/Non HTTP response message: Address already in use: connect", 77161, 99.15317399126188, 39.932618461092595], "isController": false}, {"data": ["Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to 127.0.0.1:8080 [/127.0.0.1] failed: Connection refused: connect", 231, 0.29683885890516576, 0.11954789160991161], "isController": false}, {"data": ["404/Not Found", 428, 0.5499871498329478, 0.22149998964953319], "isController": false}]}, function(index, item){
        switch(index){
            case 2:
            case 3:
                item = item.toFixed(2) + '%';
                break;
        }
        return item;
    }, [[1, 1]]);

        // Create top5 errors by sampler
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 193228, 77820, "Non HTTP response code: java.net.BindException/Non HTTP response message: Address already in use: connect", 77161, "404/Not Found", 428, "Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to 127.0.0.1:8080 [/127.0.0.1] failed: Connection refused: connect", 231, "", "", "", ""], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": ["Tarifas [1 min]", 5559, 285, "Non HTTP response code: java.net.BindException/Non HTTP response message: Address already in use: connect", 285, "", "", "", "", "", "", "", ""], "isController": false}, {"data": ["SeleccionTarifaYCantidad [10 min]", 58885, 25392, "Non HTTP response code: java.net.BindException/Non HTTP response message: Address already in use: connect", 25360, "Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to 127.0.0.1:8080 [/127.0.0.1] failed: Connection refused: connect", 32, "", "", "", "", "", ""], "isController": false}, {"data": ["SeleccionTarifaYCantidad [1 min]", 5459, 279, "Non HTTP response code: java.net.BindException/Non HTTP response message: Address already in use: connect", 279, "", "", "", "", "", "", "", ""], "isController": false}, {"data": ["Pago [1 min]", 5459, 297, "Non HTTP response code: java.net.BindException/Non HTTP response message: Address already in use: connect", 283, "404/Not Found", 14, "", "", "", "", "", ""], "isController": false}, {"data": ["Tarifas [10 min]", 58983, 25643, "Non HTTP response code: java.net.BindException/Non HTTP response message: Address already in use: connect", 25555, "Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to 127.0.0.1:8080 [/127.0.0.1] failed: Connection refused: connect", 88, "", "", "", "", "", ""], "isController": false}, {"data": ["Pago [10 min]", 58883, 25924, "Non HTTP response code: java.net.BindException/Non HTTP response message: Address already in use: connect", 25399, "404/Not Found", 414, "Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to 127.0.0.1:8080 [/127.0.0.1] failed: Connection refused: connect", 111, "", "", "", ""], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
