
const fs = require('fs');
const PG = [
  ["limit", "int", 0, "Maximum results per page."],
  ["offset", "int", 0, "Results to skip, for paging."]
];
function g(name, anchor, blurb, tools) { return { name, anchor, blurb, tools }; }
function t(name, desc, params, exampleOverride) { return { name, desc, params: params || [], exampleOverride }; }
const CATALOG = fs.readFileSync('/Users/me3n/WebstormProjects/freedcamp-mcp/freedcamp-mcp-website/_design_ref/catalog-src.txt', 'utf8');
const catalog = eval(CATALOG);
console.log(JSON.stringify(catalog, null, 0));
