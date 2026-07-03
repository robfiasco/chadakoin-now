/** @type {import('@bacons/apple-targets').AppleTargetConfig} */
module.exports = {
  type: "widget",
  name: "ChadakoinWidget",
  bundleId: "com.chadakoinnow.widget",
  deploymentTarget: "17.0",
  entitlements: {
    "com.apple.security.application-groups": ["group.com.chadakoindigital.chadakoinnow"],
  },
};
