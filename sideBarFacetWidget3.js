(function ($) {
	'use strict';
    $.widget('MPI2.mpi2LeftSideBar', {
        	
	    options: {
    		mpAnnotSources: ['empress', 'mgi'],    	
    		geneFacet: {},
    		phenotypeFacet: {},
    		tissueFacet: {},
    		pipelineFacet: {},			
			solrBaseURL_ebi: 'http://wwwdev.ebi.ac.uk/mi/solr/',
			solrBaseURL_bytemark: 'http://ikmc.vm.bytemark.co.uk:8983/solr/',
			facetId2SearchType: {
								 geneFacet : {type: 'gene', params: {}},
								 pipelineFacet: {type: 'parameter', params: {'fq': 'pipeline_stable_id=IMPC_001',    			
    																		 'fl': 'parameter_name,procedure_name',
    																		 'qf': 'auto_suggest',
    																		 'defType': 'edismax',
    																		 'wt': 'json',
    			                                                             'rows': 50,
    																		 }}
								}
	    },

    	_create: function(){
    		// execute only once 	
    		
    	},
    	
	    // want to use _init instead of _create to allow the widget being called each time
	    _init : function () {
	    	var self = this;  
	    	$('div#phenotypeFacet .facetCat, div#geneFacet .facetCat, div#pipelineFacet .facetCat').toggle(
					function(){
						$(this).addClass('facetCatUp');
						$(this).parent().siblings('.facetCatList').show();
						//console.log('q: '+ self.options.data.queryString);
						var facetId = $(this).parent().parent().attr('id');
						// also triggers SOP grid	
						
						var solrSrchParams = {q: self.options.data.queryString};
						console.log('facet id: '+ facetId);
						if (facetId == 'pipelineFacet'){
							console.log('1: ');	console.log(solrSrchParams);	
							solrSrchParams = self.options.facetId2SearchType[facetId].params;
																								
							console.log('2: ');	console.log(solrSrchParams);							
						}
						$('#mpi2-search').trigger('search', [{type: self.options.facetId2SearchType[facetId].type, solrParams: solrSrchParams}]); 					
					},
					function(){
						$(this).removeClass('facetCatUp');
						$(this).parent().siblings('.facetCatList').hide();
					}
			);		    		    	
	    	// gene subtype facet
	    	self._doGeneSubTypeFacet();	
	    	
	    	// fire off solr query
	    	//self._doMPFacet();

			self._doPipelineFacet();
	    	
	    },

		_doGeneSubTypeFacet: function(){
	    	var self = this;
	    		    			
			var solrURL = self.options.solrBaseURL_bytemark + 'main/search';
	    	var queryParams = {
				'start': 0,
				'rows': 0,
				'facet': 'on',								
				'facet.mincount': 1,
				'facet.field': 'marker_type_str',
                //'qf': 'auto_suggest',
				//'defType': 'edismax',									
				//'wt': 'json',				
				'q': self.options.data.queryString
			};
	    	$.ajax({ 				 					
	    		'url': solrURL,
	    		'data': queryParams,
	    		'dataType': 'jsonp',
	    		'jsonp': 'json.wrf',
	    		'success': function(json) {	 	    			
	    			//console.log(json);					
					$('div#geneFacet span.facetCount').text(self.options.data.geneFound);   
	    			self._displayGeneSubTypeFacet(json);	    				
	    		}		
	    	});
	    	
	    },
	    
	    _displayGeneSubTypeFacet: function(json){
	    	var self = this;
	    	if (json.response.numFound > 0){
	    		var trs = '';
	    		var facets = json.facet_counts['facet_fields']['marker_type_str'];
	    		for ( var i=0; i<facets.length; ){		    			
	    			//console.log( facets[i] + ' ' + facets[i+1]);
					var type = facets[i];
					var count = facets[i+1];
					

	    			trs += "<tr><td class='geneSubtype'>" + type + "</td><td rel='" + type + "' class='geneSubtypeCount'>" + count + "</td></tr>";
	    			i += 2;
	    		}	    			    		
	    		var table = "<table id='gFacet'>" + trs + "</table>";				
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
				var q = self.options.data.queryString;              
                var subTypeFilter = "marker_type_str:(\"" + marker_subType + "\")";
				
				// refresh geneGrid with selected marker_subtype
				var callerElem = $(self.options.geneGridElem);				
				callerElem.trigger('search', [{type: 'gene', 
											   solrParams: {q: self.options.data.queryString, fq: subTypeFilter}
											  }
											 ]); 								
			});
		},

		_doPipelineFacet: function(){
	    	var self = this;
	    	var aProcedure_names = [];	    	
	    	var solrURL = self.options.solrBaseURL_ebi + 'pipeline/select';	    	
	    	var queryParams = {	    		  		
	    		'fq': 'pipeline_stable_id=IMPC_001',				
				'qf': 'auto_suggest',
				'defType': 'edismax',
				'rows': 10000,
				'facet': 'on',								
				'facet.mincount': 1,
				'facet.limit': -1,
				'facet.field': 'proc_param_name',
				'fl': 'parameter_name,parameter_stable_key,parameter_stable_id,procedure_name,procedure_stable_key,procedure_stable_id',
				'wt': 'json',				
				'q': self.options.data.queryString				
			};
	    	$.ajax({ 				 					
	    		'url': solrURL,
	    		'data': queryParams,
	    		'dataType': 'jsonp',
	    		'jsonp': 'json.wrf',
	    		'success': function(json) {	    			  			
	    			    			
	    			var procedures_params = {};
	    			
	    			var mappings = self._doNames2IdMapping(json.response);
	    			var procedureName2IdKey = mappings[0];
	    			var parameterName2IdKey = mappings[1];
	    			
	    			var facets = json.facet_counts['facet_fields']['proc_param_name'];    	
	    	    	
	        		for ( var i=0; i<facets.length; ){	        			
	        			var names = facets[i].split('___');
	        			var procedure_name = names[0];
	        			var parameter_name = names[1];
	        			var count = facets[i+1];
	        			
	        			if ( !procedures_params[procedure_name] ){	        				
	        				procedures_params[procedure_name] = [];
	        			}	
	        			procedures_params[procedure_name].push({param_name : parameter_name,
	        													param_count: count}); 
	        			i+=2;
	        		}	
	        		
	        		var table = $("<table id='pipeline'><caption>IMPC</caption></table>");
	        		//console.log(procedures_params);
	        		var counter=0;
	        		for ( var i in procedures_params){
	        			counter++;
	        			var procedureCount = procedures_params[i].length;
	        			var pClass = 'procedure'+counter;
	        			var tr = $('<tr></tr>');
	        			var td1 = $('<td></td>').attr({'class': pClass, 'rel': procedureName2IdKey[i].stable_id});
	        			var td2 = $('<td></td>');
	        			var a = $('<a></a>').attr({
	        					href: 'http://www.mousephenotype.org/impress/impress/listParameters/' + procedureName2IdKey[i].stable_key,
	        					target: '_blank'
	        					}).text(procedureCount);	        			
	        			table.append(tr.append(td1.text(i), td2.append(a)));
	        			
	        			for ( var j=0; j<procedures_params[i].length; j++ ){
	        				var pmClass = pClass+'_param';
	        				var tr = $('<tr></tr>').attr('class', pmClass);
	        				var oParamCount = procedures_params[i][j];
	        				//console.log('Param: '+ oParamCount.param_name + ':'+ oParamCount.count);
	        				var a = $('<a></a>').attr({
	        					href: 'http://www.mousephenotype.org/impress/impress/listParameters/'	        						
	        						+ procedureName2IdKey[i].stable_key,	        						
	        					target: '_blank'
	        				}).text(oParamCount.param_name);	
	        				
	        				var td = $('<td></td>').attr({colspan: 2, rel: parameterName2IdKey[oParamCount.param_name].stable_key});
	        				table.append(tr.append(td.append(a)));	        				
	        			}	        			
	        		}

	        		$('div#pipelineFacet .facetCount').text(json.response.numFound);
	        		if (json.response.numFound == 0 ){
	        			table = null;
	        		}	    			
	        		$('div#pipelineFacet .facetCatList').html(table);

	        		$('table#pipeline td[class^=procedure]').toggle(
	        			function(){	        					
	        				var thisClass = $(this).attr('class');	        					
	        				$(this).parent().siblings("tr." + thisClass + '_param').show();
	        			},
	        			function(){
	        				var thisClass = $(this).attr('class');
	        				$(this).parent().siblings("tr." + thisClass + "_param").hide();
	        			}
	        		);
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
	    		    	
	    	self.options.queryParams.fl="mgi_accession_id_empress,mgi_accession_id_mgi, marker_symbol_empress, marker_symbol_mgi," +
	    								"mp_term,mp_id,mp_top_level_term_empress,mp_top_level_term_mgi";
	    	//self.options.queryParams.rows = 50000; // now also want to include main result part, not only facet
	    	self.options.queryParams['facet.mincount'] = 1;		    		
		    		//self.options.queryParams.group = 'on';		    		
		    		//self.options.queryParams['group.field'] = 'mgi_accession_id';
	    	self.options.queryParams.q = self.options.data.queryString;
		    				    		
	    	//console.log(self.options.queryParams);
		    		
	    	$.ajax({ 				 					
	    		'url': self.options.solrBaseURL_ebi + '?' + self._composeSolrParams(),							
	    		'dataType': 'jsonp',
	    		'jsonp': 'json.wrf',
	    		'success': function(json) {
	    			
	    			//console.log(json);
	    			self._parseJsonMPGene(json);			
	    		}		
	    	});			
	    },
	    
	    _parseJsonMPGene: function(json){
	    	var self = this;
	    		    	
	    	var mpAnnotSources = self.options.mpAnnotSources;
	    	var oMpSrcCount = {};
	    		    	
	    	for ( var src in mpAnnotSources ){	    		    		
	    		
	    		var terms = json.facet_counts['facet_fields']['mp_top_level_term_'+ mpAnnotSources[src]];
	    		if ( terms ){
	    			for ( var i=0; i<terms.length; ){
	    				if ( !oMpSrcCount[terms[i]] ){
	    					oMpSrcCount[terms[i]] = {};	    				
	    				}	    				    						
	    				oMpSrcCount[terms[i]][mpAnnotSources[src]] = terms[i+1];
	    				//console.log(mpAnnotSources[src] + ' : '+ terms[i] + ' -- '+ terms[i+1] );
	    				i += 2;
	    			}
	    		}		    		
	    	}
	    	
	    	//self._createPhenotypeTable(oMpSrcCount);	    	
	    },    
	    
	    _createPhenotypeTable: function(oMpSrcCount){
	    	
	    	
	    },
	    	    
	    _composeSolrParams: function(oParams){
	    	var self = this;
	    	var p = self.options.queryParams;
	    	var aSolrParams = [];
	    	for( var i in p ){        		
        		aSolrParams.push(i + '=' + p[i]);
        	}
	    	
	    	//console.log(aSolrParams.join('&') + '&facet.field=mp_top_level_term_mgi&facet.field=mp_top_level_term_empress');
	    	return aSolrParams.join('&') + '&facet.field=mp_top_level_term_mgi&facet.field=mp_top_level_term_empress';
	    },
	    
	    /*
	     * Natural Sort algorithm for Javascript Version 0.2
	     * Author: Jim Palmer (based on chunking idea from Dave Koelle)
	     * Released under MIT license.console.log(fld + ' : ' + val);
	     */
	    _naturalSort: function(a, b) {

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
	    },

	    destroy: function(){
			// revert to initial state
			// eg. this.element.removeClass('collapseText');
			
			// call the base destroy function
			$.Widget.prototype.destroy.call( this );
		}    
    });
	
}(jQuery));	
	
