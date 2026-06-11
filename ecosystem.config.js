module.exports = {
  apps: [
    {
      name: "speakup",
      script: "node_modules/.bin/next",
      args: "start",
      cwd: "/media/soares/Soares/luiz/interface",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
};
