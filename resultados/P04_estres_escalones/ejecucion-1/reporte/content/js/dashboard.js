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

    var data = {"OkPercent": 39.32662937158939, "KoPercent": 60.67337062841061};
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
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [0.3932662937158939, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [1.0, 500, 1500, "Pago [050 usuarios]"], "isController": false}, {"data": [0.424081484176064, 500, 1500, "Tarifas [250 usuarios]"], "isController": false}, {"data": [0.39577621341237496, 500, 1500, "Pago [250 usuarios]"], "isController": false}, {"data": [0.9998190372783207, 500, 1500, "Tarifas [100 usuarios]"], "isController": false}, {"data": [1.0, 500, 1500, "SeleccionTarifaYCantidad [050 usuarios]"], "isController": false}, {"data": [0.9998157361341441, 500, 1500, "SeleccionTarifaYCantidad [100 usuarios]"], "isController": false}, {"data": [0.20947874417905962, 500, 1500, "SeleccionTarifaYCantidad [500 usuarios]"], "isController": false}, {"data": [0.4161541311596888, 500, 1500, "SeleccionTarifaYCantidad [250 usuarios]"], "isController": false}, {"data": [1.0, 500, 1500, "Tarifas [050 usuarios]"], "isController": false}, {"data": [0.218489564127148, 500, 1500, "Tarifas [500 usuarios]"], "isController": false}, {"data": [0.9987099152230003, 500, 1500, "Pago [100 usuarios]"], "isController": false}, {"data": [0.1664412891593419, 500, 1500, "Pago [500 usuarios]"], "isController": false}]}, function(index, item){
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
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 145685, 88392, 60.67337062841061, 4.452716477331152, 0, 41, 7.0, 15.0, 19.0, 24.0, 211.1318673833619, 320.1053102794995, 16.87922978615444], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["Pago [050 usuarios]", 2717, 0, 0.0, 1.132867132867132, 0, 7, 1.0, 2.0, 2.0, 2.0, 46.32250144917653, 13.164113780603198, 11.399678091008285], "isController": false}, {"data": ["Tarifas [250 usuarios]", 13745, 7916, 57.591851582393595, 2.221535103674053, 0, 22, 2.0, 3.0, 5.0, 10.0, 229.0184447739807, 344.94699158155186, 12.330002593015312], "isController": false}, {"data": ["Pago [250 usuarios]", 13495, 8154, 60.422378658762504, 2.462912189699887, 0, 24, 2.0, 4.0, 7.0, 11.0, 227.25741807281668, 337.93959948932337, 22.253330396837427], "isController": false}, {"data": ["Tarifas [100 usuarios]", 5526, 1, 0.018096272167933407, 1.1927252985884909, 0, 4, 1.0, 2.0, 2.0, 3.0, 92.10460523026151, 42.4890059607147, 11.690851469656817], "isController": false}, {"data": ["SeleccionTarifaYCantidad [050 usuarios]", 2719, 0, 0.0, 1.417065097462299, 0, 7, 1.0, 2.0, 2.0, 3.0, 46.33132263231435, 12.429098294312102, 11.089806874723102], "isController": false}, {"data": ["SeleccionTarifaYCantidad [100 usuarios]", 5427, 1, 0.018426386585590565, 1.5531601252994278, 0, 5, 1.0, 2.0, 3.0, 3.0, 91.782374131137, 24.659701933484417, 21.964324030932367], "isController": false}, {"data": ["SeleccionTarifaYCantidad [500 usuarios]", 26628, 21050, 79.05212558209404, 6.711732011416527, 0, 41, 7.0, 15.0, 20.0, 25.0, 447.973620901398, 833.6889139545935, 22.461052503743208], "isController": false}, {"data": ["SeleccionTarifaYCantidad [250 usuarios]", 13495, 7879, 58.38458688403112, 2.525972582437932, 0, 24, 2.0, 4.0, 5.0, 10.0, 227.25741807281668, 327.19145874381127, 22.63739695951635], "isController": false}, {"data": ["Tarifas [050 usuarios]", 2767, 0, 0.0, 1.041199855439104, 0, 15, 1.0, 1.0, 2.0, 2.0, 46.19751231321479, 21.29416583187244, 5.864918555388597], "isController": false}, {"data": ["Tarifas [500 usuarios]", 27118, 21193, 78.1510435872852, 6.205103621210972, 0, 33, 6.0, 16.0, 19.0, 25.0, 451.718221644762, 852.1339630390785, 12.529729742391684], "isController": false}, {"data": ["Pago [100 usuarios]", 5426, 7, 0.12900847769996315, 1.328050129008475, 0, 4, 1.0, 2.0, 2.0, 3.0, 91.78719445149287, 26.310508384081874, 22.563095370252896], "isController": false}, {"data": ["Pago [500 usuarios]", 26622, 22191, 83.35587108406581, 6.453534670573248, 0, 32, 7.0, 15.0, 17.0, 23.0, 447.9857301517854, 868.7808517894103, 19.33967113510921], "isController": false}]}, function(index, item){
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
    createTable($("#errorsTable"), {"supportsControllersDiscrimination": false, "titles": ["Type of error", "Number of errors", "% in errors", "% in all samples"], "items": [{"data": ["Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to 127.0.0.1:8080 [/127.0.0.1] failed: Connection refused: connect", 4439, 5.021947687573536, 3.046984933246388], "isController": false}, {"data": ["Non HTTP response code: java.net.BindException/Non HTTP response message: Address already in use: connect", 83672, 94.6601502398407, 57.43350379242887], "isController": false}, {"data": ["404/Not Found", 281, 0.31790207258575437, 0.19288190273535366], "isController": false}]}, function(index, item){
        switch(index){
            case 2:
            case 3:
                item = item.toFixed(2) + '%';
                break;
        }
        return item;
    }, [[1, 1]]);

        // Create top5 errors by sampler
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 145685, 88392, "Non HTTP response code: java.net.BindException/Non HTTP response message: Address already in use: connect", 83672, "Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to 127.0.0.1:8080 [/127.0.0.1] failed: Connection refused: connect", 4439, "404/Not Found", 281, "", "", "", ""], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": [], "isController": false}, {"data": ["Tarifas [250 usuarios]", 13745, 7916, "Non HTTP response code: java.net.BindException/Non HTTP response message: Address already in use: connect", 7783, "Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to 127.0.0.1:8080 [/127.0.0.1] failed: Connection refused: connect", 133, "", "", "", "", "", ""], "isController": false}, {"data": ["Pago [250 usuarios]", 13495, 8154, "Non HTTP response code: java.net.BindException/Non HTTP response message: Address already in use: connect", 7780, "Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to 127.0.0.1:8080 [/127.0.0.1] failed: Connection refused: connect", 344, "404/Not Found", 30, "", "", "", ""], "isController": false}, {"data": ["Tarifas [100 usuarios]", 5526, 1, "Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to 127.0.0.1:8080 [/127.0.0.1] failed: Connection refused: connect", 1, "", "", "", "", "", "", "", ""], "isController": false}, {"data": [], "isController": false}, {"data": ["SeleccionTarifaYCantidad [100 usuarios]", 5427, 1, "Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to 127.0.0.1:8080 [/127.0.0.1] failed: Connection refused: connect", 1, "", "", "", "", "", "", "", ""], "isController": false}, {"data": ["SeleccionTarifaYCantidad [500 usuarios]", 26628, 21050, "Non HTTP response code: java.net.BindException/Non HTTP response message: Address already in use: connect", 20117, "Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to 127.0.0.1:8080 [/127.0.0.1] failed: Connection refused: connect", 933, "", "", "", "", "", ""], "isController": false}, {"data": ["SeleccionTarifaYCantidad [250 usuarios]", 13495, 7879, "Non HTTP response code: java.net.BindException/Non HTTP response message: Address already in use: connect", 7781, "Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to 127.0.0.1:8080 [/127.0.0.1] failed: Connection refused: connect", 98, "", "", "", "", "", ""], "isController": false}, {"data": [], "isController": false}, {"data": ["Tarifas [500 usuarios]", 27118, 21193, "Non HTTP response code: java.net.BindException/Non HTTP response message: Address already in use: connect", 20102, "Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to 127.0.0.1:8080 [/127.0.0.1] failed: Connection refused: connect", 1091, "", "", "", "", "", ""], "isController": false}, {"data": ["Pago [100 usuarios]", 5426, 7, "Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to 127.0.0.1:8080 [/127.0.0.1] failed: Connection refused: connect", 6, "404/Not Found", 1, "", "", "", "", "", ""], "isController": false}, {"data": ["Pago [500 usuarios]", 26622, 22191, "Non HTTP response code: java.net.BindException/Non HTTP response message: Address already in use: connect", 20109, "Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to 127.0.0.1:8080 [/127.0.0.1] failed: Connection refused: connect", 1832, "404/Not Found", 250, "", "", "", ""], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
