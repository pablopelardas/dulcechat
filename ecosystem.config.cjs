module.exports = {
  apps: [
    {
      name: 'dulcechat',
      script: 'tsx',
      args: 'src/index.ts',
      interpreter: 'none',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
    },
  ],
};
