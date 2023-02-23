import React from 'react'
import { images } from '../../constants'
import './Header.css'

const Header = () => {
  return (
    <div>
      <img id='billio-logo' src={images.billio} alt='Billio logo'/>
    </div>
  )
}

export default Header