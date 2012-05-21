(function ($) {
    'use strict';

    if(typeof(window.MPI2) === 'undefined') {
        window.MPI2 = {};
    }
    MPI2.AutoComplete = {};

    $.widget('MPI2.mpi2AutoComplete', $.ui.autocomplete, {

        options: {
            source: function () {this.sourceCallback.apply(this, arguments);},
        },

        _create : function () {
            $.ui.autocomplete.prototype._create.apply(this);
        },

        _setOption: function(key, value) {
            $.Widget.prototype._setOption.apply(this, arguments);
        },

        sourceCallback: function(request, response) {
            var term = request.term;

            response(['Cbx1', 'Trafd1', 'Akt2-ps']);
        }
    });

}(jQuery));
