import categoriesReducer, {
  addCategory,
  DEFAULT_CATEGORIES,
  removeCategory,
  resetCategories,
  updateCategory,
} from '../src/store/categoriesSlice';

describe('categoriesSlice', () => {
  test('has correct default categories', () => {
    const state = categoriesReducer(undefined, {type: 'INIT'});
    expect(state.items).toEqual(['Home', 'Work', 'Shopping', 'Hobby', 'Other']);
  });

  test('adds a new category', () => {
    const state = categoriesReducer(
      {items: ['Home', 'Work']},
      addCategory('Fitness'),
    );
    expect(state.items).toEqual(['Home', 'Work', 'Fitness']);
  });

  test('does not add duplicate or empty category', () => {
    let state = categoriesReducer(
      {items: ['Home', 'Work']},
      addCategory('Home'),
    );
    expect(state.items).toEqual(['Home', 'Work']);

    state = categoriesReducer(state, addCategory('   '));
    expect(state.items).toEqual(['Home', 'Work']);
  });

  test('updates category name', () => {
    const state = categoriesReducer(
      {items: ['Home', 'Work']},
      updateCategory({oldName: 'Work', newName: 'Office'}),
    );
    expect(state.items).toEqual(['Home', 'Office']);
  });

  test('removes category', () => {
    const state = categoriesReducer(
      {items: ['Home', 'Work', 'Shopping']},
      removeCategory('Work'),
    );
    expect(state.items).toEqual(['Home', 'Shopping']);
  });

  test('resets to default categories', () => {
    const state = categoriesReducer({items: ['Custom']}, resetCategories());
    expect(state.items).toEqual(DEFAULT_CATEGORIES);
  });
});
