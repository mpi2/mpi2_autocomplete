<%@ page language="java" contentType="text/html; charset=UTF-8"
    pageEncoding="UTF-8"%>
<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<html>
<head>
	<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">	
	<title>IMPC Generic search</title>
	<link type='text/css' rel='stylesheet' href='http://ajax.googleapis.com/ajax/libs/jqueryui/1.8.18/themes/base/jquery-ui.css'  media='all' /> 
	<link type='text/css' rel='stylesheet' href='../css/jquery.dataTables.css' media='all' />
	<link type='text/css' rel='stylesheet' href='../css/searches.css' media='all' />	
</head>
<body>
	<div class="ui-widget">
		<label for="tags"><b>Search genes</b> by MGI ID, symbol, synonym or name (wildcard * supported): </label>
		<input id="tags"><span id="loading"></span><p><span id="solrInfo"></span>
	</div>
	<div id='geneStatusTable'></div>
	
</body>

  <script type='text/javascript' src='https://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js'></script>
  <!-- <script type='text/javascript' src='http://code.jquery.com/jquery-1.7.1.min.js'></script> --> 
  <script type='text/javascript' src='https://ajax.googleapis.com/ajax/libs/jqueryui/1.8.18/jquery-ui.min.js'></script>
  <script type='text/javascript' src='../js/jquery.dataTables.min.js'></script> 
  <script type='text/javascript' src='../js/namespace.min.js'></script>
  <script type='text/javascript' src='../js/searches.js'></script>

</html>