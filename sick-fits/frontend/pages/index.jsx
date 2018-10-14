import React from 'react'
import Link from 'next/link'

const Home = () => (
  <div>
    <p>Hello</p>
    <Link href="/sell">
      <p>Sell</p>
    </Link>
  </div>
)

export default Home
