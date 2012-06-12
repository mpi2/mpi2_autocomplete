(function ($) {
	'use strict';
    $.widget('MPI2.mpi2LeftSideBar', {
    
    	options: {
    		mpAnnotSources: ['empress', 'mgi']
			
	    },
	    
    	_create: function(){
    		// execute only once 
    		
    	},
    	
	    // want to use _init instead of _create to allow the widget being called each time
	    _init : function () {
	    	var self = this;  
	    	
	    	$('div#mpTopLevelFacet .facetCat').toggle(
					function(){
						$(this).addClass('facetCatUp');
						$(this).parent().siblings('.facetCatList').show();
					},
					function(){
						$(this).removeClass('facetCatUp');
						$(this).parent().siblings('.facetCatList').hide();
					}
			);					    		    	
	    		
	    	
	    	// fire off solr query
	    	self._doMPFacet();
	    	
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
	    		'url': self.options.solrURL + '?' + self._composeSolrParams(),							
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
	    				console.log(mpAnnotSources[src] + ' : '+ terms[i] + ' -- '+ terms[i+1] );
	    				i += 2;
	    			}
	    		}		    		
	    	}
	    	
	    	//self._createPhenotypeTable(oMpSrcCount);	    	
	    },    
	    
	    _createPhenotypeTable: function(oMpSrcCount){
	    	
	    	
	    },
	    	    
	    _composeSolrParams: function(){
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
	
