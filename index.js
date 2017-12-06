var pull = require('pull-stream')
var isFeed = require('ssb-ref').isFeed
var links = require('ssb-msgs').indexLinks
var G = require('graphreduce')
var Reduce = require('flumeview-reduce')

var u = require('./util')

function startsWith(str, start) {
  for(var i = 0; i < start.length; i++)
    if(str[i] !== start[i]) return false
  return true
}

exports.name = 'names'

exports.version = '1.0.0'

exports.manifest = {
  get: 'async',
  getSignifier: 'async',
  getSignifies: 'async',
  dump: 'sync'
}

function extractLinks () {
  return Through(function (msg) {
    var q = this.queue
    links(msg.value.content, function (link, rel) {
      if(link.link[0] !== '@') return
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
  var index = sbot._flumeUse('names', Reduce(2, function (g, rel) {
    if(!g) g = {}

    if(Array.isArray(rel))
      rel.forEach(function (rel) {
        G.addEdge(g, rel.from, rel.to, rel.value)
      })
    else
      G.addEdge(g, rel.from, rel.to, rel.value)
    return g
  }, function (data) {
    if(data.value.content.type === 'about' && data.value.content.name && isFeed(data.value.content.about)) {
      return {from: data.value.author, to: data.value.content.about, value: data.value.content.name}
    }
    if(Array.isArray(data.value.content.mentions))
      return data.value.content.mentions.filter(function (e) {
        return !!e.name && isFeed(e.link)
      }).map(function (e) {
        return {from: data.value.author, to: e.link, value: e.name}
      })
  }))


  return {
    get: function (opts, cb) {
      index.get(opts, cb)
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

