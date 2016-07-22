(function($){
    $.fn.extend({
        tableExport: function(options) {
            var defaults = {
                separator: ',',
                ignoreColumn: [],
                tableName:'yourTableName',
                type:'csv',
                pdfFontSize:14,
                pdfLeftMargin:20,
                escape:'true',
                htmlContent:'false',
                consoleLog:'false'
            };

            var options = $.extend(defaults, options);
            var el = this;

            if(defaults.type == 'csv' || defaults.type == 'txt'){

                // Header
                var tdData ="";
                $(el).find('thead').find('tr').each(function() {
                    tdData += "\n";
                    $(this).filter(':visible').find('th').each(function(index,data) {
                        if ($(this).css('display') != 'none'){
                            if(defaults.ignoreColumn.indexOf(index) == -1){
                                tdData += '"' + parseString($(this)) + '"' + defaults.separator;
                            }
                        }

                    });
                    tdData = $.trim(tdData);
                    tdData = $.trim(tdData).substring(0, tdData.length -1);
                });

                // // Row vs Column
                $(el).dataTable().fnGetData().forEach(data => {
                    tdData += "\n";
                    data.forEach(col => {
                        tdData += '"'+ extractContent(col) + '"'+ defaults.separator;
                    });
                    tdData = $.trim(tdData).substring(0, tdData.length -1);
                });

                //output
                if(defaults.consoleLog == 'true'){
                    console.log(tdData);
                }
                tdData = unescape(encodeURIComponent(tdData));
                var base64data = "base64," + $.base64.encode(tdData);
                window.open('data:application/'+defaults.type+';filename=exportData;' + base64data);
            }else if(defaults.type == 'sql'){

                // Header
                var tdData ="INSERT INTO `"+defaults.tableName+"` (";
                $(el).find('thead').find('tr').each(function() {

                    $(this).filter(':visible').find('th').each(function(index,data) {
                        if ($(this).css('display') != 'none'){
                            if(defaults.ignoreColumn.indexOf(index) == -1){
                                tdData += '`' + parseString($(this)) + '`,' ;
                            }
                        }

                    });
                    tdData = $.trim(tdData);
                    tdData = $.trim(tdData).substring(0, tdData.length -1);
                });
                tdData += ") VALUES ";

                // Row vs Column
                $(el).dataTable().fnGetData().forEach(data => {
                    tdData += "(";
                    data.forEach(col => {
                        tdData += '"'+ extractContent(col) + '"'+ '",';
                    });
                    tdData = $.trim(tdData).substring(0, tdData.length -1);
                    tdData += "),";
                });

                tdData = $.trim(tdData).substring(0, tdData.length -1);
                tdData += ";";

                //output
                //console.log(tdData);

                if(defaults.consoleLog == 'true'){
                    console.log(tdData);
                }
                tdData = unescape(encodeURIComponent(tdData));
                var base64data = "base64," + $.base64.encode(tdData);
                window.open('data:application/sql;filename=exportData;' + base64data);


            } else if(defaults.type == 'json'){

                var jsonHeaderArray = [];
                $(el).find('thead').find('tr').each(function() {
                    var jsonArrayTd = [];

                    $(this).filter(':visible').find('th').each(function(index,data) {
                        if ($(this).css('display') != 'none'){
                            if(defaults.ignoreColumn.indexOf(index) == -1){
                                jsonArrayTd.push(parseString($(this)));
                            }
                        }
                    });
                    jsonHeaderArray.push(jsonArrayTd);

                });

                var jsonArray = [];
                $(el).dataTable().fnGetData().forEach(data => {
                    var jsonArrayTd = [];

                    data.forEach(col => {
                        jsonArrayTd.push(extractContent(col));
                    });
                });

                var jsonExportArray =[];
                jsonExportArray.push({header:jsonHeaderArray,data:jsonArray});

                //Return as JSON
                //console.log(JSON.stringify(jsonExportArray));

                //Return as Array
                //console.log(jsonExportArray);
                if(defaults.consoleLog == 'true'){
                    console.log(JSON.stringify(jsonExportArray));
                }
                var tdData = unescape(encodeURIComponent(JSON.stringify(jsonExportArray)));
                var base64data = "base64," + $.base64.encode(tdData);
                window.open('data:application/json;filename=exportData;' + base64data);
            }else if(defaults.type == 'xml'){

                var xml = '<?xml version="1.0" encoding="utf-8"?>';
                xml += '<tabledata><fields>';

                // Header
                $(el).find('thead').find('tr').each(function() {
                    $(this).filter(':visible').find('th').each(function(index,data) {
                        if ($(this).css('display') != 'none'){
                            if(defaults.ignoreColumn.indexOf(index) == -1){
                                xml += "<field>" + parseString($(this)) + "</field>";
                            }
                        }
                    });
                });
                xml += '</fields><data>';

                // Row Vs Column
                var rowCount=1;
                $(el).dataTable().fnGetData().forEach(data => {
                    xml += '<row id="'+rowCount+'">';
                    var colCount=0;
                    data.forEach(col => {
                        xml += "<column-"+colCount+">"+extractContent(col)+"</column-"+colCount+">";
                        colCount++;
                    });
                    rowCount++;
                    xml += '</row>';
                });

                xml += '</data></tabledata>'

                if(defaults.consoleLog == 'true'){
                    console.log(xml);
                }

                xml = unescape(encodeURIComponent(xml));
                var base64data = "base64," + $.base64.encode(xml);
                window.open('data:application/xml;filename=exportData;' + base64data);

            } else if(defaults.type == 'excel' || defaults.type == 'doc'|| defaults.type == 'powerpoint'  ){
                //console.log($(this).html());
                var excel="<table>";
                // Header
                $(el).find('thead').find('tr').each(function() {
                    excel += "<tr>";
                    $(this).filter(':visible').find('th').each(function(index,data) {
                        if ($(this).css('display') != 'none'){
                            if(defaults.ignoreColumn.indexOf(index) == -1){
                                excel += "<td>" + parseString($(this))+ "</td>";
                            }
                        }
                    });
                    excel += '</tr>';

                });


                // Row Vs Column
                var rowCount=1;
                $(el).dataTable().fnGetData().forEach(data => {
                    excel += "<tr>";
                    data.forEach(col => {
                        excel += "<td>"+extractContent(col)+"</td>";
                    });
                    rowCount++;
                    excel += '</tr>';
                });

                excel += '</table>'

                if(defaults.consoleLog == 'true'){
                    console.log(excel);
                }

                var excelFile = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:x='urn:schemas-microsoft-com:office:"+defaults.type+"' xmlns='http://www.w3.org/TR/REC-html40'>";
                excelFile += "<head>";
                excelFile += "<!--[if gte mso 9]>";
                excelFile += "<xml>";
                excelFile += "<x:ExcelWorkbook>";
                excelFile += "<x:ExcelWorksheets>";
                excelFile += "<x:ExcelWorksheet>";
                excelFile += "<x:Name>";
                excelFile += "{worksheet}";
                excelFile += "</x:Name>";
                excelFile += "<x:WorksheetOptions>";
                excelFile += "<x:DisplayGridlines/>";
                excelFile += "</x:WorksheetOptions>";
                excelFile += "</x:ExcelWorksheet>";
                excelFile += "</x:ExcelWorksheets>";
                excelFile += "</x:ExcelWorkbook>";
                excelFile += "</xml>";
                excelFile += "<![endif]-->";
                excelFile += "</head>";
                excelFile += "<body>";
                excelFile += excel;
                excelFile += "</body>";
                excelFile += "</html>";

                excelFile = unescape(encodeURIComponent(excelFile));
                var base64data = "base64," + $.base64.encode(excelFile);
                window.open('data:application/vnd.ms-'+defaults.type+';filename=exportData.doc;' + base64data);

            }else if(defaults.type == 'png'){
                html2canvas($(el), {
                    onrendered: function(canvas) {
                        var img = canvas.toDataURL("image/png");
                        window.open(img);


                    }
                });
            } else if(defaults.type == 'pdf'){

                var doc = new jsPDF('p','pt', 'a4', true);
                doc.setFontSize(defaults.pdfFontSize);

                // Header
                var startColPosition=defaults.pdfLeftMargin;
                $(el).find('thead').find('tr').each(function() {
                    $(this).filter(':visible').find('th').each(function(index,data) {
                        if ($(this).css('display') != 'none'){
                            if(defaults.ignoreColumn.indexOf(index) == -1){
                                var colPosition = startColPosition+ (index * 50);
                                doc.text(colPosition,20, parseString($(this)));
                            }
                        }
                    });
                });


                // Row Vs Column
                var startRowPosition = 20; var page =1;var rowPosition=0;
                $(el).find('tbody').find('tr').each(function(index,data) {
                    rowCalc = index+1;

                    if (rowCalc % 26 == 0){
                        doc.addPage();
                        page++;
                        startRowPosition=startRowPosition+10;
                    }
                    rowPosition=(startRowPosition + (rowCalc * 10)) - ((page -1) * 280);

                    $(this).filter(':visible').find('td').each(function(index,data) {
                        if ($(this).css('display') != 'none'){
                            if(defaults.ignoreColumn.indexOf(index) == -1){
                                var colPosition = startColPosition+ (index * 50);
                                doc.text(colPosition,rowPosition, parseString($(this)));
                            }
                        }

                    });

                    $(el).dataTable().fnGetData().forEach(data => {
                        let index = 0;
                        data.forEach(col => {
                            var colPosition = startColPosition+ (index * 50);
                            doc.text(colPosition,rowPosition, extractContent(col));
                            index++;
                        });
                        rowCount++;
                        excel += '</tr>';
                    });

                });

                // Output as Data URI
                doc.output('datauri');

            }


            function parseString(data){

                if(defaults.htmlContent == 'true'){
                    content_data = data.html().trim();
                }else{
                    content_data = data.text().trim();
                }

                if(defaults.escape == 'true'){
                    content_data = escape(content_data);
                }



                return content_data;
            }

        }
    });
})(jQuery);

function extractContent(s) {
    var div= document.createElement('div');
    div.innerHTML= s;
    return div.innerText.trim();
};