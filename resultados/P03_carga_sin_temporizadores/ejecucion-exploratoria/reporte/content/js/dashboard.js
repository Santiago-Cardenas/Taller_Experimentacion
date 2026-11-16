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

    var data = {"OkPercent": 3.4902485504602034, "KoPercent": 96.50975144953979};
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
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [0.03490248550460204, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [0.06481221316849302, 500, 1500, "SeleccionTarifaYCantidad [con temporizador]"], "isController": false}, {"data": [0.04405990726100165, 500, 1500, "SeleccionTarifaYCantidad [sin temporizador]"], "isController": false}, {"data": [0.04099896126494846, 500, 1500, "Tarifas [sin temporizador]"], "isController": false}, {"data": [0.06419571415432723, 500, 1500, "Tarifas [con temporizador]"], "isController": false}, {"data": [0.012878740745349344, 500, 1500, "Pago [sin temporizador]"], "isController": false}, {"data": [0.04637871263937037, 500, 1500, "Pago [con temporizador]"], "isController": false}]}, function(index, item){
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
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 369945, 357033, 96.50975144953979, 4.967424887483139, 0, 233, 6.0, 25.0, 35.0, 54.0, 3087.3258948317157, 7449.7365048935135, 27.732681477776296], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["SeleccionTarifaYCantidad [con temporizador]", 10677, 9985, 93.5187786831507, 2.5703849395897715, 0, 15, 2.0, 4.0, 6.0, 8.0, 180.99677911510426, 387.6615574408798, 2.8065701019240548], "isController": false}, {"data": ["SeleccionTarifaYCantidad [sin temporizador]", 112574, 107614, 95.59400927389983, 5.277986035851995, 0, 233, 5.0, 24.0, 34.0, 52.0, 1874.3901829867298, 4559.508101538696, 19.773980065435655], "isController": false}, {"data": ["Tarifas [sin temporizador]", 112637, 108019, 95.90010387350516, 5.1212123902448194, 0, 180, 5.0, 24.0, 34.0, 52.0, 1875.3767003546395, 4589.563988850919, 9.761234931985815], "isController": false}, {"data": ["Tarifas [con temporizador]", 10873, 10175, 93.58042858456727, 2.33698151384162, 0, 36, 2.0, 4.0, 5.0, 8.0, 182.01754385964912, 392.35994495572186, 1.4834150470403107], "isController": false}, {"data": ["Pago [sin temporizador]", 112511, 111062, 98.71212592546506, 5.2006381598242895, 0, 198, 5.0, 24.0, 34.0, 51.0, 1873.4347941920876, 4561.7780501219695, 18.881644709729255], "isController": false}, {"data": ["Pago [con temporizador]", 10673, 10178, 95.36212873606296, 2.6879977513351436, 0, 16, 2.0, 5.0, 7.0, 9.0, 181.0763123070137, 388.8223142029453, 2.733536649375657], "isController": false}]}, function(index, item){
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
    createTable($("#errorsTable"), {"supportsControllersDiscrimination": false, "titles": ["Type of error", "Number of errors", "% in errors", "% in all samples"], "items": [{"data": ["Non HTTP response code: java.net.BindException/Non HTTP response message: Address already in use: connect", 31311, 8.76977758358471, 8.46369054859506], "isController": false}, {"data": ["Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to 127.0.0.1:8080 [/127.0.0.1] failed: Connection refused: connect", 322250, 90.25776328798739, 87.1075430131506], "isController": false}, {"data": ["404/Not Found", 3470, 0.9718989561189022, 0.9379772668910243], "isController": false}, {"data": ["Non HTTP response code: java.net.SocketException/Non HTTP response message: No buffer space available (maximum connections reached?): connect", 2, 5.601723090022491E-4, 5.406209031072187E-4], "isController": false}]}, function(index, item){
        switch(index){
            case 2:
            case 3:
                item = item.toFixed(2) + '%';
                break;
        }
        return item;
    }, [[1, 1]]);

        // Create top5 errors by sampler
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 369945, 357033, "Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to 127.0.0.1:8080 [/127.0.0.1] failed: Connection refused: connect", 322250, "Non HTTP response code: java.net.BindException/Non HTTP response message: Address already in use: connect", 31311, "404/Not Found", 3470, "Non HTTP response code: java.net.SocketException/Non HTTP response message: No buffer space available (maximum connections reached?): connect", 2, "", ""], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": ["SeleccionTarifaYCantidad [con temporizador]", 10677, 9985, "Non HTTP response code: java.net.BindException/Non HTTP response message: Address already in use: connect", 9978, "Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to 127.0.0.1:8080 [/127.0.0.1] failed: Connection refused: connect", 7, "", "", "", "", "", ""], "isController": false}, {"data": ["SeleccionTarifaYCantidad [sin temporizador]", 112574, 107614, "Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to 127.0.0.1:8080 [/127.0.0.1] failed: Connection refused: connect", 107233, "Non HTTP response code: java.net.BindException/Non HTTP response message: Address already in use: connect", 381, "", "", "", "", "", ""], "isController": false}, {"data": ["Tarifas [sin temporizador]", 112637, 108019, "Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to 127.0.0.1:8080 [/127.0.0.1] failed: Connection refused: connect", 107603, "Non HTTP response code: java.net.BindException/Non HTTP response message: Address already in use: connect", 416, "", "", "", "", "", ""], "isController": false}, {"data": ["Tarifas [con temporizador]", 10873, 10175, "Non HTTP response code: java.net.BindException/Non HTTP response message: Address already in use: connect", 10160, "Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to 127.0.0.1:8080 [/127.0.0.1] failed: Connection refused: connect", 15, "", "", "", "", "", ""], "isController": false}, {"data": ["Pago [sin temporizador]", 112511, 111062, "Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to 127.0.0.1:8080 [/127.0.0.1] failed: Connection refused: connect", 107379, "404/Not Found", 3303, "Non HTTP response code: java.net.BindException/Non HTTP response message: Address already in use: connect", 378, "Non HTTP response code: java.net.SocketException/Non HTTP response message: No buffer space available (maximum connections reached?): connect", 2, "", ""], "isController": false}, {"data": ["Pago [con temporizador]", 10673, 10178, "Non HTTP response code: java.net.BindException/Non HTTP response message: Address already in use: connect", 9998, "404/Not Found", 167, "Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to 127.0.0.1:8080 [/127.0.0.1] failed: Connection refused: connect", 13, "", "", "", ""], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
