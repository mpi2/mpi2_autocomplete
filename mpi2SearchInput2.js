(function ($) {
    'use strict';

    if(typeof(window.MPI2) === 'undefined') {
        window.MPI2 = {};
    }

    $.widget("MPI2.mpi2SearchInput", {

        options: {
            target: null
        },

        _simpleSearchOnTarget: function (q) {
            var self = this;
            q = $.trim(q.replace(/[^a-zA-Z0-9]/g, ''));
            $(self.options.target).trigger('search', [{q: q}]);
        },

        _create: function () {
            var self = this;

            self.container = this.element;
            self.container.addClass('mpi2-search-input');
             self.input = $('input#userInput');
            //self.container.append("<input#userInput>");
            self.input.mpi2AutoComplete({
                select: function (event, ui) {
                    $(self.options.target).trigger('search', [{q: "mgi_accession_id:\""+ui.item.value+"\""}]);
                }
            });

            self.input.bind('keyup', function (e) {
                if (e.keyCode === 13) {
                    self._simpleSearchOnTarget(self.input.val());
                }
                return false;
            });

           // self.container.append(self.button);
			self.button = $('button#acSearch');
            self.button.bind('click', function () {
                self._simpleSearchOnTarget(self.input.val());
            });
        },

        destroy: function () {
            var self = this;
            $.Widget.prototype.destroy.call(self);
            self.container.removeClass('mpi2-search-input');
            self.container.html('');
        }
    });
}(jQuery));
