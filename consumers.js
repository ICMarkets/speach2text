const
    consumers = []
let
    count = 0

module.exports.add = consumer => consumers[count++] = consumer

module.exports.del = consumer => {
    let j = 0;
    while (j < count && consumers[j++] !== consumer) {}
    while (j < count) consumers[j - 1] = consumers[j++]
    count--
}

module.exports.get_all = () => consumers
module.exports.count = () => count
