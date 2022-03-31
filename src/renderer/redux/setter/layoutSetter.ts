import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '../store'

// Define a type for the slice state
interface SetterState {
  sheets: string[]
  sheet: string
}

// Define the initial state using that type
const initialState: SetterState = {
  sheets: [],
  sheet: '',
}

export const layoutSetter = createSlice({
  name: 'layoutSetter',
  // `createSlice` will infer the state type from the `initialState` argument
  initialState,
  reducers: {
    setSheets: (state, action: PayloadAction<string[]>) => {
      state.sheets = action.payload
    },
    setSheet: (state, action: PayloadAction<string>) => {
      state.sheet = action.payload
    },
  },
})

export const { setSheets, setSheet } = layoutSetter.actions

// Other code such as selectors can use the imported `RootState` type
export const selectSheets = (state: RootState) => state.setter.sheets
export const selectSheet = (state: RootState) => state.setter.sheet

export default layoutSetter.reducer