window.jQuery(document).ready(function(){ 
	
	MPI2.searchAndFacetConfig = {};
	var config = MPI2.searchAndFacetConfig;
	
	config.facetParams = {	
		 gene:      {
			 type: 'gene',
			 solrCoreName: 'gene', 
			 tableCols: 3, 
			 tableHeader: "<thead><th>Gene</th><th>Latest Status</th><th>Register for Updates</th></thead>",
			 gridName: 'geneGrid'
		 },
		 parameter: {
			 type: 'protocol',
			 solrCoreName: 'pipeline', 
			 tableCols: 3, 
			 tableHeader: '<thead><th>Parameter</th><th>Procedure</th><th>Pipeline</th></thead>', 
			 fq: "pipeline_stable_id:IMPC_001", 
			 qf: 'auto_suggest', 
			 defType: 'edismax',
			 wt: 'json'
		 },
		 phenotype: {
			 type: 'Phenotype',
			 solrCoreName: 'mp', 
			 tableCols: 2, 
			 tableHeader: '<thead><th>Phenotype</th><th>Definition</thead>', 
			 fq: "ontology_subset:*", 
			 qf: 'auto_suggest', 
			 defType: 'edismax',
			 wt: 'json'
		 },
		 image:     {
			 type: 'image',
			 solrCoreName: 'images', 
			 tableCols: 2, 
			 tableHeader: '<thead><th>Name</th><th>Example Images</th></thead>', 
			 fq: "annotationTermId:M*", 
			 qf: 'auto_suggest', 
			 defType: 'edismax',
			 wt: 'json'			 
		 }					
	}; 
});


