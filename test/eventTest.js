const { expect } = require('chai')
const { getSelectors, FacetCutAction } = require('../scripts/libraries/diamond.js')

const Diamond = artifacts.require('Diamond')
const DiamondInit = artifacts.require('DiamondInit')
const DiamondCutFacet = artifacts.require('DiamondCutFacet')
const DiamondLoupeFacet = artifacts.require('DiamondLoupeFacet')
const OwnershipFacet = artifacts.require('OwnershipFacet')
const CreateEventFacet = artifacts.require('CreateEventFacet')
const GetDeployedEventsFacet = artifacts.require('GetDeployedEventsFacet')
const Event = artifacts.require('Event')

async function expectRevertMessage (promise, expectedMessage) {
  try {
    await promise
    expect.fail(`Expected revert with message: ${expectedMessage}`)
  } catch (error) {
    expect(error.message).to.include(expectedMessage)
  }
}

contract('EventFactory', (accounts) => {
  const [manager, nonManager] = accounts
  let eventInstance
  let diamondAddress
  let createEventFacet
  let getDeployedEventsFacet

  beforeEach(async () => {
    const diamondInit = await DiamondInit.new({ from: manager })

    const baseFacets = []
    for (const FacetArtifact of [DiamondCutFacet, DiamondLoupeFacet, OwnershipFacet]) {
      const facet = await FacetArtifact.new({ from: manager })
      baseFacets.push({
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

    const diamond = await Diamond.new(
      baseFacets,
      {
        owner: manager,
        init: diamondInit.address,
        initCalldata
      },
      { from: manager }
    )
    diamondAddress = diamond.address

    const eventFacetCuts = []
    for (const FacetArtifact of [CreateEventFacet, GetDeployedEventsFacet]) {
      const facet = await FacetArtifact.new({ from: manager })
      eventFacetCuts.push({
        facetAddress: facet.address,
        action: FacetCutAction.Add,
        functionSelectors: getSelectors(FacetArtifact)
      })
    }

    const diamondCutFacet = await DiamondCutFacet.at(diamondAddress)
    await diamondCutFacet.diamondCut(
      eventFacetCuts,
      '0x0000000000000000000000000000000000000000',
      '0x',
      { from: manager }
    )

    createEventFacet = await CreateEventFacet.at(diamondAddress)
    getDeployedEventsFacet = await GetDeployedEventsFacet.at(diamondAddress)

    await createEventFacet.createEvent('First Event', web3.utils.toWei('1', 'ether'), 100, { from: manager })
    const deployedEvents = await getDeployedEventsFacet.getDeployedEvents()
    eventInstance = await Event.at(deployedEvents[0])
  })

  it('should create a new event', async () => {
    await createEventFacet.createEvent('Second Event', web3.utils.toWei('1', 'ether'), 100, { from: manager })
    const deployedEvents = await getDeployedEventsFacet.getDeployedEvents()
    expect(deployedEvents.length).to.equal(2)
  })

  it('should mark caller as manager', async () => {
    const managerAddress = await eventInstance.manager()
    expect(managerAddress).to.equal(manager)
  })

  it('should enforce only manager can withdraw funds', async () => {
    await expectRevertMessage(
      eventInstance.withdrawFunds({ from: nonManager }),
      'Only manager can perform this action'
    )
  })

  it('should enforce valid ticket ID', async () => {
    await expectRevertMessage(
      eventInstance.useTicket(101, { from: manager }),
      'Invalid ticket ID'
    )
  })

  it('should enforce ticket ownership', async () => {
    await eventInstance.buyTicket({ from: manager, value: web3.utils.toWei('1', 'ether') })
    await expectRevertMessage(
      eventInstance.useTicket(99, { from: nonManager }),
      'You do not own this ticket'
    )
  })

  it('should allow buying a ticket', async () => {
    await eventInstance.buyTicket({ from: manager, value: web3.utils.toWei('1', 'ether') })

    const ticket = await eventInstance.tickets(99)
    expect(ticket.owner).to.equal(manager)
    expect(ticket.isUsed).to.equal(false)
  })

  it('should allow using a ticket', async () => {
    await eventInstance.buyTicket({ from: manager, value: web3.utils.toWei('1', 'ether') })
    await eventInstance.useTicket(99, { from: manager })

    const ticket = await eventInstance.tickets(99)
    expect(ticket.isUsed).to.equal(true)
  })

  it('should allow transferring a ticket', async () => {
    await eventInstance.buyTicket({ from: manager, value: web3.utils.toWei('1', 'ether') })
    await eventInstance.transferTicket(99, nonManager, { from: manager })

    const ticket = await eventInstance.tickets(99)
    expect(ticket.owner).to.equal(nonManager)
  })
})
