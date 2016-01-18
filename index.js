var pull = require('pull-stream')
var isRef = require('ssb-ref').isLink
var many = require('pull-many')
var links = require('ssb-msgs').indexLinks
var Through = require('pull-through')
var paramap = require('pull-paramap')

function count (key, cb) {
  return pull.reduce(function (acc, item) {
    acc = acc || {}
    var k = item[key]
    if(k) acc[k] = 1 + (acc[k] || 0)
    return acc
  }, {}, function (err, acc) {
    if(err) cb(err)
    else cb(null, sort(acc))
  })
}

function sort (obj) {
  var _obj = {}
  Object.keys(obj).sort(function (a, b) {
    return obj[b] - obj[a]
  }).forEach(function (k) {
    _obj[k] = obj[k]
  })
  return _obj
}

exports.name = 'names'

exports.manifest = {
  signifier: 'async',
  signified: 'async',
}

function extractLinks () {
  return Through(function (msg) {
    var q = this.queue
    links(msg.value.content, function (link, rel) {
      if(link.link[0] !== '@') return
//      console.log(link, rel)
      q(link)
    })
  })
}

function fixAbout () {
  //about links where a bad format where the data is beside the link
  //instead of inside it.
  return pull.map(function (e) {
    if(e.value.content.type === 'about') {
      var link = e.value.content
      link.link = link.about
      delete link.about
      e.value.content = {about: link}
    }
    return e
  })

}

exports.init =
function (sbot) {

  return {
    signified: function (name, cb) {
      pull(
        many([
          sbot.links({rel: 'mentions', dest: '@'}),
          sbot.links({rel: 'about', dest: '@', values: true}),
        ]),
        //since we are doing such a broad query,
        //we need to get the unique keys, otherwise messages
        //with multiple links will be counted multiple times.
        pull.unique('key'),
        //retrive the message body...
        //it would be better if this was stored in the link index though.
        paramap(function (link, cb) {
          sbot.get(link.key, function (err, msg) {
            link.value = msg
            cb(err, link)
          })
        }, 32),
        fixAbout(),
        extractLinks(),
        pull.filter(function (link) {
          return link.name && link.name.toLowerCase() === name.toLowerCase()
        }),
        count('link', cb)
      )
    },
    signifier: function (id, cb) {

      pull(
        sbot.links({dest: id, values: true}),
        pull.filter(function (e) {
          return /mentions|about/.test(e.rel)
        }),
        fixAbout(),
        extractLinks(),
        pull.filter(function (link) {
          return link.link === id && link.name
        }),
        count('name', cb)
      )

    }
  }
}


if(!module.parent) {
  var query = process.argv[2]
  if(!query) return console.error('must provide query')

  require('ssb-client')(function (err, sbot) {
    var start = Date.now()
    var names = module.exports.init(sbot)
    ;( isRef(query) ? names.signifier : names.signified )
    (query, function (err, results) {
      console.log(Date.now() - start)
      console.log(results)
      process.exit(1)
    })
  })

}










































