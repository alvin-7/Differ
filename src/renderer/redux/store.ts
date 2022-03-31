import { configureStore } from '@reduxjs/toolkit'
import counterSliceReducer from './counter/counterSlice'
import setterReducer from './setter/layoutSetter'

const store = configureStore({
  reducer: {
    counter: counterSliceReducer,
    setter: setterReducer
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
export default store
