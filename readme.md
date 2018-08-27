# redux-connect-element

Connect Redux to vanilla HTMLElement (or LitElement) instances, based on this
[gist by Kevin Schaaf](https://gist.github.com/kevinpschaaf/995c9d1fd0f58fe021b174c4238b38c3)

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
and providing mapping functions. These map the Redux state to the element properties
(`_mapStateToProps`) and the dispatch method to the events (`_mapDispatchToEvents`).

```ts
import { Dispatch } from 'redux'
import { connect } from '@captaincodeman/redux-connect-element'
import { store, State } from './store'
import { MyElement } from './my-element'

export class MyElementConnected extends connect(store, MyElement) {
    _mapStateToProps = (state: State) => ({
        name: state.name.name
    })

    _mapDispatchToEvents = (dispatch: Dispatch) => ({
        'name-changed': (e: CustomEvent) => dispatch({
            type: 'CHANGE_NAME', 
            payload: { 
                name: e.detail
            }
        }) 
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