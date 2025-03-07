import { UnixTime } from '@l2beat/shared-pure'
import { z } from 'zod'

export type EtherscanSuccessResponse = z.infer<typeof EtherscanSuccessResponse>
const EtherscanSuccessResponse = z.object({
  status: z.literal('1'),
  message: z.literal('OK'),
  result: z.unknown(),
})

export type EtherscanErrorResponse = z.infer<typeof EtherscanErrorResponse>
const EtherscanErrorResponse = z.object({
  status: z.literal('0'),
  message: z.literal('NOTOK'),
  result: z.string(),
})

export type EtherscanResponse = z.infer<typeof EtherscanResponse>
const EtherscanResponse = z.union([
  EtherscanSuccessResponse,
  EtherscanErrorResponse,
])

export function parseEtherscanResponse(value: string): EtherscanResponse {
  try {
    const json: unknown = JSON.parse(value)
    return EtherscanResponse.parse(json)
  } catch {
    throw new TypeError('Invalid Etherscan response')
  }
}

export type EtherscanLogEntry = z.infer<typeof EtherscanLogEntry>
const EtherscanLogEntry = z.object({
  blockNumber: z.string().transform((x) => BigInt(x)),
  timeStamp: z.string().transform((x) => new UnixTime(Number(x))),
})

export const EtherscanLogResult = z.array(EtherscanLogEntry)
