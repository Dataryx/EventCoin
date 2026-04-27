const fs = require('fs')
const path = require('path')

const Diamond = artifacts.require('Diamond')
const DiamondInit = artifacts.require('DiamondInit')
const DiamondCutFacet = artifacts.require('DiamondCutFacet')
const DiamondLoupeFacet = artifacts.require('DiamondLoupeFacet')
const OwnershipFacet = artifacts.require('OwnershipFacet')
const CreateEventFacet = artifacts.require('CreateEventFacet')
const GetDeployedEventsFacet = artifacts.require('GetDeployedEventsFacet')
const { getSelectors, FacetCutAction } = require('../scripts/libraries/diamond.js')

function updateEnvDiamondAddress (address) {
  const envPath = path.resolve(__dirname, '..', '.env')
  if (!fs.existsSync(envPath)) {
    return
  }

  const envContents = fs.readFileSync(envPath, 'utf8')
  const nextLine = `NEXT_PUBLIC_DIAMOND_ADDRESS="${address}"`
  const updated = envContents.match(/^NEXT_PUBLIC_DIAMOND_ADDRESS=.*$/m)
    ? envContents.replace(/^NEXT_PUBLIC_DIAMOND_ADDRESS=.*$/m, nextLine)
    : `${envContents.trimEnd()}\n${nextLine}\n`

  fs.writeFileSync(envPath, updated)
  console.log('Updated .env with NEXT_PUBLIC_DIAMOND_ADDRESS:', address)
}

module.exports = async function (deployer, network, accounts) {
  const contractOwner = accounts[0]

  await deployer.deploy(DiamondInit)
  const diamondInit = await DiamondInit.deployed()
  console.log('DiamondInit deployed:', diamondInit.address)

  const baseFacetArtifacts = [
    DiamondCutFacet,
    DiamondLoupeFacet,
    OwnershipFacet
  ]

  const facetCuts = []
  for (const FacetArtifact of baseFacetArtifacts) {
    await deployer.deploy(FacetArtifact)
    const facet = await FacetArtifact.deployed()
    console.log(`${FacetArtifact.contractName} deployed: ${facet.address}`)
    facetCuts.push({
      facetAddress: facet.address,
      action: FacetCutAction.Add,
      functionSelectors: getSelectors(FacetArtifact)
    })
  }

  const initCalldata = web3.eth.abi.encodeFunctionCall(
    {
      name: 'init',
      type: 'function',
      inputs: []
    },
    []
  )

  await deployer.deploy(Diamond, facetCuts, {
    owner: contractOwner,
    init: diamondInit.address,
    initCalldata
  })
  const diamond = await Diamond.deployed()
  console.log('Diamond deployed:', diamond.address)
  updateEnvDiamondAddress(diamond.address)

  const eventFacetArtifacts = [
    CreateEventFacet,
    GetDeployedEventsFacet
  ]

  const eventFacetCuts = []
  for (const FacetArtifact of eventFacetArtifacts) {
    await deployer.deploy(FacetArtifact)
    const facet = await FacetArtifact.deployed()
    console.log(`${FacetArtifact.contractName} deployed: ${facet.address}`)
    eventFacetCuts.push({
      facetAddress: facet.address,
      action: FacetCutAction.Add,
      functionSelectors: getSelectors(FacetArtifact)
    })
  }

  const diamondCutFacet = await DiamondCutFacet.at(diamond.address)
  await diamondCutFacet.diamondCut(
    eventFacetCuts,
    '0x0000000000000000000000000000000000000000',
    '0x',
    { from: contractOwner, gas: 6000000 }
  )
  console.log('Added event facets to diamond:', diamond.address)
}
