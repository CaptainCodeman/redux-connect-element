import { Unsubscribe, Store, Action } from 'redux';

export type DispatchMap = { [key: string]: (event: Event) => void }

export interface ConnectProps {
  mapState?(state: any): { [key: string]: any }
}

function hasConnectProps(inst: ConnectProps): inst is ConnectProps {
  return (inst as ConnectProps).mapState !== undefined;
}

export interface ConnectEvents {
  mapEvents?(): { [key: string]: (event: Event) => Action }
}

function hasConnectEvents(inst: ConnectEvents): inst is ConnectEvents {
  return (inst as ConnectEvents).mapEvents !== undefined;
}

export interface Connectable extends HTMLElement, ConnectProps, ConnectEvents {
  connectedCallback?(): void
  disconnectedCallback?(): void
}

export type Constructor<T> = new (...args: any[]) => T

const unsubscribe: unique symbol = Symbol()
const dispatchMap: unique symbol = Symbol()
const createDispatchMap: unique symbol = Symbol()
const addEventListeners: unique symbol = Symbol()
const removeEventListeners: unique symbol = Symbol()
const addStateSubscription: unique symbol = Symbol()
const removeStateSubscription: unique symbol = Symbol()
const onReduxStateChange: unique symbol = Symbol()

export function connect<T extends Constructor<Connectable>>(
  store: Store,
  superclass: T
) {
  class connected extends superclass {
    private [unsubscribe]: Unsubscribe;
    private [dispatchMap]: DispatchMap

    constructor(...args: any[]) {
      super(...args)
      this[createDispatchMap]()
    }

    connectedCallback() {
      if (super.connectedCallback) {
        super.connectedCallback()
      }

      if (hasConnectEvents(this)) {
        this[addEventListeners]()
      }

      if (hasConnectProps(this)) {
        this[addStateSubscription]()
      }
    }

    disconnectedCallback() {
      if (hasConnectProps(this)) {
        this[removeStateSubscription]()
      }

      if (hasConnectEvents(this)) {
        this[removeEventListeners]()
      }

      if (super.disconnectedCallback) {
        super.disconnectedCallback()
      }
    }

    private [createDispatchMap]() {
      const eventMap = this.mapEvents()
      this[dispatchMap] = Object.keys(eventMap).reduce((map, key) => {
        const fn = eventMap[key]
        map[key] = function (event: Event) {
          // TODO: make configurable with extra options param
          event.stopImmediatePropagation()
          store.dispatch(fn(event))
        }.bind(this)
        return map
      }, <DispatchMap>{})
    }

    private [addEventListeners]() {
      for (let key in this[dispatchMap]) {
        this.addEventListener(key, this[dispatchMap][key], false)
      }
    }

    private [removeEventListeners]() {
      for (let key in this[dispatchMap]) {
        this.removeEventListener(key, this[dispatchMap][key], false)
      }
    }

    private [addStateSubscription]() {
      this[unsubscribe] = store.subscribe(this[onReduxStateChange].bind(this))
      this[onReduxStateChange]()
    }

    private [removeStateSubscription]() {
      this[unsubscribe]()
      this[unsubscribe] = null
    }

    private [onReduxStateChange]() {
      Object.assign(this, this.mapState(store.getState()))
    }
  }

  return connected as Constructor<Connectable> & T
}
