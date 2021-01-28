const GitRevisionPlugin = require("git-revision-webpack-plugin");
const gitRevisionPlugin = new GitRevisionPlugin();

module.exports = () => ({
  env: {
    GIT_REVISION: gitRevisionPlugin.version(),
  },
});
