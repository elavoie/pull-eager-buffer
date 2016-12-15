[![Build Status](https://travis-ci.org/elavoie/pull-eager-buffer.svg?branch=master)](https://travis-ci.org/elavoie/pull-eager-buffer)

# pull-eager-buffer

Buffer that reads (enqueue) as much data as possible before draining
(dequeuing).  It still allows draining of buffered data when reads are delayed.

Useful for simulating the behaviour of unsynchronized transport channels, such as WebSockets when used in pull-ws.

Quick Example
=============

     var buffer = require('pull-eager-buffer')
     var pull = require('pull-stream')
     
     // Prints 0,1,2,0,1,2
     pull(
       pull.count(2),
       pull.through(console.log),
       buffer,
       pull.through(console.log),
       pull.drain()
     )


