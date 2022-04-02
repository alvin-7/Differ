import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';

// Define a type for the slice state
interface SetterState {
  sheets: string[];
  sheet: string;
  diffIdx: number;
  diffKeys: number[];
}

// Define the initial state using that type
const initialState: SetterState = {
  sheets: [],
  sheet: '',
  diffIdx: -1,
  diffKeys: [],
};

export const layoutSetter = createSlice({
  name: 'layoutSetter',
  // `createSlice` will infer the state type from the `initialState` argument
  initialState,
  reducers: {
    setSheets: (state, action: PayloadAction<string[]>) => {
      state.sheets = action.payload;
    },
    setSheet: (state, action: PayloadAction<string>) => {
      state.sheet = action.payload;
    },
    setDiffIdx: (state, action: PayloadAction<number>) => {
      state.diffIdx = action.payload;
    },
    setDiffKeys: (state, action: PayloadAction<number[]>) => {
      state.diffKeys = action.payload;
    },
  },
});

export const { setSheets, setSheet, setDiffIdx, setDiffKeys } =
  layoutSetter.actions;

// Other code such as selectors can use the imported `RootState` type
export const selectSheets = (state: RootState) => state.setter.sheets;
export const selectSheet = (state: RootState) => state.setter.sheet;
export const selectDiffIdx = (state: RootState) => state.setter.diffIdx;
export const selectDiffKeys = (state: RootState) => state.setter.diffKeys;

export default layoutSetter.reducer;
