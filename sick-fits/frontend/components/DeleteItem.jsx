import React, { Component } from 'react'
import { Mutation } from 'react-apollo'
import PropTypes from 'prop-types'
import gql from 'graphql-tag'
import { ALL_ITEMS_QUERY } from './Items'

const DELETE_ITEM_MUTATION = gql`
  mutation DELETE_ITEM_MUTATION($id: ID!) {
    deleteItem(id: $id) {
      id
    }
  }
`
class DeleteItem extends Component {
  update = (cache, payload) => {
    // manually update the cache on the client, so it matches the server
    // 1. Read the cache for the items we want
    const data = cache.readQuery({ query: ALL_ITEMS_QUERY })
    console.log(data, payload)
    // 2. Filter the deleted itemout of the page
    const filteredItems = data.items.filter(item => item.id !== payload.data.deleteItem.id)
    console.log(data.items)
    // 3. Put the items back!
    cache.writeQuery({ query: ALL_ITEMS_QUERY, data: { items: filteredItems } })
  };

  render() {
    const { id, children } = this.props
    return (
      <Mutation
        mutation={DELETE_ITEM_MUTATION}
        variables={{ id }}
        update={this.update}
      >
        {(deleteItem, { error }) => (
          <button
            type="submit"
            onClick={() => {
              if (confirm('Are you sure')) {
                deleteItem()
              }
            }}
          >{children}
          </button>
        )}

      </Mutation>
    )
  }
}

DeleteItem.propTypes = {
  id: PropTypes.string.isRequired,
  children: PropTypes.string.isRequired,
}

export default DeleteItem
