/*global view edit input_search checkbox_view protocol STORAGE_NAME caption _load_file _note*/
const
    // Few enums for access to view children (one of other ways is create API to manage it inside view, but I desided to keep view as simple as possible)
    NAV = {
        VIEW: 0,
        EDIT: 1
    },
    // Notes for reviewers: Last lang I've learned was Elixir.
    // In Elixir is not allowed to use dinamic strings, so next listing a string constans
    // is a flavor of Elixir code style
    DOM = {
        CLASS: {
            CUSTOMER: 'customer',
            REMOVE: 'remove',
            EDIT: 'edit',
            REVERT: 'revert',
            CONFIRM: 'confirm',
            ACTIVE: 'active',
            DISABLE: 'disable',
            HIDE: 'hide'
        },
        ID: {
            COUNTRIES: 'countries',
            NAV_VIEW: 'nav_view',
            NAV_EDIT: 'nav_edit',
            SUBMIT: 'submit'
        }
    }

protocol.set_worker(new Worker('worker.js', {name: STORAGE_NAME}))

new Promise(protocol.on_load).then(state => {
    // Show all customers form cached state
    state.records = state.records || []
    state.records
        .map(function record_view (record) {
            var view = document.createElement('div')
            view.textContent = 'text record' + (typeof record)
            return view
        })
        .reduce(
            (container, customer_view) => {
                container.appendChild(customer_view)
                return container
            },
            view
        )

    input_search.onkeyup = event => {
        const request = event.target.value.trim()

        request.length === 0
            ? state.records.forEach((_, id) => view.children[id].classList.remove(DOM.CLASS.HIDE))
            : protocol.search_request(request)
    }

    protocol.on_search_response(show_records_ids =>
        state.records.forEach((_, id) => view.children[id].classList.toggle(DOM.CLASS.HIDE, !show_records_ids.includes(String(id))))
    )

    // Activate last view from previous session
    switch (state.nav) {
        case NAV.VIEW:
            activate_view()
            break
        case NAV.EDIT:
            activate_edit()
            break
        default:
    }

    checkbox_view.onchange = () => checkbox_view.checked ? activate_edit() : activate_view()

    // Single interaction click controller for cover all buisness logic in one place
    document.body.onclick = event => {
        switch (event.target.id) {
            case DOM.ID.SUBMIT:
                add_new_record()
                break
            default:// Hadle user click in customer card:
                break
        }
    }

    function activate_view () {
        checkbox_view.checked = false
        view.classList.remove(DOM.CLASS.EDIT)
        edit.classList.remove(DOM.CLASS.ACTIVE)
        caption.classList.remove(DOM.CLASS.HIDE)
        if (state.nav === NAV.EDIT) {
            state.nav = NAV.VIEW
            protocol.activate_view()
        }
    }

    function activate_edit () {
        checkbox_view.checked = true
        view.classList.add(DOM.CLASS.EDIT)
        edit.classList.add(DOM.CLASS.ACTIVE)
        caption.classList.add(DOM.CLASS.HIDE)
        if (state.nav === NAV.VIEW) {
            state.nav = NAV.EDIT
            protocol.activate_edit()
        }
    }

    function add_new_record () {
        Array.prototype.forEach.call(_load_file.files, file => {
            const reader = new FileReader();
            reader.onload = function (e) {
              // The file's text will be printed here
              console.log(e.target.result)
              protocol.create_customer({file: e.target.result, note: _note.value})
            };
            reader.readAsBinaryString(file)
        })
    }
})
