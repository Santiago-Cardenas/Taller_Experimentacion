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

    var data = {"OkPercent": 22.296141190547413, "KoPercent": 77.70385880945258};
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
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [0.22296141190547414, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [1.0, 500, 1500, "Pago [20 usuarios]"], "isController": false}, {"data": [0.1934683753617197, 500, 1500, "SeleccionTarifaYCantidad [500 usuarios]"], "isController": false}, {"data": [1.0, 500, 1500, "Tarifas [20 usuarios]"], "isController": false}, {"data": [0.2125807046670356, 500, 1500, "Tarifas [500 usuarios]"], "isController": false}, {"data": [1.0, 500, 1500, "SeleccionTarifaYCantidad [20 usuarios]"], "isController": false}, {"data": [0.16800090201826587, 500, 1500, "Pago [500 usuarios]"], "isController": false}]}, function(index, item){
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
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 83575, 64941, 77.70385880945258, 5.8562608435536765, 0, 137, 6.0, 13.0, 16.0, 24.0, 696.3538802512957, 1286.3048651426245, 31.806801245438184], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["Pago [20 usuarios]", 1078, 0, 0.0, 1.429499072356218, 1, 12, 1.0, 2.0, 2.0, 4.0, 18.29878969971652, 5.2000614539305055, 4.503217777664613], "isController": false}, {"data": ["SeleccionTarifaYCantidad [500 usuarios]", 26609, 21461, 80.65316246382802, 6.482543500319441, 0, 128, 6.0, 13.0, 17.0, 25.0, 447.64644527438514, 850.1668709098785, 20.72708809112244], "isController": false}, {"data": ["Tarifas [20 usuarios]", 1098, 0, 0.0, 1.2859744990892537, 0, 21, 1.0, 2.0, 2.0, 4.0, 18.340961480640097, 8.454036932482545, 2.3284423754718873], "isController": false}, {"data": ["Tarifas [500 usuarios]", 27105, 21343, 78.74192953329644, 5.44486257148126, 0, 124, 5.0, 12.0, 15.0, 24.0, 450.840804377838, 856.7625925737262, 12.167194595066615], "isController": false}, {"data": ["SeleccionTarifaYCantidad [20 usuarios]", 1078, 0, 0.0, 2.0296846011131717, 1, 13, 2.0, 3.0, 3.0, 7.210000000000036, 18.29102755531424, 4.906673128478349, 4.377994508874033], "isController": false}, {"data": ["Pago [500 usuarios]", 26607, 22137, 83.19990979817341, 6.17202240012027, 0, 137, 7.0, 14.0, 15.0, 21.0, 447.85389665039554, 862.3643233988387, 20.049151947273188], "isController": false}]}, function(index, item){
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
    createTable($("#errorsTable"), {"supportsControllersDiscrimination": false, "titles": ["Type of error", "Number of errors", "% in errors", "% in all samples"], "items": [{"data": ["Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to 127.0.0.1:8080 [/127.0.0.1] failed: Connection refused: connect", 4810, 7.4067230255154675, 5.755309602153754], "isController": false}, {"data": ["Non HTTP response code: java.net.BindException/Non HTTP response message: Address already in use: connect", 59744, 91.9973514420782, 71.48549207298834], "isController": false}, {"data": ["404/Not Found", 387, 0.595925532406338, 0.46305713431049955], "isController": false}]}, function(index, item){
        switch(index){
            case 2:
            case 3:
                item = item.toFixed(2) + '%';
                break;
        }
        return item;
    }, [[1, 1]]);

        // Create top5 errors by sampler
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 83575, 64941, "Non HTTP response code: java.net.BindException/Non HTTP response message: Address already in use: connect", 59744, "Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to 127.0.0.1:8080 [/127.0.0.1] failed: Connection refused: connect", 4810, "404/Not Found", 387, "", "", "", ""], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": [], "isController": false}, {"data": ["SeleccionTarifaYCantidad [500 usuarios]", 26609, 21461, "Non HTTP response code: java.net.BindException/Non HTTP response message: Address already in use: connect", 19908, "Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to 127.0.0.1:8080 [/127.0.0.1] failed: Connection refused: connect", 1553, "", "", "", "", "", ""], "isController": false}, {"data": [], "isController": false}, {"data": ["Tarifas [500 usuarios]", 27105, 21343, "Non HTTP response code: java.net.BindException/Non HTTP response message: Address already in use: connect", 19917, "Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to 127.0.0.1:8080 [/127.0.0.1] failed: Connection refused: connect", 1426, "", "", "", "", "", ""], "isController": false}, {"data": [], "isController": false}, {"data": ["Pago [500 usuarios]", 26607, 22137, "Non HTTP response code: java.net.BindException/Non HTTP response message: Address already in use: connect", 19919, "Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to 127.0.0.1:8080 [/127.0.0.1] failed: Connection refused: connect", 1831, "404/Not Found", 387, "", "", "", ""], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
