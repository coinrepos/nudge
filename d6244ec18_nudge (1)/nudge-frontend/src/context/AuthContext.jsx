import React from 'react'

export const AuthContext = React.createContext({
  user: null,
  accessToken: null,
  login: async () => {},
  logout: () => {},
  register: async () => {},
})
