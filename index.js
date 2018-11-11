var pull = require('pull-stream')
var ref = require('ssb-ref')
var isFeed = ref.isFeed
var isBlob = ref.isBlob
var links = require('ssb-msgs').indexLinks
var G = require('graphreduce')
var Reduce = require('flumeview-reduce')
var HashLRU = require('hashlru')
var u = require('./util')

function isObject (o) {
  return o && 'object' === typeof o
}

exports.name = 'names'

exports.version = '1.0.0'

exports.manifest = {
  get: 'async',
  getImages: 'async',
  getImageFor: 'async',
  getSignifier: 'async',
  getSignifies: 'async',
  dump: 'sync'
}

function reduce (g, rel) {
  if(!g) g = {}

  if(Array.isArray(rel))
    rel.forEach(function (rel) {
      G.addEdge(g, rel.from, rel.to, rel.value)
    })
  else
    G.addEdge(g, rel.from, rel.to, rel.value)
  return g
}


exports.init =
function (sbot) {
  var cache = HashLRU(128)
  var index = sbot._flumeUse('names', Reduce(2, reduce, function (data) {
    var content = data.value.content
    var author = data.value.author
    if(content.type === 'about' && isFeed(content.about)) {
      var abouts = []
      if(content.name) {
        cache.clear()
        return {from: author, to: content.about, value: content.name}
      }
    }
    if(Array.isArray(content.mentions)) {
      cache.clear()
      return content.mentions.filter(function (e) {
        return !!e.name && isFeed(e.link)
      }).map(function (e) {
        return {from: author, to: e.link, value: e.name}
      })
    }
  }))

  var images = sbot._flumeUse('images', Reduce(2, reduce, function (data) {
    var content = data.value.content
    var author = data.value.author
    var image = isObject(content.image) ? content.image.link : content.image
    if(content.type === 'about' && isFeed(content.about) && isBlob(image))
      return {from: author, to: content.about, value: image}
  }))

  function cacheable(pre, async) {
    return function (id, cb) {
      var value = cache.get(pre+':'+id)

      if(value) console.log('cache-hit:', pre+':'+id)
      else console.log('cache-miss:', pre+':'+id)

      if(value) cb(null, value)
      else async(id, function (err, value) {
        if(err) cb(err)
        else {
          cache.set(pre+':'+id, value)
          cb(null, value)
        }
      })
    }
  }

  return {
    get: function (opts, cb) {
      index.get(opts, cb)
    },
    getImages: function (opts, cb) {
      images.get(opts, cb)
    },
    getImageFor: cacheable('img',function (id, cb) {
      images.get({}, function (_, names) {
        sbot.friends.get({}, function (_, friends) {
          cb(null, u.nameFor(names, friends, sbot.id, id))
        })
      })
    }),
    getSignifier: cacheable('sgr', function (id, cb) {
      index.get({}, function (_, names) {
        sbot.friends.get({}, function (_, friends) {
          cb(null, u.nameFor(names, friends, sbot.id, id))
        })
      })
    }),
    getSignifies: cacheable('sge',function (name, cb) {
      index.get({}, function (_, names) {
        sbot.friends.get({}, function (_, friends) {
          cb(null, u.namedAs(names, friends, sbot.id, name))
        })
      })
    })
  }
}






