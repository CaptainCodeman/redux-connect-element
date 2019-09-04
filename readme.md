# redux-connect-element

Connect Redux to vanilla HTMLElement (or LitElement) instances, based on this
[gist by Kevin Schaaf](https://gist.github.com/kevinpschaaf/995c9d1fd0f58fe021b174c4238b38c3).

Typescript friendly and Tiny (minified and gzipped): 446 Bytes

## Installation

    npm install --save @captaincodeman/redux-connect-element

## Usage

Your WebComponents can be kept 'pure' with no reference to Redux which helps to
make them easily testable and reusable. They should accept properties to set their
state and raise events to communicate their internal state changes.

A great library for writing lightweight custom elements is
[lit-element](https://github.com/Polymer/lit-element). Here's a very simple example:

```ts
import { LitElement, property, html } from 'lit-element'

export class MyElement extends LitElement {
  static get is() { return 'my-element' }

  @property({ type: String })
  public name: string = 'unknown'

  onChange(e: Event) {
    this.dispatchEvent(
      new CustomEvent('name-changed', { 
        bubbles: true,
        composed: trye,
        detail: e.target.value,
      })
    )
  }

  render() {
    return html`
      <p>Hello ${this.name}</p>
      <input type="text" .value=${this.name} @input=${this.onChange}>
    `
  }
}
```

This is the class you would import into tests - you can feed it whatever data you
want with no need to setup external dependencies (such as Redux).

The connection to Redux can now be defined separately by subclassing the element
and providing mapping functions. These map the Redux State to the element properties
(`mapState`) and the events to Redux Actions (`mapEvents`).

The `mapState` method can map properties directly or you can make use of the
[Reselect](https://github.com/reduxjs/reselect) library to memoize more complex
projections.

```ts
import { connect } from '@captaincodeman/redux-connect-element'
import { store, State } from './store'
import { MyElement } from './my-element'

export class MyConnectedElement extends connect(store, MyElement) {
  // mapState provides the mapping of state to element properties
  // this can be direct or via reselect memoized functions
  mapState(state: State) {
    return {
      name: state.name,   // or NameSelector(state)
    }
  })

  // mapEvents provides the mapping of DOM events to redux actions
  // this can again be direct as shown below or using action creators
  mapEvents() {
    return {
      'name-changed': (e: NameChangedEvent) => {
        type: 'CHANGE_NAME', 
        payload: { 
          name: e.detail.name
        }
      }
      // or, using an action creator:
      // 'name-changed': (e: NameChangedEvent) => changeNameAction(e.detail.name)
    }
  }
}
```

Registering this element will make it 'connected' with it's properties kept in-sync
with the Redux store and automatically re-rendered when they change. Mapped events
are automatically dispatched to the store to mutate the state within Redux.

```ts
import { MyElementConnected } from './my-element-connected'

customElements.define(MyElement.is, MyElementConnected)
```

Of course if you prefer, you can include the `connect` mixin with the mapping functions
directly in the element - having the split is entirely optional and down to personal
style and app architecture.
