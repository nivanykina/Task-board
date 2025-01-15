import { createReducer, on, Action } from '@ngrx/store';
import { setLanguage } from '../actions/language.actions';

export const initialState: string = 'ru';

const _languageReducer = createReducer(
  initialState,
  on(setLanguage, (state, { language }) => language),
);

export function languageReducer(state: string | undefined, action: Action) {
  return _languageReducer(state, action);
}
