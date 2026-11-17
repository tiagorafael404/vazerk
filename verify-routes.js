const fs = require("fs");
const items = JSON.parse(fs.readFileSync("items.json", "utf8"));
const failures = [];

for (const item of items) {
  const expectedUrl = `item.html?item=${item.id}`;
  if (String(item.url || "") !== expectedUrl) {
    failures.push({ item: item.id, expected: expectedUrl, actual: String(item.url || "") });
  }

  if (item.select && Array.isArray(item.select.options)) {
    for (const option of item.select.options) {
      if (option.id === undefined || !option.name) {
        failures.push({ item: item.id, option, error: "Option must have an id and name" });
      }
    }
  }
}
if (failures.length) {
  console.log(JSON.stringify(failures, null, 2));
  process.exit(1);
}
console.log("OK: products have valid item routes and option identifiers");
