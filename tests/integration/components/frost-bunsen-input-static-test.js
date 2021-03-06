import {expect} from 'chai'
import Ember from 'ember'
import {describeComponent, it} from 'ember-mocha'
import {beforeEach} from 'mocha'
import {integrationTestContext, renderWithProps} from 'dummy/tests/helpers/template'

describeComponent(...integrationTestContext('frost-bunsen-input-static'), function () {
  let rootNode

  const TEST_VALUE = 'Some Test Value'

  beforeEach(function () {
    let props = {
      bunsenId: 'name',
      cellConfig: Ember.Object.create({}),
      model: {},
      onChange () {},
      store: Ember.Object.create({}),
      value: TEST_VALUE
    }

    rootNode = renderWithProps(this, 'frost-bunsen-input-static', props)
  })

  it('has correct classes', function () {
    expect(rootNode).to.have.class('frost-bunsen-input-static')
  })

  it('displays the value passed in', function () {
    let displayedValue = this.$('.left-input p').html()

    expect(displayedValue).to.equal(TEST_VALUE)
  })
})
