# ssb-names

get the `signifier` (name for an object) or `signified` (object for a name) from a secure-scuttlebutt database.

## Api

install as server side sbot plugin

### names.get (cb)

get all naming relationships

### names.getImages

get all image assigned relationships

### names.getImageFor(id, cb)

get the image for an id

### names.getSignifier(id, cb)

get the name for an id. returns a name for this id.

### names.getSignifies(name, cb)

get ids that have been named `name`.
outputs an array:

```
[{
  name: name, //a full name matched from name
  id: id, //the feed id
  rank: i,
  named: //what you would _normally_ call this feed.
})

## Algorithm

The algorithm iterates over all naming relationships,
when looking up a name for someone, in these order:

If you have selected a name for them, use your name.
If your direct friends name them, use the most popular name.
Else if friends of friends name them, use the most popular foaf name.

If no one you know names them, use their self-declared name.

friend's names for them have precidence over self-declared names
because self-declared names are vulnerable to an attacker
simply claiming the same name and avatar. With other-declared names,
they'd need to convince your friends to rename them one by one.

## License

MIT











