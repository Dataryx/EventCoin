import web3 from './web3';
import EventFactory from '../truffle-artifacts/CreateEventFacet.json';
import deployedEvents from '../truffle-artifacts/GetDeployedEventsFacet.json';

const contractAddress = process.env.NEXT_PUBLIC_DIAMOND_ADDRESS;

const createEventInstance = contractAddress
    ? new web3.eth.Contract(EventFactory.abi, contractAddress)
    : null;

const getDeployedEventsInstance = contractAddress
    ? new web3.eth.Contract(deployedEvents.abi, contractAddress)
    : null;

export { contractAddress, createEventInstance, getDeployedEventsInstance };
