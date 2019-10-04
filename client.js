/*global view input_search protocol _load_file _note _audio _dialog submit */
const
    records = [],//by id
    playlist = []//by id

_dialog.onclick = () => _dialog.classList.remove('opened')

protocol.set_worker(new Worker('worker.js'))

protocol.on_load_record(record => {
    submit.setAttribute('disabled', '')

    const
        id = records.length,
        container = document.createElement('div'),
        note = document.createElement('div'),
        text = document.createElement('div'),
        last_request = input_search.value.trim()

    container.classList.add('record')
    note.classList.add('note')
    note.textContent = record.note
    text.textContent = JSON.stringify(record.text)
    container.appendChild(note)
    container.appendChild(text)
    view.appendChild(container)
    container.onclick = () => {
        _dialog.innerHTML = ''
        record.text.results.reduce(
            (_dialog, record) => {
                var div = document.createElement('div')
                div.className = 'speach'
                div.textContent = record.alternatives[0].transcript
                _dialog.appendChild(div)
                return _dialog
            },
            _dialog
        )
        _dialog.classList.add('opened')


        playlist[id]
            ? play(playlist[id])
            : protocol.audio_request(id)
    }

    records.push(record)

    if (last_request) search_request(last_request)
})

function play (file) {
    _audio.src = URL.createObjectURL(
        new Blob(
            [file],
            {type: "audio/wav"}
        )
    )
}

function search_request (request) {
    return request.length === 0
        ? records.forEach((_, id) => view.children[id].classList.remove('hide'))
        : protocol.search_request(request)
}

input_search.onkeyup = event => search_request(event.target.value.trim())

protocol.on_audio_response(({file, id}) => {
    playlist[id] = file
    play(file)
})

protocol.on_search_response(show_records_ids =>
    records.forEach((_, id) => view.children[id].classList.toggle('hide', !show_records_ids.includes(String(id))))
)

submit.onclick = add_new_record


function add_new_record () {
    submit.setAttribute('disabled', true)
    Array.prototype.forEach.call(_load_file.files, file => {
        const reader = new FileReader()
        reader.onload = e => protocol.create_record({file: e.target.result, note: _note.value})
        reader.readAsArrayBuffer(file)
    })
}
