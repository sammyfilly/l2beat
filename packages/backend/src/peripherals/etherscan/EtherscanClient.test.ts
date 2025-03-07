import { HttpClient, Logger } from '@l2beat/shared'
import { UnixTime } from '@l2beat/shared-pure'
import { expect, mockObject } from 'earl'
import { Response } from 'node-fetch'

import { EtherscanClient, EtherscanError } from './EtherscanClient'

describe(EtherscanClient.name, () => {
  describe(EtherscanClient.prototype.call.name, () => {
    it('throws for error responses', async () => {
      const httpClient = mockObject<HttpClient>({
        async fetch() {
          return new Response(
            JSON.stringify({ status: '0', message: 'NOTOK', result: 'Oops!' }),
          )
        },
      })
      const etherscanClient = new EtherscanClient(
        'xXApiKeyXx',
        httpClient,
        Logger.SILENT,
      )
      await expect(
        etherscanClient.call('foo', 'bar', { baz: '1234' }),
      ).toBeRejectedWith(EtherscanError, 'Oops!')
    })

    it('throws for malformed responses', async () => {
      const httpClient = mockObject<HttpClient>({
        async fetch() {
          return new Response(JSON.stringify({ status: '2', foo: 'bar' }))
        },
      })
      const etherscanClient = new EtherscanClient(
        'xXApiKeyXx',
        httpClient,
        Logger.SILENT,
      )
      await expect(
        etherscanClient.call('foo', 'bar', { baz: '1234' }),
      ).toBeRejectedWith(TypeError, 'Invalid Etherscan response.')
    })

    it('throws for http errors', async () => {
      const httpClient = mockObject<HttpClient>({
        async fetch() {
          return new Response('foo', { status: 400 })
        },
      })
      const etherscanClient = new EtherscanClient(
        'xXApiKeyXx',
        httpClient,
        Logger.SILENT,
      )
      await expect(
        etherscanClient.call('foo', 'bar', { baz: '1234' }),
      ).toBeRejectedWith(Error, 'Http error 400: foo')
    })
  })

  describe(EtherscanClient.prototype.getBlockNumberAtOrBefore.name, () => {
    it('constructs the correct url', async () => {
      const apiKey = 'xXApiKeyXx'
      const timestamp = new UnixTime(1578638524)

      const params = new URLSearchParams({
        module: 'block',
        action: 'getblocknobytime',
        timestamp: timestamp.toString(),
        closest: 'before',
        apikey: apiKey,
      })

      const httpClient = mockObject<HttpClient>({
        async fetch(url) {
          expect(url).toEqual(
            `https://api.etherscan.io/api?${params.toString()}`,
          )
          return new Response(
            JSON.stringify({ status: '1', message: 'OK', result: '9251482' }),
          )
        },
      })

      const etherscanClient = new EtherscanClient(
        apiKey,
        httpClient,
        Logger.SILENT,
      )
      await etherscanClient.getBlockNumberAtOrBefore(timestamp)
    })

    it('returns the block number', async () => {
      const httpClient = mockObject<HttpClient>({
        async fetch() {
          return new Response(
            JSON.stringify({ status: '1', message: 'OK', result: '9251482' }),
          )
        },
      })

      const etherscanClient = new EtherscanClient(
        'xXApiKeyXx',
        httpClient,
        Logger.SILENT,
      )
      const result = await etherscanClient.getBlockNumberAtOrBefore(
        new UnixTime(1578638524),
      )
      expect(result).toEqual(9251482)
    })
  })
})
