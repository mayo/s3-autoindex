var m = require('mithril');

var config = require('./config.js')

var s3_api = {

  loadPrefix: function(prefix, marker) {
    //var pfx = ["", prefix, 'index.xml'].join('/').replace(/\/+/, '/');

    if (prefix != "") prefix += '/';

    var parts = [ 'delimiter=/', 'prefix=' + prefix];

    if (marker) parts.push('marker=' + marker);

    var url = '//' + config.bucket_hostname + '/?' + parts.join('&');

    return m.request({
      method: "GET",
      url: url,
      extract: function(xhr) {

        if (xhr.status > 400) {
          return xhr;
        }

        var xml = xhr.responseXML;

        var response = {
          name: xml.getElementsByTagName('Name')[0].textContent,
          prefix: xml.getElementsByTagName('Prefix')[0].textContent,
          marker: xml.getElementsByTagName('Marker')[0].textContent,
          delimiter: xml.getElementsByTagName('Delimiter')[0].textContent,
          isTruncated: xml.getElementsByTagName('IsTruncated')[0].textContent,
          files: [],
          dirs: [],
        };

        commonPrefixes = xml.getElementsByTagName('CommonPrefixes');

        for (var i = 0; i < commonPrefixes.length; i++) {
          var pfx = commonPrefixes[i];

          var key = pfx.getElementsByTagName('Prefix')[0].textContent;
          var dirname = key.substring(prefix.length);

          var obj = new DirectoryEntry(dirname, key, 'd');

          response.dirs.push(obj);
        }

        contents = xml.getElementsByTagName('Contents');

        // i=1 because the first entry is current prefix
        for (var i = 1; i < contents.length; i++) {
          var file = contents[i];

          var key = file.getElementsByTagName('Key')[0].textContent;
          var filename = key.substring(prefix.length);
          var date = new Date(file.getElementsByTagName('LastModified')[0].textContent);
          var size = parseInt(file.getElementsByTagName('Size')[0].textContent);

          var obj = new DirectoryEntry(filename, key, 'f', date, size);

          response.files.push(obj);
        }

        return response;
      },
    });
  }

}

var state = {

  files: [],
  dirs: [],
  parent: null,

  prefix: null,
  marker: null,

  loading: false,

  title: 'Index',

  error: null,

  sortKey: 'name',
  sortDir: 'asc',

  init: function(vnode) {
    var prefix = [state.path(), vnode.attrs.prefix].join('/').replace(/^\/|\/$/g, '').replace(/\/+/, '/');

    // Update only if we're changing prefix
    // This prevents infinite reload loop if s3 request fails
    if (state.prefix == prefix) return;

    state.prefix = prefix;
    state.title = 'Index of /' + state.prefix;
    document.title = state.title;

    if (m.route.get() != "/") {
      var key = state.prefix.split('/');
      key = key.slice(0, key.length - 1).join('/');

      state.parent = new DirectoryEntry('..', key, 'd');
    } else {
      state.parent = null;
    }

    state.getDirectory();
    state.sortBy(state.sortKey, state.sortDir);
  },

  sortBy: function(key, dir) {
    state.sortKey = key;
    state.sortDir = dir;

    var stringSort = function(key, dir) {
      var direction = (dir == 'asc') ? 1 : -1;

      return function(a, b) {
        return direction * a[key].localeCompare(b[key]);
      }
    }

    var dateSort = function(key, dir) {
      var direction = (dir == 'asc') ? 1 : -1;

      return function(a, b) {
        if (a[key] < b[key]) return direction * -1;
        if (a[key] > b[key]) return direction * 1;
        return 0;
      }
    }

    var numericSort = function(key, dir) {
      var direction = (dir == 'asc') ? 1 : -1;

      return function(a, b) {
        return direction * (b[key] - a[key]);
      }
    }

    var sortFunc = (key == 'name') ? stringSort : (key == 'date') ? dateSort : numericSort;

    state.files.sort(sortFunc(key, dir));
    state.dirs.sort(sortFunc(key, dir));
  },

  path: function() {
    return window.location.pathname.split('/').slice(1,-1).join('/');
  },

  getRoute: function(key) {
    var path = state.path();

    if (path == key) return '/';
    return '/' + key.substring(path.length + ((path == "") ? 0 : 1));
  },

  getDirectory: function() {
    state.loading = true;
    state.error = false;

    s3_api.loadPrefix(state.prefix, state.marker).then(function(data) {
      state.dirs = data.dirs;
      state.files = data.files;

      state.loading = false;
    }).catch(function(e) {
      state.error = e;

      state.dirs = [];
      state.files = [];

      state.loading = false;
    });
  },

};

var DirectoryEntry = function(name, key, type, date, size) {

  return { 
    name: name,
    key: key,
    type: type,
    date: date || null,
    size: size || null,

    icon: function() {
      if (this.name == '..') return 'fa-folder-open';
      if (this.type == 'd') return 'fa-folder';
      if (this.type == 'f') return 'fa-file-o';
    },

    kind: function() {
      return (this.type == 'f') ? 'file' : (this.type == 'd') ? 'dir' : '';
    },

    sizeString: function() {
      if (name == '..') return '';
      if (this.type == 'd') return '-';

      return this.size;
    },

    dateString: function() {
      if (!this.date) return '';

      //TODO: not supported everywhere yet
      return this.date.toLocaleString(undefined, {hour12: false});
    }
  };

};

var LoadingIndicator = {
  view: function(vnode) {
    var hidden = state.loading ? '' : ' hidden';
    return m('i', { class: 'fa fa-spinner fa-pulse fa-fw loading' + hidden });
  },
};

var ListHeader = {
  oninit: function(vnode) {
    vnode.state.key = vnode.attrs.key;
    vnode.state.dir = 'asc';
    vnode.state.name = vnode.attrs.name;
  },

  view: function(vnode) {
      var active = (vnode.state.key == state.sortKey) ? ' active' : '';
      return m('th',
        m('a', {
          class: 'sortable' + active,
          onclick: function() {
            vnode.state.dir = (vnode.state.dir == 'asc') ? 'desc' : 'asc';
            return state.sortBy(vnode.state.key, vnode.state.dir)
          },
          'data-dir': vnode.state.dir
        }, vnode.state.name),
      );
  },
};

var ListRow = {
  view: function(vnode) {
    var entry = vnode.attrs.entry;
    var oncreateFunc = (entry.type == 'f') ? null : m.route.link;
    var href = (entry.type == 'f') ? '/' + entry.key : state.getRoute(entry.key);

    return [
      m('td',
        m('i', { class: 'fa ' + entry.icon() + ' ' + entry.kind() })
      ),
      m('td', 
        m('a', {
          href: href,
          name: entry.key,
          oncreate: oncreateFunc,
        }, entry.name)
      ),
      m('td', { class: 'right-align' }, entry.dateString()),
      m('td', { class: 'right-align' }, entry.sizeString()),
    ];
  },
};

var Header = {
  view: function(vnode) {
    return m('h1', [
      state.title,
      m(LoadingIndicator),
    ])
  },
};

var Footer = {
  view: function(vnode) {
    return m("p", [
      "Generated by ",
      m("a", { href: "https://github.com/mayo/s3-autoindex" }, "s3-autoindex"),
    ]);
  },
};

var ErrorHandler = {
  view: function(vnode) {
    var message = 'Unknown error.';

    if (state.error.status > 400) {
      message = 'Could not retrieve directory contents for ' + state.prefix + '.';
    }

    return m('div', 'Error: ' + message + ' Status ' + state.error.status);
  },
};

var Contents = {
  view: function(vnode) {
    return  [
      m('table', [
        m('thead', 
          m('tr', [
            m('th'),
            m(ListHeader, { key: 'name', name: 'Name' }),
            m(ListHeader, { key: 'date', name: 'Last Modified' }),
            m(ListHeader, { key: 'size', name: 'Size' }),
          ])
        ),

        m('tbody', { class: 'contents' }, [

          (state.parent) ? m('tr', m(ListRow, { entry: state.parent })) : null,

          state.dirs.map(function(dir, index) {
            return m('tr', m(ListRow, { entry: dir }));
          }),

          state.files.map(function(file, index) {
            return m('tr', m(ListRow, { entry: file }));
          }),

        ]),

      ]),

      (state.error) ? m(ErrorHandler) : null,
    ];
  },
};

var AutoIndex = {
  oninit: state.init,
  onupdate: state.init,

  view: function(vnode) {
    return [
      m(Header),
      m(Contents),
    ];
  },

};

m.route(document.getElementById('autoindex'), "/", {
  "/:prefix...": AutoIndex,
});


