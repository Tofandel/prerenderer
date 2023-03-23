import Prerenderer from '@prerenderer/prerenderer'

test('it imports correctly in module', () => {
  expect(typeof Prerenderer).toEqual('function')
  expect('default' in Prerenderer).toBeFalsy()
})
