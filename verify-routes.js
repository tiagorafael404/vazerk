const fs = require("fs");
const items = JSON.parse(fs.readFileSync("items.json", "utf8"));
const failures = [];
for (const item of items) {
  const expectedBuy = `payment.html?item=${item.id}`;
  if (String(item.buy || "") !== expectedBuy) {
    failures.push({ item: item.id, expected: expectedBuy, actual: String(item.buy || "") });
  }
  if (item.select && Array.isArray(item.select.options)) {
    for (const option of item.select.options) {
      const expectedOption = `payment.html?item=${item.id}&option=${option.id}`;
      if (String(option.url || "") !== expectedOption) {
        failures.push({ item: item.id, option: option.id, expected: expectedOption, actual: String(option.url || "") });
      }
    }
  }
}
if (failures.length) {
  console.log(JSON.stringify(failures, null, 2));
  process.exit(1);
}
console.log("OK: all item and option URLs point to correct payment.html routes");
