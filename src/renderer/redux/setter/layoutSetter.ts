import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '../store'

// Define a type for the slice state
interface SetterState {
  sheets: string[]
  sheet: string,
  diffIdx: number,
  diffLen: number
}

// Define the initial state using that type
const initialState: SetterState = {
  sheets: [],
  sheet: '',
  diffIdx: -1,
  diffLen: 0
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
    setDiffIdx: (state, action: PayloadAction<number>) => {
      state.diffIdx = action.payload
    },
    setDiffLen: (state, action: PayloadAction<number>) => {
      state.diffLen = action.payload
    }
  },
})

export const { setSheets, setSheet, setDiffIdx, setDiffLen } = layoutSetter.actions

// Other code such as selectors can use the imported `RootState` type
export const selectSheets = (state: RootState) => state.setter.sheets
export const selectSheet = (state: RootState) => state.setter.sheet
export const selectDiffIdx = (state: RootState) => state.setter.diffIdx
export const selectDiffLen = (state: RootState) => state.setter.diffLen

export default layoutSetter.reducer