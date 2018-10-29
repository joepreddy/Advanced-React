import React from 'react'
import CreateItem from '../components/CreateItem'
import SignInPrompt from '../components/SignInPrompt'

const Sell = () => (
  <div>
    <SignInPrompt>
      <CreateItem />
    </SignInPrompt>
  </div>
)

export default Sell
