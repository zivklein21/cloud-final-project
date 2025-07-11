module.exports = {
  apps : [{
    name   : "ReadThis-back",
    script : "./dist/src/app.js",
    env_production: {
      NODE_ENV: "production"
    }
  }]
}
