var pull = require('pull-stream')
var isRef = require('ssb-ref').isLink
var many = require('pull-many')
var links = require('ssb-msgs').indexLinks
var Through = require('pull-through')
exports.name = 'names'

exports.manifest = {
  signifier: 'async',
  signified: 'async',
}

function count (key, cb) {
  return pull.reduce(function (acc, item) {
    acc = acc || {}
    var k = item[key]
    acc[k] = 1 + (acc[k] || 0)
    return acc
  }, {}, cb)
}

exports.init =
function (sbot) {

  return {
    signified: function (name, cb) {
      pull(
        many([
          sbot.links({rel: 'mentions', values: true}),
          sbot.links({rel: 'about', values: true})
        ]),
        Through(function (msg) {
          var queue = this.queue
          return links(msg.value.content, function (link) {
            if(link.name && link.name.toLowerCase() === name.toLowerCase())
              queue(link)
          })
        }),
        count('link', cb)
      )
    },
    signifier: function (id, cb) {

      pull(
        sbot.links({dest: id, values: true}),
        pull.filter(function (e) {
          console.log(e.rel)
          return /mentions|about/.test(e.rel)
        }),
        Through(function (msg) {
          var queue = this.queue
          return links(msg.value.content, function (link) {
            if(link.link === id) queue(link)
          })
        }),
//        pull.map(function (e) {
//          console.log(e)
//          if(e.value.content.mentions)
//            return e.value.content.mentions.filter(function (e) {
//              return e.link == feedId
//            })[0]
//          else
//            return e.value.content
//        }),
        pull.filter(Boolean),
//        pull.collect(cb)
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










