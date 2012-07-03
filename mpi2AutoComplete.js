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
			searchFields: ["marker_symbol", "mgi_accession_id_key", "marker_name", "synonym", "marker_synonym", "allele_synonym"],
			queryParams_gene: {'start':0,
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
            delay: 100,            
			solrBaseURL_ebi: 'http://wwwdev.ebi.ac.uk/mi/solr/',
            solrBaseURL_bytemark: 'http://ikmc.vm.bytemark.co.uk:8983/solr/', 
            acList: [],                  
			select: function(event, ui) {				
				//console.log(ui.item.value);
				var thisWidget = $(this).data().mpi2AutoComplete2; // this widget
				thisWidget.options.mouseSelected = 1;
				thisWidget._inputValMappingForCallBack(ui.item.value);
			},
			close: function(event, ui){  // result dropdown list closed
	 			//nothing to do for now
	 		},	
			focus: function(){				
				//nothing to do for now					
			}			
        },
        
		_inputValMappingForCallBack: function(input){
			var self = this;
			var termVal = input.replace(/^(.+)\s(:)\s(.+)/, '$3');
			var solrField = input.replace(/^(.+)\s(:)\s(.+)/, '$1').replace(/ /g, '_').toLowerCase();	
			var solrQStr = input;
			var solrParams= null;
			
			if ( input.indexOf(':') == -1 ){
				self._trigger("loadSideBar", null, { queryString: solrQStr });
			}
			else if ( MPI2.AutoComplete.mapping[termVal] ){
				
				var geneId = MPI2.AutoComplete.mapping[termVal];
					
				solrQStr = self.options.grouppingId + ':"' + geneId.replace(/:/g,"\\:") + '"';
				solrParams = self._makeSolrURLParams(solrQStr);					
				//console.log('MOUSE1: '+ solrQStr + ' -- ' + ui.item.value + ' termVal: ' + termVal);				
				self._trigger("loadSideBar", null, { queryString: solrQStr, geneFound: 1 });
			}	
			else if (input.indexOf(':') != -1 ) {				
				// user should have selected a term other than gene Id/name/synonym
				// fetch all MGI gene ids annotated to this term					
				solrQStr = solrField + ':' + '"' + termVal + '"';
				solrParams = self._makeSolrURLParams(solrQStr);					
				//console.log('MOUSE2: '+ solrQStr + ' -- ' + ui.item.value + ' termVal: ' + termVal);									
				self._trigger("loadSideBar", null, { queryString: solrQStr, geneFound: 0 });								
			}					
			
			self._trigger("loadGenePage", null, { queryString: solrQStr, queryParams: solrParams});	
		},

        _create : function () {
            var self = this;  
            self.element.val(self._showSearchMsg());  
            
            self.element.bind('keyup', function(e) {
				console.log('keyup');
            	//self.close();           	
                if (e.keyCode == 13) {
					console.log('enter');
                    self.close();
                    var solrParams = self._makeSolrURLParams(self.term);
					
                    // need to distinguish between enter on the input box and enter on the drop down list
                    // ie, users use keyboard, instead of mouse, to navigate the list and hit enter to choose a term
                    if (self.options.mouseSelected == 0 ){                    	
                    	// use the value in the input box for query 
                    	self._trigger("loadGenePage", null, { queryString: self.term, queryParams: solrParams });
                    	self._trigger("loadSideBar", null, { 
							matchesFound: self.options.matchesFound, 
							queryString: self.term																					   
						});  						      	
                    }					
                }}	

            );
            
            $('button#acSearch').click(function(){            	
            	if ( self.term == undefined ){
            		alert('Sorry, please enter your keyword in the input box for search - thank you');
            	}
            	else {					
            		var solrParams = self._makeSolrURLParams(self.term);															
					self._inputValMappingForCallBack(self.term);            		          		 
            	}
            });

            var facetDivs = ['geneFacet', 'phenotypeFacet', 'pipelineFacet'];			

            self.element.click(function(){
            	self.term = undefined; 				
				for( var i=0; i<facetDivs.length; i++ ){
					$('div#' + facetDivs[i] + ' span.facetCount').text('');
					$('div#' + facetDivs[i] + ' div.facetCatList').html('');	
				}            	
            });   

            // remove facet count for gene when input box is empty/changed
            self.element.keyup(function(){            	
            	if ( self.element.val() == '' ){
            		for( var i=0; i<facetDivs.length; i++ ){
            			$('div#' + facetDivs[i] + ' span.facetCount').text(''); 					 
					}           			
            	} 													
            });
            
            $.ui.autocomplete.prototype._create.apply(this);			
        },   

        _showSearchMsg: function(){
			return 'Search genes, MP terms, SOP by MGI/MP ID, gene symbol, synonym or name';
		},     
        
        _makeSolrURLParams: function(solrQStr){   
        	var self = this;
        	delete self.options.queryParams_gene.q;
        	var p = this.options.queryParams_gene;
        	var aSolrParams = [];
        	for( var i=0; i<p.length; i++ ){        		
        		aSolrParams.push(i + '=' + p[i]);
        	}
        	
        	aSolrParams.push('q='+solrQStr);
        	return 	aSolrParams.join('&');
        },             
        
        _setOption: function (key, value) {
            switch(key) {
            case 'solrBaseURL_bytemark':
                this.options.solrBaseURL_bytemark = value;
                break;
            }
            $.ui.autocomplete.prototype._setOption.apply(this, arguments);
        },
        
		// the loops thru each item in the list
        // and highlight the match string
		_renderItem: function( ul, item ) { 
 			// highlight the matching characters in string 		
 		 	var term = this.term.split(' ').join('|');
 		 	var sep = ' : ';
 		 	var vals = item.label.split(sep);
 		 	 		 	
 			var qStr = term.replace(/\*/g, "\\w+"); 			
 			qStr = qStr.replace(/\(/g, "\\(");
 			qStr = qStr.replace(/\)/g, "\\)"); 	
 		
 			var re = new RegExp("(" + qStr + ")", "gi") ;
 			//var t = item.label.replace(re,"<b>$1</b>");
 			var t = vals[1].replace(re,"<b>$1</b>");
 			if ( t.indexOf("<b>") > -1 ){
 				return $( "<li></li>" )
 		    		.data( "item.autocomplete", item )
 		    		.append( "<a>" + vals[0] + sep + t + "</a>" )
 		    		.appendTo( ul ); 			 				
 			} 			
		},

		_parseSopJson: function(json, query) {
			//console.log(json);
			var self = this;
			var matchesFound = json.response.numFound;			
			$('div#pipelineFacet span.facetCount').text(matchesFound);
			$('div#pipelineFacet .facetCatList').html(''); 

			var fields = ['parameter_name', 'procedure_name'];
			var list = [];
			var docs = json.response.docs;
			for ( var d=0; d<docs.length; d++ ){	
				for( var f=0; f<fields.length; f++){
					var fld = fields[f];
					var val = docs[d][fld];
					if ( val ){
						if ( val.toLowerCase().indexOf(query) != -1 || query.indexOf('*') != -1 ){				
							list.push(self.options.srcLabel[fld] + ' : ' + val);
						}
					}
				}
			}
			
			self.options.acList = self.options.acList.concat(self._getUnique(list));				
		},		

		_parseGeneGroupedJson: function (json, query) {
			var self = this;              
			//console.log(query);
           	var g = json.grouped[self.options.grouppingId]; 
           	var maxRow = json.responseHeader.params.rows;
           	var matchesFound = g.matches;
			//console.log('found: '+ matchesFound);
           	self.options.matchesFound = matchesFound;   

           	$('div#geneFacet span.facetCount').text(matchesFound);
           	var groups   = g.groups;
           	var aFields  = self.options.searchFields;	
           	var srcLabel = self.options.srcLabel;
           	var list     = [];
           	           	
           	for ( var i=0; i<groups.length; i++){
        		//var geneId = groups[i].groupValue;
        		        		
        		var docs = groups[i].doclist.docs;
        		for ( var d=0; d<docs.length; d++ ){	
        			for ( var f=0; f<aFields.length; f++ ){
        				if ( docs[d][aFields[f]] ){	
							var geneId = docs[d][self.options.grouppingId];			
        					var fld = aFields[f];
        					var val = docs[d][fld];		
        					//console.log('field: '+ fld + ' -- val: ' + val + ' : ' + typeof val);
        					// marker_synonym, mp_id, mp_term, mp_term_synonym are all multivalued
        					if ( fld == 'marker_name' || fld == 'marker_synonym' || fld == 'synonym' || fld == 'allele_synonym' || fld == 'mp_id' || fld == 'mp_term' || fld == 'mp_term_synonym' ){
        						var aVals = docs[d][fld];
        						for ( var v=0; v<aVals.length; v++ ){						
        							var thisVal = aVals[v];
        							
									//alert(thisVal + ': '+ typeof thisVal);
        							// only want indexed terms that have string match to query keyword
									
        							if ( thisVal.toLowerCase().indexOf(query) != -1 || query.indexOf('*') != -1 ){
        								
        								if (fld == 'marker_name' || fld == 'synonym' || fld == 'marker_synonym' || fld == 'allele_synonym'){
        									MPI2.AutoComplete.mapping[thisVal] = geneId;        									
        								} 
        								list.push(srcLabel[fld] + " : " +  thisVal);
        							}							
        						}
        					}
        					else {        						
        						if ( val.toLowerCase().indexOf(query) != -1 || query.indexOf('*') != -1 ){
									//console.log(fld + ' : ' + val + ' id: ' + geneId);
        							MPI2.AutoComplete.mapping[val] = geneId;        										
        							list.push(srcLabel[fld] + " : " +  val);
        						}	
        					}
        				}
        			}		
        		}
        	}	     	
           	self.options.acList = self._getUnique(list);             			
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
 	    	q = q.toLowerCase();        // so that capitalized search would work as solr analyzer used use only lowercase
 	    	self.options.queryParams_gene.q = q;	
			
			//console.log(self.options.solrURL +'?'+ self._makeSolrURLParams(q));
        	$.ajax({
            	    url: self.options.solrBaseURL_bytemark + 'main/search',
            	    data: self.options.queryParams_gene,
            	    dataType: 'jsonp',
            	    jsonp: 'json.wrf',
            	    timeout: 10000,
            	    success: function (geneSolrResponse) { 
						self._doPipelineAutoSuggest(geneSolrResponse, q, response); 
            	    },
            	    error: function (jqXHR, textStatus, errorThrown) {
            	        response(['AJAX error']);
            	    }            	
        	});
    	},

		_doPipelineAutoSuggest: function(geneSolrResponse, q, response){
    		
    		var self = this;
    		var queryParams = {    				
    			'fq': 'pipeline_stable_id=IMPC_001',    			
    			'fl': 'parameter_name,procedure_name',
    			'qf': 'auto_suggest',
    			'defType': 'edismax',
    			'wt': 'json',
    			'rows': 50,
    			'q': q
    		};
    		$.ajax({
        	    url: self.options.solrBaseURL_ebi + 'pipeline/select',
        	    data: queryParams,
        	    dataType: 'jsonp',
        	    jsonp: 'json.wrf',
        	    timeout: 10000,
        	    success: function (sopSolrResponse) {
        	    	//console.log(geneSolrResponse);
        	    	//console.log(sopSolrResponse);  
        	    	self._parseGeneGroupedJson(geneSolrResponse, q);        	    	
        	    	self._parseSopJson(sopSolrResponse, q);
        	    	response(self.options.acList);
        	    },
        	    error: function (jqXHR, textStatus, errorThrown) {
        	        response(['AJAX error']);
        	    }
    		});    			
    	}        	
    });    
}(jQuery));
