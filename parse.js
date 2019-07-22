var path = require('path')

var collect = require('collect-stream')

var minimist = require('minimist')
var argv = minimist(process.argv.slice(2), {
  alias: { d: 'datadir', n: 'nick', c: 'channel' },
  default: { channel: 'bots' },
  string: [ '_' ]
})
var [addr,channel] = argv._[0].replace(/^cabal:\/*/,'').split('#')

var mkdirp = require('mkdirp')
mkdirp.sync(argv.datadir)

var level = require('level')
var db = level(path.join(argv.datadir,'db'))

var Cabal = require('cabal-core')
var cabal = Cabal(path.join(argv.datadir,'cabal'), addr, { db })

cabal.messages.events.on('message', function (msg) {
  if (!msg.value) return
  if (msg.value.type !== 'chat/text') return
  if (!msg.value.content) return
  if (msg.value.content.channel !== argv.channel) return
  var txt = msg.value.content.text
  if (typeof txt !== 'string') return
  if (/^!uc\b/.test(txt)) {
    cabal.publish({
      type: 'chat/text',
      content: {
        //text: txt.replace(/^!uc\s*/,'').toUpperCase(),
        text: 'great',
        channel: msg.value.content.channel
      }
    })
  }
})

cabal.getLocalKey(function (err, key) {
  if (err) return error(err)
  db.get('config!nick', { valueEncoding: 'utf8' }, function (err, nick) {
    if (nick || argv.nick) {
      console.log((argv.nick || nick) + '@' + key)
    } else {
      console.log(key)
    }
    if (argv.nick && argv.nick !== nick) {
      db.put('config!nick', argv.nick, function (err) {
        if (err) return error(err)
        cabal.publishNick(argv.nick, function (err) {
          if (err) error(err)
          else join()
        })
      })
    } else if (err && !err.notFound) {
      error(err)
    } else {
      join()
    }
  })
})

//cabal.on('peer-added', (peer) => console.log("hallo! " + peer))


function join () {
  cabal.swarm(function (err, swarm) {
    if (err) return error(err)
  })
}

function error (err) {
  console.error(err)
  process.exit(1)
}

cabal.ready(function () {

  // list out the channels
  cabal.channels.get(function (err, channels) {
    console.log(channels)
  })

//  collect messages
  var r1 = cabal.messages.read('default', { limit: 10 })
  collect(r1, function (err, data) {
    const keys = Object.keys(data)
    console.log(keys)

    const values=Object.values(data)
    console.log(values)

    //console.log(data[data.length-1].value)
    //console.log(data.length)

  })

  //console.log(r1)

  console.log('yeah')
/*
  // publish something
  cabal.publish({
    type: 'chat/text',
    content: {
      text: 'one',
      channel: 'default'
    }
  }
 */

})




