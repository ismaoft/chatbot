function nextState({ stack, incoming }) {
  const id = incoming.toLowerCase();

  if (id === 'saludo') {
    return { action: 'IGNORE' }; // 🔐 Nunca lo metas al stack
  }

  const MENU_KEYS = ['home', 'menu', 'inicio', 'principal'];

  if (MENU_KEYS.includes(id)) {
    stack.length = 0;
    return { action: 'HOME', dest: null };
  }


  if (id === 'volver') {
    stack.pop();
    return { action: 'BACK', dest: stack.at(-1) || null };
  }

  if (stack.at(-1) !== id) {
    stack.push(id);
    if (stack.length > 25) stack.shift();
    return { action: 'PUSH', dest: id };
  }

  return { action: 'IGNORE' };
}

module.exports = { nextState };
