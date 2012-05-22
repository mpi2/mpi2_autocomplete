$(document).ready(function(){
	$.namespace('IMPC');
		
	//scoring matrix for ordering gene names	
	IMPC.geneMatrix = {
		mgi_accessioni_id         : { equal : 15, substr : 15 },	
		marker_symbol  : { equal : 15, substr : 8 },
		marker_name    : { equal : 3,  substr : 2 },
		synonym        : { equal : 2,  substr : 1 }
	};

	doAutoComplete();	
});

function doAutoComplete(){
	
	var params = {'start':0, 'rows':50, 'wt':'json', 'group':'on', 'group.field':'mgi_accession_id', 'defType':'edismax',
		      'qf':'text', 'qf':'auto_suggest', 'fl':"marker_name,synonym,marker_symbol,mgi_accession_id"};

	var solrUrl = "http://ikmc.vm.bytemark.co.uk:8900/solr/gene_autosuggest/select";
	//var solrUrl = "http://ikmc.vm.bytemark.co.uk:8999/solr/gene_autosuggest/select";

 	$( "#tags" ).autocomplete({ 			
 		//source : url,
 		create : function(event, ui){
 			params.q = 'pax'; // set as default display data when started
 			
 			$('input#tags').val('').click(function(){
 				$(this).val(''); 			
 			}); 			
 			// preload an arbitrarily chosen search keyword: pax
 			IMPC.searchKW = 'pax'; // default search when application starts so that something appears in table
 			
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
 			IMPC.searchKW = query;
 			
 			// parenthesis need to be escaped 			
 			query = query.replace(/\(/g, "\\(");
 			query = query.replace(/\)/g, "\\)"); 			
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
						$('span#loading').html('');												
					}
			}); 			
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

	var trs = '';	
	var aFields = ["mgi_accession_id", "marker_symbol", "marker_name", "synonym"];
	var oFieldsPretty = {marker_symbol:'Gene Symbol', 
            marker_name:'Gene Name', 
            mgi_accession_id:'MGI Id', 
            synonym:'Gene Synonym'           
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
	//console.log(json);
	var maxRow   = json.responseHeader.params.rows;
	var g        = json.grouped.mgi_accession_id;
	var numFound = g.matches;
	var groups   = g.groups;
	IMPC.groups = groups;
	
	var foundFilterMsg = "Max records to return: " + maxRow + ' ... Records found: ' + numFound;	
	$('span#solrInfo').html(foundFilterMsg);
	
	var aFields = ["marker_symbol", "mgi_accession_id", "marker_name", "synonym"];// need to be updated to marker_synonym
	var oFieldsPretty = {marker_symbol:'Gene Symbol', 
						 marker_name:'Gene Name', 
						 mgi_accession_id:'MGI Id', 
			             synonym:'Gene Synonym'
			             };
	var list = [];	
	var mapping = {};

	for ( var i in groups ){
		var geneId = groups[i].groupValue;
		console.log(geneId);
		var docs = groups[i].doclist.docs;
		for ( var i in docs ){		
			for ( var j in aFields ){
				if ( docs[i][aFields[j]] ){					
					var fld = aFields[j];
					var val = docs[i][fld];
					
					if ( fld == 'synonym' ){						
						var aGsynonyms = docs[i][fld];
						for ( j in aGsynonyms ){						
							var thisGeneSynonym = aGsynonyms[j];
							mapping[thisGeneSynonym] = geneId;						
							list.push(oFieldsPretty[fld] + " : " +  thisGeneSynonym);
						}
					}
					else {
						mapping[val] = geneId;											
						list.push(oFieldsPretty[fld] + " : " +  val);
					}
				}
			}	
		}		
	}
		
	IMPC.mapping = mapping;	
	return list;
}	
function fetch_name_matching_score(fld, val, userQry){
	var subScore = 0;
	val = val + ''; // make sure it is a string (ie, converts number in the string to string)
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

