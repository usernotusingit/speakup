module.exports = {
  apps: [
    {
      name: "speakup",
      script: "node_modules/.bin/next",
      args: "start",
      cwd: "/root/.prod/speakup",
      env: {
        NODE_ENV: "production",
        PORT: 3001,
      },
    },
  ],
};
