module.exports = {
    apps: [
      {
        name: 'tmdt-fe-customer',
        script: 'node_modules/next/dist/bin/next',
        args: 'start -p 9005',
        env: {
          NODE_ENV: 'production',
        },
      },
    ],
  };