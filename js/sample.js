$(document).ready(function(){
	
	// init autocomplete UI with options (overriding defaults)
	var $ac = $('input#userInput').mpi2AutoComplete({		
		//solrURL: "http://172.22.70.60:8983/solr/gene_autosuggest/select",
		solrURL: "http://192.168.1.10:8983/solr/gene_autosuggest/select",
		srcLabel : { // what appears to the user in the AC dropdown list, ie, how a term is prefixed for a particular solr field
					marker_symbol    : 'Gene Symbol',
					marker_name      : 'Gene Name',
					marker_synonym   : 'Gene Synonym',
					mgi_accession_id : 'MGI ID', 
					mp_id            : 'MP ID',
			        mp_term          : 'MP Term', 
			        mp_term_synonym  : 'MP Term Synonym' 
		},
		grouppingId : 'mgi_accession_id',
		searchFields: ['marker_symbol', 'mgi_accession_id', 'marker_name', 'marker_synonym', 'mp_id', 'mp_term', 'mp_term_synonym'],
		queryParams: {'start':0,
					  'rows':50, 
					  'wt':'json', 
					  'group':'on', 
					  'group.field':'mgi_accession_id', 
					  'defType':'edismax',
					  'qf':'auto_suggest', 
					  'fl':"marker_name,marker_synonym,marker_symbol,mgi_accession_id,mp_id,mp_term,mp_term_synonym"},		
		loadGenePage: function(event, data){
			console.log(data.userEvent);
			if ( data.userEvent == 'select' ){				
				console.log('selected val: '+ data.queryString + data.solrJsonResonse);
				// query sorl server with this gene id string query
			}
			else if ( data.userEvent == 'enter' ){
				console.log('entered val: '+ data.queryString+data.solrJsonResonse);
				// start parsing query sorl server with this gene id string query
			}
		}
	}).click(function(){
		$(this).val('');
	});


	
});
