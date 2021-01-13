import { config as bskConfig, validateProofs, resolveZoneFileToProfile } from 'blockstack'
import { validateStacksAddress } from '@stacks/transactions'

import logger from 'winston'

export async function isSubdomainRegistered(fullyQualifiedAddress: String) {
  try {
    // const nameInfo = await bskConfig.network.getNameInfo(fullyQualifiedAddress)
    const nameInfo = {
      address: "1J3PUxY5uDShUnHRrMyU6yKtoHEUPhKULs",
      blockchain: "bitcoin",
      expire_block: 599266,
      grace_period: false,
      last_txid: "1edfa419f7b83f33e00830bc9409210da6c6d1db60f99eda10c835aa339cad6b",
      renewal_deadline: 604266,
      resolver: null,
      status: "registered",
      zonefile: "$ORIGIN muneeb.id\n$TTL 3600\n_http._tcp IN URI 10 1 \"https://gaia.blockstack.org/hub/1J3PUxY5uDShUnHRrMyU6yKtoHEUPhKULs/0/profile.json\"\n",
      zonefile_hash: "37aecf837c6ae9bdc9dbd98a268f263dacd00361"
    }
    return (nameInfo.status === 'registered_subdomain')
  } catch (err) {
    if (err.message === 'Name not found') {
      return false
    } else if (err.message === 'Bad response status: 500') {
      return false // currently, the blockstack api returns 500 on subdomain lookup errors.
    } else {
      throw err
    }
  }
}

export function validlySignedUpdate() {
  throw new Error('Not implemented')
}

export function checkProofs(owner, zonefile) {
  return resolveZoneFileToProfile(zonefile, owner)
    .then((profile) => validateProofs(profile, owner))
    .then((proofs) => proofs.filter(x => x.valid))
}

export async function isRegistrationValid(
  subdomainName: String, domainName: String,
  owner: String, sequenceNumber: Number, checkCore: boolean) {
  // currently, only support *new* subdomains
  if (sequenceNumber !== 0) {
    logger.debug(`seqn: ${sequenceNumber} failed validation`)
    return false
  }

  // owner should be a stacks address
  if(!validateStacksAddress(owner)){
    logger.debug(`owner: ${owner} failed validation`)
    return false
  }

  // subdomain name should be a legal name
  const subdomainRegex = /^[a-z0-9\-_+]{1,37}$/
  if (!subdomainRegex.test(subdomainName)) {
    logger.debug(`subdomainName: ${subdomainName} failed validation`)
    return false
  }
  if (!checkCore) {
    return true
  }


  // shouldn't already exist
  try {
    const isRegistered = await isSubdomainRegistered(`${subdomainName}.${domainName}`)
    console.log("is subdomain registered")
    if (isRegistered) {
      logger.warn(`${subdomainName}.${domainName} already exists`)
    }
    return !isRegistered
  } catch (e) {
    logger.error(e)
    return false
  }
}
