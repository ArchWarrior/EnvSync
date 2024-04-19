const express = require("express");
const app = express();
const { engine } = require("express-handlebars");
const readXlsxFile = require("read-excel-file/node");
const bodyParser = require("body-parser");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
// const fetch = require('node-fetch');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.engine("handlebars", engine({ defaultLayout: null }));
app.set("view engine", "handlebars");
app.set("views", "./views");

app.get("/", (req, res) => {
  res.render("home");
});



app.post('/upload', upload.single('file'), async (req, res) => {
  let qaRows = await readXlsxFile(req.file.path, { sheet: 1 });
  let stressRows = await readXlsxFile(req.file.path, { sheet: 2 });

  // Find the indices of the service name and build number columns in the QA sheet
  let qaServiceIndex = qaRows[0].findIndex(header => header === 'service');
  let qaBuildIndex = qaRows[0].findIndex(header => header === 'build');

  // Find the indices of the service name and build number columns in the stress sheet
  let stressServiceIndex = stressRows[0].findIndex(header => header === 'service');
  let stressBuildIndex = stressRows[0].findIndex(header => header === 'build');

  // Remove the header row
  qaRows = qaRows.slice(1);
  stressRows = stressRows.slice(1);

  // Create a map of service names to build numbers for the stress sheet
  let stressMap = new Map();
  stressRows.forEach(row => {
      stressMap.set(row[stressServiceIndex], row[stressBuildIndex]);
  });

  let data = qaRows.map(row => {
      let qaService = row[qaServiceIndex];
      let qaBuild = row[qaBuildIndex];
      let stressBuild = stressMap.get(qaService) || 'N/A';
      return {
          service: qaService,
          qaBuild: qaBuild,
          stressBuild: stressBuild,
          differentBuilds: qaBuild !== stressBuild
      };
  });

  data = data.filter(row => row.differentBuilds);
  res.render('data', { data: data });
});

// ... rest of your code ...


app.post('/api_endpoint', async (req, res) => {
  const service = req.body.service;
  console.log(service);

  // Call the external API
  const response = await fetch('https://catfact.ninja/fact');
  const data = await response.json();

  // Log the response
  console.log(data);

  // Send a response back to the client
  if (response.status === 200) {
      res.json({ success: true });
  } else {
      res.json({ success: false });
  }
});

app.listen(3000, () => console.log("Server started on port 3000"));
