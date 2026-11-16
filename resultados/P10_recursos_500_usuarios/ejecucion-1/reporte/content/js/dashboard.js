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

    var data = {"OkPercent": 12.525609506248719, "KoPercent": 87.47439049375129};
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
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [0.1252560950624872, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [1.0, 500, 1500, "SeleccionTarifaYCantidad [020 usuarios]"], "isController": false}, {"data": [0.10752095714117045, 500, 1500, "SeleccionTarifaYCantidad [500 usuarios]"], "isController": false}, {"data": [1.0, 500, 1500, "Pago [020 usuarios]"], "isController": false}, {"data": [0.11429629340920607, 500, 1500, "Tarifas [500 usuarios]"], "isController": false}, {"data": [0.09819935058545705, 500, 1500, "Pago [500 usuarios]"], "isController": false}, {"data": [1.0, 500, 1500, "Tarifas [020 usuarios]"], "isController": false}]}, function(index, item){
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
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 156192, 136628, 87.47439049375129, 6.547448012702286, 0, 40, 6.0, 14.0, 17.0, 24.0, 473.2201828747326, 960.7823829547555, 12.042097157125024], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["SeleccionTarifaYCantidad [020 usuarios]", 1075, 0, 0.0, 1.726511627906977, 1, 10, 2.0, 2.0, 2.0, 3.0, 18.340328249223735, 4.919966326304296, 4.389832873758829], "isController": false}, {"data": ["SeleccionTarifaYCantidad [500 usuarios]", 50818, 45354, 89.24790428588295, 7.237927506001828, 0, 39, 7.0, 15.0, 20.0, 25.0, 425.58643965596656, 875.8130346734279, 10.952127950517976], "isController": false}, {"data": ["Pago [020 usuarios]", 1075, 0, 0.0, 1.173953488372093, 0, 3, 1.0, 2.0, 2.0, 2.0, 18.346275279460702, 5.213605443083881, 4.514903682054783], "isController": false}, {"data": ["Tarifas [500 usuarios]", 51314, 45449, 88.57037065907939, 6.0814787387457745, 0, 40, 5.0, 14.0, 18.0, 26.0, 427.1076966614784, 882.663377574016, 6.1974486913511395], "isController": false}, {"data": ["Pago [500 usuarios]", 50815, 45825, 90.18006494145429, 6.661182721637338, 0, 36, 6.0, 14.0, 16.0, 22.0, 425.6112167379997, 882.7579925121238, 10.565340802015193], "isController": false}, {"data": ["Tarifas [020 usuarios]", 1095, 0, 0.0, 1.0694063926940613, 0, 15, 1.0, 1.0, 2.0, 2.0, 18.28260397709248, 8.427137770691065, 2.321033708029319], "isController": false}]}, function(index, item){
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
    createTable($("#errorsTable"), {"supportsControllersDiscrimination": false, "titles": ["Type of error", "Number of errors", "% in errors", "% in all samples"], "items": [{"data": ["Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to 127.0.0.1:8080 [/127.0.0.1] failed: Connection refused: connect", 1442, 1.055420558011535, 0.9232227002663389], "isController": false}, {"data": ["Non HTTP response code: java.net.BindException/Non HTTP response message: Address already in use: connect", 135044, 98.84064759785696, 86.46025404630198], "isController": false}, {"data": ["404/Not Found", 142, 0.10393184413151038, 0.09091374718295431], "isController": false}]}, function(index, item){
        switch(index){
            case 2:
            case 3:
                item = item.toFixed(2) + '%';
                break;
        }
        return item;
    }, [[1, 1]]);

        // Create top5 errors by sampler
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 156192, 136628, "Non HTTP response code: java.net.BindException/Non HTTP response message: Address already in use: connect", 135044, "Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to 127.0.0.1:8080 [/127.0.0.1] failed: Connection refused: connect", 1442, "404/Not Found", 142, "", "", "", ""], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": [], "isController": false}, {"data": ["SeleccionTarifaYCantidad [500 usuarios]", 50818, 45354, "Non HTTP response code: java.net.BindException/Non HTTP response message: Address already in use: connect", 45004, "Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to 127.0.0.1:8080 [/127.0.0.1] failed: Connection refused: connect", 350, "", "", "", "", "", ""], "isController": false}, {"data": [], "isController": false}, {"data": ["Tarifas [500 usuarios]", 51314, 45449, "Non HTTP response code: java.net.BindException/Non HTTP response message: Address already in use: connect", 45045, "Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to 127.0.0.1:8080 [/127.0.0.1] failed: Connection refused: connect", 404, "", "", "", "", "", ""], "isController": false}, {"data": ["Pago [500 usuarios]", 50815, 45825, "Non HTTP response code: java.net.BindException/Non HTTP response message: Address already in use: connect", 44995, "Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to 127.0.0.1:8080 [/127.0.0.1] failed: Connection refused: connect", 688, "404/Not Found", 142, "", "", "", ""], "isController": false}, {"data": [], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
