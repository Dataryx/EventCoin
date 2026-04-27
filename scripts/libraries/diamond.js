const Web3 = require('web3')

const FacetCutAction = { Add: 0, Replace: 1, Remove: 2 } //create an object
const abi = new Web3.Web3().eth.abi
const encodeFunctionSignature = (value) => abi.encodeFunctionSignature(value)

function getSelectorFromAbiEntry (entry) {
  return encodeFunctionSignature(entry)
}

// get function selectors from ABI
function getSelectors (contract) {
  const selectors = (contract.abi || []).reduce((acc, entry) => {
    if (entry.type === 'function') {
      acc.push(getSelectorFromAbiEntry(entry))
    }
    return acc
  }, [])
  selectors.contract = contract
  selectors.remove = remove
  selectors.get = get
  return selectors
}

// get function selector from function signature
function getSelector (func) {
  return encodeFunctionSignature(func)
}

// used with getSelectors to remove selectors from an array of selectors
// functionNames argument is an array of function signatures
function remove (functionNames) {
  const selectors = this.filter((v) => {
    for (const functionName of functionNames) {
      if (v === encodeFunctionSignature(functionName)) {
        return false
      }
    }
    return true
  })
  selectors.contract = this.contract
  selectors.remove = this.remove
  selectors.get = this.get
  return selectors
}

// used with getSelectors to get selectors from an array of selectors
// functionNames argument is an array of function signatures
function get (functionNames) {
  const selectors = this.filter((v) => {
    for (const functionName of functionNames) {
      if (v === encodeFunctionSignature(functionName)) {
        return true
      }
    }
    return false
  })
  selectors.contract = this.contract
  selectors.remove = this.remove
  selectors.get = this.get
  return selectors
}

// remove selectors using an array of signatures
function removeSelectors (selectors, signatures) {
  const removeSelectors = signatures.map(v => encodeFunctionSignature(v))
  selectors = selectors.filter(v => !removeSelectors.includes(v))
  return selectors
}

// find a particular address position in the return value of diamondLoupeFacet.facets()
function findAddressPositionInFacets (facetAddress, facets) {
  for (let i = 0; i < facets.length; i++) {
    if (facets[i].facetAddress === facetAddress) {
      return i
    }
  }
}

exports.getSelectors = getSelectors
exports.getSelector = getSelector
exports.FacetCutAction = FacetCutAction
exports.remove = remove
exports.removeSelectors = removeSelectors
exports.findAddressPositionInFacets = findAddressPositionInFacets
