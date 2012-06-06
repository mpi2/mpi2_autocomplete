(function ($) {
    'use strict';

    if(typeof(window.MPI2) === 'undefined') {
        window.MPI2 = {};
    }

    $.widget("MPI2.mpi2SearchInput", {

        options: {
            target: null
        },

        _create: function () {
            var self = this;

            self.container = this.element;
            self.container.addClass('mpi2-search-input');

            self.input = $('<input type="text" placeholder="e.g. Cbx1"></input>');
            self.container.append(self.input);
            self.input.bind('keyup', function (e) {
                if (e.keyCode === 13) {
                    $(self.options.target).trigger('search', [{q: self.input.val()}]);
                }
                return false;
            });

            self.input.mpi2AutoComplete();

            self.button = $('<button class="search">Search</button>');
            self.container.append(self.button);
            self.button.bind('click', function () {
                $(self.options.target).trigger('search', [{q: self.input.val()}]);
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
