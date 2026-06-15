/** Whether Focus mode may advance after an attempt. */
export function shouldAllowContinue(strictFocus: boolean, correct: boolean): boolean {
  return !strictFocus || correct;
}
