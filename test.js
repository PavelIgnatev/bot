const { getDialogues } = require("./db/dialogues");
(async () => {
  console.log(await getDialogues(11075642700));
})()