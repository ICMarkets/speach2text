/*global view input_search protocol _load_file _note submit waveform WaveSurfer*/
const
    records = {},//by id
    enum_type = {
        CREATE: 0,
        CONVERTED: 1,
        RECOGNIZED: 2,
        DELETE: 3
    },
    wavesurfer = WaveSurfer.create({
        container: '#waveform'
    })

waveform.onclick = () => wavesurfer.playPause()

protocol.set_worker(new Worker('worker.js'))

protocol.on_load_record(({type, payload}) => {
    submit.classList.remove('disable')
    const
        id = payload.id,
        tr = document.getElementById(id) || document.createElement('tr'),
        last_request = input_search.value.trim()

    if (tr.id === '') {
        tr.id = id
        tr.classList.add('record')
        view.appendChild(tr)
        tr.onclick = () => tr.classList.toggle('expand')

        Array(5).fill('td').reduce((tr, tag) => tr.appendChild(document.createElement(tag)) && tr, tr)

        //const delete_button = document.createElement('button')
        //delete_button.textContent = 'Delete'
        //delete_button.onclick = () => {
        //    delete_button.setAttribute('disabled', true)
        //    protocol.delete_record({id})
        //}
        //tr.lastChild.appendChild(delete_button)
    }

    const
        note = tr.children[0],
        convertation_time = tr.children[1],
        audio_td = tr.children[2],
        recognized_time = tr.children[3],
        text = tr.children[4]

    switch (type) {
        case enum_type.CREATE:
            note.classList.add('note')
            note.textContent = payload.note
            break
        case enum_type.RECOGNIZED:
            recognized_time.textContent = payload.recognized_time
            text.innerHTML = ''
            text.appendChild(
                payload.text.results.reduce(
                    (ul, record) => {
                        const li = document.createElement('li')
                        li.textContent = record.alternatives[0].transcript
                        ul.appendChild(li)
                        return ul
                    },
                    document.createElement('ul')
                )
            )
            break
        case enum_type.CONVERTED:
            //const
            //    audio = document.createElement('audio')

            //audio.src = payload.audio_link
            //audio_td.appendChild(audio)
            convertation_time.textContent = payload.converted_time

            tr.onclick = () => wavesurfer.load(location.origin + payload.audio_link)

            break
        case enum_type.DELETE:
            tr.classList.add('hide')
            break
    }
    records[id] = records[id] || {}
    records[id] = {...records[id], payload}

    if (last_request) search_request(last_request)
})

function search_request (request) {
    return request.length === 0
        ? Object.keys(records).forEach(id => document.getElementById(id).classList.remove('hide'))
        : protocol.search_request(request)
}

input_search.onkeyup = event => search_request(event.target.value.trim())

protocol.on_search_response(show_records_ids =>
    Object.keys(records).forEach(id =>
        document.getElementById(id).classList.toggle('hide', !show_records_ids.includes(String(id)))
    )
)

submit.onclick = add_new_record


function add_new_record () {
    submit.classList.add('disable')
    Array.prototype.forEach.call(_load_file.files, file => {
        const reader = new FileReader()
        reader.onload = e => protocol.create_record({file: e.target.result, note: _note.value})
        reader.readAsArrayBuffer(file)
    })
}
