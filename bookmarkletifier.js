// Populate bookmarks
/*
chrome.bookmarks.getTree(function (bookmarks) {

    function getBookmarkletTitle(bookmarklet) {
        if (bookmarklet.title && bookmarklet.title.length > 0) return bookmarklet.title;
        return bookmarklet.url.replace(/^javascript:/, '').substr(0, 50) + '...';
    }

    function buildBookmarkList(bookmarks) {
        if (bookmarks == null || bookmarks.length == 0) return null;

        var $ul = $('<ul class="bookmarks">');
        $.each(bookmarks, function (i, bookmark) {
            if (bookmark.children && bookmark.children.length > 0) {
                // folder
                var children = buildBookmarkList(bookmark.children);

                if (!children) return; // skip empty folders

                $('<li class="folder">')
                    .text(bookmark.title)
                    .data('bookmark', bookmark)
                    .append(children)
                    .appendTo($ul)
                ;
            } else {
                // leaf
                if (!(bookmark.url && bookmark.url.match(/^javascript:/))) return; // skip leafs that aren't bookmarklets

                $('<li class="bookmarklet">')
                    .text(getBookmarkletTitle(bookmark))
                    .data('bookmark', bookmark)
                    .appendTo($ul)
                    .click(bookmarkletClickHandler)
                ;
            }
        });

        if ($ul.find('> li').length == 0) return null;
        return $ul;
    }

    $('#bookmarks').append(buildBookmarkList(bookmarks[0].children));
});
*/

// TODO: Better code structure
// TODO: Detect if Chrome's update quota has been reached and edits can no longer be easily saved


var bookmarkletClickHandler;

// Handles a keyUp event a while after the most recent keyUp event triggered
// so that if you type really fast the event triggers only once and only after 
// you take a break from typing
$.fn.delayedKeyUp = function (timeout, f) {
  var keyupTimeout = null;
  var $that = this;
  this.keyup(function () {
      if (keyupTimeout != null) {
        clearTimeout(keyupTimeout);
      }
      keyupTimeout = setTimeout(function () {
        keyupTimeout = null;
        $that.each(f);
      }, timeout);
  });
  return this;
}

// Main code
$(function () {
    $(window).keydown(function (event) {
        if (!(event.which == 83 && event.ctrlKey)) return true;
        $('#save').click();
        event.preventDefault();
        return false;
    });

    var editor = ace.edit('nice');
    editor.setTheme("ace/theme/chrome");
    editor.getSession().setMode("ace/mode/javascript");

    bookmarkletClickHandler = function (event) {
        if ($('#save').attr('disabled') == null) {
            if (!confirm('You have unsaved changes. Discard them?')) return false;
        }

        $('#bookmarks li.bookmarklet').removeClass('selected');
        var $li = $(this).addClass('selected');
        var bookmark = $li.data('bookmark');

        // load title
        $('#title')[0].value = bookmark.title;
        updateBookmarkletTitle.call($('#title')[0]);

        // load url
        $('#bookmarkified').get(0).value = bookmark.url;
        updateNice.call($('#bookmarkified').get(0));

        $('#save').attr('disabled', true);
    };

    function bookmarkify(source) {
      return 'javascript:'+escape(jsmin(source).replace(/^\s+|\s+$/, ''));
    }
    function unbookmarkify(source) {
      return js_beautify(unescape(source.replace(/^javascript:/, '')));
    }
    
    function updateBookmarklet() {
        $('#bookmarkable').attr('href', $('#bookmarkified').get(0).value);
        $('#save').removeAttr('disabled');
    }
    function updateBookmarkletTitle() {
        var title = 'Bookmarklet';
        if (!this.value.match(/^\s*$/)) title = this.value;
        $('#bookmarkable').text(title);
    }
    function updateBookmarkified() {
        $('#bookmarkified').get(0).value = bookmarkify(editor.getSession().getValue());
        updateBookmarklet();
    }
    function updateNice() {
        editor.getSession().setValue(unbookmarkify(this.value));
        updateBookmarklet();
    }

    $('#save').click(function () {
        $('#bookmarks li.bookmarklet.selected').each(function () {
            var $li = $(this);
            var bookmark = $li.data('bookmark');
            /*
            chrome.bookmarks.update(bookmark.id, {
                title: $('#title')[0].value,
                url: $('#bookmarkified').get(0).value
            }, function (result) {
                $li.data('bookmark', result);
            });
            */
        });
        $('#save').attr('disabled', true);
        return false;
    });
    
    editor.getSession().on('change', updateBookmarkified);
    $('#bookmarkified').delayedKeyUp(100, updateNice).bind('drop', updateNice);
    $('#title').delayedKeyUp(100, updateBookmarkletTitle);
    
    updateBookmarklet();
    updateBookmarkletTitle.call($('#title')[0]);
    if ($('#bookmarkified').get(0).value == '') $('#save').attr('disabled', true);

});
