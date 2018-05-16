
function each (obj, iter) {
  for(var k in obj)
    iter(k, obj[k])
}

function nameFor(names, friends, source, dest) {
  if(names[source] && names[source][dest])
    return names[source][dest]
  else if(friends[source]) {
    var named = {}, max = undefined
    function iter (friend, follows) {
      if(follows && names[friend]) {
        var used = names[friend][dest]
        if(used) {
          named[used] = (named[used] || 0) + 1
          if(named[used] > (named[max] || 0))
            max = used
        }
      }
    }
    each(friends[source], iter)
    if(max) return max

    each(friends[source], function (source) {
      each(friends[source], iter)
    })

    if(max) return max
    //finally, fallback to their name for themselves
    return names[dest][dest] || dest
  }
  else
    return names[dest][dest] || dest

}
function namedAs(names, friends, source, prefix) {
  var named = {}
  function isPrefix(name) {
    if(name.length < prefix.length) return false
    for(var i = 0; i < prefix.length; i++)
      if(name[i] != prefix[i]) return false
    return true
  }

  var seen = {}
  function fromSource(source, fn) {
    if(seen[source]) return
    seen[source] = true

    if(names[source]) {
      for(var k in names[source]) {
        if(isPrefix(names[source][k])) {
          var name = named[names[source][k]] = named[names[source][k]] || {}
          name[k] = fn(name[k])
        }
      }
    }
  }

  var named = {}
  fromSource(source, function () { return [1] })

  each(friends[source], function (source) {
    fromSource(source, function (a) {
      a = a || [0]
      a[1] = (a[1] || 0) + 1
      return a
    })
  })

  each(friends[source], function (source) {
    each(friends[source], function (source) {
      fromSource(source, function (a) {
        a = a || [0, 0]
        a[2] = (a[2] || 0) + 1
        return a
      })
    })
  })

  var ary = [], defaultNames = {}
  for(var k in named)
    for(var j in named[k]) {
      if(!defaultNames[j])
        defaultNames[j] = nameFor(names, friends, source, j)

      ary.push({name: k, id: j, rank: named[k][j], named: defaultNames[j]})
    }
  ary.sort(function (a, b) {
    for(var i = 0; i < a.rank.length; i++) {
      var v = (b.rank[i]|0) - (a.rank[i]|0)
      if(v) return v
    }
  })
  return ary
}

exports.nameFor = nameFor
exports.namedAs = namedAs






