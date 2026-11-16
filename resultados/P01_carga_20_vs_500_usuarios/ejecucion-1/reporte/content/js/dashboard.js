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

    var data = {"OkPercent": 23.070844458279954, "KoPercent": 76.92915554172005};
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
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [0.23070844458279954, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [1.0, 500, 1500, "Pago [20 usuarios]"], "isController": false}, {"data": [0.20750103449573035, 500, 1500, "SeleccionTarifaYCantidad [500 usuarios]"], "isController": false}, {"data": [1.0, 500, 1500, "Tarifas [20 usuarios]"], "isController": false}, {"data": [0.22075715604801477, 500, 1500, "Tarifas [500 usuarios]"], "isController": false}, {"data": [1.0, 500, 1500, "SeleccionTarifaYCantidad [20 usuarios]"], "isController": false}, {"data": [0.1689118001204094, 500, 1500, "Pago [500 usuarios]"], "isController": false}]}, function(index, item){
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
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 83521, 64252, 76.92915554172005, 6.271632284096227, 0, 39, 7.0, 16.0, 20.0, 26.0, 309.2110621598608, 565.5467694295842, 14.606082793815482], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["Pago [20 usuarios]", 1089, 0, 0.0, 1.1322314049586781, 0, 3, 1.0, 2.0, 2.0, 2.0, 18.473595820115694, 5.249804120935046, 4.546236471356597], "isController": false}, {"data": ["SeleccionTarifaYCantidad [500 usuarios]", 26583, 21067, 79.24989655042697, 6.7473949516608425, 0, 39, 7.0, 16.0, 20.0, 26.0, 448.1363475446316, 836.2633336283484, 22.257077464640332], "isController": false}, {"data": ["Tarifas [20 usuarios]", 1109, 0, 0.0, 1.0351668169522104, 0, 13, 1.0, 1.0, 2.0, 2.0, 18.511408970271578, 8.532602572234556, 2.350081216929009], "isController": false}, {"data": ["Tarifas [500 usuarios]", 27075, 21098, 77.92428439519853, 6.175290858725759, 0, 35, 6.0, 16.0, 19.0, 26.0, 449.7583016329175, 846.5846738525557, 12.60484107917075], "isController": false}, {"data": ["SeleccionTarifaYCantidad [20 usuarios]", 1089, 0, 0.0, 1.494949494949495, 1, 3, 1.0, 2.0, 2.0, 3.0, 18.469209504265386, 4.954543792293472, 4.420707954564727], "isController": false}, {"data": ["Pago [500 usuarios]", 26576, 22087, 83.10881998795907, 6.5187387116194815, 0, 34, 7.0, 15.0, 17.0, 24.0, 448.0183415094658, 861.0596480996813, 20.174603494453716], "isController": false}]}, function(index, item){
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
    createTable($("#errorsTable"), {"supportsControllersDiscrimination": false, "titles": ["Type of error", "Number of errors", "% in errors", "% in all samples"], "items": [{"data": ["Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to 127.0.0.1:8080 [/127.0.0.1] failed: Connection refused: connect", 3811, 5.931332876797609, 4.562924294488811], "isController": false}, {"data": ["Non HTTP response code: java.net.BindException/Non HTTP response message: Address already in use: connect", 60050, 93.46012575484032, 71.89808551142826], "isController": false}, {"data": ["404/Not Found", 391, 0.6085413683620743, 0.4681457358029717], "isController": false}]}, function(index, item){
        switch(index){
            case 2:
            case 3:
                item = item.toFixed(2) + '%';
                break;
        }
        return item;
    }, [[1, 1]]);

        // Create top5 errors by sampler
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 83521, 64252, "Non HTTP response code: java.net.BindException/Non HTTP response message: Address already in use: connect", 60050, "Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to 127.0.0.1:8080 [/127.0.0.1] failed: Connection refused: connect", 3811, "404/Not Found", 391, "", "", "", ""], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": [], "isController": false}, {"data": ["SeleccionTarifaYCantidad [500 usuarios]", 26583, 21067, "Non HTTP response code: java.net.BindException/Non HTTP response message: Address already in use: connect", 20023, "Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to 127.0.0.1:8080 [/127.0.0.1] failed: Connection refused: connect", 1044, "", "", "", "", "", ""], "isController": false}, {"data": [], "isController": false}, {"data": ["Tarifas [500 usuarios]", 27075, 21098, "Non HTTP response code: java.net.BindException/Non HTTP response message: Address already in use: connect", 20010, "Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to 127.0.0.1:8080 [/127.0.0.1] failed: Connection refused: connect", 1088, "", "", "", "", "", ""], "isController": false}, {"data": [], "isController": false}, {"data": ["Pago [500 usuarios]", 26576, 22087, "Non HTTP response code: java.net.BindException/Non HTTP response message: Address already in use: connect", 20017, "Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to 127.0.0.1:8080 [/127.0.0.1] failed: Connection refused: connect", 1679, "404/Not Found", 391, "", "", "", ""], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
