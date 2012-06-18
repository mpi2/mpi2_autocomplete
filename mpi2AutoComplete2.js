(function ($) {
    'use strict';

    if(typeof(window.MPI2) === 'undefined') {
        window.MPI2 = {};
    }    
    MPI2.AutoComplete = {};    
	MPI2.AutoComplete.mapping = {};
	
    $.widget('MPI2.mpi2AutoComplete2', $.ui.autocomplete, {
    
    	options: {
    		source: function () {
				this.sourceCallback.apply(this, arguments);				
			},
			grouppingId : 'mgi_accession_id',
			searchFields: ["marker_symbol", "mgi_accession_id_key", "marker_name", "synonym", "marker_synonym", "allele_synonym"],
			queryParams: {'start':0,
				  			'rows':50, 
				  			'wt':'json', 
				  			'group':'on',					
				  			'group.field':'mgi_accession_id', 
				  			'defType':'edismax',
				  			'qf':'auto_suggest', 
				  			'fl':"marker_name,marker_synonym,marker_symbol,mgi_accession_id,allele_synonym"},	
			srcLabel: {},			
			mouseSelected: 0,
			rowShown: 50,
            minLength: 1,
            delay: 300,  
            solrJsonResponse: {},          
            solrURL: 'http://ikmc.vm.bytemark.co.uk:8983/solr/gene_autosuggest/select',
			select: function(event, ui) {				
				console.log(ui.item.value);
				var thisWidget = $(this).data().mpi2AutoComplete2; // this widget
								
				thisWidget.options.mouseSelected = 1;
				var termVal = ui.item.value.replace(/^(.+)\s(:)\s(.+)/, '$3');
												
				if ( MPI2.AutoComplete.mapping[termVal] ){
					var geneId = MPI2.AutoComplete.mapping[termVal];
					
					var solrQStr = thisWidget.options.grouppingId + ':(' + geneId.replace(/:/g,"\\:") + ')';
					var solrParams = thisWidget._makeSolrURLParams(solrQStr);					
					
					thisWidget._trigger("loadGenePage", null, { queryString: solrQStr, queryParams: solrParams});	
					thisWidget._trigger("loadSideBar", null, { matchesFound: 1, 
															   queryString: solrQStr											   														   
															});
				}	
				else {				
					// user should have selected a term other than gene Id/name/synonym
					// fetch all MGI gene ids annotated to this term
					var solrField = /MP Term Synonym/.test(ui.item.value) ? 'mp_term_synonym' : 'mp_term';
					var solrQStr = solrField + ':' + '"' + termVal + '"';
					var solrParams = thisWidget._makeSolrURLParams(solrQStr);					
					
					thisWidget._trigger("loadGenePage", null, { queryString: solrQStr, queryParams: solrParams});	
					
					thisWidget._fetch_matching_gene_count_by_search_term(solrQStr);					
				}				
			},
			close : function(event, ui){  // result dropdown list closed
	 			//nothing to do for now
	 		},	
        },
        
        _create : function () {
            var self = this;  
            self.element.val('Search genes, MP terms by MGI/MP ID, gene symbol, synonym or name');  
            
            self.element.bind('keyup', function(e) {
            	            	
                if (e.keyCode == 13) {
                    self.close();
                    var solrParams = self._makeSolrURLParams(self.term);
                    // need to distinguish between enter on the input box and enter on the drop down list
                    // ie, users use keyboard, instead of mouse, to navigate the list and hit enter to choose a term
                    if (self.options.mouseSelected == 0 ){                    	
                    	// the value in the input box
                    	
                    	self._trigger("loadGenePage", null, { queryString: self.term, queryParams: solrParams });
                    	self._trigger("loadSideBar", null, { 
							matchesFound: self.options.matchesFound, 
							queryString: self.term																					   
						});                    	
                    }
                }
            });
            
            $('button#acSearch').click(function(){            	
            	if ( self.term == undefined ){
            		alert('Sorry, please enter your keyword in the input box for search - thank you');
            	}
            	else {
            		var solrParams = self._makeSolrURLParams(self.term);
            		self._trigger("loadGenePage", null, { queryString: self.term, queryParams: solrParams });
            		
            		self._trigger("loadSideBar", null, { 
            			matchesFound: self.options.matchesFound, 
            			queryString: self.term																					   
            		}); 
            		  
            	}
            });
            
            self.element.click(function(){
            	self.term = undefined; 
            	$('div#geneFacet span.facetCount').text('');
            	$('div#mpTopLevelFacet span.facetCount').text('');
            	$('div#mpTopLevelFacet div.facetCatList').html('');
            })
            
            // remove facet count for gene when input box is empty
            self.element.keyup(function(){            	
            	if ( self.element.val() == '' ){
            		$('div#geneFacet span.facetCount').text('');            		
            	} 	
            });
            
            $.ui.autocomplete.prototype._create.apply(this);			
        },   
        
        _fetch_matching_gene_count_by_search_term: function(solrQStr) {
        	var self = this;
        		
			var solrUrl = self.options.solrURL;
						
			var queryParams = {'start':0,
				  			  'rows':0, // limit display in AC dropdown list for performance & practicality
				  			  'wt':'json',
				  			  'q': solrQStr
				  			  }; 
			//console.log(queryParams);
			$.ajax({ 				 					
				'url': solrUrl, 					
				'data': queryParams,		
				'dataType': 'jsonp',
				'jsonp': 'json.wrf',
				'success': function(json) {	
					//console.log(json);
					self._trigger("loadSideBar", null, { 
							matchesFound: json.response.numFound, 
							queryString: solrQStr																					   
						});
				}		
			});	        	
        },           
        
        _makeSolrURLParams: function(solrQStr){   
        	var self = this;
        	delete self.options.queryParams.q;
        	var p = this.options.queryParams;
        	var aSolrParams = [];
        	for( var i in p ){        		
        		aSolrParams.push(i + '=' + p[i]);
        	}
        	//var solrQStr = 'q=' + self.options.grouppingId + ':(' + qry.replace(/:/g,"\\:") + ')';
        	//self.options.solrQStr = solrQStr;
        	
        	aSolrParams.push('q='+solrQStr);
        	return 	aSolrParams.join('&');
        },             
        
        _setOption: function (key, value) {
            switch(key) {
            case 'solrURL':
                this.options.solrURL = value;
                break;
            }
            $.ui.autocomplete.prototype._setOption.apply(this, arguments);
        },
        
		// the loops thru each item in the list
        // and highlight the match string
		_renderItem: function( ul, item ) { 
 		
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
		},
				
		_parseSolrGroupedJson: function (json, query) {
			var self = this;              
			console.log(json);
           	var g = json.grouped[self.options.grouppingId]; 
           	var maxRow = json.responseHeader.params.rows;
           	var matchesFound = g.matches;
			console.log('found: '+ matchesFound);
           	self.options.matchesFound = matchesFound;
                      
			//self._temp_synch(query);

           	$('div#geneFacet span.facetCount').text(matchesFound);
           	var groups   = g.groups;
           	var aFields  = self.options.searchFields;	
           	var srcLabel = self.options.srcLabel;
           	var list     = [];
           	           	
           	for ( var i in groups ){
        		var geneId = groups[i].groupValue;
        		        		
        		var docs = groups[i].doclist.docs;
        		for ( var d in docs ){	
        			for ( var f in aFields ){
        				if ( docs[d][aFields[f]] ){					
        					var fld = aFields[f];
        					var val = docs[d][fld];		
        					//console.log('field: '+ fld + ' -- val: ' + val + ' : ' + typeof val);
        					// marker_synonym, mp_id, mp_term, mp_term_synonym are all multivalued
        					if ( fld == 'marker_synonym' || fld == 'allele_synonym' || fld == 'mp_id' || fld == 'mp_term' || fld == 'mp_term_synonym' ){
        						var aVals = docs[d][fld];
        						for ( var v in aVals ){						
        							var thisVal = aVals[v];
        							
        							// only want indexed terms that have string match to query keyword
        							if ( thisVal.toLowerCase().indexOf(query) != -1 || query.indexOf('*') != -1 ){
        								
        								if (fld == 'marker_synonym' || fld == 'allele_synonym'){
        									MPI2.AutoComplete.mapping[thisVal] = geneId;        									
        								} 
        								list.push(srcLabel[fld] + " : " +  thisVal);
        							}							
        						}
        					}
        					else {        						
        						if ( val.toLowerCase().indexOf(query) != -1 || query.indexOf('*') != -1 ){
        							MPI2.AutoComplete.mapping[val] = geneId;        										
        							list.push(srcLabel[fld] + " : " +  val);
        						}	
        					}
        				}
        			}		
        		}
        	}	     	
           	
            return self._getUnique(list);			
        },	
        
        _getUnique: function (list) {
        	var u = {}, a = [];
        	for(var i = 0, l = list.length; i < l; ++i){
        		if(list[i] in u){
        			continue;
        		}
        		a.push(list[i]);
        		u[list[i]] = 1;
        	}
        	return a;
        },	

		_temp_synch: function(){
       		// this is here to make geneGrid and geneFacet count in synch before we sort things out
            $.ajax({ 				 					
            	'url': 'http://ikmc.vm.bytemark.co.uk:8983/solr/select?wt=json&start=0&rows=0', 					
            	'data': "q=" + data.queryString,		
            	'dataType': 'jsonp',
            	'jsonp': 'json.wrf',
            	'success': function(json) {
                        //console.log(json);                        
                        $('div#geneFacet span.facetCount').text(json.response.numFound); // number of genes found by the search keyword
            	}		
            });	              
        },
        
        sourceCallback: function (request, response) {
        	var self = this;
        	
        	self.options.mouseSelected = 0; // important to distinguish between mouse select and keyborad select
                       
 	    	var q = request.term.replace(/^\s+|\s+$/g, ""); // trim away leading/trailing spaces
 	    	//q = q.replace(":", "\\:");  // so that mgi:* would work
 	    	q = q.toLowerCase();        // so that capitalized search would work as solr analyzer used use only lowercase
 	    	self.options.queryParams.q = q;	
			console.log('qry');
			console.log(self.options.solrURL + self._makeSolrURLParams(q));
        	$.ajax({
            	    url: self.options.solrURL,
            	    data: self.options.queryParams,
            	    dataType: 'jsonp',
            	    jsonp: 'json.wrf',
            	    timeout: 10000,
            	    success: function (solrResponse) {        	    	
            	    	
            	       	response( self._parseSolrGroupedJson(solrResponse, q) );									                                                            
            	    },
            	    error: function (jqXHR, textStatus, errorThrown) {
            	        response(['AJAX error']);
            	    }            	
        	});
    	}        	
    });
    
}(jQuery));
