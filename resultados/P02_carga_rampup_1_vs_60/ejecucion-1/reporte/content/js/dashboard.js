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

    var data = {"OkPercent": 26.47101071269269, "KoPercent": 73.52898928730731};
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
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [0.2647101071269269, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [0.213657310431504, 500, 1500, "SeleccionTarifaYCantidad [subida 1 s]"], "isController": false}, {"data": [0.20154654883437453, 500, 1500, "Pago [subida 1 s]"], "isController": false}, {"data": [0.35034013605442177, 500, 1500, "Tarifas [subida 60 s]"], "isController": false}, {"data": [0.34166524967409173, 500, 1500, "SeleccionTarifaYCantidad [subida 60 s]"], "isController": false}, {"data": [0.21983278095811992, 500, 1500, "Tarifas [subida 1 s]"], "isController": false}, {"data": [0.33824780266515453, 500, 1500, "Pago [subida 60 s]"], "isController": false}]}, function(index, item){
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
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 132273, 97259, 73.52898928730731, 3.063920830403764, 0, 102, 2.0, 8.0, 10.0, 14.0, 400.96092636939585, 705.5532685847935, 21.631242729584105], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["SeleccionTarifaYCantidad [subida 1 s]", 26257, 20647, 78.6342689568496, 3.2350992116388153, 0, 26, 3.0, 8.0, 9.0, 13.0, 294.3114947038054, 543.2137362165835, 15.050183808075996], "isController": false}, {"data": ["Pago [subida 1 s]", 26252, 20961, 79.84534511656254, 3.281692823403936, 0, 23, 2.0, 9.0, 11.0, 13.0, 294.32143057346264, 548.7752759929089, 14.949086709596951], "isController": false}, {"data": ["Tarifas [subida 60 s]", 17934, 11651, 64.96598639455782, 2.6225604996096976, 0, 25, 2.0, 5.0, 8.0, 13.0, 199.1493898037822, 326.18232891325107, 8.857522618624587], "isController": false}, {"data": ["SeleccionTarifaYCantidad [subida 60 s]", 17643, 11615, 65.83347503259083, 2.9587371762172032, 0, 24, 2.0, 6.0, 9.0, 13.0, 197.99124677365054, 314.39920638817193, 16.19198927238806], "isController": false}, {"data": ["Tarifas [subida 1 s]", 26552, 20715, 78.016721904188, 3.1399141307622864, 0, 102, 2.0, 8.0, 10.0, 13.9900000000016, 295.6101579808731, 554.6812158000356, 8.250023832121665], "isController": false}, {"data": ["Pago [subida 60 s]", 17635, 11670, 66.17521973348455, 2.9245250921462955, 0, 24, 2.0, 7.0, 10.0, 13.0, 197.93701034862053, 315.759888695507, 16.592640217074102], "isController": false}]}, function(index, item){
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
    createTable($("#errorsTable"), {"supportsControllersDiscrimination": false, "titles": ["Type of error", "Number of errors", "% in errors", "% in all samples"], "items": [{"data": ["Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to 127.0.0.1:8080 [/127.0.0.1] failed: Connection refused: connect", 1113, 1.1443671022733115, 0.8414415640380123], "isController": false}, {"data": ["Non HTTP response code: java.net.BindException/Non HTTP response message: Address already in use: connect", 95969, 98.67364459844333, 72.55373356618509], "isController": false}, {"data": ["404/Not Found", 177, 0.1819882992833568, 0.1338141570842122], "isController": false}]}, function(index, item){
        switch(index){
            case 2:
            case 3:
                item = item.toFixed(2) + '%';
                break;
        }
        return item;
    }, [[1, 1]]);

        // Create top5 errors by sampler
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 132273, 97259, "Non HTTP response code: java.net.BindException/Non HTTP response message: Address already in use: connect", 95969, "Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to 127.0.0.1:8080 [/127.0.0.1] failed: Connection refused: connect", 1113, "404/Not Found", 177, "", "", "", ""], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": ["SeleccionTarifaYCantidad [subida 1 s]", 26257, 20647, "Non HTTP response code: java.net.BindException/Non HTTP response message: Address already in use: connect", 20423, "Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to 127.0.0.1:8080 [/127.0.0.1] failed: Connection refused: connect", 224, "", "", "", "", "", ""], "isController": false}, {"data": ["Pago [subida 1 s]", 26252, 20961, "Non HTTP response code: java.net.BindException/Non HTTP response message: Address already in use: connect", 20420, "Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to 127.0.0.1:8080 [/127.0.0.1] failed: Connection refused: connect", 408, "404/Not Found", 133, "", "", "", ""], "isController": false}, {"data": ["Tarifas [subida 60 s]", 17934, 11651, "Non HTTP response code: java.net.BindException/Non HTTP response message: Address already in use: connect", 11603, "Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to 127.0.0.1:8080 [/127.0.0.1] failed: Connection refused: connect", 48, "", "", "", "", "", ""], "isController": false}, {"data": ["SeleccionTarifaYCantidad [subida 60 s]", 17643, 11615, "Non HTTP response code: java.net.BindException/Non HTTP response message: Address already in use: connect", 11555, "Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to 127.0.0.1:8080 [/127.0.0.1] failed: Connection refused: connect", 60, "", "", "", "", "", ""], "isController": false}, {"data": ["Tarifas [subida 1 s]", 26552, 20715, "Non HTTP response code: java.net.BindException/Non HTTP response message: Address already in use: connect", 20418, "Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to 127.0.0.1:8080 [/127.0.0.1] failed: Connection refused: connect", 297, "", "", "", "", "", ""], "isController": false}, {"data": ["Pago [subida 60 s]", 17635, 11670, "Non HTTP response code: java.net.BindException/Non HTTP response message: Address already in use: connect", 11550, "Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to 127.0.0.1:8080 [/127.0.0.1] failed: Connection refused: connect", 76, "404/Not Found", 44, "", "", "", ""], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
