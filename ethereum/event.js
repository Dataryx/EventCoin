import web3 from './web3' ;
import Event from '../truffle-artifacts/Event.json';

export default (address) => {
    return new web3.eth.Contract(
        Event.abi,
        address
    )
}
