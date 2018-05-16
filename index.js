var pull = require('pull-stream')
var ref = require('ssb-ref')
var isFeed = ref.isFeed
var isBlob = ref.isBlob
var links = require('ssb-msgs').indexLinks
var G = require('graphreduce')
var Reduce = require('flumeview-reduce')

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
  var index = sbot._flumeUse('names', Reduce(2, reduce, function (data) {
    var content = data.value.content
    var author = data.value.author
    if(content.type === 'about' && isFeed(content.about)) {
      var abouts = []
      if(content.name)
        return {from: author, to: content.about, value: content.name}
    }
    if(Array.isArray(content.mentions))
      return content.mentions.filter(function (e) {
        return !!e.name && isFeed(e.link)
      }).map(function (e) {
        return {from: author, to: e.link, value: e.name}
      })
  }))

  var images = sbot._flumeUse('images', Reduce(2, reduce, function (data) {
    var content = data.value.content
    var author = data.value.author
    var image = isObject(content.image) ? content.image.link : content.image
    if(content.type === 'about' && isFeed(content.about) && isBlob(image))
      return {from: author, to: content.about, value: image}
  }))


  return {
    get: function (opts, cb) {
      index.get(opts, cb)
    },
    getImages: function (opts, cb) {
      images.get(opts, cb)
    },
    getImageFor: function (id, cb) {
      images.get({}, function (_, names) {
        sbot.friends.get({}, function (_, friends) {
          cb(null, u.nameFor(names, friends, sbot.id, id))
        })
      })
    },
    getSignifier: function (id, cb) {
      index.get({}, function (_, names) {
        sbot.friends.get({}, function (_, friends) {
          cb(null, u.nameFor(names, friends, sbot.id, id))
        })
      })
    },
    getSignifies: function (name, cb) {
      index.get({}, function (_, names) {
        sbot.friends.get({}, function (_, friends) {
          cb(null, u.namedAs(names, friends, sbot.id, name))
        })
      })
    }
  }
}

