const axios = require('axios')
const express = require('express')
const cote = require('cote')
const proxy = require('redbird')({
  port: process.env.PORT || 80,
})

const server = express()

const services = {}

server.get('/_internal', function (req, res) {
  return res.json(proxy.routing)
})

server.get('/_services', function (req, res) {
  return res.json(services)
})

server.listen(9999, function () {
  console.log('Proxy Service is listening on 9999')
})

const proxyResponder = new cote.Responder({
  name: 'proxy service',
  namespace: 'proxy service',
})

proxyResponder.on('cote:added', (args, cb) => {
  console.log(args)
  try {
    let { address, advertisement: { source, target, port } } = args
    target = `http://${address}:${port}${target}`
    proxy.unregister(source, target)
    proxy.register(source, target)
    services[target] = { source, target, checkedAt: new Date() }
    console.log('added', target)
  } catch (ex) {
    console.log(ex)
  }
})

proxyResponder.on('cote:removed', (args, cb) => {
  try {
    let { advertisement: { source, target, port } } = args
    target = `http://${address}:${port}${target}`
    axiosGet({ source, target })
    console.log('removed', target)
  } catch (ex) {
    console.log(ex)
  }
})

setInterval(() => {
  check()
}, 10000)

function check() {
  for (const key in services) {
    const { source, target } = services[key]
    axiosGet({ source, target })
  }
}

function axiosGet({ source, target }) {
  const { origin } = new URL(target)
  axios.get(origin, { timeout: 3000 }).then(({ data }) => {
    services[target] = { source, target, checkedAt: new Date() }
  }).catch(({ code }) => {
    if (code === 'ECONNREFUSED') {
      proxy.unregister(source, target)
      delete services[target]
    } else {
      services[target] = { source, target, checkedAt: new Date() }
    }
  })
}
