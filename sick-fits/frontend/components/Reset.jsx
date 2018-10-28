import React, { Component } from 'react'
import { Mutation } from 'react-apollo'
import PropTypes from 'prop-types'
import gql from 'graphql-tag'
import Form from './styles/Form'
import Error from './ErrorMessage'
import { CURRENT_USER_QUERY } from './User'

const RESET_MUTATION = gql`
  mutation RESET_MUTATION(
    $resetToken: String!,
    $password: String!,
    $confirmPassword: String!
    ) {
      resetPassword(
        resetToken: $resetToken,
        password: $password,
        confirmPassword: $confirmPassword
      ) {
        id
        email
        name
      }
    }
`

class Reset extends Component {
  state = {
    password: '',
    confirmPassword: '',
  }

  handleChange = (e) => {
    this.setState({ [e.target.name]: e.target.value })
  }

  render() {
    const { password, confirmPassword } = this.state
    const { resetToken } = this.props
    return (
      <Mutation
        mutation={RESET_MUTATION}
        variables={{
          resetToken,
          ...this.state,
        }}
        refetchQueries={[{ query: CURRENT_USER_QUERY }]}
      >
        {(reset, { error, loading }) => (
          <Form
            method="post"
            onSubmit={ async (e) => {
              e.preventDefault()
              await reset()
              this.setState({ password: '', confirmPassword: '' })
            }}
          >
            <fieldset disabled={loading} aria-busy={loading}>
              <h2>Reset Your Password</h2>
              <Error error={error} />
              <label htmlFor="password">
                Password
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={password}
                  onChange={this.handleChange}
                />
              </label>
              <label htmlFor="confirmPassword">
                Confirm Password
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={this.handleChange}
                />
              </label>
              <button type="submit">Reset</button>
            </fieldset>

          </Form>
        )}
      </Mutation>
    )
  }
}

Reset.propTypes = {
  resetToken: PropTypes.string.isRequired,
}

export default Reset
