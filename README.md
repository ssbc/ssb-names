# ssb-names

get the `signifier` (name for an object) or `signified` (object for a name) from a secure-scuttlebutt database.

## Api

### setup

load as scuttlebot plugin or initialize client side.

``` js
var Names = require('ssb-names')

//load as sbot plugin.
sbot.use(Names)
var names = sbot.names

//get the naming api as a client.
var names = Names.init(sbot)
```

### names.signifier(id, cb)

Get names assigned to a given feed, the result is a list of signifiers
with numeric ranks.

``` js
names.signifier("@EMovhfIrFk4NihAKnRNhrfRaqIhBv1Wj8pTxJNgvCCY=.ed25519", cb)
=>
  { Dominic: 90,
    Dominic_2: 11,
    catbasher: 7,
    Dominic2: 2,
    Dominix: 1 }
```

### names.signified(name, cb)

Get feeds with a given name. It's normal that more than one person has the same name.
For example, many people are named "paul".
Sometimes people loose their private keys and have to create a new account,
which is the main reason there are two feeds named "dominic".

To avoid confusing humans, names are not case sensitive.

``` js
names.signified('dominic', cb)
=>
  { '@EMovhfIrFk4NihAKnRNhrfRaqIhBv1Wj8pTxJNgvCCY=.ed25519': 90,
    '@BIbVppzlrNiRJogxDYz3glUS7G4s4D4NiXiPEAEzxdE=.ed25519': 88,
    '@J+0DGLgRn8H5tVLCcRUfN7NfUcTGEZKqML3krEOJjDY=.ed25519': 1 }
```

## Algorithm

SUBJECT TO CHANGE.

Currently, this module ranks names with a simple vote -
each mention is a vote for that name, and everyone has equal votes.
This mechanism will probably not be suitable in the long run,
but will be sufficient to figure out what the api should be like.

## License

MIT





