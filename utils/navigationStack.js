exports.pushIntent = (stack, intent) => {
  if (intent && stack.at(-1) !== intent) stack.push(intent);
  return stack;
};

exports.goBack = (stack) => {
  if (stack.length) stack.pop();
  return stack.at(-1) || null;
};
