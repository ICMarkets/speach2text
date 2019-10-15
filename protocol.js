/*global protocol msgpack*/
const
    encode = _ => msgpack.encode(_),
    decode = _ => msgpack.decode(_),
    API = {},
    CREATE = 'create',
    DELETE = 'delete',
    LOAD = 'load',
    SEARCH_REQUEST = 'search_request',
    SEARCH_RESPONSE = 'search_response'

let
    worker
//without var,let,const will be in global namespace for worker or main thread
// eslint-disable-next-line
protocol = {
    set_worker: _ => {
        worker = _
        worker.onmessage = protocol.onmessage
    },
    on_load_record: _ => {API.on_load_record = _;return protocol},
    on_create_record: _ => {API.on_create_record = _;return protocol},
    on_delete_record: _ => {API.on_delete_record = _;return protocol},
    on_search_request: _ => {API.on_search_request = _;return protocol},
    on_search_response: _ => {API.on_search_response = _;return protocol},
    load_record: payload =>
        postMessage(encode({type: LOAD, payload})),
    create_record: payload =>
        worker.postMessage(encode({type: CREATE, payload})),
    delete_record: payload =>
        worker.postMessage(encode({type: DELETE, payload})),
    search_request: payload =>
        worker.postMessage(encode({type: SEARCH_REQUEST, payload})),
    search_response: payload =>
        postMessage(encode({type: SEARCH_RESPONSE, payload})),
    onmessage: ({data}) => {
        const
            decoded = decode(data)
        switch (decoded.type) {
            case CREATE:
                API.on_create_record(decoded.payload)
                break;
            case DELETE:
                API.on_delete_record(decoded.payload)
                break;
            case LOAD:
                API.on_load_record(decoded.payload)
                break;
            case SEARCH_REQUEST:
                API.on_search_request(decoded.payload)
                break;
            case SEARCH_RESPONSE:
                API.on_search_response(decoded.payload)
                break;
            default:
        }
    }
}
