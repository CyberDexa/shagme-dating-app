const path = require('path');
const { getDefaultConfig } = require('@expo/webpack-config');

module.exports = async function(env, argv) {
  const config = await getDefaultConfig(env, argv);
  
  // Override problematic parser settings
  config.module.rules = config.module.rules.map(rule => {
    if (rule.use && Array.isArray(rule.use)) {
      return {
        ...rule,
        use: rule.use.map(use => {
          if (use.loader && use.loader.includes('sucrase')) {
            return {
              ...use,
              options: {
                ...use.options,
                transforms: ['typescript', 'jsx'],
                disableESTransforms: true
              }
            };
          }
          return use;
        })
      };
    }
    return rule;
  });

  return config;
};
