import * as React from 'react'
import {render, cleanup, container, act} from 'effector/fixtures/react'
import {createGate, useGate, useStore} from 'effector-react'

import {argumentHistory} from 'effector/fixtures'
import {createEvent, createStore} from 'effector'

test('plain gate', async() => {
  const Gate = createGate('plain gate')
  expect(Gate.isOpen).toBe(false)
  await render(
    <section>
      <div>div</div>
      <Gate />
    </section>,
  )
  expect(Gate.isOpen).toBe(true)
  await cleanup()
  expect(Gate.isOpen).toBe(false)
})

test('plain gate hook', async() => {
  const Gate = createGate('plain gate')
  expect(Gate.isOpen).toBe(false)
  const Component = () => {
    useGate(Gate)
    return (
      <section>
        <div>div</div>
      </section>
    )
  }
  await render(<Component />)

  expect(Gate.isOpen).toBe(true)
  await cleanup()
  expect(Gate.isOpen).toBe(false)
})

test('gate with props', async() => {
  const Gate = createGate('gate with props')
  expect(Gate.current).toMatchObject({})
  await render(
    <section>
      <Gate foo="bar" />
    </section>,
  )
  expect(Gate.state.getState()).toMatchObject({foo: 'bar'})
  expect(Gate.current).toMatchObject({foo: 'bar'})
  expect(container.firstChild).toMatchInlineSnapshot(`<section />`)
  await cleanup()
  expect(Gate.state.getState()).toMatchObject({})
})

test('gate with props hook', async() => {
  const Gate = createGate('gate with props')
  expect(Gate.current).toMatchObject({})
  const Component = () => {
    useGate(Gate, {foo: 'bar'})
    return <section />
  }
  await render(<Component />)
  expect(Gate.state.getState()).toMatchObject({foo: 'bar'})
  expect(Gate.current).toMatchObject({foo: 'bar'})
  expect(container.firstChild).toMatchInlineSnapshot(`<section />`)
  await cleanup()
  expect(Gate.state.getState()).toMatchObject({})
})

describe('updates deduplication', () => {
  test('with component', async() => {
    const fn = jest.fn()
    const Gate = createGate()
    const update = createEvent()
    const count = createStore(0).on(update, x => x + 1)

    Gate.state.updates.watch(fn)

    const Component = () => {
      const x = useStore(count)
      return (
        <section>
          <Gate field={x === 2} />
          {x}
        </section>
      )
    }
    await render(<Component />)
    await act(async() => {
      update()
    })
    await act(async() => {
      update()
    })
    expect(argumentHistory(fn)).toMatchInlineSnapshot(`
Array [
  Object {
    "field": false,
  },
  Object {
    "field": true,
  },
]
`)
  })
  test('with hook', async() => {
    const fn = jest.fn()
    const Gate = createGate()
    const update = createEvent()
    const count = createStore(0).on(update, x => x + 1)

    Gate.state.updates.watch(fn)

    const Component = () => {
      const x = useStore(count)
      useGate(Gate, {field: x === 2})
      return <section>{x}</section>
    }
    await render(<Component />)
    await act(async() => {
      update()
    })
    await act(async() => {
      update()
    })
    expect(argumentHistory(fn)).toMatchInlineSnapshot(`
Array [
  Object {
    "field": false,
  },
  Object {
    "field": true,
  },
]
`)
  })
})

test('gate properties', async() => {
  const Gate = createGate('gate properties')
  const fn1 = jest.fn()
  const fn2 = jest.fn()
  Gate.status.watch(isOpen => fn1(isOpen))
  Gate.state.watch(props => fn2(props))
  await render(
    <section>
      <Gate foo="bar" />
    </section>,
  )
  await cleanup()
  expect(argumentHistory(fn1)).toEqual([false, true, false])
  expect(argumentHistory(fn2)).toEqual([{}, {foo: 'bar'}, {}])
})

test('gate properties hook', async() => {
  const Gate = createGate('gate properties')
  const fn1 = jest.fn()
  const fn2 = jest.fn()
  Gate.status.watch(isOpen => fn1(isOpen))
  Gate.state.watch(props => fn2(props))
  const Component = () => {
    useGate(Gate, {foo: 'bar'})
    return <section />
  }
  await render(<Component />)
  await cleanup()
  expect(argumentHistory(fn1)).toEqual([false, true, false])
  expect(argumentHistory(fn2)).toEqual([{}, {foo: 'bar'}, {}])
})

describe('child gate', () => {
  test('usage', async() => {
    const Gate = createGate('parent gate')
    const Child = Gate.childGate('child gate')

    await render(
      <section>
        <Gate />
        <div>
          <Child />
        </div>
      </section>,
    )
    expect(Gate.isOpen).toBe(true)
    expect(Child.isOpen).toBe(true)
    expect(container.firstChild).toMatchInlineSnapshot(`
<section>
  <div />
</section>
`)
    await cleanup()
    expect(Gate.isOpen).toBe(false)
    expect(Child.isOpen).toBe(false)
  })
  test('order edge case', async() => {
    const Gate = createGate('parent gate')
    const Child = Gate.childGate('child gate')

    await render(
      <section>
        <div>
          <Child />
        </div>
        <Gate />
      </section>,
    )
    expect(Gate.isOpen).toBe(true)
    expect(Child.isOpen).toBe(true)
    await cleanup()
    expect(Gate.isOpen).toBe(false)
    expect(Child.isOpen).toBe(false)
  })
  test('parent prevent children from beeing open', async() => {
    const Gate = createGate('parent gate')
    const Child = Gate.childGate('child gate')

    await render(
      <section>
        <Child />
      </section>,
    )

    expect(Child.isOpen).toBe(false)
    await cleanup()
    expect(Child.isOpen).toBe(false)
  })
})
