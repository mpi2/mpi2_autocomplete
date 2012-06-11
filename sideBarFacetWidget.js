(function ($) {
	'use strict';
    $.widget('MPI2.mpi2LeftSideBar', {
    
    	options: {
    		mpAnnotSources: ['empress', 'mgi']
	    },
	    
    	_create: function(){
    		// execute only once 
    		/*var self = this;
    		    		
	    	self.options.queryParams.q = "*:*";
	    	self.options.queryParams['facet.mincount'] = 0;
	    	self.options.queryParams['facet.field'] = 'mp_top_level_term_mgi';
	    	
	    	$.ajax({ 				 					
				'url': self.options.solrURL, 					
				'data': self.options.queryParams,		
				'dataType': 'jsonp',
				'jsonp': 'json.wrf',
				'success': function(json) {
					console.log(json);
					var mpTopTerms = [];
					
					var terms = json.facet_counts['facet_fields']['mp_top_level_term_mgi'];
		    		for ( var i=0; i<terms.length; ){		    			
		    			mpTopTerms.push(terms[i]);		    			
		    			i += 2;
		    		}
		    		self.options.mpTopLevelTerms = mpTopTerms.sort(self._naturalSort);	
				}
	    	});  */
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
		    				    		
	    	console.log(self.options.queryParams);
		    		
	    	$.ajax({ 				 					
	    		'url': self.options.solrURL + '?' + self._composeSolrParams(),							
	    		'dataType': 'jsonp',
	    		'jsonp': 'json.wrf',
	    		'success': function(json) {
	    			console.log('check: ');
	    			console.log(json);
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
	    	/*
	    	var self = this;
	    	//var mpTopLevelTerms = self.options.mpTopLevelTerms;
	    	var trs = '';
	    	var src1Class, src2Class;
	    	var hasMP = 0;
	    	
	    	for ( var t in mpTopLevelTerms ){
	    		if ( ! oMpSrcCount[mpTopLevelTerms[t]] ){
	    			continue;
	    		}
	    		
	    		var tT = mpTopLevelTerms[t];
	    		var tT2 = mpTopLevelTerms[t].replace('phenotype','');
	    			    		
	    		var mpAnnotSources = self.options.mpAnnotSources;
	    		
	    		for( var i=0; i< mpAnnotSources.length; ){
	    			
	    			src1Class = mpAnnotSources[i];
	    			src2Class = mpAnnotSources[i+1];
	    			
	    			var src1Count = oMpSrcCount[tT][mpAnnotSources[i]] == undefined ? 0 : oMpSrcCount[tT][mpAnnotSources[i]];
	    			var src2Count = oMpSrcCount[tT][mpAnnotSources[i+1]] == undefined ? 0 : oMpSrcCount[tT][mpAnnotSources[i+1]];
	    			
	    			if ( src1Count + src2Count != 0 ){
	    				hasMP = 1;
	    				var tdClass1 = src1Count > 0 ? 'canClick' : '';
	    				var tdClass2 = src2Count > 0 ? 'canClick' : '';
	    				
	    				trs += "<tr><td>"+ tT2 + "</td><td class='" + src1Class + ' ' + tdClass1 + "' rel='" + tT + "'>" + src1Count + "</td>" +
	    						"   <td class='" + src2Class + ' ' + tdClass2 + "' rel='" + tT + "'>" + src2Count + "</td></tr>";
	    			}
	    			i += 2;
	    			
	    		}
	    	}
	    	
	    	if ( hasMP == 0 ){
	    		$('div#mpTopLevelFacet span.facetCount').text(0);
	    		$('div#mpTopLevelFacet div.facetCatList').html('');
	    	}
	    	else {
	    		var tbody = "<tbody>"+ trs +"</tbody>";
	    		var thead = "<tr><th>MP term</th><th class='" + src1Class + "'>E</th><th class='" + src2Class + "'>M</th></tr></thead>";
	    		var caption = "<caption>Genes annotated to MP:<br><span class='" + src1Class + "'>Europhenome</span> / <span class='" + src2Class + "'>MGI</span><hr></caption>";
	    		var table = "<table id='mpfacet'>" + caption + thead + tbody + "</table>";		
			
	    		$('div#mpTopLevelFacet div.facetCatList').html(table);
	    		self._applyJs2FacetCountParser($('table#mpfacet'));
	    		
	    	}	*/
	    	
	    },
	    
	    _applyJs2FacetCountParser: function(oTable){
	    	var self = this;
	
	    	oTable.find('td.canClick').click(function(){
	    		var src = $(this).hasClass('mgi') ? 'mgi' : 'empress'; 
	    		var term = $(this).attr('rel');
	    		//alert(src + ' ' + term);	
	    		// parsing results for matching genes for a top level MP in the Phenotype facet
	    		delete self.options.queryParams.facet;
	    		delete self.options.queryParams['facet.field'];
	    		delete self.options.queryParams['facet.mincount'];
	    		delete self.options.queryParams['facet.limit'];
	    		delete self.options.queryParams.fl;
	    			    		
	    		self.options.queryParams.fl = "mgi_accession_id,mp_top_level_term_" + src;
	    		self.options.queryParams.rows = 50000;
	    		self.options.queryParams['q.opt'] = 'AND';
	    		self.options.queryParams.fq = 'mp_top:' + term;
	    		 
	    		//self.options.queryParams.group = 'on';
	    		//self.options.queryParams['group.field'] = 'mgi_accession_id';
	    		
	    		$.ajax({ 				 					
		    		'url': self.options.solrURL,
		    		'data': self.options.queryParams,
		    		'dataType': 'jsonp',
		    		'jsonp': 'json.wrf',
		    		'success': function(json) {		    			
		    			console.log(json);
		    			self._parseJsonMPFacetCount(json, src, term);			
		    		}		
		    	});	
	    		
	    	});	    	
	    },
	    
	    _parseJsonMPFacetCount: function(json, src, term){
	    	var docs = json.response.docs;
	    	
	    	
	    	var geneIds = [];
    		for ( var d in docs ){    			
    			if ( docs[d]['mp_top_level_term_' + src] ){
    				var topLevelTerms = docs[d]['mp_top_level_term_' + src];
    				for ( var i in topLevelTerms ){
    					if (topLevelTerms[i] == term ){
    						//console.log(d + ': '+ topLevelTerms[i]);
    						geneIds.push(docs[d].mgi_accession_id);    						
    						break;
    					}
    				}
    			}
    		}
    		console.log('counts: ' + geneIds.length);
    				
	    	
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
	
