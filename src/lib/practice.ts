/** Order of questions the user is currently practising (set by the list screen). */
let queue: string[] = [];

export const setPracticeQueue = (ids: string[]) => {
  queue = ids;
};

export const getPracticeQueue = () => queue;
