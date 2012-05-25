(function ($) {
    'use strict';

    if(typeof(window.MPI2) === 'undefined') {
        window.MPI2 = {};
    }
    MPI2.AutoComplete = {};

    MPI2.AutoComplete.searchFields = ["marker_symbol", "mgi_accession_id", "marker_name", "marker_synonym"];
    MPI2.AutoComplete.geneDataFields = ["marker_symbol", "mgi_accession_id", "marker_name", "synonym"];
    MPI2.AutoComplete.fieldsPretty = {
        marker_symbol: 'Gene Symbol',
        marker_name: 'Gene Name',
        mgi_accession_id: 'MGI Id',
        synonym: 'Gene Synonym',
    };
	MPI2.AutoComplete.mapping = {};

    $.widget('MPI2.mpi2AutoComplete', $.ui.autocomplete, {

        options: {
            source: function () {
				this.sourceCallback.apply(this, arguments);				
			},
            minLength: 1,
            delay: 400,
            solrURL: 'http://ikmc.vm.bytemark.co.uk:8983/solr/gene_autosuggest/select',
			select: function(event, ui) {						
				var val = ui.item.value.replace(/^(.+)\s(:)\s(.+)/, '$3');
				var mgiId = MPI2.AutoComplete.mapping[val];
								
				//$('input#auto-complete').val(mgiId);
				var mpi2Search = $(ui).closest('.mpi2-search-container').parent();
				mpi2Search.doSearch({ mgiAccessionId: mgiId }); 			
			}							
        },

        _create : function () {
            var self = this;

            self.element.bind('keyup', function(e) {
                if (e.keyCode == 13) {
                    self.close();
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

		// executes for each item in the list
		_renderItem: function( ul, item ) { 
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
		},
		
        sourceCallback: function (request, response) {
            var self = this;
            var params = {
                start: 0,
                rows: 10,
                q: request.term,
                wt: 'json',
                'group': 'on',
                'group.field': 'mgi_accession_id',
                'defType': 'edismax',
	        	'qf': 'auto_suggest',
                'fl': "marker_name,synonym,marker_symbol,mgi_accession_id"
        	};

 	    	params.q = params.q.replace(/^\s+|\s+$/g, "");
 	   	 	params.q = params.q.replace(":", "\\:"); // so that mgi:* would work

        	$.ajax({
            	    url: self.options.solrURL,
            	    data: params,
            	    dataType: 'jsonp',
            	    jsonp: 'json.wrf',
            	    timeout: 10000,
            	    success: function (solrResponse) {
            	       	response( self.parseSolrGroupedJson(solrResponse, params.q) );									                                                            
            	    },
            	    error: function (jqXHR, textStatus, errorThrown) {
            	        response(['AJAX error']);
            	    }
            	});
        	},

        	parseSolrGroupedJson: function (json, query) {
            	var self = this;

            	//console.log(json);
            	var maxRow   = json.responseHeader.params.rows;
            	var g        = json.grouped.mgi_accession_id;
            	var numFound = g.matches;
            	var groups   = g.groups;

            	var aFields = MPI2.AutoComplete.searchFields;	

            	var list = [];
            	

            	for ( var i in groups ){
               		var geneId = "MGI:" + groups[i].groupValue;

                	var docs = groups[i].doclist.docs;
                	for ( var i in docs ){
                    	for ( var j in aFields ){
                    	    if ( docs[i][aFields[j]] ){
                            	var fld = aFields[j];
                            	var val = docs[i][fld];
							
                            	// marker_synonym, mp_id, mp_term, mp_term_synonym are all multivalued
                            	if (fld == 'synonym' || fld == 'mp_id' || fld == 'mp_term' || fld == 'mp_term_synonym' ){
                              	  var aVals = docs[i][fld];
                               	 for ( j in aVals ){
                                 	var thisVal = aVals[j];
									
                                    // only want indexed terms that have string match to query keyword
                                    if ( thisVal.toLowerCase().indexOf(query) != -1 || query.indexOf('*') != -1 ){
										MPI2.AutoComplete.mapping[thisVal] = geneId;
                                        list.push(MPI2.AutoComplete.fieldsPretty[fld] + " : " +  thisVal);
                                    }
                                }
                            }
                            else {
                                if ( val.toLowerCase().indexOf(query) != -1 || query.indexOf('*') != -1 ){
                                    MPI2.AutoComplete.mapping[val] = geneId;
                                    list.push(MPI2.AutoComplete.fieldsPretty[fld] + " : " +  val);
                                }
                            }
                        }
                    }
                }
            }
            return self.getUnique(list);
			
        },

        getUnique: function (list) {
            var u = {}, a = [];
            for(var i = 0, l = list.length; i < l; ++i){
                if(list[i] in u){
                    continue;
                }
                a.push(list[i]);
                u[list[i]] = 1;
            }
            return a;
        }

    });

	

}(jQuery));
