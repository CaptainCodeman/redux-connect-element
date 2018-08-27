import { Unsubscribe, Store, Dispatch } from 'redux';

export type MapStateToProps = (state: any) => {
    [key: string]: any
}

export type MapDispatchToEvents = (dispatch: Dispatch) => {
    [key: string]: (e: Event) => void
}

export interface Connectable extends HTMLElement {
    connectedCallback?(): void
    disconnectedCallback?(): void

    _mapStateToProps?: MapStateToProps
    _mapDispatchToEvents?: MapDispatchToEvents
}

export type Constructor<T> = new (...args: any[]) => T

export function connect<T extends Constructor<Connectable>>(
    store: Store,
    superclass: T
) {
    class connected extends superclass {
        private unsubscribe: Unsubscribe;
        private dispatchMap: any

        connectedCallback() {
            if (super.connectedCallback) {
                super.connectedCallback()
            }

            if (this._mapDispatchToEvents) {
                this.dispatchMap = this._mapDispatchToEvents(store.dispatch)
                Object.keys(this.dispatchMap).forEach(key => {
                    const fn = this.dispatchMap[key]
                    this.dispatchMap[key] = (event: Event) => {
                        event.stopImmediatePropagation()
                        fn(event)
                    }
                })
                for (let key in this.dispatchMap) {
                    this.addEventListener(key, this.dispatchMap[key], false)
                }
            }

            if (this._mapStateToProps) {
                const update = () => Object.assign(this, this.onStateChanged(store.getState()))
                this.unsubscribe = store.subscribe(update)
                update()
            }
        }

        disconnectedCallback() {
            if (this.unsubscribe) {
                this.unsubscribe()
                this.unsubscribe = null
            }

            if (this.dispatchMap) {
                for (let key in this.dispatchMap) {
                    this.removeEventListener(key, this.dispatchMap[key], false)
                }
            }

            if (super.disconnectedCallback) {
                super.disconnectedCallback()
            }
        }

        onStateChanged(state: any) {
            Object.assign(this, this._mapStateToProps(state))
        }
    }

    return connected as Constructor<Connectable> & T
}