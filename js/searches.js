$(document).ready(function(){
	$.namespace('IMPC');
		
	//scoring matrix for ordering gene names	
	IMPC.geneMatrix = {
		id          : { equal : 15, substr : 15 },	
		GeneSymbol  : { equal : 15, substr : 8 },
		GeneName    : { equal : 3,  substr : 2 },
		GeneSynonym : { equal : 2,  substr : 1 }		
	};

	doAutoComplete();
});

function doAutoComplete(){

	//var url = "/PhenotypeArchive/komp2/autosuggestGenericSearch";
	var params = {'start':0, 'rows':50, 'wt':'json', 'group':'on', 'group.field':'id', 'defType':'edismax', 'qf':'text'};
	//var params = {'start':0, 'rows':50, 'wt':'json', 'group':'on', 'group.field':'id'};
	
	//var solrUrl = "http://localhost:8983/solr/select";
	//var solrUrl = "http://192.168.1.9:8983/solr/select";
	var solrUrl = "http://172.22.69.171:8983/solr/select";
	//var solrUrl = "http://wwwdev.ebi.ac.uk/mi/solr/autosuggest/select";
	
 	$( "#tags" ).autocomplete({ 			
 		//source : url,
 		create : function(event, ui){
 			params.q = 'pax'; // set as default display data when started
 			
 			$('input#tags').val('').click(function(){
 				$(this).val(''); 			
 			}); 			
 			// preload an arbitrarily chosen search keyword: pax
 			IMPC.searchKW = 'pax'; // default search when application starts so that something appears in table
 			/*$.ajax({   					
 					url: url + "?maxRow=50&url=http://localhost:8983/solr/&mode=kw&term="+ IMPC.searchKW, 					
 					success:function(jsonResponse){ 
 						parseSolrGroupedJson1(jsonResponse);
 						makeTable();
 						$('table#geneStatus th').addClass('noImage');
 						$('span#loading').html('');
 						$('span#solrInfo').html('');
 					}
			});*/
 			$.ajax({ 				 					
 					'url': solrUrl, 					
 					'data': params,		
 					'dataType': 'jsonp',
 					'jsonp': 'json.wrf',
 					'success': function(json) { 
 						parseSolrGroupedJson(json);
 						makeTable();
 						$('table#geneStatus th').addClass('noImage');
 						$('span#loading').html('');
 						$('span#solrInfo').html(''); 						
 					}
 			}); 			
 		},
 		source: function(request, response){
 			IMPC.groups = false;
 			//console.log("query: " + request.term);
 			var query =  request.term; 			
 			
 			// trim away leading, trailing spaces
 			query = query.replace(/^\s+|\s+$/g, ""); 
 			//IMPC.searchKW = query.replace(/\*$/, '');
 			IMPC.searchKW = query;
 			
 			// parenthesis need to be escaped 			
 			//query = query.replace(/\(/g, "\\(");
 			//query = query.replace(/\)/g, "\\)");
 			
 			// dealing with phrase, 
 			// eg, paired box becomes paired AND box
 			//     paired box gene becomes paired box AND gene
 			//query = query.replace(/\s+(.+){0,}$/, " AND $1"); // not needed if use dismax query parser
 			
 			
 			// need to quote the query if does NOT contain 'AND',  '(', and '.'
 			// eg, S. cerevisiae, (Drosophila) will not be quoted
 			// NOTE this whole lot is not needed if use dismax query parser
 			/*if ( query.indexOf('AND') == -1  
 					&& query.indexOf('(') == -1 
 					&& query.indexOf('.') == -1 
 					&& query.indexOf('*') == -1) {
 				query = "\"" + query + "\"";
 			} */			
 			
 			query = query.replace(":", "\\:"); // so that mgi:* would work
 			
 			//console.log("ESC:---" + query +"---");
 			params.q = query; 			
 			
 			$('span#loading').html("<img src='../images/loading_small.gif' />");
 			$.ajax({					
 					'url': solrUrl, 
					'data': params,		
					'dataType': 'jsonp',
					'jsonp': 'json.wrf',
					'success': function(json) {  
						response( parseSolrGroupedJson(json) ); // works for asterisk
						//response( $.ui.autocomplete.filter(parseSolrGroupedJson(json), request.term));  // won't work for asterisk				 
						$('span#loading').html('');												
					}
			}); 
 			/*$.ajax({ 					  	
				  url: url + "?maxRow=200&url=http://localhost:8983/solr/&mode=kw",
				  //dataType: 'json', // server already returns json
				  data: request,					 
				  success:function(jsonResponse){					  
					  //console.log(parseSolrGroupedJson(jsonResponse));
					  //response( $.ui.autocomplete.filter(parseSolrGroupedJson1(jsonResponse), request.term) );
					  response( parseSolrGroupedJson1(jsonResponse) );
					  $('span#loading').html('');
				  }
 			});*/ 
 		}, 			
 		minLength: 1,
 		delay: 400, // millisec
 		focus: function(event, ui) {
 			//console.log(ui.item.value);  // value of hovered item
 		},
 		close : function(event, ui){  // result dropdown list closed
 			$('span#solrInfo').html('');
 		},	
 		select: function(event, ui) { 			
 			var val = ui.item.value.replace(/^(.+)\s(:)\s(.+)/, '$3');			
 			//alert('...selected:' + val + ' -> ' + IMPC.mapping[val]);  // value of hovered item
 			//params.q = IMPC.mapping[val].replace(":", "\\:"); // MGI gene id // not needed with edisMax 			
 			params.q = IMPC.mapping[val];
 			
 			$('span#loading').html("<img src='../images/loading_small.gif' />");
 			$.ajax({ 					
 					'url': solrUrl, 
 					'data': params,		
 					'dataType': 'jsonp',              
 					'jsonp': 'json.wrf',
 					'success': function(json) {
 						$('span#loading').html(''); 						
 						parseSolrGroupedJson(json);
 						makeTable();													
 					}
 			});
 			/*$.ajax({  
 					url: url + "?maxRow=100&url=http://localhost:8983/solr/&mode=id&term=" + IMPC.mapping[val],					
 					success:function(jsonResponse){ 						
 						parseSolrGroupedJson1(jsonResponse);
 						makeTable(); 																
 					}
			});*/
 		}
 	}).data('autocomplete')._renderItem = function( ul, item ) { 
 		//console.log(item);
 		// highlight the matching characters in string 		
 		 		
 		var term = this.term.split(' ').join('|'); 			
 		var wildCard = term.replace(/\*/g, "\\w+");
 		wildCard = wildCard.replace(/\(/g, "\\(");
 		wildCard = wildCard.replace(/\)/g, "\\)"); 	
 		
 		var re = new RegExp("(" + wildCard + ")", "gi") ;
 		var t = item.label.replace(re,"<b>$1</b>");
 		if ( t.indexOf("<b>") > -1 ){
 			return $( "<li></li>" )
 		     	.data( "item.autocomplete", item )
 		     	.append( "<a>" + t + "</a>" )
 		     	.appendTo( ul ); 			
 		}
 	}; 
 	$("#tags").keypress(function(e) { 		
 		if (e.keyCode == 13) {
 			$('ul.ui-autocomplete').hide();
 			makeTable(); 		
 			$('span#solrInfo').html(''); 			
 		}
 	}); 
}
function makeTable(){
	//"GeneSymbol", "id", "GeneName", "GeneSynonym";
	//console.log( "val: " + IMPC.groups[0].groupValue );
	//console.log( "val: " + IMPC.searchKW );
	
	var trs = '';	
	var aFields = ["GeneSymbol", "id", "GeneName", "GeneSynonym"];
	var oFieldsPretty = {GeneSymbol:'Gene Symbol', 
            GeneName:'Gene Name', 
            id:'MGI Id', 
            GeneSynonym:'Gene Synonym'           
            };	
	
	var ths = '';
	for ( i in aFields ){
		ths += "<th>" + oFieldsPretty[aFields[i]] + "</th>";
	}
	ths = "<th>Score</th>" + ths; // used for sorting
	
	var thead = "<thead><tr>" + ths + "</thead></tr>";
	
	var userQry = IMPC.searchKW.replace(/\*$/, '');
	var groups = IMPC.groups;
	for ( var i in groups ){
		var geneId = groups[i].groupValue;
		
		var tds = '';
		var docs = groups[i].doclist.docs;
		for ( var i in docs ){
			var score = 0;
			for ( var j in aFields ){
				if ( docs[i][aFields[j]] ){					
					var fld = aFields[j];
					var val = docs[i][fld];
					
					// get matching score
					//console.log(fld + ', ' +  val + ', ' + userQry);
					var subScore = fetch_name_matching_score(fld, val, userQry);					
					if ( typeof subScore == 'number' ){
						score += subScore;
					}
					
					tds += "<td>" + val + "</td>";					
				}
				else {
					tds += "<td>-</td>";
				}
			}
			//console.log(geneId + ' : '  + score );
			tds = "<td>"+score+"</td>" + tds;
			trs += "<tr>" + tds + "</tr>";
		}		
	}	
	var tbody = "<tbody>" + trs + "</tbody>";
	//console.log("<table id='geneStatus'>"+ thead + tbody + "</table>");
	$('div#geneStatusTable').html("<table id='geneStatus'>"+ thead + tbody + "</table>");	
	
	initDataTable($('table#geneStatus'));
}
/*
 * Natural Sort algorithm for Javascript Version 0.2
 * Author: Jim Palmer (based on chunking idea from Dave Koelle)
 * Released under MIT license.
 */
function naturalSort (a, b) {
        // setup temp-scope variables for comparison evauluation
        var x = a.toString().toLowerCase() || '', y = b.toString().toLowerCase() || '',
                nC = String.fromCharCode(0),
                xN = x.replace(/([-]{0,1}[0-9.]{1,})/g, nC + '$1' + nC).split(nC),
                yN = y.replace(/([-]{0,1}[0-9.]{1,})/g, nC + '$1' + nC).split(nC),
                xD = (new Date(x)).getTime(), yD = (new Date(y)).getTime();
        // natural sorting of dates
        if ( xD && yD && xD < yD )
                return -1;
        else if ( xD && yD && xD > yD )
                return 1;
        // natural sorting through split numeric strings and default strings
        for ( var cLoc=0, numS = Math.max( xN.length, yN.length ); cLoc < numS; cLoc++ )
                if ( ( parseFloat( xN[cLoc] ) || xN[cLoc] ) < ( parseFloat( yN[cLoc] ) || yN[cLoc] ) )
                        return -1;
                else if ( ( parseFloat( xN[cLoc] ) || xN[cLoc] ) > ( parseFloat( yN[cLoc] ) || yN[cLoc] ) )
                        return 1;
        return 0;
}

function initDataTable(jqObj){	
	
	// extend dataTable with naturalSort function
	jQuery.fn.dataTableExt.oSort['natural-asc']  = function(a,b) {
	    return naturalSort(a,b);
	};	 
	jQuery.fn.dataTableExt.oSort['natural-desc'] = function(a,b) {
	    return naturalSort(a,b) * -1;
	};
	 
	var oTbl = jqObj.dataTable({
		 "sPaginationType": "full_numbers",
		 "bProcessing": true,
		 "bSortClasses": false,	
		 "oLanguage": {
			 "sSearch": "Filter entries:"
	     }, 
	     "aaSorting": [[0, "desc"], [1, "asc"]],
	     // aoColumns should match all column in table 
	     "aoColumns": [
	                   null,	              
	                   { "sType": "natural" },  // the asc sorting of col. 1 from aaSorting renders natural-asc
	                   null,
	                   null,
	                   null
	                    ],
	 	 "fnRowCallback": function( nRow, aData, iDisplayIndex, iDisplayIndexFull ) {
	 		 var settings = this.fnSettings();
	 		 var text = settings.oPreviousSearch.sSearch;	 
	 		 // want to be wildcard searchable
	 		 var re = new RegExp(text.replace("*", "\\w+"), 'gi');
	 		 
	 		 // will be highlighted in dataTable	
	 		 $('td', nRow).each( function (i) {	 			
	 			// this.innerHTML = aData[i].replace( new RegExp( text, 'i'),	 			
	 			this.innerHTML = aData[i].replace(re,
	 					 function(match) { return "<span class='highlight'>"+match+"</span>";} );
	 		 } );
	 		 return nRow;
	    } 
	});
	
	// space, comma and dash causes problem, skip by default
	if ( IMPC.searchKW.search(/[-\s,]/) == -1 ){
		oTbl.fnFilter(IMPC.searchKW, null, true);// can take 6 arguments	
	}	
	
	$('div#geneStatus_wrapper').addClass('rounded-corners');
		
	// so that asc, desc icons appear when clicked to sort
	// needed as when data is loaded, it is sorted by score and not alphanumeric
	// so remove first to avoid confusion
	$('table#geneStatus th').addClass('noImage').click(function() {
		$(this).removeClass('noImage');
	});	
}	
function parseSolrGroupedJson(json){
	
	var maxRow   = json.responseHeader.params.rows;
	var g        = json.grouped.id;
	var numFound = g.matches;
	var groups   = g.groups;
	IMPC.groups = groups;
	
	var foundFilterMsg = "Max records to return: " + maxRow + ' ... Records found: ' + numFound;	
	$('span#solrInfo').html(foundFilterMsg);
	
	var aFields = ["GeneSymbol", "id", "GeneName", "GeneSynonym"];
	var oFieldsPretty = {GeneSymbol:'Gene Symbol', 
			             GeneName:'Gene Name', 
			             id:'MGI Id', 
			             GeneSynonym:'Gene Synonym'
			             };
	var list = [];	
	var mapping = {};

	for ( var i in groups ){
		var geneId = groups[i].groupValue;
		
		var docs = groups[i].doclist.docs;
		for ( var i in docs ){		
			for ( var j in aFields ){
				if ( docs[i][aFields[j]] ){					
					var fld = aFields[j];
					var val = docs[i][fld];
					mapping[val] = geneId;
					//console.log('**** ' + val + ' '+ mapping[val]);					
					//console.log(oFieldsPretty[fld] + " : " +  val + ' ' + geneId);
					list.push(oFieldsPretty[fld] + " : " +  val);
				}
			}	
		}		
	}
		
	IMPC.mapping = mapping;	
	return list;
}	
function parseSolrGroupedJson1(response){
	var json = eval("(" + response + ")");
	//console.log(json);
	var maxRow   = json.responseHeader.params.rows;
	var g        = json.grouped.id;
	var numFound = g.matches;  // problematic with "protein-" not what expected from autosuggest
	var groups   = g.groups;
	IMPC.groups = groups;		
	
	//console.log("Max number of records to return: " + maxRow + ' --- Records found: ' + numFound);
	$('span#solrInfo').html("Max records to return: " + maxRow + ' --- Records found: ' + numFound);
	
	var aFields = ["GeneSymbol", "id", "GeneName", "GeneSynonym"];
	var oFieldsPretty = {GeneSymbol:'Gene Symbol', 
			             GeneName:'Gene Name', 
			             id:'MGI Id', 
			             GeneSynonym:'Gene Synonym'
			             };
	var list = [];
	var mapping = {};
		
	for ( var i in groups ){
		var geneId = groups[i].groupValue;
		
		var docs = groups[i].doclist.docs;
		for ( var i in docs ){		
			for ( var j in aFields ){
				if ( docs[i][aFields[j]] ){
					
					var fld = aFields[j];
					var val = docs[i][fld];
					mapping[val] = geneId;					
					
					//console.log('**** ' + fld + ': ' + val + ' '+ mapping[val]);					
					//console.log(oFieldsPretty[fld] + " : " +  val + ' ' + geneId);
					
					list.push(oFieldsPretty[fld] + " : " +  val);
				}
			}	
		}		
	}
	IMPC.mapping = mapping;	
	//console.log('size: '+ list.length);
	return list;
}	
function fetch_name_matching_score(fld, val, userQry){
	//console.log('field now: ' + fld + ' val: ' + val + ' qry: ' + userQry);
	var subScore = 0;
	if (  val.toLowerCase() == userQry.toLowerCase() ){		
		subScore = parseInt(IMPC.geneMatrix[fld].equal);		
		//console.log(fld + ' : ' + subScore);
		return subScore;
	}	
	else if ( val.toLowerCase().indexOf(userQry.toLowerCase()) > -1 ){
		subScore = parseInt(IMPC.geneMatrix[fld].substr);		
		//console.log(fld + ' : ' + subScore);
		return subScore;		
	}
	return false;
}
function parse_solrJson(response){
	var json = eval("(" + response + ")");
	//console.log(json);
	
	var maxRow   = json.responseHeader.params.rows;
	var numFound = json.response.numFound;	
	$('span#solrInfo').html("Max number of terms to return: " + maxRow + ' --- Terms found: ' + numFound);
	
	// fields indexed in Solr document that we want to use here
	// to tag for the source of the data
	var aFields = ["Gene_Symbol", "Gene_Name", "id", "Gene_Synonym"];
	var list = [];
	var docs = json.response.docs;
	for ( var i in docs ){		
		for ( var j in aFields ){
			if ( docs[i][aFields[j]] ){
				//console.log( docs[i][aFields[j]]);
				var fld = aFields[j];
				list.push(fld + " : " +  docs[i][aFields[j]]);
			}
		}	
	}	
	return list;
	
}
function parse_solrJsonV1(response){
	var json = eval("(" + response + ")");
	//console.log(json);
		
	var numFound = json.numFound;
	var maxRow = json.maxRow; 
	//console.log("found: " + numFound + " max: " + maxRow);
	
	$('span#solrInfo').html("Max number of terms to return: " + maxRow + ' --- Terms found: ' + numFound);	
	return json.docs;
	
}
/*
json string: {"responseHeader":{"status":0,"QTime":1,"params":{"start":"0","q":"pax6*","group.limit":["10","10"],"group.field":["GeneSymbol","GeneName"],"group":["on","on"],"wt":"json","rows":"1000"}},
	          "grouped":{"GeneSymbol":
	          					{"matches":2,
	        	                 "groups":[{"groupValue":"Pax6","doclist":{"numFound":1,"start":0,"docs":[{"GeneSymbol":"Pax6","GeneName":"paired box gene 6","id":"MGI:97490","GeneSynonym":"Dey"}]}},
	        	                           {"groupValue":"Pax6os1","doclist":{"numFound":1,"start":0,"docs":[{"GeneSymbol":"Pax6os1","GeneName":"Pax6 opposite strand transcript 1","id":"MGI:3028033"}]}}]},
	        	         "GeneName":{"matches":2,
	        	        	     "groups":[{"groupValue":"paired box gene 6","doclist":{"numFound":1,"start":0,"docs":[{"GeneSymbol":"Pax6","GeneName":"paired box gene 6","id":"MGI:97490","GeneSynonym":"Dey"}]}},
	        	        	               {"groupValue":"Pax6 opposite strand transcript 1","doclist":{"numFound":1,"start":0,"docs":[{"GeneSymbol":"Pax6os1","GeneName":"Pax6 opposite strand transcript 1","id":"MGI:3028033"}]}}]}}}

*/