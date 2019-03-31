# redux-connect-element

Connect Redux to vanilla HTMLElement (or LitElement) instances, based on this
[gist by Kevin Schaaf](https://gist.github.com/kevinpschaaf/995c9d1fd0f58fe021b174c4238b38c3).

Typescript friendly.

## Installation

    npm install --save @captaincodeman/redux-connect-element

## Usage

Your WebComponents can be kept 'pure' with no reference to Redux which helps to
make them easily testable and reusable. They should accept properties to set their
state and raise events to communicate state changes. A great library for writing
elements is [LitElement](https://github.com/Polymer/lit-element):

```ts
import { LitElement, property, html } from '@polymer/lit-element'

export class MyElement extends LitElement {
    static get is() { return 'my-element' }

    @property({ type: String })
    public name: string = 'unknown'

    onChange = (e) => this.dispatchEvent(
        new CustomEvent('name-changed', { detail: e.target.value })
    )

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
(`_mapStateToProps`) and the events to Redux Actions (`_mapEventsToActions`).

The `_mapStateToProps` method can map properties directly or you can make use of the
[Reselect](https://github.com/reduxjs/reselect) library to memoize more complex
projections.

```ts
import { connect } from '@captaincodeman/redux-connect-element'
import { store, State } from './store'
import { MyElement } from './my-element'

export class MyElementConnected extends connect(store, MyElement) {
    _mapStateToProps = (state: State) => ({
        name: state.name // or NameSelector(state)
    })

    _mapEventsToActions = () => ({
        'name-changed': (e: NameChangedEvent) => {
            type: 'CHANGE_NAME', 
            payload: { 
                name: e.detail.Name
            }
        }
    })
}
```

Registering this element will make it 'connected' with it's properties kept in-sync
with the Redux store and automatically re-rendered when they change. Mapped events
are automatically dispatched to the store to mutate the state within Redux.

```ts
import { MyElementConnected as MyElement } from './my-element-connected'

customElements.define(MyElement.is, MyElement)
```

Of course if you prefer, you can include the `connect` mixin with the mapping functions
directly in the element  (having the split is entirely optional).

NOTE: `_mapEventsToActions` superceeds `_mapDispatchToEvents` which maps events _and
dispatches_ the actions. The example above could be written as shown below but using
the `_mapEventsToActions` is simpler as it removes the responsibility of dispatching
the action to the store and the need to import the `Dispatch` method from Redux (if
using Typescript). `_mapDispatchToEvents` may be removed in future.

```ts
import { Dispatch } from 'redux'
import { connect } from '@captaincodeman/redux-connect-element'
import { store, State } from './store'
import { MyElement } from './my-element'

export class MyElementConnected extends connect(store, MyElement) {
    _mapStateToProps = (state: State) => ({
        name: state.name // or NameSelector(state)
    })

    _mapDispatchToEvents = (dispatch: Dispatch) => ({
        'name-changed': (e: NameChangedEvent) => dispatch({
            type: 'CHANGE_NAME', 
            payload: { 
                name: e.detail.name
            }
        })
    })
}
```