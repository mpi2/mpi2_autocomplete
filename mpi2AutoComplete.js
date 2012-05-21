(function ($) {
    'use strict';

    if(typeof(window.MPI2) === 'undefined') {
        window.MPI2 = {};
    }
    MPI2.AutoComplete = {};

    $.widget('MPI2.mpi2AutoComplete', $.ui.autocomplete, {

        options: {
            source: function () {this.sourceCallback.apply(this, arguments);},
            minLength: 1,
            delay: 400,
            solrURL: 'http://ikmc.vm.bytemark.co.uk:8983/solr/gene_autosuggest/select'
        },

        _create : function () {
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

        sourceCallback: function (request, response) {
            var self = this;
            var params = {
                start: 0,
                rows: 10,
                q: request.term,
                wt: 'json'
            };

            params.q = params.q.replace(/[^A-Za-z0-9]/g, '');

            $.ajax({
                url: self.options.solrURL,
                data: params,
                dataType: 'jsonp',
                jsonp: 'json.wrf',
                timeout: 10000,
                success: function (solrResponse) {
                    var markerSymbols = $.map(solrResponse.response.docs, function (solrDoc) {
                        return solrDoc.marker_symbol;
                    });
                    response(markerSymbols);
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    response(['AJAX error']);
                }
            });
        }
    });

}(jQuery));
