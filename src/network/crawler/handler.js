'use strict'

const pull = require('pull-stream')
const lp = require('pull-length-prefixed')

const { CRAWLING_RESPONSE_NODES } = require('../../constants')
const { randomSubset } = require('../../utils')

const fs = require('fs')
const protons = require('protons')

const path = require('path')
const { CrawlResponse, Status } = protons(fs.readFileSync(path.resolve(__dirname, './protos/response.proto')))

module.exports = node => (protocol, conn) => {
    const peers = node.peerBook.getAllArray()

    const filter = peerInfo => peerInfo.id.pubKey && !peerInfo.id.isEqual(node.peerInfo.id)

    const amountOfNodes = Math.min(CRAWLING_RESPONSE_NODES, peers.length)

    const selectedNodes = randomSubset(peers, amountOfNodes, filter).map(peerInfo => peerInfo.id.pubKey.marshal())

    if (selectedNodes.length > 0) {
        pull(
            /* prettier-ignore */
            pull.once(CrawlResponse.encode({
                status: Status.OK,
                pubKeys: selectedNodes
            })),
            lp.encode(),
            conn
        )
    } else {
        pull(
            /* prettier-ignore */
            pull.once(CrawlResponse.encode({
                status: Status.FAIL
            })),
            lp.encode(),
            conn
        )
    }
}
