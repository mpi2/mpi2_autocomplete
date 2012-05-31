(function ($) {
    'use strict';

    if(typeof(window.MPI2) === 'undefined') {
        window.MPI2 = {};
    }    
    MPI2.AutoComplete = {};    
	MPI2.AutoComplete.mapping = {};
	
    $.widget('MPI2.mpi2AutoComplete', $.ui.autocomplete, {
    
    	options: {
    		source: function () {
				this.sourceCallback.apply(this, arguments);				
			},
			grouppingId : 'mgi_accession_id',
			searchFields: ["marker_symbol", "mgi_accession_id", "marker_name", "marker_synonym"],
			srcLabel: {},
			qf: 'auto_suggest', // solr query field
			mouseSelected: 0,
			rowShown: 50,
            minLength: 1,
            delay: 300,  
            solrJsonResponse: {},          
            solrURL: 'http://ikmc.vm.bytemark.co.uk:8983/solr/gene_autosuggest/select',
			select: function(event, ui) {				
				var thisWidget = $(this).data().mpi2AutoComplete; // this widget
								
				thisWidget.options.mouseSelected = 1;
				var termVal = ui.item.value.replace(/^(.+)\s(:)\s(.+)/, '$3');
				var geneIds = [];
								
				if ( MPI2.AutoComplete.mapping[termVal] ){
					var geneId = MPI2.AutoComplete.mapping[termVal].replace(":","\\:");					
					thisWidget._trigger("loadGenePage", null, { queryString: geneId });	
				}	
				else {				
					// user should have selected a term other than gene Id/name/synonym
					// fetch all MGI gene ids annotated to this term
					thisWidget._fetch_mgi_accession_ids_by_MP(ui.item.value, termVal); 
				}				
			},
			close : function(event, ui){  // result dropdown list closed
	 			$('div#solrInfo').html('');
	 		},	
        },
        
        _create : function () {
            var self = this;  
                        
            self.element.bind('keyup', function(e) {
                if (e.keyCode == 13) {
                    self.close();
                    
                    // need to distinguish between enter on the input box and enter on the drop down list
                    // ie, users use keyboard, instead of mouse, to navigate the list and hit enter to choose a term
                    if (self.options.mouseSelected == 0 ){                    	
                    	// the value in the input box                    	
                    	self._trigger("loadGenePage", null, { queryString: self.term });
                    }
                }
            });
            $.ui.autocomplete.prototype._create.apply(this);			
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
		
		_fetch_mgi_accession_ids_by_MP: function(prefixedVal, termVal){
			var self = this;
			
 			if ( /^MP (.*) : (.+)$/.test(prefixedVal) ){
 				//IMPC.listSelectMp = true;
 				//IMPC.selectedId = false;
 				
 				var termMapping = {'Id'           : 'mp_id',
 						           'Term'         : 'mp_term',
 							       'Term Synonym' : 'mp_term_synonym'
 				};
 				 				
 				var pattern = /^MP (.*) :/; 
 				var matches = prefixedVal.match(pattern);
 				var fld = matches[1]; 				 				
 				var val = fld == 'Id' ? termVal.replace(":", "\\:") : '"' + termVal + '"'; 				
 				var solrQry = termMapping[fld] + ':' + val;
 				console.log('solr qry: ' + solrQry);
 				self._fetch_MP_related_genes_from_solr(solrQry); 				
 			}			
		},

		_fetch_MP_related_genes_from_solr: function(solrQry){
			var self = this;
			self.options.queryParams.q = solrQry;			
			self.options.queryParams.fl = 'mgi_accession_id';
			var solrUrl = self.options.solrURL;	
						
			$.ajax({ 				 					
				'url': solrUrl, 					
				'data': self.options.queryParams,		
				'dataType': 'jsonp',
				'jsonp': 'json.wrf',
				'success': function(json) {			
					self._parseJsonMPGene(json);			
				}		
			});	
		},
		
		_parseJsonMPGene: function(json) {
			console.log(json);
			
			var self = this;
			
			self.options.solrJsonResponse = json;
			
			var geneIds = [];
			// using grouping here is to ensure no duplicates
			//var maxRow       = json.responseHeader.params.rows;
			var g            = json.grouped.mgi_accession_id;
			var matchesFound = json.grouped.mgi_accession_id.matches;
			var groups   = g.groups;
			for (var i in groups ){
				geneIds.push(groups[i].groupValue.replace(":", "\\:"));
			}			
			$('div#solrInfo').html(">>> "+ matchesFound + " matches found in database");
			
			self._trigger("loadGenePage", null, 
						{queryString: geneIds.join(" or "), 
				 		solrJsonResonse: json, 
				 		userEvent: 'select'});		
		},

		_parseSolrGroupedJson: function (json, query) {
			var self = this;              
           
           	var g = json.grouped[self.options.grouppingId]; 
           	var maxRow = json.responseHeader.params.rows;
           	var matchesFound = g.matches;
           	$('div#solrInfo').html(">>> "+ matchesFound + " matches found in database");
           	
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
        					if (fld == 'marker_synonym' || fld == 'mp_id' || fld == 'mp_term' || fld == 'mp_term_synonym' ){
        						var aVals = docs[d][fld];
        						for ( var v in aVals ){						
        							var thisVal = aVals[v];
        							
        							// only want indexed terms that have string match to query keyword
        							if ( thisVal.toLowerCase().indexOf(query) != -1 || query.indexOf('*') != -1 ){
        								
        								if (fld == 'marker_synonym'){
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
        
        sourceCallback: function (request, response) {
        	var self = this;
        	
        	self.options.mouseSelected = 0; // important to distinguish between mouse select and keyborad select
                       
 	    	var q = request.term.replace(/^\s+|\s+$/g, ""); // trim away leading/trailing spaces
 	    	q = q.replace(":", "\\:");                      // so that mgi:* would work
 	    	self.options.queryParams.q = q;

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

    $.widget("MPI2.mpi2SearchInput", {

        _create: function () {
            var self = this;

            self.container = this.element;
            self.container.addClass('mpi2-search-input');

            self.input = $('<input type="text" placeholder="e.g. Cbx1"></input>');
            self.container.append(self.input);

            self.input.mpi2AutoComplete({
				loadGenePage: function(event, data){					
					// data.queryString is the q
					// invoke the gene grid
				}
			});

            self.button = $('<button class="search">Search</button>');
            self.container.append(self.button);
			
        },

        destroy: function () {
            var self = this;
            $.Widget.prototype.destroy.call(self);
            self.container.removeClass('mpi2-search-input');
            self.container.html('');
        }
    });

}(jQuery));
