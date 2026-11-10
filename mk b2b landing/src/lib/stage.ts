/** Preview shows TODO(client) markers; production hides them and the blocks they leave empty (SPEC §3.3, §6.11). */
export const isProduction = import.meta.env.PUBLIC_STAGE === 'production';

const MARK = 'TODO(client):';
export function splitTodo(value: string) {
  const i = value.indexOf(MARK);
  return i < 0 ? { text: value, todo: '' } : { text: value.slice(0, i).trim(), todo: value.slice(i + MARK.length).trim() };
}
export const shown = (value: string) => !isProduction || splitTodo(value).text !== '';
export const hasTodo = (value: string) => value.includes(MARK);
