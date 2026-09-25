import {createSlice, PayloadAction} from '@reduxjs/toolkit';

export const DEFAULT_CATEGORIES = [
  'Home',
  'Work',
  'Shopping',
  'Hobby',
  'Other',
];

export interface CategoriesState {
  items: string[];
}

const initialState: CategoriesState = {
  items: DEFAULT_CATEGORIES,
};

export const categoriesSlice = createSlice({
  name: 'categories',
  initialState,
  reducers: {
    addCategory: (state, action: PayloadAction<string>) => {
      const trimmed = action.payload.trim();
      if (trimmed && !state.items.includes(trimmed)) {
        state.items.push(trimmed);
      }
    },
    updateCategory: (
      state,
      action: PayloadAction<{oldName: string; newName: string}>,
    ) => {
      const {oldName, newName} = action.payload;
      const trimmedNew = newName.trim();
      const index = state.items.indexOf(oldName);
      if (index !== -1 && trimmedNew) {
        state.items[index] = trimmedNew;
      }
    },
    removeCategory: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(item => item !== action.payload);
    },
    resetCategories: state => {
      state.items = DEFAULT_CATEGORIES;
    },
  },
});

export const {addCategory, updateCategory, removeCategory, resetCategories} =
  categoriesSlice.actions;

export default categoriesSlice.reducer;
