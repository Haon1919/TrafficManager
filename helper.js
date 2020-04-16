exports.checkParams =  function(keys, obj) {
    for(let key of keys) {
        if(obj[[key]] === undefined) return false;
    }
    return true;
}