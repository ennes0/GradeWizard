const express = require('express');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const app = express();
const port = 3000;

// Function to check the status of all files in the directory
function checkFilesStatus(dir) {
  fs.readdir(dir, (err, files) => {
    if (err) {
      console.error(`Error reading directory ${dir}:`, err);
      return;
    }

    files.forEach(file => {
      const filePath = path.join(dir, file);
      fs.stat(filePath, (err, stats) => {
        if (err) {
          console.error(`Error getting stats of file ${filePath}:`, err);
          return;
        }

        if (stats.isDirectory()) {
          checkFilesStatus(filePath); // Recursively check subdirectories
        } else {
          console.log(`File: ${filePath} - Size: ${stats.size} bytes`);
        }
      });
    });
  });
}

// Function to update package versions
function updatePackages(packages) {
  packages.forEach(pkg => {
    exec(`npm install ${pkg}`, (err, stdout, stderr) => {
      if (err) {
        console.error(`Error updating package ${pkg}:`, err);
        return;
      }
      console.log(`Package ${pkg} updated successfully.`);
      console.log(stdout);
      console.error(stderr);
    });
  });
}

// Route to check the status of all files
app.get('/check-files', (req, res) => {
  try {
    checkFilesStatus(__dirname);
    res.send('File status check initiated. Check the console for details.');
  } catch (error) {
    console.error('Error checking files:', error);
    res.status(500).send('An error occurred while checking files.');
  }
});

// Route to update package versions
app.get('/update-packages', (req, res) => {
  const packagesToUpdate = [
    'react-native-svg@15.8.0'
  ];
  try {
    updatePackages(packagesToUpdate);
    res.send('Package update initiated. Check the console for details.');
  } catch (error) {
    console.error('Error updating packages:', error);
    res.status(500).send('An error occurred while updating packages.');
  }
});

// Default route
app.get('/', (req, res) => {
  res.send('Welcome to WhatsMyGrade!');
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
