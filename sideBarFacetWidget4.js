(function ($) {
	'use strict';
    $.widget('MPI2.mpi2LeftSideBar', {
        
	    options: {	    	
    		mpAnnotSources: ['empress', 'mgi'],	
			solrBaseURL_bytemark:'http://ikmc.vm.bytemark.co.uk:8983/solr/',
			//solrBaseURL_bytemark:'http://beta.mousephenotype.org/mi/solr/',
			solrBaseURL_ebi: 'http://beta.mousephenotype.org/mi/solr/',
			commonParams: {
							'qf': 'auto_suggest',
				 			'defType': 'edismax',
				 			'wt': 'json',
				 			'start' : 0				 			
				 			},
			facetId2SearchType: {
								geneFacet: {type: 'gene', params: {}},
								pipelineFacet: {type: 'parameter', 
												params:{'fq': 'pipeline_stable_id:IMPC_001'}													  																		 
   												},
   								phenotypeFacet: {type: 'phenotype', 
   												 params: {'fq': "ontology_subset:*",
   														  'fl': 'mp_id,mp_term,mp_definition,top_level_mp_term'}   												                                                    
   												},
   								imageFacet:	{type: 'image', 
   											 param: {'fl' : 'annotationTermId,annotationTermName,expName',
   												     'fq' : "annotationTermId:MA*" }   												
   												}								  
								}
	    },

    	_create: function(){
    		// execute only once 	
    		var self = this;    		    		
    		
			$('div.facetCat').click(function(){
				
				$('div.facetCat').removeClass('facetCatUp');
				if ( $(this).parent().siblings('.facetCatList').is(':visible') ){					
					$('div.facetCatList').hide(); // collapse all other facets                     
					$(this).parent().siblings('.facetCatList').hide(); // hide itself					
				}
				else {
					$('div.facetCatList').hide(); // collapse all other facets 
					$(this).parent().siblings('.facetCatList').show(); // show itself					
					$(this).addClass('facetCatUp');
					var facetId = $(this).parent().parent().attr('id');
					var type = self.options.facetId2SearchType[facetId].type;
					var solrSrchParams = {};
										
					// also triggers SOP/gene/MP grid depending on what facet is clicked
					if (facetId == 'geneFacet'){
						solrSrchParams.fq = self.options.marker_type_filter_params;						
	                }	
					else if ( facetId == 'imageFacet' ) {
						solrSrchParams = $.extend({}, self.options.facetId2SearchType[facetId].params, self.options.commonParams);
					}
					else {
	                    solrSrchParams = $.extend({}, self.options.facetId2SearchType[facetId].params, self.options.commonParams);	                    
					}
									
					solrSrchParams.q = self.options.data.q; 
					
					$(self.options.geneGridElem).trigger('search', [{type: type, solrParams: solrSrchParams }]);	
				}								
			});	
			
			// click on facetCount to fetch results in grid
			$('span.facetCount').click(function(){						
				
				var facetId = $(this).parent().parent().attr('id');
								
				var solrSrchParams = {}
								
				// remove highlight from selected 
				if ( facetId == 'geneFacet' ){
					$('table#gFacet td').removeClass('highlight');					
				}
				else if (facetId == 'pipelineFacet' ){
					$('table#pipeline td[class^=procedure]').removeClass('highlight');					
					solrSrchParams = $.extend({}, self.options.facetId2SearchType[facetId].params, self.options.commonParams);
					self.options.facetId2SearchType[facetId].params.fq = "pipeline_stable_id:IMPC_001";					
				}	
				else if (facetId == 'phenotypeFacet' ){				
					$('table#mpFacet td').removeClass('highlight');
					solrSrchParams = $.extend({}, self.options.facetId2SearchType[facetId].params, self.options.commonParams);
					self.options.facetId2SearchType[facetId].params.fq = "ontology_subset:*";					
				}
				else if (facetId == 'imageFacet' ){					
    	    		// TO DO: invoke image grid
				}
				
				solrSrchParams.q = self.options.data.q;
				var type = self.options.facetId2SearchType[facetId].type;
				
				$(self.options.geneGridElem).trigger('search', [{type: type, solrParams: solrSrchParams}]);				
				
			});	
    	},
    	    	
	    // want to use _init instead of _create to allow the widget being called each time
	    _init : function () {
			var self = this;
			
	    	self._doGeneSubTypeFacet();	    	
	    	self._doMPFacet();	    	
			self._doPipelineFacet();
			self._doImageFacet();
			//self._doMAFacet();
	    },

		_doGeneSubTypeFacet: function(){
	    	var self = this;
	    	
			var solrURL = self.options.solrBaseURL_bytemark + 'gene/search';
	    	var queryParams = $.extend({},{				
				'rows': 0,
				'facet': 'on',								
				'facet.mincount': 1,
				'facet.limit': -1,
				'facet.field': 'marker_type_str',               		
				'q': self.options.data.q}, self.options.commonParams);	
	    	
	    	$.ajax({ 				 					
	    		'url': solrURL,
	    		'data': queryParams,
	    		'dataType': 'jsonp',
	    		'jsonp': 'json.wrf',
	    		'success': function(json) {	 	    			
	    			//console.log(json);					  
	    			self._displayGeneSubTypeFacet(json);	    				
	    		}		
	    	});	    	
	    },
	    
	    _displayGeneSubTypeFacet: function(json){
	    	var self = this;
	    	var numFound = json.response.numFound;
	    	
	    	// update this if facet is loaded by redirected page, which does not use autocomplete
	    	$('div#geneFacet span.facetCount').attr({title: 'total number of unique genes'}).text(numFound);
	    	
	    	if (numFound > 0){
	    		var trs = '';
	    		var facets = json.facet_counts['facet_fields']['marker_type_str'];
	    		for ( var i=0; i<facets.length; i+=2 ){		    			
	    			//console.log( facets[i] + ' ' + facets[i+1]);
					var type = facets[i];
					var count = facets[i+1];			
										
	    			trs += "<tr><td class='geneSubtype'>" + type + "</td><td rel='" + type + "' class='geneSubtypeCount'><a>" + count + "</a></td></tr>";	    			
	    		} 	
	    		
	    		var table = "<table id='gFacet' class='facetTable'>" + trs + "</table>";				
	    		$('div#geneFacet div.facetCatList').html(table);
	    		
				self._applyGeneGridResultFilterByMarkerSubType($('table#gFacet td.geneSubtypeCount'));	    		
    		}	    	
	    },

		_applyGeneGridResultFilterByMarkerSubType: function(thisCell){
			var self = this;

			thisCell.click(function(){
				$('table#gFacet td').removeClass('highlight');
				$(this).siblings('td.geneSubtype').addClass('highlight');
				
				var marker_subType = $(this).attr('rel');
				var q = self.options.data.q;              
                var subTypeFilter = "marker_type_str:(\"" + marker_subType + "\")";
				self.options.marker_type_filter_params = subTypeFilter;
				
				// refresh geneGrid with selected marker_subtype
				var callerElem = $(self.options.geneGridElem);				
				callerElem.trigger('search', [{type: 'gene', 
											   solrParams: {q: self.options.data.q, fq: subTypeFilter}
											  }
											 ]); 								
			});
		},

		_doMAFacet: function(){
	    	var self = this;
	    	var solrURL = self.options.solrBaseURL_ebi + 'ma/select';	    	
	    	var queryParams = $.extend({}, {				
				'rows': 0,
				'facet': 'on',								
				'facet.mincount': 1,
				'facet.limit': -1,				
				'facet.sort': 'index',					
				'q.option': 'AND',
				'q': self.options.data.q}, self.options.commonParams);
	    	
	    	var p = queryParams;
	    	var aSolrParams = [];
	    	for( var i in p ){        		
        		aSolrParams.push(i + '=' + p[i]);
        	}
	    	var params = aSolrParams.join('&') + '&facet.field=top_level_ma_term&facet.field=top_level_ma_term_part_of';
	    		    	
	    	$.ajax({	
	    		'url': solrURL,
	    		'data': params,						
	    		'dataType': 'jsonp',
	    		'jsonp': 'json.wrf',
	    		'success': function(json) {	   
	    			$('div#tissueFacet span.facetCount').text(self.options.data.maFound);  
	    			self._makeMAFacetTable(json);			
	    		}		
	    	});		    	
	    },
	    
	    _makeMAFacetTable: function(json){
	    	var self = this;
	    	
	    	var numFound = json.response.numFound;  
	    	$('div#tissueFacet span.facetCount').text(numFound);
	    	
	    	var aTopLevelCount = self._processMAFacetJson(json);
	    	
	    	var table = $("<table id='maFacet' class='facetTable'></table>");
	    	
	    	// top level MA terms	    	
	    	var counter = 0;
	    	for ( var i in aTopLevelCount ){
	    		counter++;
    			var tr = $('<tr></tr>').attr({'rel':i, 'id':'topLevelMaTr'+counter});    			
	    		var td1 = $('<td></td>').attr({'class': 'maTopLevel'}).text(i);	    		
	    		
	    		var a = $('<a></a>').attr({'rel':i}).text(aTopLevelCount[i]);
	    		var td2 = $('<td></td>').attr({'class': 'maTopLevelCount'}).append(a);
	    		table.append(tr.append(td1, td2)); 
	    	}
	    			
	    	
	    	
			self._displayOntologyFacet(json, 'ma', 'tissueFacet', table);	
	    },
	    
	    _processMAFacetJson: function(json){
	    	var self = this;
	    	var aTopLevelCount = {};
	    	var aFields = ['top_level_ma_term_part_of','top_level_ma_term'];
	    	for (var i=0; i<aFields.length; i++){	    		
	    		var ff = json.facet_counts.facet_fields[aFields[i]];
	    			    	
	    		for ( var j=0; j<ff.length; j++ ){	    			
	    			if ( !aTopLevelCount[ff[j]] ){
	    				aTopLevelCount[ff[j]] = ff[j+1];
	    			}	
	    			else {
	    				if ( aTopLevelCount[ff[j]] < ff[j+1] ){
	    					aTopLevelCount[ff[j]] = ff[j+1]
	    				} 
	    			}
	    			j++;
	    		}
	    	}	
	    	return aTopLevelCount;    	
	    },
	    
		_doPipelineFacet: function(){
	    	var self = this;
	    	var aProcedure_names = [];	    	
	    	var solrURL = self.options.solrBaseURL_ebi + 'pipeline/select';	    	
	    	var queryParams = $.extend({}, {	    		  		
	    		'fq': 'pipeline_stable_id=IMPC_001',				
				'rows': 500000,
				'facet': 'on',								
				'facet.mincount': 1,
				'facet.limit': -1,
				'facet.field': 'proc_param_name',
				'fl': 'parameter_name,parameter_stable_key,parameter_stable_id,procedure_name,procedure_stable_key,procedure_stable_id',						
				'q': self.options.data.q}, self.options.commonParams);	    		    	
	    	
	    	//console.log(queryParams);
	    	$.ajax({ 				 					
	    		'url': solrURL,
	    		'data': queryParams,
	    		'dataType': 'jsonp',
	    		'jsonp': 'json.wrf',
	    		'success': function(json) { 
	    			//console.log(json);
	    			
	    			// update this if facet is loaded by redirected page, which does not use autocomplete
	    			$('div#pipelineFacet .facetCount').attr({title: 'total number of unique parameter terms'}).text(json.response.numFound);
	        			        		
	    			var procedures_params = {};
	    			var facetCountSum = 0;
	    			
	    			var mappings = self._doNames2IdMapping(json.response);
	    			
	    			var procedureName2IdKey = mappings[0]; // stable_id
	    			var parameterName2IdKey = mappings[1]; // stabley_key
	    			
	    			var facets = json.facet_counts['facet_fields']['proc_param_name'];    	
	    	    	
	        		for ( var f=0; f<facets.length; f+=2 ){	        			
	        			var names = facets[f].split('___');
	        			var procedure_name = names[0];
	        			var parameter_name = names[1];
	        			var count = facets[f+1];
	        				        				        			
	        			if ( !procedures_params[procedure_name] ){	        				
	        				procedures_params[procedure_name] = [];
	        			}	
	        			procedures_params[procedure_name].push({param_name : parameter_name,
	        													param_count: count});	        		
	        		}	        		       		
	        			        		
	        		var table = $("<table id='pipeline' class='facetTable'><caption>IMPC</caption></table>");
	        		
	        		var counter=0;
	        		for ( var i in procedures_params){
	        			counter++;
	        			var procedureCount = procedures_params[i].length;
	        			var pClass = 'procedure'+counter;
	        			var tr = $('<tr></tr>');
	        			var td1 = $('<td></td>').attr({'class': pClass});
	        			var td2 = $('<td></td>');	        			        			
	        			var a = $('<a></a>').attr({'class':'paramCount', 'rel': procedureName2IdKey[i].stable_id}).text(procedureCount);
	        			table.append(tr.append(td1.text(i), td2.append(a)));
	        			
	        			// skip subterms for now
	        			/*for ( var j=0; j<procedures_params[i].length; j++ ){
	        				var pmClass = pClass+'_param';
	        				var tr = $('<tr></tr>').attr('class', pmClass);
	        				var oParamCount = procedures_params[i][j];
	        				//console.log('Parhttps://github.com/mpi2/mpi2_search/tree/devam: '+ oParamCount.param_name + ':'+ oParamCount.count);
	        				var a = $('<a></a>').attr({
	        					href: 'http://www.mousephenotype.org/impress/impress/listParameters/'	        						
	        						+ procedureName2IdKey[i].stable_key,	        					
	        					target: '_blank'
	        				}).text(oParamCount.param_name);	
	        				
	        				var td = $('<td></td>').attr({colspan: 2, rel: parameterName2IdKey[oParamCount.param_name].stable_key});
	        				table.append(tr.append(td.append(a)));	        				
	        			}*/	        			
	        		}   		
	        		
	        		if (json.response.numFound == 0 ){
	        			table = null;
	        		}	    			
	        		$('div#pipelineFacet .facetCatList').html(table);
					
	        		
	        		// skip toggle table inside a tr for subterms
	        		/*var regex = /procedure\d+/;
	        		$('table#pipeline td[class^=procedure]').toggle(
	        			function(){ 
	        				var match = regex.exec( $(this).attr('class') );
	        				var thisClass = match[0] ? match[0] : $(this).attr('class');	        				
	        				$(this).parent().siblings("tr." + thisClass + '_param').show();
	        			},
	        			function(){
	        				var match = regex.exec( $(this).attr('class') );
	        				var thisClass = match[0] ? match[0] : $(this).attr('class');	        				
	        				$(this).parent().siblings("tr." + thisClass + "_param").hide();
	        			}
	        		);
	        		*/
	        		$('table#pipeline td a.paramCount').click(function(){	
	        			$('table#pipeline td[class^=procedure]').removeClass('highlight');
	        			$(this).parent().siblings('td[class^=procedure]').addClass('highlight');
	        			var proc_stable_id = $(this).attr('rel');   
	                    var solrSrchParams = $.extend({}, self.options.facetId2SearchType.pipelineFacet.params, self.options.commonParams);	                   
	                    solrSrchParams.q = self.options.data.q;
	                    solrSrchParams.fq = 'procedure_stable_id:' + proc_stable_id;	                  
	                    $(self.options.geneGridElem).trigger('search', [{type: 'parameter', solrParams: solrSrchParams }]);
	        		});	        		
	    		}		
	    	});	    	
	    },
	    
	    _doNames2IdMapping: function(response){
	    	var nodes = response.docs;
	    	var procedureName2IdKey = {};
	    	var parameterName2IdKey = {};
	    	
	    	for( var n=0; n<nodes.length; n++){
	    		var node = nodes[n];	    		
	    			    		
	    		var procName = node.procedure_name;	    			    		
	    		var procSId  = node.procedure_stable_id;
	    		var procKey  = node.procedure_stable_key;
	    		
	    		var paramName = node.parameter_name;
	    		var paramSId   = node.parameter_stable_id;
	    		var paramKey  = node.parameter_stable_key;
	    		
	    			    		
	    		if ( !procedureName2IdKey[procName] ){
	    			procedureName2IdKey[procName] = {};
	    		}
	    		if ( !parameterName2IdKey[paramName] ){
	    			parameterName2IdKey[paramName] = {};
	    		}
	    		procedureName2IdKey[procName] = {stable_id: procSId, stable_key: procKey};
	    		parameterName2IdKey[paramName] = {stable_id: paramSId, stable_key: paramKey};	    		
	    	}
	    	return [procedureName2IdKey, parameterName2IdKey];
	    }, 

	    _doMPFacet: function(){
	    	var self = this;
	    	var solrURL = self.options.solrBaseURL_ebi + 'mp/select';
	    		    	
	    	var queryParams = $.extend({}, {				
				'fq': 'ontology_subset:*',
				'rows': 0, // override default
				'facet': 'on',								
				'facet.mincount': 1,
				'facet.limit': -1,
				'facet.field': 'top_level_mp_term',
				'facet.sort': 'index',						
				'q.option': 'AND',
				'q': self.options.data.q}, self.options.commonParams);			
	    
	    	$.ajax({	
	    		'url': solrURL,
	    		'data': queryParams,						
	    		'dataType': 'jsonp',
	    		'jsonp': 'json.wrf',
	    		'success': function(json) {
	    			
	    			// update this if facet is loaded by redirected page, which does not use autocomplete
	    			$('div#phenotypeFacet span.facetCount').attr({title: 'total number of unique phenotype terms'}).text(json.response.numFound);
	    			
	    			var table = $("<table id='mpFacet' class='facetTable'></table>");	    			
	    			
	    	    	var aTopLevelCount = json.facet_counts.facet_fields['top_level_mp_term'];
	    	    
	    	    	// top level MP terms
	    	    	for ( var i=0;  i<aTopLevelCount.length; i+=2 ){	    		
	    	    		
	        			var tr = $('<tr></tr>').attr({'rel':aTopLevelCount[i], 'id':'topLevelMpTr'+i});  
	        			// remove trailing ' phenotype' in MP term
	        			
	    	    		var td1 = $('<td></td>').attr({'class': 'mpTopLevel'}).text(aTopLevelCount[i].replace(' phenotype', ''));	    	    		   	    		
	    	    		
	    	    		var a = $('<a></a>').attr({'rel':aTopLevelCount[i]}).text(aTopLevelCount[i+1]);
	    	    		var td2 = $('<td></td>').attr({'class': 'mpTopLevelCount'}).append(a);
	    	    		table.append(tr.append(td1, td2)); 
	        			
	    	    	}    	
	    	    	
	    			self._displayOntologyFacet(json, 'mp', 'phenotypeFacet', table);			
	    		}		
	    	});		    	
	    },
	   
	    _displayOntologyFacet: function(json, ontology, facetDivId, table){	    	
	    	
	    	var self = this;
	    	var solrBaseUrl = self.options.solrBaseURL_ebi + ontology + '/select';	    	
	    	
	    	if (json.response.numFound == 0 ){	    		
    			table = null;
    		}	    			
    		$('div#'+facetDivId+ ' .facetCatList').html(table);
    		
    		$('table#'+ ontology + 'Facet td a').click(function(){
    			$('table#mpFacet td.' + ontology + 'TopLevel').removeClass('highlight');
    			$(this).parent().siblings('td.'+ ontology + 'TopLevel').addClass('highlight')
    			
    			var topLevelOntoTerm = $(this).attr('rel');   			
    			
    			// invoke phenotype grid
    			var type = self.options.facetId2SearchType[facetDivId].type;
    			var solrSrchParams = $.extend({}, self.options.facetId2SearchType[facetDivId].params, self.options.commonParams);
    			
    			if ( ontology == 'mp' ){
    				solrSrchParams.fq = "ontology_subset:* AND top_level_mp_term:\"" + topLevelOntoTerm + "\"";
    			}
    			 			
    			solrSrchParams.q = self.options.data.q;
    			$(self.options.geneGridElem).trigger('search', [{type: type, solrParams: solrSrchParams}]);    			
    		});
    		
    		// skip display subterms for now
    		// fetch and expand children of top level MP term
    		/*$('table#'+ ontology + 'Facet td.'+ontology+'TopLevel').click(function(){  
    			
    			var parent = $(this).parent();
    			var children = $('tr[class^=' + $(this).parent().attr('id') +']');
    			
    			if ( parent.hasClass(ontology + 'TopExpanded') ){
    				children.hide();
    				parent.removeClass(ontology + 'TopExpanded');
    			}
    			else {
    				parent.addClass(ontology + 'TopExpanded');
    				
    				if ( children.size() == 0 )phenotype_call_summary{
    					
    					var topLevelOntoTerm = $(this).siblings('td').find('a').attr('rel');    				
    					var thisTable = $('table#'+ ontology+ 'Facet');
    			
    					var solrSrchParams = $.extend({}, self.options.facetId2SearchType.phenotypeFacet.params, self.options.commonParams);	                   
    					solrSrchParams.q = self.options.data.q;
    					
    					solrSrchParams.fl = ontology+ '_id,'+ ontology + '_term,'+'ontology_subset';    					
    					solrSrchParams.sort = ontology + '_term asc';
    					solrSrchParams.solrBaseURL = solrBaseUrl;                  
    					
    					var solrSrchParamsStr = self._stringifyParams(solrSrchParams);    					
    				
    					if ( ontology == 'ma' ){
    						solrSrchParamsStr += '&fq=top_level_'+ ontology + '_term:' + '"'+ topLevelOntoTerm + '"'
    					                      +  '&fq=top_level_'+ ontology + '_term_part_of:' + '"'+ topLevelOntoTerm + '"';    						
    					}	
    					else {
    						solrSrchParamsStr += '&fq=top_level_'+ ontology + '_term:' + '"'+ topLevelOntoTerm + '"'; 
    					} 
    					
    					$.ajax({    					
    						'url': solrBaseUrl + '?' + solrSrchParamsStr,    											
    						'dataType': 'jsonp',
    						'jsonp': 'json.wrf',
    						'success': function(json) {    							
    							if (json.response.numFound > 10 ){    							
    								self._display_subTerms_in_tabs(json, topLevelOntoTerm, thisTable, ontology);
    							}
    							else {
    								self._display_subTerms(json, topLevelOntoTerm, thisTable, ontology);
    							}    							
    						}		
    					});		
    				}
    				else {
    					// fetch children only once
    					children.show();
    					parent.addClass(ontology+ 'TopExpanded');
    				}
    			}
    		});  */  		
	    },
	    
	    _doImageFacet: function(){
	    
	    	var self = this;
	    	var solrURL = self.options.solrBaseURL_ebi + 'images/select';
	    		    	
	    	var queryParams = $.extend({}, {							
				'rows': 0,
				'facet': 'on',								
				'facet.mincount': 1,
				'facet.limit': -1,				
				'facet.sort': 'index',
				'fl': 'annotatioinTermId,annotationTermName,expName',
				'fq': "annotationTermId:MA*",
				'q.option': 'AND',				
				'q': self.options.data.q 				
				}, self.options.commonParams);
	    	
	    	// if users do not search with wildcard, we need to search by exact match
	    	if (queryParams.q.indexOf(" ") != -1 ){
	    		queryParams.qf = 'auto_suggest';	    		
	    	}  
	    	else if ( queryParams.q.indexOf('*') == -1 ){	    	
	    		queryParams.qf = 'text';	    		
	    	}	    		
	    	
	    	var paramStr = self._stringifyParams(queryParams) + "&facet.field=expName&facet.field=higherLevelAnnotationTermName";
	    		    	
	    	$.ajax({	
	    		'url': solrURL,
	    		'data': paramStr,   //queryParams,						
	    		'dataType': 'jsonp',
	    		'jsonp': 'json.wrf',	    		
	    		'success': function(json) {	 
	    			//console.log(json);	    			
	    			var imgBaseUrl = baseUrl + "/komp2/images?";
    	    		var params = "q=" + self.options.data.q;    	    		
    	    		params += "&fq=annotationTermId:MA*&q.option=AND&qf=" + queryParams.qf + "&defType=edismax&wt=json";
    	    		
    	    		var sumLink = $('<a></a>').attr({'href':imgBaseUrl + params, 'target':'_blank'}).text(json.response.numFound);    	    		
	    			$('div#imageFacet span.facetCount').attr({title: 'total number of unique images'}).html(sumLink);
	    		
	    			var table = $("<table id='imgFacet' class='facetTable'></table>");
	    			
	    			var aFacetFields = json.facet_counts.facet_fields;
	    		
	    			var displayLabel = {
	    									expName : 'Experiment',
	    					            	higherLevelAnnotationTermName: 'Anatomy'
	    								};
	    			
	    			for ( var facetName in aFacetFields ){ 
	    				
	    				for ( var i=0; i<aFacetFields[facetName].length; i+=2){    					  					
	    					
	    					var fieldName = aFacetFields[facetName][i];
	    					var facetCount = aFacetFields[facetName][i+1];	    									
	    					//console.log(fieldName + ' : '+ facetCount);
	    					
	    					var tr = $('<tr></tr>').attr({'rel':fieldName, 'id':'topLevelImgTr'+i});
	    					var td1 = $('<td></td>').attr({'class': 'imgExperiment'}).text(fieldName);
	    				
	    					var imgBaseUrl = baseUrl + "/komp2/images?";
		    	    		var params = "q=" + self.options.data.q;
		    	    		params += "&fq=annotationTermId:MA*&q.option=AND&qf=" + queryParams.qf + "&defType=edismax&wt=json&fq=" + facetName + ":";
		    	    		params += '"' + fieldName + '"';
		    	    		var imgUrl = imgBaseUrl + params;
		    	    		
		    	    		var a = $('<a></a>').attr({'rel':fieldName, 'href':imgUrl, 'target':'_blank'}).text(facetCount);
		    	    		var td2 = $('<td></td>').attr({'class': 'imgExperimentCount'}).append(a);
		    	    		
		    	    		if ( i == 0 ){
	    						var catTr = $('<tr></tr>').attr({'class':'imgCat'});
	    						var catLabel = displayLabel[facetName];
	    						var catTd = $('<td></td>').attr({'colspan':2}).text(catLabel);
	    						catTr.append(catTd);
	    						table.append(catTr); 
	    					}		    	    				    	    		
		    	    		table.append(tr.append(td1, td2));		    	    		
	    				}
	    			}
	    				    	    	
	    			self._displayImageFacet(json, 'images', 'imageFacet', table);			
	    		}		
	    	});	    	
	    },
	    	    
	    _displayImageFacet: function(json, coreName, facetDivId, table){
	    	var self = this;
	    	//console.log(json)
	    	var solrBaseUrl = self.options.solrBaseURL_ebi + coreName + '/select';	    	
	    	
	    	if (json.response.numFound == 0 ){	    		
    			table = null;
    		}
	    	else {
	    		$('div#'+facetDivId+ ' .facetCatList').html(table);
    		    		
	    		table.find('td a').click(function(){    			
    			
    			table.find('td.imgExperiment').removeClass('highlight');
    			$(this).parent().siblings('td.imgExperiment').addClass('highlight')    			
    			
    				// TO DO: invoke image grid    			
	    		});	
	    	}
	    },
	    	    
	    _stringifyParams: function(solrSrchParams){
	    	var aStr = [];
	    	for( var i in solrSrchParams ){
	    		aStr.push(i + '=' + solrSrchParams[i]);
	    	}
	    	return aStr.join("&");
	    },
	    	    
	    _display_subTerms_in_tabs: function(json, topLevelOntoTerm, thisTable, ontology){
	    	var self = this;
	    	
	    	var docs = json.response.docs;	    
	    	var tabLtrTerms = {};
	    	var tabLtr = null;
	    	
	    	// parse json for sub term hyperlink
	    	for( var i=0; i<docs.length; i++ ){
	    		var termId = docs[i][ontology+'_id'];
	    		var ontoTerm = docs[i][ontology+'_term'];
	    		//console.log(termId + ' -- '+ ontoTerm);	    		
	    		tabLtr = ontoTerm.substring(0,1);
	    		
	    		if ( ! tabLtrTerms[tabLtr] ){	    			
	    			 tabLtrTerms[tabLtr] = [];	    			
	    		}	    			    		
	    		
	    		var a = $('<a></a>').attr({'href':baseUrl+'/komp2/mp?mpid='+termId, 'target':'_blank'}).text(ontoTerm);
	    		tabLtrTerms[tabLtr].push(a); 
	    	}
	    	
	    	// create tabs html markup
	    	var tabBlk = $('<div></div>').attr({'id': ontology + 'Tab_' + topLevelOntoTerm});
	    	var ul     = $('<ul></ul>');	    	
	    
	    	var counter = 0;
	    	for( var i in tabLtrTerms ){
	    		counter++;	    	
	    		//var id = 'tab_' + i + '_' + topLevelOntoTerm;	 
	    		var a = $('<a></a>').attr({'href': 'ui-tabs-'+counter}).text(i.toUpperCase());	    	
	    		var li = $('<li></li>').append(a);
	    		ul.append(li);
	    	}
	    	tabBlk.append(ul);
	    		    	
	    	var previousTr = $('tr[rel="' + topLevelOntoTerm + '"]'); 
    		var tr = $('<tr></tr>').attr({'class': previousTr.attr('id')+'_sub'});	    		
    		tr.append($('<td></td>').attr({'colspan':2}).append(tabBlk));    		
    		
    		previousTr.after(tr);
    		
    		// make tabs
    		var tabs = tabBlk.tabs({
    			selected: 0,
        	 	cache   : true,
        	 	spinner : 'Loading'
    		});
    		    	  
    		// populate tab panel content
    		tabs.find('ul li a').each(function(){    			
    			var id = $(this).attr('href').replace('#','');  
    			var tabName = $(this).text().toLowerCase();
    			var panelContent = tabs.find('div#'+id);
    			
    	    	for ( var j=0; j<tabLtrTerms[tabName].length; j++){    	    		
    	    		panelContent.append($('<span></span>').html(tabLtrTerms[tabName][j]));    	    
    	    	} 
    		});   		
	    	
	    },
	    
	    _display_subTerms: function(json, topLevelOntoTerm, thisTable, ontology){   
	    	
	    	var self = this;
	    	
	    	var docs = json.response.docs;
	    	// need to reverse the order due to appending of tr with .after()
	    	// otherwise the order appears as 'desc' alphabetically
	    	for( var i=docs.length-1; i<docs.length; i-- ){
	    		var termId = docs[i][ontology+'_id'];
	    		var ontoTerm = docs[i][ontology+'_term'];
	    		//console.log(termId + ' -- '+ ontoTerm);
	    		var previousTr = $('tr[rel="' + topLevelOntoTerm + '"]'); 
	    		var tr = $('<tr></tr>').attr({'class': previousTr.attr('id')+'_sub'});	    		
	    		var a = $('<a></a>').attr({'href':baseUrl+'/komp2/mp?mpid='+termId, 'target':'_blank'}).text(ontoTerm);
	    		tr.append($('<td></td>').attr({'colspan':2}).append(a));
	    		
	    		previousTr.after(tr);
	    	}
	    },
	  
	    destroy: function () {    	   
	    	// does not generate selector class
    	    // if using jQuery UI 1.8.x
    	    $.Widget.prototype.destroy.call(this);
    	    // if using jQuery UI 1.9.x
    	    //this._destroy();
    	}  
    });
	
}(jQuery));	
	
