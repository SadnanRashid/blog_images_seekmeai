const data = require("./dd.json");
const axios = require("axios");
const fs = require("fs");
const ftp = require("ftp");
const path = require("path");

const updatedData = [];

async function changeLinks() {
  for (const item of data) {
    try {
      const imgLink = await downloadAndUploadToBunnyCDN(
        item.image,
        item.title.toLowerCase().replace(/\s/g, "_")
      );
      console.log("Updated link:", imgLink);
      item.image = imgLink;
      updatedData.push(item);
      addObjectToJSONFile(item);
    } catch (error) {
      console.error("An error occurred:", error);
      continue;
    }
  }

  const newFilePath = path.join(__dirname, "newData.json");
  fs.writeFile(newFilePath, JSON.stringify(updatedData, null, 2), (err) => {
    if (err) {
      console.error("Failed to write updated data:", err);
    } else {
      console.log("Updated data has been written to newData.json");
    }
  });
}

async function downloadAndUploadToBunnyCDN(imageName, imgName) {
  const ftpConfig = {
    host: "se.storage.bunnycdn.com",
    user: "seekme-tools",
    password: "1725533b-372e-49c1-a6b15ac34318-9847-455d",
    secure: true,
  };

  try {
    const localFilePath = path.join(__dirname, "images", `${imageName}`);

    // Connect to the FTP server
    const client = new ftp();

    return await new Promise((resolve, reject) => {
      client.on("ready", () => {
        const remotePath = `/blogs/${imageName}`;
        // Upload the image to BunnyCDN storage
        client.put(localFilePath, remotePath, (err) => {
          if (err) {
            reject(err);
          } else {
            // Generate the BunnyCDN link to the uploaded image
            const cdnLink = `https://seekme.b-cdn.net/blogs/${imageName}`;
            resolve(cdnLink);
            client.end();
          }
        });
      });

      client.on("error", (err) => {
        reject(err);
      });

      client.connect(ftpConfig);
    });
  } catch (error) {
    console.error("An error occurred:", error);
    throw error; // Re-throw the error to propagate it to the caller
  }
}

changeLinks();

const jsonDataFilePath = path.join(__dirname, "NewData2.json");

function addObjectToJSONFile(newObject) {
  // Read the existing JSON file
  fs.readFile(jsonDataFilePath, "utf8", (err, data) => {
    if (err) {
      console.error("Failed to read JSON file:", err);
      return;
    }

    try {
      // Parse the JSON content into a JavaScript object
      const jsonData = JSON.parse(data);

      // Add the new object to the array
      jsonData.push(newObject);

      // Write the updated array back to the JSON file
      fs.writeFile(
        jsonDataFilePath,
        JSON.stringify(jsonData, null, 2),
        (err) => {
          if (err) {
            console.error("Failed to write JSON file:", err);
            return;
          }

          console.log("Object added to JSON file successfully.");
        }
      );
    } catch (err) {
      console.error("Failed to parse JSON content:", err);
    }
  });
}
