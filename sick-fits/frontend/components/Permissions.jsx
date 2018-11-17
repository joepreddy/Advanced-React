import React, { Component } from 'react'
import { Query, Mutation } from 'react-apollo'
import gql from 'graphql-tag'
import PropTypes from 'prop-types'
import Error from './ErrorMessage'
import Table from './styles/Table'
import SickButton from './styles/SickButton'

const possiblePermissions = [
  'ADMIN',
  'USER',
  'ITEMCREATE',
  'ITEMUPDATE',
  'ITEMDELETE',
  'PERMISSIONUPDATE',
]

const UPDATE_PERMISSIONS_MUTATION = gql`
  mutation updatePermission($permissions: [Permission], $userId: ID!) {
    updatePermissions(permissions: $permissions, userId: $userId) {
      id
      permissions
      name
      email
    }
  }
`

const ALL_USERS_QUERY = gql`
  query {
    users {
      id
      name
      email
      permissions
    }
  }
`

const Permissions = props => (
  <Query query={ALL_USERS_QUERY}>
    {({ data, loading, error }) => (
      <div>
        <Error error={error} />
        <div>
          <h1>Manage Permissions</h1>
          <Table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                {possiblePermissions.map(perm => <th key={perm}>{perm}</th>)}
                <th>Update</th>
              </tr>
            </thead>
            <tbody>
              {data.users.map(user => <UserPermissions user={user} key={user.id} />)}
            </tbody>
          </Table>
        </div>
      </div>
    )}
  </Query>
)

class UserPermissions extends Component {
  state = {
    permissions: this.props.user.permissions,
  }

  handleChange = (e) => {
    const { permissions } = this.state
    const checkbox = e.target
    let updatedPermissions = [...permissions]
    if (checkbox.checked) {
      updatedPermissions.push(checkbox.value)
    } else {
      updatedPermissions = updatedPermissions.filter(perm => perm !== checkbox.value)
    }
    this.setState({ permissions: updatedPermissions })
  }

  render() {
    const { user } = this.props
    const { permissions } = this.state
    return (
      <Mutation
        mutation={UPDATE_PERMISSIONS_MUTATION}
        variables={{
          permissions: this.state.permissions,
          userId: user.id,
        }}
      >
        {(updatePermissions, { loading, error }) => (
          <>
            { error && <tr><td colSpan="9"><Error error={error} /></td></tr>}
            <tr>
              <td>{user.name}</td>
              <td>{user.email}</td>
              {possiblePermissions.map(perm => (
                <td key={`${user.id}-permission-${perm}`}>
                  <label htmlFor={`${user.id}-permission-${perm}`}>
                    <input
                      id={`${user.id}-permission-${perm}`}
                      type="checkbox"
                      checked={permissions.includes(perm)}
                      value={perm}
                      onChange={this.handleChange}
                    />
                  </label>
                </td>
              ))}
              <td><SickButton type="button" disabled={loading} onClick={updatePermissions}>Updat{loading ? 'ing' : 'e'}</SickButton></td>
            </tr>
          </>
        )}
      </Mutation>
    )
  }
}


UserPermissions.propTypes = {
  user: PropTypes.shape({
    name: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
    id: PropTypes.string.isRequired,
    permissions: PropTypes.array.isRequired,
  }).isRequired,
}

export default Permissions
