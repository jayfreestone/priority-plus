workflow "Build & Test" {
  resolves = ["bartlett705/npm-cy@f69478046d80aef1be0e17582c189a59bbfc9aa1"]
  on = "push"
}

action "Build" {
  uses = "actions/npm@59b64a598378f31e49cb76f27d6f3312b582f680"
  args = "install"
}

action "bartlett705/npm-cy@f69478046d80aef1be0e17582c189a59bbfc9aa1" {
  uses = "bartlett705/npm-cy@f69478046d80aef1be0e17582c189a59bbfc9aa1"
  needs = ["Build"]
  args = "run test:ci"
}
