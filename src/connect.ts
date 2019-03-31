import { Unsubscribe, Store, Dispatch, Action } from 'redux';

export type MapStateToProps = (state: any) => { [key: string]: any }

export type DispatchMap = { [key: string]: (event: Event) => void }
export type MapDispatchToEvents = (dispatch: Dispatch) => DispatchMap

export type EventMap = { [key: string]: (event: Event) => Action }
export type MapEventsToActions = () => EventMap

export interface Connectable extends HTMLElement {
    connectedCallback?(): void
    disconnectedCallback?(): void

    _mapStateToProps?: MapStateToProps

    /* @deprecated Consider using _mapEventsToActions instead */
    _mapDispatchToEvents?: MapDispatchToEvents

    _mapEventsToActions?: MapEventsToActions
}

export type Constructor<T> = new (...args: any[]) => T

export function connect<T extends Constructor<Connectable>>(
    store: Store,
    superclass: T
) {
    class connected extends superclass {
        private _unsubscribe: Unsubscribe;
        private _dispatchMap: DispatchMap

        constructor(...args: any[]) {
            super(...args)
            this._onReduxStateChange = this._onReduxStateChange.bind(this)
        }

        connectedCallback() {
            if (super.connectedCallback) {
                super.connectedCallback()
            }

            if (!this._dispatchMap) {
                if (this._mapEventsToActions) {
                    const eventMap = this._mapEventsToActions()
                    this._dispatchMap = Object.keys(eventMap).reduce((map, key) => {
                        const fn = eventMap[key]
                        map[key] = (event: Event) => {
                            event.stopImmediatePropagation()
                            const action = fn(event)
                            store.dispatch(action)
                        }
                        return map
                    }, <DispatchMap>{})
                } else if (this._mapDispatchToEvents) {
                    this._dispatchMap = this._mapDispatchToEvents(store.dispatch)
                    Object.keys(this._dispatchMap).forEach(key => {
                        const fn = this._dispatchMap[key]
                        this._dispatchMap[key] = (event: Event) => {
                            event.stopImmediatePropagation()
                            fn(event)
                        }
                    })
                }
            }

            if (this._dispatchMap) {
                for (let key in this._dispatchMap) {
                    this.addEventListener(key, this._dispatchMap[key], false)
                }
            }

            if (this._mapStateToProps) {
                this._unsubscribe = store.subscribe(this._onReduxStateChange)
                this._onReduxStateChange()
            }
        }

        disconnectedCallback() {
            if (this._unsubscribe) {
                this._unsubscribe()
                this._unsubscribe = null
            }

            if (this._dispatchMap) {
                for (let key in this._dispatchMap) {
                    this.removeEventListener(key, this._dispatchMap[key], false)
                }
            }

            if (super.disconnectedCallback) {
                super.disconnectedCallback()
            }
        }

        private _onReduxStateChange() {
            const state = store.getState()
            Object.assign(this, this._mapStateToProps(state))
        }
    }

    return connected as Constructor<Connectable> & T
}