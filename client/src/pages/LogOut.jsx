import React, {useEffect, useContext} from 'react'

import { UserContext } from '../context/userContext'
import { useNavigate } from 'react-router-dom'

const LogOut = () => {
  const {setCurrentUser} = useContext(UserContext)
  const navigate = useNavigate();

  setCurrentUser(null);
  navigate('/login')
  return (
    <></>
  )
}

export default LogOut