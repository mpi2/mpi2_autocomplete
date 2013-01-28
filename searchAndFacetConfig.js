/**
 * Copyright © 2011-2013 EMBL - European Bioinformatics Institute
 * 
 * Licensed under the Apache License, Version 2.0 (the "License"); 
 * you may not use this file except in compliance with the License.  
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * 
 * searchAndFacetConfig: definition of variables for the search and facet 
 * see searchAndFacet directory
 * 
 * Author: Chao-Kung Chen
 * 
 */
 
MPI2 = {};
MPI2.buttCount = 0;
	
MPI2.searchAndFacetConfig = {};
var config = MPI2.searchAndFacetConfig;
		
//config.solrBaseURL_bytemark = 'http://dev.mousephenotype.org/bytemark/solr/';

// on drupal side this is not available

if ( typeof solrUrl == 'undefined' ){
	var domain = document.domain;
	if ( /^beta/.test(domain) ){		
		solrUrl = 'http://' + domain + '/mi/impc/beta/solr';
	}
	else if ( /^dev/.test(domain) ){	
		solrUrl = 'http://' + domain + '/mi/impc/dev/solr';
	}			
}

if ( typeof baseUrl == 'undefined' ){
	baseUrl = '/phenotype-archive';
}
console.log(typeof baseUrl);
console.log(baseUrl);

config.solrBaseURL_bytemark = solrUrl + '/';
config.solrBaseURL_ebi = solrUrl + '/';

config.spinner = "<img src='img/loading_small.gif' /> Processing search ...";
config.spinnerExport = "<img src='img/loading_small.gif' /> Processing data for export, please do not interrupt ... ";
config.endOfSearch = "Search result";

// custom 404 page does not know about baseUrl
var path = window.location.pathname.replace(/^\//,"");
path = '/' + path.substring(0, path.indexOf('/'));
//var trailingPath = '/searchAndFacet';
var trailingPath = '/search';
var trailingPathDataTable = '/dataTable';

config.pathname = typeof baseUrl == 'undefined' ? path + trailingPath : baseUrl + trailingPath;
config.dataTablePath = typeof baseUrl == 'undefined' ? path + trailingPathDataTable : baseUrl + trailingPathDataTable;
		
config.facetParams = {	
	 geneFacet:      {
		 type: 'genes',			
		 solrCoreName: 'gene',			 
		 tableCols: 3, 
		 tableHeader: "<thead><th>Gene</th><th>Latest Status</th><th>Register for Updates</th></thead>",
		 fq: undefined,
		 gridName: 'geneGrid',
		 gridFields: 'marker_symbol,synonym,marker_name', // should include status soon
		 params: {'sort': "marker_symbol asc"}	 
	 },	
	 pipelineFacet: {		
		 type: 'procedures',		 
		 solrCoreName: 'pipeline',			
		 tableCols: 3, 
		 tableHeader: '<thead><th>Parameter</th><th>Procedure</th><th>Pipeline</th></thead>', 
		 fq: "pipeline_stable_id:IMPC_001", 
		 qf: 'auto_suggest', 
		 defType: 'edismax',
		 wt: 'json',
		 gridFields: 'parameter_name,procedure_name,pipeline_name',
		 gridName: 'pipelineGrid',	
		 params:{'fq': 'pipeline_stable_id:IMPC_001'}	 
	 },	
	 mpFacet: {	
		 type: 'phenotypes',
		 solrCoreName: 'mp', 
		 tableCols: 2, 
		 tableHeader: '<thead><th>Phenotype</th><th>Definition</thead>', 
		 fq: "ontology_subset:*", 
		 qf: 'auto_suggest', 
		 defType: 'edismax',
		 wt: 'json',
		 gridFields: 'mp_term,mp_definition,mp_id,top_level_mp_term',
		 gridName: 'mpGrid',
		 topLevelName: '',
		 ontology: 'mp',
		 params: {'fq': "ontology_subset:*", 'fl': 'mp_id,mp_term,mp_definition,top_level_mp_term'},
	 },		 
	 imagesFacet: {		
		 type: 'images',
		 solrCoreName: 'images', 
		 tableCols: 2, 
		 tableHeader: '<thead><th>Name</th><th>Example Images</th></thead>', 
		 fq: 'annotationTermId:M* OR expName:* OR symbol:* OR higherLevelMaTermName:* OR higherLevelMpTermName:*',			 
		 qf: 'auto_suggest', 
		 defType: 'edismax',
		 wt: 'json',
		 gridFields: 'annotationTermId,annotationTermName,expName,symbol_gene,smallThumbnailFilePath,largeThumbnailFilePath',
		 gridName: 'imagesGrid',
		 topLevelName: '',
		 imgViewSwitcherDisplay: 'Annotation View',
		 forceReloadImageDataTable: false,
		 showImgView: true,
		 params: {//'fl' : 'annotationTermId,annotationTermName,expName,symbol,symbol_gene,smallThumbnailFilePath,largeThumbnailFilePath',
			 	  'fq' : "annotationTermId:M* OR expName:* OR symbol:* OR higherLevelMaTermName:* OR higherLevelMpTermName:*"},
	 }
}; 

