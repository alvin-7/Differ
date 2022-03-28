import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '../store'

// Define a type for the slice state
interface CounterState {
  value: number
}

// Define the initial state using that type
const initialState: CounterState = {
  value: null,
}

export const layoutSetter = createSlice({
  name: 'layoutSetter',
  // `createSlice` will infer the state type from the `initialState` argument
  initialState,
  reducers: {
    setterLayout: (state, action: PayloadAction<number>) => {
      state.value = action.payload
    },
  },
})

export const { setterLayout } = layoutSetter.actions

// Other code such as selectors can use the imported `RootState` type
export const selectCount = (state: RootState) => state.counter.value

export default layoutSetter.reducer